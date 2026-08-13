export class ParserIterator {
  readonly input: string
  #position = 0
  
  get position() {
    return this.#position
  }
  
  constructor(input: string, position = 0) {
    this.input = input
    this.changePosition(position)
    
  }
  
  changePosition(position: number) {
    this.#position = position
  }
  
  [Symbol.iterator]() {
    return this
  }
  
  peek() {
    return this.#getChar(this.position)
  }
  
  clone() {
    return new ParserIterator(this.input, this.position)
  }
  
  next() {
    const value = this.#getChar(this.position)
    if (value === undefined) {
      return { done: true, value: undefined }
    }
    
    this.#position += value.length
    return { done: false, value }
    
  }
  
  
  #getChar(position: number): string | undefined {
    const str = this.input
    const code = str.charCodeAt(position)
    if (code >= 0xD800 && code <= 0xDBFF && position + 1 < str.length) {
      const next = str.charCodeAt(position + 1)
      
      if (next >= 0xDC00 && next <= 0xDFFF) {
        return str.slice(position, position + 2)
      }
    }
    return str[position]
  }
  
  
}

