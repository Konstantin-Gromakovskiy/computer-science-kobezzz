## debounce

Необходимо написать функцию, которая принимает другую функцию и возвращает её debounce-версию.

```js
function laugh() {
  console.log("Ha-ha!");
}

const debouncedLaugh = debounce(laugh, 300);

debouncedLaugh();
debouncedLaugh();
debouncedLaugh();
debouncedLaugh();
debouncedLaugh(); // Выполнится через 300 мс
```
