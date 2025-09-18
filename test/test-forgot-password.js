const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test 1: Demande de mot de passe oublié
async function testForgotPassword() {
  try {
    console.log('🧪 Test 1: Demande de mot de passe oublié');
    
    const response = await axios.post(`${BASE_URL}/user/forgot-password`, {
      email: 'test@example.com'
    });
    
    console.log('✅ Réponse:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

// Test 2: Réinitialisation du mot de passe (avec un code fictif)
async function testResetPassword() {
  try {
    console.log('\n🧪 Test 2: Réinitialisation du mot de passe');
    
    const response = await axios.post(`${BASE_URL}/user/reset-password`, {
      email: 'test@example.com',
      verificationCode: '123456',
      newPassword: 'nouveauMotDePasse123'
    });
    
    console.log('✅ Réponse:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests de mot de passe oublié\n');
  
  await testForgotPassword();
  await testResetPassword();
  
  console.log('\n✨ Tests terminés');
}

runTests(); 