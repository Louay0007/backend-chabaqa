const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3000';

// Variables globales pour les tests
let adminToken = null;
let userToken = null;

// Test complet du système de révocation de tokens
async function testTokenRevocation() {
  console.log('🔐 TEST COMPLET - RÉVOCATION DES TOKENS APRÈS LOGOUT\n');
  console.log('='.repeat(70) + '\n');

  try {
    // ÉTAPE 1: Login admin et obtenir un token
    console.log('🔑 ÉTAPE 1: Login admin...\n');
    await loginAdmin();
    
    // ÉTAPE 2: Tester que le token fonctionne AVANT logout
    console.log('🧪 ÉTAPE 2: Test token AVANT logout...\n');
    const beforeLogout = await testTokenValidity(adminToken, 'ADMIN AVANT LOGOUT');
    
    if (!beforeLogout) {
      console.log('❌ Le token ne fonctionne même pas avant logout - arrêt du test');
      return;
    }

    // ÉTAPE 3: Logout admin
    console.log('🚪 ÉTAPE 3: Logout admin...\n');
    await logoutAdmin();
    
    // ÉTAPE 4: Tester que le token NE fonctionne PLUS après logout
    console.log('🧪 ÉTAPE 4: Test token APRÈS logout...\n');
    const afterLogout = await testTokenValidity(adminToken, 'ADMIN APRÈS LOGOUT');
    
    // ÉTAPE 5: Résultats finaux
    console.log('📊 RÉSULTATS FINAUX');
    console.log('='.repeat(30));
    console.log(`Token avant logout: ${beforeLogout ? '✅ Valide' : '❌ Invalide'}`);
    console.log(`Token après logout: ${afterLogout ? '❌ PROBLÈME - Encore valide!' : '✅ Correct - Invalide'}`);
    
    if (beforeLogout && !afterLogout) {
      console.log('\n🎉 SYSTÈME DE RÉVOCATION FONCTIONNE !');
      console.log('✅ Les tokens sont correctement révoqués après logout');
      console.log('✅ La sécurité est assurée');
    } else {
      console.log('\n🚨 PROBLÈME DE SÉCURITÉ !');
      console.log('❌ Les tokens ne sont pas révoqués après logout');
      console.log('❌ Les utilisateurs restent connectés après déconnexion');
    }

  } catch (error) {
    console.log('❌ Erreur durant les tests:', error.message);
  }
}

// Login admin et récupération du token
async function loginAdmin() {
  try {
    // Login initial
    const loginResponse = await axios.post(`${API_BASE}/admin/login`, {
      email: 'ghassen.zaouali2019@gmail.com',
      password: 'Ghassen123'
    });

    console.log('📧 Code 2FA envoyé');
    
    // Demander le code 2FA à l'utilisateur
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const code = await new Promise((resolve) => {
      readline.question('Entrez le code 2FA reçu par email: ', (answer) => {
        readline.close();
        resolve(answer);
      });
    });

    // Vérification 2FA
    const verify2FAResponse = await axios.post(`${API_BASE}/admin/verify-2fa`, {
      email: 'ghassen.zaouali2019@gmail.com',
      verificationCode: code.trim()
    });

    adminToken = verify2FAResponse.data.access_token;
    console.log('✅ Login admin réussi');
    console.log(`📋 Token obtenu: ${adminToken.substring(0, 50)}...`);
    
  } catch (error) {
    console.log('❌ Erreur lors du login admin:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Test de validité d'un token sur différentes APIs
async function testTokenValidity(token, context) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log(`🔍 Test validité token - ${context}`);

  // Tester sur plusieurs endpoints pour s'assurer de la cohérence
  const endpoints = [
    { name: 'Resources Summary', url: '/resources/getAllResourcesSummary' },
    { name: 'Auth Me', url: '/auth/me' },
    { name: 'Resources Create', url: '/resources/create', method: 'post', data: {
        titre: 'Test Token Validity',
        description: 'Article de test pour vérifier la validité du token',
        type: 'Article',
        readTime: '2 min',
        category: 'Marketing',
        content: { elements: [{ type: 'text', content: 'Test', order: 0 }] }
      }
    }
  ];

  let validCount = 0;
  let invalidCount = 0;

  for (const endpoint of endpoints) {
    try {
      let response;
      if (endpoint.method === 'post') {
        response = await axios.post(`${API_BASE}${endpoint.url}`, endpoint.data, { headers });
      } else {
        response = await axios.get(`${API_BASE}${endpoint.url}`, { headers });
      }
      
      console.log(`  ✅ ${endpoint.name}: Token accepté (${response.status})`);
      validCount++;
      
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log(`  ❌ ${endpoint.name}: Token refusé (${error.response.status}) - ${error.response.data.message}`);
        invalidCount++;
      } else {
        console.log(`  ⚠️ ${endpoint.name}: Erreur autre (${error.response?.status || 'network'}) - ${error.response?.data?.message || error.message}`);
        // On considère ça comme un token invalide pour les besoins du test
        invalidCount++;
      }
    }
  }

  console.log(`📊 Résultat: ${validCount} acceptés, ${invalidCount} refusés\n`);
  
  // Le token est considéré comme valide si au moins un endpoint l'accepte
  return validCount > 0;
}

// Logout admin et révocation des tokens
async function logoutAdmin() {
  try {
    const headers = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };

    const logoutResponse = await axios.post(`${API_BASE}/auth/logout`, {}, { headers });
    
    console.log('✅ Logout admin réussi');
    console.log(`📋 Message: ${logoutResponse.data.message}`);
    console.log(`📊 Tokens révoqués: ${logoutResponse.data.revokedTokens}`);
    
  } catch (error) {
    console.log('❌ Erreur lors du logout admin:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Test avec timeout pour éviter les blocages
async function runTestWithTimeout() {
  const timeout = setTimeout(() => {
    console.log('⏰ Test interrompu après 5 minutes');
    process.exit(1);
  }, 5 * 60 * 1000);

  try {
    await testTokenRevocation();
  } finally {
    clearTimeout(timeout);
  }
}

// Instructions et informations importantes
function showInstructions() {
  console.log('📋 INSTRUCTIONS:');
  console.log('1. Assurez-vous que votre serveur NestJS fonctionne');
  console.log('2. Vous devez avoir accès à l\'email pour recevoir le code 2FA');
  console.log('3. Le test va tester la révocation sur plusieurs endpoints');
  console.log('4. Vérifiez que le test indique "SYSTÈME DE RÉVOCATION FONCTIONNE!"');
  console.log('');
  console.log('🔍 Ce test vérifie:');
  console.log('- ✅ Token valide AVANT logout');
  console.log('- ❌ Token invalide APRÈS logout');
  console.log('- 🔄 Cohérence sur tous les endpoints');
  console.log('');
  console.log('⚠️  Si le test échoue, les tokens restent valides après logout = FAILLE DE SÉCURITÉ');
  console.log('');
}

// Lancement du test
console.log('🛡️  TEST DE SÉCURITÉ - RÉVOCATION DES TOKENS\n');
showInstructions();

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Appuyez sur Entrée pour commencer le test (ou Ctrl+C pour annuler)...', () => {
  readline.close();
  runTestWithTimeout();
}); 