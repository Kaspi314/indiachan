export default function xhr(url, method, data) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest()
    x.onreadystatechange = () => {
      if (x.readyState == 4) {
        x.status < 400 ? resolve(x) : reject(x.responseText);
      }
    }
    x.onerror = reject
    x.open(method, url, true)
    x.send(data || null)
  })
}

export function getRequest(url) {
  return xhr(url, 'get').then(x => x.responseText);
}

export function headRequest(url) {
  return xhr(url, 'head');
}

export function formRequest(el, data) {
  return xhr(el.action, el.method, data || new FormData(el));
}
