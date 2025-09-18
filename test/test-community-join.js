const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USERS = [
  {
    email: 'creator@example.com',
    password: 'Test123456!',
    name: 'Community Creator',
    role: 'user'
  },
  {
    email: 'joiner@example.com',
    password: 'Test123456!',
    name: 'Community Joiner',
    role: 'user'
  }
];

let authTokens = {};
let testCommunity = null;
let inviteData = null;

async function createTestUser(userIndex) {
  const user = TEST_USERS[userIndex];
  
  try {
    // Essayer de se connecter d'abord
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: user.email,
      password: user.password
    });
    
    console.log(`✅ Connexion réussie pour ${user.name}`);
    return loginResponse.data.data ? loginResponse.data.data.access_token : loginResponse.data.access_token;
  } catch (error) {
    console.log(`❌ Connexion échouée pour ${user.name}, création d'un nouveau compte...`);
    
    // Créer un utilisateur si la connexion échoue
    await axios.post(`${BASE_URL}/user/signup`, user);
    
    // Nouvelle tentative de connexion
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: user.email,
      password: user.password
    });
    
    console.log(`✅ Utilisateur créé et connexion réussie pour ${user.name}`);
    return loginResponse.data.data ? loginResponse.data.data.access_token : loginResponse.data.access_token;
  }
}

