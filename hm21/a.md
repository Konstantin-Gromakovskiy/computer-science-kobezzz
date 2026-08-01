## Сжатие строки

Необходимо написать функцию, которая бы принимала бы строку и "схлопывала" бы все подряд идущие повторения.

```js
console.log(zipStr("abbaabbafffbezza")); // abafbeza
```

<details>
<summary><strong>Смотреть решение</strong></summary>

```js
console.log(zipStr("abbaabbafffbezza")); // abafbeza

function zipStr(str) {
  let prev;

  do {
    prev = str;
    str = str.replaceAll(/(.+)\1+/g, "$1");
  } while (str.length !== prev.length);

  return str;
}
```

</details>
