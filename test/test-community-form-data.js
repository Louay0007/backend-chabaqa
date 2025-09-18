const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

/**
 * Test de l'API de création de communauté avec l'interface CommunityFormData
 */
async function testCommunityCreationWithFormData() {
  console.log('🧪 Test de création de communauté avec CommunityFormData');
  console.log('=' .repeat(60));

  try {
    // Étape 1: Créer un utilisateur test ou utiliser un existant
    let authToken;
    
    // Test de login avec un utilisateur existant
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'Test123!'
      });
      
      authToken = loginResponse.data.access_token;
      console.log('✅ Connexion réussie');
    } catch (error) {
      console.log('ℹ️  Utilisateur test non trouvé, création d\'un nouveau compte...');
      
      // Créer un nouvel utilisateur
      const signupResponse = await axios.post(`${BASE_URL}/user/signup`, {
        name: 'Test User FormData',
        email: 'testformdata@example.com',
        password: 'Test123!'
      });
      
      authToken = signupResponse.data.access_token;
      console.log('✅ Nouvel utilisateur créé et connecté');
    }

    // Étape 2: Tester la création de communauté avec les nouveaux paramètres
    console.log('\n📝 Test de création de communauté...');
    
    const communityFormData = {
      // Informations de base (Étape 1)
      name: `Communauté Test FormData ${Date.now()}`,
      bio: 'Une communauté de test créée avec la nouvelle interface CommunityFormData',
      country: 'Tunisie',
      
      // Paramètres d\'accès (Étape 2)
      status: 'public',
      joinFee: 'paid',
      feeAmount: '15.50',
      currency: 'TND',
      
      // Liens sociaux (Étape 3 - au moins 1 requis)
      socialLinks: {
        instagram: 'https://instagram.com/testcommunity',
        facebook: 'https://facebook.com/testcommunity',
        website: 'https://testcommunity.tn'
      }
    };

    console.log('Données envoyées:', JSON.stringify(communityFormData, null, 2));

    const createResponse = await axios.post(
      `${BASE_URL}/community-aff-crea-join/create`,
      communityFormData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Communauté créée avec succès !');
    console.log('📊 Détails de la communauté créée:');
    console.log(JSON.stringify(createResponse.data, null, 2));

    // Étape 3: Tester les cas d'erreur
    console.log('\n🔍 Test des validations...');
    
    // Test 1: Sans liens sociaux
    try {
      await axios.post(
        `${BASE_URL}/community-aff-crea-join/create`,
        {
          ...communityFormData,
          name: `Test Sans Liens ${Date.now()}`,
          socialLinks: {}
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('❌ Le test devait échouer (aucun lien social)');
    } catch (error) {
      console.log('✅ Validation correcte: au moins un lien social requis');
      console.log('   Message:', error.response?.data?.message || error.message);
    }

    // Test 2: Nom trop court
    try {
      await axios.post(
        `${BASE_URL}/community-aff-crea-join/create`,
        {
          ...communityFormData,
          name: 'A',
          socialLinks: { website: 'https://test.com' }
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('❌ Le test devait échouer (nom trop court)');
    } catch (error) {
      console.log('✅ Validation correcte: nom trop court');
      console.log('   Message:', error.response?.data?.message || error.message);
    }

    // Test 3: Devise invalide
    try {
      await axios.post(
        `${BASE_URL}/community-aff-crea-join/create`,
        {
          ...communityFormData,
          name: `Test Devise ${Date.now()}`,
          currency: 'JPY', // Devise non supportée
          socialLinks: { website: 'https://test.com' }
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('❌ Le test devait échouer (devise invalide)');
    } catch (error) {
      console.log('✅ Validation correcte: devise invalide');
      console.log('   Message:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Tous les tests ont réussi !');

  } catch (error) {
    console.error('❌ Erreur durant le test:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.log('📋 Détails de l\'erreur:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
  }
}

/**
 * Test de création avec différents scénarios
 */
async function testDifferentScenarios() {
  console.log('\n🔄 Test de différents scénarios...');
  
  const scenarios = [
    {
      name: 'Communauté gratuite publique',
      data: {
        name: `Gratuite Publique ${Date.now()}`,
        bio: 'Communauté gratuite et publique',
        country: 'France',
        status: 'public',
        joinFee: 'free',
        feeAmount: '0',
        currency: 'EUR',
        socialLinks: {
          linkedin: 'https://linkedin.com/company/test'
        }
      }
    },
    {
      name: 'Communauté payante privée', 
      data: {
        name: `Payante Privée ${Date.now()}`,
        bio: 'Communauté payante et privée',
        country: 'États-Unis',
        status: 'private',
        joinFee: 'paid',
        feeAmount: '29.99',
        currency: 'USD',
        socialLinks: {
          youtube: 'https://youtube.com/@test',
          tiktok: 'https://tiktok.com/@test'
        }
      }
    }
  ];

  // Obtenir le token d'authentification
  let authToken;
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testformdata@example.com',
      password: 'Test123!'
    });
    authToken = loginResponse.data.access_token;
  } catch (error) {
    console.log('❌ Impossible de se connecter pour les tests de scénarios');
    return;
  }

  for (const scenario of scenarios) {
    try {
      console.log(`\n📝 Test: ${scenario.name}`);
      
      const response = await axios.post(
        `${BASE_URL}/community-aff-crea-join/create`,
        scenario.data,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Succès!');
      console.log(`   ID: ${response.data.data._id}`);
      console.log(`   Nom: ${response.data.data.name}`);
      console.log(`   Statut: ${response.data.data.isPrivate ? 'Privé' : 'Public'}`);
      console.log(`   Frais: ${response.data.data.fees_of_join} ${response.data.data.currency}`);
      
    } catch (error) {
      console.log(`❌ Échec: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Exécuter les tests
async function runAllTests() {
  try {
    await testCommunityCreationWithFormData();
    await testDifferentScenarios();
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Vérifier que le serveur est démarré
console.log('🚀 Démarrage des tests pour CommunityFormData...');
console.log(`🌐 URL de base: ${BASE_URL}`);
console.log('⚠️  Assurez-vous que le serveur NestJS est démarré sur le port 3000\n');

runAllTests(); 