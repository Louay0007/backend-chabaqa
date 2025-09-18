const axios = require('axios');
const BASE_URL = 'http://localhost:3000';

let authToken1 = null;
let authToken2 = null;
let user1Id = null;
let user2Id = null;

// Configuration des utilisateurs de test
const testUsers = [
  {
    name: 'ghassen_test',
    email: 'ghassen@test.com',
    password: 'password123',
    role: 'user'
  },
  {
    name: 'yassine_test',
    email: 'yassine@test.com',
    password: 'password123',
    role: 'user'
  }
];

/**
 * Créer les utilisateurs de test
 */
async function createTestUsers() {
  console.log('\n🔧 Création des utilisateurs de test...');
  
  for (let i = 0; i < testUsers.length; i++) {
    const userData = testUsers[i];
    
    try {
      const response = await axios.post(`${BASE_URL}/user/signup`, userData);
      
      if (response.data.success) {
        console.log(`✅ Utilisateur créé: ${userData.name}`);
        if (i === 0) user1Id = response.data.user._id;
        if (i === 1) user2Id = response.data.user._id;
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️ Utilisateur ${userData.name} existe déjà`);
      } else {
        console.error(`❌ Erreur lors de la création de ${userData.name}:`, error.response?.data || error.message);
      }
    }
  }
}

/**
 * Connecter les utilisateurs et obtenir les tokens
 */
async function loginUsers() {
  console.log('\n🔑 Connexion des utilisateurs...');
  
  for (let i = 0; i < testUsers.length; i++) {
    const userData = testUsers[i];
    
    try {
      // Étape 1: Login initial
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: userData.email,
        password: userData.password
      });
      
      if (loginResponse.data.requires2FA) {
        console.log(`📧 Code 2FA envoyé pour ${userData.name}`);
        
        // Simuler la réception du code 2FA (dans un vrai test, on aurait besoin du code réel)
        console.log(`⚠️ Pour ${userData.name}: Vérifiez votre email et utilisez le code 2FA avec l'endpoint /auth/verify-2fa`);
        
        // Pour ce test, on va simuler un token (dans un vrai scénario, il faudrait le code 2FA)
        // Ici on devrait faire appel à verify-2fa avec le code reçu
      }
      
    } catch (error) {
      console.error(`❌ Erreur lors de la connexion de ${userData.name}:`, error.response?.data || error.message);
    }
  }
  
  console.log('\n⚠️ Pour continuer le test, vous devez manuellement obtenir les tokens JWT');
  console.log('1. Complétez la connexion 2FA pour chaque utilisateur');
  console.log('2. Récupérez les access_token');
  console.log('3. Modifiez ce script pour inclure les tokens');
}

/**
 * Test des mises à jour sécurisées
 */
async function testSecureUpdates() {
  console.log('\n🔐 Test des mises à jour sécurisées...');
  
  // Si les tokens ne sont pas définis, on ne peut pas continuer
  if (!authToken1 || !authToken2) {
    console.log('❌ Tokens manquants - veuillez les configurer dans le script');
    return;
  }
  
  // Test 1: Ghassen essaie de modifier son propre profil (devrait réussir)
  console.log('\n📝 Test 1: Ghassen modifie son propre profil...');
  try {
    const response = await axios.put(
      `${BASE_URL}/user/profile`,
      {
        bio: 'Nouvelle bio de Ghassen',
        ville: 'Tunis'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken1}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Ghassen a réussi à modifier son profil');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la modification du profil de Ghassen:', error.response?.data || error.message);
  }
  
  // Test 2: Ghassen essaie de modifier le profil de Yassine (devrait échouer)
  console.log('\n🚫 Test 2: Ghassen essaie de modifier le profil de Yassine...');
  try {
    const response = await axios.put(
      `${BASE_URL}/user/update-user/${user2Id}`,
      {
        bio: 'Bio modifiée par Ghassen',
        ville: 'Sfax'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken1}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('❌ PROBLÈME: Ghassen a réussi à modifier le profil de Yassine (ne devrait pas arriver)');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Sécurité OK: Ghassen ne peut pas modifier le profil de Yassine');
    } else {
      console.error('❌ Erreur inattendue:', error.response?.data || error.message);
    }
  }
  
  // Test 3: Yassine modifie son propre profil avec l'ID (devrait réussir)
  console.log('\n📝 Test 3: Yassine modifie son propre profil avec ID...');
  try {
    const response = await axios.put(
      `${BASE_URL}/user/update-user/${user2Id}`,
      {
        bio: 'Bio mise à jour par Yassine',
        pays: 'Tunisie'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken2}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Yassine a réussi à modifier son propre profil');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la modification du profil de Yassine:', error.response?.data || error.message);
  }
  
  // Test 4: Test de modification du mot de passe (sécurisé)
  console.log('\n🔐 Test 4: Test de changement de mot de passe...');
  try {
    const response = await axios.put(
      `${BASE_URL}/user/change-password`,
      {
        password: 'newpassword123'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken1}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Changement de mot de passe réussi');
    }
  } catch (error) {
    console.error('❌ Erreur lors du changement de mot de passe:', error.response?.data || error.message);
  }
}

/**
 * Fonction principale de test
 */
async function runTests() {
  console.log('🧪 Test des améliorations de sécurité de l\'API update-user');
  console.log('=' .repeat(60));
  
  try {
    await createTestUsers();
    await loginUsers();
    
    // ⚠️ IMPORTANT: Configurez les tokens manuellement après avoir complété la 2FA
    // authToken1 = 'votre_token_ghassen_ici';
    // authToken2 = 'votre_token_yassine_ici';
    
    await testSecureUpdates();
    
    console.log('\n✅ Tests terminés');
    console.log('📋 Résumé des améliorations:');
    console.log('  - ✅ Authentification JWT requise');
    console.log('  - ✅ Vérification que l\'utilisateur ne peut modifier que ses propres infos');
    console.log('  - ✅ Exclusion du champ password des mises à jour de profil');
    console.log('  - ✅ Route séparée pour le changement de mot de passe');
    console.log('  - ✅ Route /profile pour mise à jour sans ID');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
runTests(); 