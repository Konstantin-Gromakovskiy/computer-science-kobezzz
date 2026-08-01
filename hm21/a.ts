const zipStr = (str: string): string => {
  return str.replaceAll(/(.)\1+/g, "$1");
};

console.log(zipStr("aaabbbcc")); // Output: "abc"
