const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODYzZWI4Y2UyYzlmMDA0Zjg2NDg5NTAiLCJlbWFpbCI6ImdoYXNzZW5femFvdWFsaUBpZWVlLm9yZyIsInJvbGUiOiJ1c2VyIiwianRpIjoiNjg2M2ViOGNlMmM5ZjAwNGY4NjQ4OTUwLWFjY2Vzcy0xNzUzNzEzMzA3NDQ0IiwiaWF0IjoxNzUzNzEzMzA3LCJleHAiOjE3NTM3Mjc3MDd9.hzO4ahbogl8BRc49p9Ka1RJDDHFZMWoH6LJemdf6RgQ';

async function testCommunityFix() {
  console.log('🧪 Test Correction - GET Cours par Communauté');
  console.log('===========================================');

  try {
    const communitySlug = 'digital-marketing-masters';
    console.log(`🏢 Test avec communauté: ${communitySlug}`);
    console.log('');

    const response = await axios.get(
      `${BASE_URL}/cours/community/${communitySlug}?page=1&limit=10&published=false`,
      {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`
        }
      }
    );

    console.log('🎉 SUCCÈS ! Plus d\'erreur 404');
    console.log(`📊 Cours trouvés: ${response.data.total}`);
    console.log(`📚 Cours dans cette page: ${response.data.cours.length}`);
    
    if (response.data.cours.length > 0) {
      console.log('');
      console.log('📋 Premiers cours:');
      response.data.cours.slice(0, 3).forEach((cours, index) => {
        console.log(`   ${index + 1}. "${cours.titre}"`);
        console.log(`      📊 Sections: ${cours.sections?.length || 0}`);
        console.log(`      📚 Chapitres: ${cours.chapitres?.length || 0}`);
        console.log(`      💰 Prix: ${cours.prix} ${cours.devise || 'TND'}`);
      });
    } else {
      console.log('ℹ️  La communauté existe mais ne contient aucun cours');
      console.log('   💡 Créez un cours pour tester complètement');
    }

    console.log('');
    console.log('✅ CORRECTION RÉUSSIE !');
    console.log('   🔧 verifierMembreCommunaute utilise maintenant le slug correct');
    console.log('   🏢 La communauté est bien trouvée et accessible');

  } catch (error) {
    console.log('❌ ERREUR:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message}`);
    
    if (error.response?.status === 404) {
      console.log('');
      console.log('🔍 Si encore 404:');
      console.log('   • Vérifiez que la communauté existe vraiment');
      console.log('   • Vérifiez le slug exact de la communauté');
    } else if (error.response?.status === 403) {
      console.log('');
      console.log('🔒 Problème d\'autorisation:');
      console.log('   • L\'utilisateur n\'est pas membre de la communauté');
      console.log('   • Ajoutez l\'utilisateur à la communauté');
    } else if (error.response?.status === 401) {
      console.log('');
      console.log('🔑 Token expiré');
      console.log('   • Obtenez un nouveau token');
    }
  }
}

console.log('🚀 TEST CORRECTION 404');
console.log('=====================');
console.log('');
console.log('🔧 Problème identifié:');
console.log('   ❌ verifierMembreCommunaute(userId, communityId) ← FAUX');
console.log('   ✅ verifierMembreCommunaute(userId, communitySlug) ← CORRECT');
console.log('');
console.log('📋 Corrections appliquées:');
console.log('   ✅ obtenirCoursParCommunaute: passe community.slug');
console.log('   ✅ obtenirCours: récupère community puis passe community.slug');
console.log('');

testCommunityFix(); 