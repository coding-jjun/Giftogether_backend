import { Test, TestingModule } from '@nestjs/testing';
import { CsBoardService } from './cs-board.service';

describe('CsBoardService', () => {
  let service: CsBoardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsBoardService],
    }).compile();

    service = module.get<CsBoardService>(CsBoardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
