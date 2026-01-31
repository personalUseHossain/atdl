'use client';

import { motion } from 'framer-motion';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "For individual researchers getting started",
      features: [
        { text: "Up to 100 papers per month", included: true },
        { text: "Basic PubMed search", included: true },
        { text: "Limited AI extraction", included: true },
        { text: "Basic analytics", included: true },
        { text: "Email support", included: true },
        { text: "Advanced filtering", included: false },
        { text: "Full text processing", included: false },
        { text: "Priority support", included: false },
      ],
      cta: "Get Started",
      href: "/register",
      popular: false
    },
    {
      name: "Professional",
      price: "$49",
      period: "per month",
      description: "For serious researchers and small labs",
      features: [
        { text: "Up to 1,000 papers per month", included: true },
        { text: "Advanced PubMed search", included: true },
        { text: "Full AI extraction suite", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Full text processing", included: true },
        { text: "Graph visualization", included: true },
        { text: "Priority email support", included: true },
        { text: "Team collaboration", included: false },
      ],
      cta: "Start Free Trial",
      href: "/register",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "per month",
      description: "For large research institutions and corporations",
      features: [
        { text: "Unlimited papers", included: true },
        { text: "Custom PubMed APIs", included: true },
        { text: "Custom AI models", included: true },
        { text: "Advanced analytics suite", included: true },
        { text: "Dedicated infrastructure", included: true },
        { text: "Full team collaboration", included: true },
        { text: "24/7 priority support", included: true },
        { text: "Custom integrations", included: true },
      ],
      cta: "Contact Sales",
      href: "/contact",
      popular: false
    },
  ];

  const faqs = [
    {
      question: "Can I switch plans at any time?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, all paid plans include a 14-day free trial. No credit card required to start."
    },
    {
      question: "What happens when I reach my paper limit?",
      answer: "You'll be notified when approaching your limit. You can upgrade your plan or wait until the next billing cycle."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription at any time. No long-term contracts required."
    }
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
              Pricing
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your research needs. All plans include a 14-day free trial.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              No hidden fees. Cancel anytime.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`border rounded-lg p-8 relative ${plan.popular ? 'border-gray-900 shadow-lg' : 'border-gray-200'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gray-900 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold ${plan.popular ? 'text-gray-900' : 'text-gray-800'}`}>
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex items-baseline justify-center">
                    <span className={`text-4xl font-bold ${plan.popular ? 'text-gray-900' : 'text-gray-800'}`}>
                      {plan.price}
                    </span>
                    {plan.period !== "forever" && plan.period !== "Custom" && (
                      <span className="ml-2 text-gray-600">/month</span>
                    )}
                  </div>
                  <p className="mt-2 text-gray-600">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      {feature.included ? (
                        <CheckCircle className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? "text-gray-700" : "text-gray-400"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  className={`block w-full text-center py-3 px-4 rounded-md font-medium ${
                    plan.popular
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                  } transition-colors`}
                >
                  {plan.cta}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-gray-600">
              Get answers to common questions about our pricing and plans.
            </p>
          </motion.div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-6 bg-white"
              >
                <div className="flex items-start">
                  <HelpCircle className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}