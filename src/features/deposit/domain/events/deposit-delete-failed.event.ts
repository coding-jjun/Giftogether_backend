export class DepositDeleteFailedEvent {
  constructor(
    public readonly depositId: number,
    public readonly donorId: number,
  ) {}
}
