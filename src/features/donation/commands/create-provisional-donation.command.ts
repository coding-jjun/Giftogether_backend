export class CreateProvisionalDonationCommand {
  constructor(
    readonly senderSig: string,
    readonly senderUserId: number,
    readonly amount: number,
    readonly fundId: number,
  ) {}
}
