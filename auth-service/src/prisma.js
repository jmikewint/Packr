const { PrismaClient } = require("@prisma/client");

// Single shared Prisma client for the whole service.
const prisma = new PrismaClient();

module.exports = prisma;
