const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'ghassen_zaouali@ieee.org',
  password: 'ghassen$1234'
};

async function testRememberMe() {
  console.log('🔐 TEST DU SYSTÈME "REMEMBER ME"\n');

  try {
    // Test 1: Connexion SANS "Remember Me"
    console.log('=== TEST 1: CONNEXION NORMALE (sans Remember Me) ===');
    console.log('1. 📝 Connexion normale...');
    const loginResponse1 = await axios.post(`${BASE_URL}/auth/login`, {
      ...TEST_USER,
      remember_me: false
    });
    console.log('   ✅ Connexion réussie');
    console.log('   📧 Code 2FA envoyé');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const code1 = await new Promise((resolve) => {
      rl.question('   📱 Entrez le code 2FA pour la connexion normale: ', resolve);
    });

    const verify2FA1 = await axios.post(`${BASE_URL}/auth/verify-2fa`, {
      email: TEST_USER.email,
      verificationCode: code1
    });

    console.log('   ✅ Vérification réussie');
    console.log('   🍪 RememberMe:', verify2FA1.data.rememberMe);
    console.log('   💬 Message:', verify2FA1.data.message);
    console.log('   🕒 Durée estimée: 2h access / 30j refresh');

    // Test 2: Connexion AVEC "Remember Me"
    console.log('\n=== TEST 2: CONNEXION AVEC "REMEMBER ME" ===');
    console.log('2. 📝 Connexion avec Remember Me...');
    const loginResponse2 = await axios.post(`${BASE_URL}/auth/login`, {
      ...TEST_USER,
      remember_me: true
    });
    console.log('   ✅ Connexion réussie');
    console.log('   📧 Code 2FA envoyé');

    const code2 = await new Promise((resolve) => {
      rl.question('   📱 Entrez le code 2FA pour la connexion "Remember Me": ', resolve);
    });

    const verify2FA2 = await axios.post(`${BASE_URL}/auth/verify-2fa`, {
      email: TEST_USER.email,
      verificationCode: code2
    });

    console.log('   ✅ Vérification réussie');
    console.log('   🍪 RememberMe:', verify2FA2.data.rememberMe);
    console.log('   💬 Message:', verify2FA2.data.message);
    console.log('   🕒 Durée estimée: 4h access / 90j refresh');

    rl.close();

    // Test 3: Analyser les tokens JWT
    console.log('\n=== TEST 3: ANALYSE DES TOKENS JWT ===');
    
    function decodeJWT(token) {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return payload;
      } catch (error) {
        return null;
      }
    }

    const normalToken = decodeJWT(verify2FA1.data.access_token);
    const rememberToken = decodeJWT(verify2FA2.data.access_token);

    console.log('🔍 Token normal (sans Remember Me):');
    console.log('   - Expire à:', new Date(normalToken.exp * 1000).toLocaleString());
    console.log('   - Durée:', Math.round((normalToken.exp - normalToken.iat) / 3600), 'heures');

    console.log('\n🔍 Token Remember Me:');
    console.log('   - Expire à:', new Date(rememberToken.exp * 1000).toLocaleString());
    console.log('   - Durée:', Math.round((rememberToken.exp - rememberToken.iat) / 3600), 'heures');

    // Test 4: Différence des refresh tokens
    const normalRefresh = decodeJWT(verify2FA1.data.refresh_token);
    const rememberRefresh = decodeJWT(verify2FA2.data.refresh_token);

    console.log('\n🔄 Refresh Token normal:');
    console.log('   - Expire à:', new Date(normalRefresh.exp * 1000).toLocaleString());
    console.log('   - Durée:', Math.round((normalRefresh.exp - normalRefresh.iat) / (24 * 3600)), 'jours');

    console.log('\n🔄 Refresh Token Remember Me:');
    console.log('   - Expire à:', new Date(rememberRefresh.exp * 1000).toLocaleString());
    console.log('   - Durée:', Math.round((rememberRefresh.exp - rememberRefresh.iat) / (24 * 3600)), 'jours');

    console.log('\n🎉 RÉSUMÉ DES AVANTAGES :');
    console.log('┌─────────────────────────────┬─────────────────────┬─────────────────────┐');
    console.log('│ Fonctionnalité              │ Sans Remember Me    │ Avec Remember Me    │');
    console.log('├─────────────────────────────┼─────────────────────┼─────────────────────┤');
    console.log('│ Durée Access Token          │ 2 heures            │ 4 heures            │');
    console.log('│ Durée Refresh Token         │ 30 jours            │ 90 jours            │');
    console.log('│ Fréquence reconnexion 2FA   │ Tous les 30 jours   │ Tous les 90 jours   │');
    console.log('│ Durée session sans refresh  │ 2 heures            │ 4 heures            │');
    console.log('└─────────────────────────────┴─────────────────────┴─────────────────────┘');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.response) {
      console.error('   📄 Statut:', error.response.status);
      console.error('   📝 Données:', error.response.data);
    }
  }
}

// Test avec cookies automatiques
async function testRememberMeWithCookies() {
  console.log('\n🍪 TEST "REMEMBER ME" AVEC COOKIES AUTOMATIQUES\n');

  const axiosWithCookies = axios.create({
    withCredentials: true,
  });

  try {
    console.log('1. 📝 Connexion avec Remember Me...');
    const loginResponse = await axiosWithCookies.post(`${BASE_URL}/auth/login`, {
      ...TEST_USER,
      remember_me: true
    });

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const code = await new Promise((resolve) => {
      rl.question('   📱 Entrez le code 2FA: ', resolve);
    });
    rl.close();

    const verify2FA = await axiosWithCookies.post(`${BASE_URL}/auth/verify-2fa`, {
      email: TEST_USER.email,
      verificationCode: code
    });

    console.log('   ✅ Connexion réussie avec Remember Me');
    console.log('   🍪 Cookies définis automatiquement pour 90 jours');

    // Test d'accès immédiat
    console.log('\n2. 🔄 Test d\'accès immédiat avec cookies...');
    const profileResponse = await axiosWithCookies.get(`${BASE_URL}/auth/me`);
    console.log('   ✅ Accès réussi automatiquement');
    console.log('   👤 Utilisateur:', profileResponse.data.user.email);

    console.log('\n🎯 MAINTENANT, vous pouvez fermer le navigateur et revenir plus tard !');
    console.log('   Les cookies resteront valides pendant 90 jours au lieu de 30.');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  }
}

// Fonction principale
async function main() {
  console.log('🚀 TEST COMPLET DU SYSTÈME "REMEMBER ME"\n');
  console.log('Ce système permet de réduire la fréquence du 2FA :');
  console.log('• Sans Remember Me: 2FA tous les 30 jours');
  console.log('• Avec Remember Me: 2FA tous les 90 jours');
  console.log('• Plus de durée de session active\n');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const choice = await new Promise((resolve) => {
    rl.question('Choisissez le test:\n1. Comparaison détaillée\n2. Test avec cookies automatiques\n3. Les deux\n\nChoix (1/2/3): ', resolve);
  });
  rl.close();

  switch (choice) {
    case '1':
      await testRememberMe();
      break;
    case '2':
      await testRememberMeWithCookies();
      break;
    case '3':
      await testRememberMe();
      await testRememberMeWithCookies();
      break;
    default:
      console.log('Choix invalide');
  }
}

main(); 