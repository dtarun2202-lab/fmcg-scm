import { prisma } from "../../config/db";
import { LRUCache } from "../../utils/lruCache";
import { Trie } from "../../utils/trie";

// Cache up to 500 recently-looked-up products in memory. Swap the class
// import for a Redis-backed wrapper later without changing callers below.
const productCache = new LRUCache<string, unknown>(500);
const searchTrie = new Trie();
let trieBuilt = false;

export async function getProductBySku(sku: string) {
  const cached = productCache.get(sku);
  if (cached) return cached;

  const product = await prisma.product.findUnique({ where: { sku } });
  if (product) productCache.put(sku, product);
  return product;
}

export async function buildSearchIndex(): Promise<void> {
  const products = await prisma.product.findMany({ select: { id: true, name: true, sku: true } });
  for (const p of products) {
    searchTrie.insert(p.name, p.id);
    searchTrie.insert(p.sku, p.id);
  }
  trieBuilt = true;
}

export async function searchProducts(prefix: string, limit = 10) {
  if (!trieBuilt) await buildSearchIndex();
  const ids = searchTrie.searchByPrefix(prefix, limit);
  if (ids.length === 0) return [];
  return prisma.product.findMany({ where: { id: { in: ids } } });
}
