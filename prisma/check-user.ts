
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: "admin@misledi.com" }
    });

    if (user) {
        console.log("✅ USER EXISTS: " + user.email);
        console.log("HASH: " + user.passwordHash.substring(0, 10) + "...");
    } else {
        console.log("❌ USER DOES NOT EXIST");
    }
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
