const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// Configuration axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fonction pour tester l'endpoint signup
async function testSignup() {
  console.log('🧪 Test de l\'endpoint signup avec gestion des conflits\n');

  const testCases = [
    {
      name: '1️⃣ Test création utilisateur valide',
      data: {
        name: 'Test User 1',
        email: 'test1@example.com',
        password: 'password123',
        role: 'user'
      },
      expectedStatus: 201
    },
    {
      name: '2️⃣ Test conflit email (même email)',
      data: {
        name: 'Test User 2',
        email: 'test1@example.com', // Même email que le premier
        password: 'password123',
        role: 'user'
      },
      expectedStatus: 409
    },
    {
      name: '3️⃣ Test conflit nom (même nom)',
      data: {
        name: 'Test User 1', // Même nom que le premier
        email: 'test2@example.com',
        password: 'password123',
        role: 'user'
      },
      expectedStatus: 409
    },
    {
      name: '4️⃣ Test création utilisateur avec email différent',
      data: {
        name: 'Test User 3',
        email: 'test3@example.com',
        password: 'password123',
        role: 'user'
      },
      expectedStatus: 201
    },
    {
      name: '5️⃣ Test validation email invalide',
      data: {
        name: 'Test User 4',
        email: 'invalid-email',
        password: 'password123',
        role: 'user'
      },
      expectedStatus: 400
    },
    {
      name: '6️⃣ Test validation mot de passe trop court',
      data: {
        name: 'Test User 5',
        email: 'test5@example.com',
        password: '123', // Trop court
        role: 'user'
      },
      expectedStatus: 400
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n${testCase.name}...`);
      console.log(`📤 Données envoyées:`, {
        name: testCase.data.name,
        email: testCase.data.email,
        role: testCase.data.role
      });

      const response = await api.post('/user/signup', testCase.data);
      
      if (response.status === testCase.expectedStatus) {
        console.log(`✅ Succès (${response.status}):`, response.data.message);
        if (response.data.user) {
          console.log(`👤 Utilisateur créé:`, {
            id: response.data.user._id,
            name: response.data.user.name,
            email: response.data.user.email
          });
        }
      } else {
        console.log(`❌ Statut inattendu: ${response.status} au lieu de ${testCase.expectedStatus}`);
      }

    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === testCase.expectedStatus) {
          console.log(`✅ Erreur attendue (${status}):`, data.message);
          
          if (data.details) {
            console.log(`📋 Détails:`, {
              field: data.details.field,
              value: data.details.value
            });
          }
        } else {
          console.log(`❌ Statut d'erreur inattendu: ${status} au lieu de ${testCase.expectedStatus}`);
          console.log(`📋 Réponse:`, data);
        }
      } else {
        console.log(`❌ Erreur réseau:`, error.message);
      }
    }
  }
}

// Fonction pour nettoyer les utilisateurs de test
async function cleanupTestUsers() {
  console.log('\n🧹 Nettoyage des utilisateurs de test...');
  
  try {
    const response = await api.get('/user/all-users');
    const users = response.data.users;
    
    const testUsers = users.filter(user => 
      user.email.includes('test') && user.email.includes('@example.com')
    );
    
    for (const user of testUsers) {
      try {
        await api.delete(`/user/user/${user._id}`);
        console.log(`🗑️ Supprimé: ${user.email}`);
      } catch (error) {
        console.log(`❌ Erreur suppression ${user.email}:`, error.response?.data?.message || error.message);
      }
    }
    
    console.log('✅ Nettoyage terminé');
  } catch (error) {
    console.log('❌ Erreur lors du nettoyage:', error.message);
  }
}

// Exécution des tests
async function runSignupTests() {
  console.log('🚀 Démarrage des tests signup...\n');
  
  // Exécuter les tests
  await testSignup();
  
  // Nettoyer après les tests (optionnel)
  console.log('\n' + '='.repeat(50));
  const shouldCleanup = process.argv.includes('--cleanup');
  if (shouldCleanup) {
    await cleanupTestUsers();
  } else {
    console.log('💡 Pour nettoyer les utilisateurs de test, relancez avec: node test-signup.js --cleanup');
  }
  
  console.log('\n✨ Tests signup terminés !');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runSignupTests();
}

module.exports = { testSignup, cleanupTestUsers }; 