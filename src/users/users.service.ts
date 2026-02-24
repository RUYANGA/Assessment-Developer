import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, Role } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOneByEmail(email: string): Promise<User | null> {
        if (!email) return null;

        try {

            console.debug('UsersService.findOneByEmail called with email:', email);

            return this.prisma.user.findUnique({ where: { email } });
        } catch (err) {
            // log detailed error for debugging
            // eslint-disable-next-line no-console
            console.error('Prisma findUnique error for email:', email, err);
            throw err;
        }
    }

    async findOneById(id: string): Promise<User | null> {
        if (!id) return null;

        return this.prisma.user.findUnique({ where: { id } });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({ data });
    }

    // Convenience wrapper when calling from controllers/services that pass
    // plain DTOs instead of a Prisma.UserCreateInput. Accepts the common
    // signup fields and maps them to the Prisma create call.
    async createFromDto(payload: { name: string; email: string; password: string; role?: Role; }): Promise<User> {
        const data: Prisma.UserCreateInput = {
            name: payload.name,
            email: payload.email,
            password: payload.password,
            role: (payload.role as any) || 'READER',
        } as Prisma.UserCreateInput;

        return this.prisma.user.create({ data });
    }
}
