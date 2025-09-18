const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function getFreshToken() {
  console.log('🔑 Obtention d\'un nouveau token JWT...');
  console.log('=====================================');

  try {
    // Données de connexion
    const loginData = {
      email: 'ghassen_zaouali@ieee.org',
      password: 'your-password-here' // Remplacer par le vrai mot de passe
    };

    console.log('📤 Tentative de connexion...');
    console.log(`   📧 Email: ${loginData.email}`);

    const response = await axios.post(
      `${BASE_URL}/user/login`,
      loginData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('');
    console.log('🎉 Connexion réussie !');
    console.log('🔑 Nouveau token JWT:');
    console.log('=====================================');
    console.log(response.data.access_token);
    console.log('=====================================');
    console.log('');
    console.log('📋 Informations utilisateur:');
    console.log(`   🆔 ID: ${response.data.user.id}`);
    console.log(`   👤 Nom: ${response.data.user.name}`);
    console.log(`   📧 Email: ${response.data.user.email}`);
    console.log(`   🔰 Rôle: ${response.data.user.role}`);
    console.log('');
    console.log('✅ Copiez le token ci-dessus et mettez-le à jour dans vos tests !');

  } catch (error) {
    console.log('❌ ERREUR lors de la connexion:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message}`);
    
    if (error.response?.status === 401) {
      console.log('');
      console.log('🔒 Identifiants incorrects:');
      console.log('   • Vérifiez l\'email et le mot de passe');
      console.log('   • Assurez-vous que le compte existe');
    } else if (error.response?.status === 404) {
      console.log('');
      console.log('🔍 Endpoint non trouvé:');
      console.log('   • Vérifiez que le serveur fonctionne');
      console.log('   • Vérifiez l\'URL de l\'API');
    }
  }
}

getFreshToken(); 