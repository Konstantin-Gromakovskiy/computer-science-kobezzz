import * as fs from "node:fs";
import * as readline from "node:readline";

function updatePeakMemory(peakHeapUsed: number) {
  const current = process.memoryUsage().heapUsed;

  if (current > peakHeapUsed) {
    peakHeapUsed = current;
  }
  return peakHeapUsed;
}

const parseCSV = (filePath: string) => {
  const timeStart = performance.now();
  let peakHeapUsedCSV = 0;

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
  });
  let firstLineRead = false;
  let firstLineReadTime = 0;

  rl.on("line", (line) => {
    line.split(",");
    if (!firstLineRead) {
      firstLineReadTime = performance.now();
      firstLineRead = true;
    }
    peakHeapUsedCSV = updatePeakMemory(peakHeapUsedCSV);
  });

  rl.on("close", () => {
    const timeEnd = performance.now();
    const time = timeEnd - timeStart;
    const firstLineReadTimeDiff = firstLineReadTime - timeStart;
    console.log("Время чтения первой строки: " + firstLineReadTimeDiff);
    console.log("Общее время", time);
    console.log("Пиковая память CSV", peakHeapUsedCSV);
  });
};

const readJSON = (filePath: string) => {
  let peakHeapUsedJSON = 0;
  const timeStart = performance.now();
  const data = fs.readFileSync(filePath, "utf-8");
  peakHeapUsedJSON = updatePeakMemory(peakHeapUsedJSON);
  const result = JSON.parse(data);
  peakHeapUsedJSON = updatePeakMemory(peakHeapUsedJSON);
  result.length;
  const timeEnd = performance.now();
  const time = timeEnd - timeStart;
  console.log("Общее время JSON", time);
  console.log("Пиковая память JSON", peakHeapUsedJSON);
};

const mode = process.argv[2];

if (mode === "csv") {
  parseCSV("./data.csv");
} else if (mode === "json") {
  readJSON("./data.json");
}
