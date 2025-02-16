import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DepositFsmService } from '../domain/deposit-fsm.service';
import { GiftogetherExceptions } from 'src/filters/giftogether-exception';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Deposit } from 'src/entities/deposit.entity';
import { Repository } from 'typeorm';
import { DepositUpdatedEvent } from '../domain/events/deposit-updated.event';
import { UpdateDepositDto } from '../dto/update-deposit.dto';
import { DepositDto } from '../dto/deposit.dto';

@Injectable()
export class UpdateDepositUseCase {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
    private readonly depositFsmService: DepositFsmService,
    private readonly g2gException: GiftogetherExceptions,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    id: number,
    updateDepositDto: UpdateDepositDto,
    adminId: number,
  ): Promise<DepositDto> {
    const deposit = await this.depositRepository.findOne({
      where: { depositId: id },
    });
    if (!deposit) {
      throw this.g2gException.DepositNotFound;
    }

    const event = new DepositUpdatedEvent(id, adminId);

    deposit.transition(event.name, this.depositFsmService);

    // Update the deposit entity with new data from updateDepositDto
    Object.assign(deposit, updateDepositDto);
    await this.depositRepository.save(deposit);

    this.eventEmitter.emit(event.name, event);

    return new DepositDto(deposit);
  }
}
