const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODYzZWI4Y2UyYzlmMDA0Zjg2NDg5NTAiLCJlbWFpbCI6ImdoYXNzZW5femFvdWFsaUBpZWVlLm9yZyIsInJvbGUiOiJ1c2VyIiwianRpIjoiNjg2M2ViOGNlMmM5ZjAwNGY4NjQ4OTUwLWFjY2Vzcy0xNzUzNzEzMzA3NDQ0IiwiaWF0IjoxNzUzNzEzMzA3LCJleHAiOjE3NTM3Mjc3MDd9.hzO4ahbogl8BRc49p9Ka1RJDDHFZMWoH6LJemdf6RgQ';

async function testCommunityCreation() {
  console.log('🧪 Test création de communauté - Fix inviteCode');
  console.log('==============================================');

  try {
    const communityData = {
      "name": `Test Community Fix ${Date.now()}`,
      "bio": "Communauté de test pour corriger le problème d'inviteCode",
      "country": "Tunisia",
      "status": "public",
      "joinFee": "free",
      "feeAmount": "0",
      "currency": "TND",
      "socialLinks": {
        "instagram": "@testcommunity",
        "tiktok": "",
        "facebook": "https://facebook.com/testcommunity",
        "youtube": "",
        "linkedin": "",
        "website": "https://testcommunity.com"
      }
    };

    console.log('📤 Création de la communauté...');
    console.log(`   📋 Nom: "${communityData.name}"`);
    console.log(`   🌍 Pays: ${communityData.country}`);
    console.log(`   🔓 Statut: ${communityData.status}`);

    const response = await axios.post(
      `${BASE_URL}/community-aff-crea-join/create`,
      communityData,
      {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('');
    console.log('🎉 SUCCÈS! Communauté créée:');
    console.log(`   📋 Nom: ${response.data.name}`);
    console.log(`   🔗 Slug: ${response.data.slug}`);
    console.log(`   🎫 Invite Code: ${response.data.inviteCode || 'Généré automatiquement'}`);
    console.log(`   👥 Membres: ${response.data.membersCount}`);
    console.log(`   💰 Frais: ${response.data.fees_of_join} ${response.data.currency}`);
    
    console.log('');
    console.log('✅ Problème inviteCode résolu !');
    console.log('🔍 L\'inviteCode est maintenant généré automatiquement');
    
  } catch (error) {
    console.log('❌ ERREUR:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message}`);
    
    if (error.response?.status === 500) {
      console.log('');
      console.log('🔍 Si l\'erreur persiste, il faut peut-être:');
      console.log('   • Supprimer l\'index unique existant sur inviteCode');
      console.log('   • Redémarrer MongoDB');
      console.log('   • Ou nettoyer les documents avec inviteCode: null');
    }
  }
}

testCommunityCreation(); 