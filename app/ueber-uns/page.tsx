
'use client';

import AboutHero from './AboutHero';
import ThorstensStory from './ThorstensStory';
import TeamSection from './TeamSection';
import ExpertiseSection from './ExpertiseSection';
import QualityPromise from './QualityPromise';

export default function UeberUns() {
  return (
    <div className="min-h-screen">
      <main>
        <AboutHero />
        <ThorstensStory />
        <TeamSection />
        <ExpertiseSection />
        <QualityPromise />
      </main>
    </div>
  );
}
