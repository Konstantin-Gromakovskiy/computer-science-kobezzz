## throttle

Необходимо написать функцию, которая принимает другую функцию и возвращает её throttle-версию.

```js
function laugh() {
  console.log("Ha-ha!");
}

const throttledLaugh = throttle(laugh, 300);

throttledLaugh(); // Выполнится сразу
throttledLaugh();
throttledLaugh();
throttledLaugh();
throttledLaugh(); // Выполнится через 300 мс
```
