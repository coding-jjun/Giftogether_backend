import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Deposit } from 'src/entities/deposit.entity';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { Repository } from 'typeorm';

@Injectable()
export class RequestUpdateDepositUseCase {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,

    private readonly g2gException: GiftogetherExceptions,
    private readonly eventEmitter: EventEmitter2,
    private readonly updateDeposit: UpdateDepositUseCase,
  ) {}
  async execute(
    id: number,
    updateDepositDto: UpdateDepositDto,
    userId: number,
  ): Promise<any> {
    // Implement the logic to update a deposit record in the database
    // Example:
    // await this.depositRepository.update(id, { ...updateDepositDto, userId });
    return {}; // Placeholder return value
  }
}
