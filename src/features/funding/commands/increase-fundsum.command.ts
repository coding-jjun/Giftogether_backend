import { Funding } from 'src/entities/funding.entity';

export class IncreaseFundSumCommand {
  constructor(
    readonly funding: Funding,
    readonly amount: number,
  ) {}
}
