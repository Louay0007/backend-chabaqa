const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Configuration pour les tests
const TEST_EMAIL = 'ghassen_zaouali@ieee.org';

// Test 1: Demande de mot de passe oublié
async function testForgotPassword() {
  try {
    console.log('🧪 Test 1: Demande de mot de passe oublié');
    console.log(`📧 Email testé: ${TEST_EMAIL}`);
    
    const response = await axios.post(`${BASE_URL}/user/forgot-password`, {
      email: TEST_EMAIL
    });
    
    console.log('✅ Réponse:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`📊 Status: ${error.response.status}`);
    }
    return null;
  }
}

// Test 2: Vérifier si l'utilisateur existe
async function testUserExists() {
  try {
    console.log('\n🧪 Test 2: Vérification de l\'existence de l\'utilisateur');
    
    // On va essayer de récupérer tous les utilisateurs pour voir si l'email existe
    const response = await axios.get(`${BASE_URL}/user/all-users`);
    
    const users = response.data.users;
    const user = users.find(u => u.email === TEST_EMAIL);
    
    if (user) {
      console.log('✅ Utilisateur trouvé:', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
      return user;
    } else {
      console.log('❌ Utilisateur non trouvé dans la base de données');
      console.log('📧 Emails disponibles:', users.map(u => u.email));
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.response?.data || error.message);
    return null;
  }
}

// Test 3: Réinitialisation du mot de passe (avec un code fictif)
async function testResetPassword() {
  try {
    console.log('\n🧪 Test 3: Réinitialisation du mot de passe (test avec code fictif)');
    
    const response = await axios.post(`${BASE_URL}/user/reset-password`, {
      email: TEST_EMAIL,
      verificationCode: '123456',
      newPassword: 'nouveauMotDePasse123'
    });
    
    console.log('✅ Réponse:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    return null;
  }
}

// Test 4: Vérifier la configuration de l'environnement
function checkEnvironment() {
  console.log('\n🔧 Test 4: Vérification de la configuration');
  
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER ? '✅ Configuré' : '❌ Non configuré',
    SMTP_PASS: process.env.SMTP_PASS ? '✅ Configuré' : '❌ Non configuré',
    SMTP_FROM: process.env.SMTP_FROM
  };
  
  console.log('📋 Variables d\'environnement:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n💡 Conseil: En mode développement, le service email mock sera utilisé');
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests de mot de passe oublié améliorés\n');
  
  checkEnvironment();
  
  const user = await testUserExists();
  
  if (user) {
    await testForgotPassword();
    await testResetPassword();
  } else {
    console.log('\n⚠️  Impossible de continuer les tests car l\'utilisateur n\'existe pas');
    console.log('💡 Créez d\'abord un utilisateur avec cet email');
  }
  
  console.log('\n✨ Tests terminés');
}

runTests(); 