## Простой планировщик для функций

Необходимо написать функцию, которая принимает генератор и гарантирует, что его исполнение не создаст блокировку основного потока управления. Если функция выполняется уже долго, планировщик должен дать время на работу основному потоку.

```typescript
function* task() {
  let count = 0;

  while (count < 10) {
    console.log(`Шаг ${count}`, new Date().toISOString());
    count++;

    // Возвращаем управление планировщику
    yield;
  }

  return "Завершено";
}

function runTask(generator, options) {
  const { threshold = 100, delay = 500 } = options;
  // Реализуйте планировщик
}

const gen = task();

runTask(gen, {
  threshold: 100, // 100 мс — порог для задержки
  delay: 500, // 500 мс — задержка, если порог превышен
});

// Шаг 0 2024-01-01T00:00:00.000Z (запущен сразу)
// Шаг 1 2024-01-01T00:00:00.005Z (запущен сразу)
// Шаг 2 2024-01-01T00:00:00.010Z (запущен сразу)
// ... (быстрые итерации)
// (прошло больше 100 мс)
// Шаг 5 2024-01-01T00:00:00.600Z (запущен с задержкой 500 мс)
// Шаг 6 2024-01-01T00:00:00.605Z (запущен сразу)
```

<details>
<summary><strong>Смотреть решение</strong></summary>

```typescript
function* task() {
  let count = 0;

  while (count < 10000) {
    console.log(`Шаг ${count}`, new Date().toISOString());
    count++;

    // Возвращаем управление планировщику
    yield;
  }

  return "Завершено";
}

function runTask(generator: Iterator<any>, options: { threshold: number; delay: number }) {
  const { threshold = 100, delay = 500 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime <= threshold) {
    const result = generator.next();

    if (result.done) {
      return;
    }
  }

  setTimeout(() => {
    runTask(generator, options);
  }, delay);
}

const gen = task();

runTask(gen, {
  threshold: 100, // 100 мс — порог для задержки
  delay: 2500, // 500 мс — задержка, если порог превышен
});

setInterval(() => {
  console.log(`Основной поток ${Date.now()}`);
}, 50);

// Шаг 0 2024-01-01T00:00:00.000Z (запущен сразу)
// Шаг 1 2024-01-01T00:00:00.005Z (запущен сразу)
// Шаг 2 2024-01-01T00:00:00.010Z (запущен сразу)
// ... (быстрые итерации)
// (прошло больше 100 мс)
// Шаг 5 2024-01-01T00:00:00.600Z (запущен с задержкой 500 мс)
// Шаг 6 2024-01-01T00:00:00.605Z (запущен сразу)
```

</details>
