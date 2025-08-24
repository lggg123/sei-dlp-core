import React from 'react'
import DocsSidebar from '@/components/DocsSidebar'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Responsive Layout Strategy:
          - Mobile (≤640px): Stacked, hamburger menu, smaller padding
          - Tablet Portrait (641px-768px): Stacked, hamburger menu, medium padding  
          - Tablet Landscape (769px-1023px): Stacked, hamburger menu, larger padding
          - Desktop (≥1024px): Side-by-side, visible sidebar */}
      <div className="lg:flex">
        <DocsSidebar />
        <main className="flex-1">
          {/* Responsive spacing with tablet considerations:
              - Mobile: pt-16 (hamburger space), px-4
              - Tablet Portrait: pt-16, px-6
              - Tablet Landscape: pt-16, px-8  
              - Desktop: pt-8, px-8, pl-6, ml-64 (sidebar compensation) */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-16 pb-8 lg:pt-8 lg:px-8 lg:pl-6 lg:ml-64">
            {/* Enhanced typography scaling for different screen sizes */}
            <div className="prose prose-neutral dark:prose-invert max-w-none prose-sm sm:prose-base lg:prose-lg">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Yield Delta Documentation',
  description: 'Complete guide to Yield Delta - AI-powered yield optimization on SEI Network',
}