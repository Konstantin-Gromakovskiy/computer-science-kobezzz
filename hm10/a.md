## Дек на основе связного списка массивов

Реализуйте универсальную структуру дека для разных view (массивы или типизированные массивы) и сравните реализацию с подходом на основе реаллокации памяти.

```js
// Тип массива и его емкость
const dequeue = new Deque(Uint8Array, 64);

dequeue.unshift(1); // Возвращает длину - 1
dequeue.unshift(2); // 2
dequeue.unshift(3); // 3

console.log(dequeue.length); // 3
dequeue.shift(); // Удаляет с начала, возвращает удаленный элемент - 3

dequeue.push(4);
dequeue.push(5);
dequeue.push(6);

dequeue.pop(); // Удаляет с конца, возвращает удаленный элемент - 6
```

<details>
<summary><strong>Смотреть решение</strong></summary>

### Сравнительный анализ реализаций Deque

- **Deque** — связанный список блоков фиксированного размера
- **DequeFlat** — дек на основе вектора

#### Результаты

###### Базовые операции (capacity = 64)

| Тест               | Deque (блочная) | DequeFlat  | Отставание |
| ------------------ | --------------- | ---------- | ---------- |
| Стек (push/pop)    | 0.99ms          | 0.63ms     | +57%       |
| Стек фронт         | 1.03ms          | 0.64ms     | +61%       |
| Очередь            | 1.00ms          | 0.64ms     | +56%       |
| Обратная очередь   | 1.22ms          | 0.64ms     | +91%       |
| Перемешивание      | 1.05ms          | 0.69ms     | +52%       |
| Расширение/сжатие  | 1.00ms          | 0.62ms     | +61%       |
| Волны              | 1.49ms          | 0.67ms     | +122%      |
| Экстремальный рост | 0.94ms          | 0.78ms     | +21%       |
| **Пинг-понг**      | **18.44ms**     | **1.47ms** | **+1154%** |

> Блочная реализация медленнее во всех сценариях. Критическое отставание в тесте "пинг-понг" (чередование операций с
> разных сторон) — в 12.5 раз.

###### Зависимость от capacity

| Capacity | Deque  | DequeFlat | Соотношение | Победитель  |
| -------- | ------ | --------- | ----------- | ----------- |
| 16       | 0.86ms | 1.81ms    | 2.10x       | **Блочная** |
| 64       | 1.36ms | 0.58ms    | 0.43x       | Flat        |
| 256      | 0.57ms | 0.56ms    | 0.99x       | Равны       |
| 1024     | 0.51ms | 0.65ms    | 1.27x       | **Блочная** |
| 4096     | 0.51ms | 0.60ms    | 1.29x       | **Блочная** |

**Закономерность:**

- Capacity ≤ 16 → побеждает блочная
- Capacity 64–256 → побеждает Flat
- Capacity ≥ 1024 → побеждает блочная

###### Типы данных (capacity = 64)

| Тип          | Время  |
| ------------ | ------ |
| Uint8Array   | 1.98ms |
| Int32Array   | 1.75ms |
| Float64Array | 1.87ms |

> Производительность слабо зависит от типа.

#### Сравнение потребления памяти

###### DequeFlat (кольцевой буфер)

| Capacity | Начальный размер | После 100k элементов | Пиковый размер |
| -------- | ---------------- | -------------------- | -------------- |
| 16       | 16 эл.           | 131 072 эл. (2^17)   | 262 144 эл.    |
| 64       | 64 эл.           | 131 072 эл. (2^17)   | 262 144 эл.    |
| 256      | 256 эл.          | 131 072 эл. (2^17)   | 262 144 эл.    |
| 1024     | 1024 эл.         | 131 072 эл. (2^17)   | 262 144 эл.    |
| 4096     | 4096 эл.         | 131 072 эл. (2^17)   | 262 144 эл.    |

**Особенности:**

- Ресайз происходит при заполнении (коэффициент 2)
- Пиковый размер всегда степень двойки
- После сжатия память НЕ освобождается
- При 100k элементов реально занято ~262k ячеек

###### Deque (блочная)

| Capacity | Кол-во блоков (100k эл.) | Размер блока | Доп. память       |
| -------- | ------------------------ | ------------ | ----------------- |
| 16       | 6 250 блоков             | 16 эл.       | +ListNode на блок |
| 64       | 1 563 блока              | 64 эл.       | +ListNode на блок |
| 256      | 391 блок                 | 256 эл.      | +ListNode на блок |
| 1024     | 98 блоков                | 1024 эл.     | +ListNode на блок |
| 4096     | 25 блоков                | 4096 эл.     | +ListNode на блок |

**Особенности:**

- Память выделяется блоками по capacity
- Свободные блоки НЕ освобождаются (остаются в linked list)
- Дополнительные расходы: ListNode (3 указателя) на каждый блок

