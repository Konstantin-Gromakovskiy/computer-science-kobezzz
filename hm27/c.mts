const waterfall = (cbs: Iterable<((...args: any[]) => void)>, finalCb: (err: unknown, ...args: unknown[]) => void) => {
  
  const iter = cbs[Symbol.iterator]()
  const next = (err: unknown, ...args: unknown[]) => {
    if (err !== null) return finalCb(err)
    
    const task = iter.next()
    if (task.done) return finalCb(null, ...args)
    return task.value(...args, next)
    
  }
  
  return next(null)
}


waterfall([
  (cb) => {
    // Первый аргумент cb — это ошибка.
    // Если она не null, выполнение сразу должно переводиться на финальный callback.
    cb(null, "one", "two");
  },
  
  (arg1, arg2, cb) => {
    console.log(arg1); // one
    console.log(arg2); // two
    cb(null, "three");
  },
  
  (arg1, cb) => {
    console.log(arg1); // three
    cb(null, "done");
  }
], (err, result) => {
  console.log(result); // done
});

waterfall(new Set([
  (cb) => {
    cb("ha-ha!");
  },
  
  (arg1, cb) => {
    cb(null, "done");
  }
]), (err, result) => {
  console.log('err', err);    // ha-ha!
  console.log(result); // undefined
});

