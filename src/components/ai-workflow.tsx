"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export default function AIWorkflow() {
  const containerRef = useRef<HTMLDivElement>(null)

  const workflowSteps = [
    { id: "deposit", label: "User Deposit", color: "#00f5d4" },
    { id: "analysis", label: "AI Analysis", color: "#9b5de5" },
    { id: "dex", label: "DEX Liquidity", color: "#00f5d4" },
    { id: "perps", label: "Perps Market", color: "#9b5de5" },
    { id: "fees", label: "Fee Generation", color: "#00f5d4" },
    { id: "funding", label: "Funding Capture", color: "#9b5de5" },
    { id: "compound", label: "Compounding Engine", color: "#ff206e" },
  ]

  useEffect(() => {
    if (!containerRef.current) return

    // Create flowing animation between steps
    const createFlowAnimation = () => {
      const tl = gsap.timeline({ paused: true })

      workflowSteps.forEach((step, index) => {
        if (index < workflowSteps.length - 1) {
          tl.fromTo(
            `.flow-line-${index}`,
            { scaleX: 0 },
            { scaleX: 1, duration: 0.8, ease: "power2.out" },
            index * 0.5,
          ).fromTo(
            `.step-${index + 1}`,
            { opacity: 0, scale: 0.5 },
            { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" },
            index * 0.5 + 0.4,
          )
        }
      })

      return tl
    }

    const flowTL = createFlowAnimation()

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 60%",
      onEnter: () => {
        flowTL.play()
      },
    })

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-transparent to-gray-900/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-bold text-center mb-16 bg-gradient-to-r from-[#00f5d4] to-[#9b5de5] bg-clip-text text-transparent">
          AI-Powered Capital Flow
        </h2>

        <div ref={containerRef} className="relative">
          {/* ElizaOS AI Character */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00f5d4] to-[#9b5de5] rounded-full opacity-20 animate-pulse"></div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`step-${index} w-20 h-20 rounded-full border-2 flex items-center justify-center text-xs font-bold text-center p-2 transition-all duration-300 hover:scale-110`}
                  style={{
                    borderColor: step.color,
                    backgroundColor: `${step.color}20`,
                    color: step.color,
                  }}
                >
                  {step.label}
                </div>

                {index < workflowSteps.length - 1 && (
                  <div className="hidden md:block absolute w-16 h-0.5 bg-gradient-to-r from-[#00f5d4] to-[#9b5de5] transform translate-x-20 origin-left">
                    <div
                      className={`flow-line-${index} w-full h-full bg-gradient-to-r from-[#00f5d4] to-[#9b5de5] transform scale-x-0`}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-block bg-gradient-to-r from-[#00f5d4]/20 to-[#9b5de5]/20 rounded-lg p-6 border border-[#00f5d4]/30">
              <h3 className="text-xl font-bold text-[#00f5d4] mb-2">ElizaOS Agent</h3>
              <p className="text-gray-300">Overseeing optimal capital allocation in real-time</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
