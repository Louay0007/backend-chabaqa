const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Configuration des tests
const testConfig = {
  testUser: {
    name: 'Test User Ranking',
    email: 'testranking@example.com',
    password: 'testPassword123'
  },
  
  // Plusieurs communautés pour tester le classement
  testCommunities: [
    {
      name: 'JavaScript Developers Community',
      logo: 'https://via.placeholder.com/300x300/F7DF1E/000000?text=JS',
      photo_de_couverture: 'https://via.placeholder.com/1200x400/F7DF1E/000000?text=JAVASCRIPT',
      short_description: 'Communauté pour les développeurs JavaScript passionnés.'
    },
    {
      name: 'Python Developers Hub',
      logo: 'https://via.placeholder.com/300x300/3776AB/FFFFFF?text=PY',
      photo_de_couverture: 'https://via.placeholder.com/1200x400/3776AB/FFFFFF?text=PYTHON',
      short_description: 'Hub pour les développeurs Python expérimentés.'
    },
    {
      name: 'React Native Community',
      logo: 'https://via.placeholder.com/300x300/61DAFB/000000?text=RN',
      photo_de_couverture: 'https://via.placeholder.com/1200x400/61DAFB/000000?text=REACT',
      short_description: 'Communauté dédiée au développement React Native.'
    }
  ]
};

let authToken = null;
let createdCommunities = [];

/**
 * Connexion utilisateur
 */
async function loginUser() {
  try {
    console.log('🔄 Tentative de connexion...');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testConfig.testUser.email,
      password: testConfig.testUser.password
    });
    
    if (response.data.success) {
      authToken = response.data.data.access_token;
      console.log('✅ Connexion réussie');
      return response.data.data.user;
    } else {
      throw new Error('Échec de la connexion');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Créer plusieurs communautés pour tester le classement
 */
async function createTestCommunities() {
  console.log('\n🏗️ Création de communautés de test...');
  
  for (let i = 0; i < testConfig.testCommunities.length; i++) {
    const communityData = testConfig.testCommunities[i];
    
    try {
      console.log(`🔄 Création de "${communityData.name}"...`);
      
      const response = await axios.post(
        `${BASE_URL}/community-aff-crea-join/create`,
        communityData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        const community = response.data.data;
        createdCommunities.push(community);
        console.log(`✅ "${community.name}" créée (ID: ${community._id})`);
        console.log(`   - Membres: ${community.membersCount}`);
        console.log(`   - Rang initial: ${community.rank}`);
      }
      
    } catch (error) {
      if (error.response?.data?.message?.includes('existe déjà')) {
        console.log(`ℹ️ "${communityData.name}" existe déjà`);
      } else {
        console.error(`❌ Erreur lors de la création de "${communityData.name}":`, error.response?.data || error.message);
      }
    }
  }
  
  console.log(`📊 ${createdCommunities.length} communautés créées avec succès`);
}

/**
 * Simuler l'ajout de membres à différentes communautés
 * (En réalité, cela nécessiterait une API pour ajouter des membres)
 */
async function simulateAddingMembers() {
  console.log('\n👥 Simulation d\'ajout de membres...');
  
  // Pour la démo, on va directement modifier les membres dans la base de données
  // via une API ou script séparé. Ici on simule juste l'affichage
  
  const memberCounts = [25, 50, 10]; // Nombres de membres simulés
  
  for (let i = 0; i < createdCommunities.length && i < memberCounts.length; i++) {
    const community = createdCommunities[i];
    const memberCount = memberCounts[i];
    
    console.log(`📈 "${community.name}" aura ${memberCount} membres`);
    
    // Note: Dans un vrai scénario, vous utiliseriez une API pour ajouter des membres
    // await addMembersToCommunity(community._id, memberCount);
  }
  
  console.log('ℹ️ Note: Cette simulation montre le concept. En production, utilisez l\'API d\'ajout de membres.');
}

/**
 * Forcer la mise à jour des rangs
 */
async function updateRanks() {
  try {
    console.log('\n🔄 Mise à jour des rangs...');
    
    const response = await axios.post(
      `${BASE_URL}/community-aff-crea-join/update-ranks`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Rangs mis à jour avec succès');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des rangs:', error.response?.data || error.message);
  }
}

/**
 * Obtenir le classement des communautés
 */
async function getCommunityRanking() {
  try {
    console.log('\n🏆 Récupération du classement...');
    
    const response = await axios.get(
      `${BASE_URL}/community-aff-crea-join/ranking`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (response.data.success) {
      const ranking = response.data.data;
      console.log('✅ Classement récupéré avec succès:\n');
      
      console.log('🏆 CLASSEMENT DES COMMUNAUTÉS:');
      console.log('─────────────────────────────────────');
      
      ranking.forEach((community, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
        console.log(`${medal} Rang ${community.rank}: ${community.name}`);
        console.log(`   📊 Membres: ${community.membersCount}`);
        console.log(`   👤 Créateur: ${community.createur.name}`);
        console.log(`   📅 Créé le: ${new Date(community.createdAt).toLocaleDateString()}`);
        console.log('');
      });
      
      return ranking;
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du classement:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Tester le système de classement complet
 */
async function testRankingSystem() {
  try {
    console.log('🚀 Test du système de classement des communautés\n');
    
    // 1. Se connecter
    await loginUser();
    
    // 2. Créer plusieurs communautés
    await createTestCommunities();
    
    // 3. Simuler l'ajout de membres
    await simulateAddingMembers();
    
    // 4. Mettre à jour les rangs
    await updateRanks();
    
    // 5. Afficher le classement
    await getCommunityRanking();
    
    console.log('\n✅ Test du système de classement terminé avec succès!');
    
  } catch (error) {
    console.error('\n❌ Erreur lors du test du système de classement:', error.message);
    throw error;
  }
}

/**
 * Tester uniquement le classement (sans créer de nouvelles communautés)
 */
async function testRankingOnly() {
  try {
    console.log('🔍 Test du classement uniquement...\n');
    
    await loginUser();
    await updateRanks();
    await getCommunityRanking();
    
    console.log('\n✅ Test du classement terminé!');
    
  } catch (error) {
    console.error('\n❌ Erreur lors du test du classement:', error.message);
    throw error;
  }
}

/**
 * Afficher des informations sur le système de classement
 */
function showRankingInfo() {
  console.log('📚 SYSTÈME DE CLASSEMENT DES COMMUNAUTÉS');
  console.log('═══════════════════════════════════════');
  console.log('🎯 Le rang est basé sur le nombre de membres:');
  console.log('   • Rang 1 = Communauté avec le plus de membres');
  console.log('   • Rang 2 = Communauté avec le 2ème plus de membres');
  console.log('   • etc...');
  console.log('');
  console.log('🔄 Mise à jour automatique:');
  console.log('   • Les rangs sont recalculés automatiquement');
  console.log('   • À chaque création de communauté');
  console.log('   • Peut être forcée via l\'API /update-ranks');
  console.log('');
  console.log('📊 APIs disponibles:');
  console.log('   • GET /community-aff-crea-join/ranking');
  console.log('   • POST /community-aff-crea-join/update-ranks');
  console.log('');
}

// Exécution des tests
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--info')) {
    showRankingInfo();
  } else if (args.includes('--ranking-only')) {
    testRankingOnly()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    testRankingSystem()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = {
  loginUser,
  createTestCommunities,
  updateRanks,
  getCommunityRanking,
  testRankingSystem,
  testRankingOnly,
  showRankingInfo
}; 