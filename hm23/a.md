## Итератор по случайным числам

Необходимо написать функцию-генератор для создания итератора, генерирующего случайные числа в заданном диапазоне.

```js
const randomInt = random(0, 100);

console.log(randomInt.next().value); // Случайное число от 0 до 100
console.log(randomInt.next().value);
console.log(randomInt.next().value);
console.log(randomInt.next().value);
```

<details>
<summary><strong>Смотреть решение</strong></summary>

```js
const randomInt = random(0, 100);

console.log(randomInt.next().value); // Случайное число от 0 до 100
console.log(randomInt.next().value);
console.log(randomInt.next().value);
console.log(randomInt.next().value);

function random(from, to) {
  return {
    [Symbol.iterator]() {
      return this;
    },

    next() {
      return {
        done: false,
        value: Math.floor(Math.random() * (to - from) + from),
      };
    },
  };
}
```

</details>
