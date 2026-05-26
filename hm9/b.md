## Универсальный вектор на основе типизированного массива

Реализуйте класс универсального вектора с поддержкой настраиваемых view для элементов (емкость и длина должны также кодироваться внутри буфера). Используйте ранее созданную структуру RGBA (Red, Green, Blue, Alpha) для тестирования функциональности. Сравните реализацию с массивом объектов в JS и сделайте выводы (отдельно проверьте сценарий с множественными записями в буфер и реакцией сборщика мусора). Задание \* (со звездочкой): реализуйте методы shift/unshift.

```typescript
// Обычный вектор, но в качестве элемента кортеж RGBA,
// а третий опциональный параметр позволяет задать используемый буфер (вместо создания нового)
const pixels = new Vector(capacity, RGBA);

// Readonly значение емкости вектора
console.log(pixels.capacity);

// Readonly значение длины вектора
console.log(pixels.length);

// Заполняем все цвета одним цветом:
// вектор не должен знать про нюансы преобразования значений - он должен полагаться на view
pixels.fill("#FFF");

// Чтение 0-го элемента вектора: сколько байт прочитать и как вернуть результат определяет view
console.log(pixels.get(0)); // [255, 255, 255, 255]

// Запись 10-го элемента
pixels.set(10, [255, 0, 0, 255]); // Явное задание цвета
pixels.set(10, "#EFEFEF"); // Задание через HEX

// Добавление в конец с возможным расширением
pixels.push([255, 0, 0, 255]);
pixels.push("#EFEFEF");

// Pop реаллокацию не делает
pixels.pop(); // [239, 239, 239, 255]

pixels.shrinkToFit(); // Ужимает внутренний буфер до фактической длины вектора
pixels.reserve(10); // Гарантирует место в буфере для хранения как минимум ещё 10 элементов (если места не хватает, происходит реаллокация)

// Метод view позволяет перейти к покомпонентному доступу к структуре или кортежу с возможностью редактирования
console.log(pixels.view(10).red); // 239
pixels.view(1).red = 255;
```

<details>
<summary><strong>Смотреть решение</strong></summary>

### 1. Сравнение производительности

| Объём   | Победитель | Vector  | Array   | Разница          |
| ------- | ---------- | ------- | ------- | ---------------- |
| 1,000   | Array      | 0.34 ms | 0.07 ms | Array +79.6%     |
| 10,000  | Array      | 1.42 ms | 0.49 ms | Array +65.4%     |
| 50,000  | Равны      | 3.66 ms | 3.95 ms | ±8%              |
| 100,000 | **Vector** | 1.60 ms | 7.31 ms | **Vector +357%** |

**Вывод:** На малых данных Array быстрее из-за меньшего overhead. На больших (>50k) Vector раскрывает преимущества
непрерывной памяти.

---

### 2. Влияние сборщика мусора (GC)

| Условие  | Vector | Array   | Разница         |
| -------- | ------ | ------- | --------------- |
| Без GC   | 637 ms | 300 ms  | Array +53%      |
| **С GC** | 697 ms | 1361 ms | **Vector +95%** |

**Вывод:** В реальных приложениях с активным GC Vector на 95% быстрее. Array страдает от постоянного
создания/уничтожения объектов.

---

### 3. Использование памяти (100k элементов)

| Структура | Память   | Экономия  |
| --------- | -------- | --------- |
| Vector    | 21.40 MB | —         |
| Array     | 28.59 MB | **25.2%** |

**Вывод:** На 1 млн элементов Vector сэкономит ~72 MB памяти.

---

### 4. Сильные и слабые стороны

**Vector:**

- ✅ Большие данные (>50k) — быстрее в 3.5 раза
- ✅ Активный GC — быстрее на 95%
- ✅ Экономия памяти 25%+
- ❌ Малые данные (<10k) — медленнее на 80%

**Array:**

- ✅ Малые данные — быстрее до 80%
- ✅ Простота кода и гибкость
- ❌ При GC — медленнее на 95%
- ❌ Больше памяти и паузы

---

### 5. Рекомендации

**Использовать Vector, если:**

- Элементов > 50,000
- Приложение долгоживущее (сервер, игра)
- Частые операции при активном GC
- Важна предсказуемость без пауз

