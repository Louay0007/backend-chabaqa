const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3000';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODdiYTI4ODZmNGM5OGFhYTA0YTZjZTAiLCJlbWFpbCI6ImdoYXNzZW4uemFvdWFsaTIwMTlAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwianRpIjoiNjg3YmEyODg2ZjRjOThhYWEwNGE2Y2UwLWFjY2Vzcy0xNzUyOTMzNzg0MjAzIiwiaWF0IjoxNzUyOTMzNzg0LCJleHAiOjE3NTI5NDA5ODR9.N2zIBjkQgCJZhc9E4i10kAb50CQgMpebNwncW6xUII8';

// Headers communs
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${ADMIN_TOKEN}`
};

// Test Article
const testArticle = {
  titre: "Guide complet pour créer une communauté en ligne",
  description: "Ce guide détaillé vous accompagne dans toutes les étapes de création et développement d'une communauté en ligne prospère.",
  type: "Article",
  readTime: "12 min de lecture", 
  category: "Développement communautaire",
  thumbnailUrl: "https://example.com/thumbnails/guide-communaute.jpg",
  content: {
    elements: [
      {
        type: "text",
        content: "# Introduction\n\nCréer une communauté en ligne prospère est devenu essentiel.",
        title: "Introduction",
        order: 0
      },
      {
        type: "image",
        content: "https://example.com/images/communaute-active.jpg",
        alt: "Exemple de communauté active",
        caption: "Une communauté engagée favorise la croissance",
        order: 1
      }
    ],
    excerpt: "Découvrez comment construire une communauté engagée",
    tags: ["communauté", "stratégie"],
    seoMetadata: {
      metaTitle: "Guide complet - Créer une communauté",
      metaDescription: "Guide étape par étape pour créer une communauté"
    }
  },
  tags: ["communauté", "guide"],
  isPublished: true,
  isFeature: false,
  isPremium: false
};

// Test Video
const testVideo = {
  titre: "Masterclass : Stratégies de monétisation",
  description: "Une masterclass complète qui révèle les meilleures stratégies de monétisation pour les créateurs.",
  type: "Video",
  readTime: "45 min de visionnage",
  category: "Monétisation", 
  thumbnailUrl: "https://example.com/thumbnail.jpg",
  content: {
    videoUrl: "https://example.com/video.mp4",
    thumbnailUrl: "https://example.com/thumb.jpg",
    duration: 2700,
    quality: "1080p",
    description: [
      {
        type: "text",
        content: "À propos de cette masterclass...",
        title: "Description",
        order: 0
      }
    ],
    chapters: [
      "00:00 - Introduction",
      "15:45 - Strategies principales", 
      "35:10 - Plan d'action"
    ]
  },
  tags: ["monétisation", "business"],
  isPublished: true,
  isFeature: true,
  isPremium: true
};

// Test Guide  
const testGuide = {
  titre: "Guide pratique : Marketing de contenu",
  description: "Un guide step-by-step pour développer une stratégie de marketing de contenu efficace.",
  type: "Guide",
  readTime: "25 min de lecture",
  category: "Marketing",
  content: {
    sections: [
      {
        title: "Étape 1 : Définir votre stratégie",
        description: "Posez les bases solides",
        elements: [
          {
            type: "text", 
            content: "## Identifier vos objectifs\n\nDéfinissez clairement vos objectifs marketing.",
            title: "Objectifs",
            order: 0
          }
        ],
        order: 1
      }
    ],
    introduction: [
      {
        type: "text",
        content: "# Bienvenue dans ce guide marketing",
        title: "Introduction",
        order: 0
      }
    ]
  },
  tags: ["marketing", "guide"],
  isPublished: true
};

// Fonction de test
async function testResourceCreation(resourceData, typeName) {
  try {
    console.log(`\n🧪 Test création ${typeName}...`);
    
    const response = await axios.post(`${API_BASE}/resources/create`, resourceData, { headers });
    
    console.log(`✅ ${typeName} créé avec succès !`);
    console.log(`📋 ID: ${response.data._id}`);
    console.log(`📋 Slug: ${response.data.slug}`);
    console.log(`📋 Titre: ${response.data.titre}`);
    
    return response.data;
    
  } catch (error) {
    console.log(`❌ Erreur lors de la création du ${typeName}:`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Message:`, error.response.data.message);
      console.log(`Erreurs:`, error.response.data);
    } else {
      console.log(`Erreur réseau:`, error.message);
    }
    return null;
  }
}

// Exécution des tests
async function runAllTests() {
  console.log('🚀 Début des tests de création de ressources\n');
  
  // Test Article
  await testResourceCreation(testArticle, 'Article');
  
  // Test Video
  await testResourceCreation(testVideo, 'Video');
  
  // Test Guide  
  await testResourceCreation(testGuide, 'Guide');
  
  console.log('\n✨ Tests terminés !');
}

// Lancer les tests
runAllTests().catch(console.error); 