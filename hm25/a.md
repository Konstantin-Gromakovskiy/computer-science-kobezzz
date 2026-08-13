## Поток для извлечения чисел из строк

Необходим реализовать КА, который считывает числа (number) из потока входных данных.
Если поток данных иссяк, КА должен выбрасывать исключение и переходить в состояние ожидания новых данных.

```typescript
const numbers = getNumbers("1003.30 hello world -45e10");

try {
  for (const number of numbers) {
    console.log(number);
  }
} catch (err) {
  // Expecting new input
  console.log(err);
  console.log(numbers.next("1000500 awesome 42")); // { value: 1000500, done: false }
}
```

<details>
<summary><strong>Смотреть решение</strong></summary>

```js
const numbers = getNumbers("1003.30 hello world -45e10");

try {
    for (const number of numbers) {
        console.log(number);
    }

} catch (err) {
    // Expecting new input
    console.log(err);
    console.log(numbers.next("1000500 awesome 42")); // { value: 1000500, done: false }
}

function getNumbers(string: string): IterableIterator<number> {
    function readNumbers() {
        const numbersRegExp = /[-+]?(([1-9]\d*|0)(\.\d*)?|\.\d+)([eE][-+]?\d+)?/g;
        return string.matchAll(numbersRegExp).map(([num]) => parseFloat(num));
    }

    let iter = readNumbers();

    return {
        [Symbol.iterator]() {
            return this;
        },

        next(newString?: string) {
            if (newString != null) {
                string = newString;
                iter = readNumbers();
            }

            const current = iter.next();

            if (current.done) {
                throw "Expecting new input";
            }

            return current;
        }
    };
}
```

</details>
