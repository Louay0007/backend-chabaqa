const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODYzZWI4Y2UyYzlmMDA0Zjg2NDg5NTAiLCJlbWFpbCI6ImdoYXNzZW5femFvdWFsaUBpZWVlLm9yZyIsInJvbGUiOiJ1c2VyIiwianRpIjoiNjg2M2ViOGNlMmM5ZjAwNGY4NjQ4OTUwLWFjY2Vzcy0xNzUzNzEzMzA3NDQ0IiwiaWF0IjoxNzUzNzEzMzA3LCJleHAiOjE3NTM3Mjc3MDd9.hzO4ahbogl8BRc49p9Ka1RJDDHFZMWoH6LJemdf6RgQ';

async function testCreateCourse() {
  console.log('🧪 Test simple de création de cours');
  console.log('🔍 User ID dans le token: 6863eb8ce2c9f004f8648950');
  console.log('🏷️ Community slug: digital-marketing-masters');
  console.log('');

  try {
    const coursData = {
      titre: `Test Course ${Date.now()}`,
      description: 'Un cours de test simple',
      isPaid: false,
      prix: 0,  
      communitySlug: 'digital-marketing-masters',
      isPublished: false
    };

    console.log('📤 Envoi de la requête...');
    console.log('📋 Données:', JSON.stringify(coursData, null, 2));
    
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

    console.log('✅ SUCCÈS! Cours créé:');
    console.log('   ID:', response.data.cours.id);
    console.log('   Titre:', response.data.cours.titre);
    console.log('   Community:', response.data.cours.communitySlug);

  } catch (error) {
    console.log('❌ ERREUR:');
    console.log('   Status:', error.response?.status);
    console.log('   Message:', error.response?.data?.message);
    
    console.log('');
    console.log('🔍 VÉRIFIEZ LES LOGS DU SERVEUR pour voir les détails de debug!');
    console.log('   Les logs devraient montrer la comparaison des ObjectIds');
  }
}

testCreateCourse(); 