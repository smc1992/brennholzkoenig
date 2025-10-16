const webp = require('webp-converter');

async function run() {
  try {
    await webp.dwebp(
      'public/images/maja-vey-brennholz.webp',
      'public/images/kein-dreck-in-der-wohnung.png',
      '-o'
    );
    await webp.dwebp(
      'public/images/thorsten-vey-scheitholz.webp',
      'public/images/perfektes-moebelholz2.png',
      '-o'
    );
    console.log('WebP → PNG konvertiert');
  } catch (e) {
    console.error('Konvertierung fehlgeschlagen:', e);
    process.exit(1);
  }
}

run();