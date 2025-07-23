"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

gsap.registerPlugin(ScrollTrigger)

export default function VaultSystem() {
  const containerRef = useRef<HTMLDivElement>(null)
  const vaultsRef = useRef<THREE.Group[]>([])

  const vaultData = [
    {
      name: "StableMax Vault",
      apy: "12.5%",
      color: 0x00f5d4,
      description: "Crystal structure optimization",
      risk: "Low",
    },
    {
      name: "SEI Hypergrowth Vault",
      apy: "45.8%",
      color: 0x9b5de5,
      description: "Pulsing energy core",
      risk: "Medium",
    },
    {
      name: "BlueChip Vault",
      apy: "28.3%",
      color: 0xff206e,
      description: "Interlocking blockchain rings",
      risk: "High",
    },
  ]

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })

    renderer.setSize(containerRef.current.offsetWidth, 600)
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)

    // Create vault geometries
    const createVault = (color: number, position: THREE.Vector3, type: string) => {
      const group = new THREE.Group()

      let geometry: THREE.BufferGeometry

      switch (type) {
        case "crystal":
          geometry = new THREE.OctahedronGeometry(1, 2)
          break
        case "energy":
          geometry = new THREE.SphereGeometry(1, 32, 32)
          break
        case "rings":
          geometry = new THREE.TorusGeometry(1, 0.3, 16, 100)
          break
        default:
          geometry = new THREE.BoxGeometry(1, 1, 1)
      }

      const material = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        emissive: color,
        emissiveIntensity: 0.2,
      })

      const mesh = new THREE.Mesh(geometry, material)
      group.add(mesh)

      // Add particle system around vault
      const particleGeometry = new THREE.BufferGeometry()
      const particlePositions = []

      for (let i = 0; i < 100; i++) {
        particlePositions.push((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4)
      }

      particleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(particlePositions, 3))

      const particleMaterial = new THREE.PointsMaterial({
        color: color,
        size: 0.05,
        transparent: true,
        opacity: 0.6,
      })

      const particles = new THREE.Points(particleGeometry, particleMaterial)
      group.add(particles)

      group.position.copy(position)
      return group
    }

    // Create vaults
    const vault1 = createVault(0x00f5d4, new THREE.Vector3(-4, 0, 0), "crystal")
    const vault2 = createVault(0x9b5de5, new THREE.Vector3(0, 0, 0), "energy")
    const vault3 = createVault(0xff206e, new THREE.Vector3(4, 0, 0), "rings")

    vaultsRef.current = [vault1, vault2, vault3]

    scene.add(vault1)
    scene.add(vault2)
    scene.add(vault3)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x00f5d4, 1, 100)
    pointLight.position.set(0, 5, 5)
    scene.add(pointLight)

    camera.position.z = 8

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      vaultsRef.current.forEach((vault, index) => {
        vault.rotation.y += 0.01 * (index + 1)
        vault.rotation.x += 0.005

        // Animate particles
        const particles = vault.children[1] as THREE.Points
        if (particles) {
          particles.rotation.y += 0.02
        }
      })

      renderer.render(scene, camera)
    }
    animate()

    // GSAP ScrollTrigger animations
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 80%",
      onEnter: () => {
        vaultsRef.current.forEach((vault, index) => {
          gsap.fromTo(
            vault.scale,
            { x: 0.1, y: 0.1, z: 0.1 },
            {
              x: 1,
              y: 1,
              z: 1,
              duration: 1.2,
              ease: "elastic.out(1, 0.5)",
              delay: index * 0.3,
            },
          )
        })
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
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-bold text-center mb-16 holo-text">
          Intelligent Vault System
        </h2>

        <div ref={containerRef} className="mb-16 h-[600px] relative" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {vaultData.map((vault, index) => (
            <div
              key={index}
              className="relative group cursor-pointer transition-all duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 21, 46, 0.8), rgba(10, 14, 41, 0.9))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 245, 212, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 8px 32px rgba(0, 245, 212, 0.1)',
                width: '320px',
                height: '320px',
                margin: '0 auto',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 245, 212, 0.6)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 245, 212, 0.2)';
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 245, 212, 0.3)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 245, 212, 0.1)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              {/* Animated Background Gradient */}
              <div 
                className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-2xl"
                style={{
                  background: `linear-gradient(45deg, #${vault.color.toString(16).padStart(6, '0')}40, transparent)`
                }}
              />
              
              {/* Data Streams */}
              <div className="absolute top-0 left-1/4 w-px h-20 bg-gradient-to-b from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 animate-pulse" />
              <div className="absolute top-0 right-1/4 w-px h-20 bg-gradient-to-b from-transparent via-secondary to-transparent opacity-0 group-hover:opacity-100 animate-pulse" style={{ animationDelay: '0.5s' }} />
              
              {/* Header with title and APY */}
              <div className="relative z-10 flex justify-between items-start mb-6">
                <h3 
                  className="text-lg font-bold leading-tight max-w-[60%]"
                  style={{ 
                    color: `#${vault.color.toString(16).padStart(6, '0')}`,
                    textShadow: `0 0 15px #${vault.color.toString(16).padStart(6, '0')}30`
                  }}
                >
                  {vault.name}
                </h3>
                <div 
                  className="text-3xl font-bold"
                  style={{ 
                    color: `#${vault.color.toString(16).padStart(6, '0')}`,
                    textShadow: `0 0 20px #${vault.color.toString(16).padStart(6, '0')}50`
                  }}
                >
                  {vault.apy}
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 space-y-6">
                <div className="text-sm text-muted-foreground/80">
                  {vault.description}
                </div>
                
                <div
                  className={`inline-block px-4 py-2 rounded-full text-xs font-semibold border backdrop-blur-sm ${
                    vault.risk === "Low"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : vault.risk === "Medium"
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}
                >
                  {vault.risk} Risk
                </div>

                {/* Vault Status Indicator */}
                <div className="flex items-center space-x-2 mt-6">
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ 
                      backgroundColor: `#${vault.color.toString(16).padStart(6, '0')}`,
                      boxShadow: `0 0 10px #${vault.color.toString(16).padStart(6, '0')}`,
                    }}
                  />
                  <span className="text-xs text-muted-foreground/80">Active & Optimizing</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
