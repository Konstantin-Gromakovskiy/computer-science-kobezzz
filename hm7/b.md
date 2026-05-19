## Кодирования массива UTF-8 строк переменной длины с помощью ссылок

Реализуйте класс/функцию для бинарной сериализации массива UTF-8 строк, где в отличие от предыдущего задания, строки в буфере представлены как:

- 4 байта: длина строки в байтах (uint32)
- 4 байта: указатель (индекс) на эту строку (сама строка лежит в этом же буфере, но в другом месте)

Сравните эффективность операции `at` в обеих реализациях.

**Задание со звездочкой:**

Реализуйте метод set, который позволит обновить строку внутри массива.

```js
const strings = ["hello", "мир", ""];

const buffer = encodeStrings(strings);

console.log(buffer.at(0)); // "hello"

buffer.set(0, "Привет, ");

console.log(buffer.at(0)); // "Привет, "

buffer.set(-1, "!");

const decoded = decodeStrings(buffer); // ["Привет, ", "мир", "!"]
```

<details>
<summary><strong>Смотреть решение</strong></summary>

### Сравнение эффективности метода `at()` в двух реализациях Utf8Array

| Характеристика        | Без указателей (O(n)) | С указателями (O(1)) |
| --------------------- | --------------------- | -------------------- |
| Доступ к первому      | ⚡ 1 операция         | ⚡ 2-3 операции      |
| Доступ к последнему   | 🐌 n операций         | ⚡ 2-3 операции      |
| Случайный доступ      | 🐌 ~n/2 операций      | ⚡ 2-3 операции      |
| Доп. память на строку | 0 байт                | 4 байта              |
| Предсказуемость       | Низкая                | Высокая              |

