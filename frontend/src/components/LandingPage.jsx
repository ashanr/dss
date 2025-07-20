import React from 'react';
import Navigation from './Navigation';
import HeroSection from './HeroSection';
import FeatureSection from './FeatureSection';
import HowItWorksSection from './HowItWorksSection';
import StatsSection from './StatsSection';
import TestimonialsSection from './TestimonialsSection';
import CTASection from './CTASection';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <Navigation />
      <HeroSection />
      <FeatureSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
};

export default LandingPage;