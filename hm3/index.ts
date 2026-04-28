class BCD {
  #BCDNumArr;
  #numLenth = 0;

  constructor(num: number) {
    this.#numLenth = num.toString().length;
    this.#BCDNumArr = new Uint8Array(Math.ceil(this.#numLenth / 2));
    const arr = this.#BCDNumArr;

    for (let i = 0; i < this.#numLenth; i++) {
      putBits(num % 10, Math.floor(i / 2), i % 2 === 0 ? "first" : "second");
      num = Math.floor(num / 10);
    }

    function putBits(
      num: number,
      indexArr: number,
      halfOfByte: "first" | "second",
    ) {
      if (halfOfByte === "first") arr[indexArr] |= num << 4;
      else arr[indexArr] |= num;
    }
  }

  getBCDnum() {
    return this.#BCDNumArr;
  }

  toNumber(): number {
    let num = 0;
    for (let i = 0; i < this.#numLenth; i++) {
      if (i % 2 === 0)
        num += (this.#BCDNumArr[Math.floor(i / 2)] >> 4) * 10 ** i;
      else num += (this.#BCDNumArr[Math.floor(i / 2)] & 0b1111) * 10 ** i;
    }
    return num;
  }
  toString(): string {
    let str = "";
    for (let i = 0; i < this.#numLenth; i++) {
      if (i % 2 === 0)
        str = (this.#BCDNumArr[Math.floor(i / 2)] >> 4).toString() + str;
      else {
        str = (this.#BCDNumArr[Math.floor(i / 2)] & 0b1111).toString() + str;
      }
    }

    return str;
  }
  at(index: number) {
    let localIndex: number;

    if (index >= 0) {
      localIndex = this.#numLenth - index - 1;
    } else {
      localIndex = -index - 1;
    }
    const byteIndex = Math.floor(localIndex / 2);
    const byte = this.#BCDNumArr.at(byteIndex);
    if (byte === undefined) return undefined;
    if (localIndex % 2 === 0) return byte >> 4;
    else return byte & 0b1111;
  }
  toBigint(): bigint {
    let num = 0n;

    for (let i = 0; i < this.#numLenth; i++) {
      const digit = this.at(i);
      if (digit === undefined) break;
      num += BigInt(digit) * 10n ** BigInt(i);
    }

    return num;
  }
}

const bcd = new BCD(435);

console.log(
  Array.from(bcd.getBCDnum(), (byte) => byte.toString(2).padStart(8, "0")),
);
console.log(bcd.toString());
console.log(bcd.toNumber());
console.log(bcd.at(0));
console.log(bcd.at(1));
console.log(bcd.at(2));
console.log(bcd.at(-1));
