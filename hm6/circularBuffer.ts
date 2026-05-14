export interface CircularBufferSnapshot {
  buffer: number[];
  start: number;
  end: number;
  length: number;
  capacity: number;
  logical: number[];
  occupiedIndexes: number[];
}

interface CircularBufferI {
  pop(): number;
  push(item: number): void;
  shift(): number;
  unshift(item: number): void;
  at(index: number): number | undefined;
  snapshot(): CircularBufferSnapshot;
}

export class CircularBuffer implements CircularBufferI {
  #buffer: number[];
  #start = 0;
  #end = 0;
  #length = 0;

  constructor(size: number) {
    if (size <= 0) throw new Error("size must be greater than 0");
    this.#buffer = new Array(size).fill(0);
  }

  pop(): number {
    if (this.#length <= 0) throw new Error("buffer is empty");
    this.#end--;
    if (this.#end < 0) this.#end = this.#buffer.length + this.#end;
    const item = this.#buffer.at(this.#end);
    if (item === undefined) throw new Error("buffer item not found");
    this.#buffer[this.#end] = 0;
    this.#length--;
    return item;
  }

  push(item: number): void {
    if (this.#length >= this.#buffer.length) throw new Error("buffer is full");
    this.#buffer[this.#end] = item;
    this.#end++;
    this.#length++;
    if (this.#end >= this.#buffer.length) this.#end = 0;
  }
  shift(): number {
    if (this.#length <= 0) throw new Error("buffer is empty");
    const item = this.#buffer[this.#start];
    if (item === undefined) throw new Error("buffer item not found");
    this.#buffer[this.#start] = 0;
    this.#start++;
    if (this.#start >= this.#buffer.length) this.#start = 0;
    this.#length--;
    return item;
  }
  unshift(item: number): void {
    if (this.#length >= this.#buffer.length) throw new Error("buffer is full");
    this.#start--;
    if (this.#start < 0) this.#start = this.#buffer.length + this.#start;
    this.#buffer[this.#start] = item;
    this.#length++;
  }
  at(index: number): number | undefined {
    if (index < 0) index = this.#length + index;
    if (index < 0 || index >= this.#length) return undefined;
    return this.#buffer[(this.#start + index) % this.#buffer.length];
  }

  snapshot(): CircularBufferSnapshot {
    return {
      buffer: [...this.#buffer],
      start: this.#start,
      end: this.#end,
      length: this.#length,
      capacity: this.#buffer.length,
      logical: Array.from({ length: this.#length }, (_, index) => this.at(index) as number),
      occupiedIndexes: Array.from(
        { length: this.#length },
        (_, offset) => (this.#start + offset) % this.#buffer.length,
      ),
    };
  }
}
