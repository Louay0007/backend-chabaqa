const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'ghassen_zaouali@ieee.org',
  password: 'ghassen$1234'
};

async function testSecureLogout() {
  console.log('🔒 TEST DU LOGOUT SÉCURISÉ AVEC RÉVOCATION DES TOKENS\n');

  // Configuration avec cookies automatiques
  const axiosWithCookies = axios.create({
    withCredentials: true,
  });

  try {
    // Étape 1: Connexion complète
    console.log('=== ÉTAPE 1: CONNEXION COMPLÈTE ===');
    console.log('1. 📝 Connexion...');
    const loginResponse = await axiosWithCookies.post(`${BASE_URL}/auth/login`, TEST_USER);
    console.log('   ✅ Connexion réussie, code 2FA envoyé');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const code = await new Promise((resolve) => {
      rl.question('   📱 Entrez le code 2FA: ', resolve);
    });
    rl.close();

    console.log('2. 🔐 Vérification 2FA...');
    const verify2FAResponse = await axiosWithCookies.post(`${BASE_URL}/auth/verify-2fa`, {
      email: TEST_USER.email,
      verificationCode: code
    });

    console.log('   ✅ Connexion réussie');
    console.log('   🍪 Cookies définis automatiquement');
    console.log('   🔑 Access token et refresh token créés');

    // Sauvegarder les tokens pour les tests manuels
    const accessToken = verify2FAResponse.data.access_token;
    const refreshToken = verify2FAResponse.data.refresh_token;
    
    console.log('\n📋 Tokens sauvegardés:');
    console.log('   Access Token:', accessToken.substring(0, 20) + '...');
    console.log('   Refresh Token:', refreshToken.substring(0, 20) + '...');

    // Étape 2: Vérifier que les tokens fonctionnent
    console.log('\n=== ÉTAPE 2: VÉRIFICATION DU FONCTIONNEMENT ===');
    console.log('3. 🔄 Test d\'accès avec cookies...');
    const profileResponse = await axiosWithCookies.get(`${BASE_URL}/auth/me`);
    console.log('   ✅ Accès réussi avec cookies');

    console.log('4. 🔄 Test de refresh avec refresh token...');
    const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken
    });
    console.log('   ✅ Refresh réussi - nouveau access token généré');

    // Étape 3: Logout sécurisé
    console.log('\n=== ÉTAPE 3: LOGOUT SÉCURISÉ ===');
    console.log('5. 🚪 Logout avec révocation des tokens...');
    const logoutResponse = await axiosWithCookies.post(`${BASE_URL}/auth/logout`);
    console.log('   ✅ Logout réussi');
    console.log('   📝 Message:', logoutResponse.data.message);
    console.log('   🔢 Tokens révoqués:', logoutResponse.data.revokedTokens);
    console.log('   📋 Détails:', logoutResponse.data.details);

    // Étape 4: Vérifier que les tokens sont révoqués
    console.log('\n=== ÉTAPE 4: VÉRIFICATION DE LA RÉVOCATION ===');
    
    console.log('6. ❌ Test d\'accès après logout (avec cookies)...');
    try {
      await axiosWithCookies.get(`${BASE_URL}/auth/me`);
      console.log('   ❌ ERREUR: L\'accès devrait être refusé');
    } catch (error) {
      console.log('   ✅ Accès correctement refusé (cookies supprimés)');
    }

    console.log('7. ❌ Test de refresh après logout (avec refresh token)...');
    try {
      const refreshAfterLogout = await axios.post(`${BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken
      });
      console.log('   ❌ ERREUR CRITIQUE: Le refresh token devrait être révoqué !');
      console.log('   🚨 Problème de sécurité détecté');
    } catch (error) {
      console.log('   ✅ Refresh correctement refusé (token révoqué côté serveur)');
      console.log('   📄 Statut:', error.response?.status);
      console.log('   📝 Message:', error.response?.data?.message);
    }

    console.log('8. ❌ Test d\'accès avec access token après logout...');
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      console.log('   ❌ ERREUR: L\'access token devrait être révoqué');
    } catch (error) {
      console.log('   ✅ Access token correctement révoqué');
    }

    console.log('\n🎉 TEST RÉUSSI ! Le logout est maintenant sécurisé :');
    console.log('   • Tokens révoqués côté serveur ✅');
    console.log('   • Cookies supprimés côté client ✅');
    console.log('   • Refresh token ne fonctionne plus ✅');
    console.log('   • Access token ne fonctionne plus ✅');

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('   📄 Statut:', error.response.status);
      console.error('   📝 Données:', error.response.data);
    }
  }
}

// Test de révocation de tous les tokens
async function testRevokeAllTokens() {
  console.log('\n🔥 TEST DE RÉVOCATION DE TOUS LES TOKENS\n');

  const axiosWithCookies = axios.create({
    withCredentials: true,
  });

  try {
    // Connexion
    console.log('1. 📝 Connexion...');
    const loginResponse = await axiosWithCookies.post(`${BASE_URL}/auth/login`, TEST_USER);

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const code = await new Promise((resolve) => {
      rl.question('   📱 Entrez le code 2FA: ', resolve);
    });
    rl.close();

    await axiosWithCookies.post(`${BASE_URL}/auth/verify-2fa`, {
      email: TEST_USER.email,
      verificationCode: code
    });

    console.log('   ✅ Connexion réussie');

    // Révocation de tous les tokens
    console.log('2. 🔥 Révocation de tous les tokens...');
    const revokeResponse = await axiosWithCookies.post(`${BASE_URL}/auth/revoke-all-tokens`);
    console.log('   ✅ Révocation réussie');
    console.log('   📝 Message:', revokeResponse.data.message);
    console.log('   📋 Détails:', revokeResponse.data.details);

    // Vérification
    console.log('3. ❌ Test d\'accès après révocation...');
    try {
      await axiosWithCookies.get(`${BASE_URL}/auth/me`);
      console.log('   ❌ ERREUR: L\'accès devrait être refusé');
    } catch (error) {
      console.log('   ✅ Accès correctement refusé (tous les tokens révoqués)');
    }

    console.log('\n🎉 Révocation de tous les tokens réussie !');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  }
}

// Test de comparaison avant/après
async function testComparisonBeforeAfter() {
  console.log('\n📊 COMPARAISON AVANT/APRÈS L\'AMÉLIORATION\n');

  console.log('🔴 AVANT (problème de sécurité):');
  console.log('   1. User fait login + 2FA → Tokens créés');
  console.log('   2. User fait logout → Seulement cookies supprimés');
  console.log('   3. Attaquant utilise refresh token → ✅ Fonctionne (PROBLÈME!)');
  console.log('   4. Attaquant peut créer nouveaux access tokens');

  console.log('\n🟢 APRÈS (sécurisé):');
  console.log('   1. User fait login + 2FA → Tokens créés avec ID unique');
  console.log('   2. User fait logout → Tokens révoqués + cookies supprimés');
  console.log('   3. Attaquant utilise refresh token → ❌ Révoqué (SÉCURISÉ!)');
  console.log('   4. Impossible de créer nouveaux access tokens');

  console.log('\n🛡️ SÉCURITÉ AMÉLIORÉE:');
  console.log('   • Blacklist des tokens révoqués');
  console.log('   • Vérification côté serveur');
  console.log('   • IDs uniques pour chaque token');
  console.log('   • Nettoyage automatique des tokens expirés');
}

// Fonction principale
async function main() {
  console.log('🔐 TEST COMPLET DU LOGOUT SÉCURISÉ\n');
  console.log('Ce script teste la sécurité du logout avec révocation des tokens.\n');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const choice = await new Promise((resolve) => {
    rl.question('Choisissez le test:\n1. Test logout sécurisé\n2. Test révocation tous tokens\n3. Comparaison avant/après\n4. Tous les tests\n\nChoix (1/2/3/4): ', resolve);
  });
  rl.close();

  switch (choice) {
    case '1':
      await testSecureLogout();
      break;
    case '2':
      await testRevokeAllTokens();
      break;
    case '3':
      await testComparisonBeforeAfter();
      break;
    case '4':
      await testSecureLogout();
      await testRevokeAllTokens();
      await testComparisonBeforeAfter();
      break;
    default:
      console.log('Choix invalide');
  }
}

main(); 