"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { gsap } from "gsap"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize Three.js scene optimized for SEI's 400ms finality
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)

    sceneRef.current = scene
    rendererRef.current = renderer
    cameraRef.current = camera

    // Create DNA helix particles - representing AI-driven liquidity flows
    const createDNAHelix = () => {
      const geometry = new THREE.BufferGeometry()
      const positions: number[] = [] // ✅ Explicit type annotation
      const colors: number[] = []    // ✅ Explicit type annotation

      for (let i = 0; i < 2000; i++) {
        const t = (i / 2000) * Math.PI * 8
        const radius = 2 + Math.sin(t * 0.5) * 0.5

        // First strand - AI blue liquidity path
        positions.push(Math.cos(t) * radius, t * 0.3 - 5, Math.sin(t) * radius)

        // Second strand - SEI purple yield path
        positions.push(Math.cos(t + Math.PI) * radius, t * 0.3 - 5, Math.sin(t + Math.PI) * radius)

        // SEI DLP brand colors
        colors.push(0, 0.96, 0.83) // #00f5d4 - ai-blue
        colors.push(0.61, 0.36, 0.9) // #9b5de5 - sei-purple
      }

      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))

      const material = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      })

      return new THREE.Points(geometry, material)
    }

    const dnaHelix = createDNAHelix()
    scene.add(dnaHelix)

    // Create floating vault particles
    const createVaultParticles = () => {
      const geometry = new THREE.BufferGeometry()
      const positions: number[] = [] // ✅ Explicit type annotation
      const colors: number[] = []    // ✅ Explicit type annotation

      for (let i = 0; i < 500; i++) {
        positions.push((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20)
        colors.push(0, 0.96, 0.83) // AI blue vault indicators
      }

      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))

      const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
      })

      return new THREE.Points(geometry, material)
    }

    const vaultParticles = createVaultParticles()
    scene.add(vaultParticles)

    camera.position.z = 10

    // Animation loop - optimized for SEI's 400ms finality
    const animate = () => {
      requestAnimationFrame(animate)

      if (dnaHelix) {
        dnaHelix.rotation.y += 0.01
        dnaHelix.rotation.x += 0.005
      }

      if (vaultParticles) {
        vaultParticles.rotation.y += 0.002
      }

      renderer.render(scene, camera)
    }
    animate()

    // GSAP animations
    const tl = gsap.timeline({ delay: 0.5 })

    tl.from(".hero-title", {
      opacity: 0,
      y: 100,
      duration: 1.5,
      ease: "power3.out",
    })
      .from(
        ".hero-subtitle",
        {
          opacity: 0,
          y: 50,
          duration: 1,
          ease: "power2.out",
        },
        "-=0.8",
      )
      .from(
        ".hero-cta",
        {
          opacity: 0,
          scale: 0.8,
          duration: 0.8,
          ease: "back.out(1.7)",
        },
        "-=0.5",
      )

    // Typewriter effect for SEI DLP tagline
    const tagline = "Your Liquidity, Evolved"
    const taglineElement = document.querySelector(".typewriter")
    if (taglineElement) {
      let i = 0
      const typeWriter = () => {
        if (i < tagline.length) {
          taglineElement.textContent += tagline.charAt(i)
          i++
          setTimeout(typeWriter, 100)
        }
      }
      setTimeout(typeWriter, 2000)
    }

    // Handle resize for responsive design
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <h1 className="hero-title text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-[#00f5d4] to-[#9b5de5] bg-clip-text text-transparent">
          Dynamic Liquidity Protocol
        </h1>

        <p className="hero-subtitle text-xl md:text-2xl mb-4 text-gray-300">AI-Powered DeFi on SEI</p>

        <div className="typewriter text-2xl md:text-3xl mb-8 text-[#00f5d4] font-mono h-12"></div>

        <Button
          className="hero-cta bg-[#00f5d4] hover:bg-[#00d4b8] text-black font-bold px-8 py-4 text-lg rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#00f5d4]/50"
          style={{
            animation: "pulse-glow 2s infinite",
          }}
        >
          Enter the Protocol
        </Button>
      </div>

      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 245, 212, 0.5); }
          50% { box-shadow: 0 0 40px rgba(0, 245, 212, 0.8); }
        }
      `}</style>
    </section>
  )
}
