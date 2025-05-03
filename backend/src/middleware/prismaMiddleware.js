const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const prismaMiddleware = (req, res, next) => {
  req.prisma = prisma;
  next();
};

module.exports = prismaMiddleware; 