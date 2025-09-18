import { Test, TestingModule } from '@nestjs/testing';
import { CommunityAffCreaJoinController } from './community-aff-crea-join.controller';

describe('CommunityAffCreaJoinController', () => {
  let controller: CommunityAffCreaJoinController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunityAffCreaJoinController],
    }).compile();

    controller = module.get<CommunityAffCreaJoinController>(CommunityAffCreaJoinController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