#### Сравнение роста памяти (при вставке 100k элементов)

1. DequeFlat - (ступенчатый рост: 64→128→256→...→262144)
2. Deque - (линейный рост: 100000 / capacity \* (capacity + overhead))

###### Точные расчеты для capacity=64

**DequeFlat:**

- 100 000 элементов
- Ресайзы: 64 → 128 → 256 → 512 → 1024 → 2048 → 4096 → 8192 → 16384 → 32768 → 65536 → 131072
- Пиковый размер: 262 144 элемента
- **Переиспользование памяти: 2.6x от нужного**

**Deque (блочная):**

- 100 000 элементов
- Блоков: ceil(100000 / 64) = 1563 блока
- Память под данные: 100 000 × размер элемента
- Память под блоки: 1563 × 64 × размер элемента = 100 032 × размер элемента
- Память под ListNode: 1563 × (3 указателя ≈ 24 байта) ≈ 37.5 KB
- **Переиспользование памяти: практически 0 (минус 32 лишних элемента)**

#### Выводы

###### По производительности

1. **DequeFlat быстрее в большинстве сценариев** — проще, предсказуемее, лучше локальность данных
2. **Блочная реализация выигрывает при:**
   - Очень малых блоках (≤16)
   - Очень больших блоках (≥1024)
3. **Слабое место блочной реализации** — интенсивное чередование push/pop с разных сторон (пинг-понг): отставание в 12.5
   раз из-за частого создания/удаления блоков

###### По потреблению памяти

1. **DequeFlat лучше для динамически изменяющихся данных** — не требует дополнительной памяти на блоки, но страдает от
   переаллокаций
2. **DequeFlat НЕ освобождает память** — после роста размер остается максимальным
3. **Deque лучше для предсказуемого максимального размера** — почти 100% утилизация памяти
4. **Deque требует дополнительной памяти на ListNode** — при малых блоках (16) оверхед достигает 50%

###### Итоговые рекомендации

| Сценарий                         | Рекомендация        | Причина                   |
| -------------------------------- | ------------------- | ------------------------- |
| Неизвестный максимальный размер  | **DequeFlat**       | Автоматический рост       |
| Ограниченная память              | **Deque (блочная)** | Нет перевыделений         |
| Много операций с разных сторон   | **DequeFlat**       | Пинг-понг в 12.5x быстрее |
| Очень большие данные (>1M)       | **Deque (блочная)** | Нет копирования при росте |
| Вставка/удаление с одной стороны | **DequeFlat**       | Лучшая локальность        |
| Маленькие блоки (≤16)            | **Deque (блочная)** | Быстрее по CPU            |
| Большие блоки (≥1024)            | **Deque (блочная)** | Быстрее по CPU            |

#### Заключение

**DequeFlat** — выбор по умолчанию. Хорошая производительность, простота реализации, автоматическое масштабирование.

**Deque (блочная)** — специализированное решение для:

- Ограниченной памяти (встраиваемые системы)
- Очень больших объемов данных (чтобы избежать копирования)
- Сценариев с известным максимальным размером

