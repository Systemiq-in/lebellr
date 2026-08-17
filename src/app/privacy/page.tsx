import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-24 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
        <Link href="/" className="text-sm font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-2 mb-8">
          &larr; Back to Labellr
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-6">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 font-medium">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Zero Data Collection Promise</h2>
          <p className="text-slate-600 mb-4">
            Labellr is designed from the ground up to be 100% privacy-first. We do not collect, store, transmit, or process any of your label data, inventory spreadsheets, or PDF outputs on our servers.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. Local Browser Processing</h2>
          <p className="text-slate-600 mb-4">
            All operations, including CSV parsing, barcode generation, and PDF compilation, happen entirely locally within your web browser. When you upload a file to Labellr, it never leaves your computer.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Analytics and Tracking</h2>
          <p className="text-slate-600 mb-4">
            We use basic, privacy-friendly analytics to count page views and understand general usage trends. These analytics do not track individual users, do not use invasive cookies, and cannot see the content of what you design.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Contact</h2>
          <p className="text-slate-600 mb-4">
            If you have any questions about this Privacy Policy, please contact us at <a href="https://systemiq.in" className="text-cyan-600 font-bold hover:underline">SystemIQ.in</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
