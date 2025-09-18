import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../schema/user.schema';
import { LoginDto } from '../dto-user/login.dto';
import { LoginResponseDto } from '../dto-user/login-response.dto';
import { Verify2FADto } from '../dto-user/verify-2fa.dto';
import { EmailService } from '../common/services/email.service';
import { VerificationCodeSchema } from '../schema/verification-code.schema';
import { TokenBlacklistService } from '../common/services/token-blacklist.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  /**
   * Login/Signup via Google OAuth profile
   */
  async loginWithGoogle(oauthUser: {
    provider: 'google';
    providerId: string;
    email?: string;
    name?: string;
    photo?: string;
  }): Promise<LoginResponseDto> {
    if (!oauthUser.email) {
      throw new BadRequestException('Adresse e-mail Google introuvable');
    }

    // Lookup existing user by email
    let user = await this.userModel.findOne({ email: oauthUser.email.toLowerCase() });

    // Auto-provision user if not exists (handle potential unique name constraint)
    if (!user) {
      const baseName = oauthUser.name || 'Google User';
      const passwordHash = await this.hashPassword(`google:${oauthUser.providerId}:${Date.now()}`);
      let attempt = 0;
      while (true) {
        const candidateName = attempt === 0 ? baseName : `${baseName} ${attempt}`;
        try {
          user = await this.userModel.create({
            name: candidateName,
            email: oauthUser.email.toLowerCase(),
            role: 'user',
            password: passwordHash,
          });
          break;
        } catch (err: any) {
          // If duplicate key on name, try again with a suffixed name; otherwise rethrow
          if (err?.code === 11000 && err?.keyPattern && err.keyPattern.name) {
            attempt++;
            if (attempt > 10) {
              throw new BadRequestException('Impossible de créer le compte Google (conflit de nom).');
            }
            continue;
          }
          throw err;
        }
      }
    }

    // Issue tokens (2FA bypass for social login)
    const { accessToken, refreshToken } = this.generateTokens(user, true);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      rememberMe: true,
      message: 'Connexion réussie avec Google',
    };
  }

  /**
   * Valide les credentials de l'utilisateur
   */
  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email }).select('+password');
    
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    return user;
  }

  /**
   * Génère les tokens JWT
   */
  private generateTokens(user: UserDocument, rememberMe: boolean = false) {
    const currentTime = Date.now();
    const accessTokenId = `${user._id}-access-${currentTime}`;
    const refreshTokenId = `${user._id}-refresh-${currentTime}`;

    const basePayload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    // Durées différentes selon "Remember Me"
    const accessTokenDuration = rememberMe ? '4h' : '2h'; // Plus long si "Remember Me"
    const refreshTokenDuration = rememberMe ? '90d' : '30d'; // 3 mois si "Remember Me"

    const accessToken = this.jwtService.sign(
      {
        ...basePayload,
        jti: accessTokenId, // JWT ID unique
      },
      {
        expiresIn: accessTokenDuration,
        secret: process.env.JWT_SECRET || 'your-secret-key',
      }
    );

    const refreshToken = this.jwtService.sign(
      {
        ...basePayload,
        jti: refreshTokenId, // JWT ID unique
      },
      {
        expiresIn: refreshTokenDuration,
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      }
    );

    return { accessToken, refreshToken, rememberMe };
  }

  /**
   * Connexion avec envoi automatique du code 2FA
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    // Générer et envoyer automatiquement le code 2FA
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Sauvegarder le code dans la base de données (avec expiration)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Utiliser le modèle VerificationCode
    const verificationCodeModel = this.userModel.db.model('VerificationCode', VerificationCodeSchema);
    
    // Supprimer les anciens codes pour cet utilisateur
    await verificationCodeModel.deleteMany({ userId: user._id, type: '2fa' });
    
    // Sauvegarder le nouveau code avec l'information "Remember Me"
    await verificationCodeModel.create({
      userId: user._id,
      code: verificationCode,
      type: '2fa',
      expiresAt,
      // Stocker temporairement l'option "Remember Me" dans le code
      rememberMe: loginDto.remember_me || false,
    });

    // Envoyer le code par email
    await this.emailService.send2FACode(user.email, verificationCode, '2fa');

    return {
      access_token: "",
      refresh_token: "",
      requires2FA: true,
      message: 'Code de vérification envoyé par email. Utilisez /auth/verify-2fa pour compléter la connexion.',
    };
  }

  /**
   * Vérification du code 2FA et génération des tokens
   */
  async verify2FA(verify2FADto: Verify2FADto): Promise<LoginResponseDto> {
    const { email, verificationCode } = verify2FADto;

    // Vérifier si l'utilisateur existe
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new BadRequestException('Email invalide');
    }

    // Vérifier le code 2FA
    const verificationCodeModel = this.userModel.db.model('VerificationCode', VerificationCodeSchema);
    
    const verificationRecord = await verificationCodeModel.findOne({
      userId: user._id,
      code: verificationCode,
      type: '2fa',
      expiresAt: { $gt: new Date() },
    });

    if (!verificationRecord) {
      throw new BadRequestException('Code de vérification invalide ou expiré');
    }

    // Récupérer l'option "Remember Me" du code de vérification
    const rememberMe = verificationRecord.rememberMe || false;

    // Supprimer le code utilisé
    await verificationCodeModel.deleteOne({ _id: verificationRecord._id });

    // Générer les tokens avec la durée appropriée selon "Remember Me"
    const { accessToken, refreshToken } = this.generateTokens(user, rememberMe);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      rememberMe: rememberMe,
      message: rememberMe 
        ? 'Connexion réussie avec authentification à deux facteurs (session prolongée)'
        : 'Connexion réussie avec authentification à deux facteurs',
    };
  }

  /**
   * Rafraîchit le token d'accès
   */
  async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      });

      // Vérifier si le token est dans la blacklist
      const tokenId = payload.jti || `${payload.sub}-${payload.iat}`;
      const isRevoked = await this.tokenBlacklistService.isTokenRevoked(tokenId);
      
      if (isRevoked) {
        throw new UnauthorizedException('Token de rafraîchissement révoqué');
      }

      const user = await this.userModel.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      const currentTime = Date.now();
      const newAccessTokenId = `${user._id}-access-${currentTime}`;

      const newPayload = {
        sub: user._id,
        email: user.email,
        role: user.role,
        jti: newAccessTokenId, // Nouvel ID unique pour le token d'accès
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: '2h',
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });

      return {
        access_token: accessToken,
        expires_in: 2 * 60 * 60,
      };
    } catch (error) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
  }

  /**
   * Déconnexion avec révocation des tokens
   */
  async logout(accessToken?: string, refreshToken?: string): Promise<{ message: string; revokedTokens: number }> {
    let revokedCount = 0;

    try {
      // Révoquer l'access token s'il est fourni
      if (accessToken) {
        const accessPayload = this.jwtService.verify(accessToken, {
          secret: process.env.JWT_SECRET || 'your-secret-key',
        });
        
        await this.tokenBlacklistService.revokeTokenFromJWT(
          accessPayload.sub,
          accessPayload,
          'access'
        );
        revokedCount++;
      }

      // Révoquer le refresh token s'il est fourni
      if (refreshToken) {
        const refreshPayload = this.jwtService.verify(refreshToken, {
          secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        });
        
        await this.tokenBlacklistService.revokeTokenFromJWT(
          refreshPayload.sub,
          refreshPayload,
          'refresh'
        );
        revokedCount++;
      }

      return {
        message: `Déconnexion réussie. ${revokedCount} token(s) révoqué(s).`,
        revokedTokens: revokedCount,
      };
    } catch (error) {
      // Même si la révocation échoue, on considère la déconnexion comme réussie
      return {
        message: 'Déconnexion réussie (tokens expirés ou invalides).',
        revokedTokens: revokedCount,
      };
    }
  }

  /**
   * Révoquer tous les tokens d'un utilisateur
   */
  async revokeAllTokens(userId: string): Promise<{ message: string }> {
    await this.tokenBlacklistService.revokeAllUserTokens(userId as any);
    
    return {
      message: 'Tous les tokens de l\'utilisateur ont été révoqués.',
    };
  }

  /**
   * Hash un mot de passe
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
} 