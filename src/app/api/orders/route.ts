import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
    try {
        const orders = await prisma.order.findMany({
            include: {
                orderLines: {
                    include: {
                        profitCalculation: true,
                        product: true
                    }
                }
            },
            orderBy: {
                orderDate: 'desc'
            }
        });

        // Kâr hesaplamalarını özetle
        const processedOrders = orders.map(order => {
            let totalOrderProfit = 0;
            let totalOrderCost = 0;
            let totalOrderCommission = 0;

            order.orderLines.forEach(line => {
                if (line.profitCalculation) {
                    totalOrderProfit += Number(line.profitCalculation.netProfit);
                    totalOrderCost += Number(line.profitCalculation.cogs) + Number(line.profitCalculation.packaging) + Number(line.profitCalculation.shipping);
                    totalOrderCommission += Number(line.profitCalculation.commission);
                }
            });

            return {
                ...order,
                analysis: {
                    netProfit: totalOrderProfit,
                    totalCost: totalOrderCost,
                    totalCommission: totalOrderCommission
                }
            };
        });

        return NextResponse.json(processedOrders);

    } catch (error) {
        console.error("Orders fetch error:", error);
        return NextResponse.json(
            { error: "Siparişler alınamadı." },
            { status: 500 }
        );
    }
}
