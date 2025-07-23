import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { CustomEase } from "gsap/CustomEase"

export const initializeGSAP = () => {
  gsap.registerPlugin(ScrollTrigger, CustomEase)

  // Custom quantum ease
  CustomEase.create(
    "quantum",
    "M0,0 C0.14,0 0.242,0.438 0.272,0.561 0.313,0.728 0.396,1.172 0.55,1.172 0.7,1.172 0.785,0.728 0.818,0.561 0.855,0.379 0.98,0 1,0",
  )

  // Set default ease
  gsap.defaults({
    ease: "power2.out",
    duration: 1,
  })

  // Smooth scrolling
  gsap.config({
    force3D: true,
    nullTargetWarn: false,
  })
}
