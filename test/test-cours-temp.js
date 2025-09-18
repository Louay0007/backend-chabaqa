const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODYzZWI4Y2UyYzlmMDA0Zjg2NDg5NTAiLCJlbWFpbCI6ImdoYXNzZW5femFvdWFsaUBpZWVlLm9yZyIsInJvbGUiOiJ1c2VyIiwianRpIjoiNjg2M2ViOGNlMmM5ZjAwNGY4NjQ4OTUwLWFjY2Vzcy0xNzUzNzEzMzA3NDQ0IiwiaWF0IjoxNzUzNzEzMzA3LCJleHAiOjE3NTM3Mjc3MDd9.hzO4ahbogl8BRc49p9Ka1RJDDHFZMWoH6LJemdf6RgQ';

async function testTemp() {
  console.log('🧪 Test temporaire - Structure Sections/Chapitres');
  console.log('==============================================');

  try {
    const coursData = {
      "titre": "Test Structure Sections",
      "description": "Test de la nouvelle structure avec sections et chapitres",
      "prix": 25.99,
      "isPaid": true,
      "devise": "EUR",
      "communitySlug": "digital-marketing-masters",
      "isPublished": false,
      "sections": [
        {
          "titre": "Section Test 1",
          "description": "Première section de test",
          "ordre": 1,
          "chapitres": [
            {
              "titre": "Chapitre 1.1",
              "description": "Premier chapitre de la première section",
              "videoUrl": "https://example.com/video1.mp4",
              "isPaid": false,
              "ordre": 1,
              "duree": "10:00"
            },
            {
              "titre": "Chapitre 1.2", 
              "description": "Deuxième chapitre de la première section",
              "videoUrl": "https://example.com/video2.mp4",
              "isPaid": true,
              "ordre": 2,
              "duree": "15:30"
            }
          ]
        },
        {
          "titre": "Section Test 2",
          "description": "Deuxième section de test",
          "ordre": 2,
          "chapitres": [
            {
              "titre": "Chapitre 2.1",
              "description": "Premier chapitre de la deuxième section",
              "videoUrl": "https://example.com/video3.mp4",
              "isPaid": true,
              "ordre": 1,
              "duree": "20:45"
            }
          ]
        }
      ]
    };

    console.log('📋 Test Structure:');
    console.log(`   📚 Cours: "${coursData.titre}"`);
    console.log(`   📁 ${coursData.sections.length} sections`);
    coursData.sections.forEach((section, i) => {
      console.log(`      Section ${i+1}: "${section.titre}" (${section.chapitres.length} chapitres)`);
    });

    console.log('');
    console.log('📤 Envoi de la requête...');

    const response = await axios.post(
      `${BASE_URL}/cours/create-cours`,
      coursData,
      {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('');
    console.log('🎉 SUCCÈS! Structure créée:');
    console.log(`📚 ID: ${response.data.cours.id}`);
    console.log(`📚 Titre: ${response.data.cours.titre}`);
    console.log(`📁 Sections: ${response.data.cours.sections?.length || 0}`);

    if (response.data.cours.sections) {
      response.data.cours.sections.forEach((section, i) => {
        console.log(`   📁 Section ${i+1}: "${section.titre}" → ${section.chapitres?.length || 0} chapitres`);
        if (section.chapitres?.length > 0) {
          section.chapitres.forEach((chapitre, j) => {
            console.log(`      📄 ${j+1}. "${chapitre.titre}"`);
          });
        } else {
          console.log(`      ⚠️  Aucun chapitre !`);
        }
      });
    }

    console.log('');
    console.log('✅ Test réussi ! La structure fonctionne.');

  } catch (error) {
    console.log('❌ ERREUR:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message}`);
    
    if (Array.isArray(error.response?.data?.message)) {
      console.log('   Détails:');
      error.response.data.message.forEach(msg => console.log(`      • ${msg}`));
    }
  }
}

testTemp(); 