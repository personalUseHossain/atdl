// worker/extractor.js (Updated)
const axios = require('axios');

class AIExtractor {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY;
        this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    }

    async extractConnections(paper) {
        if (!this.apiKey) {
            console.warn('No DeepSeek API key provided, using mock data');
            return this.generateMockConnections(paper);
        }

        const hasFullText = paper.hasFullText && paper.fullText && paper.fullText.length > 1000;
        
        const systemPrompt = `You are a biomedical research extraction assistant. Extract drug/compound to health issue connections from the research paper.

EXTRACTION PRIORITY:
1. Use FULL TEXT if available (marked with ⭐) - contains detailed methods, results, discussions
2. Otherwise use ABSTRACT only - limited to summary information

For each connection, assess confidence based on:
- High: Clear evidence in full text with dosage, duration, statistical significance
- Medium: Mentioned in abstract or limited details in full text
- Low: Indirect mention or speculative

Return ONLY valid JSON array.`;

        let prompt;
        
        if (hasFullText) {
            prompt = `⭐ FULL TEXT AVAILABLE - Extract from detailed paper content:

TITLE: ${paper.title}

ABSTRACT: ${paper.abstract || 'Not available'}

FULL TEXT EXCERPT (first 8000 chars):
${paper.fullText.substring(0, 8000)}...

IMPORTANT: The full text contains detailed methods, results, and discussions.
Look for specific dosages, durations, statistical significance (p-values), sample sizes.

Extract ALL drug/compound to health issue connections you can find.`;
        } else {
            prompt = `ABSTRACT ONLY - Extract from paper summary:

TITLE: ${paper.title}
ABSTRACT: ${paper.abstract || 'Not available'}

NOTE: Abstract only provides summary information.
Confidence scores may be lower due to limited details.`;
        }

        const formatPrompt = `
Return JSON array with this exact format:
[
  {
    "drug": "exact drug/compound name",
    "health_issue": "specific health issue, biomarker, or effect",
    "relationship": "positive/negative/neutral/inconclusive",
    "mechanism": "brief mechanism if mentioned",
    "study_type": "in vitro/in vivo/clinical/observational/meta-analysis/review",
    "model": "animal model, cell line, human population",
    "dose": "dosage if mentioned (e.g., 500mg/day)",
    "duration": "treatment duration if mentioned (e.g., 12 weeks)",
    "sample_size": "number of subjects if mentioned",
    "statistical_significance": "p-value or significance level if mentioned",
    "confidence": "High/Medium/Low based on evidence quality",
    "source_in_paper": "abstract_only/full_text_methods/full_text_results/full_text_discussion"
  }
]

Return ONLY the JSON array, no other text.`;

        const fullPrompt = `${prompt}\n\n${formatPrompt}`;

        try {
            const response = await axios.post(
                this.apiUrl,
                {
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: fullPrompt }
                    ],
                    temperature: 0.1,
                    max_tokens: 4000, // Increased for full text
                    response_format: { type: "json_object" }
                },
                {
                    headers: {
                        "Authorization": `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 30000 // 30 second timeout
                }
            );

            const content = response.data.choices[0].message.content;
            const cleaned = this.cleanJSONResponse(content);
            
            try {
                const connections = JSON.parse(cleaned);
                
                // Add paper metadata and source info
                return connections.map(conn => ({
                    ...conn,
                    paper_id: paper.pmid,
                    paper_title: paper.title,
                    paper_year: paper.year,
                    paper_journal: paper.journal,
                    paper_authors: paper.authors || [],
                    paper_doi: paper.doi,
                    paper_pmc_id: paper.pmcId,
                    has_full_text: hasFullText,
                    extracted_at: new Date().toISOString(),
                    extraction_source: hasFullText ? 'full_text' : 'abstract_only'
                }));
            } catch (parseError) {
                console.error('JSON parse error:', parseError.message);
                console.log('Raw response:', content.substring(0, 500));
                return this.generateMockConnections(paper, hasFullText);
            }
            
        } catch (error) {
            console.error('AI extraction error:', error.message);
            if (error.response) {
                console.error('API response:', error.response.status, error.response.data);
            }
            return this.generateMockConnections(paper, hasFullText);
        }
    }

    cleanJSONResponse(content) {
        let cleaned = content.trim();
        
        // Remove markdown code blocks
        cleaned = cleaned.replace(/```json\s*/g, '');
        cleaned = cleaned.replace(/```\s*/g, '');
        
        // Try to extract JSON array
        const jsonMatch = cleaned.match(/\[\s*{.*}\s*\]/s);
        if (jsonMatch) {
            return jsonMatch[0];
        }
        
        // Try to extract JSON object with array
        const objMatch = cleaned.match(/{\s*".*"\s*:\s*\[.*\]\s*}/s);
        if (objMatch) {
            try {
                const obj = JSON.parse(objMatch[0]);
                const firstKey = Object.keys(obj)[0];
                if (Array.isArray(obj[firstKey])) {
                    return JSON.stringify(obj[firstKey]);
                }
            } catch (e) {
                // Continue
            }
        }
        
        // Fallback: try to parse as is
        return cleaned;
    }

    generateMockConnections(paper, hasFullText = false) {
        const mockDrugs = ['Metformin', 'Rapamycin', 'Resveratrol', 'Vitamin D', 'Omega-3'];
        const mockHealthIssues = ['Longevity', 'Immune Function', 'Cognitive Decline', 'Bone Health', 'Cardiovascular Health'];
        
        const numConnections = hasFullText ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 2) + 1;
        const connections = [];
        
        for (let i = 0; i < numConnections; i++) {
            connections.push({
                drug: mockDrugs[Math.floor(Math.random() * mockDrugs.length)],
                health_issue: mockHealthIssues[Math.floor(Math.random() * mockHealthIssues.length)],
                relationship: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
                mechanism: hasFullText ? 'Detailed mechanism from full text analysis' : 'Limited mechanism from abstract',
                study_type: hasFullText ? 'clinical' : 'observational',
                model: hasFullText ? 'human, randomized controlled trial' : 'various models',
                dose: hasFullText ? '500mg/day' : null,
                duration: hasFullText ? '12 weeks' : null,
                sample_size: hasFullText ? 'n=100' : null,
                statistical_significance: hasFullText ? 'p<0.05' : null,
                confidence: hasFullText ? 'High' : 'Medium',
                source_in_paper: hasFullText ? 'full_text_results' : 'abstract_only',
                paper_id: paper.pmid,
                paper_title: paper.title,
                paper_year: paper.year,
                paper_journal: paper.journal,
                has_full_text: hasFullText,
                extracted_at: new Date().toISOString(),
                extraction_source: hasFullText ? 'full_text' : 'abstract_only',
                is_mock: true // Mark as mock data
            });
        }
        
        return connections;
    }
}

module.exports = AIExtractor;