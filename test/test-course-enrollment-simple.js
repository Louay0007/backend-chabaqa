const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';

// Test simple pour vérifier que l'API fonctionne
async function testCourseEnrollmentAPI() {
  try {
    console.log('🧪 === TEST SIMPLE COURSE ENROLLMENT API ===\n');

    // 1. Se connecter pour obtenir un token
    console.log('🔐 Connexion utilisateur...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    const authToken = loginResponse.data.access_token;
    const userId = loginResponse.data.user._id;
    
    console.log('✅ Connexion réussie');
    console.log(`   👤 Utilisateur ID: ${userId}`);
    console.log(`   🔑 Token: ${authToken.substring(0, 20)}...`);

    // 2. Créer un cours de test
    console.log('\n📚 Création d\'un cours de test...');
    const courseResponse = await axios.post(`${BASE_URL}/cours`, {
      titre: 'Cours de test CourseEnrollment',
      description: 'Cours de test pour vérifier l\'API CourseEnrollment',
      communityId: 'test-community-id',
      prix: 0,
      devise: 'TND',
      isPublished: true
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const courseId = courseResponse.data.id;
    console.log('✅ Cours créé avec succès');
    console.log(`   📚 Cours ID: ${courseId}`);

    // 3. Ajouter une section
    console.log('\n📖 Ajout d\'une section...');
    const sectionResponse = await axios.post(`${BASE_URL}/cours/${courseId}/sections`, {
      titre: 'Section de test',
      description: 'Section de test pour CourseEnrollment',
      ordre: 1
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const sectionId = sectionResponse.data.section.id;
    console.log('✅ Section ajoutée avec succès');
    console.log(`   📖 Section ID: ${sectionId}`);

    // 4. Ajouter un chapitre
    console.log('\n📄 Ajout d\'un chapitre...');
    const chapterResponse = await axios.post(`${BASE_URL}/cours/${courseId}/sections/${sectionId}/chapitres`, {
      titre: 'Chapitre de test',
      contenu: 'Contenu du chapitre de test',
      ordre: 1,
      isPreview: true
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const chapterId = chapterResponse.data.chapitre.id;
    console.log('✅ Chapitre ajouté avec succès');
    console.log(`   📄 Chapitre ID: ${chapterId}`);

    // 5. Tester l'API CourseEnrollment - Démarrer le chapitre
    console.log('\n🚀 Test de l\'API CourseEnrollment - Démarrage du chapitre...');
    const startChapterResponse = await axios.post(
      `${BASE_URL}/courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/start`,
      {
        watchTime: 0,
        notes: 'Test de démarrage du chapitre'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('✅ Chapitre démarré avec succès !');
    console.log('📊 Réponse:', JSON.stringify(startChapterResponse.data, null, 2));

    // 6. Tester la récupération de la progression
    console.log('\n📊 Test de récupération de la progression...');
    const progressResponse = await axios.get(`${BASE_URL}/courses/${courseId}/progress`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Progression récupérée avec succès !');
    console.log('📊 Réponse:', JSON.stringify(progressResponse.data, null, 2));

    // 7. Tester la mise à jour du temps de visionnage
    console.log('\n⏱️ Test de mise à jour du temps de visionnage...');
    const watchTimeResponse = await axios.put(
      `${BASE_URL}/courses/${courseId}/chapters/${chapterId}/watch-time`,
      {
        watchTime: 300 // 5 minutes
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('✅ Temps de visionnage mis à jour avec succès !');
    console.log('📊 Réponse:', JSON.stringify(watchTimeResponse.data, null, 2));

    // 8. Tester le marquage comme terminé
    console.log('\n✅ Test de marquage comme terminé...');
    const completeResponse = await axios.put(
      `${BASE_URL}/courses/${courseId}/chapters/${chapterId}/complete`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('✅ Chapitre marqué comme terminé avec succès !');
    console.log('📊 Réponse:', JSON.stringify(completeResponse.data, null, 2));

    // 9. Vérification finale de la progression
    console.log('\n📊 Vérification finale de la progression...');
    const finalProgressResponse = await axios.get(`${BASE_URL}/courses/${courseId}/progress`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Progression finale récupérée !');
    console.log('📊 Réponse:', JSON.stringify(finalProgressResponse.data, null, 2));

    console.log('\n🎉 === TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS ===');
    console.log('✅ L\'API CourseEnrollment fonctionne parfaitement !');

  } catch (error) {
    console.error('\n💥 === ERREUR LORS DES TESTS ===');
    console.error('Erreur:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    process.exit(1);
  }
}

// Exécution du test
if (require.main === module) {
  testCourseEnrollmentAPI();
}

module.exports = { testCourseEnrollmentAPI };
