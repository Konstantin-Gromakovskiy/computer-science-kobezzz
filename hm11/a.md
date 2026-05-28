## Менеджер памяти на основе ArrayBuffer

Реализуйте менеджер памяти, который управляет двумя регионами: стеком (LIFO, быстрая память) и кучей (динамическое выделение и освобождение). Стек и куча разделяют общий ArrayBuffer. Стек растёт с начала буфера, куча — с конца (или наоборот). Реализуйте безопасные указатели с защитой от двойного освобождения.

```js
// Общий размер памяти — 100 КБ
// Из них 10 КБ резервируется под стек, остальное — под кучу
const mem = new Memory(100 * 1024, { stack: 10 * 1024 });

// ============================================
//  Работа со стеком (LIFO)
// ============================================

// Добавляем данные в стек
// Возвращает указатель на первый байт сохранённых данных
const pointer1 = mem.push(arrayBuffer1);

// Добавляем ещё один блок в стек (ляжет поверх предыдущего)
mem.push(arrayBuffer2);

// Извлекаем значение по указателю (без удаления из стека)
console.log(pointer1.deref()); // arrayBuffer1

// Изменяем данные по указателю (заменяем содержимое)
pointer1.change(arrayBuffer3);

// Удаляем последний добавленный блок из стека (LIFO)
mem.pop(); // удаляет arrayBuffer2

// Удаляем следующий блок (теперь верхним стал arrayBuffer3)
mem.pop(); // удаляет arrayBuffer3

// ============================================
//  Работа с кучей (динамическое управление)
// ============================================

// Запрашиваем 128 байт в куче
// Возвращает указатель на первый байт выделенной области
const pointer2 = mem.alloc(128);

// Записываем данные в выделенную область
pointer2.change(arrayBuffer4);

// Выделяем ещё несколько блоков разного размера
const pointer3 = mem.alloc(8);
const pointer4 = mem.alloc(4);
const pointer5 = mem.alloc(5 * 1024); // 5 КБ

// Освобождаем память в куче
pointer2.free();
pointer3.free();
pointer4.free();
pointer5.free();

// Повторный вызов free() для того же указателя должен выбрасывать ошибку
// pointer2.free(); // ❌ Error: double free detected
```

<details>
<summary><strong>Смотреть решение</strong></summary>

