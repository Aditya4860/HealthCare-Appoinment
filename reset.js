const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.notification.updateMany({
    data: { status: 'PENDING', retryCount: 0, nextRetryAt: new Date(0) }
  });
  const notifs = await prisma.notification.findMany();
  console.log("Notifs:", notifs);
  console.log("Reset complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
