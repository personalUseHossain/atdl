// worker/pubmed.js (Updated)
const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

const parser = new xml2js.Parser({ explicitArray: false });

class PubMedFetcher {
    constructor() {
        this.baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
        this.cacheDir = path.join(process.cwd(), 'data', 'papers_cache');
        this.pmcCacheDir = path.join(process.cwd(), 'data', 'pmc_cache');

        // Ensure cache directories exist
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        if (!fs.existsSync(this.pmcCacheDir)) {
            fs.mkdirSync(this.pmcCacheDir, { recursive: true });
        }
    }

    getCachePath(pmid) {
        return path.join(this.cacheDir, `${pmid}.json`);
    }

    getPMCCachePath(pmcId) {
        return path.join(this.pmcCacheDir, `${pmcId.replace('PMC', '')}.json`);
    }

    isCached(pmid) {
        return fs.existsSync(this.getCachePath(pmid));
    }

    getCachedPaper(pmid) {
        try {
            const cachePath = this.getCachePath(pmid);
            if (fs.existsSync(cachePath)) {
                return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
            }
        } catch (e) {
            console.error(`Error reading cache for ${pmid}:`, e);
        }
        return null;
    }

    cachePaper(pmid, paperData) {
        try {
            const cachePath = this.getCachePath(pmid);
            fs.writeFileSync(cachePath, JSON.stringify(paperData, null, 2));
        } catch (e) {
            console.error(`Error caching paper ${pmid}:`, e);
        }
    }

    async search(query, maxResults = 30) {
        const cacheKey = `search_${Buffer.from(query).toString('base64')}_${maxResults}`;
        const searchCachePath = path.join(this.cacheDir, `${cacheKey}.json`);

        // Check cache first
        if (fs.existsSync(searchCachePath)) {
            try {
                const cached = JSON.parse(fs.readFileSync(searchCachePath, 'utf8'));
                if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hour cache
                    console.log(`Using cached search results for: ${query}`);
                    return cached.data;
                }
            } catch (e) {
                console.error('Error reading search cache:', e);
            }
        }

