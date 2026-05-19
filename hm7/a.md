## Кодирования массива UTF-8 строк переменной длины

Реализуйте класс/функцию для бинарной сериализации массива UTF-8 строк (можно использовать `TextEncoder` / `TextDecoder`).

**Формат:**

- 4 байта: количество строк (uint32)
- Для каждой строки:
  - 4 байта: длина строки в байтах (uint32)
  - N байт: UTF-8 данные строки

**Требования:**

- Поддержать произвольное количество строк.
- Поддержать возможность чтения элемента массива по заданному индексу.
- Обработать пустые строки.

```js
const strings = ["hello", "мир", ""];

const buffer = encodeStrings(strings);

console.log(buffer.at(0)); // "hello"
console.log(buffer.at(-1)); // ""

const decoded = decodeStrings(buffer); // ["hello", "мир", ""]
```

<details>
<summary><strong>Смотреть решение</strong></summary>

```js
class Utf8Array {
  get buffer() {
    return this.#buffer;
  }

  get byteLength() {
    return this.#buffer.byteLength;
  }

  get length() {
    return this.#length;
  }

  #buffer;

  #view;
  #littleEndian = isLittleEndian();

  #bytes;
  #length;

  #decoder;

  constructor(buffer) {
    buffer = "buffer" in buffer ? buffer.buffer : buffer;

    if (buffer.byteLength < 4) {
      throw new Error("Invalid byte length");
    }

    this.#buffer = buffer;

    this.#view = new DataView(buffer);
    this.#bytes = new Uint8Array(buffer, 4);
    this.#length = this.#view.getUint32(0, this.#littleEndian);

    this.#decoder = new TextDecoder();
  }

  at(index) {
    const normalizedIndex = index < 0 ? this.length + index : index;

    if (normalizedIndex < 0 || normalizedIndex >= this.length) {
      return undefined;
    }

    let offset = 4;

    for (let i = 0; i < this.length; i++) {
      const strByteLength = this.#view.getUint32(offset, this.#littleEndian);
      offset += 4;

      if (i === normalizedIndex) {
        const from = offset - this.#bytes.byteOffset;
        return strByteLength === 0
          ? ""
          : this.#decoder.decode(
              this.#bytes.subarray(from, from + strByteLength),
            );
      } else {
        offset += strByteLength;
      }
    }
  }
}

function encodeStrings(strings) {
  const stringByteLengths = strings.map((str) => utf8ByteLength(str));

  const bufferLength = stringByteLengths.reduce(
    (bufferLength, strByteLength) => bufferLength + strByteLength,

    // Для каждой строки длина строки в байтах (uint32) и дополнительно общее количество строк (uint32)
    strings.length * 4 + 4,
  );

  const buffer = new ArrayBuffer(bufferLength);
  const view = new DataView(buffer);

  const littleEndian = isLittleEndian();
  view.setUint32(0, strings.length, littleEndian);

  const encoder = new TextEncoder();

  let offset = 4;

  strings.forEach((str, i) => {
    const strByteLength = stringByteLengths[i];

    view.setUint32(offset, strByteLength, littleEndian);
    offset += 4;

    if (strByteLength > 0) {
      encoder.encodeInto(str, new Uint8Array(buffer, offset, strByteLength));
      offset += strByteLength;
    }
  });

  return new Utf8Array(buffer);

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
}

function decodeStrings(buffer) {
  const utf8Array = new Utf8Array(buffer);

  const array = new Array(utf8Array.length);

  for (let i = 0; i < utf8Array.length; i++) {
    array[i] = utf8Array.at(i);
  }

  return array;
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

console.log(decodeStrings(buffer)); // ["hello", "мир", ""]
```

</details>
