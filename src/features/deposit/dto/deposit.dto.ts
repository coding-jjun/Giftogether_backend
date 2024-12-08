export class DepositDto {
  constructor(
    public readonly sender: string,
    public readonly receiver: string,
    public readonly amount: number,
    public readonly transferDate: Date,
    public readonly depositBank: string,
    public readonly depositAccount: string,
    public readonly withdrawalAccount: string,
  ) {}
}
