const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Configuration pour les tests
const TEST_USER = {
  email: 'ghassen_zaouali@ieee.org',
  password: 'nouveauMotDePasse123' // Le mot de passe mis à jour précédemment
};

// Test 1: Demande de code 2FA
async function testRequest2FA() {
  try {
    console.log('🧪 Test 1: Demande de code 2FA');
    console.log(`📧 Email: ${TEST_USER.email}`);
    
    const response = await axios.post(`${BASE_URL}/user/request-2fa`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    console.log('✅ Réponse:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    return null;
  }
}

// Test 2: Connexion avec 2FA (avec un code fictif)
async function testLoginWith2FA(verificationCode = '123456') {
  try {
    console.log('\n🧪 Test 2: Connexion avec 2FA');
    console.log(`🔐 Code utilisé: ${verificationCode}`);
    
    const response = await axios.post(`${BASE_URL}/user/login-2fa`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      verificationCode: verificationCode
    });
    
    console.log('✅ Réponse:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    return null;
  }
}

// Test 3: Flux complet avec code réel
async function testComplete2FAFlow() {
  try {
    console.log('\n🧪 Test 3: Flux complet 2FA');
    
    // Étape 1: Demander le code 2FA
    console.log('📧 Étape 1: Demande de code 2FA...');
    const requestResult = await testRequest2FA();
    
    if (!requestResult) {
      console.log('❌ Impossible de demander le code 2FA');
      return;
    }
    
    console.log('✅ Code 2FA demandé avec succès');
    console.log('📧 Vérifiez les logs de l\'application pour voir l\'URL de prévisualisation');
    console.log('💡 Utilisez le code de l\'email pour tester la connexion');
    
    // Note: En production, l'utilisateur recevrait le code par email
    // Ici, nous utilisons un code fictif pour tester
    console.log('\n🔐 Étape 2: Test de connexion avec code fictif...');
    await testLoginWith2FA();
    
  } catch (error) {
    console.error('❌ Erreur dans le flux complet:', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Tests de l\'authentification à deux facteurs (2FA)\n');
  
  // Test simple de demande de code
  await testRequest2FA();
  
  // Test de connexion avec code fictif
  await testLoginWith2FA();
  
  // Test du flux complet
  await testComplete2FAFlow();
  
  console.log('\n✨ Tests terminés');
  console.log('\n💡 Instructions:');
  console.log('1. Regardez les logs de l\'application pour voir l\'URL de prévisualisation');
  console.log('2. Cliquez sur l\'URL pour voir l\'email avec le code 2FA');
  console.log('3. Utilisez ce code pour tester la connexion complète');
}

runTests(); 