import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async signup(signupDto: SignupDto) {
        try {
            const existingUser = await this.usersService.findOneByEmail(signupDto.email);
            if (existingUser) {
                throw new ConflictException('Email already exists');
            }

            const hashedPassword = await bcrypt.hash(signupDto.password, 10);
            const user = await this.usersService.createFromDto({
                name: signupDto.name,
                email: signupDto.email,
                password: hashedPassword,
                role: signupDto.role,
            });

            const { password, ...result } = user;
            return {
                status: true,
                message: 'User registered successfully',
                user: result,
            };
        } catch (err) {
            if (err instanceof ConflictException) throw err;
            console.error('Signup error:', err);
            throw err;
        }
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findOneByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }
}
