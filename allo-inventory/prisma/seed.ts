import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    name: "Digital Blood Pressure Monitor",
    category: "Diagnostics",
    description: "Upper-arm cuff with irregular heartbeat detection",
    stock: [
      { warehouse: "Bangalore", units: 24 },
      { warehouse: "Hyderabad", units: 18 },
      { warehouse: "Mumbai", units: 12 },
    ],
  },
  {
    name: "Pulse Oximeter",
    category: "Diagnostics",
    description: "SpO2 and heart rate readings with OLED display",
    stock: [
      { warehouse: "Bangalore", units: 40 },
      { warehouse: "Hyderabad", units: 22 },
    ],
  },
  {
    name: "Infrared Thermometer",
    category: "Diagnostics",
    description: "Non-contact forehead thermometer, 1-second reading",
    stock: [
      { warehouse: "Bangalore", units: 35 },
      { warehouse: "Mumbai", units: 20 },
    ],
  },
  {
    name: "Vitamin D3 60K IU",
    category: "Supplements",
    description: "Weekly softgel pack, 4 capsules",
    stock: [
      { warehouse: "Bangalore", units: 120 },
      { warehouse: "Hyderabad", units: 80 },
      { warehouse: "Mumbai", units: 95 },
    ],
  },
  {
    name: "Multivitamin Daily",
    category: "Supplements",
    description: "30-day tablet strip for adults",
    stock: [
      { warehouse: "Bangalore", units: 200 },
      { warehouse: "Hyderabad", units: 150 },
    ],
  },
  {
    name: "Omega-3 Fish Oil",
    category: "Supplements",
    description: "1000mg softgels, heart and joint support",
    stock: [
      { warehouse: "Mumbai", units: 75 },
      { warehouse: "Hyderabad", units: 60 },
    ],
  },
  {
    name: "N95 Respirator Masks (10 pack)",
    category: "PPE",
    description: "NIOSH-approved filtration, adjustable nose clip",
    stock: [
      { warehouse: "Bangalore", units: 500 },
      { warehouse: "Mumbai", units: 300 },
    ],
  },
  {
    name: "Medical Grade Hand Sanitizer 500ml",
    category: "PPE",
    description: "70% alcohol, pump bottle",
    stock: [
      { warehouse: "Bangalore", units: 180 },
      { warehouse: "Hyderabad", units: 140 },
      { warehouse: "Mumbai", units: 160 },
    ],
  },
  {
    name: "Home First Aid Kit",
    category: "Care",
    description: "Bandages, antiseptic, gloves, and essentials",
    stock: [
      { warehouse: "Bangalore", units: 45 },
      { warehouse: "Hyderabad", units: 30 },
    ],
  },
  {
    name: "Glucose Monitoring Strips (50)",
    category: "Care",
    description: "Compatible with standard glucometers",
    stock: [
      { warehouse: "Mumbai", units: 90 },
      { warehouse: "Bangalore", units: 70 },
    ],
  },
  {
    name: "Nebulizer Compressor",
    category: "Equipment",
    description: "Compact home nebulizer with adult and child masks",
    stock: [
      { warehouse: "Bangalore", units: 15 },
      { warehouse: "Hyderabad", units: 8 },
    ],
  },
  {
    name: "Wheelchair Standard",
    category: "Equipment",
    description: "Foldable frame with footrests and hand brakes",
    stock: [
      { warehouse: "Mumbai", units: 6 },
      { warehouse: "Bangalore", units: 4 },
    ],
  },
];

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const warehouses = await Promise.all(
    ["Bangalore", "Hyderabad", "Mumbai"].map((city) =>
      prisma.warehouse.create({
        data: { name: `${city} Warehouse` },
      })
    )
  );

  const warehouseByCity = Object.fromEntries(
    warehouses.map((w) => [w.name.replace(" Warehouse", ""), w])
  );

  for (const product of products) {
    const created = await prisma.product.create({
      data: {
        name: product.name,
        category: product.category,
        description: product.description,
      },
    });

    for (const entry of product.stock) {
      const warehouse = warehouseByCity[entry.warehouse];
      if (!warehouse) continue;

      await prisma.inventory.create({
        data: {
          productId: created.id,
          warehouseId: warehouse.id,
          totalUnits: entry.units,
        },
      });
    }
  }

  console.log(`Seeded ${products.length} products across ${warehouses.length} warehouses`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
