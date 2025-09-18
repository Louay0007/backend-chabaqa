const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password123';

// Variables globales pour stocker les tokens et IDs
let authToken = '';
let userId = '';
let courseId = '';
let sectionId = '';
let chapterId = '';

// Fonction pour se connecter et obtenir un token
async function login() {
  try {
    console.log('🔐 Connexion utilisateur...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });

    authToken = response.data.access_token;
    userId = response.data.user.id;
    console.log('✅ Connexion réussie');
    console.log(`   👤 Utilisateur ID: ${userId}`);
    console.log(`   🔑 Token: ${authToken.substring(0, 20)}...`);
    
    return authToken;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour créer un cours de test
async function createTestCourse() {
  try {
    console.log('📚 Création d\'un cours de test...');
    const response = await axios.post(`${BASE_URL}/cours`, {
      titre: 'Cours de test pour CourseEnrollment',
      description: 'Cours de test pour tester l\'API CourseEnrollment',
      communityId: 'test-community-id',
      prix: 0,
      devise: 'TND',
      isPublished: true
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    courseId = response.data.id;
    console.log('✅ Cours créé avec succès');
    console.log(`   📚 Cours ID: ${courseId}`);
    
    return courseId;
  } catch (error) {
    console.error('❌ Erreur création cours:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour ajouter une section au cours
async function addSectionToCourse() {
  try {
    console.log('📖 Ajout d\'une section au cours...');
    const response = await axios.post(`${BASE_URL}/cours/${courseId}/sections`, {
      titre: 'Section de test',
      description: 'Section de test pour CourseEnrollment',
      ordre: 1
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    sectionId = response.data.section.id;
    console.log('✅ Section ajoutée avec succès');
    console.log(`   📖 Section ID: ${sectionId}`);
    
    return sectionId;
  } catch (error) {
    console.error('❌ Erreur ajout section:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour ajouter un chapitre à la section
async function addChapterToSection() {
  try {
    console.log('📄 Ajout d\'un chapitre à la section...');
    const response = await axios.post(`${BASE_URL}/cours/${courseId}/sections/${sectionId}/chapitres`, {
      titre: 'Chapitre de test',
      contenu: 'Contenu du chapitre de test',
      ordre: 1,
      isPreview: true
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    chapterId = response.data.chapitre.id;
    console.log('✅ Chapitre ajouté avec succès');
    console.log(`   📄 Chapitre ID: ${chapterId}`);
    
    return chapterId;
  } catch (error) {
    console.error('❌ Erreur ajout chapitre:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour démarrer un chapitre
async function startChapter() {
  try {
    console.log('🚀 Démarrage du chapitre...');
    const response = await axios.post(
      `${BASE_URL}/courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/start`,
      {
        watchTime: 0,
        notes: 'Notes de test pour le démarrage du chapitre'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('✅ Chapitre démarré avec succès');
    console.log('📊 Réponse:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Erreur démarrage chapitre:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour obtenir la progression du cours
async function getCourseProgress() {
  try {
    console.log('📊 Récupération de la progression du cours...');
    const response = await axios.get(`${BASE_URL}/courses/${courseId}/progress`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Progression récupérée avec succès');
    console.log('📊 Réponse:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Erreur récupération progression:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour marquer un chapitre comme terminé
async function completeChapter() {
  try {
    console.log('✅ Marquage du chapitre comme terminé...');
    const response = await axios.put(
      `${BASE_URL}/courses/${courseId}/chapters/${chapterId}/complete`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('✅ Chapitre marqué comme terminé');
    console.log('📊 Réponse:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Erreur marquage chapitre terminé:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour mettre à jour le temps de visionnage
async function updateWatchTime() {
  try {
    console.log('⏱️ Mise à jour du temps de visionnage...');
    const response = await axios.put(
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

    console.log('✅ Temps de visionnage mis à jour');
    console.log('📊 Réponse:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Erreur mise à jour temps visionnage:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction principale de test
async function runTests() {
  try {
    console.log('🧪 === TESTS COURSE ENROLLMENT API ===\n');

    // 1. Connexion
    await login();

    // 2. Création du cours de test
    await createTestCourse();

    // 3. Ajout d'une section
    await addSectionToCourse();

    // 4. Ajout d'un chapitre
    await addChapterToSection();

    // 5. Test de démarrage du chapitre
    await startChapter();

    // 6. Test de récupération de la progression
    await getCourseProgress();

    // 7. Test de mise à jour du temps de visionnage
    await updateWatchTime();

    // 8. Test de marquage du chapitre comme terminé
    await completeChapter();

    // 9. Vérification finale de la progression
    await getCourseProgress();

    console.log('\n🎉 === TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS ===');

  } catch (error) {
    console.error('\n💥 === ERREUR LORS DES TESTS ===');
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

// Exécution des tests
if (require.main === module) {
  runTests();
}

module.exports = {
  login,
  createTestCourse,
  addSectionToCourse,
  addChapterToSection,
  startChapter,
  getCourseProgress,
  completeChapter,
  updateWatchTime
};
