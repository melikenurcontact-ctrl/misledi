// seed.mjs - ESM seed script for Prisma 7.x
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
    datasourceUrl: "file:./prisma/dev.db",
    log: ["error"],
});

async function main() {
    console.log("🌱 Seeding database...");

    // Varsayılan admin kullanıcı oluştur
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const admin = await prisma.user.upsert({
        where: { email: "admin@misledi.com" },
        update: {},
        create: {
            email: "admin@misledi.com",
            passwordHash: hashedPassword,
            isActive: true,
        },
    });

    console.log("✅ Admin user created:", admin.email);

    // Varsayılan ayarlar
    const defaultSettings = [
        { key: "default_commission_percent", value: "15" },
        { key: "default_shipping_cost", value: "35" },
        { key: "low_margin_threshold", value: "5" },
    ];

    for (const setting of defaultSettings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: setting,
        });
        console.log(`✅ Setting: ${setting.key} = ${setting.value}`);
    }

    // Örnek entegrasyon kaydı
    await prisma.integration.upsert({
        where: { id: "trendyol-default" },
        update: {},
        create: {
            id: "trendyol-default",
            provider: "trendyol",
            status: "PENDING",
        },
    });

    console.log("✅ Integration created");

    console.log("🎉 Seeding completed!");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("Seed error:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
