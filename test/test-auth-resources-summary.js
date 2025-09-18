const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3000';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODdiYTI4ODZmNGM5OGFhYTA0YTZjZTAiLCJlbWFpbCI6ImdoYXNzZW4uemFvdWFsaTIwMTlAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwianRpIjoiNjg3YmEyODg2ZjRjOThhYWEwNGE2Y2UwLWFjY2Vzcy0xNzUyOTMzNzg0MjAzIiwiaWF0IjoxNzUyOTMzNzg0LCJleHAiOjE3NTI5NDA5ODR9.N2zIBjkQgCJZhc9E4i10kAb50CQgMpebNwncW6xUII8';
const INVALID_TOKEN = 'invalid.jwt.token';

// Test sans token (doit échouer)
async function testWithoutToken() {
  try {
    console.log('🧪 Test SANS token (doit échouer avec 401)...\n');
    
    const response = await axios.get(`${API_BASE}/resources/getAllResourcesSummary`);
    
    // Si on arrive ici, c'est un problème
    console.log('❌ ERREUR : L\'API a répondu sans token !');
    console.log(`Status: ${response.status}`);
    console.log('🚨 L\'authentification ne fonctionne PAS correctement');
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ CORRECT : L\'API refuse l\'accès sans token');
      console.log(`Status: ${error.response.status}`);
      console.log(`Message: ${error.response.data.message}`);
      console.log('🔒 L\'authentification fonctionne correctement\n');
      return true;
    } else {
      console.log('❌ Erreur inattendue :', error.response?.data || error.message);
      return false;
    }
  }
}

// Test avec token invalide (doit échouer)  
async function testWithInvalidToken() {
  try {
    console.log('🧪 Test avec token INVALIDE (doit échouer avec 401)...\n');
    
    const headers = {
      'Authorization': `Bearer ${INVALID_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(`${API_BASE}/resources/getAllResourcesSummary`, { headers });
    
    // Si on arrive ici, c'est un problème
    console.log('❌ ERREUR : L\'API accepte un token invalide !');
    console.log(`Status: ${response.status}`);
    console.log('🚨 La validation de token ne fonctionne PAS');
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ CORRECT : L\'API refuse le token invalide');
      console.log(`Status: ${error.response.status}`);  
      console.log(`Message: ${error.response.data.message}`);
      console.log('🔒 La validation de token fonctionne correctement\n');
      return true;
    } else {
      console.log('❌ Erreur inattendue :', error.response?.data || error.message);
      return false;
    }
  }
}

// Test avec token valide (doit réussir)
async function testWithValidToken() {
  try {
    console.log('🧪 Test avec token VALIDE (doit réussir avec 200)...\n');
    
    const headers = {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(`${API_BASE}/resources/getAllResourcesSummary`, { headers });
    
    console.log('✅ SUCCÈS : L\'API accepte le token valide');
    console.log(`Status: ${response.status}`);
    console.log(`Nombre de ressources: ${response.data.length}`);
    
    if (response.data.length > 0) {
      const firstResource = response.data[0];
      console.log(`Première ressource: "${firstResource.titre}"`);
      console.log(`Type: ${firstResource.type}`);
      console.log(`Catégorie: ${firstResource.category}`);
    }
    
    console.log('🔓 L\'authentification avec token valide fonctionne\n');
    return true;
    
  } catch (error) {
    console.log('❌ ERREUR : L\'API refuse un token valide !');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Message:`, error.response?.data || error.message);
    console.log('🚨 Il y a un problème avec l\'authentification\n');
    return false;
  }
}

// Test avec token dans les cookies (optionnel)
async function testWithCookieToken() {
  try {
    console.log('🧪 Test avec token dans les COOKIES...\n');
    
    const headers = {
      'Cookie': `accessToken=${ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(`${API_BASE}/resources/getAllResourcesSummary`, { headers });
    
    console.log('✅ SUCCÈS : L\'API accepte le token depuis les cookies');
    console.log(`Status: ${response.status}`);
    console.log('🍪 L\'authentification par cookie fonctionne\n');
    return true;
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('ℹ️  L\'API n\'accepte pas les tokens depuis les cookies');
      console.log('(C\'est normal si seuls les headers Authorization sont supportés)\n');
      return true;
    } else {
      console.log('❌ Erreur inattendue :', error.response?.data || error.message);
      return false;
    }
  }
}

// Résumé des tests
async function runAuthenticationTests() {
  console.log('🔐 Tests d\'authentification pour getAllResourcesSummary\n');
  console.log('='.repeat(60) + '\n');
  
  const results = {
    withoutToken: await testWithoutToken(),
    withInvalidToken: await testWithInvalidToken(), 
    withValidToken: await testWithValidToken(),
    withCookieToken: await testWithCookieToken()
  };
  
  console.log('📊 RÉSULTATS DES TESTS');
  console.log('='.repeat(30));
  console.log(`Sans token (doit refuser): ${results.withoutToken ? '✅' : '❌'}`);
  console.log(`Token invalide (doit refuser): ${results.withInvalidToken ? '✅' : '❌'}`);
  console.log(`Token valide (doit accepter): ${results.withValidToken ? '✅' : '❌'}`);
  console.log(`Token cookie (optionnel): ${results.withCookieToken ? '✅' : '❌'}\n`);
  
  const authWorking = results.withoutToken && results.withInvalidToken && results.withValidToken;
  
  if (authWorking) {
    console.log('🎉 AUTHENTIFICATION FONCTIONNELLE !');
    console.log('✅ L\'endpoint est correctement protégé');
    console.log('✅ Seuls les utilisateurs authentifiés peuvent accéder');
  } else {
    console.log('🚨 PROBLÈME D\'AUTHENTIFICATION !');
    console.log('❌ L\'endpoint n\'est pas correctement protégé');
    
    if (!results.withoutToken) {
      console.log('🔧 Solution: Vérifier que @UseGuards(JwtAuthGuard) est appliqué');
    }
    if (!results.withInvalidToken) {
      console.log('🔧 Solution: Vérifier la validation des tokens JWT');
    }
    if (!results.withValidToken) {
      console.log('🔧 Solution: Vérifier la configuration JWT et les secrets');
    }
  }
  
  console.log('\n📝 Pour utiliser l\'API correctement:');
  console.log('   curl -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('        http://localhost:3000/resources/getAllResourcesSummary');
}

// Lancer les tests
runAuthenticationTests().catch(console.error); 