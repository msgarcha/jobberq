import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import IndustryTicker from "@/components/landing/IndustryTicker";
import StorytellingTabs from "@/components/landing/StorytellingTabs";
import StatsBanner from "@/components/landing/StatsBanner";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
      <IndustryTicker />
      <StorytellingTabs />
      <StatsBanner />
      <FeaturesGrid />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
