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
    const shuffledArray = gameArray.sort(() => Math.random() - 0.5)

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

    //add numbers
    for (let i = 0; i < squares.length; i++) {
      addNumber(i)
    }
  }

  createBoard()

  function addNumber(i) {
    if (squares[i].classList.contains('valid')) {
      squares[i].setAttribute('data', getAdjacentBombs(i))
    }
  }

  function getAdjacentBombs(i) {
    let total = 0
    applyToNeighbors(i, (j) => {
      if (squares[j].classList.contains('bomb')) total++
    })
    return total
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
      gameOver(square)
    } else {
      const currentId = parseInt(square.id)
      const total = square.getAttribute('data')
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
})
