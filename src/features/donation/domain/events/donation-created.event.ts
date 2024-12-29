import { Donation } from 'src/entities/donation.entity';

export class DonationCreated {
  constructor(readonly donation: Donation) {}
}
