type RGBAValue = [number, number, number, number];

type ViewConstructor<TValue, TView> = {
  BYTES_PER_ELEMENT: number;

  get(buffer: Uint8Array, offset: number): TValue;
  set(buffer: Uint8Array, offset: number, value: TValue): void;
  new (buffer: Uint8Array, offset: number): TView;
};

class RGBA {
  buffer: Uint8Array;
  offset: number;

  static BYTES_PER_ELEMENT = 4;
  static get(buffer: Uint8Array, offset: number): RGBAValue {
    return [
      buffer[offset],
      buffer[offset + 1],
      buffer[offset + 2],
      buffer[offset + 3],
    ];
  }
  static set(buffer: Uint8Array, offset: number, value: RGBAValue): void {
    value.forEach((v) => {
      if (v < 0 || v > 255)
        throw new RangeError("RGBA values must be in the range 0-255");
    });
    buffer[offset] = value[0];
    buffer[offset + 1] = value[1];
    buffer[offset + 2] = value[2];
    buffer[offset + 3] = value[3];
  }

  constructor(buffer: Uint8Array, offset: number) {
    if (buffer.byteLength < offset + RGBA.BYTES_PER_ELEMENT)
      throw new Error("Buffer too small for RGBA at given offset");
    this.buffer = buffer;
    this.offset = offset;
  }

  get red(): number {
    return this.buffer[this.offset];
  }
  set red(value: number) {
    if (value < 0 || value > 255)
      throw new RangeError("Red value must be in the range 0-255");
    this.buffer[this.offset] = value;
  }

  get green(): number {
    return this.buffer[this.offset + 1];
  }
  set green(value: number) {
    if (value < 0 || value > 255)
      throw new RangeError("Green value must be in the range 0-255");
    this.buffer[this.offset + 1] = value;
  }

  get blue(): number {
    return this.buffer[this.offset + 2];
  }
  set blue(value: number) {
    if (value < 0 || value > 255)
      throw new RangeError("Blue value must be in the range 0-255");
    this.buffer[this.offset + 2] = value;
  }

  get alpha(): number {
    return this.buffer[this.offset + 3];
  }
  set alpha(value: number) {
    if (value < 0 || value > 255)
      throw new RangeError("Alpha value must be in the range 0-255");
    this.buffer[this.offset + 3] = value;
  }
}

class Matrix2D<TValue, TView> {
  buffer: Uint8Array;
  private width: number;
  private height: number;
  private viewConstructor: ViewConstructor<TValue, TView>;
  constructor(
    width: number,
    height: number,
    view: ViewConstructor<TValue, TView>,
    data?: Uint8ClampedArray,
  ) {
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 0 ||
      height < 0
    )
      throw new Error("incorrect size of matrix");

    const requiredBytes = width * height * view.BYTES_PER_ELEMENT;
    let bufferArr: Uint8Array;

    if (!data) {
      bufferArr = new Uint8Array(requiredBytes);
    } else if (data.byteLength < requiredBytes) {
      throw new Error("data byteLength less then matrix size");
    } else {
      bufferArr = new Uint8Array(data.buffer, data.byteOffset, requiredBytes);
    }
    this.buffer = bufferArr;
    this.width = width;
    this.height = height;
    this.viewConstructor = view;
  }

  get(x: number, y: number): TValue {
    const offset =
      (y * this.width + x) * this.viewConstructor.BYTES_PER_ELEMENT;
    return this.viewConstructor.get(this.buffer, offset);
  }
  set(x: number, y: number, value: TValue): void {
    const offset =
      (y * this.width + x) * this.viewConstructor.BYTES_PER_ELEMENT;
    this.viewConstructor.set(this.buffer, offset, value);
  }
  fill(value: TValue): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.set(x, y, value);
      }
    }
  }

  view(x: number, y: number) {
    const offset =
      (y * this.width + x) * this.viewConstructor.BYTES_PER_ELEMENT;
    return new this.viewConstructor(this.buffer, offset);
  }
}
