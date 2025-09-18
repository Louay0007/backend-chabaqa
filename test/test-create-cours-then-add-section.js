const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODYzZWI4Y2UyYzlmMDA0Zjg2NDg5NTAiLCJlbWFpbCI6ImdoYXNzZW5femFvdWFsaUBpZWVlLm9yZyIsInJvbGUiOiJ1c2VyIiwianRpIjoiNjg2M2ViOGNlMmM5ZjAwNGY4NjQ4OTUwLWFjY2Vzcy0xNzUzNzEzMzA3NDQ0IiwiaWF0IjoxNzUzNzEzMzA3LCJleHAiOjE3NTM3Mjc3MDd9.hzO4ahbogl8BRc49p9Ka1RJDDHFZMWoH6LJemdf6RgQ';

async function testCreateCoursAndAddSection() {
  console.log('🧪 Test complet - Créer cours + Ajouter section');
  console.log('==============================================');

  let coursId = null;

  try {
    // 1. Créer un cours d'abord
    console.log('📚 ÉTAPE 1: Création d\'un cours de test...');
    
    const coursData = {
      "titre": `Test Cours pour Section - ${Date.now()}`,
      "description": "Un cours créé spécialement pour tester l'ajout de sections",
      "thumbnail": "https://example.com/images/test-course.jpg",
      "prix": 0,
      "devise": "TND",
      "communityId": "68878b4b55d0e71fb8ebd9e0", // ID de la communauté existante
      "isPublished": true,
      "category": "Test",
      "duree": "2h 00min",
      "learningObjectives": [
        "Apprendre à créer des sections",
        "Tester les APIs"
      ],
      "requirements": [
        "Aucun prérequis"
      ],
      "notes": "Cours de test",
      "sections": [
        {
          "titre": "Section initiale",
          "description": "Première section créée avec le cours",
          "ordre": 1,
          "chapitres": [
            {
              "titre": "Premier chapitre",
              "description": "Description du premier chapitre",
              "videoUrl": "https://example.com/videos/intro.mp4",
              "isPaid": false,
              "ordre": 1,
              "duree": "10:00"
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
    console.log(`   ✅ Cours créé avec succès!`);
    console.log(`   🆔 ID: ${coursId}`);
    console.log(`   📋 Titre: "${coursResponse.data.titre}"`);
    console.log(`   📊 Sections initiales: ${coursResponse.data.sections?.length || 0}`);

    // 2. Maintenant ajouter une nouvelle section
    console.log('');
    console.log('📑 ÉTAPE 2: Ajout d\'une nouvelle section...');
    
    const sectionData = {
      "titre": "Section Ajoutée Dynamiquement",
      "description": "Cette section a été ajoutée après la création du cours via l'API add-section",
      "ordre": 2,
      "chapitres": [
        {
          "titre": "Chapitre de la nouvelle section",
          "description": "Premier chapitre de la section ajoutée",
          "videoUrl": "https://example.com/videos/nouvelle-section.mp4",
          "isPaid": false,
          "ordre": 1,
          "duree": "15:30"
        },
        {
          "titre": "Chapitre avancé",
          "description": "Un chapitre plus avancé",
          "videoUrl": "https://example.com/videos/avance.mp4",
          "isPaid": true,
          "ordre": 2,
          "duree": "20:45"
        }
      ]
    };

    console.log('   📝 Section à ajouter:');
    console.log(`      📋 Titre: "${sectionData.titre}"`);
    console.log(`      📍 Ordre: ${sectionData.ordre}`);
    console.log(`      📚 Chapitres: ${sectionData.chapitres.length}`);

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

    console.log('');
    console.log('🎉 SUCCÈS! Section ajoutée avec succès:');
    console.log(`   📋 Cours: "${addSectionResponse.data.titre}"`);
    console.log(`   📊 Nombre total de sections: ${addSectionResponse.data.sections?.length || 0}`);
    
    // Afficher toutes les sections
    if (addSectionResponse.data.sections && addSectionResponse.data.sections.length > 0) {
      console.log('');
      console.log('📑 Détails de toutes les sections:');
      addSectionResponse.data.sections.forEach((section, index) => {
        console.log(`   ${index + 1}. "${section.titre}" (Ordre: ${section.ordre})`);
        console.log(`      📚 Chapitres: ${section.chapitres?.length || 0}`);
        if (section.chapitres && section.chapitres.length > 0) {
          section.chapitres.forEach((chapitre, chIndex) => {
            console.log(`         ${chIndex + 1}. "${chapitre.titre}" - ${chapitre.isPreview ? 'Gratuit' : 'Payant'}`);
          });
        }
      });
    }
    
    console.log('');
    console.log('✅ Test complet réussi !');
    console.log('✨ L\'API d\'ajout de section fonctionne parfaitement.');
    console.log('');
    console.log('📋 Résumé:');
    console.log(`   🆔 Cours ID: ${coursId}`);
    console.log(`   📊 Sections finales: ${addSectionResponse.data.sections?.length || 0}`);
    console.log(`   📚 Total chapitres: ${addSectionResponse.data.sections?.reduce((total, section) => total + (section.chapitres?.length || 0), 0) || 0}`);
    
  } catch (error) {
    console.log('❌ ERREUR:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message}`);
    
    if (error.response?.status === 403) {
      console.log('');
      console.log('🔒 Problème d\'autorisation:');
      console.log('   • Vérifiez que l\'utilisateur est admin de la communauté');
      console.log('   • Vérifiez que le token JWT est valide');
    } else if (error.response?.status === 404) {
      console.log('');
      console.log('🔍 Ressource non trouvée:');
      console.log('   • Vérifiez l\'ID du cours ou de la communauté');
      console.log('   • Assurez-vous que les ressources existent');
    } else if (error.response?.status === 400) {
      console.log('');
      console.log('📝 Données invalides:');
      console.log('   • Vérifiez les données envoyées');
      console.log('   • Vérifiez les validations du DTO');
      console.log('   Détails:', error.response?.data);
    }
  }
}

testCreateCoursAndAddSection(); 