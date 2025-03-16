import { IsNotEmpty } from "class-validator";

export class CsCommentDto {
  constructor(
    public csComId: number,
    public csComUser: string,
    public csComCont: string,
    public regAt: Date,
    public isMod: boolean,
  ) {}

}