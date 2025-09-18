const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function createTestUser() {
  console.log('👤 Création d\'un utilisateur de test pour la 2FA...\n');

  try {
    const response = await axios.post(`${BASE_URL}/user/signup`, {
      name: 'Test User 2FA',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    });

    console.log('✅ Utilisateur créé avec succès !');
    console.log('Status:', response.status);
    console.log('Message:', response.data.message);
    console.log('User ID:', response.data.user._id);
    console.log('Email:', response.data.user.email);
    console.log('Name:', response.data.user.name);
    console.log('');
    console.log('🔐 Identifiants de test:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('');
    console.log('📧 Vous pouvez maintenant tester la 2FA avec ces identifiants !');

  } catch (error) {
    console.log('❌ Erreur lors de la création de l\'utilisateur:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message);
      
      if (error.response.status === 409) {
        console.log('ℹ️  L\'utilisateur existe déjà. Vous pouvez utiliser ces identifiants pour tester.');
        console.log('Email: test@example.com');
        console.log('Password: password123');
      }
    } else {
      console.log('Erreur réseau:', error.message);
    }
  }
}

createTestUser().catch(console.error); 