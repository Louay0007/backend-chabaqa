const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Configuration du test
const testConfig = {
  // Données de test pour l'utilisateur
  testUser: {
    name: 'Test User Community',
    email: 'testcommunity@example.com',
    password: 'testPassword123'
  },
  
  // Données de test pour la communauté
  testCommunity: {
    name: 'Communauté Test JavaScript',
    logo: 'https://example.com/logo.png',
    photo_de_couverture: 'https://example.com/cover.jpg',
    short_description: 'Une communauté de test pour les développeurs JavaScript passionnés',
    long_description: [
      {
        type: 'text',
        content: 'Bienvenue dans notre communauté de développeurs JavaScript!',
        title: 'Introduction',
        description: 'Une introduction à notre communauté',
        order: 1
      },
      {
        type: 'image',
        content: 'https://example.com/welcome-image.jpg',
        title: 'Image de bienvenue',
        order: 2
      }
    ],
    rank: 'bronze',
    fees_of_join: 0,
    isPrivate: false,
    isActive: true,
    isVerified: false
  }
};

let authToken = null;
let createdCommunityId = null;

/**
 * Fonction pour créer un utilisateur de test
 */
async function createTestUser() {
  try {
    console.log('🔄 Création d\'un utilisateur de test...');
    
    const response = await axios.post(`${BASE_URL}/auth/register`, testConfig.testUser);
    
    if (response.data.success) {
      console.log('✅ Utilisateur créé avec succès:', response.data.data.user.name);
      return response.data.data.user;
    } else {
      throw new Error('Échec de la création de l\'utilisateur');
    }
  } catch (error) {
    if (error.response?.data?.message?.includes('existe déjà')) {
      console.log('ℹ️ Utilisateur existe déjà, tentative de connexion...');
      return await loginTestUser();
    }
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fonction pour se connecter avec l'utilisateur de test
 */
async function loginTestUser() {
  try {
    console.log('🔄 Connexion de l\'utilisateur de test...');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testConfig.testUser.email,
      password: testConfig.testUser.password
    });
    
    if (response.data.success) {
      authToken = response.data.data.access_token;
      console.log('✅ Connexion réussie, token reçu');
      return response.data.data.user;
    } else {
      throw new Error('Échec de la connexion');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fonction pour créer une communauté
 */
async function createCommunity() {
  try {
    console.log('🔄 Création d\'une communauté...');
    
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
      createdCommunityId = response.data.data._id;
      console.log('✅ Communauté créée avec succès:', response.data.data.name);
      console.log('📊 Détails de la communauté:');
      console.log('  - ID:', response.data.data._id);
      console.log('  - Nom:', response.data.data.name);
      console.log('  - Créateur:', response.data.data.createur.name);
      console.log('  - Membres:', response.data.data.membersCount);
      console.log('  - Rang:', response.data.data.rank);
      console.log('  - Frais d\'adhésion:', response.data.data.fees_of_join);
      console.log('  - Privée:', response.data.data.isPrivate);
      console.log('  - Active:', response.data.data.isActive);
      return response.data.data;
    } else {
      throw new Error('Échec de la création de la communauté');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création de la communauté:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fonction pour récupérer les communautés créées par l'utilisateur
 */
async function getMyCreatedCommunities() {
  try {
    console.log('🔄 Récupération des communautés créées...');
    
    const response = await axios.get(
      `${BASE_URL}/community-aff-crea-join/my-created`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Communautés créées récupérées:', response.data.data.length);
      response.data.data.forEach((community, index) => {
        console.log(`  ${index + 1}. ${community.name} (${community.membersCount} membres)`);
      });
      return response.data.data;
    } else {
      throw new Error('Échec de la récupération des communautés');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des communautés:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fonction pour récupérer une communauté par ID
 */
async function getCommunityById() {
  try {
    console.log('🔄 Récupération de la communauté par ID...');
    
    const response = await axios.get(
      `${BASE_URL}/community-aff-crea-join/${createdCommunityId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Communauté récupérée par ID:', response.data.data.name);
      return response.data.data;
    } else {
      throw new Error('Échec de la récupération de la communauté');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la communauté:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fonction pour récupérer les communautés publiques
 */
async function getPublicCommunities() {
  try {
    console.log('🔄 Récupération des communautés publiques...');
    
    const response = await axios.get(
      `${BASE_URL}/community-aff-crea-join/public/all`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Communautés publiques récupérées:', response.data.data.length);
      return response.data.data;
    } else {
      throw new Error('Échec de la récupération des communautés publiques');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des communautés publiques:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fonction principale de test
 */
async function runTests() {
  try {
    console.log('🚀 Démarrage des tests de l\'API Community...\n');
    
    // Test 1: Créer/connecter un utilisateur
    await createTestUser();
    
    // Test 2: Créer une communauté
    await createCommunity();
    
    // Test 3: Récupérer les communautés créées
    await getMyCreatedCommunities();
    
    // Test 4: Récupérer une communauté par ID
    await getCommunityById();
    
    // Test 5: Récupérer les communautés publiques
    await getPublicCommunities();
    
    console.log('\n✅ Tous les tests ont été exécutés avec succès!');
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

/**
 * Test sans authentification (doit échouer)
 */
async function testWithoutAuth() {
  try {
    console.log('\n🔄 Test sans authentification (doit échouer)...');
    
    const response = await axios.post(
      `${BASE_URL}/community-aff-crea-join/create`,
      testConfig.testCommunity
    );
    
    console.log('❌ Test échoué: la création a réussi sans authentification');
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Test réussi: authentification requise correctement appliquée');
    } else {
      console.error('❌ Erreur inattendue:', error.response?.data || error.message);
    }
  }
}

// Exécuter les tests
if (require.main === module) {
  runTests()
    .then(() => testWithoutAuth())
    .then(() => {
      console.log('\n🎉 Tous les tests terminés!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error.message);
      process.exit(1);
    });
}

module.exports = {
  createTestUser,
  loginTestUser,
  createCommunity,
  getMyCreatedCommunities,
  getCommunityById,
  getPublicCommunities,
  testWithoutAuth
}; 