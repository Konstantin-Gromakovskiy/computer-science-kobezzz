const take = function <T>(obj: Iterable<T>, count: number) {
  const iter = Iterator.from(obj)
  return iter.take(count)
}
