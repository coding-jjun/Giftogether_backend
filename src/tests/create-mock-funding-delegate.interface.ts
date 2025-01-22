import { Repository } from "typeorm";
import { Deposit } from "../entities/deposit.entity";
import { Donation } from "../entities/donation.entity";
import { Funding } from "../entities/funding.entity";
import { ProvisionalDonation } from "../entities/provisional-donation.entity";
import { User } from "../entities/user.entity";

export interface CreateMockFundingWithRelationsDelegate {
  userRepo: Repository<User>;
  fundingRepo: Repository<Funding>;
  depositRepo?: Repository<Deposit>;
  donationRepo?: Repository<Donation>;
  provDonRepo?: Repository<ProvisionalDonation>;
}
