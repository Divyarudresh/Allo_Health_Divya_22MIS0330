import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: any
) {

  const params =
    await context.params;

  const reservation =
    await prisma.reservation.findUnique({
      where: {
        id: params.id,
      },

      include: {
        product: true,
        warehouse: true,
      },
    });

  if (!reservation) {

    return NextResponse.json(
      {
        error:
          "Reservation not found",
      },

      {
        status: 404,
      }
    );
  }

  return NextResponse.json({
    id: reservation.id,

    status:
      reservation.status,

    quantity:
      reservation.quantity,

    expiresAt:
      reservation.expiresAt,

    productName:
      reservation.product.name,

    warehouseName:
      reservation.warehouse.name,
  });
}