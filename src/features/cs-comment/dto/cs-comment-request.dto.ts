import { IsNotEmpty } from "class-validator";

export class CsCommentReqeustDto {
  @IsNotEmpty()
  csComCont: string;

}