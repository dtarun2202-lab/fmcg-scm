import { PrismaClient } from "@prisma/client";

// Singleton so hot-reload (ts-node-dev) doesn't spawn a new pool every save.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
