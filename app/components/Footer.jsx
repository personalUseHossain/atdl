'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Globe } from 'lucide-react'

export default function Footer() {
  return (
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex items-center mb-6 md:mb-0"
            >
              <Globe className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold">ATDL</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center md:text-left"
            >
              <p className="text-gray-400">
                © {new Date().getFullYear()} ATDL Research Platform. All rights reserved.
              </p>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-6">
                <Link href="/privacy" className="text-gray-400 hover:text-white">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-white">
                  Terms of Service
                </Link>
                <Link href="/contact" className="text-gray-400 hover:text-white">
                  Contact
                </Link>
                <Link href="/about" className="text-gray-400 hover:text-white">
                  About
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </footer>
  )
}
