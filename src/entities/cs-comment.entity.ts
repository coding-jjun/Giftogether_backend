import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { CsBoard } from "./cs-board.entity";

@Entity()
export class CsComment {
  @PrimaryGeneratedColumn()
  csComId:number;

  @Column('varchar')
  csComCont:string

  @ManyToOne(() => CsBoard, (csBoard) => csBoard.csComments)
  @JoinColumn({name: "csId"})
  csBoard: CsBoard;

  @ManyToOne(() => User, (user)=> user.userId)
  @JoinColumn({name:"userId"})
  csComUser: User;

  @CreateDateColumn()
  regAt: Date;

  @Column('bool', { default: false })
  isMod: boolean;

  @Column('bool', { default: false })
  isDel: boolean;
  
}
