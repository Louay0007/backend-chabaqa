const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODYzZWI4Y2UyYzlmMDA0Zjg2NDg5NTAiLCJlbWFpbCI6ImdoYXNzZW5femFvdWFsaUBpZWVlLm9yZyIsInJvbGUiOiJ1c2VyIiwianRpIjoiNjg2M2ViOGNlMmM5ZjAwNGY4NjQ4OTUwLWFjY2Vzcy0xNzUzNzEzMzA3NDQ0IiwiaWF0IjoxNzUzNzEzMzA3LCJleHAiOjE3NTM3Mjc3MDd9.hzO4ahbogl8BRc49p9Ka1RJDDHFZMWoH6LJemdf6RgQ';

async function testNouvelleStructure() {
  console.log('🚀 Test de la NOUVELLE structure Cours → Sections → Chapitres');
  console.log('==========================================================');

  try {
    const coursData = {
      "titre": "JavaScript Moderne et Complet",
      "description": "Un cours complet pour maîtriser JavaScript moderne avec ES6+, asynchrone, et les bonnes pratiques",
      "thumbnail": "https://example.com/js-course.jpg",
      "prix": 79.99,
      "isPaid": true,
      "devise": "EUR",
      "communitySlug": "digital-marketing-masters",
      "isPublished": true,
      "category": "Programmation",
      "niveau": "intermédiaire",
      "duree": "18h 45min",
      "learningObjectives": [
        "Maîtriser ES6+ et les nouvelles fonctionnalités JavaScript",
        "Comprendre la programmation asynchrone (Promises, async/await)",
        "Créer des applications JavaScript modernes et performantes"
      ],
      "requirements": [
        "Bases en HTML et CSS",
        "Notions de programmation (variables, fonctions, boucles)"
      ],
      "notes": "Ce cours inclut des exercices pratiques et des projets réels",
      "sections": [
        {
          "titre": "Introduction et Fondamentaux",
          "description": "Découverte de JavaScript moderne et mise en place de l'environnement",
          "ordre": 1,
          "chapitres": [
            {
              "titre": "Bienvenue dans JavaScript Moderne",
              "description": "Présentation du cours, des objectifs et de la roadmap d'apprentissage",
              "videoUrl": "https://example.com/videos/welcome-js.mp4",
              "isPaid": false,
              "ordre": 1,
                             "duree": "08:30"
            },
            {
              "titre": "ES6+ : Les Nouvelles Fonctionnalités",
              "description": "Exploration des fonctionnalités modernes : let/const, arrow functions, destructuring, spread operator",
              "videoUrl": "https://example.com/videos/es6-features.mp4",
              "isPaid": true,
              "ordre": 2,
              "duree": "25:15"
            },
            {
              "titre": "Template Literals et Classes",
              "description": "Utilisation des template literals et introduction aux classes ES6",
              "videoUrl": "https://example.com/videos/templates-classes.mp4",
              "isPaid": true,
              "ordre": 3,
              "duree": "18:45"
            }
          ]
        },
        {
          "titre": "Programmation Asynchrone",
          "description": "Maîtrise complète de l'asynchrone en JavaScript",
          "ordre": 2,
          "chapitres": [
            {
              "titre": "Callbacks et leurs limites",
              "description": "Comprendre les callbacks et pourquoi ils posent problème (callback hell)",
              "videoUrl": "https://example.com/videos/callbacks.mp4",
              "isPaid": true,
              "ordre": 1,
              "duree": "22:30"
            },
            {
              "titre": "Promises : La solution moderne",
              "description": "Créer, utiliser et chaîner des Promises pour gérer l'asynchrone proprement",
              "videoUrl": "https://example.com/videos/promises.mp4",
              "isPaid": true,
              "ordre": 2,
                             "duree": "35:20"
            },
            {
              "titre": "Async/Await : Simplifier le code asynchrone",
              "description": "Syntaxe moderne avec async/await pour écrire du code asynchrone lisible",
              "videoUrl": "https://example.com/videos/async-await.mp4",
              "isPaid": true,
              "ordre": 3,
              "duree": "28:10"
            }
          ]
        },
        {
          "titre": "Projets Pratiques",
          "description": "Application des connaissances avec des projets concrets",
          "ordre": 3,
          "chapitres": [
            {
              "titre": "Projet 1: API Weather App",
              "description": "Créer une application météo en utilisant les APIs et les Promises",
              "videoUrl": "https://example.com/videos/weather-app.mp4",
              "isPaid": true,
              "ordre": 1,
                             "duree": "45:30"
            },
            {
              "titre": "Projet 2: Todo App avec LocalStorage",
              "description": "Application de gestion de tâches avec persistance des données",
              "videoUrl": "https://example.com/videos/todo-app.mp4",
              "isPaid": true,
              "ordre": 2,
              "duree": "52:15"
            }
          ]
        }
      ]
    };

    console.log('📋 Structure à créer:');
    console.log(`   📚 Cours: "${coursData.titre}"`);
    coursData.sections.forEach((section, index) => {
      console.log(`   📁 Section ${index + 1}: "${section.titre}" (${section.chapitres.length} chapitres)`);
      section.chapitres.forEach((chapitre, chIndex) => {
        const paidIcon = chapitre.isPaid ? '💰' : '🆓';
        console.log(`      📄 ${chIndex + 1}. "${chapitre.titre}" ${paidIcon} (${chapitre.duree})`);
      });
    });

    console.log('');
    console.log('📤 Envoi de la requête de création...');

    const response = await axios.post(
      `${BASE_URL}/cours/create-cours`,
      coursData,
      {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('');
    console.log('🎉 SUCCÈS ! Cours créé avec structure complète:');
    console.log('===============================================');
    console.log(`📚 ID du cours: ${response.data.cours.id}`);
    console.log(`📚 Titre: ${response.data.cours.titre}`);
    console.log(`💰 Prix: ${response.data.cours.prix} ${response.data.cours.devise}`);
    console.log(`📊 Publié: ${response.data.cours.isPublished ? 'Oui' : 'Non'}`);
    console.log(`🏠 Communauté: ${response.data.cours.communitySlug}`);
    console.log('');

    // Vérifier la structure créée
    console.log('📋 Structure créée:');
    if (response.data.cours.sections && response.data.cours.sections.length > 0) {
      response.data.cours.sections.forEach((section, index) => {
        console.log(`📁 Section ${index + 1}: "${section.titre}"`);
        console.log(`   📝 Description: ${section.description || 'Aucune'}`);
        console.log(`   🔢 Ordre: ${section.ordre}`);
        console.log(`   📄 Chapitres: ${section.chapitres?.length || 0}`);
        
        if (section.chapitres && section.chapitres.length > 0) {
          section.chapitres.forEach((chapitre, chIndex) => {
            const paidIcon = chapitre.isPaid ? '💰' : '🆓';
            console.log(`      ${chIndex + 1}. "${chapitre.titre}" ${paidIcon}`);
            console.log(`         ⏱️  Durée: ${chapitre.duree || 'N/A'}`);
            console.log(`         🎥 Vidéo: ${chapitre.videoUrl ? 'Oui' : 'Non'}`);
          });
        } else {
          console.log('      ⚠️  AUCUN chapitre dans cette section !');
        }
        console.log('');
      });
    } else {
      console.log('❌ AUCUNE section créée !');
    }

    console.log('✅ Test terminé avec succès !');
    console.log('🔍 Vérifiez les logs du serveur pour les détails de création');

  } catch (error) {
    console.log('❌ ERREUR lors de la création:');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message}`);
    
    if (error.response?.data?.message && Array.isArray(error.response.data.message)) {
      console.log('   📋 Détails de validation:');
      error.response.data.message.forEach(msg => console.log(`      • ${msg}`));
    }
    
    console.log('');
    console.log('🔍 Vérifiez les logs du serveur pour plus de détails');
  }
}

testNouvelleStructure(); 