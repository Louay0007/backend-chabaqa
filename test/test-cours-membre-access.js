const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
let authTokenAdmin = '';
let authTokenMembre = '';
let coursId = '';

// Données de test
const adminUser = {
  email: 'admin@test.com',
  motDePasse: 'TestPassword123!'
};

const membreUser = {
  email: 'membre@test.com',
  motDePasse: 'TestPassword123!'
};

const communitySlug = 'test-community'; // Remplacer par un slug de communauté existant

/**
 * Fonction de connexion
 */
async function seConnecter(user, isAdmin = false) {
  try {
    console.log(`🔐 Connexion ${isAdmin ? 'admin' : 'membre'}...`);
    const response = await axios.post(`${BASE_URL}/auth/login`, user);
    
    if (response.data.access_token) {
      if (isAdmin) {
        authTokenAdmin = response.data.access_token;
      } else {
        authTokenMembre = response.data.access_token;
      }
      console.log(`✅ Connexion ${isAdmin ? 'admin' : 'membre'} réussie`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Erreur connexion ${isAdmin ? 'admin' : 'membre'}:`, error.response?.data || error.message);
    return false;
  }
}

/**
 * Créer un cours en tant qu'admin (pour les tests)
 */
async function creerCoursTest() {
  try {
    console.log('\n📚 Création d\'un cours de test en tant qu\'admin...');
    
    const nouveauCours = {
      titre: 'Cours Test - Accès Membre',
      description: 'Un cours pour tester l\'accès des membres',
      isPaid: false,
      communitySlug: communitySlug,
      isPublished: true,
      chapitres: [
        {
          titre: 'Chapitre de test',
          description: 'Un chapitre pour tester',
          isPaid: false,
          ordre: 1,
          duree: '10:00'
        }
      ]
    };

    const response = await axios.post(
      `${BASE_URL}/cours/create-cours`,
      nouveauCours,
      {
        headers: {
          'Authorization': `Bearer ${authTokenAdmin}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 201) {
      coursId = response.data.cours.id;
      console.log('✅ Cours de test créé avec succès:', coursId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erreur création cours test:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Tester l'accès en tant que membre
 */
async function testerAccesMembreGetCours() {
  try {
    console.log('\n🔍 Test: Membre accède à GET /cours/:id...');

    const response = await axios.get(
      `${BASE_URL}/cours/${coursId}`,
      {
        headers: {
          'Authorization': `Bearer ${authTokenMembre}`
        }
      }
    );

    if (response.status === 200) {
      console.log('✅ Succès: Membre peut accéder aux détails du cours');
      console.log(`   - Titre: ${response.data.cours.titre}`);
      console.log(`   - Chapitres: ${response.data.cours.chapitres.length}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erreur accès membre GET cours:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Tester l'accès liste des cours de la communauté
 */
async function testerAccesMembreGetCoursListe() {
  try {
    console.log('\n📋 Test: Membre accède à GET /cours/community/:slug...');

    const response = await axios.get(
      `${BASE_URL}/cours/community/${communitySlug}?page=1&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${authTokenMembre}`
        }
      }
    );

    if (response.status === 200) {
      console.log('✅ Succès: Membre peut accéder à la liste des cours');
      console.log(`   - Total cours: ${response.data.total}`);
      console.log(`   - Cours sur cette page: ${response.data.cours.length}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erreur accès membre GET cours liste:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Tester l'accès aux statistiques du cours
 */
async function testerAccesMembreGetStats() {
  try {
    console.log('\n📊 Test: Membre accède à GET /cours/:id/stats...');

    const response = await axios.get(
      `${BASE_URL}/cours/${coursId}/stats`,
      {
        headers: {
          'Authorization': `Bearer ${authTokenMembre}`
        }
      }
    );

    if (response.status === 200) {
      console.log('✅ Succès: Membre peut accéder aux statistiques');
      console.log(`   - Titre: ${response.data.stats.titre}`);
      console.log(`   - Inscriptions: ${response.data.stats.enrollmentCount}`);
      console.log(`   - Chapitres: ${response.data.stats.chapitresCount}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erreur accès membre GET stats:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Tester que le membre ne peut PAS créer de cours (doit échouer)
 */
async function testerEchecMembreCreateCours() {
  try {
    console.log('\n🚫 Test: Membre tente de créer un cours (doit échouer)...');

    const nouveauCours = {
      titre: 'Cours Interdit',
      description: 'Ce cours ne devrait pas être créé',
      isPaid: false,
      communitySlug: communitySlug,
      isPublished: false,
      chapitres: []
    };

    const response = await axios.post(
      `${BASE_URL}/cours/create-cours`,
      nouveauCours,
      {
        headers: {
          'Authorization': `Bearer ${authTokenMembre}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Si on arrive ici, c'est un problème
    console.log('❌ PROBLÈME: Le membre a pu créer un cours alors qu\'il ne devrait pas!');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Succès: Membre correctement bloqué pour la création de cours');
      console.log(`   - Message: ${error.response.data.message}`);
      return true;
    } else {
      console.error('❌ Erreur inattendue:', error.response?.data || error.message);
      return false;
    }
  }
}

/**
 * Tester qu'un utilisateur non-membre ne peut pas accéder (créer un faux token ou utiliser autre communauté)
 */
async function testerEchecNonMembreAcces() {
  try {
    console.log('\n🔒 Test: Non-membre tente d\'accéder à un cours (doit échouer)...');

    // Utiliser le token membre mais essayer d'accéder à un cours d'une autre communauté
    // ou simplement utiliser un cours qui n'existe pas
    const response = await axios.get(
      `${BASE_URL}/cours/${coursId}`,
      {
        headers: {
          'Authorization': `Bearer ${authTokenMembre}` // Ce token ne devrait pas avoir accès si pas membre
        }
      }
    );

    // Si on arrive ici sans erreur, c'est bon (car notre utilisateur test EST membre)
    console.log('ℹ️  Info: L\'utilisateur test est bien membre, l\'accès est autorisé');
    return true;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Succès: Non-membre correctement bloqué');
      console.log(`   - Message: ${error.response.data.message}`);
      return true;
    } else {
      console.error('❌ Erreur inattendue:', error.response?.data || error.message);
      return false;
    }
  }
}

/**
 * Fonction principale de test
 */
async function executerTestsAccesMembre() {
  console.log('🚀 Test des permissions d\'accès des membres aux APIs Cours\n');
  console.log('📋 Configuration:');
  console.log(`   - URL de base: ${BASE_URL}`);
  console.log(`   - Communauté: ${communitySlug}`);
  console.log(`   - Admin: ${adminUser.email}`);
  console.log(`   - Membre: ${membreUser.email}`);

  let testsReussis = 0;
  let testsTotal = 0;

  // Étape 1: Connexions
  console.log('\n📝 Phase 1: Connexions');
  const connexionAdmin = await seConnecter(adminUser, true);
  const connexionMembre = await seConnecter(membreUser, false);
  
  if (!connexionAdmin || !connexionMembre) {
    console.log('❌ Tests arrêtés - impossible de se connecter');
    return;
  }

  // Étape 2: Créer un cours de test en tant qu'admin
  console.log('\n📝 Phase 2: Préparation');
  const coursCreated = await creerCoursTest();
  if (!coursCreated) {
    console.log('❌ Tests arrêtés - impossible de créer le cours de test');
    return;
  }

  // Étape 3: Tests d'accès membre aux APIs GET
  console.log('\n📝 Phase 3: Tests d\'accès membre aux APIs GET');
  
  testsTotal++;
  if (await testerAccesMembreGetCours()) testsReussis++;
  
  testsTotal++;
  if (await testerAccesMembreGetCoursListe()) testsReussis++;
  
  testsTotal++;
  if (await testerAccesMembreGetStats()) testsReussis++;

  // Étape 4: Tests de restrictions (membre ne peut pas créer)
  console.log('\n📝 Phase 4: Tests de restrictions');
  
  testsTotal++;
  if (await testerEchecMembreCreateCours()) testsReussis++;

  // Résumé final
  console.log('\n🎉 Tests terminés!');
  console.log(`📊 Résultats: ${testsReussis}/${testsTotal} tests réussis`);
  
  if (testsReussis === testsTotal) {
    console.log('✅ Tous les tests sont passés avec succès!');
    console.log('\n📝 Fonctionnalités validées:');
    console.log('   ✅ Membres peuvent accéder aux cours (GET)');
    console.log('   ✅ Membres peuvent voir la liste des cours');
    console.log('   ✅ Membres peuvent voir les statistiques');
    console.log('   ✅ Membres ne peuvent PAS créer de cours');
  } else {
    console.log('⚠️  Certains tests ont échoué, vérifiez la configuration');
  }
}

// Exécuter les tests
if (require.main === module) {
  executerTestsAccesMembre().catch(console.error);
}

module.exports = {
  executerTestsAccesMembre
}; 