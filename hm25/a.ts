const getnumbers = (str: string) => {
  const regExp = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;
  return {
    iterator: str.matchAll(regExp),
    next(newStr?: string) {
      if (newStr !== undefined) this.iterator = newStr.matchAll(regExp);

      const result = this.iterator.next();

      if (result.done) throw "Expecting new input";
      return {
        value: Number(result.value[0]),
        done: false,
      };
    },
    [Symbol.iterator]() {
      return this;
    },
  };
};

const numbers = getnumbers("124045 klkdf 345 asd 21.435");
const iter = numbers[Symbol.iterator]();

try {
  for (const number of numbers) {
    console.log(number);
  }
} catch (err) {
  // Expecting new input
  console.log(err);
  console.log(numbers.next("1000500 awesome 42")); // { value: 1000500, done: false }
}
