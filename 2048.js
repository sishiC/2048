(function (window, document) {

  'use strict';

  // patch CustomEvent to allow constructor creation (IE/Chrome)
  if (typeof window.CustomEvent !== 'function') {

    window.CustomEvent = function (event, params) {

      params = params || { bubbles: false, cancelable: false, detail: undefined };

      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    };

    window.CustomEvent.prototype = window.Event.prototype;
  }

  document.addEventListener('touchstart', handleTouchStart, false);
  document.addEventListener('touchmove', handleTouchMove, false);
  document.addEventListener('touchend', handleTouchEnd, false);

  var xDown = null;
  var yDown = null;
  var xDiff = null;
  var yDiff = null;
  var timeDown = null;
  var startEl = null;

  function handleTouchEnd(e) {

    if (startEl !== e.target) return;

    var swipeThreshold = parseInt(getNearestAttribute(startEl, 'data-swipe-threshold', '20'), 10);
    var swipeUnit = getNearestAttribute(startEl, 'data-swipe-unit', 'px');
    var swipeTimeout = parseInt(getNearestAttribute(startEl, 'data-swipe-timeout', '500'), 10);
    var timeDiff = Date.now() - timeDown;
    var eventType = '';
    var changedTouches = e.changedTouches || e.touches || [];

    if (swipeUnit === 'vh') {
      swipeThreshold = Math.round((swipeThreshold / 100) * document.documentElement.clientHeight);
    }
    if (swipeUnit === 'vw') {
      swipeThreshold = Math.round((swipeThreshold / 100) * document.documentElement.clientWidth);
    }

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if (Math.abs(xDiff) > swipeThreshold && timeDiff < swipeTimeout) {
        if (xDiff > 0) {
          eventType = 'swiped-left';
        }
        else {
          eventType = 'swiped-right';
        }
      }
    }
    else if (Math.abs(yDiff) > swipeThreshold && timeDiff < swipeTimeout) {
      if (yDiff > 0) {
        eventType = 'swiped-up';
      }
      else {
        eventType = 'swiped-down';
      }
    }

    if (eventType !== '') {

      var eventData = {
        dir: eventType.replace(/swiped-/, ''),
        touchType: (changedTouches[0] || {}).touchType || 'direct',
        xStart: parseInt(xDown, 10),
        xEnd: parseInt((changedTouches[0] || {}).clientX || -1, 10),
        yStart: parseInt(yDown, 10),
        yEnd: parseInt((changedTouches[0] || {}).clientY || -1, 10)
      };

      startEl.dispatchEvent(new CustomEvent('swiped', { bubbles: true, cancelable: true, detail: eventData }));

      startEl.dispatchEvent(new CustomEvent(eventType, { bubbles: true, cancelable: true, detail: eventData }));
    }

    xDown = null;
    yDown = null;
    timeDown = null;
  }

  function handleTouchStart(e) {

    if (e.target.getAttribute('data-swipe-ignore') === 'true') return;

    startEl = e.target;

    timeDown = Date.now();
    xDown = e.touches[0].clientX;
    yDown = e.touches[0].clientY;
    xDiff = 0;
    yDiff = 0;
  }

  function handleTouchMove(e) {

    if (!xDown || !yDown) return;

    var xUp = e.touches[0].clientX;
    var yUp = e.touches[0].clientY;

    xDiff = xDown - xUp;
    yDiff = yDown - yUp;
  }

  function getNearestAttribute(el, attributeName, defaultValue) {

    while (el && el !== document.documentElement) {

      var attributeValue = el.getAttribute(attributeName);

      if (attributeValue) {
        return attributeValue;
      }

      el = el.parentNode;
    }

    return defaultValue;
  }

}(window, document));


var board;
var score = 0;
var rows = 4;
var columns = 4;

window.onload = function () {
  setGame();
}

function setGame() {
  board = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ]

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      let tile = document.createElement("div");
      tile.id = r.toString() + "-" + c.toString();
      let num = board[r][c];
      updateTile(tile, num);
      document.getElementById("board").append(tile);
    }
  }
  setTwo();
  setTwo();
}

