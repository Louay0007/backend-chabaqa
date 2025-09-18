const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Configuration pour les tests de debug
const testConfig = {
  testUser: {
    name: 'Test User Debug',
    email: 'testdebug@example.com',
    password: 'testPassword123'
  },
  testCommunity: {
    name: 'Test Debug Community',
    logo: 'https://via.placeholder.com/300x300/FF5722/white?text=DEBUG',
    photo_de_couverture: 'https://via.placeholder.com/1200x400/FF5722/white?text=DEBUG',
    short_description: 'Communauté de test pour déboguer le problème d\'ID utilisateur.'
  }
};

let authToken = null;

/**
 * Créer ou connecter un utilisateur de test
 */
async function createOrLoginUser() {
  try {
    console.log('🔄 Tentative de création d\'un utilisateur de test...');
    
    // Essayer de créer l'utilisateur
    const createResponse = await axios.post(`${BASE_URL}/auth/register`, testConfig.testUser);
    
    if (createResponse.data.success) {
      console.log('✅ Utilisateur créé avec succès:', createResponse.data.data.user.name);
      console.log('📧 ID utilisateur créé:', createResponse.data.data.user._id);
      return createResponse.data.data.user;
    }
    
  } catch (error) {
    if (error.response?.data?.message?.includes('existe déjà')) {
      console.log('ℹ️ Utilisateur existe déjà, tentative de connexion...');
    } else {
      console.error('❌ Erreur lors de la création:', error.response?.data || error.message);
      throw error;
    }
  }

  // Si création a échoué (utilisateur existe), essayer de se connecter
  try {
    console.log('🔄 Connexion avec l\'utilisateur existant...');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testConfig.testUser.email,
      password: testConfig.testUser.password
    });
    
    if (loginResponse.data.requires2FA) {
      console.log('📧 Code 2FA envoyé. Entrez le code pour continuer...');
      console.log('ℹ️ Pour les tests, vous pouvez utiliser le code reçu par email');
      
      // Pour les tests, on peut demander le code ou utiliser un code fixe si configuré
      console.log('❌ Ce script nécessite le code 2FA. Utilisez test-create-community.js qui gère 2FA automatiquement');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Tester la connexion et l'extraction de l'ID utilisateur
 */
async function testLogin() {
  try {
    console.log('🔄 Test de connexion...');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testConfig.testUser.email,
      password: testConfig.testUser.password
    });
    
    if (response.data.requires2FA) {
      console.log('📧 2FA requis. Code envoyé par email.');
      console.log('ℹ️ Pour ce test, vous devez vérifier manuellement le code 2FA');
      return null;
    }
    
    if (response.data.access_token) {
      authToken = response.data.access_token;
      console.log('✅ Token reçu:', authToken.substring(0, 50) + '...');
      
      // Décoder le token pour voir le payload
      const tokenParts = authToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('🔍 Payload du token JWT:');
        console.log('  - sub (user ID):', payload.sub);
        console.log('  - email:', payload.email);
        console.log('  - role:', payload.role);
        console.log('  - exp:', new Date(payload.exp * 1000).toLocaleString());
      }
      
      return response.data.user;
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de connexion:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Tester la création de communauté avec debug
 */
async function testCommunityCreation() {
  if (!authToken) {
    console.log('❌ Aucun token disponible pour tester la création de communauté');
    return;
  }
  
  try {
    console.log('\n🔄 Test de création de communauté...');
    console.log('🔗 URL:', `${BASE_URL}/community-aff-crea-join/create`);
    console.log('🔑 Token (début):', authToken.substring(0, 50) + '...');
    
    const response = await axios.post(
      `${BASE_URL}/community-aff-crea-join/create`,
      testConfig.testCommunity,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Communauté créée avec succès!');
      console.log('📊 Détails:');
      console.log('  - Nom:', response.data.data.name);
      console.log('  - ID:', response.data.data._id);
      console.log('  - Créateur:', response.data.data.createur.name);
      console.log('  - Membres:', response.data.data.membersCount);
      return response.data.data;
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de communauté:');
    console.error('📊 Détails de l\'erreur:');
    
    if (error.response) {
      console.error('  - Status:', error.response.status);
      console.error('  - Message:', error.response.data.message);
      console.error('  - Stack:', error.response.data.stack);
      
      // Analyser l'erreur spécifique
      if (error.response.data.message === 'Utilisateur non trouvé') {
        console.error('\n🔍 ANALYSE DU PROBLÈME:');
        console.error('  - L\'erreur "Utilisateur non trouvé" indique que l\'ID utilisateur');
        console.error('    extrait du token JWT ne correspond à aucun utilisateur en base');
        console.error('  - Vérifiez que l\'utilisateur existe réellement');
        console.error('  - Vérifiez que l\'ID utilisateur est correctement extrait du token');
      }
    } else {
      console.error('  - Message:', error.message);
    }
    
    throw error;
  }
}

/**
 * Test complet avec diagnostic
 */
async function runDiagnosticTests() {
  try {
    console.log('🚀 Tests de diagnostic - Problème ID utilisateur\n');
    
    // Test 1: Créer/connecter utilisateur
    console.log('='.repeat(60));
    console.log('TEST 1: Création/Connexion utilisateur');
    console.log('='.repeat(60));
    await createOrLoginUser();
    
    // Test 2: Tester la connexion et extraction du token
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Connexion et analyse du token');
    console.log('='.repeat(60));
    await testLogin();
    
    // Test 3: Tester la création de communauté
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Création de communauté');
    console.log('='.repeat(60));
    await testCommunityCreation();
    
    console.log('\n✅ Tous les tests de diagnostic terminés avec succès!');
    
  } catch (error) {
    console.error('\n❌ Test de diagnostic échoué:', error.message);
    
    console.log('\n🔧 SOLUTIONS SUGGÉRÉES:');
    console.log('1. Vérifiez que le serveur fonctionne: npm run start:dev');
    console.log('2. Vérifiez la connexion à la base de données');
    console.log('3. Vérifiez que JWT_SECRET est configuré');
    console.log('4. Vérifiez que l\'utilisateur existe en base de données');
    
    process.exit(1);
  }
}

/**
 * Vérifier le token directement
 */
async function verifyTokenOnly() {
  if (!authToken) {
    console.log('❌ Aucun token disponible');
    return;
  }
  
  try {
    console.log('🔍 Vérification du token JWT...');
    
    const response = await axios.get(
      `${BASE_URL}/community-aff-crea-join/my-created`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('✅ Token valide - Réponse:', response.data.message);
    
  } catch (error) {
    console.error('❌ Token invalide:', error.response?.data || error.message);
  }
}

// Exécution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--token-only')) {
    // Juste tester le token si on l'a
    if (args.includes('--with-token')) {
      authToken = args[args.indexOf('--with-token') + 1];
      verifyTokenOnly()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    } else {
      console.log('❌ Utilisez --with-token YOUR_TOKEN pour tester un token spécifique');
      process.exit(1);
    }
  } else {
    runDiagnosticTests()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = {
  createOrLoginUser,
  testLogin,
  testCommunityCreation,
  runDiagnosticTests,
  verifyTokenOnly
}; 