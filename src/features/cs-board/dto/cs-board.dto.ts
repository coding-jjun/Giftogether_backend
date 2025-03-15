import { IsNotEmpty } from "class-validator";
import { CsType } from "src/enums/cs-type.enum";
import { CsCommentDto } from "src/features/cs-comment/dto/cs-comment.dto";

export class CsBoardDto {
  constructor(
    public csBoardId: number,
    public csUser: string,
    public csTitle: string,
    public csCont: string,
    public csType: CsType,
    public isSecret: boolean,
    public isUserWaiting: boolean,
    public isComplete: boolean,
    public regAt: Date,
    public fundUuid: string,
    public csComments: CsCommentDto[]
  ) {}

}