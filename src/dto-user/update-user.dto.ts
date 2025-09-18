import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsDateString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  readonly name?: string;

  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @IsOptional()
  @IsString()
  readonly password?: string;

  @IsOptional()
  @IsString()
  readonly numtel?: string;

  @IsOptional()
  @IsDateString()
  readonly date_naissance?: string;

  @IsOptional()
  @IsString()
  readonly sexe?: string;

  @IsOptional()
  @IsString()
  readonly pays?: string;

  @IsOptional()
  @IsString()
  readonly ville?: string;

  @IsOptional()
  @IsString()
  readonly code_postal?: string;

  @IsOptional()
  @IsString()
  readonly adresse?: string;

  @IsOptional()
  @IsString()
  readonly photo_profil?: string;

  @IsOptional()
  @IsString()
  readonly bio?: string;

  @IsOptional()
  @IsString()
  readonly lien_instagram?: string;
}