**Использовать Array, если:**

- Мелкие данные (<10,000)
- Прототипирование
- Разнородные данные
- Скрипты разового запуска

---

```
============================================================
БЕНЧМАРК: Vector<RGBA> vs Array<RGBAObj>
============================================================

📊 Тест 1: Последовательные push/pop/random access
------------------------------------------------------------
Размер          Vector (ms)     Array (ms)      Разница
------------------------------------------------------------
1000            0.34            0.07            -79.6%
10000           1.42            0.49            -65.4%
50000           3.66            3.95            +7.9%
100000          1.60            7.31            +357.5%

💥 Тест 2: Стресс-тест с ростом/сжатием (500 итераций)
------------------------------------------------------------

Без принудительного GC:
Vector: 637.53ms
Array:  300.24ms
Разница: -52.9%

С принудительным GC (каждые 10 итераций):
Vector: 697.50ms
Array:  1361.90ms
Разница: 95.3%

📈 Тест 3: Память (примерное потребление)
------------------------------------------------------------
Vector: 21.40 MB
Array:  28.59 MB
Экономия: 25.2%
```

```js
class RGBA {
  static BYTES_PER_ELEMENT = 4;

  static get(bytes, byteOffset) {
    return [
      bytes[byteOffset],
      bytes[byteOffset + 1],
      bytes[byteOffset + 2],
      bytes[byteOffset + 3],
    ];
  }

  static set(bytes, byteOffset, color) {
    if (typeof color === "string") {
      if (color.startsWith("#")) {
        color = color.slice(1);
      }

      const hex = /([0-9a-f])/gi;

      switch (color.length) {
        // Короткая запись цвета
        case 3:
        case 4:
          color = color.replace(hex, "$1$1");
          break;

        default:
          color = color.padEnd(8, "F");
      }

      color = Uint8Array.fromHex(color);
    } else if (
      (!Array.isArray(color) && !ArrayBuffer.isView(color)) ||
      color.length < 3
    ) {
      throw new TypeError("Invalid argument");
    }

    bytes[byteOffset] = color[0];
    bytes[byteOffset + 1] = color[1];
    bytes[byteOffset + 2] = color[2];
    bytes[byteOffset + 3] = color[3] ?? 255;
  }

  get [Symbol.toStringTag]() {
    return `${this.constructor.name}(#${this.toHex()})`;
  }

  get buffer() {
    return this.#bytes.buffer;
  }

  get byteLength() {
    return this.#bytes.byteLength;
  }

  get byteOffset() {
    return this.#byteOffset + this.#bytes.byteOffset;
  }

  get BYTES_PER_ELEMENT() {
    return this.constructor.BYTES_PER_ELEMENT;
  }

  get red() {
    return this.#bytes[this.#byteOffset];
  }

  set red(value) {
    this.#bytes[this.#byteOffset] = value;
  }

  get green() {
    return this.#bytes[this.#byteOffset + 1];
  }

  set green(value) {
    this.#bytes[this.#byteOffset + 1] = value;
  }

  get blue() {
    return this.#bytes[this.#byteOffset + 2];
  }

  set blue(value) {
    this.#bytes[this.#byteOffset + 2] = value;
  }

  get alpha() {
    return this.#bytes[this.#byteOffset + 3];
  }

  set alpha(value) {
    this.#bytes[this.#byteOffset + 3] = value;
  }

  #bytes;
  #byteOffset;

  constructor(data, byteOffset = 0) {
    if (byteOffset >= data.byteLength) {
      throw new Error("byteOffset must be lower than data.byteLength");
    }

    this.#byteOffset = byteOffset;

    if (data instanceof Uint8Array) {
      if (byteOffset >= data.length) {
        throw new Error("byteOffset must be lower than data.length");
      }

      this.#bytes = data;
    } else {
      if (ArrayBuffer.isView(data)) {
        if (data.length < 4) {
          throw new Error("Invalid data length");
        }

        this.#bytes = new Uint8Array(data.slice(0, 4));
      } else {
        this.#bytes = new Uint8Array(data, 0, 4);
      }
    }
  }

  toHex() {
    return this.#bytes
      .slice(this.#byteOffset, this.#byteOffset + 4)
      .toHex()
      .toUpperCase();
  }

  toString() {
    return `#${this.toHex()}`;
  }
}

