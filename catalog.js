const $ = document.querySelector.bind(document);
const $$ = sel => Array.prototype.slice.call(document.querySelectorAll(sel));
const cells = $$('.catalogCell');
const totalCells = cells.length;

const allReplies = Array();
const allTimes = Array();
const allContent = cells.map((cell, index) => {
  allTimes[index] = allReplies[index] = [
    cell,
    parseInt(cell.querySelector('.labelReplies').innerText),
    new Date(cell.querySelector('.labelPage').innerText)
  ];
  return cell.querySelector('.content').innerText
});
allReplies.sort((a, b) => a[1] - b[1]);
allTimes.sort((a, b) => a[2] - b[2]);

cells.forEach(el => el.onclick = () => el.classList.toggle('active'));

$('input').oninput = function() {
  allContent.forEach((text, index) => {
    cells[index].style.display = text.indexOf(this.value) === -1 ? 'none' : 'block';
  })
}

$('#sortCatalog').onchange = function() {
  const sortOrder = this.value;
  if (sortOrder == 1) {
    cells.forEach(cell => cell.style.order = '');
  } else if (sortOrder == 2) {
    allReplies.forEach((cell, index) => cell[0].style.order = totalCells - index);
  } else if (sortOrder == 3) {
    allReplies.forEach((cell, index) => cell[0].style.order = index);
  } else if (sortOrder == 4) {
    allTimes.forEach((cell, index) => cell[0].style.order = totalCells - index);
  } else if (sortOrder == 5) {
    allTimes.forEach((cell, index) => cell[0].style.order = index);
  }
}
