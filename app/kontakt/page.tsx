
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
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-full overflow-hidden">
          <ContactForm />
          <ContactInfo />
        </div>
        <LocationMap />
      </main>
    </div>
  );
}
