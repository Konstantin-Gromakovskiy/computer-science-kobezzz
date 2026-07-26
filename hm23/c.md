## Итератор по DOM с селектором

Необходимо написать функцию-итератор для поиска DOM-узлов, начиная с заданного, по CSS-селектору. Функция должна работать лениво и не запускать поиск сразу по всему DOM-дереву, а выполнять его по мере необходимости (при каждом вызове next()).

```js
const iter = querySelectorAllLazy(".item", document.body);

console.log(iter.next().value); // Первый элемент с классом .item
console.log(iter.next().value); // Второй элемент

// Поиск продолжается только при вызове next()
```

<details>
<summary><strong>Смотреть решение</strong></summary>

```js
function querySelectorAllLazy(selector, source) {
  const treeWalker = document.createTreeWalker(source, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      return node.matches(selector) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });

  return {
    [Symbol.iterator]() {
      return this;
    },

    next() {
      const value = treeWalker.nextNode();
      return { value, done: value == null };
    },
  };
}
```

</details>
