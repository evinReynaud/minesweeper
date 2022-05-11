function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function subsets(size, set) {
  if (size < 0 || size > set.length) return []
  if (size === set.length) return [set]

  const subsets = []

  const indexes = []
  // init indexes
  for (let i = 1; i <= size; i++) {
    indexes.push(size - i)
  }

  do {
    const subset = []
    indexes.forEach(i => subset.push(set[i]))
    subsets.push(subset)
  } while (incrementIndexes(indexes, set.length))

  return subsets
}

// max is exclusive
function incrementIndexes(indexes, max) {
  let currentIndex = 0
  let incrementedValue = 0

  while (currentIndex >= 0 && currentIndex < indexes.length) {
    if (!incrementedValue && indexes[currentIndex] < max - 1 - currentIndex) {
      indexes[currentIndex] += 1
      incrementedValue = indexes[currentIndex] + 1
    } else if (incrementedValue) {
      indexes[currentIndex] = incrementedValue++
    }
    currentIndex += incrementedValue ? -1 : 1
  }
  return incrementedValue !== 0
}
