import ScrollVectors from "@/components/ScrollVectors";

export default function Platform() {
  return (
    <div className="relative">
      <ScrollVectors />

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-10">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
          Platform
        </span>
        <h1 className="mt-4 text-4xl md:text-5xl font-bold">Your Digital Workspace, Supercharged by AI</h1>
        <p className="mt-4 text-gray-600 max-w-2xl">
          Dropbox-style document management with instant AI summaries and ARIA — a multi-model agent that understands your content.
        </p>
        <div className="mt-6 flex gap-3">
          <a href="/signup" className="bg-black text-white px-5 py-3 rounded-lg">Start 3-Day Trial</a>
          <a href="/contact" className="border px-5 py-3 rounded-lg">Talk to Us</a>
        </div>
      </section>

      {/* Screenshot */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border bg-white/70 backdrop-blur p-3 shadow-sm">
          {/* Replace the src with your hosted screenshot asset */}
          <img src="/assets/platform-screenshot.png" alt="Platform UI" className="rounded-xl w-full"/>
        </div>
        <p className="text-sm text-gray-500 mt-2">A clean, empty workspace for new accounts.</p>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-semibold mb-6">Key Capabilities</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-xl border p-5 bg-white/80 backdrop-blur">
              <div className="text-sm font-medium text-indigo-600">{f.tag}</div>
              <h3 className="mt-1 font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ARIA Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border p-8 bg-white/80 backdrop-blur">
          <h2 className="text-2xl font-semibold">ARIA: Advanced Reasoning & Insight Agent</h2>
          <p className="mt-3 text-gray-600">
            Unified access to Sonar (Perplexity), Claude Sonnet, GPT-5, and Gemini. Ask natural questions, run
            grounded searches, and synthesize answers from your documents.
          </p>
          <ul className="mt-5 grid md:grid-cols-2 gap-3 text-sm text-gray-700 list-disc pl-5">
            <li>Model selector with per-query controls (length, temperature, reasoning depth).</li>
            <li>Compound input: NL query + filters (type, date, tag, author).</li>
            <li>Responses blend AI reasoning with doc citations and mini-summaries.</li>
            <li>Secure, per-user isolation across storage, queries, and outputs.</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-28">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-8">
          <h3 className="text-2xl font-semibold">Ready to try it?</h3>
          <p className="mt-2 text-white/90">
            Sign up for a 3-day trial. After expiry, continue via subscription.
          </p>
          <div className="mt-5">
            <a href="/signup" className="bg-white text-black px-5 py-3 rounded-lg">Create Account</a>
          </div>
        </div>
      </section>
    </div>
  );
}

const FEATURES = [
  {
    tag: "Document Management",
    title: "Dropbox-style storage & sharing",
    desc: "Folders, search, quick filters, and clean organization with a familiar UX."
  },
  {
    tag: "AI Summaries",
    title: "Mini-summaries for every document",
    desc: "Summaries are generated on upload and refresh when content changes."
  },
  {
    tag: "Multi-Model",
    title: "ARIA agent (Sonar, Claude Sonnet, GPT-5, Gemini)",
    desc: "Ask questions across your library or the web with model-level controls."
  },
  {
    tag: "Compound Input",
    title: "Powerful query + filters",
    desc: "Combine natural language with file type, date, tag, author, and parameters."
  },
  {
    tag: "Account Isolation",
    title: "Per-user security",
    desc: "RLS-enforced data separation; new users start with an empty workspace."
  },
  {
    tag: "Onboarding",
    title: "3-day trial with clean redirects",
    desc: "Email confirmations route back to the app; expired trials go to Subscribe."
  },
  {
    tag: "Pages",
    title: "About & Contact",
    desc: "Static pages under the same layout for brand consistency and support."
  }
];