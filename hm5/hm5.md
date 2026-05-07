## Реализация потока RGBA пикселей

> Цель задания: понять, как **представление данных в памяти** и **паттерн доступа** влияют на производительность.

> Вы увидите, что даже в высокоуровневом JavaScript неправильная структура данных может драматически повлиять на
> производительность — и почему это происходит.

Реализуйте интерфейс `PixelStream` с **четырьмя разными внутренними представлениями** данных и исследуйте влияние на производительность. Напишите бенчмарки для изображений с разным разрешением.

```typescript
type RGBA = [red: number, green: number, blue: number, alpha: number];

enum TraverseMode {
  RowMajor,
  ColMajor,
}

interface PixelStream {
  getPixel(x: number, y: number): RGBA;
  setPixel(x: number, y: number, rgba: RGBA): RGBA;
  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void,
  ): void;
}
```

### Варианты представления данных

| Тип                  | Описание                                  |
| -------------------- | ----------------------------------------- |
| **flat-array**       | Один `Array` чисел длины `width*height*4` |
| **array-of-arrays**  | Массив массивов: `[[r,g,b,a], ...]`       |
| **array-of-objects** | Массив объектов: `[{r,g,b,a}, ...]`       |
| **typed-array**      | Один `Uint8Array` длины `width*height*4`  |

<details>
<summary><strong>Смотреть решение</strong></summary>

### Вывод по результатам бенчмарка

#### Нестабильность результатов

Важно понимать, что результаты производительности JavaScript могут значительно отличаться от запуска к запуску. Это связано с несколькими факторами:

- JIT-компиляция V8 — движок постоянно оптимизирует и деоптимизирует код на основе профилирования

- Состояние кэша процессора — данные могут быть в кэше или в оперативной памяти

- Фоновые процессы ОС — планировщик задач, прерывания, другие приложения

- Сборка мусора — даже с --expose-gc полной детерминированности не достичь

#### Как делать правильно

В идеальном бенчмарке каждый тестовый сценарий следует прогонять многократно (50-100 раз) и вычислять:

- Медиану — наиболее устойчива к выбросам

- Процентили (95-й, 99-й) — для понимания худшего случая

- Среднее — для общей оценки

- Стандартное отклонение — для оценки стабильности

#### Зачем нужен флаг --expose-gc

При запуске бенчмарков критически важно контролировать сборку мусора (GC), чтобы она не искажала результаты:

```js
// Проблема: GC может запуститься в середине теста
const start = performance.now();
stream.forEach(...);           // ВОТ ТУТ внезапно может запуститься GC!
const end = performance.now(); // Результат включает время сборки мусора ❌

// Решение: контролируем GC
globalThis.gc?.();             // Явно вызываем ДО теста
const start = performance.now();
stream.forEach(...);           // GC не запустится (уже собрали)
const end = performance.now(); // Чистое время теста ✅
```

```
# Правильный запуск бенчмарка
node --expose-gc benchmark.js

# Без флага GC недоступен
node benchmark.js  # global.gc === undefined
```

#### Что можно выявить даже при такой нестабильности

- Плоский массив эффективнее — как Flat Array, так и Typed Array показывают лучшую производительность благодаря последовательному хранению данных в памяти и cache-friendly доступу.

- Разница между обычным и типизированным массивом минимальна — цвета хранятся в формате SMI (Small Integer), который V8 отлично оптимизирует. Поэтому Uint8Array не даёт ощутимого преимущества перед обычным массивом чисел.

- Порядок обхода критичен — чем больше изображение, тем сильнее влияние паттерна доступа:
  - RowMajor (по строкам) — оптимальный доступ, данные лежат последовательно

  - ColMajor (по столбцам) — промахи кэша замедляют работу в 2-5 раз для плоских массивов

  - Random доступ — самый медленный, убивает кэш процессора

- Array of Arrays и Array of Objects значительно медленнее — двойная косвенность (массив → объект/массив → данные) и фрагментация памяти в куче приводят к множественным промахам кэша и накладным расходам на разыменование указателей.

#### Неожиданный результат

В данном бенчмарке Uint8SubarrayPixelStream показал значительно худшую производительность, чем создание нового массива через [this.data[idx], this.data[idx+1], ...]. Это контринтуитивно, так как subarray не копирует данные, а создаёт лишь view (представление).

Парадоксально, но создание нового массива из 4 чисел оказывается быстрее, потому что:

- Маленький массив (4 элемента) может разместиться в регистрах или маленькой локальной области

- V8 оптимизирует создание маленьких массивов (до 4 элементов) как "массив-на-стеке"

- Нет накладных расходов на объект view и его методы

**Вывод:** subarray полезен, когда нужно работать с большими непрерывными блоками данных без копирования, но для частого доступа к маленьким кусочкам (по 4 байта) он проигрывает прямому созданию массива из-за накладных расходов на создание объектов view и потерь на косвенность.

```
node --expose-gc benchmark.js
```

