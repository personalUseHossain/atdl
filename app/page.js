'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Database, 
  BarChart3, 
  Network, 
  Shield, 
  Cpu,
  FileText,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Globe,
  BookOpen,
  Zap,
  Users,
  TrendingUp
} from 'lucide-react';
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion';

// Animated Counter Component
const AnimatedCounter = ({ value, label, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (isInView) {
      const target = parseInt(value);
      let start = 0;
      const duration = 1500; // 1.5 seconds
      const increment = target / (duration / 16); // 60fps

      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold text-gray-900"
      >
        {count.toLocaleString()}{suffix}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-2 text-sm font-medium text-gray-600"
      >
        {label}
      </motion.div>
    </div>
  );
};

// Animated Feature Card
const AnimatedFeatureCard = ({ icon, title, description, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <motion.div 
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
        className="h-12 w-12 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center mb-4 transition-colors"
      >
        <div className="text-gray-700">
          {icon}
        </div>
      </motion.div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {title}
      </h3>
      <p className="text-gray-600">
        {description}
      </p>
    </motion.div>
  );
};

// Animated Step Component
const AnimatedStep = ({ number, title, description, index, isLast }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div ref={ref} className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: index * 0.2 }}
        className="text-center"
      >
        <motion.div 
          initial={{ rotate: -180 }}
          animate={isInView ? { rotate: 0 } : {}}
          transition={{ duration: 0.5, delay: index * 0.2 + 0.2 }}
          className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-900 text-white text-2xl font-bold mb-6"
        >
          {number}
        </motion.div>
        <motion.h3 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.3, delay: index * 0.2 + 0.3 }}
          className="text-xl font-semibold text-gray-900 mb-3"
        >
          {title}
        </motion.h3>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: index * 0.2 + 0.4 }}
          className="text-gray-600"
        >
          {description}
        </motion.p>
      </motion.div>
      
      {!isLast && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 0.5, delay: index * 0.2 + 0.5 }}
          className="hidden lg:block absolute top-8 right-0 transform translate-x-1/2 w-16 h-0.5 bg-gray-200"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.5, delay: index * 0.2 + 0.7 }}
            className="h-full bg-gray-400 origin-left"
          />
        </motion.div>
      )}
    </div>
  );
};

// Text Reveal Component
const TextReveal = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
};

export default function Home() {
  const features = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "PubMed Integration",
      description: "Fetch research papers directly from PubMed with real-time search and filtering capabilities.",
    },
    {
      icon: <Cpu className="h-6 w-6" />,
      title: "AI-Powered Analysis",
      description: "Extract drug-health connections using advanced AI models with configurable parameters.",
    },
    {
      icon: <Network className="h-6 w-6" />,
      title: "Connection Mapping",
      description: "Visualize relationships between drugs, compounds, and health outcomes in interactive graphs.",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Evidence-Based Ranking",
      description: "Rank connections 1-5 stars based on paper count, study quality, and confidence levels.",
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "Comprehensive Database",
      description: "Store and organize processed papers, full texts, and extracted connections.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Private",
      description: "Your research data is protected with enterprise-grade security measures.",
    },
  ];

  const stats = [
    { value: "10000", label: "Papers Processed", suffix: "+" },
    { value: "50000", label: "Connections Found", suffix: "+" },
    { value: "500", label: "Active Researchers", suffix: "+" },
    { value: "100", label: "Processing Speed", suffix: "x" },
  ];

  const steps = [
    {
      number: "01",
      title: "Search PubMed",
      description: "Enter your research query and let our system fetch relevant papers from PubMed.",
    },
    {
      number: "02",
      title: "AI Extraction",
      description: "Our AI models extract drug-health connections, dosages, and study details.",
    },
    {
      number: "03",
      title: "Analyze Results",
      description: "Review ranked connections with evidence summaries and confidence scores.",
    },
    {
      number: "04",
      title: "Export & Share",
      description: "Download results, generate reports, or share insights with your team.",
    },
  ];

  return (
    <>
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <TextReveal delay={0.1}>
              <div className="flex items-center justify-center mb-6">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                >
                  <Sparkles className="h-8 w-8 text-gray-900 mr-3" />
                </motion.div>
                <span className="text-sm font-semibold tracking-wide text-gray-900 uppercase">
                  Advanced Research Platform
                </span>
              </div>
            </TextReveal>
            
            <TextReveal delay={0.2}>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">ATDL Research</span>
                <span className="block mt-2 text-gray-700">Biomedical Insight Platform</span>
              </h1>
            </TextReveal>
            
            <TextReveal delay={0.3}>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
                Extract and analyze drug-health connections from biomedical research papers 
                using AI-powered extraction and evidence-based ranking.
              </p>
            </TextReveal>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md shadow-sm transition-colors"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm transition-colors"
              >
                Sign In
              </Link>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-4 text-sm text-gray-500"
            >
              No credit card required • 14-day free trial
            </motion.p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <AnimatedCounter 
                key={index}
                value={stat.value}
                label={stat.label}
                suffix={stat.suffix}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900">
              Powerful Research Tools
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Everything you need to accelerate your biomedical research and discovery process.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <AnimatedFeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Four simple steps from research question to actionable insights.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <AnimatedStep
                key={index}
                number={step.number}
                title={step.title}
                description={step.description}
                index={index}
                isLast={index === steps.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <div className="border border-gray-200 rounded-2xl p-8 md:p-12 bg-white shadow-sm">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-gray-900"
            >
              Ready to accelerate your research?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="mt-4 text-lg text-gray-600"
            >
              Join hundreds of researchers already using ATDL to streamline their discovery process.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md shadow-sm transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm transition-colors"
              >
                View Pricing
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="mt-6 flex flex-wrap justify-center gap-4"
            >
              <div className="flex items-center text-sm text-gray-500">
                <CheckCircle className="h-4 w-4 mr-2 text-gray-400" />
                No credit card required
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <CheckCircle className="h-4 w-4 mr-2 text-gray-400" />
                14-day free trial
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <CheckCircle className="h-4 w-4 mr-2 text-gray-400" />
                Cancel anytime
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

     
    </>
  );
}