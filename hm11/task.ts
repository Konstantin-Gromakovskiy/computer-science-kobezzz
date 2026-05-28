interface StackPointerI {
  deref(): ArrayBufferLike;
  change(value: ArrayBufferLike): void;
}

interface HeapPointerI extends StackPointerI {
  free(): void;
}

interface MemoryI {
  push(value: ArrayBuffer): StackPointerI;
  pop(): void;
  alloc(size: number): HeapPointerI;
}

class BlockMetadata {
  view: DataView;

  constructor(buffer: ArrayBufferLike, byteOffset: number) {
    this.view = new DataView(buffer, byteOffset, 4);
  }

  get value(): number {
    return this.view.getInt32(0);
  }

  set value(value: number) {
    this.view.setInt32(0, value);
  }
}

class StackPointer implements StackPointerI {
  metadata: BlockMetadata;
  bytes: Uint8Array;
  constructor(payload: Uint8Array, metadata: BlockMetadata) {
    this.bytes = payload;
    this.metadata = metadata;
  }
  deref(): ArrayBufferLike {
    return this.bytes.slice().buffer;
  }
  change(value: ArrayBuffer): void {
    const valueBytes = new Uint8Array(value);
    const valueByteLenth = valueBytes.byteLength;
    if (valueByteLenth > this.bytes.byteLength)
      throw new Error("value bigger then memory item");

    this.bytes.fill(0);
    this.bytes.set(valueBytes);
  }
}

class HeapPointer extends StackPointer {
  free() {
    if (this.metadata.value < 0) throw new Error("❌ Error: double free detected");

    this.metadata.value = -this.metadata.value;
  }
}

class Memory {
  #metaDataByteLenth = 4;
  stack: Uint8Array;
  heap: Uint8Array;
  buffer: ArrayBufferLike;
  stackView: DataView;
  heapView: DataView;
  stackCursor = 0;
  constructor(totalMemory: number, options: { stackMemoryValue: number }) {
    const { stackMemoryValue } = options;
    this.buffer = new ArrayBuffer(totalMemory);
    const bytes = new Uint8Array(this.buffer, 0);
    this.stackView = new DataView(this.buffer, 0, stackMemoryValue);
    this.stack = bytes.subarray(0, stackMemoryValue);
    this.heap = bytes.subarray(stackMemoryValue);
    this.heapView = new DataView(this.buffer, stackMemoryValue);
    const heapSize = totalMemory - stackMemoryValue;
    //Если число размера блока положительное - блок занят, если отрицательное - свободен
    this.heapView.setInt32(0, -(heapSize - 4));
  }

  push(value: ArrayBuffer): StackPointerI {
    const valueBytes = new Uint8Array(value);
    const valueByteLenth = valueBytes.byteLength;
    const nextCursorOffset = valueByteLenth + this.#metaDataByteLenth;

    if (this.stackCursor + nextCursorOffset > this.stack.byteLength)
      throw new Error("Stack over flow");

    this.stack.set(valueBytes, this.stackCursor);
    this.stackView.setUint32(this.stackCursor + valueByteLenth, valueByteLenth);
    this.stackCursor += nextCursorOffset;
    const payload = this.stack.subarray(
      this.stackCursor - nextCursorOffset,
      this.stackCursor - this.#metaDataByteLenth,
    );
    const metadata = new BlockMetadata(
      this.buffer,
      payload.byteOffset + payload.byteLength,
    );
    metadata.value = valueByteLenth;

    return new StackPointer(payload, metadata);
  }
  pop() {
    if (this.stackCursor === 0) throw new Error("Stack underflow");
    const lastItemLenth = this.stackView.getInt32(
      this.stackCursor - this.#metaDataByteLenth,
    );
    this.stackCursor -= lastItemLenth + this.#metaDataByteLenth;
  }
  alloc(size: number): HeapPointerI {
    if (!Number.isInteger(size) || size <= 0) {
      throw new RangeError("Allocation size must be a positive integer");
    }

    return searchFreeMemory(this.heap, size, 0);
  }
}

function searchFreeMemory(
  heapBytes: Uint8Array,
  seartchebleSize: number,
  offset: number,
) {
  if (offset + 4 > heapBytes.byteLength)
    throw new Error("free memory is not founded");
  const bytesView = new DataView(
    heapBytes.buffer,
    heapBytes.byteOffset,
    heapBytes.byteLength,
  );
  const blockSize = bytesView.getInt32(offset);
  if (blockSize === 0) throw new Error("free memory is not founded");

  const isFree = blockSize < 0;

  if (isFree && Math.abs(blockSize) >= seartchebleSize) {
    const blockView = new DataView(
      heapBytes.buffer,
      heapBytes.byteOffset,
      heapBytes.byteLength,
    );
    const freePayloadSize = Math.abs(blockSize);
    const remainingPayloadSize = freePayloadSize - seartchebleSize - 4;
    const allocatedPayloadSize =
      remainingPayloadSize > 0 ? seartchebleSize : freePayloadSize;

    blockView.setInt32(offset, allocatedPayloadSize);

    const nextHeaderOffset = offset + 4 + allocatedPayloadSize;
    if (remainingPayloadSize > 0) {
      blockView.setInt32(nextHeaderOffset, -remainingPayloadSize);
    }
    return new HeapPointer(
      heapBytes.subarray(offset + 4, offset + 4 + seartchebleSize),
      new BlockMetadata(heapBytes.buffer, heapBytes.byteOffset + offset),
    );
  }
  return searchFreeMemory(
    heapBytes,
    seartchebleSize,

    offset + 4 + Math.abs(blockSize),
  );
}

const mem = new Memory(128, { stackMemoryValue: 32 });

const value1 = new Uint8Array([4, 5, 2, 6]);
const value2 = new Uint8Array([7, 5, 7]);

const pointer1 = mem.push(value1.buffer);
mem.push(value2.buffer);
pointer1.change(value2.buffer);
mem.pop();

const alloc = mem.alloc(5);
console.log("alloc", alloc.deref());
