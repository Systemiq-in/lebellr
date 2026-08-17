'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, CheckCircle2, Layers, Printer, ShieldCheck, Zap, Box, Code2 } from 'lucide-react';

const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-cyan-100 selection:text-cyan-900 overflow-x-hidden">
      
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 inset-x-0 border-b border-slate-200/50 bg-white/70 backdrop-blur-xl z-50"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Labellr Logo" className="w-10 h-10 rounded-lg shadow-sm object-cover" />
            <span className="text-xl font-black tracking-tighter text-slate-900">LABELLR</span>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              href="/studio" 
              className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors hidden sm:block"
            >
              Open Studio
            </Link>
            <Link 
              href="/studio" 
              className="text-sm font-bold bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 hover:scale-105 transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] active:scale-95 flex items-center gap-2"
            >
              Start Designing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-[800px] h-[800px] bg-gradient-to-tr from-cyan-100/40 to-blue-50/40 rounded-full blur-3xl opacity-70 -top-40 -left-20 animate-pulse-slow" />
            <div className="absolute w-[600px] h-[600px] bg-gradient-to-bl from-indigo-50/50 to-transparent rounded-full blur-3xl opacity-60 bottom-0 right-0" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_70%,transparent_100%)] opacity-30" />
          </div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto px-6 relative z-10 text-center flex flex-col items-center"
          >
            <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200/60 shadow-sm text-xs font-bold text-slate-600 tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              100% Client-Side Compiler
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6 max-w-4xl leading-[1.05]">
              Industrial Label Design, <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-indigo-600">Zero Server Overhead.</span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-500 font-medium mb-10 max-w-2xl leading-relaxed">
              Design pixel-perfect physical sticker sheets, thermal roll labels, and compile print-ready PDFs entirely in your browser. Absolute data privacy.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link 
                href="/studio" 
                className="w-full sm:w-auto text-base font-bold bg-slate-900 text-white px-8 py-4 rounded-full hover:bg-slate-800 hover:scale-105 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.2)] active:scale-95 flex items-center justify-center gap-2"
              >
                Launch Labellr Studio <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-sm text-slate-500 font-medium flex items-center justify-center gap-1.5 mt-2 sm:mt-0 px-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                No signup required
              </p>
            </motion.div>

            {/* Floating UI Graphic */}
            <motion.div 
              variants={fadeUp}
              className="mt-20 relative w-full max-w-4xl mx-auto perspective-1000"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-transparent to-transparent z-20" />
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 bg-white rounded-2xl border border-slate-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row transform rotate-x-12 scale-95 origin-bottom"
              >
                {/* Mock Sidebar */}
                <div className="w-48 bg-slate-50 border-r border-slate-100 p-4 hidden md:flex flex-col gap-3">
                  <div className="h-3 w-16 bg-slate-200 rounded-full mb-4" />
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-8 w-full bg-white border border-slate-200/50 rounded-lg shadow-sm" />
                  ))}
                </div>
                {/* Mock Canvas */}
                <div className="flex-1 p-8 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center min-h-[300px]">
                  <div className="w-64 h-40 bg-white shadow-xl border border-slate-200 rounded-sm relative p-4 flex flex-col justify-between transform rotate-2 hover:rotate-0 transition-transform duration-500">
                    <div className="flex justify-between">
                      <div className="h-3 w-24 bg-slate-800 rounded-sm" />
                      <div className="h-3 w-8 bg-red-500 rounded-sm" />
                    </div>
                    <div>
                      <div className="h-2 w-full bg-slate-200 rounded-sm mb-1" />
                      <div className="h-2 w-4/5 bg-slate-200 rounded-sm" />
                    </div>
                    {/* Mock Barcode */}
                    <div className="flex gap-0.5 h-10 w-full justify-center">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="h-full bg-slate-800" style={{ width: Math.random() > 0.5 ? '2px' : '4px', opacity: Math.random() > 0.2 ? 1 : 0 }} />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-32 relative z-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight"
              >
                Industrial infrastructure,<br/>consumer simplicity.
              </motion.h2>
              <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg">
                Labellr replaces expensive desktop software with a fast, private, and precise browser-based engine.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<ShieldCheck className="w-6 h-6 text-indigo-600" />}
                title="Absolute Data Privacy"
                description="Your proprietary inventory, SKUs, and pricing data never leave your computer. 100% client-side architecture means zero cloud processing."
                delay={0}
              />
              <FeatureCard 
                icon={<Printer className="w-6 h-6 text-cyan-600" />}
                title="Universal Printer Support"
                description="Whether you're printing on A4 Avery sheets with a standard laser printer, or using continuous thermal rolls (Zebra, Dymo), Labellr outputs millimeter-precise PDFs."
                delay={0.1}
              />
              <FeatureCard 
                icon={<Zap className="w-6 h-6 text-amber-500" />}
                title="Dynamic Vectors"
                description="Instantly map your spreadsheet data to Vector Code-128 Barcodes, QR Codes, and conditional GHS hazard diamonds without any blurry raster images."
                delay={0.2}
              />
              <FeatureCard 
                icon={<Box className="w-6 h-6 text-emerald-600" />}
                title="Auto-Fit Compliance"
                description="Long ingredient lists or warnings automatically scale their font size to fit your physical label bounds perfectly, preventing overflow cuts."
                delay={0.3}
              />
              <FeatureCard 
                icon={<Layers className="w-6 h-6 text-rose-500" />}
                title="Visual Layer Stack"
                description="Drag, drop, and nudge elements with an intuitive layer system. Build complex dynamic templates in minutes instead of hours."
                delay={0.4}
              />
              <FeatureCard 
                icon={<Code2 className="w-6 h-6 text-slate-700" />}
                title="Spreadsheet Ingestion"
                description="Drop any CSV or Excel file. Labellr automatically maps your column headers to label template tokens, generating thousands of items instantly."
                delay={0.5}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-16 text-center text-slate-400 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6 relative z-10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Labellr Logo" className="w-12 h-12 rounded-xl shadow-lg object-cover" />
            <span className="text-2xl font-black text-white tracking-tighter uppercase">LABELLR</span>
          </div>
          <p className="text-sm font-medium max-w-md leading-relaxed text-slate-500">
            The free, privacy-first, industrial-grade label design studio. Built by SystemIQ for modern logistics and manufacturing teams.
          </p>
          <div className="text-xs text-slate-600 font-semibold mt-4">
            &copy; {new Date().getFullYear()} SystemIQ. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Component
function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col gap-4 p-8 rounded-2xl bg-slate-50/50 border border-slate-200/60 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-slate-200 transition-all group"
    >
      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-slate-200/80 shadow-sm group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="text-slate-500 leading-relaxed font-medium text-sm">
        {description}
      </p>
    </motion.div>
  );
}
