/**
 * Test script pour vérifier l'implémentation de la progression séquentielle
 * 
 * Ce script teste les fonctionnalités suivantes :
 * 1. Activation/désactivation de la progression séquentielle pour les cours
 * 2. Activation/désactivation de la progression séquentielle pour les défis
 * 3. Vérification de l'accès aux chapitres/tâches avec progression séquentielle
 * 4. Déverrouillage manuel des chapitres/tâches
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = '507f1f77bcf86cd799439011'; // ID utilisateur de test
const TEST_COURSE_ID = '507f1f77bcf86cd799439012'; // ID cours de test
const TEST_CHALLENGE_ID = '507f1f77bcf86cd799439013'; // ID défi de test

// Token JWT de test (à remplacer par un vrai token)
const TEST_TOKEN = 'your-jwt-token-here';

const headers = {
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testSequentialProgression() {
  console.log('🧪 Test de la progression séquentielle');
  console.log('=====================================\n');

  try {
    // Test 1: Activer la progression séquentielle pour un cours
    console.log('📚 Test 1: Activation de la progression séquentielle pour un cours');
    const courseSequentialResponse = await axios.patch(
      `${BASE_URL}/cours/${TEST_COURSE_ID}/sequential-progression`,
      {
        enabled: true,
        unlockMessage: 'Complétez le chapitre précédent pour débloquer ce contenu'
      },
      { headers }
    );
    console.log('✅ Progression séquentielle activée pour le cours');
    console.log(`   Sequential Progression: ${courseSequentialResponse.data.sequentialProgression}`);
    console.log(`   Unlock Message: ${courseSequentialResponse.data.unlockMessage}\n`);

    // Test 2: Activer la progression séquentielle pour un défi
    console.log('🏆 Test 2: Activation de la progression séquentielle pour un défi');
    const challengeSequentialResponse = await axios.patch(
      `${BASE_URL}/challenges/${TEST_CHALLENGE_ID}/sequential-progression`,
      {
        enabled: true,
        unlockMessage: 'Complétez la tâche précédente pour débloquer cette étape'
      },
      { headers }
    );
    console.log('✅ Progression séquentielle activée pour le défi');
    console.log(`   Sequential Progression: ${challengeSequentialResponse.data.sequentialProgression}`);
    console.log(`   Unlock Message: ${challengeSequentialResponse.data.unlockMessage}\n`);

    // Test 3: Vérifier l'accès à un chapitre avec progression séquentielle
    console.log('🔍 Test 3: Vérification de l\'accès à un chapitre');
    const chapterAccessResponse = await axios.get(
      `${BASE_URL}/cours/${TEST_COURSE_ID}/chapters/chapter-1/access`,
      { headers }
    );
    console.log('✅ Accès au chapitre vérifié');
    console.log(`   Has Access: ${chapterAccessResponse.data.hasAccess}`);
    console.log(`   Reason: ${chapterAccessResponse.data.reason}`);
    if (chapterAccessResponse.data.requiredChapter) {
      console.log(`   Required Chapter: ${chapterAccessResponse.data.requiredChapter.titre}`);
    }
    console.log();

    // Test 4: Vérifier l'accès à une tâche avec progression séquentielle
    console.log('🔍 Test 4: Vérification de l\'accès à une tâche');
    const taskAccessResponse = await axios.get(
      `${BASE_URL}/challenges/${TEST_CHALLENGE_ID}/tasks/task-1/access`,
      { headers }
    );
    console.log('✅ Accès à la tâche vérifié');
    console.log(`   Has Access: ${taskAccessResponse.data.hasAccess}`);
    console.log(`   Reason: ${taskAccessResponse.data.reason}`);
    if (taskAccessResponse.data.requiredTask) {
      console.log(`   Required Task: ${taskAccessResponse.data.requiredTask.title}`);
    }
    console.log();

    // Test 5: Obtenir les chapitres déverrouillés
    console.log('📋 Test 5: Récupération des chapitres déverrouillés');
    const unlockedChaptersResponse = await axios.get(
      `${BASE_URL}/cours/${TEST_COURSE_ID}/unlocked-chapters`,
      { headers }
    );
    console.log('✅ Chapitres déverrouillés récupérés');
    console.log(`   Sequential Progression Enabled: ${unlockedChaptersResponse.data.sequentialProgressionEnabled}`);
    console.log(`   Unlocked Chapters Count: ${unlockedChaptersResponse.data.unlockedChapters.length}`);
    unlockedChaptersResponse.data.unlockedChapters.forEach((chapter, index) => {
      console.log(`   ${index + 1}. ${chapter.titre} - Unlocked: ${chapter.isUnlocked}, Completed: ${chapter.isCompleted}`);
    });
    console.log();

    // Test 6: Obtenir les tâches déverrouillées
    console.log('📋 Test 6: Récupération des tâches déverrouillées');
    const unlockedTasksResponse = await axios.get(
      `${BASE_URL}/challenges/${TEST_CHALLENGE_ID}/unlocked-tasks`,
      { headers }
    );
    console.log('✅ Tâches déverrouillées récupérées');
    console.log(`   Sequential Progression Enabled: ${unlockedTasksResponse.data.sequentialProgressionEnabled}`);
    console.log(`   Unlocked Tasks Count: ${unlockedTasksResponse.data.unlockedTasks.length}`);
    unlockedTasksResponse.data.unlockedTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.title} (Day ${task.day}) - Unlocked: ${task.isUnlocked}, Completed: ${task.isCompleted}`);
    });
    console.log();

    // Test 7: Déverrouiller manuellement un chapitre
    console.log('🔓 Test 7: Déverrouillage manuel d\'un chapitre');
    const unlockChapterResponse = await axios.post(
      `${BASE_URL}/cours/${TEST_COURSE_ID}/chapters/chapter-2/unlock`,
      { userId: TEST_USER_ID },
      { headers }
    );
    console.log('✅ Chapitre déverrouillé manuellement');
    console.log(`   Message: ${unlockChapterResponse.data.message}\n`);

    // Test 8: Déverrouiller manuellement une tâche
    console.log('🔓 Test 8: Déverrouillage manuel d\'une tâche');
    const unlockTaskResponse = await axios.post(
      `${BASE_URL}/challenges/${TEST_CHALLENGE_ID}/tasks/task-2/unlock`,
      { userId: TEST_USER_ID },
      { headers }
    );
    console.log('✅ Tâche déverrouillée manuellement');
    console.log(`   Message: ${unlockTaskResponse.data.message}\n`);

    // Test 9: Désactiver la progression séquentielle pour le cours
    console.log('📚 Test 9: Désactivation de la progression séquentielle pour le cours');
    const disableCourseSequentialResponse = await axios.patch(
      `${BASE_URL}/cours/${TEST_COURSE_ID}/sequential-progression`,
      { enabled: false },
      { headers }
    );
    console.log('✅ Progression séquentielle désactivée pour le cours');
    console.log(`   Sequential Progression: ${disableCourseSequentialResponse.data.sequentialProgression}\n`);

    // Test 10: Désactiver la progression séquentielle pour le défi
    console.log('🏆 Test 10: Désactivation de la progression séquentielle pour le défi');
    const disableChallengeSequentialResponse = await axios.patch(
      `${BASE_URL}/challenges/${TEST_CHALLENGE_ID}/sequential-progression`,
      { enabled: false },
      { headers }
    );
    console.log('✅ Progression séquentielle désactivée pour le défi');
    console.log(`   Sequential Progression: ${disableChallengeSequentialResponse.data.sequentialProgression}\n`);

    console.log('🎉 Tous les tests de progression séquentielle sont passés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Conseil: Assurez-vous d\'avoir un token JWT valide dans la variable TEST_TOKEN');
    }
    
    if (error.response?.status === 404) {
      console.log('\n💡 Conseil: Assurez-vous que les IDs de test (cours, défi, utilisateur) existent dans votre base de données');
    }
  }
}

// Fonction pour tester la progression séquentielle avec des données réelles
async function testWithRealData() {
  console.log('🔧 Test avec des données réelles');
  console.log('===============================\n');
  
  try {
    // D'abord, récupérer un cours existant
    console.log('📚 Récupération d\'un cours existant...');
    const coursesResponse = await axios.get(`${BASE_URL}/cours`, { headers });
    
    if (coursesResponse.data.cours && coursesResponse.data.cours.length > 0) {
      const realCourseId = coursesResponse.data.cours[0].id;
      console.log(`✅ Cours trouvé: ${coursesResponse.data.cours[0].titre} (ID: ${realCourseId})`);
      
      // Activer la progression séquentielle
      console.log('\n🔒 Activation de la progression séquentielle...');
      const sequentialResponse = await axios.patch(
        `${BASE_URL}/cours/${realCourseId}/sequential-progression`,
        {
          enabled: true,
          unlockMessage: 'Complétez le chapitre précédent pour débloquer ce contenu'
        },
        { headers }
      );
      
      console.log('✅ Progression séquentielle activée');
      console.log(`   Sequential Progression: ${sequentialResponse.data.sequentialProgression}`);
      console.log(`   Unlock Message: ${sequentialResponse.data.unlockMessage}`);
      
      // Récupérer les chapitres déverrouillés
      console.log('\n📋 Récupération des chapitres déverrouillés...');
      const unlockedResponse = await axios.get(
        `${BASE_URL}/cours/${realCourseId}/unlocked-chapters`,
        { headers }
      );
      
      console.log('✅ Chapitres déverrouillés récupérés');
      console.log(`   Sequential Progression Enabled: ${unlockedResponse.data.sequentialProgressionEnabled}`);
      console.log(`   Total Chapters: ${unlockedResponse.data.unlockedChapters.length}`);
      
      unlockedResponse.data.unlockedChapters.forEach((chapter, index) => {
        console.log(`   ${index + 1}. ${chapter.titre} - Unlocked: ${chapter.isUnlocked}, Completed: ${chapter.isCompleted}`);
      });
      
    } else {
      console.log('❌ Aucun cours trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test avec des données réelles:', error.response?.data || error.message);
  }
}

// Exécuter les tests
if (require.main === module) {
  console.log('🚀 Démarrage des tests de progression séquentielle\n');
  
  // Vérifier si on a un token valide
  if (TEST_TOKEN === 'your-jwt-token-here') {
    console.log('⚠️  Attention: Vous devez configurer un token JWT valide dans la variable TEST_TOKEN');
    console.log('   Vous pouvez obtenir un token en vous connectant via l\'API d\'authentification\n');
  }
  
  // Exécuter les tests
  testSequentialProgression()
    .then(() => {
      console.log('\n' + '='.repeat(50));
      return testWithRealData();
    })
    .catch(console.error);
}

module.exports = {
  testSequentialProgression,
  testWithRealData
};
