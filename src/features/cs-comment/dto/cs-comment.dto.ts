import { IsNotEmpty } from "class-validator";

export class CsCommentDto {

  @IsNotEmpty()
  csComCont: string;

}