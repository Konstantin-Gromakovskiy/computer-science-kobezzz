class StringBuffer {
  #buffer: Uint8Array;
  #offsets: Uint32Array;
  get buffer(): Uint8Array {
    return this.#buffer;
  }

  constructor() {
    this.#buffer = new Uint8Array();
    this.#offsets = new Uint32Array();
  }

  encodeStrings(strings: string[] = []): ArrayBufferLike {
    const encoder = new TextEncoder();
    const encodedStr: Uint8Array[] = [];
    this.#offsets = new Uint32Array(strings.length);
    let totalBytLen = 4;

    for (const str of strings) {
      const bufStr = encoder.encode(str);
      totalBytLen += 4 + bufStr.byteLength;
      encodedStr.push(bufStr);
    }

    this.#buffer = new Uint8Array(totalBytLen);
    const dataView = new DataView(this.#buffer.buffer);
    dataView.setUint32(0, encodedStr.length);
    let offset = 4;

    for (let i = 0; i < encodedStr.length; i++) {
      this.#offsets[i] = offset;
      dataView.setUint32(offset, encodedStr[i].byteLength);
      offset += 4;
      this.#buffer.set(encodedStr[i], offset);
      offset += encodedStr[i].byteLength;
    }
    return this.#buffer.buffer;
  }

  at(num: number) {
    const offset = this.#offsets.at(num);
    if (offset === undefined) return;
    const strLen = new DataView(this.#buffer.buffer, offset, 4).getUint32(0);
    if (strLen === 0) return "";

    const decoder = new TextDecoder();
    const str = decoder.decode(
      this.#buffer.subarray(offset + 4, offset + 4 + strLen),
    );
    return str;
  }

  decodeStrings(buffer: ArrayBufferLike): string[] {
    const bufferArr = new Uint8Array(buffer);
    const dataView = new DataView(buffer);

    const arrayLen = dataView.getUint32(0);
    const arrStr: string[] = new Array(arrayLen);
    const decoder = new TextDecoder();

    let offset = 4;

    for (let i = 0; i < arrayLen; i++) {
      const strLen = dataView.getUint32(offset);
      offset += 4;
      const str = decoder.decode(bufferArr.subarray(offset, offset + strLen));
      offset += strLen;
      arrStr[i] = str;
    }

    return arrStr;
  }
}

const strings = ["hello", "мир", ""];

const strBuffer = new StringBuffer();
const buffer = strBuffer.encodeStrings(strings);

const arrStr = strBuffer.decodeStrings(buffer);

console.log("результат", arrStr);
