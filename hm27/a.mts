const debounce = <Args extends unknown[], R>(fn: (...args: Args) => R, delay: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Args): void => {
    if (!timeout) timeout = setTimeout(fn, delay, ...args);
    else {
      clearTimeout(timeout)
      timeout = setTimeout(fn, delay, ...args);
    }
  }
}

function laugh(str: string) {
  console.log(str);
}

const debouncedLaugh = debounce(laugh, 300);

debouncedLaugh('ha');
debouncedLaugh('hah');
debouncedLaugh('haha');
debouncedLaugh('hahah');
debouncedLaugh('hahaha'); // Выполнится через 300 мс



