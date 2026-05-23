"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {

  const [products, setProducts] =
    useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {

    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);

  }, []);

  async function reserve(item: any) {

    const response =
      await fetch(
        "/api/reservations",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            productId:
              item.productId,

            warehouseId:
              item.warehouseId,

            quantity: 1,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      alert(data.error);
      return;
    }

    router.push(
      `/reservation/${data.id}`
    );
  }

  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold mb-6">
        Products
      </h1>

      <div className="space-y-4">

        {products.map((item) => (

          <div
            key={item.inventoryId}
            className="border p-5 rounded"
          >

            <h2 className="text-xl">
              {item.productName}
            </h2>

            <p>
              Warehouse:
              {" "}
              {item.warehouseName}
            </p>

            <p>
              Available:
              {" "}
              {item.availableStock}
            </p>

            <button
              onClick={() =>
                reserve(item)
              }
              className="bg-black text-white px-4 py-2 rounded mt-3"
            >
              Reserve
            </button>

          </div>
        ))}
      </div>
    </div>
  );
}