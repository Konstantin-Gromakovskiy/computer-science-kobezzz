class StringBuffer2 {
  #buffer: Uint8Array;
  #decoder: TextDecoder;
  #encoder: TextEncoder;
  #dataOffsets: Uint32Array;

  constructor() {
    this.#buffer = new Uint8Array();
    this.#decoder = new TextDecoder();
    this.#encoder = new TextEncoder();
    this.#dataOffsets = new Uint32Array();
  }

  encodingString(strings: string[]) {
    const itmesLen = strings.length;
    const metaDataByteLen = 4 + itmesLen * 8;
    const strBufferArr: Uint8Array[] = [];
    let strArrayBufferByteLength = metaDataByteLen;

    for (const str of strings) {
      const strBuffer = this.#encoder.encode(str);
      strBufferArr.push(strBuffer);
      strArrayBufferByteLength += strBuffer.byteLength;
    }
    this.#buffer = new Uint8Array(strArrayBufferByteLength);
    this.#dataOffsets = new Uint32Array(metaDataByteLen);
    const dataView = new DataView(this.#buffer.buffer);
    dataView.setUint32(0, itmesLen);
    let metaDataOffset = 4;
    let strDataOffset = metaDataByteLen;

    for (let i = 0; i < strBufferArr.length; i++) {
      const strBuffer = strBufferArr[i];
      const strByteLen = strBuffer.byteLength;
      dataView.setUint32(metaDataOffset, strByteLen);
      metaDataOffset += 4;
      dataView.setUint32(metaDataOffset, strDataOffset);
      metaDataOffset += 4;
      this.#dataOffsets[i] = strDataOffset;
      this.#buffer.set(strBuffer, strDataOffset);
      strDataOffset += strByteLen;
    }
    return this.#buffer.buffer;
  }

  at(num: number) {
    const arrayLen = new DataView(this.#buffer.buffer).getUint32(0);
    if (num >= arrayLen) return;
    const recordOffset = 4 + num * 8;
    const strByteLen = new DataView(this.#buffer.buffer).getUint32(
      recordOffset,
    );
    if (strByteLen === 0) return "";
    const strDataOffset = new DataView(this.#buffer.buffer).getUint32(
      recordOffset + 4,
    );
    const strBuffer = this.#buffer.subarray(
      strDataOffset,
      strDataOffset + strByteLen,
    );
    return this.#decoder.decode(strBuffer);
  }

  decodingString(buffer: ArrayBufferLike) {
    const bufferArr = new Uint8Array(buffer);
    const dataView = new DataView(buffer);
    const arrayLen = dataView.getUint32(0);
    const strArr: string[] = new Array(arrayLen);

    for (let i = 0; i < arrayLen; i++) {
      const recordOffset = 4 + i * 8;
      const strByteLen = dataView.getUint32(recordOffset);
      const strDataOffset = dataView.getUint32(recordOffset + 4);
      const strBuffer = bufferArr.subarray(
        strDataOffset,
        strDataOffset + strByteLen,
      );
      strArr[i] = this.#decoder.decode(strBuffer);
    }
    return strArr;
  }
}
