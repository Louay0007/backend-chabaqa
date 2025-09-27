import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // Si les variables SMTP sont configurées, utiliser un vrai service SMTP
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        this.logger.log('✅ Service SMTP configuré avec succès');
      } else {
        // Sinon, utiliser Ethereal Email (service de test gratuit)
        this.transporter = await this.createEtherealAccount();
        this.logger.log('📧 Service Ethereal Email configuré pour les tests');
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors de la configuration SMTP:', error.message);
      throw error;
    }
  }

  private async createEtherealAccount(): Promise<nodemailer.Transporter> {
    // Créer un compte Ethereal Email pour les tests
    const testAccount = await nodemailer.createTestAccount();
    
    this.logger.log('📧 Compte Ethereal Email créé:');
    this.logger.log(`   Email: ${testAccount.user}`);
    this.logger.log(`   Mot de passe: ${testAccount.pass}`);
    this.logger.log(`   Serveur: ${testAccount.smtp.host}:${testAccount.smtp.port}`);
    
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(email: string, code: string, userName: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@shabaka.com',
      to: email,
      subject: 'Réinitialisation de votre mot de passe - Shabaka',
      html: this.generatePasswordResetEmailTemplate(code, userName),
    };

    try {
      this.logger.log(`📧 Tentative d'envoi d'email à: ${email}`);
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log('✅ Email envoyé avec succès');
      
      // Si c'est Ethereal Email, afficher l'URL de prévisualisation
      if (result.messageId.includes('ethereal')) {
        this.logger.log(`🔗 Prévisualisation: https://ethereal.email/message/${result.messageId}`);
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'envoi d\'email:', error.message);
      throw new Error(`Erreur lors de l'envoi de l'email: ${error.message}`);
    }
  }

  /**
   * Envoie un email avec code 2FA pour la connexion
   */
  async send2FACode(email: string, code: string, userName: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@shabaka.com',
      to: email,
      subject: 'Code de vérification pour votre connexion - Shabaka',
      html: this.generate2FAEmailTemplate(code, userName),
    };

    try {
      this.logger.log(`📧 Tentative d'envoi d'email 2FA à: ${email}`);
      // Log the 2FA code to server logs for testing environments
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`🔐 2FA code (test): ${code} for ${email}`);
      }
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log('✅ Email 2FA envoyé avec succès');
      
      // Si c'est Ethereal Email, afficher l'URL de prévisualisation
      if (result.messageId.includes('ethereal')) {
        this.logger.log(`🔗 Prévisualisation: https://ethereal.email/message/${result.messageId}`);
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'envoi d\'email 2FA:', error.message);
      throw new Error(`Erreur lors de l'envoi de l'email 2FA: ${error.message}`);
    }
  }

  /**
   * Envoie un email générique (pour les notifications)
   */
  async sendGenericEmail(data: { to: string; subject: string; text: string; html?: string }): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@shabaka.com',
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html || data.text,
    };

    try {
      this.logger.log(`📧 Tentative d'envoi d'email générique à: ${data.to}`);
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log('✅ Email générique envoyé avec succès');
      
      // Si c'est Ethereal Email, afficher l'URL de prévisualisation
      if (result.messageId.includes('ethereal')) {
        this.logger.log(`🔗 Prévisualisation: https://ethereal.email/message/${result.messageId}`);
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'envoi d\'email générique:', error.message);
      throw new Error(`Erreur lors de l'envoi de l'email générique: ${error.message}`);
    }
  }

  /**
   * Génère le template HTML pour l'email de réinitialisation
   */
  private generatePasswordResetEmailTemplate(code: string, userName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 5px 5px;
          }
          .code {
            background-color: #e8f5e8;
            border: 2px solid #4CAF50;
            border-radius: 5px;
            padding: 15px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #4CAF50;
            margin: 20px 0;
            letter-spacing: 3px;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Réinitialisation de mot de passe</h1>
        </div>
        <div class="content">
          <p>Bonjour ${userName},</p>
          
          <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Shabaka.</p>
          
          <p>Voici votre code de vérification :</p>
          
          <div class="code">${code}</div>
          
          <div class="warning">
            <strong>⚠️ Important :</strong>
            <ul>
              <li>Ce code expire dans 15 minutes</li>
              <li>Ne partagez jamais ce code avec qui que ce soit</li>
              <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
            </ul>
          </div>
          
          <p>Utilisez ce code pour réinitialiser votre mot de passe dans l'application.</p>
          
          <p>Cordialement,<br>L'équipe Shabaka</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Veuillez ne pas y répondre.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Génère le template HTML pour l'email 2FA
   */
  private generate2FAEmailTemplate(code: string, userName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code de vérification - Connexion</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2196F3;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 5px 5px;
          }
          .code {
            background-color: #e3f2fd;
            border: 2px solid #2196F3;
            border-radius: 5px;
            padding: 15px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #2196F3;
            margin: 20px 0;
            letter-spacing: 3px;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Code de vérification</h1>
        </div>
        <div class="content">
          <p>Bonjour ${userName},</p>
          
          <p>Vous avez tenté de vous connecter à votre compte Shabaka.</p>
          
          <p>Voici votre code de vérification :</p>
          
          <div class="code">${code}</div>
          
          <div class="warning">
            <strong>⚠️ Important :</strong>
            <ul>
              <li>Ce code expire dans 10 minutes</li>
              <li>Ne partagez jamais ce code avec qui que ce soit</li>
              <li>Si vous n'avez pas tenté de vous connecter, ignorez cet email</li>
            </ul>
          </div>
          
          <p>Utilisez ce code pour compléter votre connexion.</p>
          
          <p>Cordialement,<br>L'équipe Shabaka</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Veuillez ne pas y répondre.</p>
        </div>
      </body>
      </html>
    `;
  }
} 