const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123456!',
  name: 'Test User',
  role: 'user'
};

let authToken = '';

async function testAllCommunities() {
  try {
    console.log('🚀 Test de l\'API all-communities');
    console.log('=====================================');

    // 1. Connexion pour obtenir un token
    console.log('\n1. Connexion...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      
      console.log('📋 Réponse de connexion:', JSON.stringify(loginResponse.data, null, 2));
      
      // Vérifier différentes structures possibles
      if (loginResponse.data.data && loginResponse.data.data.access_token) {
        authToken = loginResponse.data.data.access_token;
      } else if (loginResponse.data.access_token) {
        authToken = loginResponse.data.access_token;
      } else {
        throw new Error('Token non trouvé dans la réponse');
      }
      
      console.log('✅ Connexion réussie, token:', authToken ? 'Présent' : 'Absent');
    } catch (error) {
      console.log('❌ Connexion échouée:', error.message);
      console.log('📋 Détails de l\'erreur:', error.response?.data);
      
      console.log('Tentative de création d\'utilisateur...');
      
      try {
        // Créer un utilisateur de test
        const signupResponse = await axios.post(`${BASE_URL}/user/signup`, {
          email: TEST_USER.email,
          password: TEST_USER.password,
          name: TEST_USER.name,
          role: TEST_USER.role
        });
        
        console.log('📋 Réponse de création:', JSON.stringify(signupResponse.data, null, 2));
        console.log('✅ Utilisateur créé');
        
        // Nouvelle tentative de connexion
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: TEST_USER.email,
          password: TEST_USER.password
        });
        
        console.log('📋 Réponse de connexion après création:', JSON.stringify(loginResponse.data, null, 2));
        
        // Vérifier différentes structures possibles
        if (loginResponse.data.data && loginResponse.data.data.access_token) {
          authToken = loginResponse.data.data.access_token;
        } else if (loginResponse.data.access_token) {
          authToken = loginResponse.data.access_token;
        } else {
          throw new Error('Token non trouvé dans la réponse après création');
        }
        
        console.log('✅ Connexion réussie après création, token:', authToken ? 'Présent' : 'Absent');
      } catch (createError) {
        console.error('❌ Erreur lors de la création ou connexion:', createError.message);
        if (createError.response) {
          console.error('📋 Données de l\'erreur:', JSON.stringify(createError.response.data, null, 2));
        }
        throw createError;
      }
    }

    // 2. Test de l'API all-communities
    console.log('\n2. Test de l\'API all-communities...');
    
    const response = await axios.get(`${BASE_URL}/community-aff-crea-join/all-communities`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Réponse reçue:', response.status);
    console.log('📊 Données:', JSON.stringify(response.data, null, 2));
    console.log('📈 Nombre de communautés:', response.data.data.length);

    // 3. Vérification de la structure de la réponse
    console.log('\n3. Vérification de la structure...');
    
    if (response.data.success !== true) {
      console.log('❌ Structure incorrecte: success devrait être true');
      return;
    }
    
    if (!response.data.message) {
      console.log('❌ Structure incorrecte: message manquant');
      return;
    }
    
    if (!Array.isArray(response.data.data)) {
      console.log('❌ Structure incorrecte: data devrait être un tableau');
      return;
    }
    
    console.log('✅ Structure de réponse correcte');

    // 4. Vérification des données des communautés
    console.log('\n4. Vérification des données des communautés...');
    
    if (response.data.data.length > 0) {
      const community = response.data.data[0];
      
      const requiredFields = ['_id', 'name', 'logo', 'photo_de_couverture', 'short_description', 'createur', 'members', 'admins'];
      const missingFields = requiredFields.filter(field => !community[field]);
      
      if (missingFields.length > 0) {
        console.log('❌ Champs manquants:', missingFields);
      } else {
        console.log('✅ Tous les champs requis sont présents');
      }
      
      // Vérifier les relations populées
      if (community.createur && community.createur._id) {
        console.log('✅ Relation créateur correctement populée');
      } else {
        console.log('❌ Relation créateur non populée');
      }
      
      if (Array.isArray(community.members) && community.members.length > 0) {
        console.log('✅ Relation members correctement populée');
      } else {
        console.log('⚠️  Aucun membre ou relation members non populée');
      }
      
      if (Array.isArray(community.admins) && community.admins.length > 0) {
        console.log('✅ Relation admins correctement populée');
      } else {
        console.log('⚠️  Aucun admin ou relation admins non populée');
      }
      
    } else {
      console.log('ℹ️  Aucune communauté trouvée');
    }

    console.log('\n🎉 Test terminé avec succès!');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Erreur pendant le test:', error.message);
    
    if (error.response) {
      console.error('📋 Statut:', error.response.status);
      console.error('📋 Données:', JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

// Exécuter le test
testAllCommunities(); 