const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3000';

// Test rapide avec un token existant
async function quickTokenTest() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🔐 TEST RAPIDE - Vérification révocation token\n');
  
  try {
    // Demander le token à tester
    const token = await new Promise((resolve) => {
      readline.question('Entrez votre token JWT pour le test: ', (answer) => {
        resolve(answer.trim());
      });
    });

    console.log(`\n🔍 Test du token: ${token.substring(0, 50)}...\n`);

    // Test 1: Vérifier que le token fonctionne
    console.log('ÉTAPE 1: Test validité actuelle du token...');
    const isValid = await testToken(token, 'AVANT LOGOUT');

    if (!isValid) {
      console.log('❌ Le token est déjà invalide - impossible de tester la révocation');
      readline.close();
      return;
    }

    // Test 2: Logout avec le token
    console.log('ÉTAPE 2: Logout avec le token...');
    await logoutWithToken(token);

    // Test 3: Re-tester le token après logout
    console.log('ÉTAPE 3: Re-test du token après logout...');
    const isValidAfter = await testToken(token, 'APRÈS LOGOUT');

    // Résultats
    console.log('\n📊 RÉSULTATS:');
    console.log(`Token avant logout: ${isValid ? '✅ Valide' : '❌ Invalide'}`);
    console.log(`Token après logout: ${isValidAfter ? '❌ PROBLÈME!' : '✅ Révoqué'}`);

    if (isValid && !isValidAfter) {
      console.log('\n🎉 RÉVOCATION FONCTIONNE !');
      console.log('✅ Le token a été correctement révoqué après logout');
    } else {
      console.log('\n🚨 PROBLÈME DE SÉCURITÉ !');
      console.log('❌ Le token fonctionne encore après logout');
    }

  } catch (error) {
    console.log('❌ Erreur:', error.message);
  } finally {
    readline.close();
  }
}

// Tester la validité d'un token
async function testToken(token, context) {
  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.get(`${API_BASE}/auth/me`, { headers });
    console.log(`  ✅ ${context}: Token accepté (${response.status})`);
    console.log(`  👤 Utilisateur: ${response.data.user?.email || response.data.user?.name}`);
    return true;

  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log(`  ❌ ${context}: Token refusé (401) - ${error.response.data.message}`);
    } else {
      console.log(`  ⚠️  ${context}: Erreur (${error.response?.status || 'network'})`);
    }
    return false;
  }
}

// Logout avec le token
async function logoutWithToken(token) {
  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post(`${API_BASE}/auth/logout`, {}, { headers });
    console.log(`  ✅ Logout réussi: ${response.data.message}`);
    console.log(`  📊 Tokens révoqués: ${response.data.revokedTokens}`);

  } catch (error) {
    console.log(`  ❌ Erreur logout: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

// Instructions
console.log('📋 INSTRUCTIONS:');
console.log('1. Assurez-vous d\'avoir un token JWT valide');
console.log('2. Le script va tester le token, faire un logout, puis re-tester');
console.log('3. Si tout fonctionne, le token sera refusé après logout');
console.log('');

quickTokenTest().catch(console.error); 