const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Token JWT fourni par l'utilisateur
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODYzZWI4Y2UyYzlmMDA0Zjg2NDg5NTAiLCJlbWFpbCI6ImdoYXNzZW5femFvdWFsaUBpZWVlLm9yZyIsInJvbGUiOiJ1c2VyIiwianRpIjoiNjg2M2ViOGNlMmM5ZjAwNGY4NjQ4OTUwLWFjY2Vzcy0xNzUzNzEzMzA3NDQ0IiwiaWF0IjoxNzUzNzEzMzA3LCJleHAiOjE3NTM3Mjc3MDd9.hzO4ahbogl8BRc49p9Ka1RJDDHFZMWoH6LJemdf6RgQ';

// Décoder le token pour extraire l'userId
function decodeJWT(token) {
  try {
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('ascii');
    return JSON.parse(payload);
  } catch (error) {
    console.error('Erreur lors du décodage du token:', error);
    return null;
  }
}

/**
 * Test de débogage spécifique pour l'utilisateur avec problème d'autorisation
 */
async function testDebugUserSpecific() {
  console.log('🔍 Debug spécifique - Problème d\'autorisation utilisateur');
  console.log('=' .repeat(70));

  // Décoder le token
  const tokenPayload = decodeJWT(USER_TOKEN);
  if (!tokenPayload) {
    console.error('❌ Impossible de décoder le token JWT');
    return;
  }

  console.log('📋 Informations du token JWT:');
  console.log('   User ID:', tokenPayload.sub);
  console.log('   Email:', tokenPayload.email);
  console.log('   Role:', tokenPayload.role);
  console.log('   Expiration:', new Date(tokenPayload.exp * 1000));

  try {
    // Étape 1: Vérifier que le token fonctionne
    console.log('\n🔑 Test du token...');
    
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`
      }
    });

    console.log('✅ Token valide');
    console.log('   User connecté:', profileResponse.data.user.email);

    // Étape 2: Lister les communautés créées par cet utilisateur
    console.log('\n📋 Communautés créées par cet utilisateur...');
    
    const myCommunitiesResponse = await axios.get(`${BASE_URL}/community-aff-crea-join/my-created`, {
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`
      }
    });

    console.log('✅ Communautés créées:', myCommunitiesResponse.data.data.length);
    
    let targetCommunitySlug = null;
    
    if (myCommunitiesResponse.data.data.length > 0) {
      const community = myCommunitiesResponse.data.data[0];
      targetCommunitySlug = community.slug;
      console.log('   Première communauté:');
      console.log('   - Nom:', community.name);
      console.log('   - Slug:', community.slug);
      console.log('   - Créateur:', community.createur?._id || community.createur);
      console.log('   - Membres:', community.membersCount);
    } else {
      console.log('❌ Aucune communauté créée par cet utilisateur');
      console.log('\n📝 Création d\'une communauté de test...');
      
      // Créer une communauté de test
      const newCommunityData = {
        name: `Debug Community ${Date.now()}`,
        bio: 'Communauté créée pour déboguer le problème d\'autorisation',
        country: 'Tunisie',
        status: 'public',
        joinFee: 'free',
        feeAmount: '0',
        currency: 'TND',
        socialLinks: {
          website: 'https://debug-community.com'
        }
      };

      const newCommunityResponse = await axios.post(
        `${BASE_URL}/community-aff-crea-join/create`,
        newCommunityData,
        {
          headers: {
            'Authorization': `Bearer ${USER_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      targetCommunitySlug = newCommunityResponse.data.data.slug;
      console.log('✅ Communauté créée:', newCommunityResponse.data.data.name);
      console.log('   Slug:', targetCommunitySlug);
    }

    // Étape 3: Essayer de créer un cours avec debug activé
    console.log(`\n📚 Tentative de création de cours dans: ${targetCommunitySlug}`);
    console.log('🔍 Regardez les logs du serveur pour les détails de debug...');
    
    const coursData = {
      titre: `Debug Course ${Date.now()}`,
      description: 'Un cours pour déboguer les problèmes d\'autorisation',
      isPaid: false,
      prix: 0,
      communitySlug: targetCommunitySlug, // Utiliser le champ attendu
      isPublished: false
    };

    console.log('📋 Données du cours:');
    console.log(JSON.stringify(coursData, null, 2));

    const coursResponse = await axios.post(
      `${BASE_URL}/cours/create-cours`,
      coursData,
      {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Cours créé avec succès !');
    console.log('   ID:', coursResponse.data.id);
    console.log('   Titre:', coursResponse.data.titre);

  } catch (error) {
    console.error('❌ Erreur durant le test:');
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data?.message || 'Pas de message');
      
      if (error.response.status === 403) {
        console.log('\n💡 Analyse du problème 403:');
        console.log('   Le serveur doit afficher des logs de debug détaillés');
        console.log('   Vérifiez la console du serveur pour voir:');
        console.log('   - Si la communauté est trouvée');
        console.log('   - Si l\'userId correspond au créateur ou admin');
        console.log('   - Les IDs exacts utilisés pour la comparaison');
      }
      
      console.log('\n📋 Réponse complète:');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('   Erreur réseau:', error.message);
    }
  }
}

/**
 * Test alternatif avec communitySlug au lieu de communityId
 */
async function testWithCommunitySlug() {
  console.log('\n🔄 Test alternatif avec communitySlug...');
  
  try {
    // Récupérer une communauté existante
    const myCommunitiesResponse = await axios.get(`${BASE_URL}/community-aff-crea-join/my-created`, {
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`
      }
    });

    if (myCommunitiesResponse.data.data.length === 0) {
      console.log('❌ Aucune communauté disponible pour ce test');
      return;
    }

    const community = myCommunitiesResponse.data.data[0];
    
    const coursData = {
      titre: `Debug Course Slug ${Date.now()}`,
      description: 'Test avec communitySlug au lieu de communityId',
      isPaid: false,
      prix: 0,
      communitySlug: community.slug, // Utiliser l'ancien champ
      isPublished: false
    };

    console.log('📋 Test avec communitySlug:', community.slug);

    const coursResponse = await axios.post(
      `${BASE_URL}/cours/create-cours`,
      coursData,
      {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Cours créé avec communitySlug !');
    
  } catch (error) {
    console.error('❌ Erreur avec communitySlug:', error.response?.data?.message || error.message);
  }
}

// Exécuter les tests
console.log('🚀 Debug spécifique pour le problème d\'autorisation');
console.log(`🌐 URL de base: ${BASE_URL}`);
console.log('⚠️  Les logs de debug apparaîtront dans la console du serveur NestJS\n');

setTimeout(async () => {
  await testDebugUserSpecific();
  await testWithCommunitySlug();
}, 1000); 