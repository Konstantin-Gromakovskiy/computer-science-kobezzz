## Простой шаблонизатор

Необходимо написать функцию, которая принимает строковый шаблон и объект параметров, и возвращает результат применения данных к этому шаблону.

```js
// Hello, Bob! Your age is 10.
const res = format("Hello, ${user}! Your age is ${age}.", { user: "Bob", age: 10 });
```

<details>
<summary><strong>Смотреть решение</strong></summary>

```js
console.log(format("Hello, ${user}! Your age is ${age}.", { user: "Bob", age: 10 }));

function format(str, vars) {
  const regex = /\$\{(.+?)}/g;
  return str.replaceAll(regex, (_, name) => vars[name]);
}
```

</details>
