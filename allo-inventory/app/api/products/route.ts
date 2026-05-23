import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {

  const inventories =
    await prisma.inventory.findMany({
      include: {
        product: true,
        warehouse: true,
      },
    });

  const data = inventories.map((item) => ({
    inventoryId: item.id,
    productId: item.productId,
    warehouseId: item.warehouseId,

    productName: item.product.name,
    productCategory: item.product.category,
    productDescription: item.product.description,
    warehouseName: item.warehouse.name,

    totalStock: item.totalUnits,
    reservedStock: item.reservedUnits,

    availableStock:
      item.totalUnits -
      item.reservedUnits,
  }));

  return NextResponse.json(data);
}