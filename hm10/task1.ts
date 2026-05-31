type TypedArray =
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Float32Array
  | Float64Array
  | Array<number>;

type TypedArrayConstructor<T extends TypedArray = TypedArray> = {
  new (length: number): T;
};

interface NodeI<T> {
  value: T;
  next: NodeI<T> | null;
  prev: NodeI<T> | null;
}

interface LinkedListI<T> {
  last: NodeI<T> | null;
  first: NodeI<T> | null;
  pushForward(value: T): void;
  popForward(): T;
  pushBackward(value: T): void;
  popBackward(): T;
}

class LinkedList<T> implements LinkedListI<T> {
  first: NodeI<T> | null = null;
  last: NodeI<T> | null = null;
  constructor(value: T) {
    const node: NodeI<T> = {
      value,
      next: null,
      prev: null,
    };
    this.first = node;
    this.last = node;
  }
  pushForward(value: T): void {
    const node: NodeI<T> = {
      value,
      next: this.first,
      prev: null,
    };
    if (this.first) this.first.prev = node;
    else this.last = node;
    this.first = node;
  }
  popForward(): T {
    if (!this.first) throw new Error("List is empty");
    const value = this.first.value;
    this.first = this.first.next;
    if (this.first) this.first.prev = null;
    else this.last = null;
    return value;
  }
  pushBackward(value: T): void {
    const node: NodeI<T> = {
      value,
      next: null,
      prev: this.last,
    };
    if (this.last) this.last.next = node;
    else this.first = node;
    this.last = node;
  }
  popBackward(): T {
    if (!this.last) throw new Error("List is empty");
    const value = this.last.value;
    this.last = this.last.prev;
    if (this.last) this.last.next = null;
    else this.first = null;
    return value;
  }
}

class Dequeue {
  private readonly BLOCK_SIZE: number = 1000;
  private readonly type: TypedArrayConstructor;
  linkedList: LinkedListI<TypedArray>;
  firstElemIndex: number;
  lastElemIndex: number;
  #mod = (index: number) =>
    ((index % this.BLOCK_SIZE) + this.BLOCK_SIZE) % this.BLOCK_SIZE;

  constructor(type: TypedArrayConstructor, length: number) {
    if (!Number.isInteger(length) || length <= 0) {
      throw new Error("Chunk size must be a positive integer");
    }
    this.BLOCK_SIZE = length;
    this.type = type;
    this.linkedList = new LinkedList<TypedArray>(new type(length));
    const middle = Math.floor(this.BLOCK_SIZE / 2);
    this.firstElemIndex = middle;
    this.lastElemIndex = middle - 1;
  }

  push(value: number): void {
    if (this.#mod(this.lastElemIndex + 1) === 0)
      this.linkedList.pushBackward(new this.type(this.BLOCK_SIZE));

    this.lastElemIndex++;
    const chunkIndex = this.#mod(this.lastElemIndex);
    if (this.linkedList.last === null) throw new Error("List is empty");
    this.linkedList.last.value[chunkIndex] = value;
  }

  pop(): number {
    if (this.lastElemIndex - this.firstElemIndex < 0)
      throw new Error("Dequeue is empty");
    const chunkIndex = this.#mod(this.lastElemIndex);
    if (this.linkedList.last === null) throw new Error("List is empty");
    const value = this.linkedList.last.value[chunkIndex];

    if (chunkIndex === 0 && this.linkedList.first !== this.linkedList.last) {
      this.linkedList.popBackward();
    }

    this.lastElemIndex--;
    return value;
  }
  unshift(value: number): void {
    if (this.#mod(this.firstElemIndex) === 0)
      this.linkedList.pushForward(new this.type(this.BLOCK_SIZE));
    this.firstElemIndex--;

    const chunkIndex = this.#mod(this.firstElemIndex);
    if (this.linkedList.first === null) throw new Error("List is empty");
    this.linkedList.first.value[chunkIndex] = value;
  }
  shift(): number {
    if (this.lastElemIndex - this.firstElemIndex < 0)
      throw new Error("Dequeue is empty");

    const chunkIndex = this.#mod(this.firstElemIndex);
    if (this.linkedList.first === null) throw new Error("List is empty");

    const value = this.linkedList.first.value[chunkIndex];
    if (
      chunkIndex === this.BLOCK_SIZE - 1 &&
      this.linkedList.first !== this.linkedList.last
    ) {
      this.linkedList.popForward();
    }
    this.firstElemIndex++;
    return value;
  }
}

const list = new LinkedList([1, 2, 3, 4]);

list.pushBackward([2, 3, 4, 5]);
console.log("list", list);

console.log("popForward 1 elem", list.popForward());
console.log("popForward 2 elem", list.popForward());
console.log("popForward 3 elem", list.popForward());
