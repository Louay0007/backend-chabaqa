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
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from '../dto-post/create-post.dto';
import { UpdatePostDto } from '../dto-post/update-post.dto';
import { CreatePostCommentDto } from '../dto-post/create-post.dto';
import { 
  PostResponseDto, 
  PostListResponseDto, 
  PostCommentResponseDto,
  PostStatsResponseDto 
} from '../dto-post/post-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouveau post' })
  @ApiResponse({ status: 201, description: 'Post créé avec succès', type: PostResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Pas membre de la communauté' })
  @ApiResponse({ status: 404, description: 'Communauté non trouvée' })
  async create(@Body() createPostDto: CreatePostDto, @Request() req): Promise<{ success: boolean; data: PostResponseDto }> {
    const post = await this.postService.create(createPostDto, req.user.userId);
    return { success: true, data: post };
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer la liste des posts' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page' })
  @ApiQuery({ name: 'communityId', required: false, type: String, description: 'ID de la communauté' })
  @ApiQuery({ name: 'authorId', required: false, type: String, description: 'ID de l\'auteur' })
  @ApiQuery({ name: 'tags', required: false, type: [String], description: 'Tags à filtrer' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Terme de recherche' })
  @ApiResponse({ status: 200, description: 'Liste des posts récupérée avec succès', type: PostListResponseDto })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('communityId') communityId?: string,
    @Query('authorId') authorId?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string
  ): Promise<{ success: boolean; data: PostListResponseDto }> {
    const tagsArray = tags ? tags.split(',') : undefined;
    const posts = await this.postService.findAll(
      page || 1,
      limit || 10,
      communityId,
      authorId,
      tagsArray,
      search
    );
    return { success: true, data: posts };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Récupérer les posts d\'un utilisateur' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Posts de l\'utilisateur récupérés avec succès', type: PostListResponseDto })
  async findByUser(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<{ success: boolean; data: PostListResponseDto }> {
    const posts = await this.postService.findByUser(userId, page || 1, limit || 10);
    return { success: true, data: posts };
  }

  @Get('community/:communityId')
  @ApiOperation({ summary: 'Récupérer les posts d\'une communauté' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Posts de la communauté récupérés avec succès', type: PostListResponseDto })
  async findByCommunity(
    @Param('communityId') communityId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<{ success: boolean; data: PostListResponseDto }> {
    const posts = await this.postService.findByCommunity(communityId, page || 1, limit || 10);
    return { success: true, data: posts };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un post par son ID' })
  @ApiResponse({ status: 200, description: 'Post récupéré avec succès', type: PostResponseDto })
  @ApiResponse({ status: 404, description: 'Post non trouvé' })
  async findOne(@Param('id') id: string): Promise<{ success: boolean; data: PostResponseDto }> {
    const post = await this.postService.findOne(id);
    return { success: true, data: post };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un post' })
  @ApiResponse({ status: 200, description: 'Post mis à jour avec succès', type: PostResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Pas l\'auteur du post' })
  @ApiResponse({ status: 404, description: 'Post non trouvé' })
  async update(
    @Param('id') id: string, 
    @Body() updatePostDto: UpdatePostDto, 
    @Request() req
  ): Promise<{ success: boolean; data: PostResponseDto }> {
    const post = await this.postService.update(id, updatePostDto, req.user.userId);
    return { success: true, data: post };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un post' })
  @ApiResponse({ status: 200, description: 'Post supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Pas l\'auteur du post' })
  @ApiResponse({ status: 404, description: 'Post non trouvé' })
  async remove(@Param('id') id: string, @Request() req): Promise<{ success: boolean; message: string }> {
    const result = await this.postService.remove(id, req.user.userId);
    return { success: true, message: result.message };
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter un commentaire à un post' })
  @ApiResponse({ status: 201, description: 'Commentaire ajouté avec succès', type: PostCommentResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Pas membre de la communauté' })
  @ApiResponse({ status: 404, description: 'Post non trouvé' })
  async addComment(
    @Param('id') postId: string,
    @Body() createCommentDto: CreatePostCommentDto,
    @Request() req
  ): Promise<{ success: boolean; data: PostCommentResponseDto }> {
    const comment = await this.postService.addComment(postId, createCommentDto, req.user.userId);
    return { success: true, data: comment };
  }

  @Delete(':id/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un commentaire' })
  @ApiResponse({ status: 200, description: 'Commentaire supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Pas l\'auteur du commentaire' })
  @ApiResponse({ status: 404, description: 'Post ou commentaire non trouvé' })
  async removeComment(
    @Param('id') postId: string,
    @Param('commentId') commentId: string,
    @Request() req
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.postService.removeComment(postId, commentId, req.user.userId);
    return { success: true, message: result.message };
  }

  @Patch(':id/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un commentaire' })
  @ApiResponse({ status: 200, description: 'Commentaire mis à jour avec succès', type: PostCommentResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Pas l\'auteur du commentaire' })
  @ApiResponse({ status: 404, description: 'Post ou commentaire non trouvé' })
  async updateComment(
    @Param('id') postId: string,
    @Param('commentId') commentId: string,
    @Body('content') content: string,
    @Request() req
  ): Promise<{ success: boolean; data: PostCommentResponseDto }> {
    const comment = await this.postService.updateComment(postId, commentId, content, req.user.userId);
    return { success: true, data: comment };
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liker un post' })
  @ApiResponse({ status: 200, description: 'Post liké avec succès', type: PostStatsResponseDto })
  @ApiResponse({ status: 400, description: 'Post déjà liké' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Post non trouvé' })
  async likePost(
    @Param('id') postId: string,
    @Request() req
  ): Promise<{ success: boolean; data: PostStatsResponseDto }> {
    const stats = await this.postService.likePost(postId, req.user.userId);
    return { success: true, data: stats };
  }

  @Post(':id/unlike')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unliker un post' })
  @ApiResponse({ status: 200, description: 'Post unliké avec succès', type: PostStatsResponseDto })
  @ApiResponse({ status: 400, description: 'Post pas liké' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Post non trouvé' })
  async unlikePost(
    @Param('id') postId: string,
    @Request() req
  ): Promise<{ success: boolean; data: PostStatsResponseDto }> {
    const stats = await this.postService.unlikePost(postId, req.user.userId);
    return { success: true, data: stats };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Récupérer les statistiques d\'un post' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'ID de l\'utilisateur pour vérifier s\'il a liké' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès', type: PostStatsResponseDto })
  @ApiResponse({ status: 404, description: 'Post non trouvé' })
  async getPostStats(
    @Param('id') postId: string,
    @Query('userId') userId?: string
  ): Promise<{ success: boolean; data: PostStatsResponseDto }> {
    const stats = await this.postService.getPostStats(postId, userId);
    return { success: true, data: stats };
  }
}
