## Реализация хэш-таблицы

Реализуйте класс для создания хэш-таблицы, где в качестве ключей можно использовать как примитивы, так и объекты.
Алгоритм хэш-функции можно взять любой. Коллизии можно решать через метод цепочек или используя открытую адресацию.
Хэш-таблица должна поддерживать расширение внутреннего буфера.

```typescript
// Задаем ёмкость внутреннего буфера
const map = new HashMap(120);

map.set("foo", 1);
map.set(42, 10);
map.set(document, 100);

console.log(map.get(42)); // 10
console.log(map.has(document)); // true
console.log(map.delete(document)); // 10
console.log(map.has(document)); // false
```

<details>
<summary><strong>Смотреть решение</strong></summary>

```js
class HashStrategy {
  hash(key, capacity) {
    throw new Error("hash method must be implemented");
  }
}

class DefaultHashStrategy extends HashStrategy {
  hash(key, capacity) {
    let hash;

    if (
      typeof key === "object" &&
      key !== null &&
      typeof key.hashCode === "function"
    ) {
      const hashValue = key.hashCode();

      if (typeof hashValue === "number") {
        hash = hashValue;
      } else if (typeof hashValue === "string") {
        hash = this.#stringHash(hashValue);
      } else if (
        hashValue instanceof ArrayBuffer ||
        hashValue instanceof SharedArrayBuffer
      ) {
        hash = this.#arrayBufferToNumber(hashValue);
      } else if (ArrayBuffer.isView(hashValue)) {
        hash = this.#typedArrayToNumber(hashValue);
      } else {
        throw new Error(
          "hashCode must return number, string, ArrayBuffer, SharedArrayBuffer, or TypedArray",
        );
      }
    } else if (typeof key === "string") {
      hash = this.#stringHash(key);
    } else if (typeof key === "number") {
      hash = key;
    } else if (typeof key === "boolean") {
      hash = key ? 1 : 0;
    } else if (key === null || key === undefined) {
      hash = 0;
    } else if (key instanceof ArrayBuffer || key instanceof SharedArrayBuffer) {
      hash = this.#arrayBufferToNumber(key);
    } else if (ArrayBuffer.isView(key)) {
      hash = this.#typedArrayToNumber(key);
    } else if (typeof key === "object") {
      const str = JSON.stringify(key);
      hash = this.#stringHash(str);
    } else {
      hash = String(key).length;
    }

    return Math.abs(hash) % capacity;
  }

  #stringHash(str) {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash >>> 0; // Преобразование в 32-битное беззнаковое целое
    }

    return hash;
  }

  #arrayBufferToNumber(arrayBuffer) {
    const view = new Uint8Array(arrayBuffer);
    return this.#typedArrayToNumber(view);
  }

  #typedArrayToNumber(typedArray) {
    let result = 0;

    const length = Math.min(typedArray.byteLength, 8);
    const uint8View = new Uint8Array(
      typedArray.buffer,
      typedArray.byteOffset,
      length,
    );

    for (let i = 0; i < length; i++) {
      result = (result << 8) | uint8View[i];
      result = result >>> 0;
    }

    return result;
  }
}

class HashMap {
  get size() {
    return this.#size;
  }

  get capacity() {
    return this.#capacity;
  }

  #size = 0;

  #capacity;
  #loadFactor;

  #buckets;
  #hashStrategy;

  constructor(config = {}) {
    const { capacity = 16, loadFactor = 0.75, hashStrategy = null } = config;

    this.#capacity = capacity;
    this.#loadFactor = loadFactor;
    this.#buckets = new Array(this.#capacity).fill(null);
    this.#hashStrategy = hashStrategy ?? new DefaultHashStrategy();
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  has(key) {
    const index = this.#hashStrategy.hash(key, this.#capacity);
    const head = this.#buckets[index];
    return this.#findNode(head, key) !== null;
  }

  get(key) {
    const index = this.#hashStrategy.hash(key, this.#capacity);
    const head = this.#buckets[index];
    return this.#findNode(head, key)?.value ?? undefined;
  }

  set(key, value) {
    if (this.#size / this.#capacity >= this.#loadFactor) {
      this.#resize();
    }

    const index = this.#hashStrategy.hash(key, this.#capacity);
    let head = this.#buckets[index];

    const existingNode = this.#findNode(head, key);

    if (existingNode !== null) {
      existingNode.value = value;
      return this;
    }

    this.#buckets[index] = {
      key: key,
      value: value,
      next: head,
    };

    this.#size++;

    return this;
  }

  delete(key) {
    const index = this.#hashStrategy.hash(key, this.#capacity);
    let head = this.#buckets[index];

    if (head === null) {
      return undefined;
    }

    if (this.#keysEqual(head.key, key)) {
      this.#buckets[index] = head.next;
      this.#size--;
      return head.value;
    }

    let current = head;

    while (current.next !== null) {
      if (this.#keysEqual(current.next.key, key)) {
        const deletedNode = current.next;
        current.next = deletedNode.next;
        this.#size--;
        return deletedNode.value;
      }

      current = current.next;
    }

    return undefined;
  }

  clear() {
    this.#size = 0;
    this.#buckets.fill(null);
  }

  *keys() {
    for (let i = 0; i < this.#capacity; i++) {
      let current = this.#buckets[i];
      while (current !== null) {
        yield current.key;
        current = current.next;
      }
    }
  }

  *values() {
    for (let i = 0; i < this.#capacity; i++) {
      let current = this.#buckets[i];

      while (current !== null) {
        yield current.value;
        current = current.next;
      }
    }
  }

  *entries() {
    for (let i = 0; i < this.#capacity; i++) {
      let current = this.#buckets[i];

      while (current !== null) {
        yield [current.key, current.value];
        current = current.next;
      }
    }
  }

  #findNode(bucketHead, key) {
    let current = bucketHead;

    while (current !== null) {
      if (this.#keysEqual(current.key, key)) {
        return current;
      }

      current = current.next;
    }

    return null;
  }

  #keysEqual(key1, key2) {
    if (key1 === key2) {
      return true;
    }

    if (
      (key1 instanceof ArrayBuffer || key1 instanceof SharedArrayBuffer) &&
      (key2 instanceof ArrayBuffer || key2 instanceof SharedArrayBuffer)
    ) {
      return this.#compareArrayBuffers(key1, key2);
    }

    if (ArrayBuffer.isView(key1) && ArrayBuffer.isView(key2)) {
      return this.#compareTypedArrays(key1, key2);
    }

    if (
      key1 !== null &&
      typeof key1 === "object" &&
      typeof key1.hashCode === "function" &&
      key2 !== null &&
      typeof key2 === "object" &&
      typeof key2.hashCode === "function"
    ) {
      const hash1 = key1.hashCode();
      const hash2 = key2.hashCode();

      if (typeof hash1 === "number" && typeof hash2 === "number") {
        return hash1 === hash2;
      }

      if (typeof hash1 === "string" && typeof hash2 === "string") {
        return hash1 === hash2;
      }

      if (
        (hash1 instanceof ArrayBuffer || hash1 instanceof SharedArrayBuffer) &&
        (hash2 instanceof ArrayBuffer || hash2 instanceof SharedArrayBuffer)
      ) {
        return this.#compareArrayBuffers(hash1, hash2);
      }

      if (ArrayBuffer.isView(hash1) && ArrayBuffer.isView(hash2)) {
        return this.#compareTypedArrays(hash1, hash2);
      }

      return false;
    }

    if (
      typeof key1 === "object" &&
      typeof key2 === "object" &&
      key1 !== null &&
      key2 !== null
    ) {
      return JSON.stringify(key1) === JSON.stringify(key2);
    }

    return false;
  }

  #compareArrayBuffers(buf1, buf2) {
    if (buf1.byteLength !== buf2.byteLength) {
      return false;
    }

    const view1 = new Uint8Array(buf1);
    const view2 = new Uint8Array(buf2);

    return this.#compareTypedArrays(view1, view2);
  }

  #compareTypedArrays(arr1, arr2) {
    if (arr1.byteLength !== arr2.byteLength) {
      return false;
    }

    const view1 = new Uint8Array(arr1.buffer, arr1.byteOffset, arr1.byteLength);
    const view2 = new Uint8Array(arr2.buffer, arr2.byteOffset, arr2.byteLength);

    for (let i = 0; i < view1.length; i++) {
      if (view1[i] !== view2[i]) {
        return false;
      }
    }

    return true;
  }

  #resize() {
    const newCapacity = this.#capacity * 2;
    const newBuckets = new Array(newCapacity).fill(null);

    const oldBuckets = this.#buckets;
    this.#buckets = newBuckets;
    this.#capacity = newCapacity;
    this.#size = 0;

    for (let i = 0; i < oldBuckets.length; i++) {
      let current = oldBuckets[i];

      while (current !== null) {
        this.set(current.key, current.value);
        current = current.next;
      }
    }
  }
}

{
  const map = new HashMap({ capacity: 4 });

  map.set("foo", 1);
  map.set("bar", 2);
  map.set("baz", 3);
  map.set(42, 10);

  console.assert(map.get("foo") === 1, "get(foo) should return 1");
  console.assert(map.get(42) === 10, "get(42) should return 10");
  console.assert(map.has("bar") === true, "has(bar) should return true");
  console.assert(map.delete("bar") === 2, "delete(bar) should return 2");
  console.assert(
    map.has("bar") === false,
    "has(bar) should return false after deletion",
  );
  console.assert(map.size === 3, "size should be 3");

  // Дополнительные тесты
  console.assert(
    map.get("bar") === undefined,
    "get(bar) should return undefined",
  );
  console.assert(map.has("foo") === true, "has(foo) should return true");
  console.assert(map.has("baz") === true, "has(baz) should return true");
  console.assert(map.has(42) === true, "has(42) should return true");
  console.assert(
    map.delete("nonexistent") === undefined,
    "delete(nonexistent) should return undefined",
  );
}

{
  class User {
    constructor(id, name, email) {
      this.id = id;
      this.name = name;
      this.email = email;
    }

    hashCode() {
      // Используем ID как число
      return this.id;
    }

    toString() {
      return `${this.name} (${this.id})`;
    }
  }

  class Point {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }

    hashCode() {
      return new Uint8Array([this.x, this.y]);
    }
  }

  const map = new HashMap({ capacity: 8 });

  const user1 = new User(1, "Alice", "alice@example.com");
  const user2 = new User(2, "Bob", "bob@example.com");
  const user3 = new User(3, "Charlie", "charlie@example.com");

  map.set(user1, { role: "admin", score: 100 });
  map.set(user2, { role: "user", score: 50 });
  map.set(user3, { role: "moderator", score: 75 });

  console.assert(map.get(user1)?.role === "admin", "User1 should be admin");
  console.assert(map.get(user2)?.score === 50, "User2 score should be 50");
  console.assert(map.has(user3) === true, "User3 should exist");

  const p1 = new Point(10, 20);
  const p2 = new Point(30, 40);
  const p3 = new Point(10, 20); // Те же координаты

  map.set(p1, "Point A");
  map.set(p2, "Point B");
  map.set(p3, "Point A Copy");

  console.assert(
    map.get(p1) === "Point A Copy",
    "Should get Point Point A Copy",
  );
  console.assert(
    map.get(p3) === "Point A Copy",
    "Should get Point A Copy (same coordinates)",
  );
  console.assert(map.get(p2) === "Point B", "Should get Point B");
}

console.log("All tests passed!");
```

</details>
