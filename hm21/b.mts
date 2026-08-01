const format = (str: string, params: Record<string, string | number>) =>
  str.replaceAll(/\${(\w+)}/g, (_, arg1): string => params[arg1].toString() || "");

console.log(format("Hello, ${user}! Your age is ${age}.", { user: "Bob", age: 10 }));
