import { Controller, Get, Post, Param, Body, Query, UseGuards, Req, Patch, Delete, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CoursService } from './cours.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCoursDto } from '../dto-cours/create-cours.dto';
import { AddSectionDto } from '../dto-cours/add-section.dto';
import { AddChapitreToSectionDto } from '../dto-cours/add-chapitre-to-section.dto';

interface AuthenticatedUser {
	_id: string;
	role: string;
}

@ApiTags('Cours')
@Controller('cours')
export class CoursController {
	constructor(private readonly coursService: CoursService) {}

	// ============ CRÉATION DE COURS ============

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post('create-cours')
	@ApiOperation({ summary: 'Créer un cours (avec sections/chapitres optionnels)' })
	async createCours(@Body() dto: CreateCoursDto, @Req() req) {
		const user = req.user as AuthenticatedUser;
		const result = await this.coursService.creerCours(dto, user._id);
		return { message: 'Cours créé avec succès', cours: result };
	}

	// Alias de compatibilité: POST /cours/create
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post('create')
	@ApiOperation({ summary: 'Créer un cours (alias /create-cours)' })
	async createCoursAlias(@Body() dto: CreateCoursDto, @Req() req) {
		const user = req.user as AuthenticatedUser;
		const result = await this.coursService.creerCours(dto, user._id);
		return { message: 'Cours créé avec succès', cours: result };
	}

	// Alias de compatibilité: POST /cours
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post()
	@ApiOperation({ summary: 'Créer un cours (alias racine)' })
	async createCoursRoot(@Body() dto: CreateCoursDto, @Req() req) {
		const user = req.user as AuthenticatedUser;
		const result = await this.coursService.creerCours(dto, user._id);
		return { message: 'Cours créé avec succès', cours: result };
	}

	// ============ RÉCUPÉRATION DE COURS ============

	// Liste par communauté (placer avant :id pour éviter conflits)
	@Get('community/:slug')
	@ApiOperation({ summary: 'Lister les cours par communauté' })
	@ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page' })
	@ApiQuery({ name: 'published', required: false, type: Boolean, description: 'Filtrer par statut de publication' })
	async getCoursByCommunity(
		@Param('slug') slug: string,
		@Query('page') page = '1',
		@Query('limit') limit = '10',
		@Query('published') published = 'true',
		@Req() req,
	) {
		const userId = req.user?._id;
		return await this.coursService.obtenirCoursParCommunaute(
			slug,
			Number(page) || 1,
			Number(limit) || 10,
			published !== 'false',
			userId,
		);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Get('user/mes-cours')
	@ApiOperation({ summary: 'Lister les cours auxquels je suis inscrit' })
	@ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page' })
	async getMesCours(
		@Query('page') page = '1',
		@Query('limit') limit = '10',
		@Req() req,
	) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.obtenirCoursInscrit(user._id, Number(page) || 1, Number(limit) || 10);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Get('user/created')
	@ApiOperation({ summary: 'Lister les cours créés par l\'utilisateur' })
	@ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page' })
	async getCoursCreated(
		@Query('page') page = '1',
		@Query('limit') limit = '10',
		@Req() req,
	) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.obtenirCoursParCreateur(user._id, Number(page) || 1, Number(limit) || 10);
	}

	// Obtenir un cours par ID
	@Get(':id')
	@ApiOperation({ summary: 'Obtenir un cours par ID' })
	async getCoursById(@Param('id') id: string, @Req() req) {
		const userId = req.user?._id;
		return await this.coursService.obtenirCours(id, userId);
	}

