const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'ghassen_zaouali@ieee.org';

// Connexion à MongoDB
async function connectToMongo() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shabaka');
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
  }
}

// Récupérer le code de vérification depuis la base de données
async function getVerificationCode() {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('verificationcodes');
    
    const codeDoc = await collection.findOne({
      email: TEST_EMAIL,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (codeDoc) {
      console.log('✅ Code de vérification trouvé:', codeDoc.code);
      return codeDoc.code;
    } else {
      console.log('❌ Aucun code de vérification valide trouvé');
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du code:', error.message);
    return null;
  }
}

// Test de réinitialisation avec le vrai code
async function testResetWithRealCode(verificationCode) {
  try {
    console.log('\n🧪 Test de réinitialisation avec le vrai code');
    console.log(`🔐 Code utilisé: ${verificationCode}`);
    
    const response = await axios.post(`${BASE_URL}/user/reset-password`, {
      email: TEST_EMAIL,
      verificationCode: verificationCode,
      newPassword: 'nouveauMotDePasse123'
    });
    
    console.log('✅ Réponse:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    return null;
  }
}

// Exécuter le test complet
async function runTest() {
  console.log('🚀 Test de réinitialisation avec code réel\n');
  
  await connectToMongo();
  
  // D'abord, demander un nouveau code
  console.log('📧 Demande d\'un nouveau code de vérification...');
  try {
    await axios.post(`${BASE_URL}/user/forgot-password`, {
      email: TEST_EMAIL
    });
    console.log('✅ Demande envoyée');
  } catch (error) {
    console.error('❌ Erreur lors de la demande:', error.response?.data || error.message);
    return;
  }
  
  // Attendre un peu pour que le code soit généré
  console.log('⏳ Attente de 2 secondes...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Récupérer le code depuis la base de données
  const code = await getVerificationCode();
  
  if (code) {
    // Tester la réinitialisation
    await testResetWithRealCode(code);
  } else {
    console.log('❌ Impossible de continuer sans code de vérification');
  }
  
  // Fermer la connexion MongoDB
  await mongoose.connection.close();
  console.log('\n✨ Test terminé');
}

runTest(); 