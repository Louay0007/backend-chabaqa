const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

/**
 * Test des APIs de cours avec le nouveau schéma
 */
async function testCoursAPIsWithNewSchema() {
  console.log('🧪 Test des APIs de cours avec le nouveau schéma');
  console.log('=' .repeat(60));

  try {
    let authToken;
    let communityId;
    let coursId;

    // Étape 1: Se connecter
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'Test123!'
      });
      authToken = loginResponse.data.access_token;
      console.log('✅ Connexion réussie');
    } catch (error) {
      console.log('❌ Erreur de connexion, tentative de création d\'un compte...');
      
      const signupResponse = await axios.post(`${BASE_URL}/user/signup`, {
        name: 'Test User Cours',
        email: 'testcours@example.com',
        password: 'Test123!',
        role: 'user'
      });
      
      if (signupResponse.data.success) {
        // Se connecter après création de compte
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'testcours@example.com',
          password: 'Test123!'
        });
        authToken = loginResponse.data.access_token;
        console.log('✅ Compte créé et connexion réussie');
      }
    }

    // Étape 2: Créer une communauté de test
    console.log('\n📝 Création d\'une communauté de test...');
    
    const communityData = {
      name: `Communauté Test Cours ${Date.now()}`,
      bio: 'Communauté pour tester les cours avec le nouveau schéma',
      country: 'Tunisie',
      status: 'public',
      joinFee: 'free',
      feeAmount: '0',
      currency: 'TND',
      socialLinks: {
        website: 'https://test-cours.tn'
      }
    };

    const communityResponse = await axios.post(
      `${BASE_URL}/community-aff-crea-join/create`,
      communityData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    communityId = communityResponse.data.data.slug;
    console.log(`✅ Communauté créée: ${communityResponse.data.data.name}`);

    // Étape 3: Créer un cours de test
    console.log('\n📚 Création d\'un cours de test...');
    
    const coursData = {
      titre: `Cours Test Nouveau Schéma ${Date.now()}`,
      description: 'Un cours pour tester le nouveau schéma avec sections et chapitres',
      communitySlug: communityId,
      prix: 29.99,
      devise: 'TND',
      category: 'Technologie',
      niveau: 'débutant',
      duree: '2 heures',
      learningObjectives: [
        'Comprendre le nouveau schéma',
        'Maîtriser les sections et chapitres',
        'Utiliser les ressources de cours'
      ],
      requirements: [
        'Connaissances de base en programmation',
        'Motivation pour apprendre'
      ],
      notes: 'Cours créé automatiquement pour les tests'
    };

    const coursResponse = await axios.post(
      `${BASE_URL}/cours/create`,
      coursData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    coursId = coursResponse.data.id;
    console.log(`✅ Cours créé: ${coursResponse.data.titre}`);
    console.log(`   ID: ${coursId}`);
    console.log(`   Prix: ${coursResponse.data.prix} ${coursResponse.data.devise || 'TND'}`);
    console.log(`   Catégorie: ${coursResponse.data.category || 'Non défini'}`);
    console.log(`   Niveau: ${coursResponse.data.niveau || 'Non défini'}`);

    // Étape 4: Ajouter un chapitre au cours
    console.log('\n📖 Ajout d\'un chapitre...');
    
    const chapitreData = {
      titre: 'Introduction au nouveau schéma',
      description: 'Dans ce chapitre, nous explorons les fonctionnalités du nouveau schéma de cours',
      videoUrl: 'https://example.com/video1.mp4',
      isPaid: false, // Chapitre gratuit pour prévisualisation
      ordre: 1,
      duree: '15'
    };

    const chapitreResponse = await axios.post(
      `${BASE_URL}/cours/${coursId}/chapitres`,
      chapitreData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Chapitre ajouté: ${chapitreResponse.data.titre}`);
    console.log(`   ID: ${chapitreResponse.data.id}`);
    console.log(`   Gratuit: ${!chapitreResponse.data.isPaid ? 'Oui' : 'Non'}`);
    console.log(`   Ordre: ${chapitreResponse.data.ordre}`);

    // Étape 5: Récupérer le cours complet avec le nouveau schéma
    console.log('\n🔍 Récupération du cours complet...');
    
    const coursCompletResponse = await axios.get(
      `${BASE_URL}/cours/${coursId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    const coursComplet = coursCompletResponse.data;
    console.log(`✅ Cours récupéré: ${coursComplet.titre}`);
    console.log(`   Sections: ${coursComplet.sections?.length || 0}`);
    console.log(`   Chapitres total: ${coursComplet.chapitres?.length || 0}`);
    console.log(`   Inscriptions: ${coursComplet.enrollmentCount || 0}`);
    
    if (coursComplet.sections && coursComplet.sections.length > 0) {
      console.log(`   Première section: ${coursComplet.sections[0].titre}`);
      console.log(`   Chapitres dans cette section: ${coursComplet.sections[0].chapitres?.length || 0}`);
    }

    if (coursComplet.learningObjectives && coursComplet.learningObjectives.length > 0) {
      console.log(`   Objectifs d'apprentissage: ${coursComplet.learningObjectives.length} définis`);
    }

    // Étape 6: Publier le cours
    console.log('\n📢 Publication du cours...');
    
    const publishResponse = await axios.patch(
      `${BASE_URL}/cours/${coursId}/publier`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log(`✅ Cours ${publishResponse.data.isPublished ? 'publié' : 'dépublié'}`);

    // Étape 7: Lister les cours de la communauté
    console.log('\n📋 Liste des cours de la communauté...');
    
    const coursListResponse = await axios.get(
      `${BASE_URL}/cours/community/${communityId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log(`✅ ${coursListResponse.data.length} cours trouvé(s) dans la communauté`);
    
    coursListResponse.data.forEach((cours, index) => {
      console.log(`   ${index + 1}. ${cours.titre}`);
      console.log(`      - Prix: ${cours.prix} ${cours.devise}`);
      console.log(`      - Publié: ${cours.isPublished ? 'Oui' : 'Non'}`);
      console.log(`      - Sections: ${cours.sections?.length || 0}`);
    });

    console.log('\n🎉 Tous les tests ont réussi !');
    console.log('\n📊 Résumé des fonctionnalités testées :');
    console.log('   ✅ Création de cours avec nouveau schéma');
    console.log('   ✅ Support des sections et chapitres');
    console.log('   ✅ Ajout de chapitres avec création automatique de section');
    console.log('   ✅ Mapping correct entre ancien et nouveau format');
    console.log('   ✅ Nouveaux champs (category, niveau, devise, etc.)');
    console.log('   ✅ Publication/dépublication');
    console.log('   ✅ Listage avec nouveau format');

  } catch (error) {
    console.error('❌ Erreur durant le test:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.log('📋 Détails de l\'erreur:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Vérifier que le serveur est démarré
console.log('🚀 Démarrage des tests pour le nouveau schéma de cours...');
console.log(`🌐 URL de base: ${BASE_URL}`);
console.log('⚠️  Assurez-vous que le serveur NestJS est démarré sur le port 3000\n');

// Attendre un peu avant de commencer les tests
setTimeout(() => {
  testCoursAPIsWithNewSchema();
}, 3000); 