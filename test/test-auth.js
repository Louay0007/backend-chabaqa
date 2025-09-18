const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// Configuration axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fonction de test pour l'authentification
async function testAuth() {
  try {
    console.log('🧪 Test du système d\'authentification JWT\n');

    // 1. Test de connexion
    console.log('1️⃣ Test de connexion...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    try {
      const loginResponse = await api.post('/auth/login', loginData);
      console.log('✅ Connexion réussie:', {
        user: loginResponse.data.user.name,
        email: loginResponse.data.user.email,
        role: loginResponse.data.user.role,
        hasAccessToken: !!loginResponse.data.access_token,
        hasRefreshToken: !!loginResponse.data.refresh_token
      });

      // Stocker les tokens (simulation localStorage)
      global.accessToken = loginResponse.data.access_token;
      global.refreshToken = loginResponse.data.refresh_token;

      // 2. Test de récupération du profil
      console.log('\n2️⃣ Test de récupération du profil...');
      const profileResponse = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${global.accessToken}`
        }
      });
      console.log('✅ Profil récupéré:', profileResponse.data.user.name);

      // 3. Test de rafraîchissement de token
      console.log('\n3️⃣ Test de rafraîchissement de token...');
      const refreshResponse = await api.post('/auth/refresh', {
        refresh_token: global.refreshToken
      });
      console.log('✅ Token rafraîchi:', {
        hasNewAccessToken: !!refreshResponse.data.access_token,
        expiresIn: refreshResponse.data.expires_in
      });

      // 4. Test de déconnexion
      console.log('\n4️⃣ Test de déconnexion...');
      const logoutResponse = await api.post('/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${global.accessToken}`
        }
      });
      console.log('✅ Déconnexion réussie:', logoutResponse.data.message);

    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ Erreur d\'authentification - Vérifiez que l\'utilisateur existe dans la base de données');
        console.log('💡 Créez d\'abord un utilisateur via l\'endpoint /user');
      } else {
        console.log('❌ Erreur:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Fonction pour créer un utilisateur de test
async function createTestUser() {
  try {
    console.log('👤 Création d\'un utilisateur de test...');
    
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    };

    const response = await api.post('/user', userData);
    console.log('✅ Utilisateur créé:', response.data.name);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ L\'utilisateur existe déjà');
      return null;
    } else {
      console.log('❌ Erreur lors de la création:', error.response?.data || error.message);
      return null;
    }
  }
}

// Exécution des tests
async function runTests() {
  console.log('🚀 Démarrage des tests d\'authentification...\n');
  
  // Créer un utilisateur de test d'abord
  await createTestUser();
  
  // Tester l'authentification
  await testAuth();
  
  console.log('\n✨ Tests terminés !');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests();
}

module.exports = { testAuth, createTestUser }; 