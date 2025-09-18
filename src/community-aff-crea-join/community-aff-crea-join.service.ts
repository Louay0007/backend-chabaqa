import { Injectable, ConflictException, NotFoundException, InternalServerErrorException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Community, CommunityDocument } from '../schema/community.schema';
import { User, UserDocument, UserRole } from '../schema/user.schema';
import { CreateCommunityDto } from '../dto-community/create-community.dto';
import { JoinCommunityDto, JoinByInviteDto, GenerateInviteDto } from '../dto-community/join-community.dto';
import { UploadService } from 'src/upload/upload.service';
import { PolicyService } from '../common/services/policy.service';
import { PromoService } from '../common/services/promo.service';
import { FeeService } from '../common/services/fee.service';
import { TrackableContentType } from '../schema/content-tracking.schema';

@Injectable()
export class CommunityAffCreaJoinService {
  constructor(
    @InjectModel(Community.name) private communityModel: Model<CommunityDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel('Order') private orderModel: Model<any>,
    private readonly uploadService: UploadService,
    private readonly policyService: PolicyService,
    private readonly promoService: PromoService,
    private readonly feeService: FeeService,
  ) {}

  /**
   * Créer une nouvelle communauté
   * @param createCommunityDto - Données de la communauté à créer selon l'interface CommunityFormData
   * @param uploadedFiles - Fichiers uploadés traités
   * @param userId - ID de l'utilisateur créateur
   * @returns La communauté créée
   */
  async createCommunity(createCommunityDto: CreateCommunityDto, uploadedFiles: { logo?: string }, userId: string): Promise<CommunityDocument> {
    try {
      // Debug: Log de l'ID utilisateur reçu
      console.log('🔍 Debug - ID utilisateur reçu:', userId, 'Type:', typeof userId);
      console.log('🚀 Création de communauté avec logo intégré');
      console.log('   Logo:', uploadedFiles.logo);

      // Intégrer le logo dans les données de la communauté (même pattern que le thumbnail)
      const communityDataAvecLogo = {
        ...createCommunityDto,
        logo: uploadedFiles.logo || createCommunityDto.logo
      };
      
      // Vérifier si l'utilisateur existe
      const user = await this.userModel.findById(userId);
      console.log('🔍 Debug - Utilisateur trouvé:', user ? 'Oui' : 'Non');
      
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // Vérifier les quotas: nombre de communautés du créateur
      const createdCount = await this.communityModel.countDocuments({ createur: new Types.ObjectId(userId) });
      const canCreate = await this.policyService.canCreateAnotherCommunity(userId, createdCount);
      if (!canCreate) {
        throw new ForbiddenException('Limite de communautés atteinte pour votre plan. Veuillez mettre à niveau.');
      }

      // Vérifier si une communauté avec ce nom existe déjà
      const existingCommunity = await this.communityModel.findOne({ name: communityDataAvecLogo.name });
      if (existingCommunity) {
        throw new ConflictException('Une communauté avec ce nom existe déjà');
      }

      // Validation des liens sociaux - au moins un lien requis
      const socialLinks = communityDataAvecLogo.socialLinks;
      const hasAtLeastOneLink = Object.values(socialLinks).some(link => link && link.trim() !== '');
      
      if (!hasAtLeastOneLink) {
        throw new BadRequestException('Au moins un lien social est requis pour créer une communauté');
      }

      // Générer un slug unique à partir du nom
      const slug = communityDataAvecLogo.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Vérifier l'unicité du slug
      let uniqueSlug = slug;
      let counter = 1;
      while (await this.communityModel.findOne({ slug: uniqueSlug })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }

      // Parser le montant en nombre
      const feeAmount = parseFloat(communityDataAvecLogo.feeAmount) || 0;
      
      // Mapper les données de CommunityFormData vers le schéma Community
      const communityData = {
        name: communityDataAvecLogo.name,
        slug: uniqueSlug,
        short_description: communityDataAvecLogo.bio || `Communauté ${communityDataAvecLogo.name}`,
        country: communityDataAvecLogo.country,
        
        // Mappage des paramètres d'accès
        isPrivate: communityDataAvecLogo.status === 'private',
        fees_of_join: communityDataAvecLogo.joinFee === 'paid' ? feeAmount : 0,
        currency: communityDataAvecLogo.currency,
        
        // Liens sociaux dans les settings
        settings: {
          socialLinks: {
            instagram: socialLinks.instagram || '',
            tiktok: socialLinks.tiktok || '',
            facebook: socialLinks.facebook || '',
            youtube: socialLinks.youtube || '',
            linkedin: socialLinks.linkedin || '',
            website: socialLinks.website || '',
          }
        },
        
        // Relations utilisateur
        createur: new Types.ObjectId(userId),
        members: [new Types.ObjectId(userId)],
        admins: [new Types.ObjectId(userId)],
        membersCount: 1,
        
        // Valeurs par défaut pour les champs requis du schéma
        // MODIFICATION: Prioriser le logo uploadé, sinon fallback vers les liens sociaux ou placeholder
        logo: communityDataAvecLogo.logo || socialLinks.website || socialLinks.instagram || socialLinks.facebook || 'https://via.placeholder.com/150',
        photo_de_couverture: 'https://via.placeholder.com/800x400',
        creatorAvatar: user.profile_picture || 'https://via.placeholder.com/100',
        category: 'Général',
        priceType: communityDataAvecLogo.joinFee === 'paid' ? 'one-time' : 'free',
        image: 'https://via.placeholder.com/600x400',
        tags: [communityDataAvecLogo.country],
        featured: false,
        
        // Valeurs par défaut système
        long_description: [],
        rank: 0,
        isActive: true,
        isVerified: false,
        cours: [],
      };

      const community = new this.communityModel(communityData);
      
      // Générer automatiquement un inviteCode unique pour éviter les conflits
      community.inviteCode = community.generateInviteCode();
      
      const savedCommunity = await community.save();

      // Log de confirmation si le logo a été intégré
      if (uploadedFiles.logo) {
        console.log(`✅ Logo intégré avec succès: ${uploadedFiles.logo}`);
      }

      // Mettre à jour l'utilisateur avec la nouvelle communauté et changer son rôle en creator
      await this.userModel.findByIdAndUpdate(
        userId,
        {
          $push: {
            createdCommunities: savedCommunity._id,
            joinedCommunities: savedCommunity._id,
            adminCommunities: savedCommunity._id,
          },
          // Changer le rôle de l'utilisateur en creator s'il était user
          role: UserRole.CREATOR,
        },
        { new: true }
      );

      // Retourner la communauté avec les relations peuplées
      const populatedCommunity = await this.communityModel
        .findById(savedCommunity._id)
        .populate('createur', 'name email')
        .populate('members', 'name email')
        .populate('admins', 'name email')
        .exec();
        

      if (!populatedCommunity) {
        throw new InternalServerErrorException('Erreur lors de la récupération de la communauté créée');
      }

      // Recalculer les rangs après la création
      await this.updateCommunityRanks();

      return populatedCommunity;

    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('Erreur lors de la création de la communauté:', error);
      throw new InternalServerErrorException('Erreur lors de la création de la communauté');
    }
  }

