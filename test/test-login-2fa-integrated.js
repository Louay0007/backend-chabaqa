const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testLoginWith2FA() {
  console.log('🧪 Test de la 2FA intégrée dans l\'API de login\n');

  try {
    // Étape 1: Tentative de connexion sans code 2FA
    console.log('📧 Étape 1: Demande de code 2FA...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    console.log('✅ Réponse de la demande 2FA:');
    console.log('Status:', loginResponse.status);
    console.log('Requires 2FA:', loginResponse.data.requires2FA);
    console.log('Message:', loginResponse.data.message);
    console.log('Access Token:', loginResponse.data.access_token ? 'Présent' : 'Non fourni');
    console.log('');

    if (!loginResponse.data.requires2FA) {
      console.log('❌ Erreur: La réponse devrait indiquer requires2FA: true');
      return;
    }

    // Étape 2: Connexion avec code 2FA (simulation avec un code fictif)
    console.log('🔐 Étape 2: Tentative de connexion avec code 2FA...');
    console.log('⚠️  Note: Ce test utilise un code fictif. En production, vous devriez utiliser le vrai code reçu par email.\n');
    
    const loginWith2FAResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123',
      twoFactorCode: '123456' // Code fictif pour le test
    });

    console.log('✅ Réponse de la connexion avec 2FA:');
    console.log('Status:', loginWith2FAResponse.status);
    console.log('Access Token:', loginWith2FAResponse.data.access_token ? 'Présent' : 'Non fourni');
    console.log('Refresh Token:', loginWith2FAResponse.data.refresh_token ? 'Présent' : 'Non fourni');
    console.log('User:', loginWith2FAResponse.data.user ? 'Présent' : 'Non fourni');
    console.log('Message:', loginWith2FAResponse.data.message);

  } catch (error) {
    console.log('❌ Erreur lors du test:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message);
      console.log('Error:', error.response.data.error);
      
      if (error.response.status === 400 && error.response.data.message.includes('Code de vérification invalide')) {
        console.log('\n✅ Test réussi ! Le système a correctement rejeté le code 2FA invalide.');
        console.log('📧 Pour un test complet, vérifiez les logs du serveur pour voir le code envoyé par email.');
      }
    } else {
      console.log('Erreur réseau:', error.message);
    }
  }
}

async function testLoginWithout2FA() {
  console.log('\n🧪 Test de connexion sans 2FA (utilisateur sans 2FA activé)\n');

  try {
    // Créer un utilisateur de test sans 2FA
    console.log('👤 Création d\'un utilisateur de test...');
    const signupResponse = await axios.post(`${BASE_URL}/user/signup`, {
      name: 'Test User No 2FA',
      email: 'testno2fa@example.com',
      password: 'password123',
      role: 'user'
    });

    console.log('✅ Utilisateur créé:', signupResponse.data.message);

    // Tenter la connexion
    console.log('\n🔐 Tentative de connexion...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testno2fa@example.com',
      password: 'password123'
    });

    console.log('✅ Réponse de connexion:');
    console.log('Status:', loginResponse.status);
    console.log('Requires 2FA:', loginResponse.data.requires2FA);
    console.log('Access Token:', loginResponse.data.access_token ? 'Présent' : 'Non fourni');
    console.log('User:', loginResponse.data.user ? 'Présent' : 'Non fourni');

  } catch (error) {
    console.log('❌ Erreur lors du test sans 2FA:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message);
    } else {
      console.log('Erreur réseau:', error.message);
    }
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests de la 2FA intégrée dans l\'API de login\n');
  
  await testLoginWith2FA();
  await testLoginWithout2FA();
  
  console.log('\n✨ Tests terminés !');
  console.log('\n📝 Notes importantes:');
  console.log('- La 2FA est maintenant intégrée dans l\'API /auth/login');
  console.log('- Premier appel: envoie le code 2FA et retourne requires2FA: true');
  console.log('- Deuxième appel avec le code: valide et retourne les tokens JWT');
  console.log('- Vérifiez les logs du serveur pour voir les codes envoyés par email');
}

runTests().catch(console.error); 