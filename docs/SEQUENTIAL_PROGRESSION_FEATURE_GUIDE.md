# Guide de la Fonctionnalité de Progression Séquentielle

## 🎯 Vue d'ensemble

La fonctionnalité de **progression séquentielle** permet aux créateurs de cours et de défis d'activer un mode où les utilisateurs doivent compléter le contenu précédent avant d'accéder au suivant. Cette fonctionnalité améliore l'engagement et garantit une progression logique dans l'apprentissage.

## ✨ Fonctionnalités

### Pour les Cours
- **Activation/Désactivation** : Les créateurs peuvent activer ou désactiver la progression séquentielle
- **Message personnalisé** : Message affiché quand un chapitre est verrouillé
- **Vérification d'accès** : Contrôle automatique de l'accès aux chapitres
- **Déverrouillage manuel** : Les créateurs peuvent déverrouiller manuellement des chapitres pour des utilisateurs spécifiques

### Pour les Défis
- **Activation/Désactivation** : Les créateurs peuvent activer ou désactiver la progression séquentielle
- **Message personnalisé** : Message affiché quand une tâche est verrouillée
- **Vérification d'accès** : Contrôle automatique de l'accès aux tâches
- **Déverrouillage manuel** : Les créateurs peuvent déverrouiller manuellement des tâches pour des utilisateurs spécifiques

## 🏗️ Architecture Technique

### Schémas de Base de Données

#### Course Schema
```typescript
interface Course {
  // ... autres propriétés
  sequentialProgression: boolean;        // Progression séquentielle activée
  unlockMessage?: string;                // Message personnalisé de déverrouillage
}
```

#### Challenge Schema
```typescript
interface Challenge {
  // ... autres propriétés
  sequentialProgression: boolean;        // Progression séquentielle activée
  unlockMessage?: string;                // Message personnalisé de déverrouillage
}
```

### Méthodes du Schéma

#### Course Schema Methods
- `activerProgressionSequentielle(message?: string)` : Active la progression séquentielle
- `desactiverProgressionSequentielle()` : Désactive la progression séquentielle
- `obtenirChapitrePrecedent(chapitreId: string)` : Obtient le chapitre précédent
- `obtenirChapitreSuivant(chapitreId: string)` : Obtient le chapitre suivant
- `verifierAccesChapitre(chapitreId: string, progression: CourseProgress[])` : Vérifie l'accès à un chapitre

#### Challenge Schema Methods
- `activerProgressionSequentielle(message?: string)` : Active la progression séquentielle
- `desactiverProgressionSequentielle()` : Désactive la progression séquentielle
- `obtenirTachePrecedente(taskId: string)` : Obtient la tâche précédente
- `obtenirTacheSuivante(taskId: string)` : Obtient la tâche suivante
- `verifierAccesTache(taskId: string, completedTasks: string[])` : Vérifie l'accès à une tâche

## 🚀 API Endpoints

### Cours - Progression Séquentielle

#### 1. Activer/Désactiver la Progression Séquentielle
```http
PATCH /cours/:id/sequential-progression
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": true,
  "unlockMessage": "Complétez le chapitre précédent pour débloquer ce contenu"
}
```

**Réponse :**
```json
{
  "id": "course-id",
  "titre": "Mon Cours",
  "sequentialProgression": true,
  "unlockMessage": "Complétez le chapitre précédent pour débloquer ce contenu",
  // ... autres propriétés du cours
}
```

#### 2. Vérifier l'Accès à un Chapitre
```http
GET /cours/:id/chapters/:chapterId/access
Authorization: Bearer <token>
```

**Réponse :**
```json
{
  "hasAccess": false,
  "reason": "previous_not_completed",
  "requiredChapter": {
    "id": "chapter-id",
    "titre": "Chapitre Précédent",
    "ordre": 1,
    "sectionId": "section-id"
  },
  "unlockMessage": "Complétez le chapitre précédent pour débloquer ce contenu",
  "nextChapter": {
    "id": "next-chapter-id",
    "titre": "Chapitre Suivant",
    "ordre": 3,
    "sectionId": "section-id"
  }
}
```

