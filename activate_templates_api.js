const fetch = require('node-fetch');

async function activateTemplates() {
  try {
    console.log('🔍 Aktiviere Loyalty E-Mail-Templates über Admin-API...');
    
    // Liste der Loyalty-Template-Namen
    const loyaltyTemplates = [
      'loyalty_points_earned',
      'loyalty_points_redeemed', 
      'loyalty_tier_upgrade',
      'loyalty_points_expiring'
    ];

    for (const templateName of loyaltyTemplates) {
      try {
        // Simuliere die Aktivierung über die Admin-API
        console.log(`📧 Aktiviere Template: ${templateName}`);
        
        // Da wir keinen direkten API-Endpunkt haben, verwenden wir curl
        const curlCommand = `curl -X POST "http://localhost:3000/api/admin/activate-template" -H "Content-Type: application/json" -d '{"template_name": "${templateName}", "active": true}'`;
        console.log(`Würde ausführen: ${curlCommand}`);
        
      } catch (e) {
        console.error(`❌ Fehler bei Template ${templateName}:`, e);
      }
    }

    console.log('ℹ️  Templates müssen manuell über das Admin-Interface aktiviert werden');
    console.log('🌐 Öffne: http://localhost:3000/admin');
    console.log('�� Gehe zu E-Mail-Templates und aktiviere die Loyalty-Templates');
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  }
}

activateTemplates();
