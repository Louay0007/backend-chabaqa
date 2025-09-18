const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    console.log('🔍 Vérification de la base de données...\n');
    
    await mongoose.connect('mongodb://localhost:27017/shabaka');
    console.log('✅ Connecté à MongoDB');
    
    const db = mongoose.connection.db;
    
    // Vérifier les collections
    const collections = await db.listCollections().toArray();
    console.log('\n📊 Collections disponibles:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Vérifier les utilisateurs
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    console.log(`\n👥 Utilisateurs (${users.length}):`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ID: ${user._id}`);
    });
    
    // Vérifier les codes de vérification
    const codesCollection = db.collection('verificationcodes');
    const codes = await codesCollection.find({}).toArray();
    console.log(`\n🔐 Codes de vérification (${codes.length}):`);
    codes.forEach(code => {
      console.log(`  - Email: ${code.email}, Code: ${code.code}, Utilisé: ${code.isUsed}, Expire: ${code.expiresAt}`);
    });
    
    // Vérifier les codes non utilisés pour l'email spécifique
    const testEmail = 'ghassen_zaouali@ieee.org';
    const validCodes = await codesCollection.find({
      email: testEmail,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).toArray();
    
    console.log(`\n🔍 Codes valides pour ${testEmail}:`);
    if (validCodes.length > 0) {
      validCodes.forEach(code => {
        console.log(`  - Code: ${code.code}, Expire: ${code.expiresAt}`);
      });
    } else {
      console.log('  ❌ Aucun code valide trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✨ Vérification terminée');
  }
}

checkDatabase(); 