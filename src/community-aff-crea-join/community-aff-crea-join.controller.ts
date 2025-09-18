import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards, 
  Request, 
  Param, 
  HttpCode, 
  HttpStatus,
  ValidationPipe,
  UsePipes, 
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody,
  ApiParam, 
  ApiConsumes
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommunityAffCreaJoinService } from './community-aff-crea-join.service';
import { CreateCommunityDto } from '../dto-community/create-community.dto';
import { JoinCommunityDto, JoinByInviteDto, GenerateInviteDto } from '../dto-community/join-community.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileType, UploadService } from 'src/upload/upload.service';

@ApiTags('Community Management')
@Controller('community-aff-crea-join')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommunityAffCreaJoinController {
  constructor(
    private readonly communityService: CommunityAffCreaJoinService,
    private readonly uploadService: UploadService,
  ) {}

/**
 * Créer une nouvelle communauté
 * Route: POST /community-aff-crea-join/create
 * Authentification: JWT obligatoire
 */
@Post('create')
@HttpCode(HttpStatus.CREATED)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@UseInterceptors(FileInterceptor('logo', new UploadService().getMulterOptions(FileType.IMAGE)))
@ApiConsumes('multipart/form-data')
@ApiOperation({
  summary: 'Créer une nouvelle communauté',
  description: 'Permet à un utilisateur authentifié de créer une nouvelle communauté. L\'utilisateur devient automatiquement le créateur, membre et administrateur de la communauté.'
})
@ApiConsumes('multipart/form-data') // Ajout pour indiquer le support des fichiers
@ApiBody({
  type: CreateCommunityDto,
  description: 'Données de la communauté à créer (avec possibilité d\'upload de logo)'
})
@ApiResponse({
  status: HttpStatus.CREATED,
  description: 'Communauté créée avec succès',
  schema: {
    example: {
      success: true,
      message: 'Communauté créée avec succès',
      data: {
        _id: '507f1f77bcf86cd799439011',
        name: 'Développeurs JavaScript',
        logo: 'https://example.com/logo.png',
        photo_de_couverture: 'https://example.com/cover.jpg',
        short_description: 'Une communauté pour partager des connaissances sur JavaScript',
        createur: {
          _id: '507f1f77bcf86cd799439012',
          name: 'John Doe',
          email: 'john@example.com'
        },
        members: [
          {
            _id: '507f1f77bcf86cd799439012',
            name: 'John Doe',
            email: 'john@example.com'
          }
        ],
        admins: [
          {
            _id: '507f1f77bcf86cd799439012',
            name: 'John Doe',
            email: 'john@example.com'
          }
        ],
        rank: 'bronze',
        fees_of_join: 0,
        isPrivate: false,
        isActive: true,
        isVerified: false,
        membersCount: 1,
        createdAt: '2023-12-01T00:00:00.000Z',
        updatedAt: '2023-12-01T00:00:00.000Z'
      }
    }
  }
})
@ApiResponse({
  status: HttpStatus.BAD_REQUEST,
  description: 'Données invalides',
  schema: {
    example: {
      success: false,
      message: 'Données invalides',
      error: {
        statusCode: 400,
        message: ['Le nom doit contenir au moins 2 caractères', 'Le logo doit être une URL valide'],
        error: 'Bad Request'
      }
    }
  }
})
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Token JWT manquant ou invalide',
  schema: {
    example: {
      success: false,
      message: 'Non autorisé',
      error: {
        statusCode: 401,
        message: 'Unauthorized'
      }
    }
  }
})
@ApiResponse({
  status: HttpStatus.CONFLICT,
  description: 'Une communauté avec ce nom existe déjà',
  schema: {
    example: {
      success: false,
      message: 'Une communauté avec ce nom existe déjà',
      error: {
        statusCode: 409,
        message: 'Une communauté avec ce nom existe déjà',
        error: 'Conflict'
      }
    }
  }
})
async createCommunity(
  @Body() createCommunityDto: CreateCommunityDto,
  @UploadedFile() file: Express.Multer.File,
  @Request() req: any
) {
  try {
    const userId = req.user._id;
    const uploadedFiles: { logo?: string } = {};

    if (file) {
      // ✅ Utiliser UploadService pour valider et générer une URL
      const fileType = this.uploadService.validateFile(file);
      const filename = this.uploadService.generateFilename(file.originalname);
      const destinationPath = this.uploadService.getDestinationPath(fileType);

      // Déplacer le fichier (Multer l'a mis dans un tmp, mais on garde la logique)
      const fs = require('fs');
      const finalPath = `${destinationPath}/${filename}`;
      fs.renameSync(file.path, finalPath);

      // Générer l’URL publique
      const result = this.uploadService.processUploadedFile(
        { ...file, path: finalPath }, 
        filename
      );

      uploadedFiles.logo = result.url; // ⚡ Ici on garde uniquement l’URL publique
      console.log('📸 Logo final enregistré:', uploadedFiles.logo);
    }

    const community = await this.communityService.createCommunity(
      createCommunityDto,
      uploadedFiles,
      userId
    );

    return {
      success: true,
      message: 'Communauté créée avec succès',
      data: community
    };
  } catch (error) {
    console.error('❌ Erreur dans createCommunity:', error);
    throw error;
  }
}

  /**
   * Obtenir toutes les communautés créées par l'utilisateur connecté
   * Route: GET /community-aff-crea-join/my-created
   * Authentification: JWT obligatoire
   */
  @Get('my-created')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtenir mes communautés créées',
    description: 'Récupère toutes les communautés créées par l\'utilisateur authentifié'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Liste des communautés créées',
    schema: {
      example: {
        success: true,
        message: 'Communautés récupérées avec succès',
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            name: 'Développeurs JavaScript',
            logo: 'https://example.com/logo.png',
            membersCount: 25,
            createdAt: '2023-12-01T00:00:00.000Z'
          }
        ]
      }
    }
  })
  async getMyCreatedCommunities(@Request() req: any) {
    try {
      const userId = req.user._id;
      const communities = await this.communityService.getUserCreatedCommunities(userId);
      
      return {
        success: true,
        message: 'Communautés récupérées avec succès',
        data: communities
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtenir toutes les communautés dont l'utilisateur est membre
   * Route: GET /community-aff-crea-join/my-joined
   * Authentification: JWT obligatoire
   */
  @Get('my-joined')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtenir mes communautés rejointes',
    description: 'Récupère toutes les communautés dont l\'utilisateur authentifié est membre'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Liste des communautés rejointes'
  })
  async getMyJoinedCommunities(@Request() req: any) {
    try {
      const userId = req.user._id;
      const communities = await this.communityService.getUserJoinedCommunities(userId);
      
      return {
        success: true,
        message: 'Communautés rejointes récupérées avec succès',
        data: communities
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtenir toutes les communautés publiques
   * Route: GET /community-aff-crea-join/public/all
   * Authentification: JWT obligatoire
   */
  @Get('public/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtenir toutes les communautés publiques',
    description: 'Récupère toutes les communautés publiques et actives'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Liste des communautés publiques'
  })
  async getPublicCommunities() {
    try {
      const communities = await this.communityService.getPublicCommunities();
      
      return {
        success: true,
        message: 'Communautés publiques récupérées avec succès',
        data: communities
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtenir toutes les communautés
   * Route: GET /community-aff-crea-join/all-communities
   * Authentification: JWT obligatoire
   */
  @Get('all-communities')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtenir toutes les communautés',
    description: 'Récupère toutes les communautés actives avec leurs informations complètes'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des communautés récupérée avec succès',
    schema: {
      example: {
        success: true,
        message: 'Communautés récupérées avec succès',
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            name: 'Développeurs JavaScript',
            logo: 'https://example.com/logo.png',
            photo_de_couverture: 'https://example.com/cover.jpg',
            short_description: 'Une communauté pour partager des connaissances sur JavaScript',
            createur: {
              _id: '507f1f77bcf86cd799439012',
              name: 'John Doe',
              email: 'john@example.com'
            },
            members: [
              {
                _id: '507f1f77bcf86cd799439012',
                name: 'John Doe',
                email: 'john@example.com'
              }
            ],
            admins: [
              {
                _id: '507f1f77bcf86cd799439012',
                name: 'John Doe',
                email: 'john@example.com'
              }
            ],
            rank: 1,
            fees_of_join: 0,
            isPrivate: false,
            isActive: true,
            isVerified: false,
            membersCount: 1,
            createdAt: '2023-12-01T00:00:00.000Z',
            updatedAt: '2023-12-01T00:00:00.000Z'
          }
        ]
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token JWT manquant ou invalide'
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erreur interne du serveur'
  })
  async getAllCommunities(@Request() req?: any) {
    try {
      const communities = await this.communityService.getCommunities();
      
      return {
        success: true,
        message: 'Communautés récupérées avec succès',
        data: communities
      };
    } catch (error) {
      console.error('❌ Erreur dans getAllCommunities:', error);
      throw error;
    }
  }

  /**
   * Obtenir le classement des communautés par nombre de membres
   * Route: GET /community-aff-crea-join/ranking
   * Authentification: JWT obligatoire
   */
  @Get('ranking')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtenir le classement des communautés',
    description: 'Récupère le classement des communautés basé sur le nombre de membres (rang 1 = plus de membres)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Classement des communautés',
    schema: {
      example: {
        success: true,
        message: 'Classement récupéré avec succès',
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            name: 'Développeurs JavaScript',
            logo: 'https://example.com/logo.png',
            membersCount: 150,
            rank: 1,
            createur: {
              _id: '507f1f77bcf86cd799439012',
              name: 'John Doe',
              email: 'john@example.com'
            },
            createdAt: '2023-12-01T00:00:00.000Z'
          },
          {
            _id: '507f1f77bcf86cd799439013',
            name: 'Python Developers',
            logo: 'https://example.com/logo2.png',
            membersCount: 120,
            rank: 2,
            createur: {
              _id: '507f1f77bcf86cd799439014',
              name: 'Jane Smith',
              email: 'jane@example.com'
            },
            createdAt: '2023-11-15T00:00:00.000Z'
          }
        ]
      }
    }
  })
  async getCommunityRanking() {
    try {
      const communities = await this.communityService.getCommunityRanking();
      
      return {
        success: true,
        message: 'Classement récupéré avec succès',
        data: communities
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Forcer la mise à jour des rangs (utile pour les tests)
   * Route: POST /community-aff-crea-join/update-ranks
   * Authentification: JWT obligatoire
   */
  @Post('update-ranks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Mettre à jour les rangs des communautés',
    description: 'Force la mise à jour des rangs de toutes les communautés basé sur le nombre de membres'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Rangs mis à jour avec succès'
  })
  async updateCommunityRanks() {
    try {
      await this.communityService.updateCommunityRanks();
      
      return {
        success: true,
        message: 'Rangs mis à jour avec succès'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Rejoindre une communauté directement par ID
   * Route: POST /community-aff-crea-join/join
   * Authentification: JWT obligatoire
   */
  @Post('join')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ 
    summary: 'Rejoindre une communauté',
    description: 'Permet à un utilisateur de rejoindre une communauté publique en utilisant son ID'
  })
  @ApiBody({ 
    type: JoinCommunityDto,
    description: 'Données pour rejoindre la communauté'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Communauté rejointe avec succès',
    schema: {
      example: {
        success: true,
        message: 'Vous avez rejoint la communauté avec succès',
        data: {
          _id: '507f1f77bcf86cd799439011',
          name: 'Développeurs JavaScript',
          membersCount: 26,
          members: [
            {
              _id: '507f1f77bcf86cd799439012',
              name: 'John Doe',
              email: 'john@example.com'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Communauté non trouvée'
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Vous êtes déjà membre de cette communauté'
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Communauté privée ou inactive'
  })
  async joinCommunity(
    @Body() joinCommunityDto: JoinCommunityDto,
    @Request() req: any
  ) {
    try {
      const userId = req.user._id;
      const community = await this.communityService.joinCommunity(joinCommunityDto, userId);
      
      return {
        success: true,
        message: 'Vous avez rejoint la communauté avec succès',
        data: community
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Rejoindre une communauté via un lien d'invitation
   * Route: POST /community-aff-crea-join/join-by-invite
   * Authentification: JWT obligatoire
   */
  @Post('join-by-invite')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ 
    summary: 'Rejoindre une communauté via invitation',
    description: 'Permet à un utilisateur de rejoindre une communauté (publique ou privée) en utilisant un code d\'invitation'
  })
  @ApiBody({ 
    type: JoinByInviteDto,
    description: 'Données pour rejoindre par invitation'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Communauté rejointe avec succès via invitation'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Code d\'invitation invalide ou expiré'
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Vous êtes déjà membre de cette communauté'
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Communauté inactive'
  })
  async joinByInvite(
    @Body() joinByInviteDto: JoinByInviteDto,
    @Request() req: any
  ) {
    try {
      const userId = req.user._id;
      const community = await this.communityService.joinByInvite(joinByInviteDto, userId);
      
      return {
        success: true,
        message: 'Vous avez rejoint la communauté avec succès via invitation',
        data: community
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Générer un lien d'invitation pour une communauté
   * Route: POST /community-aff-crea-join/generate-invite
   * Authentification: JWT obligatoire
   */
  @Post('generate-invite')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ 
    summary: 'Générer un lien d\'invitation',
    description: 'Permet aux créateurs et administrateurs de générer un lien d\'invitation pour leur communauté'
  })
  @ApiBody({ 
    type: GenerateInviteDto,
    description: 'Données pour générer le lien'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lien d\'invitation généré avec succès',
    schema: {
      example: {
        success: true,
        message: 'Lien d\'invitation généré avec succès',
        data: {
          inviteCode: 'abc123DEF456',
          inviteLink: 'http://localhost:3000/community-aff-crea-join/join-by-invite/abc123DEF456'
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Communauté non trouvée'
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Seuls les créateurs et administrateurs peuvent générer des liens'
  })
  async generateInviteLink(
    @Body() generateInviteDto: GenerateInviteDto,
    @Request() req: any
  ) {
    try {
      const userId = req.user._id;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const inviteData = await this.communityService.generateInviteLink(generateInviteDto, userId, baseUrl);
      
      return {
        success: true,
        message: 'Lien d\'invitation généré avec succès',
        data: inviteData
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Quitter une communauté
   * Route: POST /community-aff-crea-join/leave/:communityId
   * Authentification: JWT obligatoire
   */
  @Post('leave/:communityId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Quitter une communauté',
    description: 'Permet à un utilisateur de quitter une communauté dont il est membre'
  })
  @ApiParam({ 
    name: 'communityId', 
    description: 'ID de la communauté à quitter',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Communauté quittée avec succès',
    schema: {
      example: {
        success: true,
        message: 'Vous avez quitté la communauté avec succès'
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Communauté non trouvée'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Vous n\'êtes pas membre de cette communauté'
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Le créateur ne peut pas quitter sa propre communauté'
  })
  async leaveCommunity(
    @Param('communityId') communityId: string,
    @Request() req: any
  ) {
    try {
      const userId = req.user._id;
      const result = await this.communityService.leaveCommunity(communityId, userId);
      
      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Accéder à une invitation via lien direct (GET)
   * Route: GET /community-aff-crea-join/join-by-invite/:inviteCode
   * Authentification: JWT obligatoire
   */
  @Get('join-by-invite/:inviteCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Accéder à une invitation via lien direct',
    description: 'Permet à un utilisateur de rejoindre une communauté directement via un lien d\'invitation'
  })
  @ApiParam({ 
    name: 'inviteCode', 
    description: 'Code d\'invitation unique',
    example: 'abc123DEF456'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Communauté rejointe avec succès via lien direct'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Code d\'invitation invalide ou expiré'
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Vous êtes déjà membre de cette communauté'
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Communauté inactive'
  })
  async joinByInviteLink(
    @Param('inviteCode') inviteCode: string,
    @Request() req: any
  ) {
    try {
      const userId = req.user._id;
      const joinByInviteDto: JoinByInviteDto = { inviteCode };
      const community = await this.communityService.joinByInvite(joinByInviteDto, userId);
      
      return {
        success: true,
        message: 'Vous avez rejoint la communauté avec succès via le lien d\'invitation',
        data: community
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtenir une communauté par son ID
   * Route: GET /community-aff-crea-join/:id
   * Authentification: JWT obligatoire
   * 
   * IMPORTANT: Cette route doit être placée EN DERNIER car elle utilise un paramètre dynamique (:id)
   * qui pourrait capturer d'autres routes spécifiques si elle était placée avant.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtenir une communauté par ID',
    description: 'Récupère les détails d\'une communauté spécifique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la communauté',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Détails de la communauté'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Communauté non trouvée'
  })
  async getCommunityById(@Param('id') communityId: string) {
    try {
      const community = await this.communityService.getCommunityById(communityId);
      
      return {
        success: true,
        message: 'Communauté récupérée avec succès',
        data: community
      };
    } catch (error) {
      throw error;
    }
  }
}
