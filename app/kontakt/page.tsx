
'use client';

import ContactHero from './ContactHero';
import ContactForm from './ContactForm';
import ContactInfo from './ContactInfo';
import LocationMap from './LocationMap';

export default function Kontakt() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <main className="w-full max-w-full">
        <ContactHero />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-none lg:max-w-6xl xl:max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <ContactForm />
            <ContactInfo />
          </div>
        </div>
        <LocationMap />
      </main>
    </div>
  );
}
