import React, { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface SkillRadarProps {
  radarData: Record<string, number>
}

export default function SkillRadar({ radarData }: SkillRadarProps) {
  const labels = Object.keys(radarData)
  const values = Object.values(radarData)

  const data = {
    labels,
    datasets: [
      {
        label: 'Your Profile',
        data: values,
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
        borderColor: 'rgba(124, 58, 237, 0.9)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(124, 58, 237, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(124, 58, 237, 1)',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Cognizant ACE Target',
        data: [85, 80, 90, 80, 75, 85],
        backgroundColor: 'rgba(37, 99, 235, 0.07)',
        borderColor: 'rgba(37, 99, 235, 0.4)',
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointBackgroundColor: 'rgba(37, 99, 235, 0.6)',
        pointBorderColor: '#fff',
        pointRadius: 3,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      duration: 1200,
      easing: 'easeInOutQuart' as const,
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          color: 'rgba(148, 163, 184, 0.6)',
          font: { size: 10, family: 'Inter' },
          backdropColor: 'transparent',
          showLabelBackdrop: false,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.06)',
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.06)',
        },
        pointLabels: {
          color: '#94a3b8',
          font: { size: 12, weight: '600' as const, family: 'Inter' },
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8',
          font: { size: 12, family: 'Inter' },
          padding: 20,
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(8, 8, 16, 0.95)',
        borderColor: 'rgba(124, 58, 237, 0.4)',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        padding: 12,
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.r}%`,
        },
      },
    },
  }

  return (
    <div style={{ padding: '28px', textAlign: 'center' }}>
      <h3 style={{ marginBottom: '8px', fontSize: '1.1rem', fontWeight: 700 }}>
        Competency Radar
      </h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginBottom: '24px' }}>
        Your skill coverage vs Cognizant ACE benchmark across 6 domains
      </p>

      <div style={{ maxWidth: '440px', margin: '0 auto' }}>
        <Radar data={data} options={options} />
      </div>

      {/* Score breakdown table */}
      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {labels.map((label, i) => (
          <div key={label} style={{
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              fontSize: '1.1rem', fontWeight: 800,
              color: values[i] >= 60 ? '#34d399' : values[i] >= 30 ? '#fcd34d' : '#f87171',
            }}>
              {values[i]}%
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
