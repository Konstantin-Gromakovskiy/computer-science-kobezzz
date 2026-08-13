import { ParserIterator } from "./ParserIterator.mjs";

export function tag(tag: Iterable<string | RegExp> | RegExp) {
  const pattern = tag instanceof RegExp ? [ tag ] : tag
  
  return (iter: ParserIterator) => {
    let result = ''
    for ( const test of Iterator.from(pattern).flatMap(flat).map(creatTest) ) {
      const char = iter.peek()
      if (char == null || !test(char)) {
        throw new Error(`Expected pattern "${ pattern }" at position ${ iter.position } but found "${ char }"`)
      }
      result += char
      iter.next()
    }
    
    return [ result, iter ]
  }
}

const flat = (value: string | RegExp): IterableIterator<string | RegExp> => {
  return typeof value === "string"
    ? value[Symbol.iterator]()
    : [ value ][Symbol.iterator]()
}

function creatTest(value: string | RegExp) {
  return typeof value === 'string' ? (char: string) => char === value
    : (char: string) => value.test(char)
}

const demo = tag([ "#", /\d/, /\d/ ])
const demo2 = tag([ /\s/, "foo" ])

console.log(demo2(demo(new ParserIterator("#12 foo bar"))[1]))
