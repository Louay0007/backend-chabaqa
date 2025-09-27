import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Sous-schéma pour les ressources d'une session
 */
@Schema({ _id: false })
export class SessionResource {
  @Prop({
    required: true,
    type: String
  })
  id: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 200
  })
  title: string;

  @Prop({
    required: true,
    enum: ['video', 'article', 'code', 'tool', 'pdf', 'link'],
    type: String
  })
  type: 'video' | 'article' | 'code' | 'tool' | 'pdf' | 'link';

  @Prop({
    required: true,
    trim: true
  })
  url: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 1000
  })
  description: string;

  @Prop({
    required: true,
    type: Number,
    min: 0
  })
  order: number;
}

export const SessionResourceSchema = SchemaFactory.createForClass(SessionResource);

/**
 * Sous-schéma pour les réservations de session
 */
@Schema({ _id: false })
export class SessionBooking {
  @Prop({
    required: true,
    type: String
  })
  id: string;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'User'
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    type: Date
  })
  scheduledAt: Date;

  @Prop({
    required: true,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    type: String,
    default: 'pending'
  })
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';

  @Prop({
    trim: true
  })
  meetingUrl?: string;

  @Prop({
    trim: true,
    maxlength: 1000
  })
  notes?: string;

  @Prop({
    type: Date,
    default: Date.now
  })
  createdAt: Date;

  @Prop({
    type: Date,
    default: Date.now
  })
  updatedAt: Date;
}

export const SessionBookingSchema = SchemaFactory.createForClass(SessionBooking);

/**
 * Interface pour le document Session
 */
export interface SessionDocument extends Document {
  _id: Types.ObjectId;
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  currency: string;
  pricing?: {
    price: number;
    currency: string;
    priceType: 'free' | 'one-time' | 'monthly' | 'yearly';
    isRecurring: boolean;
    recurringInterval?: 'month' | 'year' | 'week';
    packages: {
      name: string;
      sessionsCount: number;
      price: number;
      discount?: number;
      features: string[];
    }[];
    features: string[];
    paymentOptions: {
      allowInstallments: boolean;
      installmentCount?: number;
      earlyBirdDiscount?: number;
      groupDiscount?: number;
      memberDiscount?: number;
    };
    freeTrialDays?: number;
    trialFeatures?: string[];
  };
  communityId: string;
  creatorId: Types.ObjectId;
  isActive: boolean;
  bookings: SessionBooking[];
  createdAt: Date;
  updatedAt: Date;
  category?: string;
  maxBookingsPerWeek?: number;
  notes?: string;
  resources?: SessionResource[];

  // Méthodes du schéma
  addBooking(booking: SessionBooking): void;
  removeBooking(bookingId: string): void;
  updateBookingStatus(bookingId: string, status: string): void;
  getBooking(bookingId: string): SessionBooking | undefined;
  isTimeSlotAvailable(scheduledAt: Date): boolean;
  getBookingsCount(): number;
  getBookingsThisWeek(): number;
  canBookMore(): boolean;
  addResource(resource: SessionResource): void;
  removeResource(resourceId: string): void;
}

/**
 * Schéma Mongoose pour l'entité Session
 */
@Schema({
  timestamps: true
})
export class Session {
  _id: Types.ObjectId;

  /**
   * ID unique de la session (différent de l'_id MongoDB)
   */
  @Prop({
    required: true,
    type: String
  })
  id: string;

