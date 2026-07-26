function random(min: number, max: number) {
  return {
    next() {
      const minCeiled = Math.ceil(min);
      const maxFloored = Math.floor(max);
      return { value: Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled), done: false };
    },
  };
}

const randomInt = random(0, 100);

console.log(randomInt.next().value);
console.log(randomInt.next().value);
console.log(randomInt.next().value);
console.log(randomInt.next().value);
console.log(randomInt.next().value);
console.log(randomInt.next().value);
