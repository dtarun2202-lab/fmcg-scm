/**
 * Trie for product name / SKU autocomplete. O(k) lookup for a prefix of
 * length k, instead of a LIKE '%query%' table scan. Rebuild or incrementally
 * update this in memory whenever the product catalog changes; for a catalog
 * of a few thousand SKUs this comfortably lives in a Node process.
 */
class TrieNode {
  children = new Map<string, TrieNode>();
  isEndOfWord = false;
  productIds: Set<string> = new Set();
}

export class Trie {
  private root = new TrieNode();

  insert(word: string, productId: string): void {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) node.children.set(char, new TrieNode());
      node = node.children.get(char)!;
      node.productIds.add(productId);
    }
    node.isEndOfWord = true;
  }

  /** Returns up to `limit` product IDs whose indexed name/SKU starts with prefix. */
  searchByPrefix(prefix: string, limit = 10): string[] {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      const next = node.children.get(char);
      if (!next) return [];
      node = next;
    }
    return Array.from(node.productIds).slice(0, limit);
  }
}
