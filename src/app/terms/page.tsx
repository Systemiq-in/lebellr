import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-24 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
        <Link href="/" className="text-sm font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-2 mb-8">
          &larr; Back to Labellr
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-6">Terms of Service</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 font-medium">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-slate-600 mb-4">
            By accessing and using Labellr, you accept and agree to be bound by the terms and provisions of this agreement.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. Use License</h2>
          <p className="text-slate-600 mb-4">
            Labellr is provided as a free utility. You may use this tool for both personal and commercial purposes. However, you may not copy, modify, or distribute the underlying software or source code without explicit permission from SystemIQ.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Disclaimer of Warranties</h2>
          <p className="text-slate-600 mb-4">
            The service is provided &quot;as is&quot;, without warranty of any kind. While we strive to ensure generated barcodes and PDF layouts are accurate, it is your responsibility to verify the physical output before conducting mass printing runs.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Limitation of Liability</h2>
          <p className="text-slate-600 mb-4">
            In no event shall SystemIQ or its developers be liable for any damages (including, without limitation, damages for loss of materials, printing costs, or business interruption) arising out of the use or inability to use Labellr.
          </p>

          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">5. Modifications</h2>
          <p className="text-slate-600 mb-4">
            We may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the current version of these terms.
          </p>
        </div>
      </div>
    </div>
  );
}
