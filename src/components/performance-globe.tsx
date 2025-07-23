"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export default function PerformanceGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<THREE.Mesh>()

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })

    renderer.setSize(containerRef.current.offsetWidth, 600)
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)

    // Create Earth globe
    const globeGeometry = new THREE.SphereGeometry(2, 64, 64)
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.8,
      wireframe: true,
    })

    const globe = new THREE.Mesh(globeGeometry, globeMaterial)
    scene.add(globe)
    globeRef.current = globe

    // Create data streams (traditional LP - red, shrinking)
    const createDataStreams = (color: number, count: number, expanding: boolean) => {
      const group = new THREE.Group()

      for (let i = 0; i < count; i++) {
        const streamGeometry = new THREE.CylinderGeometry(0.02, 0.02, 4, 8)
        const streamMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.6,
        })

        const stream = new THREE.Mesh(streamGeometry, streamMaterial)

        // Random positioning around globe
        const phi = Math.random() * Math.PI * 2
        const theta = Math.random() * Math.PI
        const radius = 3

        stream.position.set(
          radius * Math.sin(theta) * Math.cos(phi),
          radius * Math.cos(theta),
          radius * Math.sin(theta) * Math.sin(phi),
        )

        stream.lookAt(globe.position)

        if (expanding) {
          gsap.to(stream.scale, {
            x: 1.5,
            y: 1.5,
            z: 1.5,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "power2.inOut",
            delay: Math.random() * 2,
          })
        } else {
          gsap.to(stream.scale, {
            x: 0.5,
            y: 0.5,
            z: 0.5,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "power2.inOut",
            delay: Math.random() * 2,
          })
        }

        group.add(stream)
      }

      return group
    }

    const traditionalStreams = createDataStreams(0xff0000, 20, false) // Red, shrinking
    const dlpStreams = createDataStreams(0x00f5d4, 30, true) // Blue, expanding

    scene.add(traditionalStreams)
    scene.add(dlpStreams)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x00f5d4, 1, 100)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    camera.position.z = 8

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      if (globe) {
        globe.rotation.y += 0.005
        globe.rotation.x += 0.002
      }

      traditionalStreams.rotation.y += 0.01
      dlpStreams.rotation.y -= 0.01

      renderer.render(scene, camera)
    }
    animate()

    // ScrollTrigger animation
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 70%",
      onEnter: () => {
        gsap.fromTo(globe.rotation, { x: 0, y: 0 }, { x: 0.3, y: Math.PI * 2, duration: 3, ease: "power2.out" })
      },
    })

    return () => {
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-bold text-center mb-16 bg-gradient-to-r from-[#00f5d4] to-[#9b5de5] bg-clip-text text-transparent">
          Performance Comparison
        </h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div ref={containerRef} className="h-[600px]" />

          <div className="space-y-8">
            <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg p-6 border border-red-500/30">
              <h3 className="text-xl font-bold text-red-400 mb-4">Traditional LP</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• High impermanent loss exposure</li>
                <li>• Manual rebalancing required</li>
                <li>• Limited yield optimization</li>
                <li>• Single DEX dependency</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-[#00f5d4]/20 to-[#9b5de5]/20 rounded-lg p-6 border border-[#00f5d4]/30">
              <h3 className="text-xl font-bold text-[#00f5d4] mb-4">DLP Vaults</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• 62% less impermanent loss</li>
                <li>• AI-powered optimization</li>
                <li>• Multi-strategy yield farming</li>
                <li>• Cross-DEX arbitrage</li>
              </ul>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-[#00f5d4] mb-2">+340%</div>
              <div className="text-gray-400">Average yield improvement</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
