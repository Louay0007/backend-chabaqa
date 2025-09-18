// Script pour corriger le problème d'index inviteCode
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shabaka_db';

async function fixInviteCodeIndex() {
  console.log('🔧 Correction de l\'index inviteCode...');
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db();
    
    // Découvrir les collections existantes
    console.log('\n🔍 Collections disponibles:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    const collection = db.collection('communities');
    
    // 1. Lister les index existants
    console.log('\n📋 Index existants:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // 2. Supprimer l'index problématique inviteCode_1
    try {
      console.log('\n🗑️  Suppression de l\'index inviteCode_1...');
      await collection.dropIndex('inviteCode_1');
      console.log('✅ Index inviteCode_1 supprimé');
    } catch (error) {
      console.log('⚠️  Index inviteCode_1 n\'existe pas ou déjà supprimé');
    }
    
    // 3. Mettre à jour tous les documents avec inviteCode: null
    console.log('\n🔄 Génération d\'inviteCodes uniques...');
    
    const documentsWithNullInviteCode = await collection.find({ 
      $or: [
        { inviteCode: null }, 
        { inviteCode: { $exists: false } }
      ] 
    }).toArray();
    
    console.log(`   📊 Documents à corriger: ${documentsWithNullInviteCode.length}`);
    
    for (let doc of documentsWithNullInviteCode) {
      // Générer un inviteCode unique
      const inviteCode = generateInviteCode();
      
      await collection.updateOne(
        { _id: doc._id },
        { $set: { inviteCode: inviteCode } }
      );
      
      console.log(`   ✅ ${doc.name}: inviteCode = ${inviteCode}`);
    }
    
    // 4. Recréer l'index comme sparse (permet plusieurs null mais on n'en aura plus)
    console.log('\n🏗️  Recréation de l\'index inviteCode...');
    await collection.createIndex(
      { inviteCode: 1 }, 
      { 
        unique: true, 
        sparse: true,
        name: 'inviteCode_1'
      }
    );
    console.log('✅ Index inviteCode recréé avec succès');
    
    console.log('\n🎉 Correction terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('📝 Connexion MongoDB fermée');
  }
}

// Fonction pour générer un inviteCode unique
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Lancer le script
fixInviteCodeIndex(); 