  /**
   * Titre de la session
   */
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 200
  })
  title: string;

  /**
   * Description de la session
   */
  @Prop({
    required: true,
    trim: true,
    maxlength: 2000
  })
  description: string;

  /**
   * Durée de la session en minutes
   */
  @Prop({
    required: true,
    type: Number,
    min: 15,
    max: 480 // 8 heures max
  })
  duration: number;

  /**
   * Prix de la session
   */
  @Prop({
    required: true,
    type: Number,
    min: 0
  })
  price: number;

  /**
   * Devise du prix
   */
  @Prop({
    required: true,
    trim: true,
    enum: ['USD', 'EUR', 'TND'],
    type: String,
    default: 'TND'
  })
  currency: string;

  /**
   * Configuration de prix avancée de la session
   */
  @Prop({
    type: {
      // Prix de base (legacy - keep for backward compatibility)
      price: { type: Number, default: 0, min: 0 },
      currency: { type: String, enum: ['USD', 'EUR', 'TND'], default: 'TND' },
      
      // Type de prix
      priceType: { type: String, enum: ['free', 'one-time', 'monthly', 'yearly'], default: 'free' },
      
      // Produit récurrent
      isRecurring: { type: Boolean, default: false },
      recurringInterval: { type: String, enum: ['month', 'year', 'week'] },
      
      // Packages de sessions
      packages: [{
        name: { type: String, required: true },
        sessionsCount: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        discount: { type: Number, min: 0, max: 100 },
        features: [{ type: String }]
      }],
      
      // Fonctionnalités incluses
      features: [{ type: String }],
      
      // Options de paiement
      paymentOptions: {
        allowInstallments: { type: Boolean, default: false },
        installmentCount: { type: Number, min: 2, max: 12 },
        earlyBirdDiscount: { type: Number, min: 0, max: 100 },
        groupDiscount: { type: Number, min: 0, max: 100 },
        memberDiscount: { type: Number, min: 0, max: 100 }
      },
      
      // Période d'essai
      freeTrialDays: { type: Number, min: 0, max: 30 },
      trialFeatures: [{ type: String }]
    },
    default: {}
  })
  pricing?: {
    price: number;
    currency: string;
    priceType: 'free' | 'one-time' | 'monthly' | 'yearly';
    isRecurring: boolean;
    recurringInterval?: 'month' | 'year' | 'week';
    packages: {
      name: string;
      sessionsCount: number;
      price: number;
      discount?: number;
      features: string[];
    }[];
    features: string[];
    paymentOptions: {
      allowInstallments: boolean;
      installmentCount?: number;
      earlyBirdDiscount?: number;
      groupDiscount?: number;
      memberDiscount?: number;
    };
    freeTrialDays?: number;
    trialFeatures?: string[];
  };

  /**
   * Note moyenne de la session
   */
  @Prop({ type: Number, default: 0 })
  averageRating: number;

  /**
   * Nombre de notes
   */
  @Prop({ type: Number, default: 0 })
  ratingCount: number;

  /**
   * ID de la communauté à laquelle appartient la session
   */
  @Prop({
    required: true,
    trim: true,
    type: String,
    ref: 'Community'
  })
  communityId: string;

  /**
   * Référence vers l'utilisateur créateur de la session
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true
  })
  creatorId: Types.ObjectId;

  /**
   * Indique si la session est active
   */
  @Prop({
    type: Boolean,
    default: true
  })
  isActive: boolean;

  /**
   * Réservations de la session
   */
  @Prop({
    type: [SessionBookingSchema],
    default: []
  })
  bookings: SessionBooking[];

  /**
   * Catégorie de la session
   */
  @Prop({
    trim: true,
    maxlength: 100
  })
  category?: string;

  /**
   * Nombre maximum de réservations par semaine
   */
  @Prop({
    type: Number,
    min: 1,
    max: 50
  })
  maxBookingsPerWeek?: number;

  /**
   * Notes additionnelles
   */
  @Prop({
    trim: true,
    maxlength: 1000
  })
  notes?: string;

  /**
   * Ressources de la session
   */
  @Prop({
    type: [SessionResourceSchema],
    default: []
  })
  resources?: SessionResource[];

  /**
   * Date de création
   */
  createdAt: Date;

  /**
   * Date de mise à jour
   */
  updatedAt: Date;
}

/**
 * Création du schéma Mongoose
 */
export const SessionSchema = SchemaFactory.createForClass(Session);

// Index pour optimiser les requêtes
SessionSchema.index({ id: 1 }, { unique: true });
SessionSchema.index({ title: 1 });
SessionSchema.index({ communityId: 1 });
SessionSchema.index({ creatorId: 1 });
SessionSchema.index({ isActive: 1 });
SessionSchema.index({ category: 1 });
SessionSchema.index({ createdAt: -1 });

// Index composés pour les requêtes complexes
SessionSchema.index({ communityId: 1, isActive: 1 });
SessionSchema.index({ creatorId: 1, isActive: 1 });
SessionSchema.index({ category: 1, isActive: 1 });

