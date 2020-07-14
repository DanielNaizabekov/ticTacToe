document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.container');
  const winLines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],

    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],

    [0, 4, 8],
    [2, 4, 6],
  ];
  const crossIcon = `
    <svg class="cell-icon cross-icon" viewBox="0 0 128 128">
      <path class="cell-icon-path" d="M16,16L112,112"></path>
      <path class="cell-icon-path" d="M112,16L16,112"></path>
    </svg>
  `;
  const zeroIcon = `
    <svg class="cell-icon zero-icon" viewBox="0 0 128 128">
      <path class="cell-icon-path" d="M64,16A48,48 0 1,0 64,112A48,48 0 1,0 64,16"></path>
    </svg>
  `;
  const CROSS = 'X';
  const ZERO = '0';

  const game = {
    cells: Array(9).fill(''),
    userSymbol: '',
    compSymbol: '',
    crossScore: 0,
    zeroScore: 0,
    players: '',
    currentSymbol: CROSS,
    getRowCells(row, rowIndex) {
      let template = row.map((_, cellIndex) => 
        `<td class="cell" data-index="${rowIndex * 3 + cellIndex}"></td>`
      );
      return template.join(' ');
    },
    drawCells() {
      let cells = [...this.cells];
      const rows = Array(3).fill().map(() => cells.splice(0, 3));

      let template = rows.map((row, rowIndex) => `<tr>${this.getRowCells(row, rowIndex)}</tr>`);
      container.innerHTML = template.join(' ');
    },
    getCellsByCellIndexes(cellIndexes) {
      return this.cells.filter((_, cellIndex) => cellIndexes.includes(cellIndex));
    },
    countSameCellsInLine(line, symbol) {
      return line.reduce((count, cell) => this.cells[cell] === symbol ? ++count : count, 0);
    },
    findWinCell(symbol) {
      let winLine = winLines.find(line => {
        const hasAvailableCell = this.getCellsByCellIndexes(line).find(cell => !cell) === '';
        if(!hasAvailableCell) return false;

        const sameCellsInLine = this.countSameCellsInLine(line, symbol);
        return sameCellsInLine >= 2;
      });

      if(!winLine) return winLine;
      return this.cells.findIndex((cell, index) => winLine.includes(index) && !cell);
    },
    findAvailableCellIndexes() {
      const cellIndexes = this.cells.map((cell, index) => !cell ? index : undefined);
      return cellIndexes.filter(cellIndex => !isNaN(cellIndex));
    },
    getCellWeight(cellIndex) {
      const cellWinLines = winLines.filter(line => line.includes(cellIndex));

      return cellWinLines.reduce((weight, line) => {
        const lineCells = this.getCellsByCellIndexes(line);
        if(lineCells.includes(this.userSymbol)) return weight;

        const sameCellsInLine = this.countSameCellsInLine(line, this.compSymbol);
        return weight += (sameCellsInLine >= 2 ? 5 : sameCellsInLine) + 1;
      }, 0);
    },
    findProfitableCell() {
      const availableCellIndexes = this.findAvailableCellIndexes();

      const cellsInfo = availableCellIndexes.map(cellIndex => ({
        weight: this.getCellWeight(cellIndex),
        cellIndex,
      }));

      const maxWeight = Math.max(...cellsInfo.map(cell => cell.weight));
      return cellsInfo.find(cell => maxWeight === cell.weight).cellIndex;
    },
    restart() {
      this.cells = Array(9).fill('');
      this.drawCells();
      printScore();
      gameContainer.style.pointerEvents = 'auto';
      if(this.userSymbol === ZERO) this.drawCell(this.findProfitableCell(), CROSS);
    },
    checkWinner() {
      const winLine = winLines.find(line => {
        const hasAvailableCell = this.getCellsByCellIndexes(line).find(cell => !cell) === '';
        if(hasAvailableCell) return false;

        const crossInLine = this.countSameCellsInLine(line, CROSS);
        const zeroInLine = this.countSameCellsInLine(line, ZERO);
        return crossInLine >= 3 || zeroInLine >= 3;
      });

      return winLine || this.cells.find(cell => !cell) !== '';
    },
    finish() {
      const winnedLine = this.checkWinner();
      gameContainer.style.pointerEvents = 'none';
      if(!Array.isArray(winnedLine)) return setTimeout(() => openFinishModal('draw'), 400);
      const winnedSymbol = this.cells.find((_, index) => winnedLine[0] === index);
      winnedSymbol === CROSS ? this.crossScore++ : this.zeroScore++;

      markWinnedLine(winnedLine, winnedSymbol);
      setTimeout(() => openFinishModal(winnedSymbol), 1200);
    },
    reset() {
      this.cells = Array(9).fill('');
      this.userSymbol = '';
      this.compSymbol = '';
      this.crossScore = 0;
      this.zeroScore = 0;
      gameContainer.style.pointerEvents = 'auto';
      this.drawCells();
    },
    drawCell(cellIndex, symbol) {
      this.cells[cellIndex] = symbol;

      const cell = document.querySelector(`[data-index="${cellIndex}"]`)
      cell.innerHTML = symbol === CROSS ? crossIcon : zeroIcon;
      cell.classList.add('disabled');
    },
    start(userSymbol) {
      this.userSymbol = userSymbol;
      this.compSymbol = this.userSymbol === CROSS ? ZERO : CROSS;

      this.drawCells();
      if(userSymbol === ZERO) this.drawCell(this.findProfitableCell(), CROSS);
    },
  };


  // =================================== Modal handlers
  const modalOverlay = document.querySelectorAll('.overlay');
  const modalCloseBtn = document.querySelectorAll('.modal-close-btn');
  const modalContent = document.querySelectorAll('.modal');

  for(let i = 0; i < modalOverlay.length; i++) {
    modalOverlay[i].addEventListener('click', function() {
      DLAnimate.hide(this, {name: 'modal'});
    });
    modalCloseBtn[i].addEventListener('click', function() {
      DLAnimate.hide(this.parentElement.parentElement.parentElement, {name: 'modal'});
    });
    modalContent[i].addEventListener('click', event => event.stopPropagation());
  }
  // ===================================


  const symbolBtns = document.querySelectorAll('.symbol-btn');
  const header = document.querySelector('.header');
  const gameContainer = document.querySelector('.game');
  const footer = document.querySelector('.footer');
  const finishModal = document.querySelector('.finish-modal-overlay');
  const result = document.querySelector('.result');
  const finishBtn = document.querySelector('.finish-btn');
  const finishModalCLoseBtn = document.querySelector('.finish-modal-overlay .modal-close-btn');
  const hint = document.querySelector('#hint');
  const resetBtn = document.querySelector('.reset-btn');
  const playerBtns = document.querySelectorAll('.player-btn');
  const playerBtnsWrapper = document.querySelector('.player-btns-wrapper');
  const symbolBtnsWrapper = document.querySelector('.symbol-btns-wrapper');
  const btns = document.querySelectorAll('.btn');

  btns.forEach(btn => {
    btn.addEventListener('transitionend', event => event.stopPropagation());
  });

  function playerBtnHandler() {
    game.players = this.dataset.player;
    hint.innerHTML = 'Выберите символ';

    if(game.players === '2') {
      symbolBtns.forEach(btn => btn.classList.add('disabled'));
      printScore();
      
      game.drawCells();
      header.classList.add('started');
      gameContainer.classList.add('started');
      footer.classList.add('started');
    }
    
    DLAnimate.hide(playerBtnsWrapper, {name: 'player-btns-wrapper'});
    DLAnimate.show(symbolBtnsWrapper, {
      name: 'symbol-btns-wrapper',
      beforeEnter: () => symbolBtnsWrapper.style.display = 'flex',
      afterEnter: () => {
        symbolBtnsWrapper.style.position = 'static';
        symbolBtnsWrapper.style.transform = 'translate(0px, 0px)';
      },
    });
  };
  playerBtns.forEach(btn => {
    btn.addEventListener('click', playerBtnHandler);
  });

  function markWinnedLine(winnedLine, winnedSymbol) {
    const cells = document.querySelectorAll('.cell');
    const winnedClass = winnedSymbol === game.userSymbol ? 'winned-user' : 'winned-comp';
    winnedLine.forEach(cell => cells[cell].classList.add(winnedClass));
  };

  resetBtn.addEventListener('click', () => {
    symbolBtns.forEach(btn => btn.classList.remove('disabled'));
    hint.innerHTML = 'Выберите количество игроков';

    DLAnimate.show(playerBtnsWrapper, {name: 'player-btns-wrapper'});
    DLAnimate.hide(symbolBtnsWrapper, {
      name: 'symbol-btns-wrapper',
      beforeLeave: () => {
        symbolBtnsWrapper.style.position = 'absolute';
        symbolBtnsWrapper.style.transform = 'translate(-50%, 0)';
      },
    });

    header.classList.remove('started');
    gameContainer.classList.remove('started');
    footer.classList.remove('started');
    game.reset();
  });

  function printScore() {
    hint.innerHTML = `<div>${game.crossScore} - ${game.zeroScore}</div>`;
  };

  function symbolBtnHandler() {
    symbolBtns.forEach(btn => btn.classList.add('disabled'));
    printScore();

    game.start(this.dataset.symbol)
    header.classList.add('started');
    gameContainer.classList.add('started');
    footer.classList.add('started');
  };
  symbolBtns.forEach(btn => {
    btn.addEventListener('click', symbolBtnHandler);
  });

  finishBtn.addEventListener('click', function() {
    game.restart();
    DLAnimate.hide(finishModal, {name: 'modal'});
  });
  finishModal.addEventListener('click', () => game.restart());
  finishModalCLoseBtn.addEventListener('click', () => game.restart());
  
  function openFinishModal(winner) {
    const crossIcon = `
      <svg class="finish-icon" viewBox="0 0 128 128">
        <path class="finish-icon-path" d="M16,16L112,112"></path>
        <path class="finish-icon-path" d="M112,16L16,112"></path>
      </svg>
    `;
    const zeroIcon = `
      <svg class="finish-icon" viewBox="0 0 128 128">
        <path class="finish-icon-path" d="M64,16A48,48 0 1,0 64,112A48,48 0 1,0 64,16"></path>
      </svg>
    `;
    result.innerHTML = winner === 'draw' ? crossIcon + zeroIcon : winner === CROSS ? crossIcon : zeroIcon;

    DLAnimate.show(finishModal, {
      name: 'modal',
      beforeEnter: () => finishModal.style.display = 'flex',
    });
  };

  function startTwoPlayerGame(cellIndex) {
    game.drawCell(cellIndex, game.currentSymbol);
    if(game.checkWinner()) return game.finish();

    game.currentSymbol = game.currentSymbol === CROSS ? ZERO : CROSS;
  };
  container.addEventListener('click', function(event) {
    const isValidCell = event.target.className.includes && event.target.className.includes('cell') && !game.cells[event.target.dataset.index];
    if(!isValidCell) return;

    if(game.players === '2') return startTwoPlayerGame(event.target.dataset.index);

    const userSelectedCell = event.target.dataset.index;
    game.drawCell(userSelectedCell, game.userSymbol);
    if(game.checkWinner()) return game.finish();
    
    gameContainer.style.pointerEvents = 'none';
    const compSelectedCell = game.findWinCell(game.compSymbol) ?? game.findWinCell(game.userSymbol) ?? game.findProfitableCell();
    setTimeout(() => {
      game.drawCell(compSelectedCell, game.compSymbol);
      gameContainer.style.pointerEvents = 'auto';
      if(game.checkWinner()) return game.finish();
    }, 600)
  });
});