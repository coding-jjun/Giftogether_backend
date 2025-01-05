import { Test, TestingModule } from '@nestjs/testing';
import { DepositController } from './deposit.controller';
import { DepositService } from './deposit.service';
import { UploadDepositUseCase } from './commands/upload-deposit.usecase';
import { MatchDepositUseCase } from './commands/match-deposit.usecase';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GiftogetherExceptions } from '../../filters/giftogether-exception';

describe('DepositController', () => {
  let controller: DepositController;
  let service: DepositService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      controllers: [DepositController],
      providers: [
        DepositService,
        UploadDepositUseCase,
        MatchDepositUseCase,
        GiftogetherExceptions,
      ],
    }).compile();

    controller = module.get<DepositController>(DepositController);
    service = module.get<DepositService>(DepositService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });
});
