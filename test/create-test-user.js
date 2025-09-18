const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Configuration pour l'utilisateur de test
const TEST_USER = {
  name: 'Ghassen Zaouali',
  email: 'ghassen_zaouali@ieee.org',
  password: 'motdepasse123',
  role: 'user'
};

// Créer un utilisateur de test
async function createTestUser() {
  try {
    console.log('🧪 Création d\'un utilisateur de test');
    console.log(`👤 Nom: ${TEST_USER.name}`);
    console.log(`📧 Email: ${TEST_USER.email}`);
    
    const response = await axios.post(`${BASE_URL}/user/signup`, TEST_USER);
    
    console.log('✅ Utilisateur créé avec succès:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️  L\'utilisateur existe déjà');
      return { user: { email: TEST_USER.email } };
    } else {
      console.error('❌ Erreur lors de la création:', error.response?.data || error.message);
      return null;
    }
  }
}

// Vérifier si l'utilisateur existe
async function checkUserExists() {
  try {
    console.log('\n🔍 Vérification de l\'existence de l\'utilisateur');
    
    const response = await axios.get(`${BASE_URL}/user/all-users`);
    const users = response.data.users;
    const user = users.find(u => u.email === TEST_USER.email);
    
    if (user) {
      console.log('✅ Utilisateur trouvé:', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
      return user;
    } else {
      console.log('❌ Utilisateur non trouvé');
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.response?.data || error.message);
    return null;
  }
}

// Exécuter le script
async function runScript() {
  console.log('🚀 Script de création d\'utilisateur de test\n');
  
  let user = await checkUserExists();
  
  if (!user) {
    user = await createTestUser();
  }
  
  if (user) {
    console.log('\n✅ L\'utilisateur est prêt pour les tests de mot de passe oublié');
    console.log('💡 Vous pouvez maintenant exécuter: node test-forgot-password-enhanced.js');
  } else {
    console.log('\n❌ Impossible de créer ou trouver l\'utilisateur');
  }
  
  console.log('\n✨ Script terminé');
}

runScript(); 