#### 3. Obtenir les Chapitres Déverrouillés
```http
GET /cours/:id/unlocked-chapters
Authorization: Bearer <token>
```

**Réponse :**
```json
{
  "unlockedChapters": [
    {
      "id": "chapter-1",
      "titre": "Introduction",
      "ordre": 1,
      "sectionId": "section-1",
      "sectionTitre": "Section 1",
      "isCompleted": true,
      "isUnlocked": true
    },
    {
      "id": "chapter-2",
      "titre": "Concepts de Base",
      "ordre": 2,
      "sectionId": "section-1",
      "sectionTitre": "Section 1",
      "isCompleted": false,
      "isUnlocked": true
    }
  ],
  "sequentialProgressionEnabled": true,
  "unlockMessage": "Complétez le chapitre précédent pour débloquer ce contenu"
}
```

#### 4. Déverrouiller Manuellement un Chapitre
```http
POST /cours/:id/chapters/:chapterId/unlock
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-id"
}
```

**Réponse :**
```json
{
  "message": "Chapitre déverrouillé avec succès"
}
```

### Défis - Progression Séquentielle

#### 1. Activer/Désactiver la Progression Séquentielle
```http
PATCH /challenges/:id/sequential-progression
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": true,
  "unlockMessage": "Complétez la tâche précédente pour débloquer cette étape"
}
```

#### 2. Vérifier l'Accès à une Tâche
```http
GET /challenges/:id/tasks/:taskId/access
Authorization: Bearer <token>
```

#### 3. Obtenir les Tâches Déverrouillées
```http
GET /challenges/:id/unlocked-tasks
Authorization: Bearer <token>
```

#### 4. Déverrouiller Manuellement une Tâche
```http
POST /challenges/:id/tasks/:taskId/unlock
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-id"
}
```

#### 5. Mettre à Jour le Progrès avec Vérification Séquentielle
```http
PATCH /challenges/progress/sequential
Authorization: Bearer <token>
Content-Type: application/json

{
  "challengeId": "challenge-id",
  "taskId": "task-id",
  "status": "completed"
}
```

## 🔧 Intégration avec les Services Existants

### Course Enrollment Service
Le service d'inscription aux cours a été mis à jour pour intégrer les vérifications de progression séquentielle :

- **`startChapter()`** : Vérifie l'accès séquentiel avant de permettre le démarrage d'un chapitre
- **`completeChapter()`** : Vérifie l'accès séquentiel avant de permettre la completion d'un chapitre

### Challenge Service
Le service des défis a été étendu avec de nouvelles méthodes :

- **`updateProgressWithSequential()`** : Met à jour le progrès avec vérification séquentielle
- **`checkTaskAccessWithSequential()`** : Vérifie l'accès à une tâche
- **`getUnlockedTasks()`** : Récupère les tâches déverrouillées

## 📝 DTOs (Data Transfer Objects)

### Course Sequential Progression DTOs
- **`UpdateSequentialProgressionDto`** : Pour activer/désactiver la progression séquentielle
- **`ChapterAccessResponseDto`** : Réponse de vérification d'accès à un chapitre
- **`UnlockedChaptersResponseDto`** : Réponse avec les chapitres déverrouillés

### Challenge Sequential Progression DTOs
- **`UpdateChallengeSequentialProgressionDto`** : Pour activer/désactiver la progression séquentielle
- **`TaskAccessResponseDto`** : Réponse de vérification d'accès à une tâche
- **`UnlockedTasksResponseDto`** : Réponse avec les tâches déverrouillées

## 🧪 Tests

Un script de test complet est disponible dans `test/test-sequential-progression.js` qui teste :

