## Ассоциативный массив на основе бинарного дерева поиска

Реализуйте класс TreeMap для создания ассоциативного массива (ключ → значение) на основе обычного бинарного дерева
поиска (без балансировки).

```js
const map = new TreeMap();

map.set("banana", 3);
map.set("apple", 2);
map.set("cherry", 5);
map.set("date", 1);

console.log(map.get("apple"));     // 2
console.log(map.has("banana"));    // true
console.log(map.keys());           // ["apple", "banana", "cherry", "date"]

map.delete("cherry");
console.log(map.entries());
// [["apple", 2], ["banana", 3], ["date", 1]]
```
