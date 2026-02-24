import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOneByEmail(email: string): Promise<User | null> {
        return (this.prisma as any).user.findUnique({
            where: { email },
        });
    }

    async findOneById(id: string): Promise<User | null> {
        return (this.prisma as any).user.findUnique({
            where: { id },
        });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return (this.prisma as any).user.create({
            data,
        });
    }
}
