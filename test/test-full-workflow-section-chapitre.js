const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const USER_TOKEN = 'VOTRE_TOKEN_JWT_ICI'; // Remplacez par un token valide

async function testFullWorkflow() {
  console.log('🧪 Test Workflow Complet - Cours → Section → Chapitre');
  console.log('====================================================');

  if (USER_TOKEN === 'VOTRE_TOKEN_JWT_ICI') {
    console.log('⚠️  Token requis ! Mettez à jour USER_TOKEN avec un token valide');
    return;
  }

  let coursId = null;
  let sectionId = null;

  try {
    // ÉTAPE 1: Créer un cours avec une section initiale
    console.log('📚 ÉTAPE 1: Création d\'un cours...');
    
    const coursData = {
      "titre": `Cours Workflow Complet - ${Date.now()}`,
      "description": "Cours créé pour tester le workflow complet section/chapitre",
      "thumbnail": "https://example.com/images/workflow-course.jpg",
      "prix": 0,
      "devise": "TND",
      "communityId": "68878b4b55d0e71fb8ebd9e0",
      "isPublished": true,
      "category": "Test",
      "duree": "3h 00min",
      "learningObjectives": ["Tester l'ajout de sections", "Tester l'ajout de chapitres"],
      "requirements": ["Aucun"],
      "notes": "Test workflow",
      "sections": [
        {
          "titre": "Section de Base",
          "description": "Section créée avec le cours",
          "ordre": 1,
          "chapitres": [
            {
              "titre": "Chapitre initial",
              "description": "Premier chapitre créé avec le cours",
              "videoUrl": "https://example.com/videos/initial.mp4",
              "isPaid": false,
              "ordre": 1,
              "duree": "8:00"
            }
          ]
        }
      ]
    };

    const coursResponse = await axios.post(
      `${BASE_URL}/cours/create-cours`,
      coursData,
      {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    coursId = coursResponse.data.id;
    console.log(`   ✅ Cours créé: "${coursResponse.data.titre}"`);
    console.log(`   🆔 ID: ${coursId}`);
    console.log(`   📊 Sections: ${coursResponse.data.sections?.length || 0}`);

    // ÉTAPE 2: Ajouter une nouvelle section au cours
    console.log('');
    console.log('📑 ÉTAPE 2: Ajout d\'une nouvelle section...');
    
    const sectionData = {
      "titre": "Section Ajoutée Dynamiquement",
      "description": "Cette section a été ajoutée après la création du cours",
      "ordre": 2,
      "chapitres": [
        {
          "titre": "Premier chapitre de la nouvelle section",
          "description": "Chapitre inclus lors de l'ajout de section",
          "videoUrl": "https://example.com/videos/section-chapitre.mp4",
          "isPaid": false,
          "ordre": 1,
          "duree": "12:30"
        }
      ]
    };

    const addSectionResponse = await axios.post(
      `${BASE_URL}/cours/${coursId}/add-section`,
      sectionData,
      {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Récupérer l'ID de la section ajoutée
    const sections = addSectionResponse.data.sections || [];
    const nouvelleSectionAjoutee = sections.find(s => s.titre === sectionData.titre);
    sectionId = nouvelleSectionAjoutee?.id;

    console.log(`   ✅ Section ajoutée: "${nouvelleSectionAjoutee?.titre}"`);
    console.log(`   🆔 Section ID: ${sectionId}`);
    console.log(`   📊 Total sections: ${sections.length}`);
    console.log(`   📚 Chapitres dans nouvelle section: ${nouvelleSectionAjoutee?.chapitres?.length || 0}`);

    // ÉTAPE 3: Ajouter un chapitre à la section créée
    console.log('');
    console.log('📖 ÉTAPE 3: Ajout d\'un chapitre à la section...');
    
    const chapitreData = {
      "titre": "Chapitre Ajouté Séparément",
      "description": "Ce chapitre a été ajouté spécifiquement à la section via l'API dédiée",
      "videoUrl": "https://example.com/videos/chapitre-separe.mp4",
      "isPaid": true,
      "ordre": 2,
      "duree": "25:45",
      "notes": "Chapitre premium ajouté après coup"
    };

    const addChapitreResponse = await axios.post(
      `${BASE_URL}/cours/${coursId}/sections/${sectionId}/add-chapitre`,
      chapitreData,
      {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`   ✅ Chapitre ajouté: "${chapitreData.titre}"`);
    console.log(`   💰 Type: ${chapitreData.isPaid ? 'Payant' : 'Gratuit'}`);
    console.log(`   ⏱️  Durée: ${chapitreData.duree}`);

    // RÉSULTATS FINAUX
    console.log('');
    console.log('🎉 WORKFLOW TERMINÉ AVEC SUCCÈS !');
    console.log('=================================');
    
    const finalCours = addChapitreResponse.data;
    console.log(`📋 Cours final: "${finalCours.titre}"`);
    console.log(`📊 Nombre de sections: ${finalCours.sections?.length || 0}`);
    
    let totalChapitres = 0;
    finalCours.sections?.forEach((section, index) => {
      const nbChapitres = section.chapitres?.length || 0;
      totalChapitres += nbChapitres;
      console.log(`   ${index + 1}. "${section.titre}" - ${nbChapitres} chapitres`);
      
      section.chapitres?.forEach((chapitre, chIndex) => {
        const type = chapitre.isPreview ? 'Gratuit' : 'Payant';
        console.log(`      ${chIndex + 1}. "${chapitre.titre}" (${type})`);
      });
    });
    
    console.log(`📚 Total chapitres: ${totalChapitres}`);
    console.log('');
    console.log('✅ Toutes les APIs fonctionnent parfaitement ensemble !');
    console.log('📋 APIs testées:');
    console.log('   ✅ POST /cours/create-cours');
    console.log('   ✅ POST /cours/:id/add-section');
    console.log('   ✅ POST /cours/:coursId/sections/:sectionId/add-chapitre');

  } catch (error) {
    console.log('❌ ERREUR dans le workflow:');
    console.log(`   Status: ${error.response?.status || 'Connection failed'}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    
    if (error.response?.status === 401) {
      console.log('');
      console.log('🔑 Token expiré ou invalide');
      console.log('   • Obtenez un nouveau token avec node test/get-fresh-token.js');
    } else if (error.response?.status === 400) {
      console.log('');
      console.log('📝 Données invalides:');
      console.log('   Détails:', error.response?.data);
    }
  }
}

console.log('');
console.log('🚀 WORKFLOW COMPLET - CRÉATION DE CONTENU STRUCTURÉ');
console.log('===================================================');
console.log('');
console.log('📋 Ce test démontre:');
console.log('   1. Création d\'un cours avec sections initiales');
console.log('   2. Ajout dynamique d\'une nouvelle section');
console.log('   3. Ajout précis d\'un chapitre à une section spécifique');
console.log('');
console.log('🎯 Avantages de la nouvelle architecture:');
console.log('   ✅ Contrôle total sur l\'organisation du contenu');
console.log('   ✅ Flexibilité dans l\'ajout de sections/chapitres');
console.log('   ✅ Structure hiérarchique claire: Cours → Sections → Chapitres');
console.log('');

testFullWorkflow(); 