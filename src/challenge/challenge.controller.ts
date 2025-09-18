import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChallengeService } from './challenge.service';
import { CreateChallengeDto } from '../dto-challenge/create-challenge.dto';
import { UpdateChallengeDto } from '../dto-challenge/update-challenge.dto';
import { JoinChallengeDto, LeaveChallengeDto, UpdateProgressDto, CreateChallengePostDto, CreateChallengeCommentDto } from '../dto-challenge/join-challenge.dto';
import { ChallengeResponseDto, ChallengeListResponseDto } from '../dto-challenge/challenge-response.dto';
import { 
  UpdateChallengePricingDto, 
  CalculateChallengePriceDto, 
  ChallengePriceCalculationResponseDto,
  CheckChallengeAccessDto,
  ChallengeAccessResponseDto
} from '../dto-challenge/challenge-pricing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Challenges')
@Controller('challenges')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouveau défi' })
  @ApiResponse({ status: 201, description: 'Défi créé avec succès', type: ChallengeResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Communauté non trouvée' })
  async create(
    @Body() createChallengeDto: CreateChallengeDto,
    @Request() req: any
  ): Promise<ChallengeResponseDto> {
    return this.challengeService.create(createChallengeDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les défis avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste des défis récupérée avec succès', type: ChallengeListResponseDto })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page', example: 10 })
  @ApiQuery({ name: 'communitySlug', required: false, description: 'Slug de la communauté' })
  @ApiQuery({ name: 'category', required: false, description: 'Catégorie du défi' })
  @ApiQuery({ name: 'difficulty', required: false, description: 'Difficulté du défi' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Si le défi est actif' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('communitySlug') communitySlug?: string,
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
    @Query('isActive') isActive?: boolean
  ): Promise<ChallengeListResponseDto> {
    return this.challengeService.findAll(
      page,
      limit,
      communitySlug,
      category,
      difficulty,
      isActive
    );
  }

  @Get('community/:communitySlug')
  @ApiOperation({ summary: 'Récupérer les défis d\'une communauté' })
  @ApiResponse({ status: 200, description: 'Défis de la communauté récupérés avec succès', type: [ChallengeResponseDto] })
  @ApiResponse({ status: 404, description: 'Communauté non trouvée' })
  async findByCommunity(@Param('communitySlug') communitySlug: string): Promise<ChallengeResponseDto[]> {
    return this.challengeService.findByCommunity(communitySlug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un défi par son ID' })
  @ApiResponse({ status: 200, description: 'Défi récupéré avec succès', type: ChallengeResponseDto })
  @ApiResponse({ status: 404, description: 'Défi non trouvé' })
  async findOne(@Param('id') id: string): Promise<ChallengeResponseDto> {
    return this.challengeService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un défi' })
  @ApiResponse({ status: 200, description: 'Défi mis à jour avec succès', type: ChallengeResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Défi non trouvé' })
  async update(
    @Param('id') id: string,
    @Body() updateChallengeDto: UpdateChallengeDto,
    @Request() req: any
  ): Promise<ChallengeResponseDto> {
    return this.challengeService.update(id, updateChallengeDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un défi' })
  @ApiResponse({ status: 204, description: 'Défi supprimé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Défi non trouvé' })
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.challengeService.remove(id, req.user.userId);
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rejoindre un défi' })
  @ApiResponse({ status: 200, description: 'Défi rejoint avec succès', type: ChallengeResponseDto })
  @ApiResponse({ status: 400, description: 'Impossible de rejoindre le défi' })
  @ApiResponse({ status: 404, description: 'Défi non trouvé' })
  async joinChallenge(
    @Body() joinChallengeDto: JoinChallengeDto,
    @Request() req: any
  ): Promise<ChallengeResponseDto> {
    return this.challengeService.joinChallenge(joinChallengeDto, req.user.userId);
  }

  @Post('leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quitter un défi' })
  @ApiResponse({ status: 200, description: 'Défi quitté avec succès', type: ChallengeResponseDto })
  @ApiResponse({ status: 400, description: 'Impossible de quitter le défi' })
  @ApiResponse({ status: 404, description: 'Défi non trouvé' })
  async leaveChallenge(
    @Body() leaveChallengeDto: LeaveChallengeDto,
    @Request() req: any
  ): Promise<ChallengeResponseDto> {
    return this.challengeService.leaveChallenge(leaveChallengeDto, req.user.userId);
  }

  @Patch('progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour le progrès d\'un participant' })
  @ApiResponse({ status: 200, description: 'Progrès mis à jour avec succès', type: ChallengeResponseDto })
  @ApiResponse({ status: 400, description: 'Impossible de mettre à jour le progrès' })
  @ApiResponse({ status: 404, description: 'Défi ou tâche non trouvé' })
  async updateProgress(
    @Body() updateProgressDto: UpdateProgressDto,
    @Request() req: any
  ): Promise<ChallengeResponseDto> {
    return this.challengeService.updateProgress(updateProgressDto, req.user.userId);
  }

  @Post(':challengeId/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un post dans un défi' })
  @ApiResponse({ status: 201, description: 'Post créé avec succès', type: ChallengeResponseDto })
  @ApiResponse({ status: 400, description: 'Impossible de créer le post' })
  @ApiResponse({ status: 404, description: 'Défi non trouvé' })
  async createPost(
    @Param('challengeId') challengeId: string,
    @Body() createPostDto: CreateChallengePostDto,
    @Request() req: any
  ): Promise<ChallengeResponseDto> {
    return this.challengeService.createPost(challengeId, createPostDto, req.user.userId);
  }

  @Post(':challengeId/posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Commenter un post de défi' })
  @ApiResponse({ status: 201, description: 'Commentaire créé avec succès', type: ChallengeResponseDto })
  @ApiResponse({ status: 400, description: 'Impossible de créer le commentaire' })
  @ApiResponse({ status: 404, description: 'Défi ou post non trouvé' })
  async commentPost(
    @Param('challengeId') challengeId: string,
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateChallengeCommentDto,
    @Request() req: any
  ): Promise<ChallengeResponseDto> {
    return this.challengeService.commentPost(challengeId, postId, createCommentDto, req.user.userId);
  }

  // ============= PRICING ENDPOINTS =============

  @Patch(':id/pricing')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour la configuration de prix d\'un défi' })
  @ApiResponse({ status: 200, description: 'Configuration de prix mise à jour avec succès', type: ChallengeResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Défi non trouvé' })
  async updatePricing(
    @Param('id') challengeId: string,
    @Body() updatePricingDto: UpdateChallengePricingDto,
    @Request() req: any
  ): Promise<ChallengeResponseDto> {
    return this.challengeService.updatePricing(challengeId, updatePricingDto, req.user.userId);
  }

  @Post('calculate-price')
  @ApiOperation({ summary: 'Calculer le prix d\'un défi avec remises' })
  @ApiResponse({ status: 200, description: 'Prix calculé avec succès', type: ChallengePriceCalculationResponseDto })
  @ApiResponse({ status: 404, description: 'Défi non trouvé' })
  async calculatePrice(
    @Body() calculatePriceDto: CalculateChallengePriceDto
  ): Promise<ChallengePriceCalculationResponseDto> {
    return this.challengeService.calculatePrice(calculatePriceDto);
  }

  @Post('check-access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vérifier l\'accès d\'un utilisateur à un défi' })
  @ApiResponse({ status: 200, description: 'Accès vérifié avec succès', type: ChallengeAccessResponseDto })
  @ApiResponse({ status: 404, description: 'Défi ou utilisateur non trouvé' })
  async checkAccess(
    @Body() checkAccessDto: CheckChallengeAccessDto
  ): Promise<ChallengeAccessResponseDto> {
    return this.challengeService.checkAccess(checkAccessDto);
  }

  @Get('free')
  @ApiOperation({ summary: 'Récupérer les défis gratuits' })
  @ApiResponse({ status: 200, description: 'Liste des défis gratuits récupérée avec succès', type: ChallengeListResponseDto })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page', example: 10 })
  @ApiQuery({ name: 'communitySlug', required: false, description: 'Slug de la communauté' })
  async findFreeChallenges(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('communitySlug') communitySlug?: string
  ): Promise<ChallengeListResponseDto> {
    return this.challengeService.findFreeChallenges(page, limit, communitySlug);
  }

  @Get('premium')
  @ApiOperation({ summary: 'Récupérer les défis premium' })
  @ApiResponse({ status: 200, description: 'Liste des défis premium récupérée avec succès', type: ChallengeListResponseDto })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page', example: 10 })
  @ApiQuery({ name: 'communitySlug', required: false, description: 'Slug de la communauté' })
  async findPremiumChallenges(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('communitySlug') communitySlug?: string
  ): Promise<ChallengeListResponseDto> {
    return this.challengeService.findPremiumChallenges(page, limit, communitySlug);
  }

  // ============ TRACKING ENDPOINTS ============

  @Post(':id/track/view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enregistrer une vue d\'un défi' })
  @ApiResponse({ status: 200, description: 'Vue enregistrée avec succès' })
  async trackView(@Param('id') id: string, @Request() req: any) {
    return this.challengeService.trackChallengeView(id, req.user.userId);
  }

  @Post(':id/track/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Démarrer un défi' })
  @ApiResponse({ status: 200, description: 'Défi démarré avec succès' })
  async trackStart(@Param('id') id: string, @Request() req: any) {
    return this.challengeService.trackChallengeStart(id, req.user.userId);
  }

  @Post(':id/track/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marquer un défi comme terminé' })
  @ApiResponse({ status: 200, description: 'Défi marqué comme terminé' })
  async trackComplete(@Param('id') id: string, @Request() req: any) {
    return this.challengeService.trackChallengeComplete(id, req.user.userId);
  }

  @Post(':id/track/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enregistrer un like sur un défi' })
  @ApiResponse({ status: 200, description: 'Like enregistré avec succès' })
  async trackLike(@Param('id') id: string, @Request() req: any) {
    return this.challengeService.trackChallengeLike(id, req.user.userId);
  }

  @Post(':id/track/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enregistrer un partage d\'un défi' })
  @ApiResponse({ status: 200, description: 'Partage enregistré avec succès' })
  async trackShare(@Param('id') id: string, @Request() req: any) {
    return this.challengeService.trackChallengeShare(id, req.user.userId);
  }

  @Post(':id/track/bookmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajouter un bookmark d\'un défi' })
  @ApiResponse({ status: 200, description: 'Bookmark ajouté avec succès' })
  async addBookmark(@Param('id') id: string, @Body('bookmarkId') bookmarkId: string, @Request() req: any) {
    return this.challengeService.addChallengeBookmark(id, req.user.userId, bookmarkId);
  }

  @Delete(':id/track/bookmark/:bookmarkId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirer un bookmark d\'un défi' })
  @ApiResponse({ status: 200, description: 'Bookmark retiré avec succès' })
  async removeBookmark(@Param('id') id: string, @Param('bookmarkId') bookmarkId: string, @Request() req: any) {
    return this.challengeService.removeChallengeBookmark(id, req.user.userId, bookmarkId);
  }

  @Post(':id/track/rating')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajouter une note/évaluation d\'un défi' })
  @ApiResponse({ status: 200, description: 'Note ajoutée avec succès' })
  async addRating(@Param('id') id: string, @Body('rating') rating: number, @Request() req: any, @Body('review') review?: string) {
    return this.challengeService.addChallengeRating(id, req.user.userId, rating, review);
  }

  @Get(':id/track/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir la progression d\'un utilisateur pour un défi' })
  @ApiResponse({ status: 200, description: 'Progression récupérée avec succès' })
  async getProgress(@Param('id') id: string, @Request() req: any) {
    return this.challengeService.getChallengeProgress(id, req.user.userId);
  }

  @Get(':id/track/stats')
  @ApiOperation({ summary: 'Obtenir les statistiques d\'un défi' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getStats(@Param('id') id: string) {
    return this.challengeService.getChallengeStats(id);
  }
}
