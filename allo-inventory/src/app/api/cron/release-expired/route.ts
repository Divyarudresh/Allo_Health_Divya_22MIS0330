import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {

  const expired =
    await prisma.reservation.findMany({
      where: {
        status: "pending",

        expiresAt: {
          lt: new Date(),
        },
      },
    });

  for (const reservation of expired) {

    await prisma.$transaction(
      async (tx) => {

        await tx.inventory.updateMany({
          where: {
            productId:
              reservation.productId,

            warehouseId:
              reservation.warehouseId,
          },

          data: {
            reservedUnits: {
              decrement:
                reservation.quantity,
            },
          },
        });

        await tx.reservation.update({
          where: {
            id: reservation.id,
          },
          data: {
            status: "released",
          },
        });
      }
    );
  }

  return NextResponse.json({
    released:
      expired.length,
  });
}