```js
class PixelTraverse {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  forEach(mode, cb) {
    if (mode === "rowMajor") {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          cb(this.getPixel(x, y), x, y);
        }
      }
    } else {
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          cb(this.getPixel(x, y), x, y);
        }
      }
    }
  }
}

class FlatArrayPixelStream extends PixelTraverse {
  constructor(width, height) {
    super(width, height);
    this.data = new Array(width * height * 4).fill(0);
  }

  getIndex(x, y) {
    return (y * this.width + x) * 4;
  }

  getPixel(x, y) {
    const idx = this.getIndex(x, y);
    return [
      this.data[idx],
      this.data[idx + 1],
      this.data[idx + 2],
      this.data[idx + 3],
    ];
  }

  setPixel(x, y, rgba) {
    const idx = this.getIndex(x, y);
    this.data[idx] = rgba[0];
    this.data[idx + 1] = rgba[1];
    this.data[idx + 2] = rgba[2];
    this.data[idx + 3] = rgba[3];
    return rgba;
  }
}

class ArrayOfArraysPixelStream extends PixelTraverse {
  constructor(width, height) {
    super(width, height);
    this.data = Array.from({ length: width * height }, () => [0, 0, 0, 0]);
  }

  getIndex(x, y) {
    return y * this.width + x;
  }

  getPixel(x, y) {
    const pixel = this.data[this.getIndex(x, y)];
    return [pixel[0], pixel[1], pixel[2], pixel[3]];
  }

  setPixel(x, y, rgba) {
    const pixel = this.data[this.getIndex(x, y)];
    pixel[0] = rgba[0];
    pixel[1] = rgba[1];
    pixel[2] = rgba[2];
    pixel[3] = rgba[3];
    return rgba;
  }
}

class ArrayOfObjectsPixelStream extends PixelTraverse {
  constructor(width, height) {
    super(width, height);
    this.data = Array.from({ length: width * height }, () => ({
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    }));
  }

  getIndex(x, y) {
    return y * this.width + x;
  }

  getPixel(x, y) {
    const pixel = this.data[this.getIndex(x, y)];
    return [pixel.r, pixel.g, pixel.b, pixel.a];
  }

  setPixel(x, y, rgba) {
    const pixel = this.data[this.getIndex(x, y)];
    pixel.r = rgba[0];
    pixel.g = rgba[1];
    pixel.b = rgba[2];
    pixel.a = rgba[3];
    return rgba;
  }
}

class Uint8PixelStream extends PixelTraverse {
  constructor(width, height) {
    super(width, height);
    this.data = new Uint8Array(width * height * 4);
  }

  getIndex(x, y) {
    return (y * this.width + x) * 4;
  }

  getPixel(x, y) {
    const idx = this.getIndex(x, y);
    return [
      this.data[idx],
      this.data[idx + 1],
      this.data[idx + 2],
      this.data[idx + 3],
    ];
  }

  setPixel(x, y, rgba) {
    const idx = this.getIndex(x, y);
    this.data[idx] = rgba[0];
    this.data[idx + 1] = rgba[1];
    this.data[idx + 2] = rgba[2];
    this.data[idx + 3] = rgba[3];
    return rgba;
  }
}

class Uint8SubarrayPixelStream extends PixelTraverse {
  constructor(width, height) {
    super(width, height);
    this.data = new Uint8Array(width * height * 4);
  }

  getIndex(x, y) {
    return (y * this.width + x) * 4;
  }

  getPixel(x, y) {
    const idx = this.getIndex(x, y);
    return this.data.subarray(idx, idx + 4);
  }

  setPixel(x, y, rgba) {
    const idx = this.getIndex(x, y);
    this.data[idx] = rgba[0];
    this.data[idx + 1] = rgba[1];
    this.data[idx + 2] = rgba[2];
    this.data[idx + 3] = rgba[3];
    return rgba;
  }
}

if (!("gc" in globalThis)) {
  console.log("Запустите с флагом --expose-gc для точных результатов");
  console.log("Пример: node --expose-gc benchmark.js\n");
}

runBenchmark();

function runBenchmark() {
  const sizes = [
    { width: 50, height: 50, name: "25K" },
    { width: 500, height: 500, name: "250K" },
    { width: 1000, height: 1000, name: "1M" },
  ];

  const implementations = [
    { Class: FlatArrayPixelStream },
    { Class: ArrayOfArraysPixelStream },
    { Class: ArrayOfObjectsPixelStream },
    { Class: Uint8PixelStream },
    { Class: Uint8SubarrayPixelStream },
  ];

  function randomColor() {
    return [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      255,
    ];
  }

  const WARMUP = 10;

  for (const size of sizes) {
    console.log(
      `\n📐 Размер: ${size.width}x${size.height} (${size.name} пикселей)`,
    );
    console.log("-".repeat(80));

    for (const impl of implementations) {
      console.log(`\n Тестирование ${impl.Class.name}`);
      globalThis.gc?.();

      const stream = new impl.Class(size.width, size.height);

      // Заполнение случайными цветами
      for (let y = 0; y < size.height; y++) {
        for (let x = 0; x < size.width; x++) {
          stream.setPixel(x, y, randomColor());
        }
      }

      // Прогрев
      let warmupSum = 0;

      for (let w = 0; w < WARMUP; w++) {
        stream.forEach("rowMajor", (rgba) => {
          warmupSum += rgba[0] + rgba[1] + rgba[2];
        });
        stream.forEach("colMajor", (rgba) => {
          warmupSum += rgba[0] + rgba[1] + rgba[2];
        });
      }

      console.log(
        `\n🔥 Прогрев (контрольная сумма: ${warmupSum.toString(36)})`,
      );
      globalThis.gc?.();

      // Тест 1: Чтение по строкам
      let sum1 = 0;

      const rowReadStart = performance.now();
      stream.forEach("rowMajor", (rgba) => {
        sum1 += rgba[0] + rgba[1] + rgba[2];
      });
      const rowReadTime = performance.now() - rowReadStart;

      console.log(`  Контрольная сумма (row): ${sum1.toString(36)}`);
      globalThis.gc?.();

      // Тест 2: Чтение по столбцам
      let sum2 = 0;

      const colReadStart = performance.now();
      stream.forEach("colMajor", (rgba) => {
        sum2 += rgba[0] + rgba[1] + rgba[2];
      });
      const colReadTime = performance.now() - colReadStart;

      console.log(`  Контрольная сумма (col): ${sum2.toString(36)}`);
      globalThis.gc?.();

      // Тест 3: Случайное чтение
      let sum5 = 0;
      const randReadStart = performance.now();

      for (let i = 0; i < size.width * size.height; i++) {
        const x = Math.floor(Math.random() * size.width);
        const y = Math.floor(Math.random() * size.height);
        const p = stream.getPixel(x, y);
        sum5 += p[0] + p[1] + p[2];
      }

      const randReadTime = performance.now() - randReadStart;
      console.log(`  Контрольная сумма (rand): ${sum5.toString(36)}`);

      console.log("\n  Результаты:\n");
      console.log(`    Чтение (по строкам):    ${rowReadTime.toFixed(2)}ms`);
      console.log(`    Чтение (по столбцам):   ${colReadTime.toFixed(2)}ms`);
      console.log(`    Случайное чтение:       ${randReadTime.toFixed(2)}ms`);
      console.log("\n  ###");
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("Финализация (4M пикселей)");
  console.log("=".repeat(80));

  const size = { width: 2000, height: 2000 };
  const results = [];

  for (const impl of implementations) {
    console.log(`\n Тестирование ${impl.Class.name}`);
    globalThis.gc?.();

    const stream = new impl.Class(size.width, size.height);

    // Заполнение случайными цветами
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        stream.setPixel(x, y, randomColor());
      }
    }

    // Прогрев
    let warmupSumFinal = 0;

    for (let w = 0; w < WARMUP; w++) {
      stream.forEach("rowMajor", (rgba) => {
        warmupSumFinal += rgba[0] + rgba[1] + rgba[2];
      });
      stream.forEach("colMajor", (rgba) => {
        warmupSumFinal += rgba[0] + rgba[1] + rgba[2];
      });
    }

    console.log(
      `\n🔥 Прогрев (контрольная сумма: ${warmupSumFinal.toString(36)})`,
    );
    globalThis.gc?.();

    // Тест 1: Чтение по строкам
    let sum1 = 0;

    const rowStart = performance.now();
    stream.forEach("rowMajor", (rgba) => {
      sum1 += rgba[0] + rgba[1] + rgba[2];
    });
    const rowTime = performance.now() - rowStart;

    console.log(`  Контрольная сумма (row): ${sum1.toString(36)}`);
    globalThis.gc?.();

    // Тест 2: Чтение по столбцам
    let sum2 = 0;

    const colStart = performance.now();
    stream.forEach("colMajor", (rgba) => {
      sum2 += rgba[0] + rgba[1] + rgba[2];
    });
    const colTime = performance.now() - colStart;

    console.log(`  Контрольная сумма (col): ${sum2.toString(36)}`);
    globalThis.gc?.();

    // Тест 3: Случайное чтение
    let sum3 = 0;
    const randStart = performance.now();

    for (let i = 0; i < size.width * size.height; i++) {
      const x = Math.floor(Math.random() * size.width);
      const y = Math.floor(Math.random() * size.height);
      const p = stream.getPixel(x, y);
      sum3 += p[0] + p[1] + p[2];
    }

    const randTime = performance.now() - randStart;
    console.log(`  Контрольная сумма (rand): ${sum3.toString(36)}`);

    results.push({ name: impl.Class.name, rowTime, colTime, randTime });
  }

  results.sort((a, b) => a.rowTime - b.rowTime);
  console.log(`\n🏆 РЕЙТИНГ (от быстрого к медленному):\n`);

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const medal = i === 0 ? "🏆" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";

    console.log(`${medal} ${r.name}:`);
    console.log(`     Чтение (по строкам):  ${r.rowTime.toFixed(2)}ms`);
    console.log(`     Чтение (по столбцам): ${r.colTime.toFixed(2)}ms`);
    console.log(`     Случайное чтение:     ${r.randTime.toFixed(2)}ms`);
    console.log("");
  }
}
```

</details>