class Vector {
  get [Symbol.toStringTag]() {
    return `${this.constructor.name}(${this.length}:${this.capacity}, ${this.#view.name})`;
  }

  get capacity() {
    return this.#capacity;
  }

  get length() {
    return this.#length;
  }

  set length(value) {
    if (value > this.#capacity) {
      throw new RangeError("Cannot set length more than capacity");
    }

    this.#length = value;
  }

  get buffer() {
    return this.#bytes.buffer;
  }

  get byteLength() {
    return this.#bytes.byteLength;
  }

  get byteOffset() {
    return this.#bytes.byteOffset;
  }

  get BYTES_PER_ELEMENT() {
    return this.#view.BYTES_PER_ELEMENT;
  }

  #capacity;
  #length;
  #view;

  #bytes;
  #byteOffset = 0;

  constructor({ capacity, length = 0 }, view, data = null) {
    capacity ??= length;

    if (capacity < length) {
      throw new RangeError("Capacity must be greater or equal to length");
    }

    this.#capacity = capacity;
    this.#length = length;
    this.#view = view;

    const byteLength = capacity * view.BYTES_PER_ELEMENT;

    let buffer;

    if (data != null) {
      if (ArrayBuffer.isView(data)) {
        buffer = data.buffer;
        this.#byteOffset = data.byteOffset;
      } else {
        buffer = data;
      }

      if (buffer.byteLength < byteLength) {
        throw new Error("Invalid bytes length");
      }
    } else {
      const minByteLength = 1024;

      let maxByteLength;

      if (byteLength <= minByteLength) {
        maxByteLength = minByteLength;
      } else {
        maxByteLength = byteLength * 2;
      }

      buffer = new ArrayBuffer(byteLength, { maxByteLength });
    }

    this.#bytes = new Uint8Array(buffer, this.#byteOffset, byteLength);
  }

  get(index) {
    return this.#view.get(this.#bytes, this.#getOffset(index));
  }

  set(index, value) {
    if (index >= this.length) {
      if (index >= this.capacity) {
        this.#reserve(index + 1); // Сначала расширяем capacity
      }

      this.length = index + 1;
    }

    this.#view.set(this.#bytes, this.#getOffset(index), value);
  }

  fill(value) {
    for (
      let byteOffset = 0;
      byteOffset < this.#bytes.byteLength;
      byteOffset += this.BYTES_PER_ELEMENT
    ) {
      this.#view.set(this.#bytes, byteOffset, value);
    }
  }

  view(index) {
    return new this.#view(this.#bytes, this.#getOffset(index));
  }

  push(...values) {
    if (values.length === 0) {
      return this.length;
    }

    const newLength = this.length + values.length;

    if (newLength >= this.capacity) {
      this.#reserve(newLength);
    }

    for (const value of values) {
      this.#view.set(this.#bytes, this.#getOffset(this.length), value);
      this.length++;
    }

    return this.length;
  }

  pop() {
    if (this.length === 0) {
      return undefined;
    }

    this.#length--;
    return this.#view.get(this.#bytes, this.#getOffset(this.length));
  }

  unshift(...values) {
    if (values.length === 0) {
      return this.length;
    }

    const newLength = this.length + values.length;

    if (newLength >= this.capacity) {
      this.#reserve(newLength);
    }

    // Сдвиг существующих элементов
    if (this.length > 0) {
      const targetOffset = values.length * this.BYTES_PER_ELEMENT;
      this.#bytes.copyWithin(
        targetOffset,
        0,
        this.length * this.BYTES_PER_ELEMENT,
      );
    }

    for (let i = 0; i < values.length; i++) {
      this.#view.set(this.#bytes, i * this.BYTES_PER_ELEMENT, values[i]);
    }

