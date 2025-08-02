import Navigation from '@/components/Navigation';
import VerticalRays from '@/components/VerticalRays';
import HeroSection from '@/components/sections/HeroSection';
import VaultShowcase from '@/components/sections/VaultShowcase';
import FeatureHighlight from '@/components/sections/FeatureHighlight';
import AIWorkflow from '@/components/AIWorkflow';
import PerformanceMetrics from '@/components/sections/PerformanceMetrics';
import CTASection from '@/components/sections/CTASection';

export default function DLPLanding() {

    return (
        <div className="min-h-screen bg-background relative overflow-x-hidden">
            <Navigation variant="transparent" showWallet={false} showLaunchApp={true} />
            <VerticalRays className="top-0 left-0 right-0" style={{ pointerEvents: 'none' }} />
            <HeroSection />
            <VaultShowcase />
            <FeatureHighlight />
            <AIWorkflow />
            <PerformanceMetrics />
            <CTASection />
        </div>
    );
}