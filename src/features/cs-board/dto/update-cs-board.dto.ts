import { IsNotEmpty, IsOptional } from "class-validator";
import { CsType } from "src/enums/cs-type.enum";

export class UpdateCsBoardDto {

  @IsNotEmpty()
  csTitle: string;

  @IsNotEmpty()
  csCont: string;

  @IsNotEmpty()
  csType:CsType;

  @IsNotEmpty()
  isSecret: boolean;

  @IsOptional()
  isComplete: boolean;
}