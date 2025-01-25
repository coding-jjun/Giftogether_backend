export class GetCommentDto {
  constructor(
    public comId: Number,
    public content: string,
    public regAt: Date,
    public isMod: boolean,
    public authorId: number,
    public authorName: string,
    public authorImg: string,
  ) {}
}
