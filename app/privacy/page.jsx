'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, User, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('introduction');

  const sections = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'data-collection', title: 'Data Collection' },
    { id: 'data-use', title: 'How We Use Data' },
    { id: 'data-sharing', title: 'Data Sharing' },
    { id: 'security', title: 'Security' },
    { id: 'your-rights', title: 'Your Rights' },
    { id: 'changes', title: 'Policy Changes' },
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
              <Shield className="h-8 w-8 text-gray-700" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="mt-2 text-gray-500">
              Protecting your privacy is our priority
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
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Info</h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Lock className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Encrypted data storage</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Eye className="h-4 w-4 mr-2 text-gray-400" />
                      <span>No third-party tracking</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Database className="h-4 w-4 mr-2 text-gray-400" />
                      <span>You own your data</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              {/* Introduction */}
              <section id="introduction" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 mb-4">
                    ATDL Research ("we," "our," or "us") is committed to protecting your privacy. 
                    This Privacy Policy explains how we collect, use, disclose, and safeguard your 
                    information when you use our biomedical research platform.
                  </p>
                  <p className="text-gray-600">
                    Please read this privacy policy carefully. If you do not agree with the terms 
                    of this privacy policy, please do not access the platform.
                  </p>
                </div>
              </section>

              {/* Data Collection */}
              <section id="data-collection" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Collection</h2>
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <User className="h-5 w-5 text-gray-500 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    </div>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Name and contact information (email address)</li>
                      <li>• Account credentials (hashed and salted)</li>
                      <li>• Profile information and preferences</li>
                      <li>• Communication preferences</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Database className="h-5 w-5 text-gray-500 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Research Data</h3>
                    </div>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Search queries and PubMed paper selections</li>
                      <li>• AI-extracted drug-health connections</li>
                      <li>• Analysis results and annotations</li>
                      <li>• Workspace configurations and saved searches</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Eye className="h-5 w-5 text-gray-500 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Usage Data</h3>
                    </div>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Platform usage statistics and metrics</li>
                      <li>• Feature usage patterns</li>
                      <li>• Technical logs and error reports</li>
                      <li>• Device information and browser type</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* How We Use Data */}
              <section id="data-use" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Data</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Platform Operation</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Provide and maintain the platform</li>
                      <li>• Process your research queries</li>
                      <li>• Generate AI analysis results</li>
                      <li>• Manage your account and workspace</li>
                    </ul>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Improvement & Security</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Improve platform features and performance</li>
                      <li>• Detect and prevent security issues</li>
                      <li>• Develop new tools and capabilities</li>
                      <li>• Monitor platform stability</li>
                    </ul>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Communication</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Send important platform updates</li>
                      <li>• Respond to your inquiries</li>
                      <li>• Provide customer support</li>
                      <li>• Send security notifications</li>
                    </ul>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Research & Analytics</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Aggregate anonymous usage statistics</li>
                      <li>• Understand feature usage patterns</li>
                      <li>• Improve AI model performance</li>
                      <li>• Conduct platform research (anonymized)</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Data Sharing */}
              <section id="data-sharing" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sharing</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 mb-4">
                    We do not sell, trade, or otherwise transfer your personal information or 
                    research data to outside parties except in the following circumstances:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-gray-300 pl-4">
                      <h4 className="font-semibold text-gray-900">Service Providers</h4>
                      <p className="text-gray-600">
                        Trusted third parties who assist us in operating our platform, 
                        conducting our business, or serving our users, so long as those 
                        parties agree to keep this information confidential.
                      </p>
                    </div>

                    <div className="border-l-4 border-gray-300 pl-4">
                      <h4 className="font-semibold text-gray-900">Legal Requirements</h4>
                      <p className="text-gray-600">
                        When required by law or to protect our rights, property, or safety, 
                        or the rights, property, or safety of others.
                      </p>
                    </div>

                    <div className="border-l-4 border-gray-300 pl-4">
                      <h4 className="font-semibold text-gray-900">Business Transfers</h4>
                      <p className="text-gray-600">
                        In connection with a merger, acquisition, or sale of all or a 
                        portion of our assets, with appropriate confidentiality protections.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Security */}
              <section id="security" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Lock className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Encryption</h3>
                        <p className="text-gray-600">
                          All data is encrypted in transit using TLS 1.2+ and at rest using 
                          AES-256 encryption. Passwords are hashed using bcrypt with salt.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Shield className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Access Controls</h3>
                        <p className="text-gray-600">
                          Strict access controls and authentication mechanisms ensure only 
                          authorized personnel can access user data, and only for legitimate purposes.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Database className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Regular Audits</h3>
                        <p className="text-gray-600">
                          Regular security audits, vulnerability assessments, and penetration 
                          testing to maintain the highest security standards.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Your Rights */}
              <section id="your-rights" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Access & Control</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Access your personal information</li>
                      <li>• Correct inaccurate data</li>
                      <li>• Delete your account and data</li>
                      <li>• Export your research data</li>
                    </ul>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Preferences</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Opt-out of non-essential communications</li>
                      <li>• Control cookie preferences</li>
                      <li>• Manage notification settings</li>
                      <li>• Update privacy preferences</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex">
                    <Mail className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Contact Us</h4>
                      <p className="text-blue-700 mt-1">
                        To exercise any of these rights, please contact us at{' '}
                        <a href="mailto:privacy@atdlresearch.com" className="underline">
                          privacy@atdlresearch.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Policy Changes */}
              <section id="changes">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Policy Changes</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 mb-4">
                    We may update this Privacy Policy from time to time. We will notify you of 
                    any changes by posting the new Privacy Policy on this page and updating the 
                    "Last updated" date.
                  </p>
                  <p className="text-gray-600">
                    You are advised to review this Privacy Policy periodically for any changes. 
                    Changes to this Privacy Policy are effective when they are posted on this page.
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">For privacy inquiries:</h4>
                    <p className="text-gray-600">privacy@atdlresearch.com</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">For general questions:</h4>
                    <p className="text-gray-600">support@atdlresearch.com</p>
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