import { IsEmail, IsEnum, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class SignupDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-zA-Z\s]+$/, {
        message: 'Name must contain only alphabets and spaces',
    })
    name: string;

    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'Password is too weak. Must contain uppercase, lowercase, number and special character',
    })
    password: string;

    @IsEnum(Role)
    @IsNotEmpty()
    role: Role;
}
