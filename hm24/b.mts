const filter = <T>(obj: Iterable<T>, predicate: (item: T) => boolean) => {
  const iter = Iterator.from(obj)
  return iter.filter(predicate)
}
