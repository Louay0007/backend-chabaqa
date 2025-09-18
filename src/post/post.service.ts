import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../schema/post.schema';
import { Community, CommunityDocument } from '../schema/community.schema';
import { User, UserDocument } from '../schema/user.schema';
import { CreatePostDto } from '../dto-post/create-post.dto';
import { UpdatePostDto } from '../dto-post/update-post.dto';
import { CreatePostCommentDto } from '../dto-post/create-post.dto';
import { 
  PostResponseDto, 
  PostListResponseDto, 
  PostCommentResponseDto,
  PostStatsResponseDto 
} from '../dto-post/post-response.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Community.name) private communityModel: Model<CommunityDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Créer un nouveau post
   */
  async create(createPostDto: CreatePostDto, userId: string): Promise<PostResponseDto> {
    // Vérifier que la communauté existe
    const community = await this.communityModel.findOne({ id: createPostDto.communityId });
    if (!community) {
      throw new NotFoundException('Communauté non trouvée');
    }

    // Vérifier que l'utilisateur est membre de la communauté
    const isMember = community.members.some(member => member.toString() === userId);
    if (!isMember) {
      throw new ForbiddenException('Vous devez être membre de cette communauté pour publier un post');
    }

    // Créer le post
    const post = new this.postModel({
      ...createPostDto,
      authorId: new Types.ObjectId(userId),
      isPublished: true, // Toujours publié directement
      likes: 0,
      comments: [],
      likedBy: [],
      tags: createPostDto.tags || []
    });

    const savedPost = await post.save();
    
    // Récupérer les informations complètes
    const populatedPost = await this.postModel
      .findById(savedPost._id)
      .populate('authorId', 'name email profile_picture')
      .exec();

    return await this.transformToResponseDto(populatedPost!, community);
  }

  /**
   * Récupérer tous les posts avec pagination et filtres
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    communityId?: string,
    authorId?: string,
    tags?: string[],
    search?: string
  ): Promise<PostListResponseDto> {
    const query: any = { isPublished: true };

    // Filtres
    if (communityId) {
      query.communityId = communityId;
    }
    if (authorId) {
      query.authorId = new Types.ObjectId(authorId);
    }
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [posts, total] = await Promise.all([
      this.postModel
        .find(query)
        .populate('authorId', 'name email profile_picture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel.countDocuments(query)
    ]);

    // Récupérer les informations des communautés
    const communityIds = [...new Set(posts.map(post => post.communityId))];
    const communities = await this.communityModel.find({ id: { $in: communityIds } });

    const postsWithCommunities = await Promise.all(
      posts.map(async post => {
        const community = communities.find(c => c.id === post.communityId);
        return await this.transformToResponseDto(post, community);
      })
    );

    return {
      posts: postsWithCommunities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Récupérer un post par son ID
   */
  async findOne(id: string): Promise<PostResponseDto> {
    const post = await this.postModel
      .findOne({ id })
      .populate('authorId', 'name email profile_picture')
      .exec();

    if (!post) {
      throw new NotFoundException('Post non trouvé');
    }

    const community = await this.communityModel.findOne({ id: post.communityId });
    return await this.transformToResponseDto(post, community || undefined);
  }

  /**
   * Mettre à jour un post
   */
  async update(id: string, updatePostDto: UpdatePostDto, userId: string): Promise<PostResponseDto> {
    const post = await this.postModel.findOne({ id });
    if (!post) {
      throw new NotFoundException('Post non trouvé');
    }

    // Vérifier que l'utilisateur est l'auteur du post
    if (post.authorId.toString() !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres posts');
    }

    // Mettre à jour le post
    Object.assign(post, updatePostDto);
    post.updatedAt = new Date();
    
    const updatedPost = await post.save();
    
    // Récupérer les informations complètes
    const populatedPost = await this.postModel
      .findById(updatedPost._id)
      .populate('authorId', 'name email profile_picture')
      .exec();

    const community = await this.communityModel.findOne({ id: post.communityId });
    return await this.transformToResponseDto(populatedPost!, community || undefined);
  }

  /**
   * Supprimer un post
   */
  async remove(id: string, userId: string): Promise<{ message: string }> {
    const post = await this.postModel.findOne({ id });
    if (!post) {
      throw new NotFoundException('Post non trouvé');
    }

    // Vérifier que l'utilisateur est l'auteur du post
    if (post.authorId.toString() !== userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres posts');
    }

    await this.postModel.deleteOne({ _id: post._id });
    return { message: 'Post supprimé avec succès' };
  }

  /**
   * Ajouter un commentaire à un post
   */
  async addComment(postId: string, createCommentDto: CreatePostCommentDto, userId: string): Promise<PostCommentResponseDto> {
    const post = await this.postModel.findOne({ id: postId });
    if (!post) {
      throw new NotFoundException('Post non trouvé');
    }

    // Vérifier que l'utilisateur est membre de la communauté
    const community = await this.communityModel.findOne({ id: post.communityId });
    if (!community) {
      throw new NotFoundException('Communauté non trouvée');
    }

    const isMember = community.members.some(member => member.toString() === userId);
    if (!isMember) {
      throw new ForbiddenException('Vous devez être membre de cette communauté pour commenter');
    }

    // Créer le commentaire
    const comment = {
      id: new Types.ObjectId().toString(),
      content: createCommentDto.content,
      userId: new Types.ObjectId(userId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    post.addComment(comment);
    await post.save();

    // Récupérer les informations de l'utilisateur
    const user = await this.userModel.findById(userId).select('name profile_picture');
    
    return {
      id: comment.id,
      content: comment.content,
      userId: comment.userId.toString(),
      userName: user?.name || 'Utilisateur inconnu',
      userAvatar: user?.profile_picture,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString()
    };
  }

  /**
   * Supprimer un commentaire
   */
  async removeComment(postId: string, commentId: string, userId: string): Promise<{ message: string }> {
    const post = await this.postModel.findOne({ id: postId });
    if (!post) {
      throw new NotFoundException('Post non trouvé');
    }

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) {
      throw new NotFoundException('Commentaire non trouvé');
    }

    // Vérifier que l'utilisateur est l'auteur du commentaire ou l'auteur du post
    const isCommentAuthor = comment.userId.toString() === userId;
    const isPostAuthor = post.authorId.toString() === userId;
    
    if (!isCommentAuthor && !isPostAuthor) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres commentaires');
    }

    post.removeComment(commentId);
    await post.save();

    return { message: 'Commentaire supprimé avec succès' };
  }

  /**
   * Mettre à jour un commentaire
   */
  async updateComment(postId: string, commentId: string, content: string, userId: string): Promise<PostCommentResponseDto> {
    const post = await this.postModel.findOne({ id: postId });
    if (!post) {
      throw new NotFoundException('Post non trouvé');
    }

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) {
      throw new NotFoundException('Commentaire non trouvé');
    }

    // Vérifier que l'utilisateur est l'auteur du commentaire
    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres commentaires');
    }

    post.updateComment(commentId, content);
    await post.save();

    // Récupérer les informations de l'utilisateur
    const user = await this.userModel.findById(userId).select('name profile_picture');
    
    return {
      id: comment.id,
      content: comment.content,
      userId: comment.userId.toString(),
      userName: user?.name || 'Utilisateur inconnu',
      userAvatar: user?.profile_picture,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString()
    };
  }

  /**
   * Liker un post
   */
  async likePost(postId: string, userId: string): Promise<PostStatsResponseDto> {
    const post = await this.postModel.findOne({ id: postId });
    if (!post) {
      throw new NotFoundException('Post non trouvé');
    }

    const userIdObj = new Types.ObjectId(userId);
    const wasLiked = post.likePost(userIdObj);
    
    if (!wasLiked) {
      throw new BadRequestException('Vous avez déjà liké ce post');
    }

    await post.save();

    return {
      postId: post.id,
      totalLikes: post.likes,
      totalComments: post.getCommentsCount(),
      isLikedByUser: true
    };
  }

  /**
   * Unliker un post
   */
  async unlikePost(postId: string, userId: string): Promise<PostStatsResponseDto> {
    const post = await this.postModel.findOne({ id: postId });
    if (!post) {
      throw new NotFoundException('Post non trouvé');
    }

    const userIdObj = new Types.ObjectId(userId);
    const wasUnliked = post.unlikePost(userIdObj);
    
    if (!wasUnliked) {
      throw new BadRequestException('Vous n\'avez pas liké ce post');
    }

    await post.save();

    return {
      postId: post.id,
      totalLikes: post.likes,
      totalComments: post.getCommentsCount(),
      isLikedByUser: false
    };
  }

  /**
   * Récupérer les statistiques d'un post
   */
  async getPostStats(postId: string, userId?: string): Promise<PostStatsResponseDto> {
    const post = await this.postModel.findOne({ id: postId });
    if (!post) {
      throw new NotFoundException('Post non trouvé');
    }

    const isLikedByUser = userId ? post.isLikedBy(new Types.ObjectId(userId)) : false;

    return {
      postId: post.id,
      totalLikes: post.likes,
      totalComments: post.getCommentsCount(),
      isLikedByUser
    };
  }

  /**
   * Récupérer les posts d'un utilisateur
   */
  async findByUser(userId: string, page: number = 1, limit: number = 10): Promise<PostListResponseDto> {
    return this.findAll(page, limit, undefined, userId);
  }

  /**
   * Récupérer les posts d'une communauté
   */
  async findByCommunity(communityId: string, page: number = 1, limit: number = 10): Promise<PostListResponseDto> {
    return this.findAll(page, limit, communityId);
  }

  /**
   * Transformer un document Post en DTO de réponse
   */
  private async transformToResponseDto(post: PostDocument, community?: CommunityDocument | null): Promise<PostResponseDto> {
    // Transformer les commentaires
    const comments = await Promise.all(
      post.comments.map(async (comment) => {
        const user = await this.userModel.findById(comment.userId).select('name profile_picture');
        return {
          id: comment.id,
          content: comment.content,
          userId: comment.userId.toString(),
          userName: user?.name || 'Utilisateur inconnu',
          userAvatar: user?.profile_picture,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString()
        };
      })
    );

    // Récupérer les informations de l'auteur
    const author = await this.userModel.findById(post.authorId).select('name email profile_picture');

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      thumbnail: post.thumbnail,
      communityId: post.communityId,
      community: community ? {
        id: community.id,
        name: community.name,
        slug: community.slug
      } : {
        id: post.communityId,
        name: 'Communauté inconnue',
        slug: 'unknown'
      },
      authorId: post.authorId.toString(),
      author: {
        id: post.authorId.toString(),
        name: author?.name || 'Auteur inconnu',
        email: author?.email || '',
        profile_picture: author?.profile_picture
      },
      isPublished: post.isPublished,
      likes: post.likes,
      isLikedByUser: false, // Sera défini par l'appelant si nécessaire
      comments,
      tags: post.tags,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    };
  }
}
