const throttle = <Args extends unknown[]>(fn: (...args: Args) => void, delay: number) => {
  let action: null | (() => void) = null
  let timeout: null | ReturnType<typeof setTimeout> = null
  
  return (...args: Args) => {
    if (!timeout && !action) {
      fn(...args)
      timeout = setTimeout(() => {
        if (action) {
          action()
          action = null
        }
        timeout = null
      }, delay)
    }
    else action = () => fn(...args)
  }
}

function laugh(str: string) {
  console.log(str);
}

const throttledLaugh = throttle(laugh, 300);

throttledLaugh('ha'); // Выполнится сразу
throttledLaugh('hah');
throttledLaugh('haha');
throttledLaugh('hahah');
throttledLaugh('hahaha'); // Выполнится через 300 мс
