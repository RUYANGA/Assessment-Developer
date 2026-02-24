declare module "prisma" {
    export type PrismaConfig<T = any> = T;
    export function defineConfig<T = any>(config: PrismaConfig<T>): PrismaConfig<T>;
    export default defineConfig;
}
