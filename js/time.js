import { render } from 'timeago.js';

export default function updateTime() {
  const allDates = document.querySelectorAll('.labelCreated:not([datetime])');
  Array.prototype.forEach.call(allDates, el => {
    const postDate = new Date(el.innerText);
    const newTime = new Date(postDate.getTime() - postDate.getTimezoneOffset() * 60 * 1000);
    el.title = newTime.toString();
    el.setAttribute('datetime', newTime.toISOString());
  })
  render(allDates);
}

updateTime();