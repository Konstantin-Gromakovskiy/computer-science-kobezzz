export class Struct {
  constructor(scheme) {
    let totalLength = 0;
    this.scheme = new Map(
      Object.entries(scheme).flatMap(([key, type]) => {
        const alignment = this.#getAlignment(totalLength, type.alignment ?? 1);
        const res = [];
        if (alignment !== 0) {
          res.push([
            Symbol("Alignment"),
            {
              byteLength: alignment,
              init: () => ({ get: () => 0, set: (_) => {} }),
            },
          ]);

          totalLength += alignment;
        }

        res.push([
          key,
          {
            byteLength: type.byteLength,
            init: type.init.bind(type),
          },
        ]);

        totalLength += type.byteLength;

        return res;
      }),
    );
    this.byteLength = totalLength;
  }

  create(data, buffer = new ArrayBuffer(this.byteLength), offset = 0) {
    const view = new StructView(buffer, this.byteLength, offset);

    this.scheme.forEach((type, key) => {
      const { get, set } = type.init(buffer, offset);

      if (typeof key !== "symbol") {
        set(data[key]);

        Object.defineProperties(view, key, {
          get,
          set,
          enumerable: true,
          configurable: true,
        });
      }

      offset += type.byteLength;
    });

    return view;
  }

  from(buffer, offset = 0) {
    const view = new StructView(buffer, this.byteLength, offset);

    this.scheme.forEach((type, key) => {
      const currentOffset = offset;
      offset += type.byteLength;

      let accessors;

      if (typeof key !== "symbol") {
        Object.defineProperties(view, key, {
          get: () => init().get(),
          set: (value) => init().set(value),
          enumerable: true,
          configurable: true,
        });
      }

      function init() {
        if (accessors == null) {
          accessors = type.init(buffer, currentOffset);
        }
        return accessors;
      }
    });

    return view;
  }

  init(buffer, offset) {
    let view = this.from(buffer, offset);

    return {
      get: () => view,
      set: (data) => {
        view = this.create(data, buffer, offset);
      },
    };
  }

  #getAlignment(offset, size) {
    const remainder = offset % size;
    if (remainder === 0) return 0;

    return size - remainder;
  }
}

class StructView {
  #buffer;
  #byteLength;
  #byteOffset;

  get buffer() {
    return this.#buffer;
  }
  get byteLength() {
    return this.#byteLength;
  }
  get byteOffset() {
    this.#byteOffset;
  }

  constructor(buffer, byteLength, offset) {
    this.#buffer = buffer;
    this.#byteOffset = offset;
    this.#byteLength = byteLength;
  }
}
