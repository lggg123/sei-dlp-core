import React from 'react'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="docs-layout">
      {children}
    </div>
  )
}

export const metadata = {
  title: 'Yield Delta Documentation',
  description: 'Complete guide to Yield Delta - AI-powered yield optimization on SEI Network',
}