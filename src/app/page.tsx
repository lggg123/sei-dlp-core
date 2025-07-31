import Navigation from '@/components/Navigation';
import HeroSection from '@/components/sections/HeroSection';
import VaultShowcase from '@/components/sections/VaultShowcase';
import AIWorkflow from '@/components/AIWorkflow';
import PerformanceMetrics from '@/components/sections/PerformanceMetrics';
import CTASection from '@/components/sections/CTASection';

export default function DLPLanding() {

    return (
        <div className="min-h-screen bg-background">
            <Navigation variant="transparent" />
            <HeroSection />
            <VaultShowcase />
            <AIWorkflow />
            <PerformanceMetrics />
            <CTASection />
        </div>
    );
}