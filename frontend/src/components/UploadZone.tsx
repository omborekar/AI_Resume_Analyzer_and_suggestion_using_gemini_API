import React, { useCallback, useRef, useState } from 'react'

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  isLoading: boolean
}

const ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export default function UploadZone({ onFileSelect, isLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateAndSelect = useCallback((file: File) => {
    setError(null)
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a PDF or DOCX file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10 MB.')
      return
    }
    setSelectedFile(file)
    onFileSelect(file)
  }, [onFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSelect(file)
  }, [validateAndSelect])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndSelect(file)
  }

  const ext = selectedFile?.name.split('.').pop()?.toUpperCase() ?? ''
  const sizeMB = selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : ''

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--color-primary)' : error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-xl)',
          padding: '56px 32px',
          textAlign: 'center',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          background: isDragging
            ? 'rgba(124,58,237,0.07)'
            : 'var(--color-surface)',
          transition: 'all var(--transition-base)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow effect when dragging */}
        {isDragging && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          style={{ display: 'none' }}
          onChange={handleChange}
          disabled={isLoading}
          id="resume-upload"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            {/* Animated ring spinner */}
            <div style={{
              width: '64px', height: '64px',
              borderRadius: '50%',
              border: '3px solid rgba(124,58,237,0.2)',
              borderTopColor: 'var(--color-primary)',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{ color: 'var(--color-primary-light)', fontWeight: 600, fontSize: '1.1rem' }}>
              Analysing resume…
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              4-agent pipeline is running
            </p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            <div style={{
              width: '64px', height: '64px', borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', marginBottom: '4px',
              animation: 'float 3s ease-in-out infinite',
            }}>
              📄
            </div>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text)' }}>
              {selectedFile.name}
            </p>
            <div className="flex gap-2">
              <span className="badge badge-purple">{ext}</span>
              <span className="badge badge-blue">{sizeMB} MB</span>
              <span className="badge badge-green">✓ Ready</span>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
              Click to replace file
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div style={{
              width: '72px', height: '72px',
              borderRadius: '50%',
              background: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(124,58,237,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem',
              animation: 'float 3s ease-in-out infinite',
            }}>
              📂
            </div>
            <div>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>
                Drop your resume here
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                or <span style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>browse files</span> — PDF or DOCX, up to 10 MB
              </p>
            </div>

            {/* Feature pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
              {['🧠 Gemini AI', '🔍 RAG Analysis', '⚡ Trie DSA', '☁️ Cloud-ready'].map(f => (
                <span key={f} style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                }}>{f}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: '12px', padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: 'var(--color-danger)',
          fontSize: '0.88rem',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}
