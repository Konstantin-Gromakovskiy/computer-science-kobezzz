type Key = string | number | object;
type Value = unknown;
type Bucket = { key: Key; value: Value; next: null | Bucket };

class HashStrategy {
  hash(key: Key, capacity: number): number {
    if (typeof key === "number") return this.#numberToHash(key, capacity);
    if (typeof key === "string") return this.#stringToHash(key, capacity);
    if (typeof key === "object" && key !== null)
      return this.#objectToHash(key, capacity);
    throw new Error("unsupported key type");
  }

  #numberToHash(key: number, capacity: number): number {
    const normalizedKey = Math.floor(key);
    return ((normalizedKey % capacity) + capacity) % capacity;
  }

  #stringToHash(key: string, capacity: number): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash += key.charCodeAt(i);
    }
    return hash % capacity;
  }

  #objectToHash(key: object, capacity: number): number {
    const str = JSON.stringify(key);
    const hash = this.#stringToHash(str, capacity);
    return hash;
  }
}

interface HashMapI {
  set(key: Key, value: Value): void;
  get(key: Key): Value | undefined;
  has(key: Key): boolean;
  delete(key: Key): Value;
}

class HashMap implements HashMapI {
  #capacity: number;
  #buckets: Array<null | Bucket>;
  hashStrategy = new HashStrategy();
  loadFactor = 0.75;
  size = 0;
  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error("capacity must be positive integer");
    }
    this.#capacity = capacity;
    this.#buckets = new Array(capacity).fill(null);
  }

  set(key: Key, value: Value): void {
    if (this.size / this.#capacity >= this.loadFactor) this.#resize();

    const hash = this.hashStrategy.hash(key, this.#capacity);
    const bucket = { key, value, next: null };
    if (!this.#buckets[hash]) {
      this.#buckets[hash] = bucket;
    } else {
      let currentBucket = this.#buckets[hash];
      while (currentBucket) {
        if (currentBucket.key === key) {
          currentBucket.value = value;
          return;
        }
        if (!currentBucket.next) {
          currentBucket.next = bucket;
          this.size++;
          return;
        }
        currentBucket = currentBucket.next;
      }
    }
    this.size++;
  }

  get(key: Key): Value | undefined {
    const hash = this.hashStrategy.hash(key, this.#capacity);
    let bucket: Bucket | null = this.#buckets[hash];
    while (bucket) {
      if (bucket.key === key) return bucket.value;
      bucket = bucket.next;
    }
    return undefined;
  }

  has(key: Key): boolean {
    const hash = this.hashStrategy.hash(key, this.#capacity);
    let bucket: Bucket | null = this.#buckets[hash];
    while (bucket) {
      if (bucket.key === key) return true;
      bucket = bucket.next;
    }
    return false;
  }

  delete(key: Key): Value {
    const hash = this.hashStrategy.hash(key, this.#capacity);
    let bucket: Bucket | null = this.#buckets[hash];
    let prev: Bucket | null = null;
    while (bucket) {
      if (bucket.key === key) {
        if (prev) prev.next = bucket.next;
        else this.#buckets[hash] = bucket.next;
        this.size--;
        return bucket.value;
      }

      prev = bucket;
      bucket = bucket.next;
    }
    throw new Error("key not found");
  }
  #resize() {
    const newCapacity = this.#capacity * 2;
    const newBuckets: Array<null | Bucket> = new Array(newCapacity).fill(null);
    for (const bucket of this.#buckets) {
      let currentBucket = bucket;
      while (currentBucket) {
        const hash = this.hashStrategy.hash(currentBucket.key, newCapacity);
        const newBucket = { ...currentBucket, next: null };
        if (!newBuckets[hash]) {
          newBuckets[hash] = newBucket;
        } else {
          let lastBucket = newBuckets[hash];
          while (lastBucket?.next) {
            lastBucket = lastBucket.next;
          }
          if (lastBucket) lastBucket.next = newBucket;
        }
        currentBucket = currentBucket.next;
      }
    }
    this.#buckets = newBuckets;
    this.#capacity = newCapacity;
  }
}

const map = new HashMap(10);
map.set(1, "one");
map.set(11, "eleven");

console.log(map.get(1));
console.log(map.get(11));
console.log(map.has(1));
console.log(map.has(11));
console.log(map.delete(1));
console.log(map.get(1));
console.log(typeof null);