// Middleware pour générer l'ID unique avant sauvegarde
SessionSchema.pre('save', function(next) {
  if (this.isNew && !this.id) {
    this.id = new Types.ObjectId().toString();
  }
  
  // Trier les ressources par ordre
  if (this.isModified('resources') && this.resources) {
    this.resources.sort((a, b) => a.order - b.order);
  }
  
  // Trier les réservations par date
  if (this.isModified('bookings')) {
    this.bookings.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }
  
  next();
});

// ============= MÉTHODES POUR LES RÉSERVATIONS =============

// Méthode pour obtenir le nombre de réservations cette semaine
SessionSchema.methods.getBookingsThisWeek = function(): number {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
  
  return this.bookings.filter(booking => {
    if (booking.status === 'cancelled') return false;
    return booking.scheduledAt >= startOfWeek && booking.scheduledAt <= endOfWeek;
  }).length;
};

// Méthode pour vérifier si on peut réserver plus
SessionSchema.methods.canBookMore = function(): boolean {
  if (!this.maxBookingsPerWeek) return true;
  return this.getBookingsThisWeek() < this.maxBookingsPerWeek;
};

// Méthode pour vérifier la disponibilité d'un créneau
SessionSchema.methods.isTimeSlotAvailable = function(scheduledAt: Date): boolean {
  const sessionEnd = new Date(scheduledAt.getTime() + this.duration * 60000);
  
  return !this.bookings.some(booking => {
    if (booking.status === 'cancelled') return false;
    
    const bookingEnd = new Date(booking.scheduledAt.getTime() + this.duration * 60000);
    
    // Vérifier les conflits de temps
    return (scheduledAt < bookingEnd && sessionEnd > booking.scheduledAt);
  });
};

// Méthode pour obtenir le nombre de réservations
SessionSchema.methods.getBookingsCount = function(): number {
  return this.bookings.filter(booking => booking.status !== 'cancelled').length;
};

// Méthode pour obtenir une réservation
SessionSchema.methods.getBooking = function(bookingId: string): SessionBooking | undefined {
  return this.bookings.find(booking => booking.id === bookingId);
};

// Validation personnalisée
SessionSchema.pre('validate', function(next) {
  const session = this as unknown as SessionDocument;
  if (session.maxBookingsPerWeek && session.getBookingsThisWeek() > session.maxBookingsPerWeek) {
    next(new Error('Le nombre maximum de réservations par semaine est dépassé'));
  }
  
  next();
});

// Méthode pour ajouter une réservation
SessionSchema.methods.addBooking = function(booking: SessionBooking): void {
  if (!booking.id) {
    booking.id = new Types.ObjectId().toString();
  }
  
  // Vérifier la disponibilité
  if (!this.isTimeSlotAvailable(booking.scheduledAt)) {
    throw new Error('Ce créneau horaire n\'est pas disponible');
  }
  
  // Vérifier la limite hebdomadaire
  if (!this.canBookMore()) {
    throw new Error('Limite de réservations hebdomadaires atteinte');
  }
  
  this.bookings.push(booking);
  this.bookings.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
};

// Méthode pour supprimer une réservation
SessionSchema.methods.removeBooking = function(bookingId: string): void {
  this.bookings = this.bookings.filter(booking => booking.id !== bookingId);
};

// Méthode pour mettre à jour le statut d'une réservation
SessionSchema.methods.updateBookingStatus = function(bookingId: string, status: string): void {
  const booking = this.getBooking(bookingId);
  if (booking) {
    booking.status = status as any;
    booking.updatedAt = new Date();
  }
};


// ============= MÉTHODES POUR LES RESSOURCES =============

// Méthode pour ajouter une ressource
SessionSchema.methods.addResource = function(resource: SessionResource): void {
  if (!resource.id) {
    resource.id = new Types.ObjectId().toString();
  }
  this.resources = this.resources || [];
  this.resources.push(resource);
  this.resources.sort((a, b) => a.order - b.order);
};

// Méthode pour supprimer une ressource
SessionSchema.methods.removeResource = function(resourceId: string): void {
  this.resources = this.resources.filter(resource => resource.id !== resourceId);
};
