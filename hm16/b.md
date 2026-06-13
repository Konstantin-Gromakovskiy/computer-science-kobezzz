## Ассоциативный массив на бинарном дереве в плоском массиве

Реализуйте класс ArrayTreeMap для создания ассоциативного массива на основе плоского массива, используя формулы для
хранения узлов:

- Левый потомок: `2 * i + 1`
- Правый потомок: `2 * i + 2`
- Родитель: `Math.floor((i - 1) / 2)`

```js
const map = new ArrayTreeMap(16); // Стартовая емкость

map.set(10, "A");
map.set(5, "B");
map.set(15, "C");
map.set(3, "D");
map.set(7, "E");

console.log(map.get(7));           // "E"
console.log(map.keys());           // [3, 5, 7, 10, 15]
console.log(map.getIndex(10));     // 0
console.log(map.getIndex(7));      // 4
```