```typescript
import { deepEqual, throws } from "node:assert";

interface MemoryOptions {
  stack?: number;
}

type Data =
  | Uint8Array
  | Uint8ClampedArray
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array
  | BigUint64Array
  | BigInt64Array;

interface ViewConstructor<T extends Data> {
  BYTES_PER_ELEMENT: number;
  new (buffer: ArrayBufferLike, bytesOffset: number, length: number): T;
}

interface PointerOptions<T extends Data> {
  length: number;
  alignment: number;
  memory: Uint8Array;
  View: ViewConstructor<T>;
}

class Pointer<T extends Data> {
  readonly index: number;
  readonly length: number;
  readonly alignment: number;

  readonly memory: Uint8Array;
  readonly View: ViewConstructor<T>;

  released = false;

  get byteLength(): number {
    return this.memory.byteLength;
  }

  get byteOffset(): number {
    return this.memory.byteOffset;
  }

  get buffer(): ArrayBufferLike {
    return this.memory.buffer;
  }

  constructor(
    index: number,
    { memory, length, alignment, View }: PointerOptions<T>,
  ) {
    this.index = index;
    this.length = length;
    this.alignment = alignment;
    this.memory = memory;
    this.View = View;
  }

  deref(): T {
    if (this.released) {
      throw new Error(
        `Use-after-free: cannot dereference pointer at offset ${this.index} ` +
          `(${this.length} elements, ${this.View.name}). ` +
          `The memory has been released and may be reused for other allocations.`,
      );
    }

    // Проверка, что указатель не указывает за пределы памяти
    const endIndex = this.index + this.length * this.View.BYTES_PER_ELEMENT;

    if (endIndex > this.byteLength) {
      throw new RangeError(
        `Pointer out of bounds: index ${this.index}, length ${this.length}, ` +
          `total bytes ${endIndex} exceeds memory size ${this.byteLength}`,
      );
    }

    const { View } = this;
    return new View(this.buffer, this.byteOffset + this.index, this.length);
  }

  change(data: T): void {
    if (this.released) {
      throw new Error(
        `Use-after-free: cannot modify pointer at offset ${this.index} ` +
          `(${this.length} elements, ${this.View.name}). ` +
          `The memory has been released and may be reused for other allocations.`,
      );
    }

    const view = this.deref();

    if (data.length > view.length) {
      throw new RangeError(
        `Data too large: cannot fit ${data.length} elements into buffer of ${view.length}. ` +
          `Each element is ${view.BYTES_PER_ELEMENT} bytes`,
      );
    }

    view.set(data as any);

    if (data.length < view.length) {
      const end = this.index + view.length * view.BYTES_PER_ELEMENT;
      this.memory.fill(
        0,
        end - (view.length - data.length) * view.BYTES_PER_ELEMENT,
        end,
      );
    }
  }
}

interface FreeBlock {
  offset: number;
  size: number;
}

class Memory {
  readonly buffer: ArrayBuffer;

  #SP: number;
  readonly #stack: Uint8Array;

  readonly #heap: Uint8Array;
  readonly #freeBlocks: FreeBlock[];

  constructor(size: number, { stack }: MemoryOptions = {}) {
    size >>>= 0;

    if (size === 0) {
      throw new RangeError(`Memory size must be positive, got ${size}`);
    }

    stack ??= Math.floor(size * 0.3);

    if (stack > size * 0.5) {
      throw new RangeError(
        `Stack size (${stack}) exceeds maximum allowed (${size * 0.5}). ` +
          `Stack cannot use more than 50% of total memory`,
      );
    }

    this.buffer = new ArrayBuffer(size);

    this.#SP = -1;
    this.#stack = new Uint8Array(this.buffer, 0, stack);

    this.#heap = new Uint8Array(this.buffer, stack);
    this.#freeBlocks = [{ offset: 0, size: this.#heap.length }];
  }

  push<T extends Data>(data: T): Pointer<T> {
    const bytesLength = data.length * data.BYTES_PER_ELEMENT;

    if (bytesLength === 0) {
      throw new Error("Cannot push empty data buffer");
    }

    this.#SP++;

    const alignment =
      this.#findNextDivisible(this.#SP, data.BYTES_PER_ELEMENT) - this.#SP;
    const requiredSpace = alignment + bytesLength;

    if (this.#SP + requiredSpace >= this.#stack.length) {
      const available = this.#stack.length - this.#SP;
      this.#SP--;

      throw new RangeError(
        `Stack overflow: need ${requiredSpace} bytes, only ${available} available. ` +
          `Stack capacity: ${this.#stack.length} bytes`,
      );
    }

    this.#SP += alignment;

    const bytes = new Uint8Array(data.buffer, data.byteOffset, bytesLength);

    this.#stack.set(bytes, this.#SP);

    const pt = new Pointer<T>(this.#SP, {
      memory: this.#stack,
      length: data.length,
      alignment,
      View: data.constructor as ViewConstructor<T>,
    });

    this.#SP += bytes.length - 1;
    return pt;
  }

  pop(pt: Pointer<any>) {
    if (pt.released) {
      throw new Error(
        `Double pop detected: pointer at offset ${pt.index} has already been popped from stack. ` +
          `Stack pointers cannot be accessed after pop.`,
      );
    }

    if (pt.memory !== this.#stack) {
      throw new Error(
        "Cannot pop pointer that was not allocated on stack. " +
          "Use free() for heap pointers",
      );
    }

    const bytesSize = pt.length * pt.View.BYTES_PER_ELEMENT;
    const totalSize = bytesSize + pt.alignment;

    if (this.#SP - totalSize < -1) {
      throw new Error(
        `Stack corruption detected: pointer points beyond stack boundary. ` +
          `Current SP: ${this.#SP}, pointer claims ${totalSize} bytes`,
      );
    }

    pt.released = true;

    this.#SP -= totalSize;

    if (this.#SP < -1) {
      this.#SP = -1;
    }
  }

  alloc<T extends Data>(
    length: number,
    DataType: ViewConstructor<T>,
  ): Pointer<T> {
    if (length <= 0 || !Number.isInteger(length)) {
      throw new RangeError(
        `Invalid allocation length: ${length}. Length must be a positive integer`,
      );
    }

    const size = length * DataType.BYTES_PER_ELEMENT;

    for (const [i, block] of this.#freeBlocks.entries()) {
      const alignment =
        this.#findNextDivisible(block.offset, DataType.BYTES_PER_ELEMENT) -
        block.offset;
      const alignedSize = size + alignment;

      if (block.size >= alignedSize) {
        const pt = new Pointer(block.offset + alignment, {
          memory: this.#heap,
          length,
          alignment,
          View: DataType,
        });

        block.offset += alignedSize;
        block.size -= alignedSize;

        if (block.size === 0) {
          this.#freeBlocks.splice(i, 1);
        }

        return pt;
      }
    }

    const maxBlock = Math.max(...this.#freeBlocks.map((b) => b.size));

    throw new Error(
      `Out of memory: unable to allocate ${size} bytes ` +
        `(requested ${length} elements of ${DataType.BYTES_PER_ELEMENT} bytes each). ` +
        `Largest free block: ${maxBlock} bytes. ` +
        `Total heap size: ${this.#heap.length} bytes`,
    );
  }

  free(pt: Pointer<any>) {
    if (pt.released) {
      throw new Error(
        `Double free detected: pointer at offset ${pt.index} (${pt.length} elements, ` +
          `${pt.View.name}) has already been freed. ` +
          `Memory corruption possible if still in use.`,
      );
    }

    if (pt.memory !== this.#heap) {
      throw new Error(
        "Cannot free pointer that was not allocated on heap. " +
          "Use pop() for stack pointers",
      );
    }

    const totalSize = pt.length * pt.View.BYTES_PER_ELEMENT + pt.alignment;

    if (
      pt.index - pt.alignment < 0 ||
      pt.index - pt.alignment + totalSize > this.#heap.length
    ) {
      throw new RangeError(
        `Invalid pointer: points outside heap bounds. ` +
          `Offset: ${pt.index - pt.alignment}, size: ${totalSize}, ` +
          `heap range: 0-${this.#heap.length}`,
      );
    }

    pt.released = true;

    this.#freeBlocks.push({
      offset: pt.index - pt.alignment,
      size: totalSize,
    });

    this.#freeBlocks.sort((a, b) => a.offset - b.offset);
    this.#mergeFreeBlocks();
  }

  #mergeFreeBlocks() {
    for (let i = 0; i < this.#freeBlocks.length - 1; i++) {
      const current = this.#freeBlocks[i];
      const next = this.#freeBlocks[i + 1];

      if (current.offset + current.size === next.offset) {
        current.size += next.size;
        this.#freeBlocks.splice(i + 1, 1);
        i--;
      }
    }
  }

  #findNextDivisible(n: number, k: number): number {
    let remainder = n % k;

    if (remainder === 0) {
      return n;
    }

    return n + (k - remainder);
  }
}