        try {
            const url = `${this.baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
            const response = await axios.get(url);

            const result = {
                total: parseInt(response.data.esearchresult.count),
                ids: response.data.esearchresult.idlist || []
            };

            // Cache the search results
            fs.writeFileSync(searchCachePath, JSON.stringify({
                timestamp: Date.now(),
                query: query,
                data: result
            }, null, 2));

            return result;
        } catch (error) {
            console.error('PubMed search error:', error.message);
            throw error;
        }
    }

    async fetchPaper(pmid, forceRefresh = false) {
        // Check cache first
        if (!forceRefresh) {
            const cached = this.getCachedPaper(pmid);
            if (cached) {
                console.log(`Using cached paper: ${pmid}`);
                return cached;
            }
        }

        try {
            console.log(`Fetching paper: ${pmid}`);
            const url = `${this.baseUrl}/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml`;
            const response = await axios.get(url);
            const parsed = await parser.parseStringPromise(response.data);

            const article = parsed.PubmedArticleSet?.PubmedArticle?.MedlineCitation?.Article;
            if (!article) {
                throw new Error(`No article data for PMID ${pmid}`);
            }

            // Extract basic info
            const paperData = {
                pmid: pmid,
                title: article.ArticleTitle || '',
                abstract: this.extractAbstract(article.Abstract),
                journal: article.Journal?.Title || '',
                year: article.Journal?.JournalIssue?.PubDate?.Year || 'Unknown',
                authors: this.extractAuthors(article.AuthorList),
                keywords: this.extractKeywords(parsed.PubmedArticleSet?.PubmedArticle?.MedlineCitation?.KeywordList),
                doi: this.extractDOI(parsed.PubmedArticleSet?.PubmedArticle?.PubmedData?.ArticleIdList),
                pmcId: this.extractPMCID(parsed.PubmedArticleSet?.PubmedArticle?.PubmedData?.ArticleIdList),
                meshTerms: this.extractMeshTerms(parsed.PubmedArticleSet?.PubmedArticle?.MedlineCitation?.MeshHeadingList),
                rawXml: response.data, // Store raw XML
                fetched_at: new Date().toISOString()
            };

            // Try to fetch full text if PMC ID available
            if (paperData.pmcId) {
                try {
                    const fullText = await this.fetchFullText(paperData.pmcId);
                    if (fullText) {
                        paperData.fullText = fullText.text;
                        paperData.fullTextType = fullText.type;
                        paperData.hasFullText = true;
                    }
                } catch (error) {
                    console.log(`Could not fetch full text for ${paperData.pmcId}:`, error.message);
                    paperData.hasFullText = false;
                }
            }

            // Cache the paper
            this.cachePaper(pmid, paperData);

            return paperData;

        } catch (error) {
            console.error(`Error fetching paper ${pmid}:`, error.message);

            // Cache error state to avoid repeated failures
            this.cachePaper(pmid, {
                pmid: pmid,
                error: error.message,
                failed_at: new Date().toISOString()
            });

            throw error;
        }
    }

    // Updated fetchFullText method in pubmed.js
    async fetchFullText(pmcId) {
        const cleanPmcId = pmcId.replace('PMC', '');
        const cachePath = this.getPMCCachePath(cleanPmcId);

        // Check cache first
        if (fs.existsSync(cachePath)) {
            try {
                const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
                // If we previously failed but have a new method, try again
                if (cached.success || cached.text) {
                    return cached;
                }
            } catch (e) {
                console.error(`Error reading PMC cache for ${cleanPmcId}:`, e);
            }
        }

        console.log(`Fetching full text for PMC${cleanPmcId}`);

        // Try multiple methods in order
        let fullText = null;

        // Method 1: Try direct PMC XML
        fullText = await this.tryDirectPMCXML(cleanPmcId);

        // Method 2: Try eFetch API
        if (!fullText || !fullText.success) {
            fullText = await this.tryEFetchPMC(cleanPmcId);
        }

        // Method 3: Try JATS XML
        if (!fullText || !fullText.success) {
            fullText = await this.tryJATSXML(cleanPmcId);
        }

        // Method 4: Try OA Package (your FTP link)
        if (!fullText || !fullText.success) {
            fullText = await this.tryOAPackage(cleanPmcId);
        }

        if (fullText && fullText.success) {
            // Cache the result
            fs.writeFileSync(cachePath, JSON.stringify(fullText, null, 2));
            return fullText;
        }

        // Cache failure
        const failureResult = {
            error: 'All methods failed',
            tried_at: new Date().toISOString(),
            success: false
        };
        fs.writeFileSync(cachePath, JSON.stringify(failureResult, null, 2));

        return null;
    }

    async tryDirectPMCXML(pmcId) {
        try {
            // Try direct PMC XML endpoint
            const url = `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/xml/`;
            console.log(`Trying direct PMC XML: ${url}`);

            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)',
                    'Accept': 'application/xml'
                }
            });

            if (response.data && response.data.includes('<article ')) {
                const text = this.extractTextFromJATSXML(response.data);
                if (text && text.length > 1000) {
                    return {
                        text: text.substring(0, 20000), // Limit to 20k chars
                        type: 'pmc_xml_direct',
                        success: true,
                        length: text.length,
                        url: url
                    };
                }
            }

            return null;
        } catch (error) {
            console.log(`Direct PMC XML failed for PMC${pmcId}:`, error.message);
            return null;
        }
    }

    async tryEFetchPMC(pmcId) {
        try {
            // Use eFetch API
            const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=${pmcId}&retmode=xml`;
            console.log(`Trying eFetch PMC: ${url}`);

            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)'
                }
            });

            if (response.data && response.data.includes('<article ')) {
                const text = this.extractTextFromJATSXML(response.data);
                if (text && text.length > 1000) {
                    return {
                        text: text.substring(0, 20000),
                        type: 'pmc_efetch',
                        success: true,
                        length: text.length,
                        url: url
                    };
                }
            }

            return null;
        } catch (error) {
            console.log(`eFetch PMC failed for PMC${pmcId}:`, error.message);
            return null;
        }
    }

    async tryJATSXML(pmcId) {
        try {
            // Try JATS XML endpoint
            const url = `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/pmc.xml`;
            console.log(`Trying JATS XML: ${url}`);

            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)',
                    'Accept': 'application/xml'
                }
            });

            if (response.data && response.data.includes('<article ')) {
                const text = this.extractTextFromJATSXML(response.data);
                if (text && text.length > 1000) {
                    return {
                        text: text.substring(0, 20000),
                        type: 'jats_xml',
                        success: true,
                        length: text.length,
                        url: url
                    };
                }
            }

            return null;
        } catch (error) {
            console.log(`JATS XML failed for PMC${pmcId}:`, error.message);
            return null;
        }
    }

    async tryOAPackage(pmcId) {
        try {
            // Try OA Package (what you found)
            const url = `https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi?id=PMC${pmcId}`;
            console.log(`Trying OA Package: ${url}`);

            const response = await axios.get(url, { timeout: 10000 });

            if (response.data.includes('<error>')) {
                return null;
            }

            // Parse OA response
            const oaParser = new xml2js.Parser();
            const parsed = await oaParser.parseStringPromise(response.data);

            if (parsed.records?.record?.link) {
                const link = parsed.records.record.link;
                const ftpUrl = link.$.href;

                // Convert FTP to HTTPS
                const httpsUrl = ftpUrl.replace('ftp://', 'https://');

                return {
                    text: `[Full text available via OA Package. Download: ${httpsUrl}]`,
                    type: 'oa_package',
                    url: httpsUrl,
                    success: true,
                    download_available: true,
                    note: 'Requires tar.gz extraction for full text'
                };
            }

            return null;
        } catch (error) {
            console.log(`OA Package failed for PMC${pmcId}:`, error.message);
            return null;
        }
    }

    // Improved text extraction from JATS XML
    async extractTextFromJATSXML(xml) {
        try {
            // Parse XML
            const parser = new xml2js.Parser({
                explicitArray: false,
                mergeAttrs: true,
                explicitRoot: false
            });

            const result = await parser.parseStringPromise(xml);

            let fullText = '';

            // Extract from different sections
            if (result.article && result.article.body) {
                const body = result.article.body;

                // Get abstract
                if (body.abstract && body.abstract.p) {
                    const abstractText = Array.isArray(body.abstract.p)
                        ? body.abstract.p.map(p => p._ || p).join(' ')
                        : body.abstract.p._ || body.abstract.p;
                    fullText += `ABSTRACT: ${abstractText}\n\n`;
                }

                // Get sections
                if (body.sec) {
                    const sections = Array.isArray(body.sec) ? body.sec : [body.sec];

                    sections.forEach(section => {
                        // Get title
                        if (section.title) {
                            fullText += `## ${section.title._ || section.title}\n`;
                        }

                        // Get paragraphs
                        if (section.p) {
                            const paragraphs = Array.isArray(section.p) ? section.p : [section.p];
                            paragraphs.forEach(p => {
                                fullText += (p._ || p) + '\n';
                            });
                        }

                        // Get subsections
                        if (section.sec) {
                            const subsections = Array.isArray(section.sec) ? section.sec : [section.sec];
                            subsections.forEach(subsection => {
                                if (subsection.title) {
                                    fullText += `### ${subsection.title._ || subsection.title}\n`;
                                }
                                if (subsection.p) {
                                    const subParagraphs = Array.isArray(subsection.p) ? subsection.p : [subsection.p];
                                    subParagraphs.forEach(p => {
                                        fullText += (p._ || p) + '\n';
                                    });
                                }
                            });
                        }

                        fullText += '\n';
                    });
                }
            }

            // Clean up
            fullText = fullText.replace(/\s+/g, ' ').trim();

            if (fullText.length > 500) {
                return fullText.substring(0, 30000); // Limit to 30k chars
            }

            return null;

        } catch (error) {
            console.error('Error extracting from JATS XML:', error.message);

            // Fallback: simple tag removal
            try {
                let text = xml.replace(/<[^>]*>/g, ' ');
                text = text.replace(/&\w+;/g, ' ');
                text = text.replace(/\s+/g, ' ').trim();
                text = text.substring(0, 25000);

                if (text.length > 1000) {
                    return text;
                }
            } catch (e) {
                return null;
            }

            return null;
        }
    }

    async tryPMCOA(pmcId) {
        try {
            const url = `https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi?id=PMC${pmcId}`;
            const response = await axios.get(url, { timeout: 10000 });

            if (response.data.includes('<error>')) {
                return null;
            }

            // Parse OA response to get download URL
            const oaParser = new xml2js.Parser();
            const parsed = await oaParser.parseStringPromise(response.data);

            if (parsed.records?.record?.link) {
                const links = Array.isArray(parsed.records.record.link)
                    ? parsed.records.record.link
                    : [parsed.records.record.link];

                // Look for PDF or XML link
                const pdfLink = links.find(l => l.$.format === 'pdf');
                const xmlLink = links.find(l => l.$.format === 'xml');

                if (pdfLink || xmlLink) {
                    const downloadUrl = (pdfLink || xmlLink).$.href;
                    console.log(`Found full text at: ${downloadUrl}`);

                    // Try to download (simplified - in reality would need to parse PDF/XML)
                    return {
                        text: `[Full text available at: ${downloadUrl}]`,
                        type: pdfLink ? 'pdf' : 'xml',
                        url: downloadUrl,
                        success: true
                    };
                }
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    async tryPMCXML(pmcId) {
        try {
            // Try to get abstract-like text from PMC
            const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=${pmcId}&retmode=xml`;
            const response = await axios.get(url, { timeout: 10000 });

            // Extract text from XML (simplified)
            const text = this.extractTextFromPMCXML(response.data);

            if (text && text.length > 1000) {
                return {
                    text: text.substring(0, 15000), // Limit to 15k chars
                    type: 'pmc_xml',
                    success: true,
                    length: text.length
                };
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    extractTextFromPMCXML(xml) {
        try {
            // Simple extraction - remove tags, keep text
            let text = xml.replace(/<[^>]*>/g, ' ');
            text = text.replace(/\s+/g, ' ');
            text = text.substring(0, 20000); // Safety limit

            return text.trim();
        } catch (error) {
            return null;
        }
    }

    extractAbstract(abstractData) {
        if (!abstractData || !abstractData.AbstractText) return '';

        if (typeof abstractData.AbstractText === 'string') {
            return abstractData.AbstractText;
        }

        if (Array.isArray(abstractData.AbstractText)) {
            return abstractData.AbstractText.map(text =>
                typeof text === 'string' ? text : text._
            ).join(' ');
        }

        return '';
    }

    extractAuthors(authorList) {
        if (!authorList || !authorList.Author) return [];

        const authors = Array.isArray(authorList.Author) ? authorList.Author : [authorList.Author];

        return authors.map(author => ({
            lastName: author.LastName || '',
            foreName: author.ForeName || '',
            initials: author.Initials || '',
            affiliation: author.AffiliationInfo?.[0]?.Affiliation || ''
        }));
    }

    extractKeywords(keywordList) {
        if (!keywordList || !keywordList.Keyword) return [];

        const keywords = Array.isArray(keywordList.Keyword) ? keywordList.Keyword : [keywordList.Keyword];
        return keywords.map(kw => kw._ || kw);
    }

    extractMeshTerms(meshHeadingList) {
        if (!meshHeadingList || !meshHeadingList.MeshHeading) return [];

        const terms = Array.isArray(meshHeadingList.MeshHeading)
            ? meshHeadingList.MeshHeading
            : [meshHeadingList.MeshHeading];

        return terms.map(term => ({
            descriptor: term.DescriptorName?._ || term.DescriptorName,
            qualifiers: term.QualifierName
                ? (Array.isArray(term.QualifierName)
                    ? term.QualifierName.map(q => q._ || q)
                    : [term.QualifierName._ || term.QualifierName])
                : []
        }));
    }

    extractDOI(articleIdList) {
        if (!articleIdList || !articleIdList.ArticleId) return null;

        const ids = Array.isArray(articleIdList.ArticleId) ? articleIdList.ArticleId : [articleIdList.ArticleId];
        const doi = ids.find(id => id.$.IdType === 'doi');

        return doi ? doi._ : null;
    }

    extractPMCID(articleIdList) {
        if (!articleIdList || !articleIdList.ArticleId) return null;

        const ids = Array.isArray(articleIdList.ArticleId) ? articleIdList.ArticleId : [articleIdList.ArticleId];
        const pmc = ids.find(id => id.$.IdType === 'pmc' || id.$.IdType === 'pmcid');

        return pmc ? pmc._ : null;
    }

    async fetchMultiplePapers(pmids, onProgress = null, forceRefresh = false) {
        const papers = [];

        for (let i = 0; i < pmids.length; i++) {
            const pmid = pmids[i];

            try {
                await this.delay(350); // Rate limiting

                const paper = await this.fetchPaper(pmid, forceRefresh);

                if (paper && !paper.error) {
                    papers.push(paper);
                }

                if (onProgress) {
                    onProgress(Math.round(((i + 1) / pmids.length) * 100), `Fetched paper ${i + 1}/${pmids.length}`);
                }
            } catch (error) {
                console.error(`Failed to fetch PMID ${pmid}:`, error.message);
            }
        }

        return papers;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get statistics about cached papers
    getCacheStats() {
        try {
            if (!fs.existsSync(this.cacheDir)) {
                return { total: 0, withFullText: 0 };
            }

            const files = fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json'));
            let withFullText = 0;

            files.forEach(file => {
                try {
                    const data = JSON.parse(fs.readFileSync(path.join(this.cacheDir, file), 'utf8'));
                    if (data.hasFullText) withFullText++;
                } catch (e) {
                    // Skip corrupted files
                }
            });

            return {
                total: files.length,
                withFullText: withFullText,
                withAbstractOnly: files.length - withFullText
            };
        } catch (error) {
            return { total: 0, withFullText: 0, error: error.message };
        }
    }
}

module.exports = PubMedFetcher;