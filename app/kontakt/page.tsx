
'use client';

import ContactHero from './ContactHero';
import ContactForm from './ContactForm';
import ContactInfo from './ContactInfo';
import LocationMap from './LocationMap';

export default function Kontakt() {
  return (
    <div className="min-h-screen">
      <main>
        <ContactHero />
        <div className="grid lg:grid-cols-2">
          <ContactForm />
          <ContactInfo />
        </div>
        <LocationMap />
      </main>
    </div>
  );
}
