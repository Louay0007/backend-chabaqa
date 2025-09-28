import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cours, CoursDocument, CourseEnrollment, CourseEnrollmentDocument, CourseProgress, CourseProgressDocument } from '../schema/course.schema';
import { Community, CommunityDocument } from '../schema/community.schema';
import { User, UserDocument } from '../schema/user.schema';
import { CreateCoursDto } from '../dto-cours/create-cours.dto';

import { CoursResponseDto, ChapitreResponseDto } from '../dto-cours/cours-response.dto';
import { AddSectionDto } from '../dto-cours/add-section.dto';
import { AddChapitreToSectionDto } from '../dto-cours/add-chapitre-to-section.dto';
import { ContentTrackingService } from '../common/services/content-tracking.service';
import { PolicyService } from '../common/services/policy.service';
import { TrackableContentType } from '../schema/content-tracking.schema';
import { FeeService } from '../common/services/fee.service';
import { PromoService } from '../common/services/promo.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CoursService {
  constructor(
    @InjectModel('Cours') private coursModel: Model<CoursDocument>,
    @InjectModel('CourseEnrollment') private courseEnrollmentModel: Model<CourseEnrollmentDocument>,
    @InjectModel('CourseProgress') private courseProgressModel: Model<CourseProgressDocument>,
    @InjectModel('Community') private communityModel: Model<CommunityDocument>,
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Order') private orderModel: Model<any>,
    private readonly trackingService: ContentTrackingService,
    private readonly policyService: PolicyService,
    private readonly feeService: FeeService,
    private readonly promoService: PromoService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Récupérer la liste des cours avec pagination et filtres
   */
  async getCourses(page: number = 1, limit: number = 10, category?: string, niveau?: string, search?: string) {
    const query: any = { isPublished: true };
    
    if (category) {
      query.category = category;
    }
    
    if (niveau) {
      query.niveau = niveau;
    }
    
    if (search) {
      query.$or = [
        { titre: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [courses, total] = await Promise.all([
      this.coursModel
        .find(query)
        .populate('creatorId', 'name email profile_picture')
        .select('-sections -learningObjectives -requirements')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.coursModel.countDocuments(query)
    ]);
    
    const transformedCourses = courses.map(course => ({
      id: course._id.toString(),
      titre: course.titre,
      description: course.description,
      prix: course.prix,
      devise: course.devise,
      category: course.category,
      niveau: course.niveau,
      duree: course.duree,
      creator: {
        name: (course.creatorId as any)?.name || 'Unknown',
        avatar: (course.creatorId as any)?.profile_picture || 'https://placehold.co/64x64?text=MM'
      },
      createdAt: course.createdAt,
      image: course.thumbnail || 'https://placehold.co/400x300?text=Course'
    }));
    
    return {
      success: true,
      message: 'Cours récupérés avec succès',
      data: {
        courses: transformedCourses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };
  }

  /**
   * Vérifie si un utilisateur est admin d'une communauté
   * @param userId - L'ObjectId de l'utilisateur (string)
   * @param communityIdentifier - Le slug OU l'ObjectId de la communauté
   */
  private async verifierAdminCommunaute(userId: string, communityIdentifier: string): Promise<CommunityDocument> {
    console.log('🔍 DEBUG - verifierAdminCommunaute:');
    console.log('   userId:', userId, 'type:', typeof userId);
    console.log('   communityIdentifier:', communityIdentifier);
    
    // ÉTAPE 1: Trouver la communauté (par slug OU par _id)
    let community: CommunityDocument | null = null;
    
    if (Types.ObjectId.isValid(communityIdentifier)) {
      console.log('   → Recherche par _id (ObjectId valide)');
      community = await this.communityModel.findById(communityIdentifier);
    } else {
      console.log('   → Recherche par slug');
      community = await this.communityModel.findOne({ slug: communityIdentifier });
    }
    
    if (!community) {
      console.log('❌ DEBUG - Communauté non trouvée pour:', communityIdentifier);
      throw new NotFoundException('Communauté introuvable');
    }

    console.log('✅ DEBUG - Communauté trouvée:');
    console.log('   ID:', community._id.toString());
    console.log('   Nom:', community.name);
    console.log('   Slug:', community.slug);
    console.log('   Créateur ID:', community.createur?.toString());
    console.log('   Admins IDs:', community.admins?.map(id => id.toString()));

    // ÉTAPE 2: Convertir l'userId en ObjectId
    let userObjectId: Types.ObjectId;
    try {
      userObjectId = new Types.ObjectId(userId);
      console.log('   User ObjectId:', userObjectId.toString());
    } catch (error) {
      console.log('❌ DEBUG - Erreur conversion userId:', error.message);
      throw new BadRequestException('Format userId invalide');
    }
    
    // ÉTAPE 3: Vérifier les permissions dans CETTE communauté spécifique
    const estCreateur = community.createur?.equals(userObjectId);
    const estAdmin = community.admins?.some(adminId => adminId.equals(userObjectId));
    
    console.log('   → Est créateur:', estCreateur);
    console.log('   → Est admin:', estAdmin);
    
    // Debug comparaison des ObjectIds
    console.log('   → Comparaison détaillée:');
    console.log('     Créateur BD:', community.createur?.toString());
    console.log('     User actuel:', userObjectId.toString());
    console.log('     Match créateur:', community.createur?.toString() === userObjectId.toString());
    
    if (!estCreateur && !estAdmin) {
      console.log('❌ DEBUG - Utilisateur NON AUTORISÉ pour cette communauté');
      console.log('   Community ID:', community._id.toString());
      console.log('   Community slug:', community.slug);
      throw new ForbiddenException('Seuls les administrateurs de la communauté peuvent effectuer cette action');
    }

    console.log('✅ DEBUG - Utilisateur AUTORISÉ pour cette communauté');
    return community;
  }

  /**
   * Vérifie si un utilisateur est membre (ou admin) d'une communauté
   */
  private async verifierMembreCommunaute(userId: string, communitySlug: string): Promise<CommunityDocument> {
    const community = await this.communityModel.findOne({ slug: communitySlug });
    
    if (!community) {
      throw new NotFoundException('Communauté introuvable');
    }

    const userObjectId = new Types.ObjectId(userId);
    
    // Vérifier si l'utilisateur est le créateur, admin ou membre de la communauté
    const estCreateur = community.createur.equals(userObjectId);
    const estAdmin = community.admins.some(adminId => adminId.equals(userObjectId));
    const estMembre = community.members.some(memberId => memberId.equals(userObjectId));
    
    if (!estCreateur && !estAdmin && !estMembre) {
      throw new ForbiddenException('Seuls les membres de la communauté peuvent accéder à cette ressource');
    }

    return community;
  }

  /**
   * Créer un nouveau cours avec ses chapitres
   */
  async creerCours(createCoursDto: CreateCoursDto, userId: string): Promise<CoursResponseDto> {
    console.log('🚀 Création de cours avec sections');
    console.log('   userId:', userId);
    console.log('   Titre:', createCoursDto.titre);
    console.log('   DTO complet:', JSON.stringify(createCoursDto, null, 2));
    
    // Validation de sécurité
    if (!createCoursDto.sections) {
      console.log('⚠️ Aucune section fournie, initialisation avec tableau vide');
      createCoursDto.sections = [];
    }
    
    console.log('   Sections:', createCoursDto.sections.length);
    
    // Vérifier les permissions d'admin
    const community = await this.verifierAdminCommunaute(userId, createCoursDto.communitySlug);

    // Policy: limiter l'activation/création de cours par plan (count cours de ce créateur)
    const activeCoursesCount = await this.coursModel.countDocuments({ creatorId: new Types.ObjectId(userId) });
    const canCreate = await this.policyService.canActivateMoreCourses(userId, activeCoursesCount);
    if (!canCreate) {
      throw new ForbiddenException('Limite de cours atteinte pour votre plan. Veuillez mettre à niveau.');
    }

    // Vérifier que l'utilisateur existe
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Générer un ID unique pour le cours
    const coursId = new Types.ObjectId().toString();

    // Créer le cours avec le nouveau schéma  
    const nouveauCours = new this.coursModel({
      id: coursId,
      titre: createCoursDto.titre,
      description: createCoursDto.description,
      thumbnail: createCoursDto.thumbnail,
      prix: createCoursDto.prix,
      isPaidCourse: createCoursDto.prix > 0, // Auto-détermine si le cours est payant
      devise: createCoursDto.devise || 'TND',
      communityId: community._id.toString(),
      creatorId: new Types.ObjectId(userId),
      isPublished: createCoursDto.isPublished || false,
      category: createCoursDto.category,
      niveau: createCoursDto.niveau,
      duree: createCoursDto.duree,
      learningObjectives: createCoursDto.learningObjectives || [],
      requirements: createCoursDto.requirements || [],
      notes: createCoursDto.notes,
      sections: [], // Sera rempli avec les sections
      inscriptions: [],
      ressources: []
    });

    // Sauvegarder le cours
    const coursEnregistre = await nouveauCours.save();

    // Utiliser la méthode utilitaire pour convertir la durée

    // Créer les sections et chapitres directement
    console.log(`🏗️ Création directe de ${createCoursDto.sections.length} sections`);
    
    const sectionsCompletes = createCoursDto.sections.map((sectionDto, sectionIndex) => {
      console.log(`📁 Section ${sectionIndex + 1}: "${sectionDto.titre}" avec ${sectionDto.chapitres.length} chapitres`);
      
      // Créer tous les chapitres de cette section
      const chapitresSection = sectionDto.chapitres.map((chapitreDto, chapitreIndex) => {
        console.log(`   📄 Chapitre ${chapitreIndex + 1}: "${chapitreDto.titre}"`);
        
        return {
          id: new Types.ObjectId().toString(),
          titre: chapitreDto.titre,
          contenu: chapitreDto.description,
          videoUrl: chapitreDto.videoUrl || '',
          isPreview: !chapitreDto.isPaid,
          ordre: chapitreDto.ordre,
          duree: this.convertirDureeEnMinutes(chapitreDto.duree || ''),
          prix: chapitreDto.isPaid ? (chapitreDto.prix || coursEnregistre.prix) : 0,
          isPaidChapter: chapitreDto.isPaid,
          notes: chapitreDto.notes || '',
          ressources: [],
          sectionId: '', // Sera défini après
          createdAt: new Date()
        };
      });
      
      // Créer la section avec ses chapitres
      const sectionId = new Types.ObjectId().toString();
      
      // Assigner l'ID de la section à tous ses chapitres
      chapitresSection.forEach(chapitre => {
        chapitre.sectionId = sectionId;
      });
      
      return {
        id: sectionId,
        titre: sectionDto.titre,
        description: sectionDto.description || '',
        courseId: coursEnregistre.id,
        ordre: sectionDto.ordre,
        chapitres: chapitresSection,
        createdAt: new Date()
      };
    });
    
    // Assigner toutes les sections au cours
    coursEnregistre.sections = sectionsCompletes;
    
    // Sauvegarder avec toutes les sections et chapitres
    await coursEnregistre.save();
    
    console.log('✅ Résultat final:');
    console.log(`   📚 Cours: "${coursEnregistre.titre}"`);
    console.log(`   📁 ${coursEnregistre.sections.length} sections créées`);
    coursEnregistre.sections.forEach((section, i) => {
      console.log(`      Section ${i + 1}: "${section.titre}" → ${section.chapitres.length} chapitres`);
      section.chapitres.forEach((chapitre, j) => {
        console.log(`         📄 ${j + 1}. "${chapitre.titre}"`);
      });
    });

    // Ajouter le cours à la communauté
    community.ajouterCours(coursEnregistre._id);
    await community.save();

    return await this.transformerEnReponse(coursEnregistre);
  }



  /**
   * Obtenir un cours par ID
   */
  async obtenirCours(coursId: string, userId?: string): Promise<CoursResponseDto> {
    console.log('🔧 DEBUG - obtenirCours');
    console.log(`   📋 Cours ID: ${coursId}`);
    console.log(`   👤 User ID: ${userId}`);

    const cours = await this.coursModel.findById(coursId)
      .populate('creatorId', 'nom prenom email avatar')
      .exec();

    if (!cours) {
      console.log('   ❌ Cours non trouvé');
      throw new NotFoundException('Cours introuvable');
    }

    console.log(`   ✅ Cours trouvé: ${cours.titre}`);
    console.log(`   🏢 Community ID: ${cours.communityId}`);
    console.log(`   📊 Sections: ${cours.sections?.length || 0}`);

    // Si un userId est fourni, vérifier que l'utilisateur est membre de la communauté
    if (userId) {
      // Récupérer la communauté pour obtenir son slug
      const community = await this.communityModel.findById(cours.communityId);
      if (!community) {
        throw new NotFoundException('Communauté du cours introuvable');
      }
      await this.verifierMembreCommunaute(userId, community.slug);
      console.log('   ✅ Utilisateur autorisé');
    }

    return await this.transformerEnReponse(cours);
  }

  /**
   * Obtenir tous les cours d'une communauté
   */
  async obtenirCoursParCommunaute(
    communitySlug: string, 
    page: number = 1, 
    limit: number = 10,
    seulementsPublies: boolean = true,
    userId?: string
  ) {
    const skip = (page - 1) * limit;
    
    console.log('🔧 DEBUG - obtenirCoursParCommunaute');
    console.log(`   🏢 Community Slug: ${communitySlug}`);
    console.log(`   👤 User ID: ${userId}`);
    console.log(`   📄 Page: ${page}, Limit: ${limit}`);
    console.log(`   📢 Seulement publiés: ${seulementsPublies}`);

    // 1. Récupérer la communauté par son slug pour obtenir son ID
    const community = await this.communityModel.findOne({ slug: communitySlug });
    if (!community) {
      throw new NotFoundException('Communauté non trouvée');
    }

    console.log(`   ✅ Communauté trouvée: ${community.name}`);
    console.log(`   🆔 Community ID: ${community._id}`);
    
    // 2. Si un userId est fourni, vérifier que l'utilisateur est membre de la communauté
    if (userId) {
      await this.verifierMembreCommunaute(userId, community.slug);
    }
    
    // 3. Construire les filtres avec l'ID de la communauté
    const filtres: any = { communityId: community._id.toString() };
    if (seulementsPublies) {
      filtres.isPublished = true;
    }

    console.log('   🔍 Filtres appliqués:', filtres);

    const [cours, total] = await Promise.all([
      this.coursModel
        .find(filtres)
        .populate('creatorId', 'nom prenom email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.coursModel.countDocuments(filtres)
    ]);

    console.log(`   📊 Cours trouvés: ${cours.length}/${total}`);

    return {
      cours: await Promise.all(cours.map(cours => this.transformerEnReponse(cours))),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Obtenir les cours créés par un utilisateur
   */
  async obtenirCoursParCreateur(creatorId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    console.log('🔧 DEBUG - obtenirCoursParCreateur');
    console.log(`   👤 Creator ID: ${creatorId}`);
    console.log(`   📄 Page: ${page}, Limit: ${limit}`);

    const [cours, total] = await Promise.all([
      this.coursModel
        .find({ creatorId: new Types.ObjectId(creatorId) })
        .populate('creatorId', 'nom prenom email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.coursModel.countDocuments({ creatorId: new Types.ObjectId(creatorId) })
    ]);

    console.log(`   📊 Cours trouvés: ${cours.length}/${total}`);

    return {
      cours: await Promise.all(cours.map(cours => this.transformerEnReponse(cours))),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Obtenir les cours auxquels un utilisateur est inscrit
   */
  async obtenirCoursInscrit(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    console.log('🔧 DEBUG - obtenirCoursInscrit');
    console.log(`   👤 User ID: ${userId}`);
    console.log(`   📄 Page: ${page}, Limit: ${limit}`);

    // 1. Trouver toutes les inscriptions de l'utilisateur
    const [inscriptions, totalInscriptions] = await Promise.all([
      this.courseEnrollmentModel
        .find({ userId: new Types.ObjectId(userId), isActive: true })
        .populate({
          path: 'courseId',
          populate: {
            path: 'creatorId',
            select: 'nom prenom email avatar'
          }
        })
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.courseEnrollmentModel.countDocuments({ userId: new Types.ObjectId(userId), isActive: true })
    ]);

    console.log(`   📊 Inscriptions trouvées: ${inscriptions.length}/${totalInscriptions}`);

    // 2. Extraire les cours depuis les inscriptions
    const cours = inscriptions
      .filter(inscription => inscription.courseId) // Filtrer les inscriptions avec cours valides
      .map(inscription => inscription.courseId as any);

    return {
      cours: await Promise.all(cours.map(cours => this.transformerEnReponse(cours))),
      total: totalInscriptions,
      page,
      limit,
      totalPages: Math.ceil(totalInscriptions / limit)
    };
  }

  /**
   * Publier/dépublier un cours
   */
  async togglePublication(coursId: string, userId: string): Promise<CoursResponseDto> {
    const cours = await this.coursModel.findById(coursId);
    if (!cours) {
      throw new NotFoundException('Cours introuvable');
    }

    // Vérifier les permissions
    const community = await this.verifierAdminCommunaute(userId, cours.communityId);

    cours.togglePublication();
    await cours.save();

    // Send notification to community members when a course is published
    if (cours.isPublished) {
      const members = await this.userModel.find({ _id: { $in: community.members } });
      for (const member of members) {
        if (member._id.toString() !== userId) { // Don't notify the user who published the course
          this.notificationService.createNotification({
            recipient: member._id.toString(),
            type: 'new_course',
            title: 'New Course Published',
            body: `A new course "${cours.titre}" has been published in your community "${community.name}"`,
            data: { courseId: cours._id.toString(), communityId: community._id.toString() },
          });
        }
      }
    }

    return await this.transformerEnReponse(cours);
  }

  /**
   * Supprimer un cours
   */
  async supprimerCours(coursId: string, userId: string): Promise<{ message: string }> {
    const cours = await this.coursModel.findById(coursId);
    if (!cours) {
      throw new NotFoundException('Cours introuvable');
    }

    // Vérifier les permissions
    const community = await this.verifierAdminCommunaute(userId, cours.communityId);

    // Supprimer le cours de la communauté
    community.supprimerCours(cours._id);
    await community.save();

    // Supprimer le cours
    await this.coursModel.findByIdAndDelete(coursId);
    
    return {
      message: 'Cours supprimé avec succès'
    }
    
  }

  /**
   * Créer les sections et chapitres du cours
   */
  private async _creerSectionsEtChapitres(cours: CoursDocument, sections: any[]): Promise<void> {
    console.log('🚨🚨🚨 DEBUT _creerSectionsEtChapitres 🚨🚨🚨');
    console.log(`🏗️ Création de ${sections.length} sections`);
    console.log('📋 Sections reçues:', JSON.stringify(sections.map(s => ({ titre: s.titre, chapitres: s.chapitres?.length || 0 })), null, 2));
    
    for (let i = 0; i < sections.length; i++) {
      const sectionDto = sections[i];
      console.log(`📁 Section ${i + 1}: "${sectionDto.titre}" (${sectionDto.chapitres.length} chapitres)`);
      
      // Créer la section
      const nouvelleSection = {
        id: new Types.ObjectId().toString(),
        titre: sectionDto.titre,
        description: sectionDto.description || '',
        courseId: cours.id,
        ordre: sectionDto.ordre,
        chapitres: [],
        createdAt: new Date()
      };
      
      // Ajouter la section au cours
      cours.ajouterSection(nouvelleSection);
      
      // Créer et ajouter chaque chapitre à cette section
      for (let j = 0; j < sectionDto.chapitres.length; j++) {
        const chapitreDto = sectionDto.chapitres[j];
        console.log(`   📄 Chapitre ${j + 1}: "${chapitreDto.titre}"`);
        console.log(`      🔧 Données du chapitre:`, JSON.stringify(chapitreDto, null, 2));
        
        const nouveauChapitre = {
          id: new Types.ObjectId().toString(),
          titre: chapitreDto.titre,
          contenu: chapitreDto.description,
          videoUrl: chapitreDto.videoUrl,
          isPreview: !chapitreDto.isPaid,
          ordre: chapitreDto.ordre,
          duree: chapitreDto.duree,
          prix: chapitreDto.isPaid ? (chapitreDto.prix || cours.prix) : 0,
          isPaidChapter: chapitreDto.isPaid,
          notes: chapitreDto.notes || '',
          ressources: [],
          sectionId: nouvelleSection.id,
          createdAt: new Date()
        };
        
        console.log(`      🏗️  Chapitre créé:`, JSON.stringify({
          id: nouveauChapitre.id,
          titre: nouveauChapitre.titre,
          ordre: nouveauChapitre.ordre,
          sectionId: nouveauChapitre.sectionId
        }, null, 2));
        
        console.log(`      📎 Appel de ajouterChapitreASection avec sectionId: "${nouvelleSection.id}"`);
        
        // Ajouter le chapitre à la section
        try {
          cours.ajouterChapitreASection(nouvelleSection.id, nouveauChapitre);
          console.log(`      ✅ ajouterChapitreASection terminé sans erreur`);
        } catch (error) {
          console.log(`      ❌ ERREUR dans ajouterChapitreASection:`, error.message);
        }
      }
    }
    
    // Sauvegarder le cours avec toutes les sections et chapitres
    await cours.save();
    
    // Vérifier le résultat final
    console.log('📊 Résultat final:');
    console.log(`   ✅ ${cours.sections.length} sections créées`);
    cours.sections.forEach((section, index) => {
      console.log(`   📁 Section ${index + 1}: "${section.titre}" → ${section.chapitres.length} chapitres`);
    });
  }

  /**
   * Transformer un document cours en DTO de réponse
   */
  private async transformerEnReponse(cours: CoursDocument): Promise<CoursResponseDto> {
    // Récupérer la communauté pour avoir accès au slug
    const community = await this.communityModel.findById(cours.communityId);
    // Extraire tous les chapitres de toutes les sections pour la compatibilité
    const tousLesChapitres = cours.sections.flatMap(section => 
      section.chapitres.map(chapitre => ({
        id: chapitre.id,
        titre: chapitre.titre,
        description: chapitre.contenu,
        videoUrl: chapitre.videoUrl,
        isPaid: !chapitre.isPreview, // Inverse de isPreview
        ordre: chapitre.ordre,
        duree: chapitre.duree?.toString(),
        courseId: section.courseId,
        sectionId: chapitre.sectionId,
        prix: chapitre.prix,
        notes: chapitre.notes,
        ressources: chapitre.ressources,
        createdAt: chapitre.createdAt
      }))
    );

    return {
      id: cours.id || cours._id.toString(),
      titre: cours.titre,
      description: cours.description,
      thumbnail: cours.thumbnail,
      isPaid: cours.prix > 0,
      prix: cours.prix,
      isPaidCourse: (cours as any).isPaidCourse || cours.prix > 0,
      devise: cours.devise,
      communitySlug: community?.slug || cours.communityId, // Slug pour rétrocompatibilité
      communityId: cours.communityId, // ObjectId réel
      creatorId: cours.creatorId.toString(),
      isPublished: cours.isPublished,
      enrollmentCount: cours.inscriptions?.length || 0,
      // Nouveaux champs du schéma - mapping correct des sections
      sections: cours.sections.map(section => ({
        id: section.id,
        titre: section.titre,
        description: section.description,
        courseId: section.courseId,
        ordre: section.ordre,
        createdAt: section.createdAt,
        chapitres: section.chapitres.map(chapitre => ({
          id: chapitre.id,
          titre: chapitre.titre,
          description: chapitre.contenu,
          videoUrl: chapitre.videoUrl,
          isPaid: !chapitre.isPreview,
          ordre: chapitre.ordre,
          duree: chapitre.duree?.toString(),
          courseId: section.courseId,
          sectionId: chapitre.sectionId,
          prix: chapitre.prix,
          isPaidChapter: chapitre.isPaidChapter || !chapitre.isPreview,
          notes: chapitre.notes,
          ressources: chapitre.ressources?.map(res => ({
            id: res.id,
            titre: res.titre,
            type: res.type,
            url: res.url,
            description: res.description,
            ordre: res.ordre
          })),
          createdAt: chapitre.createdAt
        }))
      })),
      category: cours.category,
      niveau: cours.niveau,
      duree: cours.duree,
      learningObjectives: cours.learningObjectives,
      requirements: cours.requirements,
      notes: cours.notes,
      ressources: cours.ressources,
      createdAt: cours.createdAt.toISOString(),
      updatedAt: cours.updatedAt.toISOString(),
      creator: cours.creatorId && (cours.creatorId as any).nom ? {
        id: (cours.creatorId as any)._id.toString(),
        nom: (cours.creatorId as any).nom,
        prenom: (cours.creatorId as any).prenom,
        email: (cours.creatorId as any).email,
        avatar: (cours.creatorId as any).avatar
      } : undefined
    };
  }

  /**
   * Ajouter une section à un cours existant
   * @param coursId ID du cours
   * @param addSectionDto Données de la section à ajouter
   * @param userId ID de l'utilisateur (pour vérifier les permissions)
   * @returns Cours mis à jour avec la nouvelle section
   */
  async ajouterSection(coursId: string, addSectionDto: AddSectionDto, userId: string): Promise<CoursResponseDto> {
    console.log('🔧 DEBUG - Début ajouterSection');
    console.log(`   📋 Cours ID: ${coursId}`);
    console.log(`   👤 User ID: ${userId}`);
    console.log(`   📝 Section à ajouter:`, addSectionDto);

    try {
      // 1. Vérifier que le cours existe
      const cours = await this.coursModel.findById(coursId);
      if (!cours) {
        throw new NotFoundException('Cours non trouvé');
      }

      console.log(`   ✅ Cours trouvé: ${cours.titre}`);
      console.log(`   🏢 Community ID: ${cours.communityId}`);

      // 2. Vérifier que l'utilisateur est admin de la communauté
      await this.verifierAdminCommunaute(userId, cours.communityId.toString());

      console.log('   ✅ Utilisateur autorisé');

      // 3. Construire la nouvelle section
      console.log('   📝 Construction de la section avec données:', {
        titre: addSectionDto.titre,
        ordre: addSectionDto.ordre,
        chapitresCount: addSectionDto.chapitres?.length || 0
      });
      
      const nouvelleSection = {
        id: new Types.ObjectId().toString(),
        titre: addSectionDto.titre,
        description: addSectionDto.description || '',
        courseId: coursId,
        ordre: addSectionDto.ordre,
        chapitres: Array.isArray(addSectionDto.chapitres) ? addSectionDto.chapitres.map(chapitre => ({
          id: new Types.ObjectId().toString(),
          titre: chapitre.titre,
          contenu: chapitre.description || '',
          videoUrl: chapitre.videoUrl,
          duree: chapitre.duree ? this.convertirDureeEnMinutes(chapitre.duree) : undefined,
          sectionId: new Types.ObjectId().toString(), // Sera mis à jour avec l'ID de la section
          ordre: chapitre.ordre,
          isPreview: chapitre.isPaid === false,
          prix: chapitre.isPaid ? cours.prix : 0,
          notes: chapitre.notes,
          ressources: [],
          createdAt: new Date()
        })) : [],
        createdAt: new Date()
      };

      // Mettre à jour les sectionId des chapitres avec l'ID de la section
      nouvelleSection.chapitres.forEach(chapitre => {
        chapitre.sectionId = nouvelleSection.id;
      });

      console.log('   🏗️ Nouvelle section construite:', {
        id: nouvelleSection.id,
        titre: nouvelleSection.titre,
        ordre: nouvelleSection.ordre,
        nombreChapitres: nouvelleSection.chapitres.length
      });

      // 4. Ajouter la nouvelle section au cours
      cours.sections.push(nouvelleSection as any);

      // 5. Sauvegarder le cours
      const coursEnregistre = await cours.save();

      console.log(`   ✅ Section ajoutée avec succès au cours`);
      console.log(`   📊 Nombre total de sections: ${coursEnregistre.sections.length}`);

      // 6. Retourner le cours mis à jour
      return await this.transformerEnReponse(coursEnregistre);

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      console.error('❌ Erreur lors de l\'ajout de la section:', error);
             throw new BadRequestException('Erreur lors de l\'ajout de la section');
     }
   }

  /**
   * Ajouter un chapitre à une section spécifique d'un cours
   * @param coursId ID du cours
   * @param sectionId ID de la section
   * @param addChapitreDto Données du chapitre à ajouter
   * @param userId ID de l'utilisateur (pour vérifier les permissions)
   * @returns Cours mis à jour avec le nouveau chapitre
   */
  async ajouterChapitreASection(
    coursId: string, 
    sectionId: string, 
    addChapitreDto: AddChapitreToSectionDto, 
    userId: string
  ): Promise<CoursResponseDto> {
    console.log('🔧 DEBUG - Début ajouterChapitreASection');
    console.log(`   📋 Cours ID: ${coursId}`);
    console.log(`   📑 Section ID: ${sectionId}`);
    console.log(`   👤 User ID: ${userId}`);
    console.log(`   📝 Chapitre à ajouter:`, addChapitreDto);

    try {
      // 1. Vérifier que le cours existe
      const cours = await this.coursModel.findById(coursId);
      if (!cours) {
        throw new NotFoundException('Cours non trouvé');
      }

      console.log(`   ✅ Cours trouvé: ${cours.titre}`);
      console.log(`   🏢 Community ID: ${cours.communityId}`);

      // 2. Vérifier que l'utilisateur est admin de la communauté
      await this.verifierAdminCommunaute(userId, cours.communityId.toString());

      console.log('   ✅ Utilisateur autorisé');

      // 3. Trouver la section dans le cours
      const section = cours.sections.find(s => s.id === sectionId);
      if (!section) {
        throw new NotFoundException('Section non trouvée dans ce cours');
      }

      console.log(`   ✅ Section trouvée: ${section.titre}`);
      console.log(`   📚 Chapitres actuels: ${section.chapitres?.length || 0}`);

      // 4. Construire le nouveau chapitre
      const nouveauChapitre = {
        id: new Types.ObjectId().toString(),
        titre: addChapitreDto.titre,
        contenu: addChapitreDto.description,
        videoUrl: addChapitreDto.videoUrl,
        duree: addChapitreDto.duree ? this.convertirDureeEnMinutes(addChapitreDto.duree) : undefined,
        sectionId: sectionId,
        ordre: addChapitreDto.ordre,
        isPreview: !addChapitreDto.isPaid,
        prix: addChapitreDto.isPaid ? cours.prix : 0,
        isPaidChapter: addChapitreDto.isPaid,
        notes: addChapitreDto.notes,
        ressources: [],
        createdAt: new Date()
      };

      console.log('   🏗️ Nouveau chapitre construit:', {
        id: nouveauChapitre.id,
        titre: nouveauChapitre.titre,
        ordre: nouveauChapitre.ordre,
        duree: nouveauChapitre.duree,
        isPaid: addChapitreDto.isPaid
      });

      // 5. Ajouter le nouveau chapitre à la section
      if (!section.chapitres) {
        section.chapitres = [];
      }
      section.chapitres.push(nouveauChapitre as any);

      // 6. Sauvegarder le cours
      const coursEnregistre = await cours.save();

      console.log(`   ✅ Chapitre ajouté avec succès à la section`);
      console.log(`   📊 Nombre total de chapitres dans la section: ${section.chapitres.length}`);

      // 7. Retourner le cours mis à jour
      return await this.transformerEnReponse(coursEnregistre);

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      console.error('❌ Erreur lors de l\'ajout du chapitre:', error);
      throw new BadRequestException('Erreur lors de l\'ajout du chapitre');
    }
  }

  /**
   * Supprimer une section d'un cours
   * @param coursId ID du cours
   * @param sectionId ID de la section à supprimer
   * @param userId ID de l'utilisateur (pour vérifier les permissions)
   * @returns Cours mis à jour sans la section supprimée
   */
  async supprimerSection(coursId: string, sectionId: string, userId: string): Promise<CoursResponseDto> {
    console.log('🔧 DEBUG - Début supprimerSection');
    console.log(`   📋 Cours ID: ${coursId}`);
    console.log(`   📑 Section ID: ${sectionId}`);
    console.log(`   👤 User ID: ${userId}`);

    try {
      // 1. Vérifier que le cours existe
      const cours = await this.coursModel.findById(coursId);
      if (!cours) {
        throw new NotFoundException('Cours non trouvé');
      }

      console.log(`   ✅ Cours trouvé: ${cours.titre}`);
      console.log(`   🏢 Community ID: ${cours.communityId}`);

      // 2. Vérifier que l'utilisateur est admin de la communauté
      await this.verifierAdminCommunaute(userId, cours.communityId.toString());

      console.log('   ✅ Utilisateur autorisé');

      // 3. Trouver et supprimer la section
      const sectionIndex = cours.sections.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) {
        throw new NotFoundException('Section non trouvée dans ce cours');
      }

      const sectionSupprimee = cours.sections[sectionIndex];
      console.log(`   ✅ Section trouvée: ${sectionSupprimee.titre}`);
      console.log(`   📚 Chapitres à supprimer: ${sectionSupprimee.chapitres?.length || 0}`);

      // 4. Supprimer la section
      cours.sections.splice(sectionIndex, 1);

      // 5. Sauvegarder le cours
      const coursEnregistre = await cours.save();

      console.log(`   ✅ Section supprimée avec succès`);
      console.log(`   📊 Nombre total de sections restantes: ${coursEnregistre.sections.length}`);

      // 6. Retourner le cours mis à jour
      return await this.transformerEnReponse(coursEnregistre);

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      console.error('❌ Erreur lors de la suppression de la section:', error);
      throw new BadRequestException('Erreur lors de la suppression de la section');
    }
  }

  /**
   * Supprimer un chapitre d'une section spécifique d'un cours
   * @param coursId ID du cours
   * @param sectionId ID de la section
   * @param chapitreId ID du chapitre à supprimer
   * @param userId ID de l'utilisateur (pour vérifier les permissions)
   * @returns Cours mis à jour sans le chapitre supprimé
   */
  async supprimerChapitre(
    coursId: string, 
    sectionId: string, 
    chapitreId: string, 
    userId: string
  ): Promise<CoursResponseDto> {
    console.log('🔧 DEBUG - Début supprimerChapitre');
    console.log(`   📋 Cours ID: ${coursId}`);
    console.log(`   📑 Section ID: ${sectionId}`);
    console.log(`   📄 Chapitre ID: ${chapitreId}`);
    console.log(`   👤 User ID: ${userId}`);

    try {
      // 1. Vérifier que le cours existe
      const cours = await this.coursModel.findById(coursId);
      if (!cours) {
        throw new NotFoundException('Cours non trouvé');
      }

      console.log(`   ✅ Cours trouvé: ${cours.titre}`);
      console.log(`   🏢 Community ID: ${cours.communityId}`);

      // 2. Vérifier que l'utilisateur est admin de la communauté
      await this.verifierAdminCommunaute(userId, cours.communityId.toString());

      console.log('   ✅ Utilisateur autorisé');

      // 3. Trouver la section dans le cours
      const section = cours.sections.find(s => s.id === sectionId);
      if (!section) {
        throw new NotFoundException('Section non trouvée dans ce cours');
      }

      console.log(`   ✅ Section trouvée: ${section.titre}`);
      console.log(`   📚 Chapitres actuels: ${section.chapitres?.length || 0}`);

      // 4. Trouver et supprimer le chapitre
      if (!section.chapitres) {
        throw new NotFoundException('Aucun chapitre dans cette section');
      }

      const chapitreIndex = section.chapitres.findIndex(c => c.id === chapitreId);
      if (chapitreIndex === -1) {
        throw new NotFoundException('Chapitre non trouvé dans cette section');
      }

      const chapitreSupprime = section.chapitres[chapitreIndex];
      console.log(`   ✅ Chapitre trouvé: ${chapitreSupprime.titre}`);

      // 5. Supprimer le chapitre
      section.chapitres.splice(chapitreIndex, 1);

      // 6. Sauvegarder le cours
      const coursEnregistre = await cours.save();

      console.log(`   ✅ Chapitre supprimé avec succès`);
      console.log(`   📊 Nombre total de chapitres restants dans la section: ${section.chapitres.length}`);

      // 7. Retourner le cours mis à jour
      return await this.transformerEnReponse(coursEnregistre);

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      console.error('❌ Erreur lors de la suppression du chapitre:', error);
      throw new BadRequestException('Erreur lors de la suppression du chapitre');
    }
  }

  /**
   * Fonction utilitaire pour convertir durée "HH:MM" en minutes
   * @param dureeStr Durée au format "HH:MM"
   * @returns Durée en minutes
   */
  private convertirDureeEnMinutes(dureeStr: string): number {
    if (!dureeStr) return 0;
    const parts = dureeStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      return minutes;
    }
    return parseInt(dureeStr) || 0;
  }
  /**
   * Mettre à jour le thumbnail d'un cours
   * @param coursId ID du cours
   * @param thumbnailUrl Nouvelle URL du thumbnail
   * @param userId ID de l'utilisateur (pour vérifier les permissions)
   * @returns Cours mis à jour
   */
  async mettreAJourThumbnail(coursId: string, thumbnailUrl: string, userId: string): Promise<CoursResponseDto> {
    console.log('🔧 DEBUG - Début mettreAJourThumbnail');
    console.log(`   📋 Cours ID: ${coursId}`);
    console.log(`   🖼️ Thumbnail URL: ${thumbnailUrl}`);
    console.log(`   👤 User ID: ${userId}`);

    try {
      // 1. Vérifier que le cours existe
      const cours = await this.coursModel.findById(coursId);
      if (!cours) {
        throw new NotFoundException('Cours non trouvé');
      }

      // 2. Vérifier que l'utilisateur est admin de la communauté
      await this.verifierAdminCommunaute(userId, cours.communityId.toString());

      // 3. Mettre à jour le thumbnail
      cours.thumbnail = thumbnailUrl;
      const coursEnregistre = await cours.save();

      console.log('   ✅ Thumbnail mis à jour avec succès');

      return await this.transformerEnReponse(coursEnregistre);

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      console.error('❌ Erreur lors de la mise à jour du thumbnail:', error);
      throw new BadRequestException('Erreur lors de la mise à jour du thumbnail');
    }
  }

  /**
   * Mettre à jour l'URL vidéo d'un chapitre
   * @param coursId ID du cours
   * @param sectionId ID de la section
   * @param chapitreId ID du chapitre
   * @param videoUrl Nouvelle URL de la vidéo
   * @param userId ID de l'utilisateur (pour vérifier les permissions)
   * @returns Cours mis à jour
   */
  async mettreAJourVideoUrl(
    coursId: string, 
    sectionId: string, 
    chapitreId: string, 
    videoUrl: string, 
    userId: string
  ): Promise<CoursResponseDto> {
    console.log('🔧 DEBUG - Début mettreAJourVideoUrl');
    console.log(`   📋 Cours ID: ${coursId}`);
    console.log(`   📑 Section ID: ${sectionId}`);
    console.log(`   📄 Chapitre ID: ${chapitreId}`);
    console.log(`   🎥 Video URL: ${videoUrl}`);
    console.log(`   👤 User ID: ${userId}`);

    try {
      // 1. Vérifier que le cours existe
      const cours = await this.coursModel.findById(coursId);
      if (!cours) {
        throw new NotFoundException('Cours non trouvé');
      }

      // 2. Vérifier que l'utilisateur est admin de la communauté
      await this.verifierAdminCommunaute(userId, cours.communityId.toString());

      // 3. Trouver la section
      const section = cours.sections.find(s => s.id === sectionId);
      if (!section) {
        throw new NotFoundException('Section non trouvée dans ce cours');
      }

      // 4. Trouver le chapitre
      const chapitre = section.chapitres.find(c => c.id === chapitreId);
      if (!chapitre) {
        throw new NotFoundException('Chapitre non trouvé dans cette section');
      }

      // 5. Mettre à jour l'URL vidéo
      chapitre.videoUrl = videoUrl;
      const coursEnregistre = await cours.save();

      console.log('   ✅ URL vidéo mise à jour avec succès');

      return await this.transformerEnReponse(coursEnregistre);

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      console.error('❌ Erreur lors de la mise à jour de l\'URL vidéo:', error);
      throw new BadRequestException('Erreur lors de la mise à jour de l\'URL vidéo');
    }
  }

  /**
   * Ajouter une ressource à un chapitre
   * @param coursId ID du cours
   * @param sectionId ID de la section
   * @param chapitreId ID du chapitre
   * @param ressource Données de la ressource
   * @param userId ID de l'utilisateur (pour vérifier les permissions)
   * @returns Cours mis à jour
   */
  async ajouterRessourceAChapitre(
    coursId: string, 
    sectionId: string, 
    chapitreId: string, 
    ressource: any, 
    userId: string
  ): Promise<CoursResponseDto> {
    console.log('🔧 DEBUG - Début ajouterRessourceAChapitre');
    console.log(`   📋 Cours ID: ${coursId}`);
    console.log(`   📑 Section ID: ${sectionId}`);
    console.log(`   📄 Chapitre ID: ${chapitreId}`);
    console.log(`   📎 Ressource:`, ressource);
    console.log(`   👤 User ID: ${userId}`);

    try {
      // 1. Vérifier que le cours existe
      const cours = await this.coursModel.findById(coursId);
      if (!cours) {
        throw new NotFoundException('Cours non trouvé');
      }

      // 2. Vérifier que l'utilisateur est admin de la communauté
      await this.verifierAdminCommunaute(userId, cours.communityId.toString());

      // 3. Trouver la section
      const section = cours.sections.find(s => s.id === sectionId);
      if (!section) {
        throw new NotFoundException('Section non trouvée dans ce cours');
      }

      // 4. Trouver le chapitre
      const chapitre = section.chapitres.find(c => c.id === chapitreId);
      if (!chapitre) {
        throw new NotFoundException('Chapitre non trouvé dans cette section');
      }

      // 5. Créer la nouvelle ressource
      const nouvelleRessource = {
        id: new Types.ObjectId().toString(),
        titre: ressource.titre,
        type: ressource.type,
        url: ressource.url,
        description: ressource.description,
        ordre: ressource.ordre
      };

      // 6. Ajouter la ressource au chapitre
      if (!chapitre.ressources) {
        chapitre.ressources = [];
      }
      chapitre.ressources.push(nouvelleRessource as any);

      // 7. Trier les ressources par ordre
      chapitre.ressources.sort((a, b) => a.ordre - b.ordre);

      const coursEnregistre = await cours.save();

      console.log('   ✅ Ressource ajoutée avec succès');

      return await this.transformerEnReponse(coursEnregistre);

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      console.error('❌ Erreur lors de l\'ajout de la ressource:', error);
      throw new BadRequestException('Erreur lors de l\'ajout de la ressource');
    }
  }

  /**
   * Vérifier les permissions pour un cours (utilisé pour la suppression de fichiers)
   * @param coursId ID du cours
   * @param userId ID de l'utilisateur
   * @returns True si autorisé
   */
  async verifierPermissionsCours(coursId: string, userId: string): Promise<boolean> {
    const cours = await this.coursModel.findById(coursId);
    if (!cours) {
      throw new NotFoundException('Cours non trouvé');
    }

    // Vérifier que l'utilisateur est admin de la communauté du cours
    await this.verifierAdminCommunaute(userId, cours.communityId.toString());
    
    return true;
  }

  /**
   * Créer un cours avec fichiers intégrés
   * @param createCoursDto Données du cours
   * @param uploadedFiles Fichiers uploadés traités
   * @param userId ID de l'utilisateur
   * @returns Cours créé avec fichiers
   */
  async creerCoursAvecFichiers(
    createCoursDto: CreateCoursDto, 
    uploadedFiles: { thumbnail?: string; videos: any; ressources: any }, 
    userId: string
  ): Promise<CoursResponseDto> {
    console.log('🚀 Création de cours avec fichiers intégrés');
    console.log('   Thumbnail:', uploadedFiles.thumbnail);
    console.log('   Vidéos:', Object.keys(uploadedFiles.videos).length);
    console.log('   Ressources:', Object.keys(uploadedFiles.ressources).length);

    // Intégrer le thumbnail dans les données du cours
    const coursDataAvecThumbnail = {
      ...createCoursDto,
      thumbnail: uploadedFiles.thumbnail || createCoursDto.thumbnail
    };

    // Créer une map temporaire pour les ressources par chapitre
    const tempRessourcesMap = new Map<string, Array<{ url: string; titre: string; type: string }>>();

    // Intégrer les URLs des vidéos et ressources dans les chapitres
    if (coursDataAvecThumbnail.sections) {
      coursDataAvecThumbnail.sections.forEach((section, sIndex) => {
        section.chapitres.forEach((chapitre, cIndex) => {
          // Chercher une vidéo pour ce chapitre (index ou 'default')
          const videoKey = `${sIndex}-${cIndex}`;
          const videoUrl = uploadedFiles.videos[videoKey] || uploadedFiles.videos['default'];
          if (videoUrl) {
            chapitre.videoUrl = videoUrl;
            console.log(`📹 Vidéo assignée au chapitre ${cIndex} de la section ${sIndex}: ${videoUrl}`);
          }

          // Pour les ressources, on les stocke dans la map temporaire
          // NOTE: on NE FAIT PLUS de fallback vers 'default' ici afin d'éviter
          // la duplication des ressources "par défaut" sur chaque chapitre.
          // Les ressources "par défaut" seront ajoutées au niveau du cours.
          const ressourcesKey = `${sIndex}-${cIndex}`;
          const ressources = uploadedFiles.ressources[ressourcesKey];
          if (ressources && ressources.length > 0) {
            console.log(`📄 ${ressources.length} ressource(s) trouvée(s) pour chapitre ${cIndex} de section ${sIndex}`);
            const chapitreKey = `${sIndex}-${cIndex}`;
            tempRessourcesMap.set(chapitreKey, ressources);
          }
        });
      });
    }

    // Créer le cours de base
    const cours = await this.creerCours(coursDataAvecThumbnail, userId);

    // Ajouter les ressources aux chapitres après création
    await this.ajouterRessourcesAuxChapitres(cours, uploadedFiles.ressources);

    // Ajouter les ressources temporaires stockées dans la map
    for (const [sectionIndex, section] of cours.sections.entries()) {
      for (const [chapitreIndex, chapitre] of section.chapitres.entries()) {
        const chapitreKey = `${sectionIndex}-${chapitreIndex}`;
        const tempRessources = tempRessourcesMap.get(chapitreKey);
        
        if (tempRessources && tempRessources.length > 0) {
          console.log(`💾 Ajout de ${tempRessources.length} ressource(s) au chapitre ${chapitre.titre}`);
          
          for (const ressource of tempRessources) {
            const nouvellRessource = {
              titre: ressource.titre,
              description: ressource.titre, // Utiliser le titre comme description par défaut
              url: ressource.url,
              type: ressource.type,
              ordre: chapitre.ressources ? chapitre.ressources.length + 1 : 1
            };
            
            try {
              const coursUpdated = await this.ajouterRessourceAChapitre(
                cours.id, 
                section.id, 
                chapitre.id, 
                nouvellRessource, 
                userId
              );
              // Mettre à jour les ressources localement
              if (coursUpdated) {
                const updatedSection = coursUpdated.sections.find(s => s.id === section.id);
                const updatedChapitre = updatedSection?.chapitres.find(c => c.id === chapitre.id);
                if (updatedChapitre) {
                  chapitre.ressources = updatedChapitre.ressources;
                }
              }
            } catch (error) {
              console.error(`❌ Erreur ajout ressource ${ressource.titre}:`, error.message);
            }
          }
        }
      }
    }

    // Traiter les ressources "par défaut" comme ressources de COURS (niveau global)
    try {
      const courseLevelRessources = uploadedFiles.ressources?.course || uploadedFiles.ressources?.default;
      if (courseLevelRessources && courseLevelRessources.length > 0) {
        const coursDoc = await this.coursModel.findOne({ id: cours.id });
        if (coursDoc) {
          const ressourcesList: any[] = Array.isArray(coursDoc.ressources) ? (coursDoc.ressources as any[]) : [];
          const existingCount = ressourcesList.length;
          for (let i = 0; i < courseLevelRessources.length; i++) {
            const res = courseLevelRessources[i];
            ressourcesList.push({
              id: new Types.ObjectId().toString(),
              titre: res.titre,
              type: res.type,
              url: res.url,
              description: res.titre,
              ordre: existingCount + i + 1
            } as any);
          }
          (coursDoc as any).ressources = ressourcesList;
          await coursDoc.save();
        }
      }
    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout des ressources de cours (niveau global):', err);
    }

    // Recharger et retourner la version finale complète du cours
    try {
      const finalDoc = await this.coursModel.findOne({ id: cours.id });
      if (finalDoc) {
        return await this.transformerEnReponse(finalDoc);
      }
    } catch (err) {
      console.error('❌ Erreur lors du rechargement du cours final:', err);
    }

    return cours;
  }

  /**
   * Ajouter un chapitre avec fichiers
   * @param coursId ID du cours
   * @param sectionId ID de la section
   * @param addChapitreDto Données du chapitre
   * @param uploadedFiles Fichiers uploadés
   * @param userId ID de l'utilisateur
   * @returns Cours mis à jour
   */
  async ajouterChapitreASectionAvecFichiers(
    coursId: string, 
    sectionId: string, 
    addChapitreDto: AddChapitreToSectionDto, 
    uploadedFiles: { thumbnail?: string; videos: any; ressources: any }, 
    userId: string
  ): Promise<CoursResponseDto> {
    // Intégrer la vidéo dans les données du chapitre
    const chapitreAvecVideo = {
      ...addChapitreDto,
      videoUrl: uploadedFiles.videos['default'] || addChapitreDto.videoUrl
    };

    // Ajouter le chapitre de base
    const cours = await this.ajouterChapitreASection(coursId, sectionId, chapitreAvecVideo, userId);

    // Ajouter les ressources si présentes
    if (uploadedFiles.ressources['default']) {
      const section = cours.sections.find(s => s.id === sectionId);
      if (section) {
        const chapitre = section.chapitres[section.chapitres.length - 1]; // Dernier chapitre ajouté
        
        for (const ressource of uploadedFiles.ressources['default']) {
          await this.ajouterRessourceAChapitre(
            coursId, 
            sectionId, 
            chapitre.id, 
            ressource, 
            userId
          );
        }
      }
    }

    return cours;
  }

  /**
   * Ajouter une section avec fichiers
   * @param coursId ID du cours
   * @param addSectionDto Données de la section
   * @param uploadedFiles Fichiers uploadés
   * @param userId ID de l'utilisateur
   * @returns Cours mis à jour
   */
  async ajouterSectionAvecFichiers(
    coursId: string, 
    addSectionDto: AddSectionDto, 
    uploadedFiles: { thumbnail?: string; videos: any; ressources: any }, 
    userId: string
  ): Promise<CoursResponseDto> {
    // Intégrer les vidéos dans les chapitres de la section
    if (addSectionDto.chapitres) {
      addSectionDto.chapitres.forEach((chapitre, index) => {
        const videoKey = index.toString();
        if (uploadedFiles.videos[videoKey]) {
          chapitre.videoUrl = uploadedFiles.videos[videoKey];
        }
      });
    }

    // Ajouter la section de base
    const cours = await this.ajouterSection(coursId, addSectionDto, userId);

    // Ajouter les ressources aux chapitres
    if (addSectionDto.chapitres) {
      for (let i = 0; i < addSectionDto.chapitres.length; i++) {
        const ressourcesKey = i.toString();
        if (uploadedFiles.ressources[ressourcesKey]) {
          const section = cours.sections[cours.sections.length - 1]; // Dernière section ajoutée
          const chapitre = section.chapitres[i];
          
          for (const ressource of uploadedFiles.ressources[ressourcesKey]) {
            await this.ajouterRessourceAChapitre(
              coursId, 
              section.id, 
              chapitre.id, 
              ressource, 
              userId
            );
          }
        }
      }
    }

    return cours;
  }

  /**
   * Ajouter des ressources aux chapitres après création du cours
   */
  private async ajouterRessourcesAuxChapitres(
    cours: CoursResponseDto, 
    ressources: { [key: string]: Array<{ url: string; titre: string; type: string }> }
  ): Promise<void> {
    for (const [key, ressourcesList] of Object.entries(ressources)) {
      const [sectionIndex, chapitreIndex] = key.split('-').map(Number);
      
      if (cours.sections[sectionIndex] && cours.sections[sectionIndex].chapitres[chapitreIndex]) {
        const section = cours.sections[sectionIndex];
        const chapitre = section.chapitres[chapitreIndex];
        
        for (const ressource of ressourcesList) {
          // Ici on pourrait appeler ajouterRessourceAChapitre si nécessaire
          // Pour l'instant on les intègre directement
        }
      }
    }
  }

  /**
   * Vérifier si un utilisateur peut accéder à un chapitre (gratuit ou payant)
   * @param coursId ID du cours
   * @param chapitreId ID du chapitre
   * @param userId ID de l'utilisateur
   * @returns Informations sur l'accès au chapitre
   */
  async verifierAccesChapitre(coursId: string, chapitreId: string, userId: string): Promise<{
    canAccess: boolean;
    reason?: string;
    isPaidChapter: boolean;
    chapterPrice?: number;
    needsPayment: boolean;
  }> {
    console.log('🔧 DEBUG - verifierAccesChapitre');
    console.log(`   📋 Cours ID: ${coursId}`);
    console.log(`   📄 Chapitre ID: ${chapitreId}`);
    console.log(`   👤 User ID: ${userId}`);

    try {
      // 1. Récupérer le cours avec ses sections et chapitres
      const cours = await this.coursModel.findById(coursId);
      if (!cours) {
        throw new NotFoundException('Cours non trouvé');
      }

      // 2. Trouver le chapitre dans toutes les sections
      let chapitre: any = null;
      let section: any = null;
      
      for (const s of cours.sections) {
        const ch = s.chapitres.find((c: any) => c.id === chapitreId);
        if (ch) {
          chapitre = ch;
          section = s;
          break;
        }
      }

      if (!chapitre) {
        throw new NotFoundException('Chapitre non trouvé');
      }

      console.log(`   ✅ Chapitre trouvé: "${chapitre.titre}"`);
      console.log(`   💰 Chapitre payant: ${chapitre.isPaidChapter}`);
      console.log(`   💵 Prix du chapitre: ${chapitre.prix || 0}`);

      // 3. Si le chapitre est gratuit (preview), l'accès est autorisé
      if (chapitre.isPreview || !chapitre.isPaidChapter) {
        console.log('   ✅ Accès autorisé - Chapitre gratuit');
        return {
          canAccess: true,
          isPaidChapter: false,
          needsPayment: false
        };
      }

      // 4. Si le cours est gratuit, accorder l'accès aux membres de la communauté sans inscription
      if ((cours.prix || 0) === 0) {
        const community = await this.communityModel.findById(cours.communityId);
        if (community) {
          const isMember = community.members.some(m => m.equals(new Types.ObjectId(userId))) || community.createur.equals(new Types.ObjectId(userId)) || community.admins.some(a => a.equals(new Types.ObjectId(userId)));
          if (isMember) {
            console.log('   ✅ Accès autorisé - Cours gratuit pour les membres de la communauté');
            return {
              canAccess: true,
              isPaidChapter: true,
              chapterPrice: chapitre.prix,
              needsPayment: false
            };
          }
        }
      }

      // 5. Si le chapitre est payant, vérifier l'inscription au cours
      const inscription = await this.courseEnrollmentModel.findOne({
        userId: new Types.ObjectId(userId),
        courseId: new Types.ObjectId(coursId),
        isActive: true
      });

      if (!inscription) {
        console.log('   ❌ Accès refusé - Non inscrit au cours');
        return {
          canAccess: false,
          reason: 'Vous devez vous inscrire au cours pour accéder à ce chapitre payant',
          isPaidChapter: true,
          chapterPrice: chapitre.prix,
          needsPayment: true
        };
      }

      // 6. Vérifier si l'utilisateur a payé pour ce chapitre spécifique
      // (Pour l'instant, on considère que l'inscription au cours donne accès à tous les chapitres)
      // Dans une implémentation plus avancée, on pourrait avoir un système de paiement par chapitre
      console.log('   ✅ Accès autorisé - Inscrit au cours');
      return {
        canAccess: true,
        isPaidChapter: true,
        chapterPrice: chapitre.prix,
        needsPayment: false
      };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      console.error('❌ Erreur lors de la vérification d\'accès au chapitre:', error);
      throw new BadRequestException('Erreur lors de la vérification d\'accès au chapitre');
    }
  }

  /**
   * S'inscrire à un cours
   * @param coursId ID du cours
   * @param userId ID de l'utilisateur
   * @returns Message de confirmation
   */
  async inscrireAuCours(coursId: string, userId: string, promoCode?: string): Promise<{ message: string; enrollment: any }> {
    console.log('🔧 DEBUG - Début inscrireAuCours');
    console.log(`   📋 Cours ID: ${coursId}`);
    console.log(`   👤 User ID: ${userId}`);

    try {
      // 1. Vérifier que le cours existe et est publié
      const cours = await this.coursModel.findById(coursId);
      if (!cours) {
        throw new NotFoundException('Cours non trouvé');
      }

      if (!cours.isPublished) {
        throw new BadRequestException('Ce cours n\'est pas encore publié');
      }

      console.log(`   ✅ Cours trouvé: ${cours.titre}`);
      console.log(`   🏢 Community ID: ${cours.communityId}`);

      // 2. Standalone purchase: pas d'obligation d'appartenir à la communauté
      const userObjectId = new Types.ObjectId(userId);
      console.log('   ✅ Standalone enrollment autorisé (pas d\'exigence de membership)');

      // 3. Si cours payant, appliquer promo et calculer la commission
      if (cours.prix > 0) {
        let effective = cours.prix;
        let discountDT = 0;
        let appliedCode: string | undefined;
        const buyer = await this.userModel.findById(userId).select('email');
        if (promoCode) {
          const promo = await this.promoService.validateAndApply(promoCode, cours.prix, TrackableContentType.COURSE, cours._id.toString(), buyer?.email || undefined);
          if (promo.valid) {
            effective = promo.finalAmountDT;
            discountDT = promo.discountDT;
            appliedCode = promo.appliedCode;
          }
        }
        const breakdown = await this.feeService.calculateForAmount(effective, cours.creatorId.toString());
        await this.orderModel.create({
          buyerId: userObjectId,
          creatorId: cours.creatorId,
          contentType: TrackableContentType.COURSE,
          contentId: cours._id.toString(),
          amountDT: breakdown.amountDT,
          platformPercent: breakdown.platformPercent,
          platformFixedDT: breakdown.platformFixedDT,
          platformFeeDT: breakdown.platformFeeDT,
          creatorNetDT: breakdown.creatorNetDT,
          promoCode: appliedCode,
          discountDT,
          status: 'paid'
        });
      }

      // 4. Vérifier si l'utilisateur n'est pas déjà inscrit
      const inscriptionExistante = await this.courseEnrollmentModel.findOne({
        userId: userObjectId,
        courseId: new Types.ObjectId(coursId),
        isActive: true
      });

      if (inscriptionExistante) {
        throw new BadRequestException('Vous êtes déjà inscrit à ce cours');
      }

      console.log('   ✅ Aucune inscription existante trouvée');

      // 5. Créer la nouvelle inscription
      const nouvelleInscription = new this.courseEnrollmentModel({
        id: new Types.ObjectId().toString(),
        userId: userObjectId,
        courseId: new Types.ObjectId(coursId),
        enrolledAt: new Date(),
        isActive: true,
        progression: []
      });

      const inscriptionEnregistree = await nouvelleInscription.save();

      console.log(`   ✅ Inscription créée: ${inscriptionEnregistree._id}`);

      // 6. Ajouter la référence de l'inscription au cours
      // 6. Ajouter la référence de l'inscription au cours
      cours.ajouterInscription(inscriptionEnregistree._id);
      await cours.save();

      console.log('   ✅ Référence ajoutée au cours');

      return {
        message: 'Inscription au cours réussie',
        enrollment: {
          id: inscriptionEnregistree.id,
          userId: inscriptionEnregistree.userId.toString(),
          courseId: inscriptionEnregistree.courseId.toString(),
          enrolledAt: inscriptionEnregistree.enrolledAt,
          isActive: inscriptionEnregistree.isActive
        }
      };

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('❌ Erreur lors de l\'inscription au cours:', error);
      throw new BadRequestException('Erreur lors de l\'inscription au cours');
    }
  }

  // ============ TRACKING METHODS ============

  /**
   * Enregistrer une vue d'un cours
   */
  async trackCoursView(coursId: string, userId: string) {
    return await this.trackingService.trackView(userId, coursId, TrackableContentType.COURSE);
  }

  /**
   * Démarrer un cours
   */
  async trackCoursStart(coursId: string, userId: string) {
    return await this.trackingService.trackStart(userId, coursId, TrackableContentType.COURSE);
  }

  /**
   * Marquer un cours comme terminé
   */
  async trackCoursComplete(coursId: string, userId: string) {
    return await this.trackingService.trackComplete(userId, coursId, TrackableContentType.COURSE);
  }

  /**
   * Mettre à jour le temps de visionnage d'un cours
   */
  async updateCoursWatchTime(coursId: string, userId: string, additionalTime: number) {
    return await this.trackingService.updateWatchTime(userId, coursId, TrackableContentType.COURSE, additionalTime);
  }

  /**
   * Enregistrer un like sur un cours
   */
  async trackCoursLike(coursId: string, userId: string) {
    return await this.trackingService.trackLike(userId, coursId, TrackableContentType.COURSE);
  }

  /**
   * Enregistrer un partage d'un cours
   */
  async trackCoursShare(coursId: string, userId: string) {
    return await this.trackingService.trackShare(userId, coursId, TrackableContentType.COURSE);
  }

  /**
   * Enregistrer un téléchargement d'un cours
   */
  async trackCoursDownload(coursId: string, userId: string) {
    return await this.trackingService.trackDownload(userId, coursId, TrackableContentType.COURSE);
  }

  /**
   * Ajouter un bookmark d'un cours
   */
  async addCoursBookmark(coursId: string, userId: string, bookmarkId: string) {
    return await this.trackingService.addBookmark(userId, coursId, TrackableContentType.COURSE, bookmarkId);
  }

  /**
   * Retirer un bookmark d'un cours
   */
  async removeCoursBookmark(coursId: string, userId: string, bookmarkId: string) {
    return await this.trackingService.removeBookmark(userId, coursId, TrackableContentType.COURSE, bookmarkId);
  }

  /**
   * Ajouter une note/évaluation d'un cours
   */
  async addCoursRating(coursId: string, userId: string, rating: number, review?: string) {
    return await this.trackingService.addRating(userId, coursId, TrackableContentType.COURSE, rating, review);
  }

  /**
   * Obtenir la progression d'un utilisateur pour un cours
   */
  async getCoursProgress(coursId: string, userId: string) {
    return await this.trackingService.getProgress(userId, coursId, TrackableContentType.COURSE);
  }

  /**
   * Obtenir les statistiques d'un cours
   */
  async getCoursStats(coursId: string) {
    return await this.trackingService.getContentStats(coursId, TrackableContentType.COURSE);
  }

  /**
   * Obtenir les progressions d'un utilisateur pour tous ses cours
   */
  async getUserCoursProgress(userId: string, page: number = 1, limit: number = 10) {
    return await this.trackingService.getUserProgressByType(userId, TrackableContentType.COURSE, page, limit);
  }

  /**
   * Obtenir les actions récentes d'un utilisateur sur les cours
   */
  async getUserCoursRecentActions(userId: string, limit: number = 20) {
    return await this.trackingService.getUserRecentActions(userId, TrackableContentType.COURSE, limit);
  }

  // ============ SEQUENTIAL PROGRESSION METHODS ============

  /**
   * Activer ou désactiver la progression séquentielle d'un cours
   * @param coursId ID du cours
   * @param enabled Activer ou désactiver
   * @param unlockMessage Message personnalisé pour les chapitres verrouillés
   * @param userId ID de l'utilisateur (pour vérifier les permissions)
   * @returns Cours mis à jour
   */
  async updateSequentialProgression(
    coursId: string, 
    enabled: boolean, 
    unlockMessage: string | undefined, 
    userId: string
  ): Promise<CoursResponseDto> {
    console.log('🔧 DEBUG - updateSequentialProgression');
    console.log(`   📋 Cours ID: ${coursId}`);
    console.log(`   🔒 Enabled: ${enabled}`);
    console.log(`   💬 Unlock Message: ${unlockMessage}`);
    console.log(`   👤 User ID: ${userId}`);

    try {
      // 1. Vérifier que le cours existe
      const cours = await this.coursModel.findById(coursId);
      if (!cours) {
        throw new NotFoundException('Cours non trouvé');
      }

      // 2. Vérifier que l'utilisateur est admin de la communauté
      await this.verifierAdminCommunaute(userId, cours.communityId.toString());

      // 3. Mettre à jour la progression séquentielle
      if (enabled) {
        cours.activerProgressionSequentielle(unlockMessage);
      } else {
        cours.desactiverProgressionSequentielle();
      }

      const coursEnregistre = await cours.save();

      console.log('   ✅ Progression séquentielle mise à jour avec succès');
      console.log(`   🔒 Sequential Progression: ${coursEnregistre.sequentialProgression}`);

      return await this.transformerEnReponse(coursEnregistre);

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      console.error('❌ Erreur lors de la mise à jour de la progression séquentielle:', error);
      throw new BadRequestException('Erreur lors de la mise à jour de la progression séquentielle');
    }
  }

  /**
   * Vérifier l'accès à un chapitre avec la progression séquentielle
   * @param coursId ID du cours
   * @param chapitreId ID du chapitre
   * @param userId ID de l'utilisateur
   * @returns Informations sur l'accès au chapitre
   */
  async checkChapterAccessWithSequential(
    coursId: string, 
    chapitreId: string, 
    userId: string
  ): Promise<{
    hasAccess: boolean;
    reason: string;
    requiredChapter?: {
      id: string;
      titre: string;
      ordre: number;
      sectionId: string;
    };
    unlockMessage?: string;
    nextChapter?: {
      id: string;
      titre: string;
      ordre: number;
      sectionId: string;
    };
  }> {
    console.log('🔧 DEBUG - checkChapterAccessWithSequential');
    console.log(`   📋 Cours ID: ${coursId}`);
    console.log(`   📄 Chapitre ID: ${chapitreId}`);
    console.log(`   👤 User ID: ${userId}`);

    try {
      // 1. Récupérer le cours
      const cours = await this.coursModel.findById(coursId);
      if (!cours) {
        throw new NotFoundException('Cours non trouvé');
      }

      // 2. Récupérer l'inscription de l'utilisateur
      const enrollment = await this.courseEnrollmentModel.findOne({
        userId: new Types.ObjectId(userId),
        courseId: new Types.ObjectId(coursId),
        isActive: true
      });

      if (!enrollment) {
        throw new NotFoundException('Utilisateur non inscrit à ce cours');
      }

      // 3. Utiliser la méthode du schéma pour vérifier l'accès
      const accessCheck = cours.verifierAccesChapitre(chapitreId, enrollment.progression || []);

      // 4. Obtenir le chapitre suivant si disponible
      const nextChapter = cours.obtenirChapitreSuivant(chapitreId);

      console.log('   ✅ Vérification d\'accès terminée');
      console.log(`   🔓 Has Access: ${accessCheck.hasAccess}`);
      console.log(`   📝 Reason: ${accessCheck.reason}`);

      return {
        hasAccess: accessCheck.hasAccess,
        reason: accessCheck.reason,
        requiredChapter: accessCheck.requiredChapter ? {
          id: accessCheck.requiredChapter.id,
          titre: accessCheck.requiredChapter.titre,
          ordre: accessCheck.requiredChapter.ordre,
          sectionId: accessCheck.requiredChapter.sectionId
        } : undefined,
        unlockMessage: cours.unlockMessage,
        nextChapter: nextChapter ? {
          id: nextChapter.id,
          titre: nextChapter.titre,
          ordre: nextChapter.ordre,
          sectionId: nextChapter.sectionId
        } : undefined
      };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      console.error('❌ Erreur lors de la vérification d\'accès au chapitre:', error);
      throw new BadRequestException('Erreur lors de la vérification d\'accès au chapitre');
    }
  }

  /**
   * Obtenir les chapitres déverrouillés pour un utilisateur
   * @param coursId ID du cours
   * @param userId ID de l'utilisateur
   * @returns Liste des chapitres déverrouillés
   */
  async getUnlockedChapters(coursId: string, userId: string): Promise<{
    unlockedChapters: Array<{
      id: string;
      titre: string;
      ordre: number;
      sectionId: string;
      sectionTitre: string;
      isCompleted: boolean;
      isUnlocked: boolean;
    }>;
    sequentialProgressionEnabled: boolean;
    unlockMessage?: string;
  }> {
    console.log('🔧 DEBUG - getUnlockedChapters');
    console.log(`   📋 Cours ID: ${coursId}`);
    console.log(`   👤 User ID: ${userId}`);

    try {
      // 1. Récupérer le cours
      const cours = await this.coursModel.findById(coursId);
      if (!cours) {
        throw new NotFoundException('Cours non trouvé');
      }

      // 2. Récupérer l'inscription de l'utilisateur
      const enrollment = await this.courseEnrollmentModel.findOne({
        userId: new Types.ObjectId(userId),
        courseId: new Types.ObjectId(coursId),
        isActive: true
      });

      if (!enrollment) {
        throw new NotFoundException('Utilisateur non inscrit à ce cours');
      }

      // 3. Construire la liste des chapitres avec leur statut
      const unlockedChapters: Array<{
        id: string;
        titre: string;
        ordre: number;
        sectionId: string;
        sectionTitre: string;
        isCompleted: boolean;
        isUnlocked: boolean;
      }> = [];

      // Trier les sections par ordre
      const sectionsTriees = [...cours.sections].sort((a, b) => a.ordre - b.ordre);

      for (const section of sectionsTriees) {
        // Trier les chapitres par ordre
        const chapitresTries = [...section.chapitres].sort((a, b) => a.ordre - b.ordre);

        for (const chapitre of chapitresTries) {
          // Vérifier si le chapitre est complété
          const progression = enrollment.progression.find(p => p.chapterId === chapitre.id);
          const isCompleted = progression?.isCompleted || false;

          // Vérifier si le chapitre est déverrouillé
          let isUnlocked = true;
          if (cours.sequentialProgression) {
            const accessCheck = cours.verifierAccesChapitre(chapitre.id, enrollment.progression || []);
            isUnlocked = accessCheck.hasAccess;
          }

          unlockedChapters.push({
            id: chapitre.id,
            titre: chapitre.titre,
            ordre: chapitre.ordre,
            sectionId: chapitre.sectionId,
            sectionTitre: section.titre,
            isCompleted,
            isUnlocked
          });
        }
      }

      console.log(`   ✅ ${unlockedChapters.length} chapitres analysés`);
      console.log(`   🔓 ${unlockedChapters.filter(c => c.isUnlocked).length} chapitres déverrouillés`);

      return {
        unlockedChapters,
        sequentialProgressionEnabled: cours.sequentialProgression,
        unlockMessage: cours.unlockMessage
      };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      console.error('❌ Erreur lors de la récupération des chapitres déverrouillés:', error);
      throw new BadRequestException('Erreur lors de la récupération des chapitres déverrouillés');
    }
  }

  /**
   * Déverrouiller manuellement un chapitre (pour les créateurs/admins)
   * @param coursId ID du cours
   * @param chapitreId ID du chapitre à déverrouiller
   * @param userId ID de l'utilisateur cible
   * @param creatorId ID du créateur/admin qui effectue l'action
   * @returns Message de confirmation
   */
  async unlockChapterManually(
    coursId: string, 
    chapitreId: string, 
    userId: string, 
    creatorId: string
  ): Promise<{ message: string }> {
    console.log('🔧 DEBUG - unlockChapterManually');
    console.log(`   📋 Cours ID: ${coursId}`);
    console.log(`   📄 Chapitre ID: ${chapitreId}`);
    console.log(`   👤 Target User ID: ${userId}`);
    console.log(`   👨‍💼 Creator ID: ${creatorId}`);

    try {
      // 1. Vérifier que le cours existe
      const cours = await this.coursModel.findById(coursId);
      if (!cours) {
        throw new NotFoundException('Cours non trouvé');
      }

      // 2. Vérifier que le créateur est admin de la communauté
      await this.verifierAdminCommunaute(creatorId, cours.communityId.toString());

      // 3. Récupérer l'inscription de l'utilisateur
      const enrollment = await this.courseEnrollmentModel.findOne({
        userId: new Types.ObjectId(userId),
        courseId: new Types.ObjectId(coursId),
        isActive: true
      });

      if (!enrollment) {
        throw new NotFoundException('Utilisateur non inscrit à ce cours');
      }

      // 4. Créer ou mettre à jour la progression pour ce chapitre
      let progression = enrollment.progression.find(p => p.chapterId === chapitreId);
      
      if (!progression) {
        progression = {
          id: new Types.ObjectId().toString(),
          enrollmentId: enrollment._id,
          chapterId: chapitreId,
          isCompleted: false,
          watchTime: 0,
          lastAccessedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        enrollment.progression.push(progression as any);
      }

      // 5. Marquer le chapitre comme accessible (mais pas forcément complété)
      progression.lastAccessedAt = new Date();
      progression.updatedAt = new Date();
      await enrollment.save();

      console.log('   ✅ Chapitre déverrouillé manuellement avec succès');

      return {
        message: 'Chapitre déverrouillé avec succès'
      };

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      console.error('❌ Erreur lors du déverrouillage manuel du chapitre:', error);
      throw new BadRequestException('Erreur lors du déverrouillage manuel du chapitre');
    }
  }
} 