const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODYzZWI4Y2UyYzlmMDA0Zjg2NDg5NTAiLCJlbWFpbCI6ImdoYXNzZW5femFvdWFsaUBpZWVlLm9yZyIsInJvbGUiOiJ1c2VyIiwianRpIjoiNjg2M2ViOGNlMmM5ZjAwNGY4NjQ4OTUwLWFjY2Vzcy0xNzUzNzEzMzA3NDQ0IiwiaWF0IjoxNzUzNzEzMzA3LCJleHAiOjE3NTM3Mjc3MDd9.hzO4ahbogl8BRc49p9Ka1RJDDHFZMWoH6LJemdf6RgQ';

async function testChapitresVides() {
  console.log('🔍 Debug: Problème chapitres vides');
  console.log('===================================');

  try {
    // JSON EXACT fourni par l'utilisateur
    const coursData = {
      "titre": "Debug Chapitres Vides Test",
      "description": "Un cours complet pour apprendre Node.js, Express, MongoDB et plus encore.",
      "thumbnail": "https://example.com/images/nodejs-thumbnail.jpg",
      "coverImage": "https://example.com/images/nodejs-cover.jpg",
      "prix": 49.99,
      "isPaid": true,
      "devise": "EUR",
      "communitySlug": "digital-marketing-masters",
      "communityId": "68878b4b55d0e71fb8ebd9e0",
      "isPublished": true,
      "category": "Programmation",
      "duree": "12h 30min",
      "learningObjectives": [
        "Comprendre les fondamentaux de Node.js",
        "Créer des API REST avec Express",
        "Gérer les bases de données avec MongoDB"
      ],
      "requirements": [
        "Avoir des bases en JavaScript",
        "Connaître HTML et CSS"
      ],
      "notes": "Ce cours inclut des ressources à télécharger.",
      "sections": [
        {
          "titre": "Introduction",
          "description": "Présentation du cours et de l'environnement Node.js",
          "ordre": 1,
          "chapitres": [
            {
              "titre": "Bienvenue dans le cours",
              "description": "Introduction générale et objectifs du cours",
              "videoUrl": "https://example.com/videos/welcome.mp4",
              "isPaid": false,
              "ordre": 1,
              "duree": "05:00"
            },
            {
              "titre": "Installation de Node.js",
              "description": "Comment installer Node.js et npm sur votre machine",
              "videoUrl": "https://example.com/videos/install-node.mp4",
              "isPaid": false,
              "ordre": 2,
              "duree": "08:30"
            }
          ]
        },
        {
          "titre": "Création d'un serveur",
          "ordre": 2,
          "chapitres": [
            {
              "titre": "Premier serveur HTTP",
              "description": "Écrire un serveur avec le module HTTP natif",
              "videoUrl": "https://example.com/videos/http-server.mp4",
              "isPaid": true,
              "ordre": 1,
              "duree": "12:00"
            }
          ]
        }
      ],
      "chapitres": [  // Rétrocompatibilité
        {
          "titre": "Chapitre bonus : Déploiement",
          "description": "Déployer votre application sur un serveur",
          "videoUrl": "https://example.com/videos/deployment.mp4",
          "isPaid": true,
          "ordre": 99,
          "duree": "20:45"
        }
      ]
    };

    console.log('📤 Envoi du cours (regardez les logs du serveur pour les détails de debug)...');
    console.log('📋 Données sections:');
    coursData.sections.forEach((section, index) => {
      console.log(`   Section ${index + 1}: "${section.titre}" (${section.chapitres.length} chapitres)`);
      section.chapitres.forEach((chapitre, chIndex) => {
        console.log(`      Chapitre ${chIndex + 1}: "${chapitre.titre}"`);
      });
    });

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
    console.log('✅ SUCCÈS! Cours créé:');
    console.log('   ID:', response.data.cours.id);
    console.log('   Titre:', response.data.cours.titre);
    console.log('   Sections créées:', response.data.cours.sections?.length || 0);
    
    // Vérifier si les chapitres sont présents dans la réponse
    if (response.data.cours.sections) {
      response.data.cours.sections.forEach((section, index) => {
        console.log(`   📁 Section ${index + 1}: "${section.titre}"`);
        console.log(`      → Chapitres dans cette section: ${section.chapitres?.length || 0}`);
        
        if (section.chapitres && section.chapitres.length > 0) {
          section.chapitres.forEach((chapitre, chIndex) => {
            console.log(`         📄 Chapitre ${chIndex + 1}: "${chapitre.titre}"`);
          });
        } else {
          console.log(`         ⚠️  AUCUN chapitre dans cette section (PROBLÈME !)`);
        }
      });
    }

    console.log('');
    console.log('🔍 VÉRIFIEZ LES LOGS DU SERVEUR pour voir les détails du processus de création!');

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

testChapitresVides(); 