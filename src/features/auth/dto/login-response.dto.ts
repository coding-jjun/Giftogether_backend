import { UserDto } from "src/features/user/dto/user.dto";

export class LoginResponseDto {
  constructor(
    public accessToken:string,
    public refreshToken:string,
    public user: UserDto
  ){}
}