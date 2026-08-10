import { PrismaClient, OrderPriority } from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  // Warehouses
  const whNorth = await prisma.warehouse.create({
    data: { name: "North DC", location: "Delhi", lat: 28.7041, lng: 77.1025, capacity: 100000 },
  });
  const whSouth = await prisma.warehouse.create({
    data: { name: "South DC", location: "Hyderabad", lat: 17.385, lng: 78.4867, capacity: 80000 },
  });

  // Retailers
  const retailerA = await prisma.retailer.create({
    data: { name: "Retailer A", location: "Gurugram", lat: 28.4595, lng: 77.0266 },
  });
  const retailerB = await prisma.retailer.create({
    data: { name: "Retailer B", location: "Secunderabad", lat: 17.4399, lng: 78.4983 },
  });

  // Routes (graph edges)
  await prisma.distributionRoute.createMany({
    data: [
      { warehouseId: whNorth.id, retailerId: retailerA.id, distanceKm: 32, avgTransitMin: 60 },
      { warehouseId: whSouth.id, retailerId: retailerB.id, distanceKm: 12, avgTransitMin: 25 },
      { warehouseId: whNorth.id, retailerId: retailerB.id, distanceKm: 1560, avgTransitMin: 1200 },
    ],
  });

  // Products
  const chips = await prisma.product.create({
    data: { sku: "SKU-CHIPS-001", name: "Classic Salted Chips", category: "Snacks", shelfLifeDays: 120, unitCost: 20 },
  });
  const soda = await prisma.product.create({
    data: { sku: "SKU-SODA-002", name: "Cola 500ml", category: "Beverages", shelfLifeDays: 270, unitCost: 15 },
  });

  // Inventory batches (multiple expiries per SKU -> tests FEFO)
  await prisma.inventoryBatch.createMany({
    data: [
      { productId: chips.id, warehouseId: whNorth.id, quantity: 500, mfgDate: daysFromNow(-90), expiryDate: daysFromNow(5) },
      { productId: chips.id, warehouseId: whNorth.id, quantity: 800, mfgDate: daysFromNow(-10), expiryDate: daysFromNow(90) },
      { productId: soda.id, warehouseId: whSouth.id, quantity: 1000, mfgDate: daysFromNow(-30), expiryDate: daysFromNow(200) },
    ],
  });

  // Demand history (last 30 days, random-ish)
  const demandRows = [];
  for (let i = 0; i < 30; i++) {
    demandRows.push({
      productId: chips.id,
      warehouseId: whNorth.id,
      date: daysFromNow(-i),
      unitsSold: 15 + Math.floor(Math.random() * 10),
    });
  }
  await prisma.demandHistory.createMany({ data: demandRows });

  // Orders (more requested than available -> tests knapsack allocation)
  const order1 = await prisma.order.create({
    data: { retailerId: retailerA.id, priority: OrderPriority.CRITICAL, status: "PENDING" },
  });
  const order2 = await prisma.order.create({
    data: { retailerId: retailerB.id, priority: OrderPriority.LOW, status: "PENDING" },
  });

  await prisma.orderItem.createMany({
    data: [
      { orderId: order1.id, productId: chips.id, requestedQty: 700 },
      { orderId: order2.id, productId: chips.id, requestedQty: 700 },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
