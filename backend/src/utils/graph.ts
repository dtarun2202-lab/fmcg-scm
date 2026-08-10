import { MinHeap } from "./minHeap";

/**
 * Weighted, directed graph for the distribution network
 * (warehouses + retailers as nodes, DistributionRoute rows as edges).
 *
 * Dijkstra gives you shortest-cost path between any two nodes - use it for
 * "what's the fastest way to get stock from any warehouse to this retailer".
 * For the harder problem (one truck, many stops - a small Vehicle Routing
 * Problem) see `nearestNeighborRoute` below: exact TSP is NP-hard, so a
 * nearest-neighbor + 2-opt heuristic is the standard practical approach and
 * a good thing to be able to explain in an interview.
 */
export class Graph {
  private adjacency = new Map<string, { to: string; weight: number }[]>();

  addNode(id: string): void {
    if (!this.adjacency.has(id)) this.adjacency.set(id, []);
  }

  addEdge(from: string, to: string, weight: number, bidirectional = true): void {
    this.addNode(from);
    this.addNode(to);
    this.adjacency.get(from)!.push({ to, weight });
    if (bidirectional) this.adjacency.get(to)!.push({ to: from, weight });
  }

  /** Dijkstra shortest path. Returns ordered path + total cost, or null if unreachable. */
  shortestPath(start: string, end: string): { path: string[]; cost: number } | null {
    const dist = new Map<string, number>();
    const prev = new Map<string, string>();
    const visited = new Set<string>();
    const heap = new MinHeap<string>();

    for (const node of this.adjacency.keys()) dist.set(node, Infinity);
    dist.set(start, 0);
    heap.push(start, 0);

    while (!heap.isEmpty()) {
      const current = heap.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      if (current === end) break;

      for (const edge of this.adjacency.get(current) ?? []) {
        const newDist = dist.get(current)! + edge.weight;
        if (newDist < (dist.get(edge.to) ?? Infinity)) {
          dist.set(edge.to, newDist);
          prev.set(edge.to, current);
          heap.push(edge.to, newDist);
        }
      }
    }

    if (dist.get(end) === Infinity || dist.get(end) === undefined) return null;

    const path: string[] = [];
    let node: string | undefined = end;
    while (node !== undefined) {
      path.unshift(node);
      node = prev.get(node);
    }

    return { path, cost: dist.get(end)! };
  }

  /**
   * Nearest-neighbor heuristic for a single-truck multi-stop route
   * (a simplified VRP). Not optimal, but O(n^2) and good enough as a
   * baseline - mention in your README that a 2-opt pass is the natural
   * next improvement if you want to push this further.
   */
  nearestNeighborRoute(depot: string, stops: string[]): string[] {
    const remaining = new Set(stops);
    const route: string[] = [depot];
    let current = depot;

    while (remaining.size > 0) {
      let nearest: string | null = null;
      let nearestCost = Infinity;

      for (const stop of remaining) {
        const result = this.shortestPath(current, stop);
        if (result && result.cost < nearestCost) {
          nearestCost = result.cost;
          nearest = stop;
        }
      }

      if (nearest === null) break; // unreachable stops left
      route.push(nearest);
      remaining.delete(nearest);
      current = nearest;
    }

    return route;
  }
}
