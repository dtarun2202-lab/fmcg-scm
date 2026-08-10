/**
 * When available stock < total requested across pending orders, you need
 * to decide which orders to fulfill. Treat it as a 0/1 knapsack: each
 * order-item is an "item" with a weight (requestedQty) and a value
 * (priority score, optionally combined with order value/margin), and the
 * available stock is the knapsack capacity.
 *
 * This is a bounded-weight DP, so it's exact (not a heuristic) as long as
 * stock quantities stay in a reasonable integer range - which they do for
 * SKU-level allocation.
 */
export interface AllocationCandidate {
  orderItemId: string;
  requestedQty: number;
  value: number; // priority weight: e.g. CRITICAL=100, HIGH=50, STANDARD=10, LOW=1
}

export interface AllocationResult {
  allocated: AllocationCandidate[];
  totalAllocatedQty: number;
  totalValue: number;
}

export function allocateByKnapsack(
  candidates: AllocationCandidate[],
  availableStock: number
): AllocationResult {
  const n = candidates.length;
  const capacity = availableStock;

  // dp[i][w] = best achievable value using first i candidates with capacity w
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const { requestedQty, value } = candidates[i - 1];
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w]; // exclude this order-item
      if (requestedQty <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - requestedQty] + value);
      }
    }
  }

  // backtrack to find which items were selected
  const allocated: AllocationCandidate[] = [];
  let w = capacity;
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      allocated.push(candidates[i - 1]);
      w -= candidates[i - 1].requestedQty;
    }
  }

  const totalAllocatedQty = allocated.reduce((sum, c) => sum + c.requestedQty, 0);
  const totalValue = allocated.reduce((sum, c) => sum + c.value, 0);

  return { allocated: allocated.reverse(), totalAllocatedQty, totalValue };
}

/**
 * Fallback for when availableStock is large (DP table would be huge):
 * greedy by value-density (value / requestedQty). Not always optimal but
 * O(n log n) and fine for high-volume SKUs where exact optimality matters
 * less than throughput.
 */
export function allocateByGreedy(
  candidates: AllocationCandidate[],
  availableStock: number
): AllocationResult {
  const sorted = [...candidates].sort(
    (a, b) => b.value / b.requestedQty - a.value / a.requestedQty
  );

  const allocated: AllocationCandidate[] = [];
  let remaining = availableStock;

  for (const c of sorted) {
    if (c.requestedQty <= remaining) {
      allocated.push(c);
      remaining -= c.requestedQty;
    }
  }

  return {
    allocated,
    totalAllocatedQty: allocated.reduce((s, c) => s + c.requestedQty, 0),
    totalValue: allocated.reduce((s, c) => s + c.value, 0),
  };
}
