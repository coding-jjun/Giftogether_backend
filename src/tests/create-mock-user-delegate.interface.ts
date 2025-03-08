import { Repository } from "typeorm";
import { Address } from "../entities/address.entity";
import { Funding } from "../entities/funding.entity";
import { User } from "../entities/user.entity";

export interface CreateMockUserDelegate {
  userRepo: Repository<User>;
  fundingRepo: Repository<Funding>;
  addressRepo?: Repository<Address>;
}
