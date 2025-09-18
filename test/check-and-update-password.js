const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Configuration pour les tests
const TEST_USER = {
  email: 'ghassen_zaouali@ieee.org',
  oldPassword: 'nouveauMotDePasse123',
  newPassword: 'password123'
};

// Test de connexion avec l'ancien mot de passe
async function testOldPassword() {
  try {
    console.log('🧪 Test avec l\'ancien mot de passe');
    console.log(`📧 Email: ${TEST_USER.email}`);
    console.log(`🔐 Mot de passe: ${TEST_USER.oldPassword}`);
    
    const response = await axios.post(`${BASE_URL}/user/request-2fa`, {
      email: TEST_USER.email,
      password: TEST_USER.oldPassword
    });
    
    console.log('✅ Connexion réussie avec l\'ancien mot de passe');
    return true;
  } catch (error) {
    console.log('❌ Échec avec l\'ancien mot de passe');
    return false;
  }
}

// Test de connexion avec le nouveau mot de passe
async function testNewPassword() {
  try {
    console.log('\n🧪 Test avec le nouveau mot de passe');
    console.log(`📧 Email: ${TEST_USER.email}`);
    console.log(`🔐 Mot de passe: ${TEST_USER.newPassword}`);
    
    const response = await axios.post(`${BASE_URL}/user/request-2fa`, {
      email: TEST_USER.email,
      password: TEST_USER.newPassword
    });
    
    console.log('✅ Connexion réussie avec le nouveau mot de passe');
    return true;
  } catch (error) {
    console.log('❌ Échec avec le nouveau mot de passe');
    return false;
  }
}

// Mettre à jour le mot de passe
async function updatePassword() {
  try {
    console.log('\n🔄 Mise à jour du mot de passe...');
    
    // D'abord, demander un code de réinitialisation
    const resetResponse = await axios.post(`${BASE_URL}/user/forgot-password`, {
      email: TEST_USER.email
    });
    
    console.log('✅ Code de réinitialisation demandé');
    console.log('📧 Vérifiez les logs de l\'application pour le code');
    
    // Note: En production, l'utilisateur recevrait le code par email
    // Ici, nous utilisons un code fictif pour la démonstration
    console.log('\n💡 Pour tester complètement:');
    console.log('1. Regardez les logs de l\'application pour le code');
    console.log('2. Utilisez ce code avec POST /user/reset-password');
    console.log('3. Puis testez la connexion 2FA');
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.response?.data || error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Vérification et mise à jour du mot de passe\n');
  
  // Test avec l'ancien mot de passe
  const oldPasswordWorks = await testOldPassword();
  
  // Test avec le nouveau mot de passe
  const newPasswordWorks = await testNewPassword();
  
  if (!oldPasswordWorks && !newPasswordWorks) {
    console.log('\n⚠️  Aucun mot de passe ne fonctionne');
    console.log('💡 Mise à jour nécessaire');
    await updatePassword();
  } else if (oldPasswordWorks) {
    console.log('\n✅ L\'ancien mot de passe fonctionne');
    console.log('💡 Utilisez ce mot de passe pour les tests 2FA');
  } else if (newPasswordWorks) {
    console.log('\n✅ Le nouveau mot de passe fonctionne');
    console.log('💡 Utilisez ce mot de passe pour les tests 2FA');
  }
  
  console.log('\n✨ Tests terminés');
}

runTests(); 