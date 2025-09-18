import { IsString, IsNotEmpty, IsOptional, IsArray, MaxLength, MinLength, IsUrl, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour créer un commentaire sur un post
 */
export class CreatePostCommentDto {
  @ApiProperty({
    description: 'Contenu du commentaire',
    example: 'Excellent article, merci pour le partage !',
    maxLength: 2000
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Le contenu du commentaire ne peut pas dépasser 2000 caractères' })
  content: string;
}

/**
 * DTO pour créer un post
 */
export class CreatePostDto {
  @ApiProperty({
    description: 'Titre du post',
    example: 'Getting Started with React Hooks',
    minLength: 2,
    maxLength: 200
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Le titre doit contenir au moins 2 caractères' })
  @MaxLength(200, { message: 'Le titre ne peut pas dépasser 200 caractères' })
  title: string;

  @ApiProperty({
    description: 'Contenu principal du post',
    example: 'React Hooks have revolutionized how we write React components. In this post, I\'ll share my experience and best practices...',
    maxLength: 10000
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, { message: 'Le contenu ne peut pas dépasser 10000 caractères' })
  content: string;

  @ApiPropertyOptional({
    description: 'Extrait du post (optionnel)',
    example: 'Learn the fundamentals of React Hooks and how they can simplify your code.',
    maxLength: 500
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'L\'extrait ne peut pas dépasser 500 caractères' })
  excerpt?: string;

  @ApiPropertyOptional({
    description: 'URL de l\'image miniature du post',
    example: 'https://example.com/thumbnail.jpg'
  })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'L\'URL de l\'image miniature doit être valide' })
  thumbnail?: string;

  @ApiProperty({
    description: 'ID de la communauté',
    example: 'community_123'
  })
  @IsString()
  @IsNotEmpty()
  communityId: string;

  @ApiPropertyOptional({
    description: 'Tags du post',
    example: ['react', 'hooks', 'javascript'],
    maxItems: 10
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(10, { message: 'Maximum 10 tags autorisés' })
  tags?: string[];
}
