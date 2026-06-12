type MatrixValue = number;

type TypedArray<TValue extends MatrixValue> = {
  readonly buffer: ArrayBufferLike;
  readonly byteOffset: number;
  readonly length: number;
  [index: number]: TValue;
  fill(value: TValue): unknown;
};

type TypedArrayConstructor<
  TValue extends MatrixValue,
  TArray extends TypedArray<TValue>,
> = {
  readonly BYTES_PER_ELEMENT: number;
  new (length: number): TArray;
  new (
    buffer: ArrayBufferLike,
    byteOffset?: number,
    length?: number,
  ): TArray;
};

export class Matrix<
  TValue extends MatrixValue,
  TArray extends TypedArray<TValue>,
> {
  readonly buffer: TArray;
  readonly width: number;
  readonly height: number;

  private readonly ArrayType: TypedArrayConstructor<TValue, TArray>;

  constructor(
    ArrayType: TypedArrayConstructor<TValue, TArray>,
    width: number,
    height: number,
    data?: TArray,
  ) {
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 0 ||
      height < 0
    ) {
      throw new Error("incorrect size of matrix");
    }

    const length = width * height;

    if (data && data.length < length) {
      throw new Error("data length less than matrix size");
    }

    this.buffer =
      data === undefined
        ? new ArrayType(length)
        : new ArrayType(data.buffer, data.byteOffset, length);
    this.width = width;
    this.height = height;
    this.ArrayType = ArrayType;
  }

  get(x: number, y: number): TValue {
    const value = this.buffer[this.getIndex(x, y)];
    if (value === undefined) {
      throw new Error("matrix index out of bounds");
    }
    
    return value;
  }

  set(x: number, y: number, value: TValue): void {
    this.buffer[this.getIndex(x, y)] = value;
  }

  fill(value: TValue): void {
    this.buffer.fill(value);
  }

  toString(): string {
    if (this.width === 0) {
      return "";
    }

    const rows: string[] = [];

    for (let y = 0; y < this.height; y++) {
      const row: string[] = [];

      for (let x = 0; x < this.width; x++) {
        row.push(String(this.buffer[y * this.width + x]));
      }

      rows.push(row.join(" "));
    }

    return rows.join("\n");
  }

  view(x: number, y: number): TArray {
    const byteOffset =
      this.buffer.byteOffset +
      this.getIndex(x, y) * this.ArrayType.BYTES_PER_ELEMENT;

    return new this.ArrayType(this.buffer.buffer, byteOffset, 1);
  }

  private getIndex(x: number, y: number): number {
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x < 0 ||
      y < 0 ||
      x >= this.width ||
      y >= this.height
    ) {
      throw new RangeError("matrix index out of bounds");
    }

    return y * this.width + x;
  }
}
