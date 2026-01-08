import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🧹 Temizlik başladı...");

    // 1. Önce sipariş detaylarını silelim (OrderLine, ProfitCalculation)
    await prisma.profitCalculation.deleteMany({});
    console.log("✅ Kâr hesaplamaları silindi.");

    await prisma.orderLine.deleteMany({});
    console.log("✅ Sipariş satırları silindi.");

    // 2. Siparişleri silelim
    await prisma.order.deleteMany({});
    console.log("✅ Siparişler silindi.");

    // 3. CostCard'ları silelim (Sadece demo ürünlere ait olanlar)
    // Demo ürünler sku: TRY- ile başlıyordu
    const demoProducts = await prisma.product.findMany({
        where: { sku: { startsWith: "TRY-" } },
        select: { id: true }
    });

    const demoProductIds = demoProducts.map(p => p.id);

    if (demoProductIds.length > 0) {
        await prisma.costCard.deleteMany({
            where: { productId: { in: demoProductIds } }
        });
        console.log("✅ Demo maliyet kartları silindi.");

        // 4. Ürünleri silelim
        await prisma.product.deleteMany({
            where: { id: { in: demoProductIds } }
        });
        console.log(`✅ ${demoProductIds.length} adet demo ürün silindi.`);
    } else {
        console.log("ℹ️ Silinecek demo ürün bulunamadı.");
    }

    console.log("✨ Veritabanı temizlendi! Hazır.");
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
