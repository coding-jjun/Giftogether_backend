/**
 * TODO - 현재 PoC를 위한 엔티티입니다. `@Entity` 데코레이터를 나중에 등록해야 합니다.
 */
export class Deposit {
  constructor(
    public readonly sender: string, // "홍길동-1234"
    public readonly receiver: string,
    public readonly amount: number,
    public readonly trasferDate: Date,
    public readonly depositBank: string,
    public readonly depositAccount: string,
    public readonly withdrawalAccount: string,
  ) {}
  static create(data: {
    sender: string;
    receiver: string;
    amount: number;
    transferDate: Date;
    depositBank: string;
    depositAccount: string;
    withdrawalAccount: string;
  }): Deposit {
    return new Deposit(
      data.sender,
      data.receiver,
      data.amount,
      data.transferDate,
      data.depositBank,
      data.depositAccount,
      data.withdrawalAccount,
    );
  }
}
