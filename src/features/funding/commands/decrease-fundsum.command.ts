import { Funding } from 'src/entities/funding.entity';

export class DecreaseFundSumCommand {
  constructor(
    readonly funding: Funding,
    readonly amount: number,
  ) {}
}
