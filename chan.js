import updateTime from './js/time';
import scroll from './js/scroll';
import ajax, { getRequest, headRequest, formRequest } from './js/ajax';
import './js/polyfill';

const $ = document.querySelector.bind(document);
const slice = Array.prototype.slice;
const $$ = selector => slice.call(document.querySelectorAll(selector));
const createElement = el => document.createElement(el);
const isBoard = !!$('#board-page');
const getUrl = OP => `/${OP.dataset.boarduri}/res/${OP.id}.html`
const getErrorReason = data => {
  const label = fragment(data).querySelector('#errorLabel');
  return label && label.innerHTML;
}
const isCaptchaError = reason => reason && reason.indexOf('captcha') > 0;
const fragment = html => {
  const div = createElement('div');
  div.innerHTML = html;
  return div;
}
const getBoundingClientRect = el => el.getBoundingClientRect();

const preview = $('#preview')
const textarea = $('#postingForm textarea');
const remainingChars = () => $('#labelMessageLength').innerHTML = 4096 - textarea.value.length;
textarea.oninput = remainingChars;

const hideForm = () => $('#showForm').checked = false;
markPost();

$('#postingForm form').onsubmit = onsubmit;
$('#postingForm form > b').onclick = hideForm;
$$('.opCell').forEach(updateMentions);

function postHandlers(parent) {
  slice.call(parent.querySelectorAll('.linkQuote'))
    .forEach(el => {
      if (isBoard) {
        el.hash = el.hash.replace('q', '');
      } else {
        el.onclick = () => quickReply(el.hash.slice(2));
      }
    });

  slice.call(parent.querySelectorAll('.panelBacklinks a, .quoteLink'))
    .forEach(el => {
      el.onmouseover = showPreview
      el.onmouseout = hidePreview
      el.onclick = e => {
        if (el.pathname === location.pathname) {
          e.preventDefault();
          const isMobile = innerWidth < 800;
          if (isMobile && getBoundingClientRect(e.target).width - e.offsetX > 24) {
            showPreview.call(el);
          } else {
            hidePreview();
            if (isBoard) {
              return;
            } else {
              history.pushState(null, null, el.href);
              scroll();
              markPost();
            }
          }
        }
      }
    })

  slice.call(parent.querySelectorAll('.innerUpload'))
    .forEach(el => el.onclick = loadUpload)

  slice.call(parent.querySelectorAll('.divMessage'))
    .forEach(enrichMessage)

  if (isMod) {
    modHandlers(parent);
  }
}
postHandlers(divThreads)

function enrichMessage(el) {
  slice.call(el.querySelectorAll('a')).forEach(link => {
    const href = link.href;
    let newNode;
    href.replace(/^https:\/\/(\w+\.)?youtube.com\/watch\?v=([\w-]+)/, (match,prefix,id) => {
      newNode = createElement('iframe');
      newNode.width = 320;
      newNode.height = 180;
      newNode.allow = 'fullscreen';
      newNode.referrerpolicy = 'no-referrer';
      newNode.sandbox = 'allow-scripts allow-same-origin allow-presentation';
      newNode.src = 'https://www.youtube.com/embed/' + id;
    })
    insertAfter(link, newNode);
  })
}

function insertAfter(child, newChild) {
  newChild && child.parentNode.insertBefore(newChild, child.nextSibling);
}

function quickReply(quoteId) {
  // clear previous value if showing form
  // if (!$('#showForm').checked) textarea.value = '';
  $('#showForm').checked = true;
  textarea.focus();
  if (quoteId) location.hash = 'q' + quoteId;
  markPost();
}

$$('.labelOmission').forEach(el => el.onclick = async () => {
  if (el.classList.contains('loading')) return;

  const OP = el.closest('.opCell');
  const divPosts = OP.querySelector('.divPosts');

  if (el.classList.contains('loaded')) {
    divPosts.classList.toggle('compact');
    el.innerHTML = 'Show/Hide';
    updateMentions(OP);
  } else {
    el.classList.add('loading');
    const result = await getRequest(getUrl(OP));
    el.innerHTML = 'Showing all replies';
    el.classList.replace('loading', 'loaded');
    const newPosts = fragment(result).querySelector('.divPosts');
    OP.replaceChild(newPosts, divPosts);
    updateTime();
    updateMentions(OP);
    postHandlers(OP);
  }
  el.classList.toggle('open');
})

