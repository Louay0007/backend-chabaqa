const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAuthWith2FA() {
  console.log('🚀 Test de la nouvelle approche 2FA dans le module Auth\n');

  try {
    // Étape 1: Connexion avec envoi automatique du code 2FA
    console.log('🔐 Étape 1: Connexion avec envoi automatique du code 2FA...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    console.log('✅ Réponse de la connexion:');
    console.log('Status:', loginResponse.status);
    console.log('Requires 2FA:', loginResponse.data.requires2FA);
    console.log('Message:', loginResponse.data.message);
    console.log('Access Token:', loginResponse.data.access_token || 'Non fourni (normal)');
    console.log('');

    if (!loginResponse.data.requires2FA) {
      console.log('❌ Erreur: La réponse devrait indiquer requires2FA: true');
      return;
    }

    // Étape 2: Attendre un peu pour simuler l'utilisateur qui reçoit et saisit le code
    console.log('⏳ Simulation: L\'utilisateur reçoit le code par email...');
    console.log('📧 Vérifiez les logs du serveur pour voir le code envoyé');
    console.log('');

    // Étape 3: Tentative de vérification avec un code fictif
    console.log('🔍 Étape 2: Tentative de vérification avec code fictif...');
    try {
      const verifyResponse = await axios.post(`${BASE_URL}/auth/verify-2fa`, {
        email: 'test@example.com',
        verificationCode: '123456' // Code fictif
      });

      console.log('✅ Vérification réussie (ne devrait pas arriver avec un code fictif):');
      console.log('Status:', verifyResponse.status);
      console.log('Access Token:', verifyResponse.data.access_token ? 'Présent' : 'Non fourni');
      console.log('User:', verifyResponse.data.user ? 'Présent' : 'Non fourni');

    } catch (verifyError) {
      if (verifyError.response && verifyError.response.status === 400) {
        console.log('✅ Test réussi ! Le système a correctement rejeté le code fictif');
        console.log('Message:', verifyError.response.data.message);
        console.log('');
        console.log('📝 Pour un test complet:');
        console.log('1. Vérifiez les logs du serveur pour voir le vrai code');
        console.log('2. Utilisez le vrai code avec /auth/verify-2fa');
        console.log('3. Vous recevrez alors les tokens JWT');
      } else {
        console.log('❌ Erreur inattendue lors de la vérification:', verifyError.message);
      }
    }

  } catch (error) {
    console.log('❌ Erreur lors du test de connexion:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message);
      console.log('Error:', error.response.data.error);
    } else {
      console.log('Erreur réseau:', error.message);
    }
  }
}

async function testFullWorkflow() {
  console.log('\n🔄 Test du workflow complet avec exemple de code réel\n');
  
  console.log('📋 Workflow de la 2FA:');
  console.log('1. POST /auth/login avec email/password');
  console.log('   → Retourne requires2FA: true');
  console.log('   → Envoie le code par email');
  console.log('');
  console.log('2. POST /auth/verify-2fa avec email/verificationCode');
  console.log('   → Retourne access_token et refresh_token');
  console.log('   → Retourne les informations utilisateur');
  console.log('');
  console.log('3. Utiliser access_token pour les requêtes protégées');
  console.log('');
  
  console.log('🎯 Avantages de cette approche:');
  console.log('• Séparation claire des responsabilités');
  console.log('• Module Auth centralisé pour l\'authentification');
  console.log('• Module User pour la gestion des utilisateurs');
  console.log('• API plus logique et intuitive');
  console.log('• Tokens JWT seulement après validation complète');
}

// Exécuter les tests
async function runTests() {
  console.log('🧪 Tests de la nouvelle architecture 2FA\n');
  
  await testAuthWith2FA();
  await testFullWorkflow();
  
  console.log('\n✨ Tests terminés !');
  console.log('\n📚 Résumé des endpoints:');
  console.log('• POST /auth/login - Connexion + envoi code 2FA');
  console.log('• POST /auth/verify-2fa - Vérification code + tokens JWT');
  console.log('• POST /auth/refresh - Rafraîchissement token');
  console.log('• GET /auth/me - Profil utilisateur (protégé)');
  console.log('• POST /auth/logout - Déconnexion');
}

runTests().catch(console.error); 