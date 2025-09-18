const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODYzZWI4Y2UyYzlmMDA0Zjg2NDg5NTAiLCJlbWFpbCI6ImdoYXNzZW5femFvdWFsaUBpZWVlLm9yZyIsInJvbGUiOiJ1c2VyIiwianRpIjoiNjg2M2ViOGNlMmM5ZjAwNGY4NjQ4OTUwLWFjY2Vzcy0xNzUzNzEzMzA3NDQ0IiwiaWF0IjoxNzUzNzEzMzA3LCJleHAiOjE3NTM3Mjc3MDd9.hzO4ahbogl8BRc49p9Ka1RJDDHFZMWoH6LJemdf6RgQ';

async function testCoursAvecSections() {
  console.log('🧪 Test API create-cours avec SECTIONS multiples');
  console.log('=====================================');

  try {
    // TEST 1: Nouveau format avec SECTIONS multiples
    console.log('📚 TEST 1: Nouveau format avec sections multiples');
    
    const coursAvecSections = {
      titre: `Cours Complet JS ${Date.now()}`,
      description: 'Un cours JavaScript complet avec plusieurs sections organisées',
      prix: 49.99,
      isPaid: true,
      communitySlug: 'digital-marketing-masters',
      communityId: '6863eb8ce2c9f004f8648950', // Requis par le DTO
      isPublished: true,
      category: 'Programmation',
      niveau: 'intermédiaire',
      sections: [
        {
          titre: 'Introduction et Bases',
          description: 'Les fondamentaux de JavaScript',
          ordre: 0,
          chapitres: [
            {
              titre: 'Qu\'est-ce que JavaScript ?',
              description: 'Introduction au langage JavaScript et ses possibilités',
              videoUrl: 'https://example.com/intro-js.mp4',
              isPaid: false, // Gratuit
              ordre: 1,
              duree: '15:30'
            },
            {
              titre: 'Variables et Types de données',
              description: 'Comprendre les variables, let, const, et les types de données',
              videoUrl: 'https://example.com/variables.mp4',
              isPaid: true, // Payant
              ordre: 2,
              duree: '22:15'
            }
          ]
        },
        {
          titre: 'Programmation Avancée',
          description: 'Concepts avancés et patterns JavaScript',
          ordre: 1,
          chapitres: [
            {
              titre: 'Fonctions et Closures',
              description: 'Maîtriser les fonctions, arrow functions, et closures',
              videoUrl: 'https://example.com/functions.mp4',
              isPaid: true,
              ordre: 1,
              duree: '35:20'
            },
            {
              titre: 'Promises et Async/Await',
              description: 'Programmation asynchrone moderne en JavaScript',
              videoUrl: 'https://example.com/async.mp4',
              isPaid: true,
              ordre: 2,
              duree: '40:10'
            }
          ]
        },
        {
          titre: 'Projets Pratiques',
          description: 'Mise en pratique avec des projets concrets',
          ordre: 2,
          chapitres: [
            {
              titre: 'Projet 1: Todo App',
              description: 'Créer une application de gestion de tâches',
              videoUrl: 'https://example.com/todo-app.mp4',
              isPaid: true,
              ordre: 1,
              duree: '60:45'
            }
          ]
        }
      ]
    };

    console.log('📤 Envoi du cours avec sections...');
    
    const response1 = await axios.post(
      `${BASE_URL}/cours/create-cours`,
      coursAvecSections,
      {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ SUCCÈS! Cours avec sections créé:');
    console.log('   ID:', response1.data.cours.id);
    console.log('   Titre:', response1.data.cours.titre);
    console.log('   Sections:', response1.data.cours.sections?.length || 0);
    console.log('   Total chapitres:', response1.data.cours.chapitres?.length || 0);
    
    // Afficher la structure détaillée
    if (response1.data.cours.sections) {
      response1.data.cours.sections.forEach((section, index) => {
        console.log(`   📁 Section ${index + 1} : "${section.titre}" (${section.chapitres?.length || 0} chapitres)`);
        section.chapitres?.forEach((chapitre, chapIndex) => {
          console.log(`      📄 Chapitre ${chapIndex + 1} : "${chapitre.titre}" ${chapitre.isPaid ? '💰' : '🆓'}`);
        });
      });
    }

    console.log('');

    // TEST 2: Ancien format pour rétrocompatibilité
    console.log('📚 TEST 2: Format ancien (rétrocompatibilité) avec chapitres directs');
    
    const coursCompatibilite = {
      titre: `Cours Simple ${Date.now()}`,
      description: 'Un cours avec l\'ancien format de chapitres directs',
      prix: 0,
      isPaid: false,
      communitySlug: 'digital-marketing-masters',
      communityId: 'digital-marketing-masters', // Requis par le DTO
      isPublished: false,
      chapitres: [ // Ancien format
        {
          titre: 'Introduction',
          description: 'Chapitre d\'introduction',
          videoUrl: 'https://example.com/intro.mp4',
          isPaid: false,
          ordre: 1,
          duree: '10:00'
        },
        {
          titre: 'Conclusion',
          description: 'Chapitre de conclusion',
          videoUrl: 'https://example.com/conclusion.mp4',
          isPaid: false,
          ordre: 2,
          duree: '5:30'
        }
      ]
    };

    console.log('📤 Envoi du cours avec chapitres directs...');

    const response2 = await axios.post(
      `${BASE_URL}/cours/create-cours`,
      coursCompatibilite,
      {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ SUCCÈS! Cours rétrocompatible créé:');
    console.log('   ID:', response2.data.cours.id);
    console.log('   Titre:', response2.data.cours.titre);
    console.log('   Sections:', response2.data.cours.sections?.length || 0);
    console.log('   Total chapitres:', response2.data.cours.chapitres?.length || 0);

    if (response2.data.cours.sections) {
      response2.data.cours.sections.forEach((section, index) => {
        console.log(`   📁 Section ${index + 1} : "${section.titre}" (${section.chapitres?.length || 0} chapitres)`);
      });
    }

    console.log('');
    console.log('🎉 Tous les tests réussis ! Les deux formats fonctionnent.');

  } catch (error) {
    console.log('❌ ERREUR:');
    console.log('   Status:', error.response?.status);
    console.log('   Message:', error.response?.data?.message);
    
    if (error.response?.data?.message && Array.isArray(error.response.data.message)) {
      console.log('   Détails de validation:');
      error.response.data.message.forEach(msg => console.log(`     - ${msg}`));
    }
  }
}

testCoursAvecSections(); 