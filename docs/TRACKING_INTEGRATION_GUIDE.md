# Content Tracking System Integration Guide

## ✅ Completed Components

### 1. **Shared Tracking Schema** (`src/schema/content-tracking.schema.ts`)
- `ContentProgress` - Tracks user progress for any content type
- `TrackingAction` - Records all user actions (view, like, share, etc.)
- Support for all content types: COURSE, CHALLENGE, SESSION, POST, EVENT, PRODUCT, RESOURCE
- Built-in methods for progress calculation, bookmark management, etc.

### 2. **Shared Tracking Service** (`src/common/services/content-tracking.service.ts`)
- Centralized service for all tracking operations
- Methods for: view, start, complete, like, share, download, bookmark, rating
- Progress tracking and statistics generation
- User activity history

### 3. **Shared Tracking Controller** (`src/common/controllers/tracking.controller.ts`)
- Universal API endpoints for all content types
- Pattern: `/tracking/{contentType}/{contentId}/{action}`
- Examples:
  - `POST /tracking/challenge/123/view`
  - `POST /tracking/session/456/complete`
  - `GET /tracking/post/789/stats`

### 4. **Tracking Module** (`src/common/modules/tracking.module.ts`)
- Exports the tracking service for use in other modules

### 5. **Challenge Module Integration** ✅
- Added tracking methods to `ChallengeService`
- Added tracking endpoints to `ChallengeController`
- Pattern: `POST /challenges/{id}/track/{action}`

## 🔄 Integration Pattern for Remaining Modules

For each remaining module (Session, Post, Event, Product, Resource), follow this pattern:

### Step 1: Update Module File
```typescript
// Add import
import { TrackingModule } from '../common/modules/tracking.module';

// Add to imports array
TrackingModule,
```

### Step 2: Update Service File
```typescript
// Add imports
import { ContentTrackingService } from '../common/services/content-tracking.service';
import { TrackableContentType } from '../schema/content-tracking.schema';

// Add to constructor
private readonly trackingService: ContentTrackingService,

// Add tracking methods (see template below)
```

### Step 3: Add Tracking Methods to Service
```typescript
// ============ TRACKING METHODS ============

async track{ContentType}View({contentType}Id: string, userId: string) {
  return await this.trackingService.trackView(userId, {contentType}Id, TrackableContentType.{CONTENT_TYPE});
}

async track{ContentType}Start({contentType}Id: string, userId: string) {
  return await this.trackingService.trackStart(userId, {contentType}Id, TrackableContentType.{CONTENT_TYPE});
}

async track{ContentType}Complete({contentType}Id: string, userId: string) {
  return await this.trackingService.trackComplete(userId, {contentType}Id, TrackableContentType.{CONTENT_TYPE});
}

async update{ContentType}WatchTime({contentType}Id: string, userId: string, additionalTime: number) {
  return await this.trackingService.updateWatchTime(userId, {contentType}Id, TrackableContentType.{CONTENT_TYPE}, additionalTime);
}

async track{ContentType}Like({contentType}Id: string, userId: string) {
  return await this.trackingService.trackLike(userId, {contentType}Id, TrackableContentType.{CONTENT_TYPE});
}

async track{ContentType}Share({contentType}Id: string, userId: string) {
  return await this.trackingService.trackShare(userId, {contentType}Id, TrackableContentType.{CONTENT_TYPE});
}

async add{ContentType}Bookmark({contentType}Id: string, userId: string, bookmarkId: string) {
  return await this.trackingService.addBookmark(userId, {contentType}Id, TrackableContentType.{CONTENT_TYPE}, bookmarkId);
}

async remove{ContentType}Bookmark({contentType}Id: string, userId: string, bookmarkId: string) {
  return await this.trackingService.removeBookmark(userId, {contentType}Id, TrackableContentType.{CONTENT_TYPE}, bookmarkId);
}

async add{ContentType}Rating({contentType}Id: string, userId: string, rating: number, review?: string) {
  return await this.trackingService.addRating(userId, {contentType}Id, TrackableContentType.{CONTENT_TYPE}, rating, review);
}

async get{ContentType}Progress({contentType}Id: string, userId: string) {
  return await this.trackingService.getProgress(userId, {contentType}Id, TrackableContentType.{CONTENT_TYPE});
}

async get{ContentType}Stats({contentType}Id: string) {
  return await this.trackingService.getContentStats({contentType}Id, TrackableContentType.{CONTENT_TYPE});
}
```

