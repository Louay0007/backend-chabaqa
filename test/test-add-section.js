const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODYzZWI4Y2UyYzlmMDA0Zjg2NDg5NTAiLCJlbWFpbCI6ImdoYXNzZW5femFvdWFsaUBpZWVlLm9yZyIsInJvbGUiOiJ1c2VyIiwianRpIjoiNjg2M2ViOGNlMmM5ZjAwNGY4NjQ4OTUwLWFjY2Vzcy0xNzUzNzEzMzA3NDQ0IiwiaWF0IjoxNzUzNzEzMzA3LCJleHAiOjE3NTM3Mjc3MDd9.hzO4ahbogl8BRc49p9Ka1RJDDHFZMWoH6LJemdf6RgQ';

// ID d'un cours existant (remplacez par un vrai ID de cours)
const COURS_ID = '6887a4b103d5f48042dce2d6'; // Remplacez par l'ID d'un cours existant

async function testAddSection() {
  console.log('🧪 Test API - Ajouter une section à un cours');
  console.log('=============================================');

  try {
    // 1. D'abord, vérifier que le cours existe
    console.log('🔍 Vérification du cours existant...');
    try {
      const coursResponse = await axios.get(
        `${BASE_URL}/cours/${COURS_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${USER_TOKEN}`
          }
        }
      );
      
      console.log(`   ✅ Cours trouvé: "${coursResponse.data.titre}"`);
      console.log(`   📊 Sections actuelles: ${coursResponse.data.sections?.length || 0}`);
      
    } catch (error) {
      console.log('❌ Cours non trouvé ou inaccessible');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message}`);
      console.log('');
      console.log('💡 Solutions:');
      console.log('   1. Créer un cours avec l\'API create-cours');
      console.log('   2. Utiliser l\'ID d\'un cours existant');
      console.log('   3. Vérifier que l\'utilisateur est admin de la communauté');
      return;
    }

    // 2. Ajouter une nouvelle section
    console.log('');
    console.log('📤 Ajout d\'une nouvelle section...');
    
    const sectionData = {
      "titre": "Section Avancée - Tests",
      "description": "Une section créée via l'API pour tester la fonctionnalité d'ajout",
      "ordre": 10, // Mettre un ordre élevé pour éviter les conflits
      "chapitres": [
        {
          "titre": "Introduction aux tests",
          "description": "Premier chapitre de la nouvelle section",
          "videoUrl": "https://example.com/videos/intro-tests.mp4",
          "isPaid": false,
          "ordre": 1,
          "duree": "10:30"
        },
        {
          "titre": "Tests unitaires",
          "description": "Chapitre sur les tests unitaires",
          "videoUrl": "https://example.com/videos/unit-tests.mp4",
          "isPaid": true,
          "ordre": 2,
          "duree": "25:15"
        }
      ]
    };

    console.log('   📝 Section à ajouter:');
    console.log(`      📋 Titre: "${sectionData.titre}"`);
    console.log(`      📍 Ordre: ${sectionData.ordre}`);
    console.log(`      📚 Chapitres: ${sectionData.chapitres.length}`);

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
    console.log(`   📊 Nombre total de sections: ${response.data.sections?.length || 0}`);
    
    // Afficher la nouvelle section
    const nouvelleSections = response.data.sections || [];
    const derniereSection = nouvelleSections[nouvelleSections.length - 1];
    
    if (derniereSection) {
      console.log('');
      console.log('📑 Détails de la section ajoutée:');
      console.log(`   🆔 ID: ${derniereSection.id}`);
      console.log(`   📋 Titre: ${derniereSection.titre}`);
      console.log(`   📍 Ordre: ${derniereSection.ordre}`);
      console.log(`   📚 Chapitres: ${derniereSection.chapitres?.length || 0}`);
      
      if (derniereSection.chapitres && derniereSection.chapitres.length > 0) {
        console.log('   📖 Chapitres ajoutés:');
        derniereSection.chapitres.forEach((chapitre, index) => {
          console.log(`      ${index + 1}. "${chapitre.titre}" (${chapitre.duree || 0} min) - ${chapitre.isPreview ? 'Gratuit' : 'Payant'}`);
        });
      }
    }
    
    console.log('');
    console.log('✅ Test réussi ! L\'API d\'ajout de section fonctionne correctement.');
    
  } catch (error) {
    console.log('❌ ERREUR lors de l\'ajout de la section:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message}`);
    
    if (error.response?.status === 403) {
      console.log('');
      console.log('🔒 Problème d\'autorisation:');
      console.log('   • Vérifiez que l\'utilisateur est admin de la communauté');
      console.log('   • Vérifiez que le token JWT est valide');
    } else if (error.response?.status === 404) {
      console.log('');
      console.log('🔍 Cours non trouvé:');
      console.log('   • Vérifiez l\'ID du cours');
      console.log('   • Assurez-vous que le cours existe');
    } else if (error.response?.status === 400) {
      console.log('');
      console.log('📝 Données invalides:');
      console.log('   • Vérifiez les données de la section');
      console.log('   • Vérifiez les validations du DTO');
    }
  }
}

testAddSection(); 