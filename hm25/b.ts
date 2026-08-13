const runTask = (task: Generator, options: { threholds?: number; deley?: number }) => {
  const { threholds = 100, deley = 500 } = options;

  const start = performance.now();

  do {
    const result = task.next();
    if (result.done) {
      return;
    }
  } while (performance.now() - start < threholds);
  console.log(`Пауза на ${deley} мс`, new Date().getMilliseconds());

  setTimeout(() => runTask(task, options), deley);
};

function* task() {
  let count = 0;
  const start = performance.now();
  while (performance.now() - start < 2000) {
    console.log(`Шаг ${count}`, new Date().getMilliseconds());
    count++;
    yield;
  }
}

const gen = task();
runTask(gen, { threholds: 100, deley: 1000 });
