import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-center p-6 selection:bg-cyan-100">
      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/60 shadow-lg flex items-center justify-center mb-6">
        <img src="/logo.png" alt="Labellr Logo" className="w-10 h-10 object-contain" />
      </div>
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 mb-4">404</h1>
      <h2 className="text-2xl font-bold tracking-tight text-slate-700 mb-4">Resource Not Found</h2>
      <p className="text-slate-500 font-medium mb-10 max-w-md leading-relaxed">
        The label, workspace, or page you are looking for has been moved, deleted, or never existed in the first place.
      </p>
      <Link 
        href="/" 
        className="bg-slate-900 text-white px-8 py-3.5 rounded-full font-bold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-95"
      >
        Return to Dashboard
      </Link>
    </main>
  );
}