```typescript
type QueueTypes =
  | Array<any>
  | Uint8Array
  | Uint8ClampedArray
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array
  | BigUint64Array
  | BigInt64Array;

type ArrayConstructor<T> = new (capacity: number) => T;

type ArrayValue<T> =
  T extends Array<infer E>
    ? E
    : T extends BigUint64Array | BigInt64Array
      ? bigint
      : number;

class ListNode<T> {
  value: T;

  prev: ListNode<T> | null = null;
  next: ListNode<T> | null = null;

  constructor(
    value: T,
    { prev, next }: { prev?: ListNode<T> | null; next?: ListNode<T> | null },
  ) {
    this.value = value;

    if (prev != null) {
      this.prev = prev;
      prev.next = this;
    }

    if (next != null) {
      this.next = next;
      next.prev = this;
    }
  }
}

class LinkedList<T> {
  first: ListNode<T> | null = null;
  last: ListNode<T> | null = null;

  [Symbol.iterator]() {
    return this.values();
  }

  pushFront(value: T) {
    const { first } = this;
    this.first = new ListNode(value, { next: first });

    if (this.last == null) {
      this.last = this.first;
    }
  }

  popFront(): T | null {
    const { first } = this;

    if (first == null || first === this.last) {
      this.first = null;
      this.last = null;
    } else {
      this.first = first.next;
      this.first!.prev = null;
    }

    return first?.value;
  }

  pushBack(value: T) {
    const { last } = this;
    this.last = new ListNode(value, { prev: last });

    if (this.first == null) {
      this.first = this.last;
    }
  }

  popBack(): T | null {
    const { last } = this;

    if (last == null || last === this.first) {
      this.first = null;
      this.last = null;
    } else {
      this.last = last.prev;
      this.last!.next = null;
    }

    return last?.value;
  }

  *values() {
    let node = this.first;

    while (node != null) {
      yield node.value;
      node = node.next;
    }
  }

  *reversedValues() {
    let node = this.last;

    while (node != null) {
      yield node.value;
      node = node.prev;
    }
  }
}

class Deque<T extends QueueTypes> {
  length: number = 0;

  readonly capacity: number;
  readonly ArrayConstructor: ArrayConstructor<T>;

  list: LinkedList<T>;
  firstIndex: number | null = null;
  lastIndex: number | null = null;

  get first(): ArrayValue<T> | undefined {
    if (this.firstIndex == null) {
      return undefined;
    }

    return this.list.first!.value[this.firstIndex];
  }

  get last(): ArrayValue<T> | undefined {
    if (this.lastIndex == null) {
      return undefined;
    }

    return this.list.last!.value[this.lastIndex];
  }

  constructor(ArrayConstructor: ArrayConstructor<T>, capacity: number) {
    if (!Number.isSafeInteger(capacity) || capacity <= 0) {
      throw new TypeError(
        `Capacity must be a positive safe integer, got ${capacity}`,
      );
    }

    this.capacity = capacity;
    this.ArrayConstructor = ArrayConstructor;

    this.list = new LinkedList<T>();
    this.list.pushFront(new ArrayConstructor(capacity));
  }

  push(value: ArrayValue<T>): number {
    return this.pushBack(value);
  }

  pop(): ArrayValue<T> | undefined {
    return this.popBack();
  }

  unshift(value: ArrayValue<T>): number {
    return this.pushFront(value);
  }

  shift(): number {
    return this.popFront();
  }

  pushFront(value: ArrayValue<T>): number {
    this.length++;

    let { firstIndex } = this;

    if (firstIndex == null) {
      firstIndex = Math.floor(this.capacity / 2);
    } else {
      firstIndex--;

      if (firstIndex < 0) {
        firstIndex = this.capacity - 1;
        this.list.pushFront(new this.ArrayConstructor(this.capacity));
      }
    }

    this.firstIndex = firstIndex;
    this.list.first!.value[firstIndex] = value;

    if (this.lastIndex == null) {
      this.lastIndex = this.firstIndex;
    }

    return this.length;
  }

  popFront(): ArrayValue<T> | undefined {
    let { firstIndex } = this;

    if (firstIndex == null) {
      return undefined;
    }

    this.length--;
    const value = this.list.first!.value[firstIndex];

    if (firstIndex === this.lastIndex && this.list.first === this.list.last) {
      this.firstIndex = null;
      this.lastIndex = null;
    } else {
      firstIndex++;

      if (firstIndex >= this.capacity) {
        firstIndex = 0;
        this.list.popFront();
      }

      this.firstIndex = firstIndex;
    }

    return value;
  }

  pushBack(value: ArrayValue<T>): number {
    this.length++;
    let { lastIndex } = this;

    if (lastIndex == null) {
      lastIndex = Math.floor(this.capacity / 2);
    } else {
      lastIndex++;

      if (lastIndex >= this.capacity) {
        lastIndex = 0;
        this.list.pushBack(new this.ArrayConstructor(this.capacity));
      }
    }

    this.lastIndex = lastIndex;
    this.list.last!.value[lastIndex] = value;

    if (this.firstIndex == null) {
      this.firstIndex = this.lastIndex;
    }

    return this.length;
  }

  popBack(): ArrayValue<T> | undefined {
    let { lastIndex } = this;

    if (lastIndex == null) {
      return undefined;
    }

    this.length--;
    const value = this.list.last!.value[lastIndex];

    if (lastIndex === this.firstIndex && this.list.first === this.list.last) {
      this.firstIndex = null;
      this.lastIndex = null;
    } else {
      lastIndex--;

      if (lastIndex < 0) {
        lastIndex = this.capacity - 1;
        this.list.popBack();
      }

      this.lastIndex = lastIndex;
    }

    return value;
  }
}

const dequeue = new Deque(Uint8Array, 64);

console.assert(dequeue.unshift(1) === 1);
console.assert(dequeue.unshift(2) === 2);
console.assert(dequeue.unshift(3) === 3);

console.assert(dequeue.length === 3);
console.assert(dequeue.shift() === 3); // Удаляет с начала, возвращает удаленный элемент - 3

console.assert(dequeue.push(4) === 3);
console.assert(dequeue.push(5) === 4);
console.assert(dequeue.push(6) === 5);

console.assert(dequeue.pop() === 6); // Удаляет с конца, возвращает удаленный элемент - 6
```

</details>
