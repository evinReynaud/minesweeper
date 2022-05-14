document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('.grid')
  const flagsLeft = document.querySelector('#flags-left')
  const result = document.querySelector('#result')
  const width = 10
  const height = 10
  const bombAmount = 20
  let flags = 0
  let squares = []
  let isGameOver = false

  //create Board
  function createBoard() {
    flagsLeft.innerHTML = bombAmount

    //get shuffled game array with random bombs
    const bombsArray = Array(bombAmount).fill('bomb')
    const emptyArray = Array(width * height - bombAmount).fill('valid')
    const gameArray = emptyArray.concat(bombsArray)
    const shuffledArray = shuffle(gameArray)

    for (let i = 0; i < width * height; i++) {
      const square = document.createElement('div')
      square.setAttribute('id', i)
      square.classList.add(shuffledArray[i])
      grid.appendChild(square)
      squares.push(square)

      //normal click
      square.addEventListener('click', function (_) {
        click(square)
      })

      //cntrl and left click
      square.oncontextmenu = function (e) {
        e.preventDefault()
        addFlag(square)
      }
    }
  }

  createBoard()

  function getAdjacentBombs(i) {
    return getAdjacentType(i, 'bomb')
  }

  //add Flag with right click
  function addFlag(square) {
    if (isGameOver) return
    if (!square.classList.contains('checked') && (flags < bombAmount)) {
      if (!square.classList.contains('flag')) {
        square.classList.add('flag')
        square.innerHTML = ' 🚩'
        flags++
        flagsLeft.innerHTML = bombAmount - flags
        checkForWin()
      } else {
        square.classList.remove('flag')
        square.innerHTML = ''
        flags--
        flagsLeft.innerHTML = bombAmount - flags
      }
    }
  }

  //click on square actions
  function click(square) {
    if (isGameOver) return
    if (square.classList.contains('checked') || square.classList.contains('flag')) return
    if (square.classList.contains('bomb')) {
      tryAndSaveGame(square)
    } else {
      const currentId = parseInt(square.id)
      const total = getAdjacentBombs(currentId)
      square.classList.add('checked')
      if (total !== 0) {
        if (total === 1) square.classList.add('one')
        if (total === 2) square.classList.add('two')
        if (total === 3) square.classList.add('three')
        if (total === 4) square.classList.add('four')
        square.innerHTML = total
      } else {
        checkSquares(square, currentId)
      }
    }
  }

  //check neighboring squares once square is clicked
  function checkSquares(square, currentId) {
    setTimeout(() => {
      applyToNeighbors(currentId, (i) => {
        const newId = squares[i].id
        const newSquare = document.getElementById(newId)
        click(newSquare)
      })
    }, 10)
  }

  //game over
  function gameOver(_) {
    result.innerHTML = 'BOOM! Game Over!'
    isGameOver = true

    //show ALL the bombs
    squares.forEach(square => {
      if (square.classList.contains('bomb')) {
        square.innerHTML = '💣'
        square.classList.remove('bomb')
        square.classList.add('checked')
      }
    })
  }

  //check for win
  function checkForWin() {
    ///simplified win argument
    let matches = 0

    for (let i = 0; i < squares.length; i++) {
      if (squares[i].classList.contains('flag') && squares[i].classList.contains('bomb')) {
        matches++
      }
      if (matches === bombAmount) {
        result.innerHTML = 'YOU WIN!'
        isGameOver = true
      }
    }
  }

  function getAdjacentType(i, type) {
    let total = 0
    applyToNeighbors(i, (j) => {
      if (squares[j].classList.contains(type)) total++
    })
    return total
  }

  function applyToNeighbors(i, f) {
    const isLeftEdge = (i % width === 0)
    const isRightEdge = (i % width === width - 1)

    if (i > 0 && !isLeftEdge) f(i - 1)
    if (i > width - 1 && !isRightEdge) f(i + 1 - width)
    if (i > width - 1) f(i - width)
    if (i > width && !isLeftEdge) f(i - 1 - width)
    if (i < width * height - 1 && !isRightEdge) f(i + 1)
    if (i < width * (height - 1) && !isLeftEdge) f(i - 1 + width)
    if (i < width * (height - 1) && !isRightEdge) f(i + 1 + width)
    if (i < width * (height - 1)) f(i + width)
  }

  // More robust shuffle
  function shuffle(array) {
    let currentIndex = array.length
    while (currentIndex !== 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  //////////////////////////
  // Try and save feature //
  //////////////////////////

  function tryAndSaveGame(square) {
    const shuffled = shuffleBoard(square)
    if (!shuffled) {
      gameOver(square)
    } else {
      click(square)
    }
  }

  function shuffleBoard(square) {
    const sat = new SATInstance()

    const uncheckedSquares = []
    const currentBombs = [] // actually current bombs WITHOUT clues pointing to them
    const clauses = boardToClauses(uncheckedSquares, currentBombs)

    // remove clicked bomb from the list
    const currentId = parseInt(square.id)
    currentBombs.splice(currentBombs.findIndex(v => v === currentId), 1)

    clauses.forEach(clause => {
      sat.parseClause(clause)
    })

    const partialSolution = sat.createSolution()
    partialSolution.set(square.id, false) // Forces square to not have a bomb

    const satSolutions = sat.solutions(partialSolution)

    const actualSolutions = satSolutions.map(solution => parseSolution(solution).sort())
      .filter(solution => solution.length <= bombAmount)

    if (actualSolutions.length > 0) {
      const solution = selectAndCompleteSolution(actualSolutions, uncheckedSquares, currentBombs)
      setBoardToConfiguration(solution)
      return true
    }
    return false
  }

  function boardToClauses(uncheckedSquares, currentBombs) {
    return squares.flatMap(square => squareToClauses(square, uncheckedSquares, currentBombs))
      .filter(c => c)
  }

  function squareToClauses(square, uncheckedSquares, currentBombs) {
    const currentId = parseInt(square.id)
    if (!square.classList.contains('checked')) {
      // return [square.id + ' ~' + square.id] // replaced with unchecked square for optimization
      if (getAdjacentClues(currentId) === 0) {
        if (square.classList.contains('bomb')) {
          currentBombs.push(parseInt(square.id))
        } else {
          uncheckedSquares.push(square.id)
        }
      }
      return []
    }
    let bombs = 0
    let cells = []
    applyToNeighbors(currentId, (j) => {
      if (!squares[j].classList.contains('checked')) cells.push(j)
      if (squares[j].classList.contains('bomb')) bombs++
    })

    return getClausesForBombsInCells(bombs, cells)
  }

  function getAdjacentClues(i) {
    return getAdjacentType(i, 'checked')
  }

  function getClausesForBombsInCells(nbBombs, cells) {
    if (nbBombs === 0) return []
    return getPositiveDisjunctions(nbBombs, cells).concat(getNegativeDisjunctions(nbBombs, cells))
  }

  function getPositiveDisjunctions(nbBombs, cells) {
    return subsets(cells.length - nbBombs + 1, cells)
      .map(subset => subset.join(' '))
  }

  function getNegativeDisjunctions(nbBombs, cells) {
    return subsets(nbBombs + 1, cells)
      .map(subset => subset
        .map(v => '~' + v)
        .join(' '))
  }

  function parseSolution(satSolution) {
    return satSolution.split(', ').filter(v => !v.startsWith('~') && v !== "")
      .map(v => parseInt(v))
  }

  function selectAndCompleteSolution(solutions, uncheckedSquares, currentBombs) {
    const chosenSolution = selectSolution(solutions, currentBombs)
    return completeSolution(chosenSolution, uncheckedSquares, currentBombs)
  }

  function selectSolution(solutions, currentBombs) {
    const weightedSolutions = solutions.map(solution => ({
      solution: solution,
      weight: getNbCommonMines(solution, currentBombs)
    }))

    const maxWeight = weightedSolutions.reduce((maxWeight, ws) => Math.max(maxWeight, ws.weight), 0)

    // pre-select solutions that move as few mines as possible
    const maxWeightSolutions = weightedSolutions.filter(ws => ws.weight === maxWeight)

    return maxWeightSolutions[getRandomInt(maxWeightSolutions.length)].solution
  }

  // Increase solution to fit the required number of bombs
  function completeSolution(solution, uncheckedSquares, currentBombs) {
    const unusedBombs = currentBombs.filter(b => !solution.includes(b))
    while (solution.length < bombAmount && unusedBombs.length > 0) {
      solution.push(unusedBombs.splice(getRandomInt(unusedBombs.length), 1)[0])
    }

    const unselectedSquares = uncheckedSquares.filter(s => !solution.includes(s))
    while (solution.length < bombAmount) {
      solution.push(unselectedSquares.splice(getRandomInt(unselectedSquares.length), 1)[0])
    }

    return solution
  }

  function getNbCommonMines(solution, currentBombs) {
    return solution.reduce((total, id) => total + (currentBombs.includes(id) ? 1 : 0), 0)
  }

  function setBoardToConfiguration(solution) {
    squares.forEach(square => {
      square.classList.remove('bomb')
      square.classList.add('valid')
    })

    solution.forEach(index => {
      squares[index].classList.remove('valid')
      squares[index].classList.add('bomb')
    })
  }
})
