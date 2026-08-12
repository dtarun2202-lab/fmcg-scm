import { prisma } from "../../config/db";
import { MinHeap } from "../../utils/minHeap";

interface BatchLite {
  id: string;
  quantity: number;
  expiryDate: Date;
}

export async function getAllInventoryBatches() {
  return prisma.inventoryBatch.findMany({
    orderBy: {
      expiryDate: "asc",
    },
    include: {
      product: true,
      warehouse: true,
    },
  });
}

/**
 * FEFO dispatch: given a product + warehouse and a quantity to fulfil,
 * pull from the batch expiring soonest first. Returns which batches to
 * deduct from and by how much - caller is responsible for the actual
 * DB writes inside a transaction.
 */
export async function planFefoDispatch(
  productId: string,
  warehouseId: string,
  quantityNeeded: number
): Promise<{ batchId: string; quantityTaken: number }[]> {
  const batches: BatchLite[] = await prisma.inventoryBatch.findMany({
    where: { productId, warehouseId, quantity: { gt: 0 } },
    select: { id: true, quantity: true, expiryDate: true },
  });

  const heap = new MinHeap<BatchLite>();
  for (const batch of batches) {
    heap.push(batch, batch.expiryDate.getTime());
  }

  const plan: { batchId: string; quantityTaken: number }[] = [];
  let remaining = quantityNeeded;

  while (remaining > 0 && !heap.isEmpty()) {
    const batch = heap.pop()!;
    const take = Math.min(batch.quantity, remaining);
    plan.push({ batchId: batch.id, quantityTaken: take });
    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error(
      `Insufficient stock: short by ${remaining} units for product ${productId} at warehouse ${warehouseId}`
    );
  }

  return plan;
}

/** Applies a dispatch plan inside a transaction, decrementing batch quantities. */
export async function executeFefoDispatch(
  plan: { batchId: string; quantityTaken: number }[]
): Promise<void> {
  await prisma.$transaction(
    plan.map(({ batchId, quantityTaken }) =>
      prisma.inventoryBatch.update({
        where: { id: batchId },
        data: { quantity: { decrement: quantityTaken } },
      })
    )
  );
}

/** Batches expiring within `withinDays`, soonest first - powers the alert engine. */
export async function getExpiringBatches(withinDays = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);

  return prisma.inventoryBatch.findMany({
    where: { expiryDate: { lte: cutoff }, quantity: { gt: 0 } },
    orderBy: { expiryDate: "asc" },
    include: { product: true, warehouse: true },
  });
}