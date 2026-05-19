export const FixedAsciiString = (maxLength) => {
  return {
    get byteLength() {
      return maxLength;
    },
    init(buffer, offset) {
      const arr = new Uint8Array(buffer, offset);

      return {
        get() {
          let str = "";
          for (const char of arr) {
            if (char === 0) break;
            str += String.fromCharCode(char);
          }
          return str;
        },

        set(str) {
          for (let i = 0; i < maxLength.length; i++) {
            arr[i] = i >= str.length ? 0 : str.charCodeAt(i);
          }
        },
      };
    },
  };
};