1. Activation/désactivation de la progression séquentielle
2. Vérification de l'accès aux chapitres/tâches
3. Récupération des chapitres/tâches déverrouillés
4. Déverrouillage manuel
5. Tests avec des données réelles

### Exécution des Tests
```bash
node test/test-sequential-progression.js
```

## 🔒 Sécurité et Permissions

### Permissions Requises
- **Créateurs de cours** : Peuvent activer/désactiver la progression séquentielle et déverrouiller manuellement des chapitres
- **Créateurs de défis** : Peuvent activer/désactiver la progression séquentielle et déverrouiller manuellement des tâches
- **Utilisateurs inscrits** : Peuvent vérifier leur accès et récupérer les chapitres/tâches déverrouillés

### Validation des Accès
- Vérification de l'appartenance à la communauté pour les cours
- Vérification de la participation au défi pour les défis
- Validation des permissions de créateur pour les actions d'administration

## 🎨 Cas d'Usage

### 1. Cours Structuré
Un créateur veut que ses étudiants suivent un parcours logique :
- Activer la progression séquentielle
- Définir un message personnalisé
- Les étudiants doivent compléter chaque chapitre avant d'accéder au suivant

### 2. Défi Progressif
Un créateur veut que les participants suivent un programme étape par étape :
- Activer la progression séquentielle
- Les participants doivent compléter chaque tâche avant d'accéder à la suivante
- Possibilité de déverrouiller manuellement pour des cas spéciaux

### 3. Contrôle de Qualité
Un créateur veut s'assurer que les utilisateurs maîtrisent les concepts de base :
- Activer la progression séquentielle
- Vérifier que les utilisateurs ont bien complété les chapitres fondamentaux
- Permettre l'accès aux chapitres avancés seulement après validation

## 🚀 Déploiement

### Prérequis
- Base de données MongoDB avec les nouveaux champs
- Application NestJS mise à jour
- Migration des données existantes (optionnelle)

### Migration des Données Existantes
```javascript
// Script de migration pour ajouter les champs par défaut
db.courses.updateMany(
  { sequentialProgression: { $exists: false } },
  { $set: { sequentialProgression: false } }
);

db.challenges.updateMany(
  { sequentialProgression: { $exists: false } },
  { $set: { sequentialProgression: false } }
);
```

## 📊 Monitoring et Analytics

### Métriques Recommandées
- Nombre de cours/défis avec progression séquentielle activée
- Taux de completion des chapitres/tâches avec progression séquentielle
- Nombre de déverrouillages manuels effectués
- Temps moyen de progression entre les chapitres/tâches

### Logs
Tous les événements de progression séquentielle sont loggés avec :
- ID de l'utilisateur
- ID du cours/défi
- ID du chapitre/tâche
- Action effectuée (accès accordé/refusé, déverrouillage, etc.)
- Timestamp

## 🔮 Évolutions Futures

### Fonctionnalités Potentielles
1. **Progression conditionnelle** : Déverrouillage basé sur des critères personnalisés
2. **Progression par groupes** : Déverrouillage pour des groupes d'utilisateurs
3. **Progression temporelle** : Déverrouillage basé sur le temps
4. **Progression par score** : Déverrouillage basé sur les résultats des quiz
5. **Progression collaborative** : Déverrouillage basé sur l'activité de groupe

### Améliorations Techniques
1. **Cache des vérifications d'accès** : Optimisation des performances
2. **Notifications push** : Alertes lors du déverrouillage de nouveaux contenus
3. **Dashboard de progression** : Interface de suivi pour les créateurs
4. **API de webhooks** : Intégration avec des systèmes externes

## 📞 Support

Pour toute question ou problème avec la fonctionnalité de progression séquentielle :

1. Consultez ce guide
2. Exécutez les tests pour vérifier l'installation
3. Vérifiez les logs pour identifier les problèmes
4. Contactez l'équipe de développement si nécessaire

---

**Version :** 1.0.0  
**Dernière mise à jour :** Décembre 2024  
**Auteur :** Équipe de développement Shabaka
