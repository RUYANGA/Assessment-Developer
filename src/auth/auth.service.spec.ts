import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
    let service: AuthService;
    let usersService: UsersService;
    let jwtService: JwtService;

    const mockUsersService = {
        findOneByEmail: jest.fn(),
        create: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUsersService },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('signup', () => {
        it('should throw ConflictException if email exists', async () => {
            const signupDto = { name: 'Test', email: 'test@example.com', password: 'Password1!', role: 'AUTHOR' as any };
            mockUsersService.findOneByEmail.mockResolvedValue({ id: '1' });

            await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
        });

        it('should create a user and return result without password', async () => {
            const signupDto = { name: 'Test', email: 'test@example.com', password: 'Password1!', role: 'AUTHOR' as any };
            mockUsersService.findOneByEmail.mockResolvedValue(null);
            mockUsersService.create.mockResolvedValue({ ...signupDto, id: '1', password: 'hashed' });

            const result = await service.signup(signupDto);

            expect(result).not.toHaveProperty('password');
            expect(result.user.email).toBe(signupDto.email);
        });
    });

    describe('login', () => {
        it('should throw UnauthorizedException for invalid email', async () => {
            mockUsersService.findOneByEmail.mockResolvedValue(null);
            await expect(service.login({ email: 'x@x.com', password: 'p' })).rejects.toThrow(UnauthorizedException);
        });

        it('should return access token for valid credentials', async () => {
            const user = { id: '1', email: 'x@x.com', password: await bcrypt.hash('p', 10), role: 'AUTHOR' };
            mockUsersService.findOneByEmail.mockResolvedValue(user);
            mockJwtService.sign.mockReturnValue('token');

            const result = await service.login({ email: 'x@x.com', password: 'p' });

            expect(result).toHaveProperty('access_token', 'token');
        });
    });
});
