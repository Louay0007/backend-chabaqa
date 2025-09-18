const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'ghassen_zaouali@ieee.org',
  password: 'ghassen$1234'
};

async function testCookieHeaders() {
  console.log('🔍 VISUALISATION DES COOKIES DANS LES HEADERS HTTP\n');

  try {
    // 1. Connexion
    console.log('1. 📝 Connexion...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    console.log('   ✅ Connexion réussie');
    console.log('   📧 Code 2FA requis:', loginResponse.data.requires2FA);
    
    // Attendre la saisie du code 2FA
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const verificationCode = await new Promise((resolve) => {
      rl.question('   📱 Entrez le code 2FA: ', resolve);
    });
    rl.close();

    // 2. Vérification 2FA avec inspection des headers
    console.log('\n2. 🔐 Vérification 2FA avec inspection des headers...');
    const verify2FAResponse = await axios.post(`${BASE_URL}/auth/verify-2fa`, {
      email: TEST_USER.email,
      verificationCode: verificationCode
    });

    console.log('\n📄 BODY JSON (ce que vous voyez normalement) :');
    console.log(JSON.stringify(verify2FAResponse.data, null, 2));

    console.log('\n🍪 HEADERS HTTP (où sont les cookies) :');
    console.log('Headers reçus:');
    Object.entries(verify2FAResponse.headers).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    // Vérifier spécifiquement les cookies
    const setCookieHeader = verify2FAResponse.headers['set-cookie'];
    if (setCookieHeader) {
      console.log('\n🎯 COOKIES DÉFINIS (header Set-Cookie) :');
      setCookieHeader.forEach((cookie, index) => {
        console.log(`   Cookie ${index + 1}: ${cookie}`);
      });
    } else {
      console.log('\n⚠️ Aucun header Set-Cookie trouvé');
    }

    // 3. Test d'utilisation avec cookies
    console.log('\n3. 🔄 Test avec cookies automatiques...');
    
    // Créer un client avec gestion des cookies
    const cookieJar = new Map();
    
    // Extraire les cookies du header Set-Cookie
    if (setCookieHeader) {
      setCookieHeader.forEach(cookie => {
        const [nameValue] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        cookieJar.set(name.trim(), value.trim());
      });
    }

    // Construire le header Cookie
    const cookieHeader = Array.from(cookieJar.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');

    console.log('\n🍪 Cookie header à envoyer:');
    console.log(`   Cookie: ${cookieHeader}`);

    // Faire une requête avec les cookies
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Cookie': cookieHeader
      }
    });

    console.log('\n✅ Accès réussi avec cookies !');
    console.log('   👤 Utilisateur:', profileResponse.data.user.email);

    console.log('\n🎉 Les cookies fonctionnent correctement !');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.response) {
      console.error('   📄 Statut:', error.response.status);
      console.error('   📝 Données:', error.response.data);
    }
  }
}

// Fonction pour tester avec un navigateur simulé
async function testWithBrowserSimulation() {
  console.log('\n🌐 SIMULATION NAVIGATEUR (avec gestion automatique des cookies)\n');

  // Axios avec gestion des cookies
  const axiosWithCookies = axios.create({
    withCredentials: true,
    // Interceptor pour logger les cookies
    validateStatus: () => true
  });

  // Interceptor pour afficher les cookies
  axiosWithCookies.interceptors.response.use(
    response => {
      if (response.headers['set-cookie']) {
        console.log('🍪 Cookies reçus automatiquement:');
        response.headers['set-cookie'].forEach((cookie, index) => {
          console.log(`   ${index + 1}. ${cookie}`);
        });
      }
      return response;
    },
    error => error
  );

  try {
    // 1. Connexion
    console.log('1. 📝 Connexion...');
    const loginResponse = await axiosWithCookies.post(`${BASE_URL}/auth/login`, TEST_USER);
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const verificationCode = await new Promise((resolve) => {
      rl.question('   📱 Entrez le code 2FA: ', resolve);
    });
    rl.close();

    // 2. Vérification 2FA
    console.log('\n2. 🔐 Vérification 2FA...');
    const verify2FAResponse = await axiosWithCookies.post(`${BASE_URL}/auth/verify-2fa`, {
      email: TEST_USER.email,
      verificationCode: verificationCode
    });

    console.log('   ✅ Connexion réussie');

    // 3. Test automatique avec cookies
    console.log('\n3. 🔄 Test automatique avec cookies...');
    const profileResponse = await axiosWithCookies.get(`${BASE_URL}/auth/me`);
    
    console.log('   ✅ Accès automatique réussi !');
    console.log('   👤 Utilisateur:', profileResponse.data.user.email);
    console.log('   🎯 Les cookies ont été automatiquement inclus !');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  }
}

// Fonction principale
async function main() {
  console.log('🔬 ANALYSE DÉTAILLÉE DES COOKIES\n');
  console.log('Ce script va vous montrer exactement comment les cookies sont gérés.\n');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const choice = await new Promise((resolve) => {
    rl.question('Choisissez le test:\n1. Inspection manuelle des headers\n2. Simulation navigateur automatique\n3. Les deux\n\nChoix (1/2/3): ', resolve);
  });
  rl.close();

  switch (choice) {
    case '1':
      await testCookieHeaders();
      break;
    case '2':
      await testWithBrowserSimulation();
      break;
    case '3':
      await testCookieHeaders();
      await testWithBrowserSimulation();
      break;
    default:
      console.log('Choix invalide');
  }
}

main(); 