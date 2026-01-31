'use client';

import { motion } from 'framer-motion';
import { Users, Target, Globe, Award, Heart, Zap } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function AboutPage() {
  const values = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Mission",
      description: "To accelerate biomedical research by making drug-health connection analysis accessible and efficient."
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Vision",
      description: "A world where every researcher can easily discover and analyze complex biomedical relationships."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Team",
      description: "We're a team of scientists, engineers, and researchers passionate about advancing medical science."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Innovation",
      description: "Continuously pushing boundaries with cutting-edge AI and data science technologies."
    },
  ];

  const timeline = [
    {
      year: "2022",
      title: "Founded",
      description: "ATDL was founded by a team of biomedical researchers and data scientists."
    },
    {
      year: "2023",
      title: "Beta Launch",
      description: "Released beta version to select research institutions and gathered feedback."
    },
    {
      year: "2024",
      title: "Public Launch",
      description: "Launched publicly with advanced AI features and comprehensive analytics."
    },
    {
      year: "Future",
      title: "Expansion",
      description: "Expanding to support more databases and advanced collaboration features."
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
              About ATDL
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Advancing biomedical research through intelligent data analysis and discovery.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900">
              Our Story
            </h2>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="prose prose-lg text-gray-600 max-w-none"
          >
            <p className="mb-6">
              ATDL Research Platform was born from a simple observation: researchers spend countless hours 
              manually reading papers and trying to connect disparate pieces of information about drug-health 
              relationships.
            </p>
            <p className="mb-6">
              As biomedical researchers ourselves, we experienced firsthand the challenges of keeping up with 
              the exponential growth of scientific literature. Traditional methods were time-consuming, 
              error-prone, and limited in scope.
            </p>
            <p className="mb-6">
              We founded ATDL to solve this problem. Our platform combines advanced AI, natural language 
              processing, and data visualization to help researchers discover, analyze, and validate 
              drug-health connections faster and more accurately than ever before.
            </p>
            <p>
              Today, ATDL is used by researchers worldwide to accelerate their work, from academic institutions 
              to pharmaceutical companies, all working toward the common goal of advancing human health.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
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
              Our Values
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  <div className="text-gray-700">
                    {value.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900">
              Our Journey
            </h2>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 h-full w-0.5 bg-gray-200"></div>
            
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative mb-12 ${index % 2 === 0 ? 'md:pr-1/2 md:pr-8' : 'md:pl-1/2 md:pl-8'}`}
              >
                <div className="flex items-start">
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right md:pr-8' : 'md:pl-8'}`}>
                    <div className={`inline-block ${index % 2 === 0 ? 'md:float-right' : ''}`}>
                      <span className="inline-block px-4 py-1 bg-gray-900 text-white rounded-full text-sm font-medium mb-2">
                        {item.year}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 bg-gray-900 rounded-full border-4 border-white"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}