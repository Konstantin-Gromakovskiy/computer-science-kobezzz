class Range implements Iterable<string | number> {
  private readonly from;
  private readonly to;

  constructor(from: number, to: number);
  constructor(from: string, to: string);
  constructor(from: number | string, to: number | string) {
    this.from = from;
    this.to = to;
  }

  [Symbol.iterator]() {
    const from = this.from;
    const to = this.to;
    if (typeof from === "string" && typeof to === "string") {
      const codeFrom = from.codePointAt(0);
      const codeTo = to.codePointAt(0);

      if (codeFrom === undefined || codeTo === undefined) {
        throw new Error("from и to не должны быть пустыми");
      }

      let index = codeFrom;
      const step = codeFrom <= codeTo ? 1 : -1;

      return {
        [Symbol.iterator]() {
          return this;
        },

        next() {
          const isFinished = step > 0 ? index > codeTo : index < codeTo;

          if (isFinished) {
            return {
              value: undefined,
              done: true,
            };
          }

          const value = String.fromCodePoint(index);
          index += step;

          return {
            value,
            done: false,
          };
        },
      };
    }
    if (typeof from === "number" && typeof to === "number") {
      let index = from;
      const step = from <= to ? 1 : -1;

      return {
        [Symbol.iterator]() {
          return this;
        },

        next() {
          const isFinished = step > 0 ? index > to : index < to;

          if (isFinished) {
            return {
              value: undefined,
              done: true,
            };
          }

          const value = index;
          index += step;

          return {
            value,
            done: false,
          };
        },
      };
    }
    throw new Error("from и to должны иметь одинаковый тип");
  }

  reverse() {
    return new Range(this.to, this.from);
  }
}
const symbolRange = new Range("a", "f");

console.log(Array.from(symbolRange.reverse())); // ["a", "b", "c", "d", "e", "f"]

const numberRange = new Range(-5, 1);

console.log(Array.from(numberRange.reverse())); // [1, 0, -1, -2, -3, -4, -5]
