/**
 * LRU cache built from a doubly linked list + hash map, O(1) get/set.
 *
 * JS Maps preserve insertion order, which is enough to fake an LRU with
 * delete+re-insert, but implementing the linked list explicitly is what
 * shows you understand the mechanism (and is the version interviewers
 * actually ask for). Swap this for Redis in production once you need
 * cross-instance sharing - the eviction logic here is what Redis's
 * `maxmemory-policy allkeys-lru` is doing under the hood.
 */
class Node<K, V> {
  key: K;
  value: V;
  prev: Node<K, V> | null = null;
  next: Node<K, V> | null = null;

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

export class LRUCache<K, V> {
  private capacity: number;
  private map = new Map<K, Node<K, V>>();
  private head: Node<K, V>; // most recently used sits right after head
  private tail: Node<K, V>; // least recently used sits right before tail

  constructor(capacity: number) {
    if (capacity <= 0) throw new Error("LRUCache capacity must be > 0");
    this.capacity = capacity;
    this.head = new Node<K, V>(null as unknown as K, null as unknown as V);
    this.tail = new Node<K, V>(null as unknown as K, null as unknown as V);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.moveToFront(node);
    return node.value;
  }

  put(key: K, value: V): void {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.moveToFront(existing);
      return;
    }

    const node = new Node(key, value);
    this.map.set(key, node);
    this.insertAtFront(node);

    if (this.map.size > this.capacity) {
      const lru = this.tail.prev!;
      this.remove(lru);
      this.map.delete(lru.key);
    }
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  get size(): number {
    return this.map.size;
  }

  private remove(node: Node<K, V>): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private insertAtFront(node: Node<K, V>): void {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private moveToFront(node: Node<K, V>): void {
    this.remove(node);
    this.insertAtFront(node);
  }
}
