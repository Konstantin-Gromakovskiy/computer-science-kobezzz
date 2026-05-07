type RGBA = [red: number, green: number, blue: number, alpha: number];

enum TraverseMode {
  RowMajor,
  ColMajor,
}

interface PixelStream {
  getPixel(x: number, y: number): RGBA;
  setPixel(x: number, y: number, rgba: RGBA): RGBA;
  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void,
  ): void;
}

class ArrayOfArrayPixelStream implements PixelStream {
  #data: RGBA[];
  #width: number;
  #height: number;

  constructor(width: number, height: number) {
    const size = width * height;
    this.#data = new Array(Math.abs(size)).fill([0, 0, 0, 0]);
    this.#width = width;
    this.#height = height;
  }

  getPixel(x: number, y: number): RGBA {
    if (this.#width < x || this.#height < y) throw new Error("Pixel not found");
    return this.#data[this.#width * y + x];
  }
  setPixel(x: number, y: number, rgba: RGBA): RGBA {
    this.#data[this.#width * y + x] = rgba;
    return this.#data[this.#width * y + x];
  }
  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void,
  ): void {
    if (mode === TraverseMode.RowMajor) {
      for (let h = 0; h < this.#height; h++) {
        for (let w = 0; w < this.#width; w++) {
          callback(this.#data[this.#width * h + w], w, h);
        }
      }
    } else {
      for (let w = 0; w < this.#width; w++) {
        for (let h = 0; h < this.#height; h++) {
          callback(this.#data[this.#width * h + w], w, h);
        }
      }
    }
  }
}

const banchMark = (arr: PixelStream, name: string, warmingUp = false) => {
  const timeBeforeRowMajor = performance.now();
  arr.forEach(TraverseMode.RowMajor, (rgba, x, y) => {
    arr.setPixel(x, y, [233, 123, 123, 1]);
  });
  const timeAfterRowMajor = performance.now();

  const timeBeforeColMajor = performance.now();
  arr.forEach(TraverseMode.ColMajor, (rgba, x, y) => {
    arr.setPixel(x, y, [233, 123, 123, 1]);
  });
  const timeAfterColMajor = performance.now();

  if (!warmingUp)
    console.log(
      `Время на обход по строкам у ${name}: ${timeAfterRowMajor - timeBeforeRowMajor}`,
    );

  if (!warmingUp)
    console.log(
      `Время на обход по столбцам у ${name}: ${timeAfterColMajor - timeBeforeColMajor}`,
    );

  const diff =
    (timeAfterColMajor - timeBeforeColMajor) /
    (timeAfterRowMajor - timeBeforeRowMajor);

  if (!warmingUp) console.log("разница в ", diff.toFixed(2));
};

const ArrayOfPixelArray100 = new ArrayOfArrayPixelStream(10, 10);
const ArrayOfPixelArray10000 = new ArrayOfArrayPixelStream(100, 100);
const ArrayOfPixelArray1000000 = new ArrayOfArrayPixelStream(1000, 1000);
const ArrayOfPixelArray100000000 = new ArrayOfArrayPixelStream(10000, 10000);

banchMark(ArrayOfPixelArray1000000, "ArrayOfPixelArray1000000", true);
banchMark(ArrayOfPixelArray100, "ArrayOfPixelArray100");
banchMark(ArrayOfPixelArray10000, "ArrayOfPixelArray100");
banchMark(ArrayOfPixelArray1000000, "ArrayOfPixelArray1000000");
banchMark(ArrayOfPixelArray100000000, "ArrayOfPixelArray100000000");

console.log("=========================================");

class FlatArrayPixelStream implements PixelStream {
  #data: number[];
  #width: number;
  #height: number;

  constructor(width: number, height: number) {
    const size = width * height * 4;
    this.#data = new Array(Math.abs(size)).fill(0);
    this.#width = width;
    this.#height = height;
  }

  getPixel(x: number, y: number): RGBA {
    if (this.#width < x || this.#height < y) throw new Error("Pixel not found");
    const index = (this.#width * y + x) * 4;
    return [
      this.#data[index],
      this.#data[index + 1],
      this.#data[index + 2],
      this.#data[index + 3],
    ];
  }
  setPixel(x: number, y: number, rgba: RGBA): RGBA {
    const index = (this.#width * y + x) * 4;
    this.#data[index] = rgba[0];
    this.#data[index + 1] = rgba[1];
    this.#data[index + 2] = rgba[2];
    this.#data[index + 3] = rgba[3];
    return rgba;
  }
  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void,
  ): void {
    if (mode === TraverseMode.RowMajor) {
      let index = 0;
      for (let y = 0; y < this.#height; y++) {
        for (let x = 0; x < this.#width; x++) {
          callback(
            [
              this.#data[index],
              this.#data[index + 1],
              this.#data[index + 2],
              this.#data[index + 3],
            ],
            x,
            y,
          );
          index += 4;
        }
      }
    } else {
      for (let x = 0; x < this.#width; x++) {
        for (let y = 0; y < this.#height; y++) {
          const index = (y * this.#width + x) * 4;
          callback(
            [
              this.#data[index],
              this.#data[index + 1],
              this.#data[index + 2],
              this.#data[index + 3],
            ],
            x,
            y,
          );
        }
      }
    }
  }
}

const FlatPixelArray100 = new FlatArrayPixelStream(10, 10);
const FlatPixelArray10000 = new FlatArrayPixelStream(100, 100);
const FlatPixelArray1000000 = new FlatArrayPixelStream(1000, 1000);
const FlatPixelArray100000000 = new FlatArrayPixelStream(10000, 10000);

banchMark(FlatPixelArray1000000, "FlatPixelArray1000000", true);
banchMark(FlatPixelArray100, "FlatPixelArray100");
banchMark(FlatPixelArray10000, "FlatPixelArray10000");
banchMark(FlatPixelArray1000000, "FlatPixelArray1000000");
banchMark(FlatPixelArray100000000, "FlatPixelArray100000000");

class Uint8ArrayPixelStream implements PixelStream {
  #data: Uint8Array;
  #width: number;
  #height: number;

  constructor(width: number, height: number) {
    const size = width * height * 4;
    this.#data = new Uint8Array(size);
    this.#width = width;
    this.#height = height;
  }

  getPixel(x: number, y: number): RGBA {
    if (this.#width < x || this.#height < y) throw new Error("Pixel not found");
    const index = (this.#width * y + x) * 4;
    return [
      this.#data[index],
      this.#data[index + 1],
      this.#data[index + 2],
      this.#data[index + 3],
    ];
  }
  setPixel(x: number, y: number, rgba: RGBA): RGBA {
    const index = (this.#width * y + x) * 4;
    this.#data[index] = rgba[0];
    this.#data[index + 1] = rgba[1];
    this.#data[index + 2] = rgba[2];
    this.#data[index + 3] = rgba[3];
    return rgba;
  }
  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void,
  ): void {
    if (mode === TraverseMode.RowMajor) {
      let index = 0;
      for (let y = 0; y < this.#height; y++) {
        for (let x = 0; x < this.#width; x++) {
          callback(
            [
              this.#data[index],
              this.#data[index + 1],
              this.#data[index + 2],
              this.#data[index + 3],
            ],
            x,
            y,
          );
          index += 4;
        }
      }
    } else {
      for (let x = 0; x < this.#width; x++) {
        for (let y = 0; y < this.#height; y++) {
          const index = (y * this.#width + x) * 4;
          callback(
            [
              this.#data[index],
              this.#data[index + 1],
              this.#data[index + 2],
              this.#data[index + 3],
            ],
            x,
            y,
          );
        }
      }
    }
  }
}

const Uint8PixelArray100 = new Uint8ArrayPixelStream(10, 10);
const Uint8PixelArray10000 = new Uint8ArrayPixelStream(100, 100);
const Uint8PixelArray1000000 = new Uint8ArrayPixelStream(1000, 1000);
const Uint8PixelArray100000000 = new Uint8ArrayPixelStream(10000, 10000);

banchMark(Uint8PixelArray1000000, "Uint8PixelArray1000000", true);
banchMark(Uint8PixelArray100, "Uint8PixelArray100");
banchMark(Uint8PixelArray10000, "Uint8PixelArray10000");
banchMark(Uint8PixelArray1000000, "Uint8PixelArray1000000");
banchMark(Uint8PixelArray100000000, "Uint8PixelArray100000000");

export {};
