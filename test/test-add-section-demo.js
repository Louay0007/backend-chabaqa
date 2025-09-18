const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// ⚠️ REMPLACEZ CE TOKEN PAR UN TOKEN VALIDE ⚠️
// Utilisez `node test/get-fresh-token.js` pour obtenir un nouveau token
const USER_TOKEN = 'VOTRE_TOKEN_JWT_ICI';

// ⚠️ REMPLACEZ CET ID PAR UN ID DE COURS EXISTANT ⚠️
const COURS_ID = 'VOTRE_COURS_ID_ICI';

async function demoAddSection() {
  console.log('🧪 DÉMONSTRATION - API Ajouter Section à un Cours');
  console.log('================================================');
  console.log('');
  console.log('📋 ÉTAPES POUR UTILISER CETTE API:');
  console.log('   1. Obtenez un token JWT valide avec `node test/get-fresh-token.js`');
  console.log('   2. Remplacez USER_TOKEN dans ce fichier');
  console.log('   3. Créez un cours ou utilisez un ID de cours existant');
  console.log('   4. Remplacez COURS_ID dans ce fichier');
  console.log('   5. Lancez ce test');
  console.log('');

  if (USER_TOKEN === 'VOTRE_TOKEN_JWT_ICI' || COURS_ID === 'VOTRE_COURS_ID_ICI') {
    console.log('⚠️  Configuration requise !');
    console.log('   • Mettez à jour USER_TOKEN avec un token valide');
    console.log('   • Mettez à jour COURS_ID avec un ID de cours existant');
    console.log('');
    console.log('📝 Structure de l\'API:');
    console.log('   Endpoint: POST /cours/{id}/add-section');
    console.log('   Authorization: Bearer {token}');
    console.log('   Body: {');
    console.log('     "titre": "Titre de la section",');
    console.log('     "description": "Description optionnelle",');
    console.log('     "ordre": 1,');
    console.log('     "chapitres": [');
    console.log('       {');
    console.log('         "titre": "Titre du chapitre",');
    console.log('         "description": "Description du chapitre",');
    console.log('         "videoUrl": "https://example.com/video.mp4",');
    console.log('         "isPaid": false,');
    console.log('         "ordre": 1,');
    console.log('         "duree": "10:30"');
    console.log('       }');
    console.log('     ]');
    console.log('   }');
    return;
  }

  try {
    console.log('📤 Test de l\'API add-section...');
    console.log(`   🆔 Cours ID: ${COURS_ID}`);
    
    const sectionData = {
      "titre": "Section de Test API",
      "description": "Section ajoutée via l'API pour démonstration",
      "ordre": 99, // Ordre élevé pour éviter les conflits
      "chapitres": [
        {
          "titre": "Chapitre de démonstration",
          "description": "Un chapitre ajouté par l'API",
          "videoUrl": "https://example.com/videos/demo.mp4",
          "isPaid": false,
          "ordre": 1,
          "duree": "12:00"
        }
      ]
    };

    console.log('   📝 Section à ajouter:', sectionData.titre);

    const response = await axios.post(
      `${BASE_URL}/cours/${COURS_ID}/add-section`,
      sectionData,
      {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('');
    console.log('🎉 SUCCÈS! Section ajoutée:');
    console.log(`   📋 Cours: "${response.data.titre}"`);
    console.log(`   📊 Sections totales: ${response.data.sections?.length || 0}`);
    console.log('');
    console.log('✅ L\'API add-section fonctionne parfaitement !');

  } catch (error) {
    console.log('❌ ERREUR:');
    console.log(`   Status: ${error.response?.status || 'Connection failed'}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    
    console.log('');
    console.log('🔧 Solutions possibles:');
    
    if (error.response?.status === 401) {
      console.log('   • Token expiré → Obtenez un nouveau token');
    } else if (error.response?.status === 403) {
      console.log('   • Pas d\'autorisation → Vérifiez que vous êtes admin de la communauté');
    } else if (error.response?.status === 404) {
      console.log('   • Cours non trouvé → Vérifiez l\'ID du cours');
    } else if (error.response?.status === 400) {
      console.log('   • Données invalides → Vérifiez le format des données');
    } else if (!error.response) {
      console.log('   • Serveur non disponible → Vérifiez que NestJS fonctionne (npm run start:dev)');
    }
  }
}

console.log('');
console.log('🚀 API AJOUTER SECTION - MODE DEMO');
console.log('==================================');
console.log('');
console.log('📋 FONCTIONNALITÉS IMPLÉMENTÉES:');
console.log('   ✅ DTO AddSectionDto avec validation');
console.log('   ✅ Service CoursService.ajouterSection()');
console.log('   ✅ Endpoint POST /cours/{id}/add-section');
console.log('   ✅ Authentification JWT requise');
console.log('   ✅ Vérification des permissions admin');
console.log('   ✅ Support des chapitres dans la section');
console.log('   ✅ Conversion automatique durée HH:MM → minutes');
console.log('   ✅ Retour du cours complet mis à jour');
console.log('');

demoAddSection(); 