const memory = new Memory(1024, { stack: 256 });

const pointer1 = memory.push(new Int16Array([-2, 145, 42, 0, -15]));
const pointer2 = memory.push(new Int32Array([-456, 1234]));
const pointer3 = memory.push(new BigInt64Array([10n, -100n]));

// console.log(pointer1.deref());

deepEqual(pointer1.deref(), new Int16Array([-2, 145, 42, 0, -15]));
deepEqual(pointer2.deref(), new Int32Array([-456, 1234]));
deepEqual(pointer3.deref(), new BigInt64Array([10n, -100n]));

pointer2.change(new Int32Array([-7]));
deepEqual(pointer2.deref(), new Int32Array([-7, 0]));

memory.pop(pointer3);
memory.pop(pointer2);

const pointer4 = memory.push(new Float64Array([100.23, -4532, 1234]));

deepEqual(pointer1.deref(), new Int16Array([-2, 145, 42, 0, -15]));
deepEqual(pointer4.deref(), new Float64Array([100.23, -4532, 1234]));

throws(() => pointer3.deref());

const block1 = memory.alloc(2, Int16Array);
block1.change(new Int16Array([-18, 463]));
deepEqual(block1.deref(), new Int16Array([-18, 463]));

const block2 = memory.alloc(4, Float64Array);
block2.change(new Float64Array([-18, 463, 2.23]));
deepEqual(block2.deref(), new Float64Array([-18, 463, 2.23, 0]));

memory.free(block1);
memory.free(block2);

const block3 = memory.alloc(2, BigInt64Array);
block3.change(new BigInt64Array([1n, -3n]));
deepEqual(block3.deref(), new BigInt64Array([1n, -3n]));

throws(() => block1.deref());
```

</details>
