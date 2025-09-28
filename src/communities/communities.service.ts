import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Community, CommunityDocument } from '../schema/community.schema';
import { User, UserDocument } from '../schema/user.schema';
import { Post, PostDocument } from '../schema/post.schema';

export interface CommunityFilters {
  search?: string;
  category?: string;
  type?: string;
  priceType?: string;
  minMembers?: number;
  sortBy?: string;
  page: number;
  limit: number;
  featured?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectModel(Community.name) private communityModel: Model<CommunityDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  /**
   * Get communities with filters and pagination
   */
  async getCommunities(filters: CommunityFilters) {
    const {
      search,
      category,
      type,
      priceType,
      minMembers,
      sortBy,
      page,
      limit,
      featured
    } = filters;

    // Build query
    const query: any = { isActive: true };

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { short_description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Type filter (map frontend types to backend fields)
    if (type) {
      switch (type) {
        case 'community':
          query.priceType = { $in: ['free', 'one-time', 'monthly', 'yearly'] };
          break;
        case 'course':
          // This would need to be implemented based on your course schema
          break;
        case 'challenge':
          // This would need to be implemented based on your challenge schema
          break;
        case 'product':
          // This would need to be implemented based on your product schema
          break;
        case 'oneToOne':
          // This would need to be implemented based on your session schema
          break;
      }
    }

    // Price type filter
    if (priceType) {
      if (priceType === 'free') {
        query.priceType = 'free';
      } else if (priceType === 'paid') {
        query.priceType = { $in: ['one-time', 'monthly', 'yearly'] };
      } else {
        query.priceType = priceType;
      }
    }

    // Minimum members filter
    if (minMembers) {
      query.membersCount = { $gte: minMembers };
    }

    // Featured filter
    if (featured !== undefined) {
      query.featured = featured;
    }

    // Build sort
    let sort: any = { createdAt: -1 };
    if (sortBy) {
      switch (sortBy) {
        case 'popular':
          sort = { membersCount: -1, averageRating: -1 };
          break;
        case 'newest':
          sort = { createdAt: -1 };
          break;
        case 'members':
          sort = { membersCount: -1 };
          break;
        case 'rating':
          sort = { averageRating: -1, ratingCount: -1 };
          break;
        case 'price-low':
          sort = { 'pricing.price': 1 };
          break;
        case 'price-high':
          sort = { 'pricing.price': -1 };
          break;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [communities, total] = await Promise.all([
      this.communityModel
        .find(query)
        .populate('createur', 'name email profile_picture')
        .select('-members -admins -moderateurs -long_description')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.communityModel.countDocuments(query)
    ]);

    // Transform communities to match frontend format
    const transformedCommunities = communities.map((community, index) => ({
      id: community._id.toString(), // Use actual MongoDB ID as string
      slug: community.slug,
      name: community.name,
      creator: (community.createur as any)?.name || 'Unknown',
      creatorAvatar: (community.createur as any)?.profile_picture || 'https://placehold.co/64x64?text=MM',
      description: community.short_description,
      category: community.category,
      type: 'community',
      members: community.membersCount,
      rating: (community as any).averageRating || 0,
      price: community.pricing?.price || community.fees_of_join || 0,
      priceType: community.priceType,
      image: community.photo_de_couverture,
      tags: community.tags,
      featured: community.featured,
      verified: community.isVerified,
      createdDate: community.createdAt,
      link: `/${community.slug}` // Add link field as expected by frontend
    }));

    return {
      communities: transformedCommunities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        categories: await this.getAvailableCategories(),
        sortOptions: [
          { value: 'popular', label: 'Most Popular' },
          { value: 'newest', label: 'Newest' },
          { value: 'members', label: 'Most Members' },
          { value: 'rating', label: 'Highest Rated' },
          { value: 'price-low', label: 'Price: Low to High' },
          { value: 'price-high', label: 'Price: High to Low' }
        ]
      }
    };
  }

  /**
   * Get global statistics
   */
  async getGlobalStats() {
    const [
      totalCommunities,
      totalMembers,
      averageRating,
      freeCommunities
    ] = await Promise.all([
      this.communityModel.countDocuments({ isActive: true }),
      this.communityModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$membersCount' } } }
      ]).then(result => result[0]?.total || 0),
      this.communityModel.aggregate([
        { $match: { isActive: true, ratingCount: { $gt: 0 } } },
        { $group: { _id: null, averageRating: { $avg: '$averageRating' } } }
      ]).then(result => Math.round((result[0]?.averageRating || 0) * 10) / 10),
      this.communityModel.countDocuments({ isActive: true, priceType: 'free' })
    ]);

    return {
      total: totalCommunities,
      totalMembers,
      avgRating: averageRating,
      freeCount: freeCommunities
    };
  }

  /**
   * Get categories with counts
   */
  async getCategories() {
    const categories = await this.communityModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Return simple string array as expected by frontend
    return ["All", ...categories.map(cat => cat._id)];
  }

