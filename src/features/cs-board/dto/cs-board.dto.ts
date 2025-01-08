import { IsNotEmpty } from "class-validator";
import { CsType } from "src/enums/cs-type.enum";

export class CsBoardDto {
  csId: number;
  userNick: string;

  @IsNotEmpty()
  csTitle: string;

  @IsNotEmpty()
  csCont: string;

  @IsNotEmpty()
  csType:CsType;

  // csComments: CsCommentDto[];

  @IsNotEmpty()
  isSecret: boolean;

  regAt: Date;

}