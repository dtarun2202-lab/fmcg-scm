import { MinHeap } from "../minHeap";
import { LRUCache } from "../lruCache";
import { Graph } from "../graph";
import { allocateByKnapsack } from "../knapsack";
import { Trie } from "../trie";

describe("MinHeap", () => {
  it("pops items in ascending priority order", () => {
    const heap = new MinHeap<string>();
    heap.push("expires-later", 300);
    heap.push("expires-soonest", 100);
    heap.push("expires-mid", 200);

    expect(heap.pop()).toBe("expires-soonest");
    expect(heap.pop()).toBe("expires-mid");
    expect(heap.pop()).toBe("expires-later");
    expect(heap.isEmpty()).toBe(true);
  });
});

describe("LRUCache", () => {
  it("evicts the least recently used item when over capacity", () => {
    const cache = new LRUCache<string, number>(2);
    cache.put("a", 1);
    cache.put("b", 2);
    cache.get("a"); // "a" is now most recently used
    cache.put("c", 3); // should evict "b"

    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(false);
    expect(cache.has("c")).toBe(true);
  });
});

describe("Graph / Dijkstra", () => {
  it("finds the shortest path between two nodes", () => {
    const graph = new Graph();
    graph.addEdge("W1", "R1", 10);
    graph.addEdge("W1", "R2", 100);
    graph.addEdge("R1", "R2", 5);

    const result = graph.shortestPath("W1", "R2");
    expect(result?.cost).toBe(15);
    expect(result?.path).toEqual(["W1", "R1", "R2"]);
  });
});

describe("Knapsack allocation", () => {
  it("prioritizes higher-value orders when stock is limited", () => {
    const result = allocateByKnapsack(
      [
        { orderItemId: "critical-order", requestedQty: 700, value: 100 },
        { orderItemId: "low-priority-order", requestedQty: 700, value: 1 },
      ],
      800 // only enough stock for one of the two orders
    );

    expect(result.allocated.map((c) => c.orderItemId)).toEqual(["critical-order"]);
    expect(result.totalAllocatedQty).toBe(700);
  });
});

describe("Trie", () => {
  it("returns matching product ids for a prefix", () => {
    const trie = new Trie();
    trie.insert("Classic Salted Chips", "prod-1");
    trie.insert("Classic Cream Cookies", "prod-2");
    trie.insert("Cola 500ml", "prod-3");

    const results = trie.searchByPrefix("Clas");
    expect(results.sort()).toEqual(["prod-1", "prod-2"]);
  });
});
