import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div 
        style={{
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, #00f5d4, #9b5de5)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: '#000',
          fontSize: '16px'
        }}
      >
        Δ
      </div>
      <span style={{ fontWeight: 'bold', fontSize: '20px' }}>Yield Delta</span>
    </div>
  ),
  project: {
    link: 'https://github.com/your-org/sei-dlp-core',
  },
  chat: {
    link: 'https://discord.gg/sei',
    icon: (
      <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
        <path d="M216 40H40a16 16 0 0 0-16 16v144a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16Z"/>
      </svg>
    )
  },
  docsRepositoryBase: 'https://github.com/your-org/sei-dlp-core/tree/main',
  footer: {
    text: '© 2024 Yield Delta. AI-Powered DeFi on SEI Network.',
  },
  search: {
    placeholder: 'Search documentation...'
  },
  editLink: {
    text: 'Edit this page on GitHub →'
  },
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'feedback'
  },
  sidebar: {
    titleComponent({ title, type }) {
      if (type === 'separator') {
        return <span className="cursor-default">{title}</span>
      }
      return <>{title}</>
    },
    defaultMenuCollapseLevel: 1,
    toggleButton: true
  },
  toc: {
    backToTop: true
  },
  gitTimestamp: ({ timestamp }) => (
    <div style={{ fontSize: '12px', color: '#666' }}>
      Last updated: {timestamp.toLocaleDateString()}
    </div>
  ),
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Yield Delta Documentation" />
      <meta property="og:description" content="Complete guide to Yield Delta - AI-powered yield optimization on SEI Network" />
      <meta property="og:image" content="/api/og?title=Yield%20Delta&subtitle=Documentation" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Yield Delta Documentation" />
      <meta name="twitter:description" content="Complete guide to AI-powered yield optimization on SEI Network" />
      <link rel="icon" href="/favicon.ico" />
    </>
  ),
  primaryHue: 180, // Cyan color for SEI branding
  primarySaturation: 100,
  banner: {
    key: 'demo-mode',
    text: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        🎭 Demo Mode Active - 
        <a 
          href="/docs/demo-mode" 
          style={{ textDecoration: 'underline' }}
        >
          Learn about demo features →
        </a>
      </div>
    )
  },
  navbar: {
    extraContent: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <a 
          href="/vaults" 
          style={{
            padding: '6px 12px',
            background: 'linear-gradient(135deg, #00f5d4, #9b5de5)',
            color: '#000',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '14px',
            textDecoration: 'none'
          }}
        >
          Launch App
        </a>
      </div>
    )
  }
}

export default config