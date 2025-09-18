const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'ghassen_zaouali@ieee.org';
const VERIFICATION_CODE = '124998'; // Code du dernier log

async function testResetWithSpecificCode() {
  try {
    console.log('🧪 Test de réinitialisation avec le code spécifique');
    console.log(`📧 Email: ${TEST_EMAIL}`);
    console.log(`🔐 Code: ${VERIFICATION_CODE}`);
    
    const response = await axios.post(`${BASE_URL}/user/reset-password`, {
      email: TEST_EMAIL,
      verificationCode: VERIFICATION_CODE,
      newPassword: 'nouveauMotDePasse123'
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

async function runTest() {
  console.log('🚀 Test avec code spécifique\n');
  
  const result = await testResetWithSpecificCode();
  
  if (result) {
    console.log('\n🎉 Réinitialisation réussie !');
    console.log('💡 Vous pouvez maintenant vous connecter avec le nouveau mot de passe');
  } else {
    console.log('\n❌ Réinitialisation échouée');
    console.log('💡 Le code a peut-être expiré ou a déjà été utilisé');
    console.log('💡 Demandez un nouveau code avec: POST /user/forgot-password');
  }
  
  console.log('\n✨ Test terminé');
}

runTest(); 