  /**
   * Get community by slug
   */
  async getCommunityBySlug(slug: string) {
    const community = await this.communityModel
      .findOne({ slug, isActive: true })
      .populate('createur', 'name email profile_picture bio')
      .exec();

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    return {
      id: community._id.toString(), // String ID as per frontend spec
      slug: community.slug,
      name: community.name,
      creator: (community.createur as any).name || 'Unknown',
      creatorId: (community.createur as any)._id?.toString() || '1', // Add creatorId field
      creatorAvatar: (community.createur as any).profile_picture || 'https://placehold.co/64x64?text=MM',
      description: community.short_description,
      longDescription: community.long_description,
      category: community.category,
      type: 'community',
      members: community.membersCount,
      rating: (community as any).averageRating || 0,
      price: community.pricing?.price || community.fees_of_join || 0,
      priceType: community.priceType,
      image: community.photo_de_couverture,
      coverImage: community.photo_de_couverture,
      tags: community.tags,
      featured: community.featured,
      verified: community.isVerified,
      createdDate: community.createdAt,
      settings: {
        primaryColor: community.settings?.primaryColor || '#0066cc',
        secondaryColor: community.settings?.secondaryColor || '#f5f5f5',
        welcomeMessage: community.settings?.welcomeMessage || 'Welcome to our community!',
        features: community.settings?.features || [],
        benefits: community.settings?.benefits || [],
        template: community.settings?.template || 'default',
        fontFamily: community.settings?.fontFamily || 'Inter',
        borderRadius: community.settings?.borderRadius || 8,
        backgroundStyle: community.settings?.backgroundStyle || 'solid',
        heroLayout: community.settings?.heroLayout || 'centered',
        showStats: community.settings?.showStats || true,
        showFeatures: community.settings?.showFeatures || true,
        showTestimonials: community.settings?.showTestimonials || true,
        showPosts: community.settings?.showPosts || true,
        showFAQ: community.settings?.showFAQ || true,
        enableAnimations: community.settings?.enableAnimations || true,
        enableParallax: community.settings?.enableParallax || false,
        logo: community.settings?.logo || community.logo,
        heroBackground: community.settings?.heroBackground || community.photo_de_couverture,
        gallery: community.settings?.gallery || [],
        videoUrl: community.settings?.videoUrl,
        socialLinks: community.settings?.socialLinks || {},
        customSections: community.settings?.customSections || [],
        metaTitle: community.settings?.metaTitle || community.name,
        metaDescription: community.settings?.metaDescription || community.short_description
      },
      stats: {
        totalRevenue: community.stats?.totalRevenue || 0,
        monthlyGrowth: community.stats?.monthlyGrowth || 0,
        engagementRate: community.stats?.engagementRate || 0,
        retentionRate: community.stats?.retentionRate || 0
      }
    };
  }

  /**
   * Get community posts
   */
  async getCommunityPosts(slug: string, pagination: PaginationOptions) {
    // First get the community to get its ID
    const community = await this.communityModel.findOne({ slug, isActive: true });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Get posts for this community
    const [posts, total] = await Promise.all([
      this.postModel
        .find({ communityId: community._id.toString() })
        .populate('authorId', 'name email profile_picture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel.countDocuments({ communityId: community._id.toString() })
    ]);

    const transformedPosts = posts.map((post, index) => ({
      id: index + 1, // Numeric ID as per API spec
      communityId: 1, // Default community ID
      author: (post.authorId as any).name || 'Unknown',
      authorAvatar: (post.authorId as any).profile_picture || '/placeholder.svg?height=40&width=40',
      content: post.content,
      timestamp: this.formatTimestamp(post.createdAt),
      likes: post.likes || 0,
      comments: post.comments?.length || 0,
      views: Math.floor(Math.random() * 500) + 50, // Random views for demo
      type: 'announcement' // Default type
    }));

    return {
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(query: string, limit: number) {
    const suggestions: string[] = [];
    const categories: string[] = [];
    const tags: string[] = [];

    // Get community suggestions
    const communities = await this.communityModel
      .find({
        isActive: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      })
      .select('name slug tags')
      .limit(Math.ceil(limit / 3))
      .exec();

    suggestions.push(...communities.map(community => community.name));

    // Get category suggestions
    const categoryResults = await this.communityModel.aggregate([
      {
        $match: {
          isActive: true,
          category: { $regex: query, $options: 'i' }
        }
      },
      { $group: { _id: '$category' } },
      { $limit: Math.ceil(limit / 3) }
    ]);

    categories.push(...categoryResults.map((cat: any) => cat._id));

    // Get tag suggestions
    const tagResults = await this.communityModel.aggregate([
      {
        $match: {
          isActive: true,
          tags: { $in: [new RegExp(query, 'i')] }
        }
      },
      { $unwind: '$tags' },
      { $match: { tags: { $regex: query, $options: 'i' } } },
      { $group: { _id: '$tags' } },
      { $limit: Math.ceil(limit / 3) }
    ]);

    tags.push(...tagResults.map((tag: any) => tag._id));

    return {
      suggestions: suggestions.slice(0, limit),
      categories: categories.slice(0, limit),
      tags: tags.slice(0, limit)
    };
  }

  /**
   * Format timestamp to relative time
   */
  private formatTimestamp(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Get available categories for filters
   */
  private async getAvailableCategories(): Promise<string[]> {
    const categories = await this.communityModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category' } },
      { $sort: { _id: 1 } }
    ]);
    
    return categories.map(cat => cat._id);
  }
}
