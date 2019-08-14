(function () {
  'use strict';

  var minWidth = 260;
  var noOfColumns = 0;

  var $$ = function $$(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  };

  $$('.innerCell').forEach(function (el) {
    return el.onclick = function () {
      return el.classList.toggle('active');
    };
  });
  var rootElement = document.querySelector('#divThreads');
  var cellElements = $$('.catalogCell');

  function debounce(func, wait) {
    var timeout;
    return function () {
      var context = this,
          args = arguments;

      var later = function later() {
        timeout = null;
        func.apply(context, args);
      };

      var callNow = !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }
  onresize = debounce(function (e) {
    // only layout when the number of columns has changed
    var newNoOfColumns = parseInt(innerWidth / minWidth);
    if (newNoOfColumns > 7) newNoOfColumns = 7;
    if (e instanceof Event && newNoOfColumns === noOfColumns) return;
    rootElement.className = 'col' + newNoOfColumns;
    noOfColumns = newNoOfColumns;
    cellElements.forEach(function (cell) {
      return cell.style.flexBasis = 'auto';
    });
    var columns = Array(noOfColumns);

    for (var i = 0; i < noOfColumns; i++) {
      columns[i] = {
        cells: [],
        outerHeight: 0
      };
    }

    cellElements.forEach(function (cell) {
      var minOuterHeight = Math.min.apply(Math, columns.map(function (column) {
        return column.outerHeight;
      }));
      var column = columns.find(function (column) {
        return column.outerHeight === minOuterHeight;
      });
      column.cells.push(cell);
      column.outerHeight += cell.offsetHeight;
    }); // calculate masonry height

    var masonryHeight = Math.max.apply(Math, columns.map(function (column) {
      return column.outerHeight;
    })); // ...and conquer

    var order = 0;

    for (var _i = 0, _columns = columns; _i < _columns.length; _i++) {
      var column = _columns[_i];

      for (var _iterator = column.cells, _isArray = Array.isArray(_iterator), _i2 = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i2 >= _iterator.length) break;
          _ref = _iterator[_i2++];
        } else {
          _i2 = _iterator.next();
          if (_i2.done) break;
          _ref = _i2.value;
        }

        var cell = _ref;
        cell.style.order = order++;
      }

      var lastCell = column.cells[column.cells.length - 1]; // set flex-basis of the last cell to fill the
      // leftover space at the bottom of the column
      // to prevent the first cell of the next column
      // to be rendered at the bottom of this column

      if (lastCell) {
        lastCell.style.flexBasis = lastCell.offsetHeight + masonryHeight - column.outerHeight - 1 + 'px';
      }
    } // set the masonry height to trigger
    // re-rendering of all cells over columns
    // one pixel more than the tallest column


    rootElement.style.maxHeight = masonryHeight + 1 + 'px';
  });
  var content = $$('.content').map(function (cell) {
    return cell.innerText;
  });

  document.querySelector('input').oninput = function () {
    var term = this.value;
    content.forEach(function (text, index) {
      cellElements[index].style.display = text.indexOf(term) === -1 ? 'none' : 'block';
    });
    onresize();
  };

  onload = onresize;

}());