function updateTile(tile, num) {
  tile.innerText = "";
  tile.classList.value = "";
  tile.classList.add("tile");
  if (num > 0) {
    tile.innerText = num.toString();
    if (num <= 4096) {
      tile.classList.add("x" + num.toString());
    } else {
      tile.classList.add("x8192");
    }
  }
}

document.addEventListener('swiped-left', function (e) {
  slideLeft();
  setTwo();
  document.getElementById("score").innerText = score;
});
document.addEventListener('swiped-right', function (e) {
  slideRight();
  setTwo();
  document.getElementById("score").innerText = score;
});
document.addEventListener('swiped-up', function (e) {
  slideUp();
  setTwo();
  document.getElementById("score").innerText = score;
});
document.addEventListener('swiped-down', function (e) {
  slideDown();
  setTwo();
  document.getElementById("score").innerText = score;
});

document.addEventListener('keyup', (e) => {
  if (e.code == "ArrowLeft") {
    slideLeft();
    setTwo();
  }
  else if (e.code == "ArrowRight") {
    slideRight();
    setTwo();
  }
  else if (e.code == "ArrowUp") {
    slideUp();
    setTwo();
  }
  else if (e.code == "ArrowDown") {
    slideDown();
    setTwo();
  }
  document.getElementById("score").innerText = score;
})

function filterZero(row) {
  return row.filter(num => num != 0);
}

function slide(row) {
  row = filterZero(row);
  for (let i = 0; i < row.length - 1; i++) {
    if (row[i] == row[i + 1]) {
      row[i] *= 2;
      row[i + 1] = 0;
      score += row[i];
    }
  }
  row = filterZero(row);
  while (row.length < columns) {
    row.push(0);
  }
  return row;
}

function slideLeft() {
  for (let r = 0; r < rows; r++) {
    let row = board[r];
    row = slide(row);
    board[r] = row;
    for (let c = 0; c < columns; c++) {
      let tile = document.getElementById(r.toString() + "-" + c.toString());
      let num = board[r][c];
      updateTile(tile, num);
    }
  }
}

function slideRight() {
  for (let r = 0; r < rows; r++) {
    let row = board[r];
    row.reverse();
    row = slide(row);
    board[r] = row.reverse();
    for (let c = 0; c < columns; c++) {
      let tile = document.getElementById(r.toString() + "-" + c.toString());
      let num = board[r][c];
      updateTile(tile, num);
    }
  }
}

function slideUp() {
  for (let c = 0; c < columns; c++) {
    let row = [board[0][c], board[1][c], board[2][c], board[3][c]];
    row = slide(row);
    for (let r = 0; r < rows; r++) {
      board[r][c] = row[r];
      let tile = document.getElementById(r.toString() + "-" + c.toString());
      let num = board[r][c];
      updateTile(tile, num);
    }
  }
}

function slideDown() {
  for (let c = 0; c < columns; c++) {
    let row = [board[0][c], board[1][c], board[2][c], board[3][c]];
    row.reverse();
    row = slide(row);
    row.reverse();
    for (let r = 0; r < rows; r++) {
      board[r][c] = row[r];
      let tile = document.getElementById(r.toString() + "-" + c.toString());
      let num = board[r][c];
      updateTile(tile, num);
    }
  }
}

function setTwo() {
  if (!hasEmptyTile()) {
    return;
  }
  let found = false;
  while (!found) {
    let r = Math.floor(Math.random() * rows);
    let c = Math.floor(Math.random() * columns);
    if (board[r][c] == 0) {
      board[r][c] = 2;
      let tile = document.getElementById(r.toString() + "-" + c.toString());
      tile.innerText = "2";
      tile.classList.add("x2");
      found = true;
    }
  }
}

function hasEmptyTile() {
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      if (board[r][c] == 0) {
        return true;
      }
    }
  }
  return false;
}
