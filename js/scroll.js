const scrollByFn = window.scrollBy;
const smoothScroll = 'scrollBehavior' in document.documentElement.style;

function scrollBy(y) {
  if (smoothScroll) {
    scrollByFn({
      left: 0,
      top: y,
      behavior: 'smooth'
    });
  } else {
    scrollByFn(0, y);
  }
}

export default function scroll(e) {
  let hash = location.hash.slice(1);
  if (hash) {
    let target = document.getElementById(hash);
    if (target) {
      scrollBy(target.getBoundingClientRect().top);
    }
  }
}