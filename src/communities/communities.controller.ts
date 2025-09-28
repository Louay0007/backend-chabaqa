import { 
  Controller, 
  Get, 
  Query, 
  Param,
  HttpCode, 
  HttpStatus,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { CommunitiesService } from './communities.service';

@ApiTags('Communities Discovery')
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  /**
   * Get communities list with filters and search
   * Route: GET /communities
   * Frontend URL: http://localhost:8080/communities
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Get communities list',
    description: 'Retrieve communities with search, filtering, and pagination options'
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in name, creator, description, tags' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category' })
  @ApiQuery({ name: 'type', required: false, type: String, enum: ['community', 'course', 'challenge', 'product', 'oneToOne'], description: 'Filter by type' })
  @ApiQuery({ name: 'priceType', required: false, type: String, enum: ['free', 'paid', 'monthly', 'yearly', 'hourly'], description: 'Filter by price type' })
  @ApiQuery({ name: 'minMembers', required: false, type: Number, description: 'Minimum member count' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, enum: ['popular', 'newest', 'members', 'rating', 'price-low', 'price-high'], description: 'Sort order' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 12)' })
  @ApiQuery({ name: 'featured', required: false, type: Boolean, description: 'Show only featured communities' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Communities retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Communities retrieved successfully',
        data: {
          communities: [
            {
              id: '1',
              slug: 'email-marketing',
              name: 'Email Marketing Mastery',
              logo: 'https://example.com/logo.png',
              coverImage: 'https://example.com/cover.jpg',
              shortDescription: 'Learn advanced email marketing strategies',
              creator: {
                id: '1',
                name: 'John Doe',
                avatar: 'https://example.com/avatar.jpg'
              },
              category: 'Marketing',
              priceType: 'free',
              price: 0,
              currency: 'USD',
              membersCount: 1250,
              averageRating: 4.8,
              ratingCount: 156,
              tags: ['email', 'marketing', 'automation'],
              featured: true,
              isVerified: true,
              createdAt: '2024-01-15T10:30:00Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 12,
            total: 1,
            totalPages: 1
          }
        }
      }
    }
  })
  async getCommunities(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('priceType') priceType?: string,
    @Query('minMembers') minMembers?: number,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('featured') featured?: boolean
  ) {
    const filters = {
      search,
      category,
      type,
      priceType,
      minMembers,
      sortBy,
      page: page || 1,
      limit: limit || 12,
      featured
    };

    const result = await this.communitiesService.getCommunities(filters);
    
    return result;
  }

  /**
   * Get global statistics
   * Route: GET /stats/global
   * Frontend URL: http://localhost:8080/communities (Hero section stats)
   */
  @Get('stats/global')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get global statistics',
    description: 'Retrieve global platform statistics for the hero section'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Global statistics retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Global statistics retrieved successfully',
        data: {
          totalCommunities: 1250,
          totalMembers: 45000,
          totalCourses: 3200,
          totalChallenges: 890,
          totalProducts: 156,
          totalOneToOneSessions: 78,
          totalRevenue: 125000,
          averageRating: 4.7
        }
      }
    }
  })
  async getGlobalStats() {
    const stats = await this.communitiesService.getGlobalStats();
    
    return stats;
  }

  /**
   * Get categories with counts
   * Route: GET /categories
   * Frontend URL: http://localhost:8080/communities (Browse by Interest section)
   */
  @Get('categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get categories with counts',
    description: 'Retrieve all categories with their community counts'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Categories retrieved successfully',
        data: [
          {
            name: 'Technology',
            count: 450,
            icon: 'laptop',
            color: '#3B82F6'
          },
          {
            name: 'Marketing',
            count: 320,
            icon: 'megaphone',
            color: '#10B981'
          }
        ]
      }
    }
  })
  async getCategories() {
    const categories = await this.communitiesService.getCategories();
    
    return { categories };
  }

  /**
   * Get community by slug
   * Route: GET /communities/:slug
   * Frontend URL: http://localhost:8080/{slug} (Individual community page)
   */
  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get community by slug',
    description: 'Retrieve detailed information about a specific community'
  })
  @ApiParam({ name: 'slug', description: 'Community slug', example: 'email-marketing' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Community retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Community retrieved successfully',
        data: {
          id: '1',
          slug: 'email-marketing',
          name: 'Email Marketing Mastery',
          logo: 'https://example.com/logo.png',
          coverImage: 'https://example.com/cover.jpg',
          shortDescription: 'Learn advanced email marketing strategies',
          longDescription: 'A comprehensive community focused on...',
          creator: {
            id: '1',
            name: 'John Doe',
            avatar: 'https://example.com/avatar.jpg',
            bio: 'Email marketing expert with 10+ years experience'
          },
          category: 'Marketing',
          priceType: 'free',
          price: 0,
          currency: 'USD',
          membersCount: 1250,
          averageRating: 4.8,
          ratingCount: 156,
          tags: ['email', 'marketing', 'automation'],
          featured: true,
          isVerified: true,
          socialLinks: {
            website: 'https://example.com',
            twitter: '@emailmaster',
            linkedin: 'company/email-mastery'
          },
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-20T14:22:00Z'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Community not found'
  })
  async getCommunityBySlug(@Param('slug') slug: string) {
    const community = await this.communitiesService.getCommunityBySlug(slug);
    
    return community;
  }

  /**
   * Get community posts
   * Route: GET /communities/:slug/posts
   * Frontend URL: http://localhost:8080/{slug} (Community posts section)
   */
  @Get(':slug/posts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get community posts',
    description: 'Retrieve recent posts from a specific community'
  })
  @ApiParam({ name: 'slug', description: 'Community slug', example: 'email-marketing' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Community posts retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Community posts retrieved successfully',
        data: {
          posts: [
            {
              id: '1',
              title: 'Advanced Email Segmentation Techniques',
              content: 'Learn how to segment your email list effectively...',
              author: {
                id: '1',
                name: 'John Doe',
                avatar: 'https://example.com/avatar.jpg'
              },
              likes: 45,
              comments: 12,
              createdAt: '2024-01-20T10:30:00Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1
          }
        }
      }
    }
  })
  async getCommunityPosts(
    @Param('slug') slug: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const result = await this.communitiesService.getCommunityPosts(slug, {
      page: page || 1,
      limit: limit || 10
    });
    
    return result;
  }

  /**
   * Get search suggestions
   * Route: GET /search/suggestions
   * Frontend URL: http://localhost:8080/communities (Search input autocomplete)
   */
  @Get('search/suggestions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get search suggestions',
    description: 'Retrieve search suggestions based on query'
  })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of suggestions (default: 5)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search suggestions retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Search suggestions retrieved successfully',
        data: {
          suggestions: [
            {
              type: 'community',
              text: 'Email Marketing Mastery',
              slug: 'email-marketing'
            },
            {
              type: 'category',
              text: 'Marketing',
              slug: 'marketing'
            }
          ]
        }
      }
    }
  })
  async getSearchSuggestions(
    @Query('q') query: string,
    @Query('limit') limit?: number
  ) {
    const suggestions = await this.communitiesService.getSearchSuggestions(query, limit || 5);
    
    return suggestions;
  }
}
