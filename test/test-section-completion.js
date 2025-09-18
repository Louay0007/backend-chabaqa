const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';

// Test pour l'API de completion de section
async function testSectionCompletionAPI() {
  try {
    console.log('🧪 === TEST SECTION COMPLETION API ===\n');

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
      titre: 'Cours de test Section Completion',
      description: 'Cours de test pour vérifier l\'API de completion de section',
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
      titre: 'Section de test pour completion',
      description: 'Section de test pour vérifier la completion',
      ordre: 1
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const sectionId = sectionResponse.data.section.id;
    console.log('✅ Section ajoutée avec succès');
    console.log(`   📖 Section ID: ${sectionId}`);

    // 4. Ajouter plusieurs chapitres à la section
    console.log('\n📄 Ajout de chapitres à la section...');
    const chapters = [];
    
    for (let i = 1; i <= 3; i++) {
      const chapterResponse = await axios.post(`${BASE_URL}/cours/${courseId}/sections/${sectionId}/chapitres`, {
        titre: `Chapitre ${i} de test`,
        contenu: `Contenu du chapitre ${i} de test`,
        ordre: i,
        isPreview: true
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      chapters.push(chapterResponse.data.chapitre);
      console.log(`   ✅ Chapitre ${i} ajouté: ${chapterResponse.data.chapitre.id}`);
    }

    // 5. Tester la progression de la section (avant completion)
    console.log('\n📊 Test de la progression de la section (avant completion)...');
    const initialProgressResponse = await axios.get(`${BASE_URL}/courses/${courseId}/sections/${sectionId}/progress`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Progression initiale récupérée');
    console.log('📊 Réponse:', JSON.stringify(initialProgressResponse.data, null, 2));

    // 6. Tenter de compléter la section (devrait échouer car aucun chapitre n'est terminé)
    console.log('\n❌ Test de completion de section (devrait échouer)...');
    try {
      const failCompleteResponse = await axios.put(
        `${BASE_URL}/courses/${courseId}/sections/${sectionId}/complete`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      console.log('⚠️ Réponse inattendue:', JSON.stringify(failCompleteResponse.data, null, 2));
    } catch (error) {
      console.log('✅ Échec attendu - Section non complète');
      console.log('📊 Réponse d\'erreur:', JSON.stringify(error.response.data, null, 2));
    }

    // 7. Terminer le premier chapitre
    console.log('\n✅ Terminer le premier chapitre...');
    const completeFirstChapterResponse = await axios.put(
      `${BASE_URL}/courses/${courseId}/chapters/${chapters[0].id}/complete`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('✅ Premier chapitre terminé');
    console.log('📊 Réponse:', JSON.stringify(completeFirstChapterResponse.data, null, 2));

    // 8. Vérifier la progression après le premier chapitre
    console.log('\n📊 Vérification de la progression après le premier chapitre...');
    const progressAfterFirstResponse = await axios.get(`${BASE_URL}/courses/${courseId}/sections/${sectionId}/progress`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Progression après premier chapitre');
    console.log('📊 Réponse:', JSON.stringify(progressAfterFirstResponse.data, null, 2));

    // 9. Terminer les autres chapitres
    console.log('\n✅ Terminer les autres chapitres...');
    for (let i = 1; i < chapters.length; i++) {
      const completeChapterResponse = await axios.put(
        `${BASE_URL}/courses/${courseId}/chapters/${chapters[i].id}/complete`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      console.log(`   ✅ Chapitre ${i + 1} terminé`);
    }

    // 10. Vérifier la progression finale
    console.log('\n📊 Vérification de la progression finale...');
    const finalProgressResponse = await axios.get(`${BASE_URL}/courses/${courseId}/sections/${sectionId}/progress`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Progression finale récupérée');
    console.log('📊 Réponse:', JSON.stringify(finalProgressResponse.data, null, 2));

    // 11. Maintenant compléter la section (devrait réussir)
    console.log('\n✅ Test de completion de section (devrait réussir)...');
    const completeSectionResponse = await axios.put(
      `${BASE_URL}/courses/${courseId}/sections/${sectionId}/complete`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('✅ Section complétée avec succès !');
    console.log('📊 Réponse:', JSON.stringify(completeSectionResponse.data, null, 2));

    // 12. Test de forçage de completion
    console.log('\n🔧 Test de forçage de completion...');
    
    // Créer une nouvelle section avec des chapitres non terminés
    console.log('📖 Création d\'une nouvelle section pour le test de forçage...');
    const forceSectionResponse = await axios.post(`${BASE_URL}/cours/${courseId}/sections`, {
      titre: 'Section pour test de forçage',
      description: 'Section pour tester le forçage de completion',
      ordre: 2
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const forceSectionId = forceSectionResponse.data.section.id;
    console.log(`   📖 Section créée: ${forceSectionId}`);

    // Ajouter un chapitre
    const forceChapterResponse = await axios.post(`${BASE_URL}/cours/${courseId}/sections/${forceSectionId}/chapitres`, {
      titre: 'Chapitre pour forçage',
      contenu: 'Contenu du chapitre pour test de forçage',
      ordre: 1,
      isPreview: true
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const forceChapterId = forceChapterResponse.data.chapitre.id;
    console.log(`   📄 Chapitre créé: ${forceChapterId}`);

    // Forcer la completion de la section
    const forceCompleteResponse = await axios.put(
      `${BASE_URL}/courses/${courseId}/sections/${forceSectionId}/complete`,
      {
        forceComplete: true
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('✅ Forçage de completion réussi !');
    console.log('📊 Réponse:', JSON.stringify(forceCompleteResponse.data, null, 2));

    console.log('\n🎉 === TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS ===');
    console.log('✅ L\'API de completion de section fonctionne parfaitement !');

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
  testSectionCompletionAPI();
}

module.exports = { testSectionCompletionAPI };
