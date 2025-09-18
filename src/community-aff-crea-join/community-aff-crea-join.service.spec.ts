import { Test, TestingModule } from '@nestjs/testing';
import { CommunityAffCreaJoinService } from './community-aff-crea-join.service';

describe('CommunityAffCreaJoinService', () => {
  let service: CommunityAffCreaJoinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommunityAffCreaJoinService],
    }).compile();

    service = module.get<CommunityAffCreaJoinService>(CommunityAffCreaJoinService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
