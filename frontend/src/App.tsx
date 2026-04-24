import React, { useState, useRef, useCallback } from 'react'
import Hero from './components/Hero'
import UploadZone from './components/UploadZone'
import AgentTimeline, { AgentStatus } from './components/AgentTimeline'
import AnalysisResult from './components/AnalysisResult'
import './index.css'

type AppState = 'idle' | 'analyzing' | 'complete' | 'error'

const INITIAL_AGENTS: AgentStatus = {
  parser: 'idle',
  skill: 'idle',
  rag: 'idle',
  coach: 'idle',
}

// Agent simulation timing (ms delay between activations)
const AGENT_DELAYS = [0, 600, 1400, 2400]
const AGENT_KEYS: (keyof AgentStatus)[] = ['parser', 'skill', 'rag', 'coach']

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [agents, setAgents] = useState<AgentStatus>(INITIAL_AGENTS)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [agentDurations, setAgentDurations] = useState<Record<string, number>>({})

  const uploadSectionRef = useRef<HTMLDivElement>(null)
  const resultSectionRef = useRef<HTMLDivElement>(null)
  const apiCallDone = useRef(false)

  const scrollToUpload = useCallback(() => {
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const scrollToResults = useCallback(() => {
    setTimeout(() => {
      resultSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }, [])

  const handleFileSelect = useCallback(async (file: File) => {
    setAppState('analyzing')
    setAgents(INITIAL_AGENTS)
    setAnalysisResult(null)
    setErrorMsg(null)
    setAgentDurations({})
    apiCallDone.current = false

    // Simulate agent activations client-side while API call runs
    AGENT_KEYS.forEach((key, idx) => {
      // Mark as 'running' at staggered intervals
      setTimeout(() => {
        setAgents(prev => {
          // If previous agent exists, mark it complete (if API not yet done)
          const updated = { ...prev }
          if (idx > 0 && !apiCallDone.current) {
            updated[AGENT_KEYS[idx - 1]] = 'running' // keep running until api responds
          }
          updated[key] = 'running'
          return updated
        })
      }, AGENT_DELAYS[idx])
    })

    // Actual API call
    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      apiCallDone.current = true

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Network error' }))
        throw new Error(errData.error ?? `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error ?? 'Analysis failed')
      }

      // Mark all agents complete
      setAgents({ parser: 'complete', skill: 'complete', rag: 'complete', coach: 'complete' })
      setAgentDurations({
        parser: data.agents?.parser?.duration_ms,
        skill: data.agents?.skill?.duration_ms,
        rag: data.agents?.rag?.duration_ms,
        coach: data.agents?.coach?.duration_ms,
      })

      setAnalysisResult(data)
      setAppState('complete')
      scrollToResults()
    } catch (err: any) {
      apiCallDone.current = true
      setAgents(prev => ({
        ...prev,
        coach: 'error',
      }))
      setErrorMsg(err.message ?? 'An unexpected error occurred.')
      setAppState('error')
    }
  }, [scrollToResults])

  const isAnalyzing = appState === 'analyzing'

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Sticky nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(8,8,16,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 24px',
        height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.3rem' }}>🤖</span>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>
            Resume<span className="gradient-text">IQ</span> Pro
          </span>
          <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '3px 8px' }}>v2.0</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a
            href="https://github.com/omborekar/AI_Resume_Analyzer_and_suggestion_using_gemini_API"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}
          >
            GitHub ↗
          </a>
          <button
            className="btn btn-primary"
            onClick={scrollToUpload}
            style={{ fontSize: '0.82rem', padding: '8px 18px' }}
          >
            Analyze Resume
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ paddingTop: '60px' }}>
        <Hero onScrollToUpload={scrollToUpload} />
      </div>

      {/* Upload + Agent section */}
      <section ref={uploadSectionRef} style={{
        maxWidth: '860px', margin: '0 auto',
        padding: '80px 24px',
        display: 'flex', flexDirection: 'column', gap: '48px',
      }}>
        {/* Upload heading */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>
            Upload Your <span className="gradient-text">Resume</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Supports PDF and DOCX — analysed by a 4-agent AI pipeline in seconds
          </p>
        </div>

        {/* Upload Zone */}
        <UploadZone onFileSelect={handleFileSelect} isLoading={isAnalyzing} />

        {/* Agent Timeline (show during analysis or after complete) */}
        {(isAnalyzing || appState === 'complete' || appState === 'error') && (
          <div className="animate-fade-up">
            <AgentTimeline agents={agents} durations={agentDurations} />
          </div>
        )}

        {/* Error */}
        {appState === 'error' && errorMsg && (
          <div className="glass-card animate-fade-up" style={{
            padding: '20px 24px',
            borderColor: 'rgba(239,68,68,0.4)',
            background: 'rgba(239,68,68,0.06)',
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.3rem' }}>⚠️</span>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--color-danger)', marginBottom: '4px' }}>Analysis Failed</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{errorMsg}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', marginTop: '8px' }}>
                  Make sure your <code style={{ fontFamily: 'var(--font-mono)' }}>GEMINI_API_KEY</code> is set in <code style={{ fontFamily: 'var(--font-mono)' }}>.env</code> and the Flask backend is running.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Results */}
      {appState === 'complete' && analysisResult && (
        <section ref={resultSectionRef} style={{
          maxWidth: '860px', margin: '0 auto',
          padding: '0 24px 80px',
        }}>
          <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: '48px' }} />
          <AnalysisResult result={analysisResult} />
        </section>
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '32px 24px',
        textAlign: 'center',
        color: 'var(--color-text-subtle)',
        fontSize: '0.8rem',
      }}>
        <p style={{ marginBottom: '8px' }}>
          ResumeIQ Pro · Built for <span style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>Cognizant ACE 12 LPA</span> fresher applications
        </p>
        <p>
          Stack: React + TypeScript · Flask · Gemini 2.0 Flash · TF-IDF RAG · Trie DSA · Docker · GCP Cloud Run
        </p>
      </footer>
    </div>
  )
}