  /**
   * Obtenir toutes les communautés créées par un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Liste des communautés créées
   */
  async getUserCreatedCommunities(userId: string): Promise<CommunityDocument[]> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      return await this.communityModel
        .find({ createur: new Types.ObjectId(userId) })
        .populate('createur', 'name email')
        .populate('members', 'name email')
        .populate('admins', 'name email')
        .populate('moderateurs', 'name email')
        .sort({ createdAt: -1 })
        .exec();

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      console.error('Erreur lors de la récupération des communautés créées:', error);
      throw new InternalServerErrorException('Erreur lors de la récupération des communautés');
    }
  }

  /**
   * Obtenir toutes les communautés dont un utilisateur est membre
   * @param userId - ID de l'utilisateur
   * @returns Liste des communautés où l'utilisateur est membre
   */
  async getUserJoinedCommunities(userId: string): Promise<CommunityDocument[]> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      return await this.communityModel
        .find({ members: new Types.ObjectId(userId) })
        .populate('createur', 'name email')
        .populate('members', 'name email')
        .populate('admins', 'name email')
        .populate('moderateurs', 'name email')
        .sort({ createdAt: -1 })
        .exec();

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      console.error('Erreur lors de la récupération des communautés rejointes:', error);
      throw new InternalServerErrorException('Erreur lors de la récupération des communautés');
    }
  }

  /**
   * Obtenir une communauté par son ID
   * @param communityId - ID de la communauté
   * @returns La communauté trouvée
   */
  async getCommunityById(communityId: string): Promise<CommunityDocument> {
    try {
      const community = await this.communityModel
        .findById(communityId)
        .populate('createur', 'name email')
        .populate('members', 'name email')
        .populate('admins', 'name email')
        .populate('moderateurs', 'name email')
        .exec();

      if (!community) {
        throw new NotFoundException('Communauté non trouvée');
      }

      return community;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      console.error('Erreur lors de la récupération de la communauté:', error);
      throw new InternalServerErrorException('Erreur lors de la récupération de la communauté');
    }
  }

  /**
   * Checkout pour adhésion à une communauté payante
   */
  async checkoutCommunityMembership(communityId: string, userId: string, promoCode?: string): Promise<{ message: string }> {
    const community = await this.communityModel.findById(communityId);
    if (!community) {
      throw new NotFoundException('Communauté non trouvée');
    }

    if (community.members.includes(new Types.ObjectId(userId))) {
      return { message: 'Déjà membre de cette communauté' };
    }

    const price = community.fees_of_join || 0;
    if (price <= 0) {
      // Gratuit: ajouter directement
      community.addMember(new Types.ObjectId(userId));
      await community.save();
      await this.userModel.findByIdAndUpdate(userId, { $addToSet: { joinedCommunities: community._id } });
      return { message: 'Adhésion gratuite réussie' };
    }

    let effective = price;
    let discountDT = 0;
    let appliedCode: string | undefined;
    if (promoCode) {
      const buyer = await this.userModel.findById(userId).select('email');
      const promo = await this.promoService.validateAndApply(promoCode, price, TrackableContentType.COMMUNITY, community._id.toString(), (buyer as any)?.email);
      if (promo.valid) {
        effective = promo.finalAmountDT;
        discountDT = promo.discountDT;
        appliedCode = promo.appliedCode;
      }
    }

    const breakdown = await this.feeService.calculateForAmount(effective, community.createur.toString());
    await this.orderModel.create({
      buyerId: new Types.ObjectId(userId),
      creatorId: community.createur,
      contentType: TrackableContentType.COMMUNITY,
      contentId: community._id.toString(),
      amountDT: breakdown.amountDT,
      platformPercent: breakdown.platformPercent,
      platformFixedDT: breakdown.platformFixedDT,
      platformFeeDT: breakdown.platformFeeDT,
      creatorNetDT: breakdown.creatorNetDT,
      promoCode: appliedCode,
      discountDT,
      status: 'paid'
    });

    community.addMember(new Types.ObjectId(userId));
    await community.save();
    await this.userModel.findByIdAndUpdate(userId, { $addToSet: { joinedCommunities: community._id } });

    return { message: 'Adhésion achetée avec succès' };
  }

  /**
   * Ajouter un administrateur à une communauté avec contrainte AdminsMax
   */
  async addAdmin(communityId: string, targetUserId: string, requesterId: string): Promise<{ message: string }> {
    const community = await this.communityModel.findById(communityId);
    if (!community) {
      throw new NotFoundException('Communauté non trouvée');
    }

    const isCreator = community.createur.equals(new Types.ObjectId(requesterId));
    const isAdmin = community.admins.includes(new Types.ObjectId(requesterId));
    if (!isCreator && !isAdmin) {
      throw new ForbiddenException('Seuls le créateur ou un administrateur peuvent ajouter un administrateur');
    }

    const target = await this.userModel.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('Utilisateur cible non trouvé');
    }

    // Enforce AdminsMax according to creator's plan
    const currentAdminsCount = community.admins.length + 1; // including creator implicitly
    const canAdd = await this.policyService.canAddAdmin(community.createur.toString(), currentAdminsCount);
    if (!canAdd) {
      throw new ForbiddenException('Limite d\'administrateurs atteinte pour le plan du créateur');
    }

    const targetId = new Types.ObjectId(targetUserId);
    if (!community.admins.some(a => a.equals(targetId))) {
      community.admins.push(targetId);
      await community.save();
    }

    await this.userModel.findByIdAndUpdate(targetId, { $addToSet: { adminCommunities: community._id } });

    return { message: 'Administrateur ajouté avec succès' };
  }

  /**
   * Retirer un administrateur d'une communauté
   */
  async removeAdmin(communityId: string, targetUserId: string, requesterId: string): Promise<{ message: string }> {
    const community = await this.communityModel.findById(communityId);
    if (!community) {
      throw new NotFoundException('Communauté non trouvée');
    }

    const isCreator = community.createur.equals(new Types.ObjectId(requesterId));
    if (!isCreator) {
      throw new ForbiddenException('Seul le créateur peut retirer un administrateur');
    }

    const targetId = new Types.ObjectId(targetUserId);
    community.admins = community.admins.filter(a => !a.equals(targetId));
    await community.save();

    await this.userModel.findByIdAndUpdate(targetId, { $pull: { adminCommunities: community._id } });

    return { message: 'Administrateur retiré avec succès' };
  }

  /**
   * Obtenir toutes les communautés publiques (pour affichage général)
   * @returns Liste des communautés publiques
   */
  async getPublicCommunities(): Promise<CommunityDocument[]> {
    try {
      return await this.communityModel
        .find({ isPrivate: false, isActive: true })
        .populate('createur', 'name email')
        .select('-members -admins -moderateurs') // Masquer les listes de membres pour l'affichage public
        .sort({ createdAt: -1 })
        .exec();

    } catch (error) {
      console.error('Erreur lors de la récupération des communautés publiques:', error);
      throw new InternalServerErrorException('Erreur lors de la récupération des communautés');
    }
  }
  /**
   * Obtenir toutes les communautés (version complète avec populate)
   * @returns Liste de toutes les communautés actives
   */
  async getCommunities(): Promise<CommunityDocument[]> {
    try {
      return await this.communityModel
        .find({ isActive: true })
        .populate('createur', 'name email')
        .populate('members', 'name email')
        .populate('admins', 'name email')
        .populate('moderateurs', 'name email')
        .sort({ createdAt: -1 })
        .exec();

    } catch (error) {
      console.error('Erreur lors de la récupération des communautés:', error);
      throw new InternalServerErrorException('Erreur lors de la récupération des communautés');
    }
  }

  /**
   * Mettre à jour les rangs de toutes les communautés basé sur le nombre de membres
   * Rang 1 = communauté avec le plus de membres
   */
  async updateCommunityRanks(): Promise<void> {
    try {
      // Récupérer toutes les communautés triées par nombre de membres (décroissant)
      const communities = await this.communityModel
        .find({ isActive: true })
        .sort({ membersCount: -1 })
        .exec();

      // Mettre à jour le rang de chaque communauté
      for (let i = 0; i < communities.length; i++) {
        const community = communities[i];
        const newRank = i + 1; // Rang commence à 1

        if (community.rank !== newRank) {
          await this.communityModel.findByIdAndUpdate(
            community._id,
            { rank: newRank },
            { new: true }
          );
        }
      }

      console.log(`✅ Rangs mis à jour pour ${communities.length} communautés`);

    } catch (error) {
      console.error('Erreur lors de la mise à jour des rangs:', error);
      // Ne pas faire échouer l'opération principale si la mise à jour des rangs échoue
    }
  }

  /**
   * Obtenir le classement des communautés par nombre de membres
   * @returns Liste des communautés triées par rang
   */
  async getCommunityRanking(): Promise<CommunityDocument[]> {
    try {
      return await this.communityModel
        .find({ isActive: true })
        .sort({ rank: 1 }) // Tri par rang croissant (1, 2, 3...)
        .populate('createur', 'name email')
        .select('name logo membersCount rank createur createdAt')
        .exec();

    } catch (error) {
      console.error('Erreur lors de la récupération du classement:', error);
      throw new InternalServerErrorException('Erreur lors de la récupération du classement');
    }
  }

  /**
   * Rejoindre une communauté directement par ID
   * @param joinData - Données de join avec ID de la communauté
   * @param userId - ID de l'utilisateur qui souhaite rejoindre
   * @returns La communauté mise à jour
   */
  async joinCommunity(joinData: JoinCommunityDto, userId: string): Promise<CommunityDocument> {
    try {
      // Vérifier si l'utilisateur existe
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // Vérifier si la communauté existe
      const community = await this.communityModel.findById(joinData.communityId);
      if (!community) {
        throw new NotFoundException('Communauté non trouvée');
      }

      // Vérifier si la communauté est active
      if (!community.isActive) {
        throw new ForbiddenException('Cette communauté n\'est pas active');
      }

      // Enforcer MembersMax du créateur de la communauté
      const creatorId = community.createur;
      const currentMembers = community.membersCount || community.members.length;
      const canAdd = await this.policyService.canAddMember(creatorId.toString(), currentMembers);
      if (!canAdd) {
        throw new ForbiddenException('Limite de membres atteinte pour le plan du créateur.');
      }

      // Vérifier si l'utilisateur est déjà membre
      if (community.members.includes(new Types.ObjectId(userId))) {
        throw new ConflictException('Vous êtes déjà membre de cette communauté');
      }

      // Vérifier si la communauté est privée (pour les communautés privées, seul le lien d'invitation fonctionne)
      if (community.isPrivate) {
        throw new ForbiddenException('Cette communauté est privée. Vous devez utiliser un lien d\'invitation pour la rejoindre.');
      }

      // Ajouter l'utilisateur à la communauté
      community.members.push(new Types.ObjectId(userId));
      community.membersCount = community.members.length;
      await community.save();

      // Ajouter la communauté à la liste des communautés rejointes de l'utilisateur
      await this.userModel.findByIdAndUpdate(
        userId,
        { $addToSet: { joinedCommunities: community._id } },
        { new: true }
      );

      // Recalculer les rangs
      await this.updateCommunityRanks();

      // Retourner la communauté avec les relations peuplées
      const populatedCommunity = await this.communityModel
        .findById(community._id)
        .populate('createur', 'name email')
        .populate('members', 'name email')
        .populate('admins', 'name email')
        .exec();

      if (!populatedCommunity) {
        throw new InternalServerErrorException('Erreur lors de la récupération de la communauté mise à jour');
      }

      return populatedCommunity;

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof ForbiddenException) {
        throw error;
      }
      
      console.error('Erreur lors de la jonction à la communauté:', error);
      throw new InternalServerErrorException('Erreur lors de la jonction à la communauté');
    }
  }

  /**
   * Rejoindre une communauté via un lien d'invitation
   * @param joinData - Données de join avec le code d'invitation
   * @param userId - ID de l'utilisateur qui souhaite rejoindre
   * @returns La communauté mise à jour
   */
  async joinByInvite(joinData: JoinByInviteDto, userId: string): Promise<CommunityDocument> {
    try {
      // Vérifier si l'utilisateur existe
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // Trouver la communauté par le code d'invitation
      const community = await this.communityModel.findOne({ inviteCode: joinData.inviteCode });
      if (!community) {
        throw new NotFoundException('Code d\'invitation invalide ou expiré');
      }

      // Vérifier si la communauté est active
      if (!community.isActive) {
        throw new ForbiddenException('Cette communauté n\'est pas active');
      }

      // Enforcer MembersMax du créateur de la communauté
      const creatorId2 = community.createur;
      const currentMembers2 = community.membersCount || community.members.length;
      const canAdd2 = await this.policyService.canAddMember(creatorId2.toString(), currentMembers2);
      if (!canAdd2) {
        throw new ForbiddenException('Limite de membres atteinte pour le plan du créateur.');
      }

      // Vérifier si l'utilisateur est déjà membre
      if (community.members.includes(new Types.ObjectId(userId))) {
        throw new ConflictException('Vous êtes déjà membre de cette communauté');
      }

      // Ajouter l'utilisateur à la communauté
      community.members.push(new Types.ObjectId(userId));
      community.membersCount = community.members.length;
      await community.save();

      // Ajouter la communauté à la liste des communautés rejointes de l'utilisateur
      await this.userModel.findByIdAndUpdate(
        userId,
        { $addToSet: { joinedCommunities: community._id } },
        { new: true }
      );

      // Recalculer les rangs
      await this.updateCommunityRanks();

      // Retourner la communauté avec les relations peuplées
      const populatedCommunity = await this.communityModel
        .findById(community._id)
        .populate('createur', 'name email')
        .populate('members', 'name email')
        .populate('admins', 'name email')
        .exec();

      if (!populatedCommunity) {
        throw new InternalServerErrorException('Erreur lors de la récupération de la communauté mise à jour');
      }

      return populatedCommunity;

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof ForbiddenException) {
        throw error;
      }
      
      console.error('Erreur lors de la jonction par invitation:', error);
      throw new InternalServerErrorException('Erreur lors de la jonction par invitation');
    }
  }

  /**
   * Générer un lien d'invitation pour une communauté
   * @param generateData - Données avec l'ID de la communauté
   * @param userId - ID de l'utilisateur (doit être admin/créateur)
   * @param baseUrl - URL de base pour construire le lien complet
   * @returns Le lien d'invitation généré
   */
  async generateInviteLink(generateData: GenerateInviteDto, userId: string, baseUrl: string): Promise<{inviteCode: string, inviteLink: string}> {
    try {
      // Vérifier si l'utilisateur existe
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // Vérifier si la communauté existe
      const community = await this.communityModel.findById(generateData.communityId);
      if (!community) {
        throw new NotFoundException('Communauté non trouvée');
      }

      // Vérifier si l'utilisateur est créateur ou administrateur
      const isCreator = community.createur.equals(new Types.ObjectId(userId));
      const isAdmin = community.admins.includes(new Types.ObjectId(userId));
      
      if (!isCreator && !isAdmin) {
        throw new ForbiddenException('Seuls les créateurs et administrateurs peuvent générer des liens d\'invitation');
      }

      // Générer un nouveau code si nécessaire
      if (!community.inviteCode || generateData.regenerate) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let newCode = '';
        for (let i = 0; i < 12; i++) {
          newCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        community.inviteCode = newCode;
      }

      // Générer le lien d'invitation
      community.inviteLink = `${baseUrl}/community-aff-crea-join/join-by-invite/${community.inviteCode}`;
      await community.save();

      return {
        inviteCode: community.inviteCode,
        inviteLink: community.inviteLink
      };

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      console.error('Erreur lors de la génération du lien d\'invitation:', error);
      throw new InternalServerErrorException('Erreur lors de la génération du lien d\'invitation');
    }
  }

  /**
   * Quitter une communauté
   * @param communityId - ID de la communauté à quitter
   * @param userId - ID de l'utilisateur qui souhaite quitter
   * @returns Message de confirmation
   */
  async leaveCommunity(communityId: string, userId: string): Promise<{message: string}> {
    try {
      // Vérifier si l'utilisateur existe
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // Vérifier si la communauté existe
      const community = await this.communityModel.findById(communityId);
      if (!community) {
        throw new NotFoundException('Communauté non trouvée');
      }

      // Vérifier si l'utilisateur est membre
      if (!community.members.includes(new Types.ObjectId(userId))) {
        throw new BadRequestException('Vous n\'êtes pas membre de cette communauté');
      }

      // Empêcher le créateur de quitter sa propre communauté
      if (community.createur.equals(new Types.ObjectId(userId))) {
        throw new ForbiddenException('Le créateur ne peut pas quitter sa propre communauté');
      }

      // Retirer l'utilisateur de la communauté
      community.members = community.members.filter(member => !member.equals(new Types.ObjectId(userId)));
      community.admins = community.admins.filter(admin => !admin.equals(new Types.ObjectId(userId)));
      community.moderateurs = community.moderateurs.filter(moderator => !moderator.equals(new Types.ObjectId(userId)));
      community.membersCount = community.members.length;
      await community.save();

      // Retirer la communauté de la liste des communautés rejointes de l'utilisateur
      await this.userModel.findByIdAndUpdate(
        userId,
        { 
          $pull: { 
            joinedCommunities: community._id,
            adminCommunities: community._id
          } 
        },
        { new: true }
      );

      // Recalculer les rangs
      await this.updateCommunityRanks();

      return {
        message: 'Vous avez quitté la communauté avec succès'
      };

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('Erreur lors de la sortie de la communauté:', error);
      throw new InternalServerErrorException('Erreur lors de la sortie de la communauté');
    }
  }
  
}
