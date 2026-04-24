import React, { useState } from 'react'
import SkillRadar from './SkillRadar'

interface AnalysisResultProps {
  result: any
}

type TabId = 'overview' | 'skills' | 'coaching' | 'dsa'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'skills', label: 'Skills', icon: '⚡' },
  { id: 'coaching', label: 'AI Coaching', icon: '🤖' },
  { id: 'dsa', label: 'DSA Stats', icon: '🧮' },
]

const PRIORITY_COLORS: Record<string, string> = {
  high: 'badge-red',
  medium: 'badge-amber',
  low: 'badge-blue',
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: '110px', height: '110px', margin: '0 auto' }}>
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="55" cy="55" r={radius} fill="none"
            stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 55 55)"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1, color }}>{score}</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>/ 100</span>
        </div>
      </div>
      <p style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
    </div>
  )
}

function OverviewTab({ result }: { result: any }) {
  const coach = result.agents.coach.result
  const skill = result.agents.skill.result
  const parser = result.agents.parser.result
  const rag = result.agents.rag.result

  const rating = coach.overall_rating ?? 6
  const atsScore = coach.ats_score ?? 62

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Score rings */}
      <div className="glass-card" style={{ padding: '32px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '28px', fontSize: '1rem', color: 'var(--color-text-muted)' }}>
          Performance Snapshot
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <ScoreRing score={rating * 10} label="AI Rating" color="#7c3aed" />
          <ScoreRing score={atsScore} label="ATS Score" color="#2563eb" />
          <ScoreRing score={skill.weighted_score} label="Skill Score" color="#10b981" />
          <ScoreRing score={rag.result?.jd_similarity_score ?? 0} label="JD Match %" color="#f59e0b" />
        </div>
      </div>

      {/* Verdict */}
      <div className="glass-card" style={{ padding: '24px', borderColor: 'rgba(124,58,237,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <span style={{ fontSize: '2rem', flexShrink: 0 }}>
            {rating >= 7 ? '🎯' : rating >= 5 ? '📈' : '⚠️'}
          </span>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>
              AI Verdict
            </h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, fontSize: '0.92rem' }}>
              {coach.verdict}
            </p>
          </div>
        </div>
      </div>

      {/* Strengths & Gaps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✅ Strengths
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(coach.strengths ?? []).map((s: string, i: number) => (
              <li key={i} style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', paddingLeft: '12px', borderLeft: '2px solid #10b981', lineHeight: 1.5 }}>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f87171', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚨 Critical Gaps
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(coach.critical_gaps ?? []).map((s: string, i: number) => (
              <li key={i} style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', paddingLeft: '12px', borderLeft: '2px solid #ef4444', lineHeight: 1.5 }}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Parser metadata */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '14px', color: 'var(--color-text-muted)' }}>
          📋 Resume Metadata
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: 'Words', value: parser.word_count },
            { label: 'Sections', value: parser.section_count },
            { label: 'Quality', value: `${parser.quality_score}/100` },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>{value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {(parser.sections_found ?? []).map((s: string) => (
            <span key={s} className="badge badge-purple" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Radar */}
      <div className="glass-card">
        <SkillRadar radarData={result.agents.skill.result.radar_data ?? {}} />
      </div>
    </div>
  )
}

function SkillsTab({ result }: { result: any }) {
  const skill = result.agents.skill.result
  const rag = result.agents.rag.result

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Matched skills */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399', marginBottom: '16px' }}>
          ✅ Skills Detected ({skill.matched_skills?.length ?? 0})
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(skill.matched_skills ?? []).map((s: string) => (
            <span key={s} className="badge badge-green" style={{ fontSize: '0.78rem' }}>{s}</span>
          ))}
        </div>
        {skill.fuzzy_matched?.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              🔍 Fuzzy matched (possible typos/abbreviations):
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(skill.fuzzy_matched ?? []).map((s: string) => (
                <span key={s} className="badge badge-amber" style={{ fontSize: '0.75rem' }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Missing critical skills */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f87171', marginBottom: '16px' }}>
          🚨 Critical Skills Missing ({skill.missing_skills?.length ?? 0})
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(skill.missing_skills ?? []).map((s: string) => (
            <span key={s} className="badge badge-red" style={{ fontSize: '0.78rem' }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Priority breakdown */}
      {skill.priority_breakdown && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px' }}>
            🎯 Priority Breakdown
          </h3>
          {Object.entries(skill.priority_breakdown).map(([tier, skills]: [string, any]) => (
            <div key={tier} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{tier}</span>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div className="progress-fill" style={{
                    width: `${(skills.length / Math.max(1, (skill.matched_skills ?? []).length)) * 100}%`,
                  }} />
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', minWidth: '24px', textAlign: 'right' }}>
                  {skills.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(skills as string[]).map((s: string) => (
                  <span key={s} className="badge badge-purple" style={{ fontSize: '0.72rem' }}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RAG keyword gaps */}
      {rag.result?.keyword_gaps?.length > 0 && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: '#fcd34d' }}>
            🔍 JD Keyword Gaps (from RAG retrieval)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            Terms found in the Cognizant JD knowledge base but absent from your resume:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {rag.result.keyword_gaps.map((kw: string) => (
              <span key={kw} className="badge badge-amber" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{kw}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CoachingTab({ result }: { result: any }) {
  const coach = result.agents.coach.result

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Action items */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '20px' }}>
          🎯 Action Plan
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(coach.action_items ?? []).map((item: any, i: number) => (
            <div key={i} style={{
              display: 'flex', gap: '14px', alignItems: 'flex-start',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--color-border)',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.78rem', fontWeight: 700, flexShrink: 0, color: '#fff',
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span className={`badge ${PRIORITY_COLORS[item.priority] ?? 'badge-purple'}`} style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                    {item.priority} priority
                  </span>
                  <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>⏱ {item.timeline}</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text)', marginBottom: '4px', lineHeight: 1.5 }}>{item.action}</p>
                {item.resource && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>Resource: {item.resource}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interview tips */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', color: '#a78bfa' }}>
          💡 Interview Tips — Cognizant ACE
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(coach.interview_tips ?? []).map((tip: string, i: number) => (
            <div key={i} style={{
              display: 'flex', gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.2)',
            }}>
              <span style={{ color: 'var(--color-primary-light)', fontSize: '0.9rem', flexShrink: 0 }}>→</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resume improvements */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', color: '#34d399' }}>
          📝 Resume Improvements
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(coach.resume_improvements ?? []).map((imp: string, i: number) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ color: '#34d399', fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>✓</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{imp}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      {coach.certifications_to_earn?.length > 0 && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: '#fcd34d' }}>
            🏆 Certifications to Earn
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(coach.certifications_to_earn ?? []).map((cert: string, i: number) => (
              <div key={i} className="badge badge-amber" style={{ display: 'inline-flex', width: 'fit-content', fontSize: '0.82rem', padding: '6px 14px' }}>
                🎓 {cert}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DSATab({ result }: { result: any }) {
  const skill = result.agents.skill.result
  const rag = result.agents.rag.result
  const timing = {
    parser: result.agents.parser.duration_ms,
    skill: result.agents.skill.duration_ms,
    rag: result.agents.rag.duration_ms,
    coach: result.agents.coach.duration_ms,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Trie stats */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px' }}>
          🌳 Trie Data Structure Stats
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Trie Size (skills indexed)', value: skill.trie_stats?.trie_size, color: '#7c3aed' },
            { label: 'Exact Matches (O(m) lookup)', value: skill.trie_stats?.exact_matches, color: '#10b981' },
            { label: 'Fuzzy Matches (Levenshtein)', value: skill.trie_stats?.fuzzy_matches, color: '#f59e0b' },
            { label: 'Total Skills Detected', value: skill.trie_stats?.total_matched, color: '#2563eb' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value ?? 0}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{
          padding: '14px', borderRadius: 'var(--radius-md)',
          background: 'rgba(124,58,237,0.06)',
          border: '1px solid rgba(124,58,237,0.2)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem', color: 'var(--color-primary-light)',
        }}>
          Algorithm: {skill.trie_stats?.algorithm ?? 'Trie O(m) + Levenshtein DP'}
        </div>
      </div>

      {/* RAG retrieval stats */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px' }}>
          🔍 RAG Retrieval Stats
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
          {[
            { label: 'JD Chunks Indexed', value: rag.result?.retrieval_stats?.chunks_indexed, color: '#7c3aed' },
            { label: 'Top-K Retrieved', value: rag.result?.retrieval_stats?.top_k_retrieved, color: '#2563eb' },
            { label: 'JD Similarity Score', value: `${rag.result?.jd_similarity_score ?? 0}%`, color: '#10b981' },
            { label: 'Vectoriser Features', value: rag.result?.retrieval_stats?.vectoriser_features, color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value ?? 0}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-text-subtle)', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          Algorithm: {rag.result?.retrieval_stats?.algorithm ?? 'TF-IDF cosine similarity'}
        </div>
        {rag.result?.retrieval_stats?.similarity_scores && (
          <div style={{ marginTop: '14px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Top-K similarity scores:</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {rag.result.retrieval_stats.similarity_scores.map((score: number, i: number) => (
                <div key={i} style={{ flex: 1, height: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '100%', background: 'rgba(124,58,237,0.8)', borderRadius: '3px', height: `${Math.max(score, 4)}%`, minHeight: '4px', maxHeight: '28px' }} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Agent timing */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px' }}>
          ⏱ Agent Execution Timeline
        </h3>
        {Object.entries(timing).map(([agent, ms]) => {
          const total = Object.values(timing).reduce((a: number, b: any) => a + (b ?? 0), 0)
          const pct = total > 0 ? ((ms ?? 0) / total * 100) : 0
          return (
            <div key={agent} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{agent} Agent</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary-light)' }}>{ms ?? 0}ms</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Total Processing Time</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 700 }}>
            {result.processing_ms}ms
          </span>
        </div>
      </div>
    </div>
  )
}

export default function AnalysisResult({ result }: AnalysisResultProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="badge badge-green" style={{ fontSize: '0.85rem', padding: '8px 20px', marginBottom: '16px' }}>
          ✓ Analysis Complete
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
          Your Resume Report
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Session <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-subtle)', fontSize: '0.78rem' }}>#{result.session_id?.slice(0, 8)}</span>
          {' · '}Processed in <strong style={{ color: 'var(--color-accent)' }}>{result.processing_ms}ms</strong>
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px', overflowX: 'auto', paddingBottom: '4px' }}>
        <div className="tabs-container">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              className={`tab-btn ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
              id={`tab-${id}`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="animate-fade">
        {activeTab === 'overview'  && <OverviewTab result={result} />}
        {activeTab === 'skills'    && <SkillsTab result={result} />}
        {activeTab === 'coaching'  && <CoachingTab result={result} />}
        {activeTab === 'dsa'       && <DSATab result={result} />}
      </div>
    </div>
  )
}
