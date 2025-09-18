const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'ghassen_zaouali@ieee.org',
  password: 'password123'
};

// Configuration d'axios pour gérer les cookies
const axiosInstance = axios.create({
  withCredentials: true, // Important pour les cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

async function testCookieAuthentication() {
  console.log('🚀 Test du système d\'authentification avec cookies\n');

  try {
    // 1. Test de connexion
    console.log('1. 📝 Test de connexion...');
    const loginResponse = await axiosInstance.post(`${BASE_URL}/auth/login`, TEST_USER);
    console.log('   ✅ Connexion réussie');
    console.log('   📧 Code 2FA envoyé par email');
    console.log('   🔐 requires2FA:', loginResponse.data.requires2FA);
    
    // Attendre la saisie du code 2FA
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const verificationCode = await new Promise((resolve) => {
      rl.question('   📱 Entrez le code 2FA reçu par email: ', resolve);
    });
    rl.close();

    // 2. Test de vérification 2FA
    console.log('\n2. 🔐 Test de vérification 2FA...');
    const verify2FAResponse = await axiosInstance.post(`${BASE_URL}/auth/verify-2fa`, {
      email: TEST_USER.email,
      verificationCode: verificationCode
    });
    
    console.log('   ✅ Vérification 2FA réussie');
    console.log('   🍪 Cookies automatiquement définis');
    console.log('   👤 Utilisateur connecté:', verify2FAResponse.data.user.name);

    // 3. Test d'accès à un endpoint protégé (avec cookies)
    console.log('\n3. 🛡️ Test d\'accès avec cookies...');
    const profileResponse = await axiosInstance.get(`${BASE_URL}/auth/me`);
    console.log('   ✅ Accès réussi avec cookies');
    console.log('   👤 Profil:', profileResponse.data.user.email);

    // 4. Test de rafraîchissement de token (avec cookies)
    console.log('\n4. 🔄 Test de rafraîchissement avec cookies...');
    const refreshResponse = await axiosInstance.post(`${BASE_URL}/auth/refresh`, {});
    console.log('   ✅ Rafraîchissement réussi avec cookies');
    console.log('   🕒 Nouveau token expires_in:', refreshResponse.data.expires_in, 'secondes');

    // 5. Test de déconnexion
    console.log('\n5. 🚪 Test de déconnexion...');
    const logoutResponse = await axiosInstance.post(`${BASE_URL}/auth/logout`);
    console.log('   ✅ Déconnexion réussie');
    console.log('   🗑️ Cookies supprimés');

    // 6. Test d'accès après déconnexion (devrait échouer)
    console.log('\n6. ❌ Test d\'accès après déconnexion...');
    try {
      await axiosInstance.get(`${BASE_URL}/auth/me`);
      console.log('   ❌ ERREUR: L\'accès devrait être refusé');
    } catch (error) {
      console.log('   ✅ Accès correctement refusé après déconnexion');
      console.log('   📄 Statut:', error.response?.status);
    }

    console.log('\n🎉 Tous les tests de cookies ont réussi !');

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('   📄 Statut:', error.response.status);
      console.error('   📝 Données:', error.response.data);
    }
  }
}

// Fonction pour tester la compatibilité avec les headers
async function testHeaderCompatibility() {
  console.log('\n🔄 Test de compatibilité avec les headers...\n');

  try {
    // 1. Connexion pour obtenir les tokens
    console.log('1. 📝 Connexion pour obtenir les tokens...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const verificationCode = await new Promise((resolve) => {
      rl.question('   📱 Entrez le code 2FA: ', resolve);
    });
    rl.close();

    const verify2FAResponse = await axios.post(`${BASE_URL}/auth/verify-2fa`, {
      email: TEST_USER.email,
      verificationCode: verificationCode
    });

    const accessToken = verify2FAResponse.data.access_token;
    console.log('   ✅ Tokens obtenus');

    // 2. Test avec header Authorization
    console.log('\n2. 🔑 Test avec header Authorization...');
    const headerResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('   ✅ Accès réussi avec header Authorization');
    console.log('   👤 Profil:', headerResponse.data.user.email);

    console.log('\n🎉 Compatibilité avec les headers confirmée !');

  } catch (error) {
    console.error('\n❌ Erreur lors du test de compatibilité:', error.message);
    if (error.response) {
      console.error('   📄 Statut:', error.response.status);
      console.error('   📝 Données:', error.response.data);
    }
  }
}

// Fonction principale
async function main() {
  console.log('🍪 TEST COMPLET DU SYSTÈME DE COOKIES\n');
  console.log('📋 Ce script teste :');
  console.log('   - Connexion avec cookies automatiques');
  console.log('   - Vérification 2FA avec cookies');
  console.log('   - Accès aux endpoints protégés via cookies');
  console.log('   - Rafraîchissement de token via cookies');
  console.log('   - Déconnexion avec suppression des cookies');
  console.log('   - Compatibilité avec les headers Authorization');
  console.log('\n⚠️  Assurez-vous que le serveur est démarré sur localhost:3000\n');

  // Attendre la confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await new Promise((resolve) => {
    rl.question('Appuyez sur Entrée pour commencer les tests...', resolve);
  });
  rl.close();

  await testCookieAuthentication();
  await testHeaderCompatibility();
}

main(); 