
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🔄 Resetting admin password...");
    const hashedPassword = await bcrypt.hash("admin123", 12);

    await prisma.user.upsert({
        where: { email: "admin@misledi.com" },
        update: {
            passwordHash: hashedPassword,
            isActive: true
        },
        create: {
            email: "admin@misledi.com",
            passwordHash: hashedPassword,
            isActive: true,
        },
    });
    console.log("✅ Admin password reset to: admin123");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
