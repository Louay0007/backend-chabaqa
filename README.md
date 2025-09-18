<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Shabaka Backend (NestJS)

## Description

API NestJS modulaire pour authentification, communautés, cours, défis, posts, produits, événements, sessions et upload. MongoDB via Mongoose, JWT avec 2FA, validation DTO et guards.

## Prérequis

- Node.js ≥ 16
- MongoDB (local ou Atlas)
- npm

## Installation

```bash
npm install
```

## Configuration (.env)

```env
# App
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Mongo
MONGO_URI=mongodb://localhost:27017/shabaka

# JWT
JWT_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
```

## Démarrage

```bash
# développement (watch)
npm run start:dev

# production
npm run build
npm run start:prod
```

## Modules et routes (aperçu)

- Auth (`/auth`): login, verify-2fa, refresh, me, logout, revoke-all-tokens
- Admin (`/admin`): create, login, verify-2fa, refresh, logout, forgot-password, reset-password
- Users (`/user`): signup, change-password, update-profile, forgot-password, reset-password, all-users, user/:id (GET/DELETE)
- Community Management (`/community-aff-crea-join`): create, my-created, my-joined, public/all, all-communities, ranking, update-ranks, join, join-by-invite, ...
- Challenges (`/challenges`): CRUD, join/leave, progress, posts/comments, pricing, calculate-price, check-access, free, premium
- Events (`/events`): CRUD, stats, community/:communityId, creator/:creatorId, sessions/tickets/speakers management, register/unregister, toggle-published
- Sessions (`/sessions`): CRUD, community/:communitySlug, bookings (book/confirm/cancel/complete, user/creator views)
- Posts (`/posts`): CRUD, user/:userId, community/:communityId, comments CRUD, like/unlike, stats
- Products (`/products`): CRUD, creator/:creatorId, community/:communityId, variants/files management, inventory, toggle-published, stats
- Cours (`/cours`): CRUD, community/:slug, user/mes-cours, user/created, sections/chapitres management, resources, media updates, enrollment, access verification, tracking (view/start/complete/like/share/download/bookmark/rating/progress/stats)
- Course Enrollment (`/course-enrollment`): start chapter, progress (course/section), complete (chapter/section/course), watch-time
- Upload (`/upload`): single, multiple, image, video, document, delete :type/:filename, get :type/:filename/info
- Resources (`/resources`): CRUD et gestion des fichiers/ressources

Remarque: La plupart des routes de création/mise à jour/suppression exigent `Authorization: Bearer <token>` et sont protégées par `JwtAuthGuard`.

## 📊 Système de Tracking

### Tracking Universel (`/tracking`)
- `POST /tracking/{contentType}/{contentId}/view` - Enregistrer une vue
- `POST /tracking/{contentType}/{contentId}/start` - Démarrer un contenu
- `POST /tracking/{contentType}/{contentId}/complete` - Marquer comme terminé
- `POST /tracking/{contentType}/{contentId}/like` - Enregistrer un like
- `POST /tracking/{contentType}/{contentId}/share` - Enregistrer un partage
- `POST /tracking/{contentType}/{contentId}/download` - Enregistrer un téléchargement
- `POST /tracking/{contentType}/{contentId}/bookmark` - Ajouter un bookmark
- `POST /tracking/{contentType}/{contentId}/rating` - Ajouter une note/évaluation
- `GET /tracking/{contentType}/{contentId}/progress` - Obtenir la progression
- `GET /tracking/{contentType}/{contentId}/stats` - Obtenir les statistiques

### Tracking par Module
Chaque module de contenu a ses propres endpoints de tracking:
- **Cours**: `POST /cours/{id}/track/{action}`
- **Challenges**: `POST /challenges/{id}/track/{action}`
- **Sessions**: `POST /sessions/{id}/track/{action}`
- **Posts**: `POST /posts/{id}/track/{action}`
- **Events**: `POST /events/{id}/track/{action}`
- **Products**: `POST /products/{id}/track/{action}`
- **Resources**: `POST /resources/{id}/track/{action}`

## Exemples rapides

```http
POST /auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "motdepasse123" }
```

```http
GET /auth/me
Authorization: Bearer <access_token>
```

## Tests

```bash
npm run test        # unit
npm run test:e2e    # e2e
```

Des scripts d'essai manuels existent dans `test/` (ex: `test-auth.js`, `test-2fa.js`, etc.).

## Sécurité

- Hashage bcrypt
- JWT access/refresh, 2FA, invalidation (logout, revoke all)
- Validation DTO (`class-validator`), guards (`JwtAuthGuard`)
- CORS (via `FRONTEND_URL`)

## Déploiement

- Définir secrets JWT forts, `NODE_ENV=production`, base Mongo de prod
- Build puis `npm run start:prod`

## Licence

MIT
