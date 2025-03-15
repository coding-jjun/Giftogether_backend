import { IsNotEmpty } from "class-validator";

export class CreateCsCommentDto {
  @IsNotEmpty()
  csComCont: string;

}