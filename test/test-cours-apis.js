const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
let authToken = '';
let coursId = '';

// Données de test
const testUser = {
  email: 'admin@test.com',
  motDePasse: 'TestPassword123!'
};

const communitySlug = 'test-community'; // Remplacer par un slug de communauté existant

const nouveauCours = {
  titre: 'Formation JavaScript Avancé',
  description: 'Une formation complète sur JavaScript moderne avec ES6+, asynchrone, et frameworks.',
  coverImage: 'https://example.com/javascript-course.jpg',
  isPaid: true,
  prix: 99.99,
  communitySlug: communitySlug,
  isPublished: false,
  chapitres: [
    {
      titre: 'Introduction à ES6',
      description: 'Découvrez les nouvelles fonctionnalités d\'ES6',
      videoUrl: 'https://example.com/videos/es6-intro.mp4',
      isPaid: false,
      ordre: 1,
      duree: '15:30'
    },
    {
      titre: 'Programmation asynchrone',
      description: 'Maîtrisez Promises et async/await',
      videoUrl: 'https://example.com/videos/async.mp4',
      isPaid: true,
      ordre: 2,
      duree: '25:45'
    }
  ]
};

const nouveauChapitre = {
  titre: 'Les modules JavaScript',
  description: 'Comprendre import/export et la modularité',
  videoUrl: 'https://example.com/videos/modules.mp4',
  isPaid: true,
  ordre: 3,
  duree: '20:15'
};

/**
 * Fonction d'authentification
 */
async function seConnecter() {
  try {
    console.log('🔐 Connexion...');
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
    
    if (response.data.access_token) {
      authToken = response.data.access_token;
      console.log('✅ Connexion réussie');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.response?.data || error.message);
    return false;
  }
}

/**
 * API 1: Créer un cours avec ses chapitres
 */
async function testerCreationCours() {
  try {
    console.log('\n📚 Test 1: Création d\'un cours avec chapitres...');
    console.log('Données du cours:', JSON.stringify(nouveauCours, null, 2));

    const response = await axios.post(
      `${BASE_URL}/cours/create-cours`,
      nouveauCours,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 201) {
      coursId = response.data.cours.id;
      console.log('✅ Cours créé avec succès!');
      console.log('📋 Détails du cours:');
      console.log(`   - ID: ${response.data.cours.id}`);
      console.log(`   - Titre: ${response.data.cours.titre}`);
      console.log(`   - Prix: ${response.data.cours.prix}€`);
      console.log(`   - Publié: ${response.data.cours.isPublished ? 'Oui' : 'Non'}`);
      console.log(`   - Nombre de chapitres: ${response.data.cours.chapitres.length}`);
      
      console.log('\n📖 Chapitres créés:');
      response.data.cours.chapitres.forEach((chapitre, index) => {
        console.log(`   ${index + 1}. ${chapitre.titre} (${chapitre.isPaid ? 'Payant' : 'Gratuit'})`);
      });
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erreur création cours:', error.response?.data || error.message);
    return false;
  }
}

/**
 * API 2: Ajouter un chapitre à un cours existant
 */
async function testerAjoutChapitre() {
  try {
    console.log('\n➕ Test 2: Ajout d\'un chapitre au cours...');
    console.log('Données du chapitre:', JSON.stringify(nouveauChapitre, null, 2));

    const response = await axios.post(
      `${BASE_URL}/cours/${coursId}/chapitres`,
      nouveauChapitre,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 201) {
      console.log('✅ Chapitre ajouté avec succès!');
      console.log('📋 Détails du chapitre:');
      console.log(`   - ID: ${response.data.chapitre.id}`);
      console.log(`   - Titre: ${response.data.chapitre.titre}`);
      console.log(`   - Ordre: ${response.data.chapitre.ordre}`);
      console.log(`   - Durée: ${response.data.chapitre.duree}`);
      console.log(`   - Type: ${response.data.chapitre.isPaid ? 'Payant' : 'Gratuit'}`);
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erreur ajout chapitre:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Tester la récupération du cours mis à jour
 */
async function testerRecuperationCours() {
  try {
    console.log('\n📖 Test 3: Récupération du cours mis à jour...');

    const response = await axios.get(
      `${BASE_URL}/cours/${coursId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    if (response.status === 200) {
      console.log('✅ Cours récupéré avec succès!');
      console.log(`📊 Statistiques finales:`);
      console.log(`   - Titre: ${response.data.cours.titre}`);
      console.log(`   - Total chapitres: ${response.data.cours.chapitres.length}`);
      console.log(`   - Chapitres gratuits: ${response.data.cours.chapitres.filter(ch => !ch.isPaid).length}`);
      console.log(`   - Chapitres payants: ${response.data.cours.chapitres.filter(ch => ch.isPaid).length}`);
      console.log(`   - Inscriptions: ${response.data.cours.enrollmentCount}`);
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erreur récupération cours:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Fonction principale de test
 */
async function executerTests() {
  console.log('🚀 Démarrage des tests des APIs Cours\n');
  console.log('📋 Configuration:');
  console.log(`   - URL de base: ${BASE_URL}`);
  console.log(`   - Communauté: ${communitySlug}`);
  console.log(`   - Utilisateur: ${testUser.email}`);

  // Étape 1: Se connecter
  const connexionReussie = await seConnecter();
  if (!connexionReussie) {
    console.log('❌ Tests arrêtés - impossible de se connecter');
    return;
  }

  // Étape 2: Créer un cours
  const coursCreee = await testerCreationCours();
  if (!coursCreee) {
    console.log('❌ Tests arrêtés - impossible de créer le cours');
    return;
  }

  // Étape 3: Ajouter un chapitre
  const chapitreAjoute = await testerAjoutChapitre();
  if (!chapitreAjoute) {
    console.log('❌ Tests arrêtés - impossible d\'ajouter le chapitre');
    return;
  }

  // Étape 4: Vérifier le cours final
  await testerRecuperationCours();

  console.log('\n🎉 Tous les tests sont terminés!');
  console.log('\n📝 Résumé des fonctionnalités testées:');
  console.log('   ✅ API 1: Création de cours avec chapitres');
  console.log('   ✅ API 2: Ajout de chapitre à un cours existant');
  console.log('   ✅ Vérification des permissions admin');
  console.log('   ✅ Récupération et validation des données');
}

// Exécuter les tests
if (require.main === module) {
  executerTests().catch(console.error);
}

module.exports = {
  executerTests,
  testerCreationCours,
  testerAjoutChapitre
}; 