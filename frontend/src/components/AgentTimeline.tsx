import React from 'react'

export interface AgentStatus {
  parser: 'idle' | 'running' | 'complete' | 'error'
  skill: 'idle' | 'running' | 'complete' | 'error'
  rag: 'idle' | 'running' | 'complete' | 'error'
  coach: 'idle' | 'running' | 'complete' | 'error'
}

interface AgentTimelineProps {
  agents: AgentStatus
  durations?: { parser?: number; skill?: number; rag?: number; coach?: number }
}

const AGENT_CONFIG = [
  {
    key: 'parser' as const,
    icon: '📋',
    name: 'Parser Agent',
    description: 'Extracts text from PDF/DOCX, detects sections, chunks for RAG',
    tech: 'pdfminer · python-docx',
    color: '#7c3aed',
  },
  {
    key: 'skill' as const,
    icon: '⚡',
    name: 'Skill Agent',
    description: 'Trie O(m) matching + Levenshtein fuzzy lookup across 80+ skills',
    tech: 'Trie DSA · Edit Distance DP',
    color: '#2563eb',
  },
  {
    key: 'rag' as const,
    icon: '🔍',
    name: 'RAG Agent',
    description: 'TF-IDF retrieval over Cognizant JD knowledge base for gap analysis',
    tech: 'TF-IDF · Cosine Similarity',
    color: '#059669',
  },
  {
    key: 'coach' as const,
    icon: '🤖',
    name: 'Coach Agent',
    description: 'Chain-of-thought + few-shot Gemini prompt with structured JSON output',
    tech: 'Gemini 2.0 Flash · Prompt Eng.',
    color: '#d97706',
  },
]

function StatusIcon({ status, color }: { status: AgentStatus[keyof AgentStatus]; color: string }) {
  if (status === 'complete') {
    return (
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: 'rgba(16,185,129,0.15)',
        border: '2px solid #10b981',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', flexShrink: 0,
      }}>
        ✓
      </div>
    )
  }
  if (status === 'running') {
    return (
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        border: `2px solid ${color}`,
        borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite',
        flexShrink: 0,
      }} />
    )
  }
  if (status === 'error') {
    return (
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: 'rgba(239,68,68,0.15)',
        border: '2px solid #ef4444',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', flexShrink: 0,
      }}>
        ✗
      </div>
    )
  }
  // idle
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%',
      background: 'rgba(255,255,255,0.04)',
      border: '2px solid rgba(255,255,255,0.1)',
      flexShrink: 0,
    }} />
  )
}

export default function AgentTimeline({ agents, durations = {} }: AgentTimelineProps) {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '28px', fontSize: '1.1rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
        🤖 Agentic AI Pipeline
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {AGENT_CONFIG.map((agent, idx) => {
          const status = agents[agent.key]
          const isActive = status === 'running'
          const isDone = status === 'complete'
          const isIdle = status === 'idle'
          const durationMs = durations[agent.key]

          return (
            <div key={agent.key} style={{ display: 'flex', gap: '0', position: 'relative' }}>
              {/* Connector line */}
              {idx < AGENT_CONFIG.length - 1 && (
                <div style={{
                  position: 'absolute',
                  left: '17px',
                  top: '60px',
                  width: '2px',
                  height: 'calc(100% - 24px)',
                  background: isDone
                    ? 'linear-gradient(to bottom, #10b981, rgba(16,185,129,0.2))'
                    : 'rgba(255,255,255,0.07)',
                  transition: 'background 0.5s ease',
                  zIndex: 0,
                }} />
              )}

              {/* Agent card */}
              <div style={{
                display: 'flex', gap: '16px', alignItems: 'flex-start',
                padding: '20px 20px 20px 0',
                position: 'relative', zIndex: 1,
                opacity: isIdle ? 0.45 : 1,
                transition: 'opacity 0.4s ease',
              }}>
                {/* Status icon */}
                <div style={{ paddingTop: '2px' }}>
                  <StatusIcon status={status} color={agent.color} />
                </div>

                {/* Content */}
                <div style={{
                  flex: 1,
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive
                    ? `linear-gradient(135deg, ${agent.color}15, ${agent.color}08)`
                    : isDone
                    ? 'rgba(16,185,129,0.05)'
                    : 'var(--color-surface)',
                  border: `1px solid ${isActive ? agent.color + '60' : isDone ? 'rgba(16,185,129,0.2)' : 'var(--color-border)'}`,
                  transition: 'all 0.4s ease',
                  boxShadow: isActive ? `0 0 20px ${agent.color}25` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{agent.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isDone ? '#34d399' : isActive ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                        {agent.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {durationMs && isDone && (
                        <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                          {durationMs}ms
                        </span>
                      )}
                      {isActive && (
                        <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                          Running…
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '8px', lineHeight: 1.5 }}>
                    {agent.description}
                  </p>

                  <span style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: isActive ? agent.color : 'var(--color-text-subtle)',
                    transition: 'color 0.3s ease',
                  }}>
                    {'// '}{agent.tech}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
