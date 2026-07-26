## Итератор по диапазонам значений

Необходимо написать класс Range, который позволяет создавать диапазоны чисел или символов и обходить элементы Range с любого конца.

```js
const symbolRange = new Range("a", "f");

console.log(Array.from(symbolRange)); // ["a", "b", "c", "d", "e", "f"]

const numberRange = new Range(-5, 1);

console.log(Array.from(numberRange.reverse())); // [1, 0, -1, -2, -3, -4, -5]
```

<details>
<summary><strong>Смотреть решение</strong></summary>

```js
class Range {
  static convert = {
    String: {
      from: (v) => v.codePointAt(0),
      into: (v) => String.fromCodePoint(v),
    },

    Date: {
      from: (v) => v.getTime(),
      into: (v) => new Date(v),
    },

    default: {
      from: (v) => v,
      into: (v) => v,
    },
  };

  #a;
  #start;

  #b;
  #end;

  #step;
  #into;

  constructor(a, b, step = 1) {
    const getType = (value) => /\[object (.*?)]/.exec({}.toString.call(value))[1];

    const typeA = getType(a);
    const typeB = getType(b);

    if (typeA !== typeB) {
      throw new TypeError(`Type mismatch: expected "${typeA}", got "${typeA}" and "${typeB}"`);
    }

    const converter = Range.convert[typeA] ?? Range.convert.default;

    this.#a = a;
    this.#start = converter.from(a);

    this.#b = b;
    this.#end = converter.from(b);

    this.#step = step * (this.#start > this.#end ? -1 : 1);
    this.#into = converter.into;
  }

  [Symbol.iterator]() {
    let current = this.#start;
    const end = this.#end;

    const step = this.#step;
    const into = this.#into;

    return {
      [Symbol.iterator]() {
        return this;
      },

      next: () => {
        const done = step > 0 ? current > end : current < end;

        if (done) {
          return { value: undefined, done };
        }

        const value = into(current);
        current += step;

        return { value, done };
      },
    };
  }

  reverse() {
    return new Range(this.#b, this.#a, this.#step);
  }
}

const symbolRange = new Range("a", "f");

console.log(Array.from(symbolRange)); // ["a", "b", "c", "d", "e", "f"]

console.log(Array.from(symbolRange.reverse())); // [ 'f', 'e', 'd', 'c', 'b', 'a' ]

const numberRange = new Range(-5, 1);

console.log(Array.from(numberRange.reverse())); // [1, 0, -1, -2, -3, -4, -5]
```

</details>
