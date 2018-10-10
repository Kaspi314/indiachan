var selectThemeEl = document.querySelector('#selectTheme');
function setTheme(value) {
  if (!value) {
    value = localStorage.SITE_THEME || 'yotsuba';
  }
  document.documentElement.className = 'theme-' + value;
  selectThemeEl.value = value;
}
selectThemeEl.onchange = function() {
  setTheme(this.value);
  localStorage.SITE_THEME = this.value;
}
setTheme();

var mimeExts = {
  'imagepng': '.png',
  'imagejpeg': '.jpg',
  'imagegif': '.gif',
  'imagebmp': '.bmp'
}

addEventListener('error', function(e) {
  if (e.target instanceof Image) {
    var match = e.target.src.replace(/\w+$/, function(match) {
      if (mimeExts[match]) {
        e.target.src += mimeExts[match];
      }
    })
  }
}, true)
