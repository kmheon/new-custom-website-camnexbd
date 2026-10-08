import React from 'react';
import { HeroSlider } from './HeroSlider';

export { HeroSlider };

interface HeroProps {
  onNavigate?: (route: string, param?: string) => void;
  onOpenQuoteWithEstimate?: (type: string, cameras: number) => void;
  onOpenSurvey?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate, onOpenQuoteWithEstimate, onOpenSurvey }) => {
  const handleNav = onNavigate || ((route: string, param?: string) => {
    if (route === 'quote' && onOpenSurvey) onOpenSurvey();
    else if (onOpenQuoteWithEstimate) onOpenQuoteWithEstimate('Home', 4);
  });

  return <HeroSlider onNavigate={handleNav} />;
};
