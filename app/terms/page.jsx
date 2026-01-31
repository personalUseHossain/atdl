'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Scale, AlertCircle, Shield, UserCheck, Terminal } from 'lucide-react';

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState('agreement');

  const sections = [
    { id: 'agreement', title: 'Agreement' },
    { id: 'account', title: 'Account Terms' },
    { id: 'use', title: 'Acceptable Use' },
    { id: 'ip', title: 'Intellectual Property' },
    { id: 'data', title: 'Data & Privacy' },
    { id: 'liability', title: 'Liability' },
    { id: 'termination', title: 'Termination' },
    { id: 'governing', title: 'Governing Law' },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-6">
              <Scale className="h-8 w-8 text-gray-700" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="mt-2 text-gray-500">
              Please read these terms carefully before using our platform
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4">
            <div className="sticky top-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contents</h3>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id);
                        document.getElementById(section.id)?.scrollIntoView({
                          behavior: 'smooth'
                        });
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        activeSection === section.id
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Points</h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <UserCheck className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Must be 18+ to use</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Shield className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Academic/research use only</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Terminal className="h-4 w-4 mr-2 text-gray-400" />
                      <span>No automated access</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              {/* Agreement */}
              <section id="agreement" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 mb-4">
                    By accessing or using the ATDL Research platform ("Service"), you agree to be 
                    bound by these Terms of Service ("Terms"). If you disagree with any part of 
                    the terms, you may not access the Service.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-6 my-6">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                      <div>
                        <p className="text-gray-700 font-medium">
                          These Terms constitute a legally binding agreement between you and 
                          ATDL Research regarding your use of the Service.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Account Terms */}
              <section id="account" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Account Terms</h2>
                <div className="space-y-4">
                  <div className="border-l-4 border-gray-300 pl-4 py-2">
                    <h3 className="font-semibold text-gray-900">Eligibility</h3>
                    <p className="text-gray-600 mt-1">
                      You must be at least 18 years old to use the Service. By using the Service, 
                      you represent and warrant that you meet this age requirement.
                    </p>
                  </div>

                  <div className="border-l-4 border-gray-300 pl-4 py-2">
                    <h3 className="font-semibold text-gray-900">Account Security</h3>
                    <p className="text-gray-600 mt-1">
                      You are responsible for maintaining the confidentiality of your account 
                      credentials and for all activities that occur under your account. You must 
                      notify us immediately of any unauthorized use of your account.
                    </p>
                  </div>

                  <div className="border-l-4 border-gray-300 pl-4 py-2">
                    <h3 className="font-semibold text-gray-900">Account Information</h3>
                    <p className="text-gray-600 mt-1">
                      You agree to provide accurate, current, and complete information during 
                      registration and to update such information to keep it accurate, current, 
                      and complete.
                    </p>
                  </div>
                </div>
              </section>

              {/* Acceptable Use */}
              <section id="use" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Acceptable Use</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Permitted Uses</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Academic and scientific research</li>
                      <li>• Biomedical literature analysis</li>
                      <li>• Drug discovery and development research</li>
                      <li>• Educational purposes</li>
                      <li>• Professional research activities</li>
                    </ul>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Prohibited Uses</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Commercial exploitation without license</li>
                      <li>• Automated data scraping or crawling</li>
                      <li>• Reverse engineering the platform</li>
                      <li>• Creating derivative works without permission</li>
                      <li>• Any illegal or unauthorized purpose</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900">Important Restrictions</h4>
                      <p className="text-yellow-700 mt-1">
                        You may not use the Service to conduct clinical trials, make medical 
                        decisions, or provide medical advice. The Service is for research 
                        purposes only.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Intellectual Property */}
              <section id="ip" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Intellectual Property</h2>
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Platform IP</h3>
                    <p className="text-gray-600 mb-3">
                      The Service and its original content, features, and functionality are and 
                      will remain the exclusive property of ATDL Research and its licensors.
                    </p>
                    <p className="text-gray-600">
                      This includes but is not limited to software, algorithms, user interfaces, 
                      designs, graphics, and trademarks.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">User Content</h3>
                    <p className="text-gray-600 mb-3">
                      You retain ownership of the research data, papers, and content you upload 
                      or create using the Service ("User Content").
                    </p>
                    <p className="text-gray-600">
                      By using the Service, you grant ATDL Research a worldwide, non-exclusive, 
                      royalty-free license to use, process, and store your User Content solely 
                      for the purpose of providing the Service to you.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Third-Party Content</h3>
                    <p className="text-gray-600">
                      The Service provides access to third-party content, including PubMed 
                      abstracts and research papers. Such content is subject to the respective 
                      copyright and terms of the content providers.
                    </p>
                  </div>
                </div>
              </section>

              {/* Data & Privacy */}
              <section id="data" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data & Privacy</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 mb-4">
                    Your privacy is important to us. Our Privacy Policy explains how we collect, 
                    use, and protect your information. By using the Service, you agree to the 
                    collection and use of information in accordance with our Privacy Policy.
                  </p>
                  
                  <div className="space-y-4 mt-6">
                    <div className="border-l-4 border-gray-300 pl-4 py-2">
                      <h3 className="font-semibold text-gray-900">Data Ownership</h3>
                      <p className="text-gray-600 mt-1">
                        You maintain ownership of your research data. We will not claim ownership 
                        over your research outputs, annotations, or custom analyses.
                      </p>
                    </div>

                    <div className="border-l-4 border-gray-300 pl-4 py-2">
                      <h3 className="font-semibold text-gray-900">Data Processing</h3>
                      <p className="text-gray-600 mt-1">
                        You authorize us to process your data through our AI models and algorithms 
                        to provide the Service's features, including connection extraction and 
                        analysis.
                      </p>
                    </div>

                    <div className="border-l-4 border-gray-300 pl-4 py-2">
                      <h3 className="font-semibold text-gray-900">Data Retention</h3>
                      <p className="text-gray-600 mt-1">
                        We retain your data for as long as your account is active or as needed to 
                        provide the Service. You may request deletion of your data at any time.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Liability */}
              <section id="liability" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Research Disclaimer</h3>
                        <p className="text-gray-600">
                          The Service provides research tools and AI-generated insights. Results 
                          should be verified through appropriate scientific methods. We do not 
                          guarantee the accuracy, completeness, or usefulness of any information 
                          provided by the Service.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Shield className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">No Medical Advice</h3>
                        <p className="text-gray-600">
                          The Service is not intended to provide medical advice, diagnosis, or 
                          treatment. Always seek the advice of qualified health providers with 
                          any questions you may have regarding medical conditions.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Limitation of Damages</h3>
                        <p className="text-gray-600">
                          In no event shall ATDL Research be liable for any indirect, incidental, 
                          special, consequential, or punitive damages, including without 
                          limitation, loss of profits, data, use, goodwill, or other intangible 
                          losses.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Termination */}
              <section id="termination" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Termination</h2>
                <div className="space-y-4">
                  <div className="border-l-4 border-gray-300 pl-4 py-2">
                    <h3 className="font-semibold text-gray-900">By You</h3>
                    <p className="text-gray-600 mt-1">
                      You may terminate your account at any time by contacting us or using the 
                      account deletion feature in your settings.
                    </p>
                  </div>

                  <div className="border-l-4 border-gray-300 pl-4 py-2">
                    <h3 className="font-semibold text-gray-900">By Us</h3>
                    <p className="text-gray-600 mt-1">
                      We may terminate or suspend your account immediately, without prior notice 
                      or liability, for any reason, including breach of these Terms.
                    </p>
                  </div>

                  <div className="border-l-4 border-gray-300 pl-4 py-2">
                    <h3 className="font-semibold text-gray-900">Effect of Termination</h3>
                    <p className="text-gray-600 mt-1">
                      Upon termination, your right to use the Service will immediately cease. We 
                      will retain your data for 30 days following termination, after which it may 
                      be permanently deleted.
                    </p>
                  </div>
                </div>
              </section>

              {/* Governing Law */}
              <section id="governing">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Governing Law</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 mb-4">
                    These Terms shall be governed and construed in accordance with the laws of 
                    the State of California, United States, without regard to its conflict of 
                    law provisions.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Our failure to enforce any right or provision of these Terms will not be 
                    considered a waiver of those rights. If any provision of these Terms is held 
                    to be invalid or unenforceable by a court, the remaining provisions will 
                    remain in effect.
                  </p>
                  <p className="text-gray-600">
                    These Terms constitute the entire agreement between us regarding our Service, 
                    and supersede and replace any prior agreements we might have had between us 
                    regarding the Service.
                  </p>
                </div>
              </section>

              {/* Contact & Updates */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Updates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                    <p className="text-gray-600 mb-1">ATDL Research</p>
                    <p className="text-gray-600 mb-1">legal@atdlresearch.com</p>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Updates to Terms</h4>
                    <p className="text-gray-600">
                      We reserve the right to modify or replace these Terms at any time. We will 
                      provide notice of material changes via email or platform notification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}