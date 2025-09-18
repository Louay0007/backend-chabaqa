const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// ⚠️ REMPLACEZ CES VALEURS PAR DES VALEURS VALIDES ⚠️
const USER_TOKEN = 'VOTRE_TOKEN_JWT_ICI';
const COURS_ID = 'VOTRE_COURS_ID_ICI';
const SECTION_ID = 'VOTRE_SECTION_ID_ICI';

async function testAddChapitreToSection() {
  console.log('🧪 DÉMONSTRATION - API Ajouter Chapitre à une Section');
  console.log('==================================================');
  console.log('');
  console.log('📋 ÉTAPES POUR UTILISER CETTE API:');
  console.log('   1. Obtenez un token JWT valide');
  console.log('   2. Remplacez USER_TOKEN dans ce fichier');
  console.log('   3. Créez un cours ou utilisez un ID de cours existant');
  console.log('   4. Créez une section ou utilisez un ID de section existant');
  console.log('   5. Remplacez COURS_ID et SECTION_ID dans ce fichier');
  console.log('   6. Lancez ce test');
  console.log('');

  if (USER_TOKEN === 'VOTRE_TOKEN_JWT_ICI' || COURS_ID === 'VOTRE_COURS_ID_ICI' || SECTION_ID === 'VOTRE_SECTION_ID_ICI') {
    console.log('⚠️  Configuration requise !');
    console.log('   • Mettez à jour USER_TOKEN avec un token valide');
    console.log('   • Mettez à jour COURS_ID avec un ID de cours existant');
    console.log('   • Mettez à jour SECTION_ID avec un ID de section existant');
    console.log('');
    console.log('📝 Structure de l\'API:');
    console.log('   Endpoint: POST /cours/{coursId}/sections/{sectionId}/add-chapitre');
    console.log('   Authorization: Bearer {token}');
    console.log('   Body: {');
    console.log('     "titre": "Titre du chapitre",');
    console.log('     "description": "Description du chapitre",');
    console.log('     "videoUrl": "https://example.com/video.mp4",');
    console.log('     "isPaid": false,');
    console.log('     "ordre": 1,');
    console.log('     "duree": "10:30",');
    console.log('     "notes": "Notes optionnelles"');
    console.log('   }');
    console.log('');
    console.log('💡 Comment obtenir les IDs :');
    console.log('   • COURS_ID : Utilisez l\'API GET /cours/:id pour voir la structure');
    console.log('   • SECTION_ID : Dans la réponse du cours, regardez sections[].id');
    return;
  }

  try {
    console.log('📤 Test de l\'API add-chapitre-to-section...');
    console.log(`   🆔 Cours ID: ${COURS_ID}`);
    console.log(`   📑 Section ID: ${SECTION_ID}`);
    
    const chapitreData = {
      "titre": "Chapitre Ajouté par API",
      "description": "Ce chapitre a été ajouté spécifiquement à une section via l'API dédiée",
      "videoUrl": "https://example.com/videos/nouveau-chapitre.mp4",
      "isPaid": false,
      "ordre": 99, // Ordre élevé pour éviter les conflits
      "duree": "18:45",
      "notes": "Chapitre créé pour tester la nouvelle API"
    };

    console.log('   📝 Chapitre à ajouter:', chapitreData.titre);
    console.log(`   ⏱️  Durée: ${chapitreData.duree}`);
    console.log(`   💰 Gratuit: ${!chapitreData.isPaid}`);

    const response = await axios.post(
      `${BASE_URL}/cours/${COURS_ID}/sections/${SECTION_ID}/add-chapitre`,
      chapitreData,
      {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('');
    console.log('🎉 SUCCÈS! Chapitre ajouté:');
    console.log(`   📋 Cours: "${response.data.titre}"`);
    console.log(`   📊 Sections totales: ${response.data.sections?.length || 0}`);
    
    // Trouver la section modifiée
    const sectionModifiee = response.data.sections?.find(s => s.id === SECTION_ID);
    if (sectionModifiee) {
      console.log('');
      console.log('📑 Section modifiée:');
      console.log(`   📋 Titre: "${sectionModifiee.titre}"`);
      console.log(`   📚 Chapitres totaux: ${sectionModifiee.chapitres?.length || 0}`);
      
      if (sectionModifiee.chapitres && sectionModifiee.chapitres.length > 0) {
        const dernierChapitre = sectionModifiee.chapitres[sectionModifiee.chapitres.length - 1];
        console.log('');
        console.log('📖 Dernier chapitre ajouté:');
        console.log(`   🆔 ID: ${dernierChapitre.id}`);
        console.log(`   📋 Titre: "${dernierChapitre.titre}"`);
        console.log(`   📍 Ordre: ${dernierChapitre.ordre}`);
        console.log(`   ⏱️  Durée: ${dernierChapitre.duree || 0} min`);
        console.log(`   💰 Gratuit: ${dernierChapitre.isPreview ? 'Oui' : 'Non'}`);
      }
    }
    
    console.log('');
    console.log('✅ L\'API add-chapitre-to-section fonctionne parfaitement !');

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
      console.log('   • Cours ou section non trouvé → Vérifiez les IDs');
      console.log('   • Utilisez GET /cours/:id pour voir la structure et les IDs des sections');
    } else if (error.response?.status === 400) {
      console.log('   • Données invalides → Vérifiez le format des données');
      console.log('   • Détails:', error.response?.data);
    } else if (!error.response) {
      console.log('   • Serveur non disponible → Vérifiez que NestJS fonctionne (npm run start:dev)');
    }
  }
}

console.log('');
console.log('🚀 API AJOUTER CHAPITRE À UNE SECTION - MODE DEMO');
console.log('================================================');
console.log('');
console.log('📋 FONCTIONNALITÉS IMPLÉMENTÉES:');
console.log('   ✅ DTO AddChapitreToSectionDto avec validation');
console.log('   ✅ Service CoursService.ajouterChapitreASection()');
console.log('   ✅ Endpoint POST /cours/{coursId}/sections/{sectionId}/add-chapitre');
console.log('   ✅ Authentification JWT requise');
console.log('   ✅ Vérification des permissions admin');
console.log('   ✅ Vérification que la section existe dans le cours');
console.log('   ✅ Conversion automatique durée HH:MM → minutes');
console.log('   ✅ Retour du cours complet mis à jour');
console.log('   ✅ Suppression de l\'ancienne API /cours/:coursId/chapitres');
console.log('');
console.log('🔄 CHANGEMENTS:');
console.log('   ❌ Ancienne API: POST /cours/:coursId/chapitres (SUPPRIMÉE)');
console.log('   ✅ Nouvelle API: POST /cours/:coursId/sections/:sectionId/add-chapitre');
console.log('   📋 Avantage: Contrôle précis de la section où ajouter le chapitre');
console.log('');

testAddChapitreToSection(); 