async function testCommunityJoin() {
  try {
    console.log('🚀 Test complet des APIs de join de communauté');
    console.log('================================================');

    // 1. Créer des utilisateurs de test
    console.log('\n1. Création des utilisateurs de test...');
    authTokens.creator = await createTestUser(0);
    authTokens.joiner = await createTestUser(1);

    // 2. Créer une communauté de test
    console.log('\n2. Création d\'une communauté de test...');
    const communityResponse = await axios.post(`${BASE_URL}/community-aff-crea-join/create`, {
      name: 'Test Community Join',
      logo: 'https://example.com/logo.png',
      photo_de_couverture: 'https://example.com/cover.jpg',
      short_description: 'Communauté de test pour les fonctionnalités de join',
      isPrivate: false,
      fees_of_join: 0
    }, {
      headers: {
        'Authorization': `Bearer ${authTokens.creator}`,
        'Content-Type': 'application/json'
      }
    });

    testCommunity = communityResponse.data.data;
    console.log(`✅ Communauté créée: ${testCommunity.name} (ID: ${testCommunity._id})`);

    // 3. Test - Générer un lien d'invitation
    console.log('\n3. Test - Génération du lien d\'invitation...');
    const inviteResponse = await axios.post(`${BASE_URL}/community-aff-crea-join/generate-invite`, {
      communityId: testCommunity._id,
      regenerate: false
    }, {
      headers: {
        'Authorization': `Bearer ${authTokens.creator}`,
        'Content-Type': 'application/json'
      }
    });

    inviteData = inviteResponse.data.data;
    console.log(`✅ Lien d'invitation généré:`);
    console.log(`   Code: ${inviteData.inviteCode}`);
    console.log(`   Lien: ${inviteData.inviteLink}`);

    // 4. Test - Rejoindre la communauté directement par ID
    console.log('\n4. Test - Rejoindre la communauté directement par ID...');
    const joinResponse = await axios.post(`${BASE_URL}/community-aff-crea-join/join`, {
      communityId: testCommunity._id,
      message: 'Je souhaite rejoindre cette communauté'
    }, {
      headers: {
        'Authorization': `Bearer ${authTokens.joiner}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Join direct réussi: ${joinResponse.data.message}`);
    console.log(`   Nombre de membres: ${joinResponse.data.data.membersCount}`);

    // 5. Test - Quitter la communauté
    console.log('\n5. Test - Quitter la communauté...');
    const leaveResponse = await axios.post(`${BASE_URL}/community-aff-crea-join/leave/${testCommunity._id}`, {}, {
      headers: {
        'Authorization': `Bearer ${authTokens.joiner}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Leave réussi: ${leaveResponse.data.message}`);

    // 6. Test - Rejoindre via lien d'invitation (POST)
    console.log('\n6. Test - Rejoindre via lien d\'invitation (POST)...');
    const joinByInviteResponse = await axios.post(`${BASE_URL}/community-aff-crea-join/join-by-invite`, {
      inviteCode: inviteData.inviteCode,
      message: 'Je rejoins via le lien d\'invitation'
    }, {
      headers: {
        'Authorization': `Bearer ${authTokens.joiner}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Join par invitation réussi: ${joinByInviteResponse.data.message}`);
    console.log(`   Nombre de membres: ${joinByInviteResponse.data.data.membersCount}`);

    // 7. Test - Accéder au lien d'invitation directement (GET)
    console.log('\n7. Test - Accès au lien d\'invitation direct (GET)...');
    
    // D'abord quitter pour retester
    await axios.post(`${BASE_URL}/community-aff-crea-join/leave/${testCommunity._id}`, {}, {
      headers: {
        'Authorization': `Bearer ${authTokens.joiner}`,
        'Content-Type': 'application/json'
      }
    });

    // Puis rejoindre via GET
    const joinByLinkResponse = await axios.get(`${BASE_URL}/community-aff-crea-join/join-by-invite/${inviteData.inviteCode}`, {
      headers: {
        'Authorization': `Bearer ${authTokens.joiner}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Join par lien direct réussi: ${joinByLinkResponse.data.message}`);
    console.log(`   Nombre de membres: ${joinByLinkResponse.data.data.membersCount}`);

    // 8. Test - Créer une communauté privée et tester l'accès
    console.log('\n8. Test - Communauté privée et accès par invitation...');
    const privateCommunityResponse = await axios.post(`${BASE_URL}/community-aff-crea-join/create`, {
      name: 'Private Test Community',
      logo: 'https://example.com/logo-private.png',
      photo_de_couverture: 'https://example.com/cover-private.jpg',
      short_description: 'Communauté privée de test',
      isPrivate: true,
      fees_of_join: 0
    }, {
      headers: {
        'Authorization': `Bearer ${authTokens.creator}`,
        'Content-Type': 'application/json'
      }
    });

    const privateCommunity = privateCommunityResponse.data.data;
    console.log(`✅ Communauté privée créée: ${privateCommunity.name}`);

    // Essayer de rejoindre une communauté privée directement (doit échouer)
    try {
      await axios.post(`${BASE_URL}/community-aff-crea-join/join`, {
        communityId: privateCommunity._id
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens.joiner}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('❌ ERREUR: Le join direct d\'une communauté privée devrait échouer');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Join direct d\'une communauté privée correctement bloqué');
      } else {
        console.log('❌ Erreur inattendue:', error.message);
      }
    }

    // Générer un lien d'invitation pour la communauté privée
    const privateInviteResponse = await axios.post(`${BASE_URL}/community-aff-crea-join/generate-invite`, {
      communityId: privateCommunity._id
    }, {
      headers: {
        'Authorization': `Bearer ${authTokens.creator}`,
        'Content-Type': 'application/json'
      }
    });

    const privateInviteData = privateInviteResponse.data.data;
    console.log(`✅ Lien d'invitation généré pour la communauté privée: ${privateInviteData.inviteCode}`);

    // Rejoindre la communauté privée via invitation
    const joinPrivateResponse = await axios.post(`${BASE_URL}/community-aff-crea-join/join-by-invite`, {
      inviteCode: privateInviteData.inviteCode
    }, {
      headers: {
        'Authorization': `Bearer ${authTokens.joiner}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Join de la communauté privée via invitation réussi: ${joinPrivateResponse.data.message}`);

    // 9. Test - Vérifier les communautés rejointes
    console.log('\n9. Test - Vérification des communautés rejointes...');
    const myJoinedResponse = await axios.get(`${BASE_URL}/community-aff-crea-join/my-joined`, {
      headers: {
        'Authorization': `Bearer ${authTokens.joiner}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Communautés rejointes: ${myJoinedResponse.data.data.length}`);
    myJoinedResponse.data.data.forEach(community => {
      console.log(`   - ${community.name} (${community.isPrivate ? 'Privée' : 'Publique'})`);
    });

    console.log('\n🎉 Tous les tests sont passés avec succès!');
    console.log('================================================');

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
testCommunityJoin(); 