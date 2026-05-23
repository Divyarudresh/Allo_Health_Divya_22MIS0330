import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const reservation =
    await prisma.reservation.findUnique({
      where: {
        id,
      },
    });

  if (!reservation) {
    return NextResponse.json(
      {
        error: "Not found",
      },
      {
        status: 404,
      }
    );
  }

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

  return NextResponse.json({
    success: true,
  });
}