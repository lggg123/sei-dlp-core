"use client"

import { useEffect } from "react"
import HeroSection from "@/components/hero-section"
import VaultSystem from "@/components/vault-system"
import AIWorkflow from "@/components/ai-workflow"
import PerformanceGlobe from "@/components/performance-globe"
import { initializeGSAP } from "@/lib/gsap-config"

export default function Home() {
  useEffect(() => {
    initializeGSAP()
  }, [])

  return (
    <main className="min-h-screen bg-[#0a0e29] text-white overflow-x-hidden">
      <HeroSection />
      <VaultSystem />
      <AIWorkflow />
      <PerformanceGlobe />
    </main>
  )
}