```js
class Utf8Array {
  // В массиве хранится кортеж из двух чисел:
  // - 4 байта: длина строки в UTF-8
  // - 4 байта: смещение (указатель) на начало строки в буфере
  static BYTES_PER_ELEMENTS = 8;

  get buffer() {
    return this.#buffer;
  }

  get byteLength() {
    return this.#buffer.byteLength;
  }

  get length() {
    return this.#length;
  }

  get BYTES_PER_ELEMENTS() {
    return this.constructor.BYTES_PER_ELEMENTS;
  }

  #buffer;

  #view;
  #littleEndian = isLittleEndian();

  #bytes;
  #length;

  #encoder;
  #decoder;

  constructor(buffer) {
    buffer = "buffer" in buffer ? buffer.buffer : buffer;

    if (buffer.byteLength < 4) {
      throw new Error("Invalid byte length");
    }

    this.#buffer = buffer;

    this.#view = new DataView(buffer);
    this.#bytes = new Uint8Array(buffer);
    this.#length = this.#view.getUint32(0, this.#littleEndian);

    this.#encoder = new TextEncoder();
    this.#decoder = new TextDecoder();
  }

  at(index) {
    const { byteLength, ptr } = this.#at(index);
    return byteLength === 0
      ? ""
      : this.#decoder.decode(this.#bytes.subarray(ptr, ptr + byteLength));
  }

  set(index, newValue) {
    const newValueByteLength = utf8ByteLength(newValue);

    const currentValue = this.#at(index);

    if (newValueByteLength <= currentValue.byteLength) {
      currentValue.byteLength = newValueByteLength;
      this.#encoder.encodeInto(
        newValue,
        this.#bytes.subarray(
          currentValue.ptr,
          currentValue.ptr + newValueByteLength,
        ),
      );
    } else {
      const newBufferLength =
        this.byteLength + newValueByteLength - currentValue.byteLength;

      const newBuffer = new ArrayBuffer(newBufferLength);
      const newView = new DataView(newBuffer);
      const newBytes = new Uint8Array(newBuffer);

      // Копируем только массив
      newBytes.set(
        this.#bytes.subarray(0, this.length * this.BYTES_PER_ELEMENTS + 4),
      );

      let diffOffset = 0;

      for (let i = 0; i < this.length; i++) {
        const str = this.#at(i);

        if (i === currentValue.index) {
          diffOffset = newValueByteLength - str.byteLength;
          this.#encoder.encodeInto(
            newValue,
            newBytes.subarray(str.ptr, str.ptr + newValueByteLength),
          );

          str.changeView(newView);
          str.byteLength = newValueByteLength;
        } else {
          const newPtr = str.ptr + diffOffset;
          newBytes.set(
            this.#bytes.subarray(str.ptr, str.ptr + str.byteLength),
            newPtr,
          );

          str.changeView(newView);
          str.ptr = newPtr;
        }
      }

      this.#buffer = newBuffer;
      this.#view = new DataView(newBuffer);
      this.#bytes = newBytes;
    }
  }

  #at(index) {
    const normalizedIndex = index < 0 ? this.length + index : index;

    if (normalizedIndex < 0 || normalizedIndex >= this.length) {
      return undefined;
    }

    let offset = 4 + normalizedIndex * this.BYTES_PER_ELEMENTS;

    let view = this.#view;
    const littleEndian = this.#littleEndian;

    return {
      get index() {
        return normalizedIndex;
      },

      get byteOffset() {
        return offset;
      },

      get byteLength() {
        return view.getUint32(offset, littleEndian);
      },

      set byteLength(newLength) {
        view.setUint32(offset, newLength, littleEndian);
      },

      get ptr() {
        return view.getUint32(offset + 4, littleEndian);
      },

      set ptr(newPtr) {
        view.setUint32(offset + 4, newPtr, littleEndian);
      },

      changeView(newView) {
        view = newView;
      },
    };
  }
}

function encodeStrings(strings) {
  const stringByteLengths = strings.map((str) => utf8ByteLength(str));

  // В заголовке храним длину массива
  let offset = 4;

  // Для каждой строки длина строки в байтах (uint32) и указатель на саму строку (uint32)
  let stringOffset = strings.length * 8 + offset;

  const bufferLength = stringByteLengths.reduce(
    (bufferLength, strByteLength) => bufferLength + strByteLength,
    stringOffset,
  );

  const buffer = new ArrayBuffer(bufferLength);

  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  const littleEndian = isLittleEndian();
  view.setUint32(0, strings.length, littleEndian);

  const encoder = new TextEncoder();

  strings.forEach((str, i) => {
    const strByteLength = stringByteLengths[i];

    view.setUint32(offset, strByteLength, littleEndian);
    offset += 4;

    view.setUint32(offset, stringOffset, littleEndian);
    offset += 4;

    if (strByteLength > 0) {
      encoder.encodeInto(
        str,
        bytes.subarray(stringOffset, stringOffset + strByteLength),
      );
      stringOffset += strByteLength;
    }
  });

  return new Utf8Array(buffer);
}

function decodeStrings(buffer) {
  const utf8Array = new Utf8Array(buffer);

  const array = new Array(utf8Array.length);

  for (let i = 0; i < utf8Array.length; i++) {
    array[i] = utf8Array.at(i);
  }

  return array;
}

function utf8ByteLength(str) {
  let bytes = 0;

  for (const char of str) {
    const code = char.codePointAt(0);

    // ASCII диапазон
    if (code <= 0x7f) {
      bytes += 1;

      // Кириллица и другие
    } else if (code <= 0x7ff) {
      bytes += 2;

      // Иероглифы
    } else if (code <= 0xffff) {
      bytes += 3;

      // Эмодзи
    } else {
      bytes += 4;
    }
  }

  return bytes;
}

function isLittleEndian() {
  const header = new Uint32Array(1);
  const view = new DataView(header.buffer);

  // Каждый байт числа разный, что хорошо для проверки нативного endian
  header[0] = 0x01234567;

  return header[0] === view.getUint32(0, true);
}

const strings = ["hello", "мир", ""];

const buffer = encodeStrings(strings);

console.assert(buffer.at(0) === "hello", "ACII ок");
console.assert(buffer.at(1) === "мир", "Кириллица ок");
console.assert(buffer.at(-1) === "", "Пустая строка ок");

buffer.set(-1, "!");

console.log(decodeStrings(buffer)); // ["Привет, ", "мир", "!"]
```

</details>
