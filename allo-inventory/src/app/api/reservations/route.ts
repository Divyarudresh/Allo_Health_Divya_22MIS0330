import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest
) {

  const body = await req.json();

  const {
    productId,
    warehouseId,
    quantity,
  } = body;

  try {

    const reservation =
      await prisma.$transaction(
        async (tx) => {

          const inventory =
            await tx.inventory.findUnique({
              where: {
                productId_warehouseId: {
                  productId,
                  warehouseId,
                },
              },
            });

          if (!inventory) {
            throw new Error(
              "Inventory not found"
            );
          }

          const availableStock =
            inventory.totalUnits -
            inventory.reservedUnits;

          if (
            availableStock < quantity
          ) {
            return null;
          }

          await tx.inventory.update({
            where: {
              id: inventory.id,
            },
            data: {
              reservedUnits: {
                increment: quantity,
              },
            },
          });

          const reservation =
            await tx.reservation.create({
              data: {
                productId,
                warehouseId,
                quantity,

                status: "pending",

                expiresAt:
                  new Date(
                    Date.now() +
                    10 * 60 * 1000
                  ),
              },
            });

          return reservation;
        }
      );

    if (!reservation) {
      return NextResponse.json(
        {
          error:
            "Not enough stock",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      reservation
    );

  } catch (error) {

    return NextResponse.json(
      {
        error:
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}