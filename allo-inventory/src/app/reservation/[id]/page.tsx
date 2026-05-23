"use client";

import {
  useEffect,
  useState,
} from "react";

import { useParams }
from "next/navigation";

export default function ReservationPage() {

  const params = useParams();

  const [reservation,
    setReservation] =
    useState<any>(null);

  const [timeLeft,
    setTimeLeft] =
    useState("");

  useEffect(() => {

    fetch(
      `/api/reservations/${params.id}`
    )
      .then((res) => res.json())
      .then(setReservation);

  }, []);

  useEffect(() => {

    if (!reservation) return;

    const interval =
      setInterval(() => {

        const diff =
          new Date(
            reservation.expiresAt
          ).getTime()
          - Date.now();

        if (diff <= 0) {
          setTimeLeft("Expired");
          clearInterval(interval);
          return;
        }

        const minutes =
          Math.floor(diff / 60000);

        const seconds =
          Math.floor(
            (diff % 60000) / 1000
          );

        setTimeLeft(
          `${minutes}m ${seconds}s`
        );

      }, 1000);

    return () =>
      clearInterval(interval);

  }, [reservation]);

  async function confirm() {

    const response =
      await fetch(
        `/api/reservations/${params.id}/confirm`,
        {
          method: "POST",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      alert(data.error);
      return;
    }

    alert("Purchase confirmed");
  }

  async function cancel() {

    await fetch(
      `/api/reservations/${params.id}/release`,
      {
        method: "POST",
      }
    );

    alert("Reservation cancelled");
  }

  if (!reservation) {
    return <p>Loading...</p>;
  }

  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold mb-6">
        Reservation
      </h1>

      <p>
        Status:
        {" "}
        {reservation.status}
      </p>

      <p>
        Expires in:
        {" "}
        {timeLeft}
      </p>

      <div className="flex gap-4 mt-6">

        <button
          onClick={confirm}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Confirm Purchase
        </button>

        <button
          onClick={cancel}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>

      </div>
    </div>
  );
}