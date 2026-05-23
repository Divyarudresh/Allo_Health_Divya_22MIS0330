import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: { id: string };
  }
) {

  const reservation =
    await prisma.reservation.findUnique({
      where: {
        id: params.id,
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

  return NextResponse.json(
    reservation
  );
}