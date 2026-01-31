'use client';

import { motion } from 'framer-motion';
import { 
  Search, 
  Database, 
  BarChart3, 
  Network, 
  Shield, 
  Cpu,
  FileText,
  Zap,
  Users,
  TrendingUp,
  CheckCircle,
  Globe,
  BookOpen,
  Lock,
  Server,
  Filter,
  Download,
  Share2,
  Bell
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: <Search className="h-8 w-8" />,
      title: "Advanced PubMed Search",
      description: "Search millions of biomedical papers with intelligent filters and real-time results.",
      details: [
        "Boolean search operators",
        "Date range filtering",
        "Journal-specific searches",
        "Citation tracking"
      ],
      image: "/images/features/search-interface.png"
    },
    {
      icon: <Cpu className="h-8 w-8" />,
      title: "AI-Powered Extraction",
      description: "Automatically extract drug-health connections using state-of-the-art NLP models.",
      details: [
        "Named Entity Recognition",
        "Relationship extraction",
        "Dosage and frequency detection",
        "Study design identification"
      ],
      image: "/images/features/search-interface.png"
    },
    {
      icon: <Network className="h-8 w-8" />,
      title: "Interactive Graph Visualization",
      description: "Visualize complex relationships in an interactive knowledge graph.",
      details: [
        "Force-directed graphs",
        "Cluster analysis",
        "Path discovery",
        "Custom node styling"
      ],
      image: "/images/features/search-interface.png"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Advanced Analytics",
      description: "Comprehensive analytics and reporting tools for data-driven insights.",
      details: [
        "Statistical analysis",
        "Trend identification",
        "Confidence scoring",
        "Evidence ranking"
      ],
      image: "/images/features/search-interface.png"
    },
  ];

  const secondaryFeatures = [
    {
      icon: <Database className="h-6 w-6" />,
      title: "Data Management",
      description: "Organize and manage your research data with advanced filtering and tagging."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Security & Privacy",
      description: "Enterprise-grade security with encryption, access controls, and audit logging."
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: "Export Options",
      description: "Export data in multiple formats including CSV, JSON, PDF, and Excel."
    },
    {
      icon: <Share2 className="h-6 w-6" />,
      title: "Collaboration Tools",
      description: "Share insights, annotate findings, and collaborate with team members."
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Notifications",
      description: "Get alerts for new papers, completed analyses, and system updates."
    },
    {
      icon: <Filter className="h-6 w-6" />,
      title: "Smart Filters",
      description: "Advanced filtering options to focus on specific research criteria."
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Features
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need for advanced biomedical research and analysis.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       

          <motion.div 
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="space-y-12"
          >
            {mainFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center"
              >
                <div className="lg:col-span-2">
                  <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center mb-6">
                    <div className="text-gray-700">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-center text-gray-600">
                        <CheckCircle className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="lg:col-span-3">
                  <div className="bg-gray-100 rounded-lg h-64 lg:h-80 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="text-gray-400 mb-4">
                        {feature.icon}
                      </div>
                      <p className="text-gray-500">
                        Interactive {feature.title.toLowerCase()} interface
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Secondary Features Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900">
              Additional Features
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools to support every aspect of your research workflow.
            </p>
          </motion.div>

          <motion.div
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {secondaryFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                  <div className="text-gray-700">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="border border-gray-200 rounded-2xl p-8 md:p-12 bg-white"
          >
            <h2 className="text-3xl font-bold text-gray-900">
              Ready to explore all features?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start your free trial and experience the full power of ATDL Research Platform.
            </p>
            <div className="mt-8">
              <a
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md shadow-sm transition-colors"
              >
                Start Free Trial
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}