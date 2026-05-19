import { U8, U16, Struct, FixedAsciiString } from "./struct/index.js";

// export const Color = Tuple(U8, U8, U8);

export const Person = new Struct({
  age: U8,
  id: U16,
  firstName: FixedAsciiString(8),
  lastName: FixedAsciiString(8),
  // color: Color,
});

const persone = Person.create({
  age: 42,
  id: 531,
  firstName: "Bob",
  lastName: "Elton",
  color: [0xff, 0x00, 0x00],
});

// export const PersonArray = new TypedArray(Person, 16);
