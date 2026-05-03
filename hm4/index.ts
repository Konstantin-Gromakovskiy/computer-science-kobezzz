const cyclicLeftShift = (num: number, shift: number) => {
  if (shift === 0) return num;
  const normalize = num >>> 0;
  const tmp = normalize >>> (32 - shift);
  const result = (normalize << shift) | tmp;
  return result;
};

const exempleNum = 3625209826;

const cyclicRightShift = (num: number, shift: number) => {
  if (shift === 0) return num;
  const normalize = num >>> 0;
  const result = (normalize >>> shift) | ((normalize << (32 - shift)) >>> 0);
  return result;
};
