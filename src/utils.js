export function empty2DArray(size, value) {
  return Array(size)
    .fill()
    .map((row) => new Array(size).fill(value));
}
