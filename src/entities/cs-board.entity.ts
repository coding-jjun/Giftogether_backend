  import { CsType } from "src/enums/cs-type.enum";
  import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
  import { CsComment } from "./cs-comment.entity";
  import { User } from "./user.entity";

  @Entity()
  export class CsBoard {
    constructor(csBoard: Partial<CsBoard>, user:User) {
      Object.assign(this, csBoard);
      this.csUser = user;
    }

    @PrimaryGeneratedColumn()
    csId: number;

    @ManyToOne(() => User, (user) => user.userId)
    @JoinColumn({name: 'userId'})
    csUser: User;

    @Column({nullable: false, type: 'varchar', length: 10})
    csTitle: string;

    @Column()
    csCont: string;

    @Column({type: 'enum', enum: CsType, nullable: false, default: CsType.Extra })
    csType: CsType;

    @OneToMany(() => CsComment, (csComment) => csComment.csBoard)
    csComments: CsComment[];

    @Column({default: false})
    isSecret: boolean;

    @Column({default: false}) // 답변 완료 & 관리자 게시글의 추가 댓글 막기
    isComplete: boolean;

    @Column('bool', { default: false })
    isDel: boolean;
    
    @CreateDateColumn()
    regAt: Date;

  }