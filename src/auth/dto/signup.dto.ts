import { IsEmail, IsEnum, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export enum RoleEnum {
    AUTHOR = 'AUTHOR',
    READER = 'READER',
}
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
    @ApiProperty({
        description: 'The full name of the user',
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-zA-Z\s]+$/, {
        message: 'Name must contain only alphabets and spaces',
    })
    name: string;

    @ApiProperty({
        description: 'The email address of the user',
        example: 'john.doe@example.com',
    })
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'The password for the account (min 8 characters, must include uppercase, lowercase, number, and special character)',
        example: 'Password123!',
    })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'Password is too weak. Must contain uppercase, lowercase, number and special character',
    })
    password: string;

    @ApiProperty({
        description: 'The role of the user (AUTHOR or READER)',
        enum: RoleEnum,
        example: RoleEnum.AUTHOR,
    })
    @IsEnum(RoleEnum)
    @IsNotEmpty()
    role: RoleEnum;
}