function updateMentions(OP) {
  const backLinks = {};

  const links = OP.querySelectorAll('.quoteLink');
  for (let i = 0; i < links.length; i++) {
    const el = links[i];
    const linkedId = el.hash.slice(1);
    const selfId = el.closest('[id]').id;
    if (!backLinks[linkedId]) backLinks[linkedId] = {};
    backLinks[linkedId][selfId] = 1;
  }

  for (let link in backLinks) {
    let html = '';
    for (let k in backLinks[link]) {
      html += `<a href="${getUrl(OP)}#${k}">>>${k}</a>`;
    }
    $$(`[id="${link}"] ${link === OP.id ? '.innerOP ' : ''}.panelBacklinks`).forEach(el => el.innerHTML = html);
  }

  if (!isBoard) {
    const IDs = {};
    const els = slice.call(OP.querySelectorAll('.labelId'));
    els.forEach(el => {
      const id = el.innerText;
      if (IDs[id]) {
        IDs[id]++;
      } else {
        IDs[id] = 1;
      }
      el.dataset.id = id;
      el.onclick = () => {
        $$(`.labelId:not([data-id="${id}"])`).forEach(el => el.closest('.innerPost').classList.toggle('fadedPost'))
      }
    })
    els.forEach(el => {
      const replies = IDs[el.innerText];
      el.dataset.count = replies;
      el.title = replies + ' posts by this user';
    })
  }
}

function markPost() {
  const hash = location.hash;
  if (hash) {
    const isLinkQuote = hash[1] === 'q';
    const hashValue = hash.slice(isLinkQuote ? 2 : 1);
    const alreadyMarked = $('.markedPost');
    if (alreadyMarked) alreadyMarked.classList.remove('markedPost');

    const newMarked = $(`[id="${hashValue}"]:not(.opCell) .innerPost`);
    if (newMarked) newMarked.classList.add('markedPost');

    if (isLinkQuote) {
      const value = textarea.value;
      let addition = '>>' + hashValue + '\n';
      if (!(value.indexOf(addition) === 0 || value.indexOf('\n' + addition) > 0)) {
        if (value && value[value.length - 1] !== '\n') {
          addition = '\n' + addition;
        }
        textarea.value += addition;
        remainingChars();
      }
    }
  } else {
    hideForm()
  }
}

function showPreview() {
  const bbox = getBoundingClientRect(this);
  const linkedId = this.hash.slice(1);
  let postCell = $(`[id="${linkedId}"]`);

  if (!postCell) return;
  if (postCell.classList.contains('opCell')) postCell = postCell.querySelector('.innerOP');

  const postRect = getBoundingClientRect(postCell);
  if (postRect.top > 0 && postRect.bottom < innerHeight) {
    postCell.querySelector('.innerPost').classList.add('highlight');
  } else {
    preview.innerHTML = postCell.innerHTML
    const style = preview.style
    style.display = 'block'
    style.left = bbox.right + 'px'
    style.top = (pageYOffset + bbox.bottom) + 'px'
  }
}

function hidePreview() {
  const hl = $('.highlight');
  if (hl) hl.classList.remove('highlight');
  preview.style.display = 'none'
}

function loadUpload(e) {
  e.preventDefault();
  const img = this;
  const imgClass = img.classList;
  const panelClass = img.closest('.panelUploads').classList;

  if (imgClass.contains('loaded')) {
    imgClass.toggle('expanded');
    panelClass.toggle('expanded');
  } else if (!imgClass.contains('loading')) {
    imgClass.add('loading');
    const imgLink = img.querySelector('.imgLink');
    const mimeId = imgLink.dataset.filemime.slice(0, 5);
    const src = imgLink.href;

    const toggle = toggleUpload(imgClass, panelClass);
    let embed;
    if (mimeId === 'image') {
      embed = createElement('img');
      embed.onload = toggle;
    } else {
      embed = createElement(mimeId);
      embed.autoplay = embed.controls = embed.muted = true;
      embed.onloadstart = toggle;
    }
    embed.className = 'origMedia';
    embed.src = src;
    img.insertBefore(embed, img.firstChild);
  }
}

function toggleUpload(imgClass, panelClass) {
  return () => {
    if (imgClass.contains('loading')) {
      panelClass.add('expanded');
      imgClass.replace('loading', 'loaded');
      imgClass.add('expanded');
    }
  }
}

const toggleBtn = btn => {
  btn.disabled = !btn.disabled;
  btn.classList.toggle('loading');
}