	// ============ GESTION DE COURS ============

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Patch(':id/toggle-publication')
	@ApiOperation({ summary: 'Publier/Dépublier un cours' })
	async togglePublication(@Param('id') id: string, @Req() req) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.togglePublication(id, user._id);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Delete(':id')
	@ApiOperation({ summary: 'Supprimer un cours' })
	async deleteCours(@Param('id') id: string, @Req() req) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.supprimerCours(id, user._id);
	}

	// ============ GESTION DES SECTIONS ============

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post(':id/add-section')
	@ApiOperation({ summary: 'Ajouter une section à un cours' })
	async addSection(
		@Param('id') id: string,
		@Body() dto: AddSectionDto,
		@Req() req,
	) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.ajouterSection(id, dto, user._id);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Delete(':coursId/sections/:sectionId')
	@ApiOperation({ summary: 'Supprimer une section d\'un cours' })
	async deleteSection(
		@Param('coursId') coursId: string,
		@Param('sectionId') sectionId: string,
		@Req() req,
	) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.supprimerSection(coursId, sectionId, user._id);
	}

	// ============ GESTION DES CHAPITRES ============

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post(':coursId/sections/:sectionId/add-chapitre')
	@ApiOperation({ summary: 'Ajouter un chapitre à une section spécifique' })
	async addChapitreToSection(
		@Param('coursId') coursId: string,
		@Param('sectionId') sectionId: string,
		@Body() dto: AddChapitreToSectionDto,
		@Req() req,
	) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.ajouterChapitreASection(coursId, sectionId, dto, user._id);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Delete(':coursId/sections/:sectionId/chapitres/:chapitreId')
	@ApiOperation({ summary: 'Supprimer un chapitre' })
	async deleteChapitre(
		@Param('coursId') coursId: string,
		@Param('sectionId') sectionId: string,
		@Param('chapitreId') chapitreId: string,
		@Req() req,
	) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.supprimerChapitre(coursId, sectionId, chapitreId, user._id);
	}

	// ============ GESTION DES RESSOURCES ============

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post(':coursId/sections/:sectionId/chapitres/:chapitreId/ressources')
	@ApiOperation({ summary: 'Ajouter une ressource à un chapitre' })
	async addRessourceToChapitre(
		@Param('coursId') coursId: string,
		@Param('sectionId') sectionId: string,
		@Param('chapitreId') chapitreId: string,
		@Body() ressource: any,
		@Req() req,
	) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.ajouterRessourceAChapitre(coursId, sectionId, chapitreId, ressource, user._id);
	}

	// ============ GESTION DES MÉDIAS ============

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Put(':id/thumbnail')
	@ApiOperation({ summary: 'Mettre à jour le thumbnail d\'un cours' })
	async updateThumbnail(
		@Param('id') id: string,
		@Body('thumbnailUrl') thumbnailUrl: string,
		@Req() req,
	) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.mettreAJourThumbnail(id, thumbnailUrl, user._id);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Put(':coursId/sections/:sectionId/chapitres/:chapitreId/video')
	@ApiOperation({ summary: 'Mettre à jour l\'URL vidéo d\'un chapitre' })
	async updateVideoUrl(
		@Param('coursId') coursId: string,
		@Param('sectionId') sectionId: string,
		@Param('chapitreId') chapitreId: string,
		@Body('videoUrl') videoUrl: string,
		@Req() req,
	) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.mettreAJourVideoUrl(coursId, sectionId, chapitreId, videoUrl, user._id);
	}

	// ============ INSCRIPTION AUX COURS ============

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post(':id/enroll')
	@ApiOperation({ summary: 'S\'inscrire à un cours' })
	async enrollToCours(@Param('id') id: string, @Req() req) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.inscrireAuCours(id, user._id);
	}

	// ============ VÉRIFICATION D'ACCÈS ============

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Get(':coursId/chapitres/:chapitreId/access')
	@ApiOperation({ summary: 'Vérifier l\'accès à un chapitre' })
	async checkChapterAccess(
		@Param('coursId') coursId: string,
		@Param('chapitreId') chapitreId: string,
		@Req() req,
	) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.verifierAccesChapitre(coursId, chapitreId, user._id);
	}

	// ============ PERMISSIONS ============

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Get(':id/permissions')
	@ApiOperation({ summary: 'Vérifier les permissions sur un cours' })
	async checkPermissions(@Param('id') id: string, @Req() req) {
		const user = req.user as AuthenticatedUser;
		const hasPermission = await this.coursService.verifierPermissionsCours(id, user._id);
		return { hasPermission };
	}

	// ============ TRACKING ENDPOINTS ============

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post(':id/track/view')
	@ApiOperation({ 
		summary: 'Enregistrer une vue d\'un cours',
		description: 'Enregistre qu\'un utilisateur a visualisé un cours. Incrémente le compteur de vues.'
	})
	@ApiParam({ name: 'id', description: 'ID du cours', type: 'string' })
	@ApiResponse({ status: 200, description: 'Vue enregistrée avec succès' })
	@ApiResponse({ status: 401, description: 'Non autorisé' })
	@ApiResponse({ status: 404, description: 'Cours non trouvé' })
	async trackView(@Param('id') id: string, @Req() req) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.trackCoursView(id, user._id);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post(':id/track/start')
	@ApiOperation({ 
		summary: 'Démarrer un cours',
		description: 'Marque le début de la consommation d\'un cours par un utilisateur. Enregistre l\'heure de début.'
	})
	@ApiParam({ name: 'id', description: 'ID du cours', type: 'string' })
	@ApiResponse({ status: 200, description: 'Démarrage enregistré avec succès' })
	@ApiResponse({ status: 401, description: 'Non autorisé' })
	@ApiResponse({ status: 404, description: 'Cours non trouvé' })
	async trackStart(@Param('id') id: string, @Req() req) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.trackCoursStart(id, user._id);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post(':id/track/complete')
	@ApiOperation({ 
		summary: 'Marquer un cours comme terminé',
		description: 'Marque la fin de la consommation d\'un cours par un utilisateur. Enregistre l\'heure de fin et calcule la progression.'
	})
	@ApiParam({ name: 'id', description: 'ID du cours', type: 'string' })
	@ApiResponse({ status: 200, description: 'Completion enregistrée avec succès' })
	@ApiResponse({ status: 401, description: 'Non autorisé' })
	@ApiResponse({ status: 404, description: 'Cours non trouvé' })
	async trackComplete(@Param('id') id: string, @Req() req) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.trackCoursComplete(id, user._id);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Put(':id/track/watch-time')
	@ApiOperation({ 
		summary: 'Mettre à jour le temps de visionnage d\'un cours',
		description: 'Ajoute du temps de visionnage au cours. Utilisé pour tracker la progression en temps réel.'
	})
	@ApiParam({ name: 'id', description: 'ID du cours', type: 'string' })
	@ApiBody({ 
		schema: { 
			type: 'object', 
			properties: { 
				additionalTime: { type: 'number', description: 'Temps additionnel en secondes' } 
			},
			required: ['additionalTime']
		}
	})
	@ApiResponse({ status: 200, description: 'Temps de visionnage mis à jour avec succès' })
	@ApiResponse({ status: 401, description: 'Non autorisé' })
	@ApiResponse({ status: 404, description: 'Cours non trouvé' })
	async updateWatchTime(@Param('id') id: string, @Body('additionalTime') additionalTime: number, @Req() req) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.updateCoursWatchTime(id, user._id, additionalTime);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post(':id/track/like')
	@ApiOperation({ 
		summary: 'Enregistrer un like sur un cours',
		description: 'Enregistre qu\'un utilisateur a liké un cours. Incrémente le compteur de likes.'
	})
	@ApiParam({ name: 'id', description: 'ID du cours', type: 'string' })
	@ApiResponse({ status: 200, description: 'Like enregistré avec succès' })
	@ApiResponse({ status: 401, description: 'Non autorisé' })
	@ApiResponse({ status: 404, description: 'Cours non trouvé' })
	async trackLike(@Param('id') id: string, @Req() req) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.trackCoursLike(id, user._id);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post(':id/track/share')
	@ApiOperation({ 
		summary: 'Enregistrer un partage d\'un cours',
		description: 'Enregistre qu\'un utilisateur a partagé un cours. Incrémente le compteur de partages.'
	})
	@ApiParam({ name: 'id', description: 'ID du cours', type: 'string' })
	@ApiResponse({ status: 200, description: 'Partage enregistré avec succès' })
	@ApiResponse({ status: 401, description: 'Non autorisé' })
	@ApiResponse({ status: 404, description: 'Cours non trouvé' })
	async trackShare(@Param('id') id: string, @Req() req) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.trackCoursShare(id, user._id);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post(':id/track/download')
	@ApiOperation({ 
		summary: 'Enregistrer un téléchargement d\'un cours',
		description: 'Enregistre qu\'un utilisateur a téléchargé un cours. Incrémente le compteur de téléchargements.'
	})
	@ApiParam({ name: 'id', description: 'ID du cours', type: 'string' })
	@ApiResponse({ status: 200, description: 'Téléchargement enregistré avec succès' })
	@ApiResponse({ status: 401, description: 'Non autorisé' })
	@ApiResponse({ status: 404, description: 'Cours non trouvé' })
	async trackDownload(@Param('id') id: string, @Req() req) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.trackCoursDownload(id, user._id);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post(':id/track/bookmark')
	@ApiOperation({ 
		summary: 'Ajouter un bookmark d\'un cours',
		description: 'Ajoute un cours aux favoris de l\'utilisateur avec un identifiant de bookmark personnalisé.'
	})
	@ApiParam({ name: 'id', description: 'ID du cours', type: 'string' })
	@ApiBody({ 
		schema: { 
			type: 'object', 
			properties: { 
				bookmarkId: { type: 'string', description: 'Identifiant unique du bookmark' } 
			},
			required: ['bookmarkId']
		}
	})
	@ApiResponse({ status: 200, description: 'Bookmark ajouté avec succès' })
	@ApiResponse({ status: 401, description: 'Non autorisé' })
	@ApiResponse({ status: 404, description: 'Cours non trouvé' })
	async addBookmark(@Param('id') id: string, @Body('bookmarkId') bookmarkId: string, @Req() req) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.addCoursBookmark(id, user._id, bookmarkId);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Delete(':id/track/bookmark/:bookmarkId')
	@ApiOperation({ 
		summary: 'Retirer un bookmark d\'un cours',
		description: 'Supprime un bookmark spécifique d\'un cours des favoris de l\'utilisateur.'
	})
	@ApiParam({ name: 'id', description: 'ID du cours', type: 'string' })
	@ApiParam({ name: 'bookmarkId', description: 'ID du bookmark à supprimer', type: 'string' })
	@ApiResponse({ status: 200, description: 'Bookmark supprimé avec succès' })
	@ApiResponse({ status: 401, description: 'Non autorisé' })
	@ApiResponse({ status: 404, description: 'Cours ou bookmark non trouvé' })
	async removeBookmark(@Param('id') id: string, @Param('bookmarkId') bookmarkId: string, @Req() req) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.removeCoursBookmark(id, user._id, bookmarkId);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post(':id/track/rating')
	@ApiOperation({ 
		summary: 'Ajouter une note/évaluation d\'un cours',
		description: 'Permet à un utilisateur de noter et éventuellement commenter un cours.'
	})
	@ApiParam({ name: 'id', description: 'ID du cours', type: 'string' })
	@ApiBody({ 
		schema: { 
			type: 'object', 
			properties: { 
				rating: { type: 'number', minimum: 1, maximum: 5, description: 'Note de 1 à 5' },
				review: { type: 'string', description: 'Commentaire optionnel' }
			},
			required: ['rating']
		}
	})
	@ApiResponse({ status: 200, description: 'Note ajoutée avec succès' })
	@ApiResponse({ status: 401, description: 'Non autorisé' })
	@ApiResponse({ status: 404, description: 'Cours non trouvé' })
	@ApiResponse({ status: 400, description: 'Note invalide (doit être entre 1 et 5)' })
	async addRating(@Param('id') id: string, @Body('rating') rating: number, @Req() req, @Body('review') review?: string) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.addCoursRating(id, user._id, rating, review);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Get(':id/track/progress')
	@ApiOperation({ 
		summary: 'Obtenir la progression d\'un utilisateur pour un cours',
		description: 'Récupère les données de progression détaillées d\'un utilisateur pour un cours spécifique.'
	})
	@ApiParam({ name: 'id', description: 'ID du cours', type: 'string' })
	@ApiResponse({ 
		status: 200, 
		description: 'Progression récupérée avec succès',
		schema: {
			type: 'object',
			properties: {
				contentId: { type: 'string' },
				contentType: { type: 'string' },
				progress: {
					type: 'object',
					properties: {
						isCompleted: { type: 'boolean' },
						watchTime: { type: 'number' },
						progressPercentage: { type: 'number' },
						lastAccessedAt: { type: 'string', format: 'date-time' }
					}
				},
				actions: { type: 'array' },
				bookmarks: { type: 'array' },
				userRating: { type: 'number' },
				userReview: { type: 'string' }
			}
		}
	})
	@ApiResponse({ status: 401, description: 'Non autorisé' })
	@ApiResponse({ status: 404, description: 'Cours non trouvé' })
	async getProgress(@Param('id') id: string, @Req() req) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.getCoursProgress(id, user._id);
	}

	@Get(':id/track/stats')
	@ApiOperation({ 
		summary: 'Obtenir les statistiques d\'un cours',
		description: 'Récupère les statistiques publiques d\'un cours (vues, likes, partages, etc.).'
	})
	@ApiParam({ name: 'id', description: 'ID du cours', type: 'string' })
	@ApiResponse({ 
		status: 200, 
		description: 'Statistiques récupérées avec succès',
		schema: {
			type: 'object',
			properties: {
				contentId: { type: 'string' },
				contentType: { type: 'string' },
				totalViews: { type: 'number' },
				totalLikes: { type: 'number' },
				totalShares: { type: 'number' },
				totalDownloads: { type: 'number' },
				totalBookmarks: { type: 'number' },
				averageRating: { type: 'number' },
				totalRatings: { type: 'number' },
				completionRate: { type: 'number' }
			}
		}
	})
	@ApiResponse({ status: 404, description: 'Cours non trouvé' })
	async getStats(@Param('id') id: string) {
		return await this.coursService.getCoursStats(id);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Get('user/progress')
	@ApiOperation({ 
		summary: 'Obtenir les progressions d\'un utilisateur pour tous ses cours',
		description: 'Récupère la liste paginée des progressions de l\'utilisateur connecté pour tous ses cours.'
	})
	@ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page (défaut: 1)' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 10)' })
	@ApiResponse({ 
		status: 200, 
		description: 'Progressions récupérées avec succès',
		schema: {
			type: 'object',
			properties: {
				progress: { type: 'array' },
				pagination: {
					type: 'object',
					properties: {
						page: { type: 'number' },
						limit: { type: 'number' },
						total: { type: 'number' },
						pages: { type: 'number' }
					}
				}
			}
		}
	})
	@ApiResponse({ status: 401, description: 'Non autorisé' })
	async getUserProgress(@Query('page') page = '1', @Query('limit') limit = '10', @Req() req) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.getUserCoursProgress(user._id, Number(page) || 1, Number(limit) || 10);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Get('user/actions/recent')
	@ApiOperation({ 
		summary: 'Obtenir les actions récentes d\'un utilisateur sur les cours',
		description: 'Récupère l\'historique des actions récentes de l\'utilisateur connecté sur les cours.'
	})
	@ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'actions à récupérer (défaut: 20)' })
	@ApiResponse({ 
		status: 200, 
		description: 'Actions récentes récupérées avec succès',
		schema: {
			type: 'object',
			properties: {
				actions: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							actionType: { type: 'string' },
							timestamp: { type: 'string', format: 'date-time' },
							contentId: { type: 'string' },
							contentType: { type: 'string' },
							metadata: { type: 'object' }
						}
					}
				}
			}
		}
	})
	@ApiResponse({ status: 401, description: 'Non autorisé' })
	async getUserRecentActions(@Query('limit') limit = '20', @Req() req) {
		const user = req.user as AuthenticatedUser;
		return await this.coursService.getUserCoursRecentActions(user._id, Number(limit) || 20);
	}
}