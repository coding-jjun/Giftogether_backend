export class DecreaseFundSumCommand {
  constructor(
    readonly fundId: number,
    readonly amount: number,
  ) {}
}
