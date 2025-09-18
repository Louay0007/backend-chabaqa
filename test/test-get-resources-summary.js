const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3000';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODdiYTI4ODZmNGM5OGFhYTA0YTZjZTAiLCJlbWFpbCI6ImdoYXNzZW4uemFvdWFsaTIwMTlAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwianRpIjoiNjg3YmEyODg2ZjRjOThhYWEwNGE2Y2UwLWFjY2Vzcy0xNzUyOTMzNzg0MjAzIiwiaWF0IjoxNzUyOTMzNzg0LCJleHAiOjE3NTI5NDA5ODR9.N2zIBjkQgCJZhc9E4i10kAb50CQgMpebNwncW6xUII8';

// Headers avec authentification
const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

// Test de l'API getAllResourcesSummary
async function testGetResourcesSummary() {
  try {
    console.log('🧪 Test de l\'API GET /resources/summary...\n');
    
    const response = await axios.get(`${API_BASE}/resources/getAllResourcesSummary`, { headers });
    
    console.log('✅ Réponse reçue avec succès !');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📈 Nombre de ressources: ${response.data.length}\n`);
    
    if (response.data.length > 0) {
      console.log('📝 Exemple de ressource retournée:');
      const firstResource = response.data[0];
      console.log('-----------------------------------');
      console.log(`ID: ${firstResource._id}`);
      console.log(`Titre: ${firstResource.titre}`);
      console.log(`Description: ${firstResource.description.substring(0, 100)}...`);
      console.log(`Type: ${firstResource.type}`);
      console.log(`Temps de lecture: ${firstResource.readTime}`);
      console.log(`Catégorie: ${firstResource.category}`);
      console.log(`Slug: ${firstResource.slug}`);
      console.log(`Créé le: ${new Date(firstResource.createdAt).toLocaleDateString('fr-FR')}`);
      console.log('-----------------------------------\n');
      
      // Vérifier que seuls les champs attendus sont présents
      console.log('🔍 Vérification des champs...');
      const expectedFields = ['_id', 'titre', 'description', 'type', 'readTime', 'category', 'slug', 'createdAt'];
      const actualFields = Object.keys(firstResource);
      
      const missingFields = expectedFields.filter(field => !actualFields.includes(field));
      const extraFields = actualFields.filter(field => !expectedFields.includes(field));
      
      if (missingFields.length === 0 && extraFields.length === 0) {
        console.log('✅ Tous les champs sont corrects !');
      } else {
        if (missingFields.length > 0) {
          console.log(`❌ Champs manquants: ${missingFields.join(', ')}`);
        }
        if (extraFields.length > 0) {
          console.log(`⚠️  Champs supplémentaires: ${extraFields.join(', ')}`);
        }
      }
      
      console.log('\n📋 Champs présents:', actualFields.join(', '));
      
      // Vérifier que le contenu complet n'est pas présent
      if (!firstResource.content) {
        console.log('✅ Le champ "content" n\'est pas présent (optimisation réussie)');
      } else {
        console.log('⚠️  Le champ "content" est présent (peut impacter les performances)');
      }
      
    } else {
      console.log('ℹ️  Aucune ressource publiée trouvée.');
      console.log('💡 Conseil: Créez quelques ressources avec isPublished: true pour tester.');
    }
    
    console.log('\n🎯 Format de la réponse:');
    console.log('Chaque ressource contient uniquement:');
    console.log('• _id: Identifiant de la ressource');
    console.log('• titre: Titre de la ressource'); 
    console.log('• description: Description complète');
    console.log('• type: Type de ressource (Article/Video/Guide)');
    console.log('• readTime: Temps de lecture estimé');
    console.log('• category: Catégorie de la ressource');
    console.log('• slug: Slug pour URL (optionnel)');
    console.log('• createdAt: Date de création');
    
  } catch (error) {
    console.log('❌ Erreur lors du test:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Message:`, error.response.data);
    } else {
      console.log(`Erreur réseau:`, error.message);
    }
  }
}

// Test comparatif avec l'API complète
async function compareWithFullAPI() {
  try {
    console.log('\n🔄 Comparaison avec l\'API complète...\n');
    
    const [summaryResponse, fullResponse] = await Promise.all([
      axios.get(`${API_BASE}/resources/getAllResourcesSummary`, { headers }),
      axios.get(`${API_BASE}/resources/getAllPublishedResources`)
    ]);
    
    const summarySize = JSON.stringify(summaryResponse.data).length;
    const fullSize = JSON.stringify(fullResponse.data).length;
    
    console.log(`📊 Taille réponse summary: ${summarySize.toLocaleString()} caractères`);
    console.log(`📊 Taille réponse complète: ${fullSize.toLocaleString()} caractères`);
    console.log(`📉 Réduction: ${Math.round((1 - summarySize/fullSize) * 100)}%`);
    
    if (summarySize < fullSize) {
      console.log('✅ L\'API summary est plus légère (performance optimisée)');
    } else {
      console.log('⚠️  L\'API summary n\'est pas plus légère');
    }
    
  } catch (error) {
    console.log('❌ Erreur lors de la comparaison:', error.message);
  }
}

// Exécution des tests
async function runTests() {
  console.log('🚀 Test de l\'API Resources Summary\n');
  
  await testGetResourcesSummary();
  await compareWithFullAPI();
  
  console.log('\n✨ Tests terminés !\n');
  console.log('📝 Pour utiliser cette API:');
  console.log('   curl -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('        http://localhost:3000/resources/getAllResourcesSummary');
  console.log('   (Authentification JWT requise)');
}

// Lancer les tests
runTests().catch(console.error); 