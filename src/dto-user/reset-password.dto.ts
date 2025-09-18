import { IsEmail, IsNotEmpty, IsString, MinLength, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide' })
  @IsNotEmpty({ message: 'L\'email est requis' })
  email: string;

  @IsString({ message: 'Le code de vérification doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le code de vérification est requis' })
  @Length(6, 6, { message: 'Le code de vérification doit contenir exactement 6 caractères' })
  verificationCode: string;

  @IsString({ message: 'Le nouveau mot de passe doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nouveau mot de passe est requis' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  newPassword: string;
} 