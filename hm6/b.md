## Реализация операций unshift/shift за O(1)\*

> Задача со звездочкой

Реализуйте на основе массива такую структуру данных, для которой операции `unshift`/`shift` будут равны по эффективности на любых наборах данных с `push`/`pop`. Сделайте бенчмарк производительности.

> Подсказка: погуглите структуру данных Кольцевой буфер

<details>
<summary><strong>Смотреть решение</strong></summary>

```js
class Deque {
  get capacity() {
    return this.#buffer.length;
  }

  get length() {
    return this.#length;
  }

  #buffer;
  #length = 0;
  #start;
  #end;

  constructor(capacity = 4) {
    const actualCapacity = Math.max(4, capacity >>> 0);
    this.#buffer = new Array(actualCapacity);

    // Начинаем с середины, чтобы данные были "рядом" и было место для роста в обе стороны
    this.#start = Math.floor(actualCapacity / 2);
    this.#end = this.#start;
  }

  // Алиас к pushBack
  push(value) {
    this.pushBack(value);
  }

  // Алиас к popBack
  pop(value) {
    this.popBack(value);
  }

  // Алиас к pushFront
  unshift(value) {
    this.pushFront(value);
  }

  // Алиас popFront
  shift(value) {
    this.popFront(value);
  }

  // Добавление в начало
  pushFront(value) {
    if (this.#start <= 0) {
      this.resize(this.capacity * 2);
    }

    this.#start--;
    this.#buffer[this.#start] = value;
    this.#length++;

    return this.length;
  }

  // Добавление в конец
  pushBack(value) {
    if (this.#end >= this.capacity) {
      this.resize(this.capacity * 2);
    }

    this.#buffer[this.#end] = value;
    this.#end++;
    this.#length++;

    return this.length;
  }

  // Удаление из начала
  popFront() {
    if (this.isEmpty()) {
      return undefined;
    }

    const value = this.#buffer[this.#start];
    this.#buffer[this.#start] = undefined;
    this.#start++;
    this.#length--;

    return value;
  }

  // Удаление из конца
  popBack() {
    if (this.isEmpty()) {
      return undefined;
    }

    this.#end--;
    const value = this.#buffer[this.#end];
    this.#buffer[this.#end] = undefined;
    this.#length--;

    return value;
  }

  // Просмотр первого элемента
  peekFront() {
    return this.isEmpty() ? undefined : this.#buffer[this.#start];
  }

  // Просмотр последнего элемента
  peekBack() {
    return this.isEmpty() ? undefined : this.#buffer[this.#end - 1];
  }

  // Очистка дека
  clear() {
    this.#buffer.fill(undefined);
    const mid = Math.floor(this.capacity / 2);
    this.#start = mid;
    this.#end = mid;
    this.#length = 0;
  }

  // Проверка на пустоту
  isEmpty() {
    return this.#length === 0;
  }

  // Проверка на заполненность
  isFull() {
    return this.#length === this.capacity;
  }

  // Изменение размера внутреннего буфера
  resize(newCapacity = this.#length) {
    if (newCapacity < this.#length) {
      newCapacity = this.#length;
    }

    const newBuffer = new Array(newCapacity);
    const offset = Math.floor((newCapacity - this.#length) / 2);

    // Копируем непрерывный блок в середину нового буфера
    for (let i = 0; i < this.#length; i++) {
      newBuffer[offset + i] = this.#buffer[this.#start + i];
    }

    this.#buffer = newBuffer;
    this.#start = offset;
    this.#end = offset + this.#length;
  }
}

{
  const q = new Deque(3);

  // Тест 1: pushBack/popFront
  q.pushBack(1);
  q.pushBack(2);
  q.pushBack(3);

  console.assert(q.popFront() === 1, "pushBack/popFront failed");
  console.assert(q.popFront() === 2, "pushBack/popFront failed");
  console.assert(q.popFront() === 3, "pushBack/popFront failed");

  // Тест 2: pushFront/popBack
  q.pushFront(1);
  q.pushFront(2);
  q.pushFront(3);

  console.assert(q.popBack() === 1, "pushFront/popBack failed");
  console.assert(q.popBack() === 2, "pushFront/popBack failed");
  console.assert(q.popBack() === 3, "pushFront/popBack failed");

  console.log("==================");

  // Тест 3: автоматический resize
  const r = new Deque(2);

  r.pushBack(1);
  r.pushBack(2);
  r.pushBack(3);

  console.assert(r.capacity === 8, "resize failed");

  // Тест 4: смешанные операции
  const d = new Deque(3);

  d.pushBack(1);
  d.pushBack(2);
  d.pushFront(0);

  console.assert(d.popFront() === 0, "mixed operations failed");
  console.assert(d.popBack() === 2, "mixed operations failed");
  console.assert(d.popFront() === 1, "mixed operations failed");

  console.log("Все быстрые тесты пройдены!");
}
```

</details>
