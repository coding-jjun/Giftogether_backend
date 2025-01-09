import { Test, TestingModule } from '@nestjs/testing';
import { CsBoardController } from './cs-board.controller';

describe('CsBoardController', () => {
  let controller: CsBoardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CsBoardController],
    }).compile();

    controller = module.get<CsBoardController>(CsBoardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
