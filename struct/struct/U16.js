export const U16 = {
  get byteLength() {
    return 2;
  },
  get alignment() {
    return 2;
  },
  init(buffer, offset) {
    return {
      get() {
        return new Uint16Array(buffer, offset, 1)[0];
      },
      set(value) {
        new Uint16Array(buffer, offset, 1)[0] = value;
      },
    };
  },
};
