console.log("Массив без дырок ------------------------");

const clampedArray10 = new Array(10).fill(0);
const clampedArray100 = new Array(100).fill(0);
const clampedArray1000 = new Array(1000).fill(0);
const clampedArray10000 = new Array(10000).fill(0);
const clampedArray100000 = new Array(100000).fill(0);

const pushX100 = (arr: number[]) => {
  for (let i = 0; i < 100; i++) {
    arr.push(0);
  }
};

const popX100 = (arr: number[]) => {
  for (let i = 0; i < 100; i++) {
    arr.pop();
  }
};

const shiftX100 = (arr: number[]) => {
  for (let i = 0; i < 100; i++) {
    arr.shift();
  }
};

const unshiftX100 = (arr: number[]) => {
  for (let i = 0; i < 100; i++) {
    arr.unshift(0);
  }
};

console.log("warmup");
pushX100(clampedArray100000);
popX100(clampedArray100000);
shiftX100(clampedArray100000);
unshiftX100(clampedArray100000);

const measureTime = (
  fn: (arr: number[]) => void,
  arr: number[],
  label: string,
) => {
  const start = performance.now();
  fn(arr);
  const end = performance.now();
  console.log(`${label}: ${end - start} ms`);
};

measureTime(pushX100, clampedArray10, "pushX10 - 10");
measureTime(popX100, clampedArray10, "popX10 - 10");
measureTime(shiftX100, clampedArray10, "shiftX10 - 10");
measureTime(unshiftX100, clampedArray10, "unshiftX10 - 10");
console.log("\n");
measureTime(pushX100, clampedArray100, "pushX10 - 100");
measureTime(popX100, clampedArray100, "popX10 - 100");
measureTime(shiftX100, clampedArray100, "shiftX10 - 100");
measureTime(unshiftX100, clampedArray100, "unshiftX10 - 100");
console.log("\n");
measureTime(pushX100, clampedArray1000, "pushX10 - 1000");
measureTime(popX100, clampedArray1000, "popX10 - 1000");
measureTime(shiftX100, clampedArray1000, "shiftX10 - 1000");
measureTime(unshiftX100, clampedArray1000, "unshiftX10 - 1000");
console.log("\n");
measureTime(pushX100, clampedArray10000, "pushX10 - 10000");
measureTime(popX100, clampedArray10000, "popX10 - 10000");
measureTime(shiftX100, clampedArray10000, "shiftX10 - 10000");
measureTime(unshiftX100, clampedArray10000, "unshiftX10 - 10000");
console.log("\n");
measureTime(pushX100, clampedArray100000, "pushX10 - 100000");
measureTime(popX100, clampedArray100000, "popX10 - 100000");
measureTime(shiftX100, clampedArray100000, "shiftX10 - 100000");
measureTime(unshiftX100, clampedArray100000, "unshiftX10 - 100000");

console.log("\nМассив с дырками ------------------------\n");

const sparseArray10 = new Array(10);
const sparseArray100 = new Array(100);
const sparseArray1000 = new Array(1000);
const sparseArray10000 = new Array(10000);
const sparseArray100000 = new Array(100000);

measureTime(pushX100, sparseArray10, "pushX10 - 10");
measureTime(popX100, sparseArray10, "popX10 - 10");
measureTime(shiftX100, sparseArray10, "shiftX10 - 10");
measureTime(unshiftX100, sparseArray10, "unshiftX10 - 10");
console.log("\n");
measureTime(pushX100, sparseArray100, "pushX10 - 100");
measureTime(popX100, sparseArray100, "popX10 - 100");
measureTime(shiftX100, sparseArray100, "shiftX10 - 100");
measureTime(unshiftX100, sparseArray100, "unshiftX10 - 100");
console.log("\n");
measureTime(pushX100, sparseArray1000, "pushX10 - 1000");
measureTime(popX100, sparseArray1000, "popX10 - 1000");
measureTime(shiftX100, sparseArray1000, "shiftX10 - 1000");
measureTime(unshiftX100, sparseArray1000, "unshiftX10 - 1000");
console.log("\n");
measureTime(pushX100, sparseArray10000, "pushX10 - 10000");
measureTime(popX100, sparseArray10000, "popX10 - 10000");
measureTime(shiftX100, sparseArray10000, "shiftX10 - 10000");
measureTime(unshiftX100, sparseArray10000, "unshiftX10 - 10000");
console.log("\n");
measureTime(pushX100, sparseArray100000, "pushX10 - 100000");
measureTime(popX100, sparseArray100000, "popX10 - 100000");
measureTime(shiftX100, sparseArray100000, "shiftX10 - 100000");
measureTime(unshiftX100, sparseArray100000, "unshiftX10 - 100000");
