import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, Min, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateChapitreDto } from './create-cours.dto';

/**
 * DTO pour mettre à jour un chapitre
 */
export class UpdateChapitreDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  titre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ordre?: number;

  @IsOptional()
  @IsString()
  duree?: string;
}

/**
 * DTO pour mettre à jour un cours
 */
export class UpdateCoursDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  titre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  prix?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateChapitreDto)
  chapitres?: UpdateChapitreDto[];
} 