async function onsubmit(e) {
  e.preventDefault();
  const form = this;
  var button = form.querySelector('button');
  if (button.disabled) return;
  toggleBtn(button);

  try {
    const { responseText, responseURL } = await formRequest(form);
    if (responseURL.indexOf('blockBypass') > 0) {
      showCaptcha('/renewBypass.js');
    } else {
      appendPost(responseText);
    }
  } catch(e) {
    const errorReason = typeof e === 'string' && getErrorReason(e);
    if (isCaptchaError(errorReason)) {
      showCaptcha();
    } else {
      let errorMsg = 'Failed to post';
      errorMsg += '.\nReason: ' + (errorReason || e);
      alert(errorMsg);
    }
  }

  toggleBtn(button);
}

function appendPost(result) {
  if (!result) return
  result = fragment(result)
  $('#postingForm form').reset();
  remainingChars();
  let postCell = result.querySelector('.opCell');

  const divThreads = $('#divThreads')
  const existingOP = divThreads.querySelector(`[id="${postCell.id}"]`);
  if (existingOP) {
    postCell = postCell.querySelector('.postCell:last-child');
    existingOP.querySelector('.divPosts').appendChild(postCell);
  } else {
    divThreads.insertBefore(postCell, divThreads.firstChild);
    const replyLink = document.createElement('a');
    replyLink.className = 'linkReply btnLink';
    replyLink.href = getUrl(postCell);
    replyLink.innerHTML = 'Reply';
    insertAfter(postCell.querySelector('.linkQuote'), replyLink);
  }
  updateMentions(existingOP || postCell);
  postHandlers(postCell);
  highlight(postCell);
  updateTime();
  hideForm();
}

function highlight(postCell) {
  const postClass = postCell.querySelector('.innerPost').classList;
  postClass.add('newPost');
  location.hash = '#' + postCell.id;
  postClass.remove('newPost');
}

const captchaModal = $('#captchaModal');
let captchaUrl;
function showCaptcha(url) {
  captchaModal.style.display = 'block';
  captchaModal.querySelector('img').src = '/captcha.js?' + Date.now();
  captchaModal.querySelector('span').innerHTML = captchaModal.querySelector('input').value = '';
  captchaUrl = url;
}
const hideCaptcha = () => captchaModal.style.display = 'none';
captchaModal.onclick = function(e) {
  e.target === this && hideCaptcha();
}
captchaModal.onsubmit = async function(e) {
  e.preventDefault();
  const form = this;
  var button = form.querySelector('button');
  if (button.disabled) return;
  toggleBtn(button);

  const captchaValue = form.querySelector('input').value;
  const origForm = $('#postingForm form');
  const postData = new FormData(origForm);

  try {
    let captchaData = postData;
    if (captchaUrl) captchaData = new FormData();
    captchaData.set('captcha', captchaValue);
    let result = await ajax(captchaUrl || origForm.action, 'post', captchaData);
    if (captchaUrl) {
      captchaUrl = null;
      result = await(formRequest(origForm, postData));
    }
    hideCaptcha();
    appendPost(result.responseText);
  } catch(e) {
    const reason = getErrorReason(e);
    if (isCaptchaError(reason)) showCaptcha(captchaUrl);
    form.querySelector('span').innerHTML = reason || 'Error';
  }
  toggleBtn(button);
}

var mimeExts = {
  'imagepng': '.png',
  'imagejpeg': '.jpg',
  'imagegif': '.gif',
  'imagebmp': '.bmp',
  'videomp4': '.mp4'
}

addEventListener('error', function(e) {
  if (e.target instanceof Image) {
    e.target.src.replace(/\w+$/, function(match) {
      if (mimeExts[match]) e.target.src += mimeExts[match];
    })
  }
}, true)

let isMod;
async function checkMod() {
  if (localStorage.MOD && location.pathname.indexOf('/mod') !== 0) {
    try {
      const xhr = await headRequest('/account.js', 'head');
      if (xhr.responseURL.indexOf('login') === -1) {
        isMod = true;
        document.documentElement.classList.add('isMod');
        modHandlers(divThreads);
        return;
      }
    } catch(e) {}
    localStorage.removeItem('MOD');
  }
}
checkMod();

function modHandlers(parent) {
  slice.call(parent.querySelectorAll('.linkMod')).forEach(el => {
    const OP = el.closest('.opCell');
    el.href = `/mod.js?boardUri=${OP.dataset.boarduri}&threadId=${OP.id}#${el.closest('[id]').id}`;
  })
}
