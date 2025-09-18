const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test d'envoi d'email réel
async function testRealEmail() {
  try {
    console.log('🧪 Test d\'envoi d\'email réel avec Ethereal Email');
    console.log('📧 Demande de mot de passe oublié...\n');
    
    const response = await axios.post(`${BASE_URL}/user/forgot-password`, {
      email: 'ghassen_zaouali@ieee.org'
    });
    
    console.log('✅ Réponse API:', response.data);
    console.log('\n📧 Vérifiez les logs de l\'application pour voir:');
    console.log('   - Les informations du compte Ethereal Email créé');
    console.log('   - L\'URL de prévisualisation de l\'email');
    console.log('\n🔗 Vous pouvez voir l\'email en visitant l\'URL de prévisualisation');
    
    return response.data;
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

// Exécuter le test
async function runTest() {
  console.log('🚀 Test d\'email réel avec Ethereal Email\n');
  
  await testRealEmail();
  
  console.log('\n✨ Test terminé');
  console.log('\n💡 Instructions:');
  console.log('1. Regardez les logs de l\'application pour voir les détails Ethereal Email');
  console.log('2. Cliquez sur l\'URL de prévisualisation pour voir l\'email');
  console.log('3. Utilisez le code de vérification pour tester la réinitialisation');
}

runTest(); 