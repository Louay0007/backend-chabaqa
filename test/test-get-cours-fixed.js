const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const USER_TOKEN = 'VOTRE_TOKEN_JWT_ICI'; // Remplacez par un token valide

async function testGetCours() {
  console.log('🧪 Test des APIs GET Cours - Après corrections');
  console.log('==============================================');

  if (USER_TOKEN === 'VOTRE_TOKEN_JWT_ICI') {
    console.log('⚠️  Token requis ! Mettez à jour USER_TOKEN avec un token valide');
    return;
  }

  try {
    // Test 1: GET Cours par communauté
    console.log('📑 TEST 1: Récupération des cours par communauté...');
    
    const communitySlug = 'digital-marketing-masters'; // Slug de la communauté existante
    console.log(`   🏢 Community Slug: ${communitySlug}`);

    try {
      const coursParCommunauteResponse = await axios.get(
        `${BASE_URL}/cours/community/${communitySlug}?page=1&limit=10&published=false`,
        {
          headers: {
            'Authorization': `Bearer ${USER_TOKEN}`
          }
        }
      );

      console.log('   ✅ Succès récupération cours par communauté:');
      console.log(`      📊 Total cours: ${coursParCommunauteResponse.data.total}`);
      console.log(`      📄 Page: ${coursParCommunauteResponse.data.page}/${coursParCommunauteResponse.data.totalPages}`);
      console.log(`      📚 Cours dans cette page: ${coursParCommunauteResponse.data.cours.length}`);

      if (coursParCommunauteResponse.data.cours.length > 0) {
        const premierCours = coursParCommunauteResponse.data.cours[0];
        console.log('');
        console.log('      📋 Premier cours trouvé:');
        console.log(`         🆔 ID: ${premierCours.id}`);
        console.log(`         📋 Titre: "${premierCours.titre}"`);
        console.log(`         📊 Sections: ${premierCours.sections?.length || 0}`);
        console.log(`         📚 Chapitres: ${premierCours.chapitres?.length || 0}`);
        console.log(`         🏢 Community: ${premierCours.communitySlug}`);
        console.log(`         📢 Publié: ${premierCours.isPublished}`);

        // Test 2: GET Cours par ID
        console.log('');
        console.log('📖 TEST 2: Récupération du cours par ID...');
        
        try {
          const coursParIdResponse = await axios.get(
            `${BASE_URL}/cours/${premierCours.id}`,
            {
              headers: {
                'Authorization': `Bearer ${USER_TOKEN}`
              }
            }
          );

          console.log('   ✅ Succès récupération cours par ID:');
          const cours = coursParIdResponse.data.cours;
          console.log(`      📋 Titre: "${cours.titre}"`);
          console.log(`      📝 Description: ${cours.description?.substring(0, 50)}...`);
          console.log(`      💰 Prix: ${cours.prix} ${cours.devise || 'TND'}`);
          console.log(`      📊 Sections: ${cours.sections?.length || 0}`);
          
          if (cours.sections && cours.sections.length > 0) {
            console.log('      📑 Détails des sections:');
            cours.sections.forEach((section, index) => {
              console.log(`         ${index + 1}. "${section.titre}" - ${section.chapitres?.length || 0} chapitres`);
            });
          }

          console.log(`      📚 Chapitres (compatibilité): ${cours.chapitres?.length || 0}`);
          console.log(`      👤 Créateur: ${cours.creator?.nom} ${cours.creator?.prenom}`);

        } catch (error) {
          console.log('   ❌ Erreur récupération cours par ID:');
          console.log(`      Status: ${error.response?.status}`);
          console.log(`      Message: ${error.response?.data?.message}`);
        }

      } else {
        console.log('      ℹ️  Aucun cours trouvé dans cette communauté');
      }

    } catch (error) {
      console.log('   ❌ Erreur récupération cours par communauté:');
      console.log(`      Status: ${error.response?.status}`);
      console.log(`      Message: ${error.response?.data?.message}`);
    }

    // Test 3: GET Mes cours
    console.log('');
    console.log('👤 TEST 3: Récupération de mes cours...');
    
    try {
      const mesCoursResponse = await axios.get(
        `${BASE_URL}/cours/user/mes-cours?page=1&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${USER_TOKEN}`
          }
        }
      );

      console.log('   ✅ Succès récupération mes cours:');
      console.log(`      📊 Total cours créés: ${mesCoursResponse.data.total}`);
      console.log(`      📚 Cours dans cette page: ${mesCoursResponse.data.cours.length}`);

      if (mesCoursResponse.data.cours.length > 0) {
        console.log('      📋 Mes cours:');
        mesCoursResponse.data.cours.forEach((cours, index) => {
          console.log(`         ${index + 1}. "${cours.titre}" - ${cours.sections?.length || 0} sections`);
        });
      } else {
        console.log('      ℹ️  Aucun cours créé par cet utilisateur');
      }

    } catch (error) {
      console.log('   ❌ Erreur récupération mes cours:');
      console.log(`      Status: ${error.response?.status}`);
      console.log(`      Message: ${error.response?.data?.message}`);
    }

    console.log('');
    console.log('🎉 Tests terminés !');
    console.log('✅ Si vous voyez des cours, les corrections fonctionnent');
    console.log('❌ Si vous ne voyez pas de cours, vérifiez les logs du serveur');

  } catch (error) {
    console.log('❌ ERREUR GÉNÉRALE:');
    console.log(`   Status: ${error.response?.status || 'Connection failed'}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    
    if (error.response?.status === 401) {
      console.log('');
      console.log('🔑 Token expiré ou invalide');
      console.log('   • Obtenez un nouveau token avec node test/get-fresh-token.js');
    }
  }
}

console.log('');
console.log('🚀 TEST CORRECTIONS GET COURS');
console.log('=============================');
console.log('');
console.log('📋 Corrections appliquées:');
console.log('   ✅ Correction filtrage par communityId au lieu de communitySlug');
console.log('   ✅ Correction extraction userId avec pattern uniforme');
console.log('   ✅ Correction enrollmentCount avec cours.inscriptions.length');
console.log('   ✅ Ajout logs debug complets');
console.log('   ✅ Correction méthode transformerEnReponse');
console.log('');
console.log('🔍 Ce test vérifie:');
console.log('   1. GET /cours/community/:slug - Cours par communauté');
console.log('   2. GET /cours/:id - Cours par ID');
console.log('   3. GET /cours/user/mes-cours - Mes cours');
console.log('');

testGetCours(); 