### Step 4: Add Tracking Endpoints to Controller
```typescript
// ============ TRACKING ENDPOINTS ============

@Post(':id/track/view')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Enregistrer une vue d\'un {contentType}' })
async trackView(@Param('id') id: string, @Request() req: any) {
  return this.{serviceName}.track{ContentType}View(id, req.user.userId);
}

@Post(':id/track/start')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Démarrer un {contentType}' })
async trackStart(@Param('id') id: string, @Request() req: any) {
  return this.{serviceName}.track{ContentType}Start(id, req.user.userId);
}

@Post(':id/track/complete')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Marquer un {contentType} comme terminé' })
async trackComplete(@Param('id') id: string, @Request() req: any) {
  return this.{serviceName}.track{ContentType}Complete(id, req.user.userId);
}

@Post(':id/track/like')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Enregistrer un like sur un {contentType}' })
async trackLike(@Param('id') id: string, @Request() req: any) {
  return this.{serviceName}.track{ContentType}Like(id, req.user.userId);
}

@Post(':id/track/share')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Enregistrer un partage d\'un {contentType}' })
async trackShare(@Param('id') id: string, @Request() req: any) {
  return this.{serviceName}.track{ContentType}Share(id, req.user.userId);
}

@Post(':id/track/bookmark')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Ajouter un bookmark d\'un {contentType}' })
async addBookmark(@Param('id') id: string, @Body('bookmarkId') bookmarkId: string, @Request() req: any) {
  return this.{serviceName}.add{ContentType}Bookmark(id, req.user.userId, bookmarkId);
}

@Delete(':id/track/bookmark/:bookmarkId')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Retirer un bookmark d\'un {contentType}' })
async removeBookmark(@Param('id') id: string, @Param('bookmarkId') bookmarkId: string, @Request() req: any) {
  return this.{serviceName}.remove{ContentType}Bookmark(id, req.user.userId, bookmarkId);
}

@Post(':id/track/rating')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Ajouter une note/évaluation d\'un {contentType}' })
async addRating(@Param('id') id: string, @Body('rating') rating: number, @Body('review') review?: string, @Request() req: any) {
  return this.{serviceName}.add{ContentType}Rating(id, req.user.userId, rating, review);
}

@Get(':id/track/progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Obtenir la progression d\'un utilisateur pour un {contentType}' })
async getProgress(@Param('id') id: string, @Request() req: any) {
  return this.{serviceName}.get{ContentType}Progress(id, req.user.userId);
}

@Get(':id/track/stats')
@ApiOperation({ summary: 'Obtenir les statistiques d\'un {contentType}' })
async getStats(@Param('id') id: string) {
  return this.{serviceName}.get{ContentType}Stats(id);
}
```

## 📋 Content Type Mappings

| Module | ContentType | CONTENT_TYPE | Service Name |
|--------|-------------|--------------|--------------|
| Challenge | challenge | CHALLENGE | challengeService |
| Session | session | SESSION | sessionService |
| Post | post | POST | postService |
| Event | event | EVENT | eventService |
| Product | product | PRODUCT | productService |
| Resource | resource | RESOURCE | resourceService |

## 🚀 Usage Examples

### Universal Tracking API
```bash
# Track a view
POST /tracking/challenge/123/view
POST /tracking/session/456/view

# Track completion
POST /tracking/post/789/complete
POST /tracking/event/101/complete

# Get statistics
GET /tracking/challenge/123/stats
GET /tracking/session/456/stats
```

### Module-Specific Tracking API
```bash
# Challenge tracking
POST /challenges/123/track/view
POST /challenges/123/track/complete
GET /challenges/123/track/stats

# Session tracking
POST /sessions/456/track/start
POST /sessions/456/track/complete
GET /sessions/456/track/progress
```

## 📊 Tracking Data Structure

```typescript
{
  id: string;
  userId: ObjectId;
  contentId: string;
  contentType: TrackableContentType;
  isCompleted: boolean;
  watchTime: number; // seconds
  rating?: number; // 1-5
  review?: string;
  completedAt?: Date;
  lastAccessedAt: Date;
  bookmarks: string[];
  viewCount: number;
  likeCount: number;
  shareCount: number;
  downloadCount: number;
  metadata: Record<string, any>;
}
```

## ✅ Next Steps

1. **Complete Session Module Integration** (in progress)
2. **Integrate Post Module**
3. **Integrate Event Module**
4. **Integrate Product Module**
5. **Integrate Resource Module**
6. **Update README.md** with tracking endpoints
7. **Test all tracking endpoints**

The tracking system is now ready and provides comprehensive analytics for all content types across the platform!