    this.#length += values.length;
    return this.length;
  }

  shift() {
    if (this.length === 0) {
      return undefined;
    }

    const first = this.#view.get(this.#bytes, 0);

    if (this.length > 1) {
      this.#bytes.copyWithin(
        0,
        this.BYTES_PER_ELEMENT,
        this.length * this.BYTES_PER_ELEMENT,
      );
    }

    this.#length--;
    return first;
  }

  shrinkToFit() {
    if (this.length === this.capacity) {
      return;
    }

    const newByteLength = this.length * this.BYTES_PER_ELEMENT;
    const buffer = this.#bytes.buffer;

    if (buffer.resizable) {
      buffer.resize(newByteLength);
      this.#bytes = new Uint8Array(buffer, this.#byteOffset, newByteLength);
    } else {
      const maxByteLength = buffer.maxByteLength || newByteLength * 2;
      const newBuffer = new ArrayBuffer(newByteLength, { maxByteLength });

      const bytes = new Uint8Array(newBuffer);
      bytes.set(this.#bytes.subarray(0, newByteLength));

      this.#bytes = bytes;
      this.#byteOffset = 0;
    }

    this.#capacity = this.length;
  }

  reserve(extraElements) {
    extraElements >>>= 0;

    const neededCapacity = this.length + extraElements;

    if (neededCapacity <= this.capacity) {
      return; // Места достаточно
    }

    this.#reserve(neededCapacity);
  }

  [Symbol.iterator]() {
    let i = 0;

    return {
      [Symbol.iterator]() {
        return this;
      },

      next: () => {
        if (i >= this.length) {
          return { done: true, value: undefined };
        }

        return {
          done: false,
          value: new this.#view(this.#bytes, this.#getOffset(i++)),
        };
      },
    };
  }

  #reserve(minCapacity) {
    let newCapacity = this.capacity;

    while (newCapacity < minCapacity) {
      newCapacity = Math.ceil(newCapacity * 1.5); // Рост на 50% вместо ×2
    }

    const newByteLength = newCapacity * this.BYTES_PER_ELEMENT;
    const buffer = this.#bytes.buffer;

    // Пытаемся использовать resize, если буфер поддерживает
    if (buffer.resizable && buffer.maxByteLength >= newByteLength) {
      buffer.resize(newByteLength);
      this.#bytes = new Uint8Array(buffer, this.#byteOffset, newByteLength);
    } else {
      // Создаём новый буфер
      const maxByteLength = Math.max(
        newByteLength,
        buffer.maxByteLength || newByteLength,
      );

      const newBuffer = new ArrayBuffer(newByteLength, { maxByteLength });
      const newBytes = new Uint8Array(newBuffer);
      newBytes.set(this.#bytes);

      this.#bytes = newBytes;
      this.#byteOffset = 0;
    }

    this.#capacity = newCapacity;
  }

  #getOffset(index) {
    if (index < 0 || index >= this.capacity) {
      throw new RangeError(`Index out of bounds: ${index}`);
    }

    return index * this.BYTES_PER_ELEMENT;
  }
}

// Обычный вектор, но в качестве элемента кортеж RGBA,
// а третий опциональный параметр позволяет задать используемый буфер (вместо создания нового)
const pixels = new Vector({ capacity: 10 }, RGBA);

// Readonly значение емкости вектора
console.log(pixels.capacity);

// Readonly значение длины вектора
console.log(pixels.length);

// Заполняем все цвета одним цветом:
// вектор не должен знать про нюансы преобразования значений - он должен полагаться на view
pixels.fill("#FFF");

// Чтение 0-го элемента вектора: сколько байт прочитать и как вернуть результат определяет view
console.log(pixels.get(0)); // [255, 255, 255, 255]

// Запись 10-го элемента
pixels.set(10, [255, 0, 0, 255]); // Явное задание цвета
pixels.set(10, "#EFEFEF"); // Задание через HEX

// Добавление в конец с возможным расширением
pixels.push([255, 0, 0, 255]);
pixels.push("#EFEFEF");

// Pop реаллокацию не делает
pixels.pop(); // [239, 239, 239, 255]

pixels.shrinkToFit(); // Ужимает внутренний буфер до фактической длины вектора
pixels.reserve(10); // Гарантирует место в буфере для хранения как минимум ещё 10 элементов (если места не хватает, происходит реаллокация)

// Метод view позволяет перейти к покомпонентному доступу к структуре или кортежу с возможностью редактирования
console.log(pixels.view(10).red); // 239
pixels.view(1).red = 255;
```

</details>
