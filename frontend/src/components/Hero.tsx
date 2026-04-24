import React from 'react'

interface HeroProps {
  onScrollToUpload: () => void
}

const TECH_BADGES = [
  { label: 'Gemini 2.0 Flash', color: 'badge-blue' },
  { label: 'RAG Pipeline', color: 'badge-purple' },
  { label: 'Agentic AI', color: 'badge-green' },
  { label: 'Trie DSA', color: 'badge-amber' },
  { label: 'React + TypeScript', color: 'badge-blue' },
  { label: 'Docker / Cloud Run', color: 'badge-purple' },
  { label: 'Prompt Engineering', color: 'badge-green' },
  { label: 'LangChain', color: 'badge-amber' },
]

const STATS = [
  { value: '80+', label: 'Skills Tracked' },
  { value: '4', label: 'AI Agents' },
  { value: '12', label: 'LPA Target' },
  { value: '100%', label: 'Cloud Ready' },
]

export default function Hero({ onScrollToUpload }: HeroProps) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>

      {/* Ambient background orbs */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--gradient-hero)',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '600px', height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 70%)',
        animation: 'orb-drift 12s ease-in-out infinite',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%)',
        animation: 'orb-drift 16s ease-in-out infinite reverse',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', top: '30%', right: '20%',
        width: '300px', height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)',
        animation: 'orb-drift 10s ease-in-out infinite 2s',
        zIndex: 0,
      }} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, opacity: 0.03,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1, maxWidth: '900px',
        margin: '0 auto', padding: '80px 24px',
        textAlign: 'center',
      }}>
        {/* Top badge */}
        <div className="animate-fade-up" style={{ animationDelay: '0ms', display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <span className="badge badge-purple animate-pulse-glow" style={{ fontSize: '0.8rem', padding: '8px 20px' }}>
            🚀 Cognizant ACE 12 LPA — ResumeIQ Pro
          </span>
        </div>

        {/* Main headline */}
        <h1 className="animate-fade-up" style={{ animationDelay: '80ms', fontSize: 'clamp(2.4rem, 6vw, 4rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.02em' }}>
          Your AI-Powered
          <br />
          <span className="gradient-text">Resume Intelligence</span>
          <br />
          Platform
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-up" style={{
          animationDelay: '160ms',
          fontSize: '1.15rem', color: 'var(--color-text-muted)',
          maxWidth: '640px', margin: '0 auto 16px',
          lineHeight: 1.7,
        }}>
          4-agent AI pipeline — <strong style={{ color: 'var(--color-text)' }}>Parser → Skill Matcher → RAG → Coach</strong> —
          powered by Gemini 2.0 Flash, Trie DSA, and retrieval-augmented job-description analysis.
        </p>

        <p className="animate-fade-up" style={{ animationDelay: '200ms', fontSize: '0.9rem', color: 'var(--color-text-subtle)', marginBottom: '40px' }}>
          Built to stand out in <strong style={{ color: 'var(--color-primary-light)' }}>Cognizant GenC Next / ACE</strong> technical interviews
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-up flex items-center justify-center gap-3" style={{ animationDelay: '240ms', marginBottom: '56px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onScrollToUpload} style={{ fontSize: '1rem', padding: '14px 32px' }}>
            <span>⚡</span> Analyze My Resume
          </button>
          <a
            href="https://github.com/omborekar/AI_Resume_Analyzer_and_suggestion_using_gemini_API"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            style={{ fontSize: '0.9rem' }}
          >
            <span>⭐</span> GitHub
          </a>
        </div>

        {/* Stats row */}
        <div className="animate-fade-up" style={{ animationDelay: '300ms', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' }}>
          {STATS.map(({ value, label }) => (
            <div key={label} className="glass-card" style={{ padding: '20px 12px', textAlign: 'center' }}>
              <div className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tech badges */}
        <div className="animate-fade-up" style={{ animationDelay: '360ms', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {TECH_BADGES.map(({ label, color }) => (
            <span key={label} className={`badge ${color}`}>{label}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
