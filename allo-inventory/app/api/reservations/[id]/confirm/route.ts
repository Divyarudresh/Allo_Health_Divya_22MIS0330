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

  if (
    reservation.expiresAt <
    new Date()
  ) {

    return NextResponse.json(
      {
        error:
          "Reservation expired",
      },
      {
        status: 410,
      }
    );
  }

  const updated =
    await prisma.reservation.update({
      where: {
        id,
      },
      data: {
        status: "confirmed",
      },
    });

  return NextResponse.json(
    updated
  );
}