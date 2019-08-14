(function () {
  'use strict';

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg);
      var value = info.value;
    } catch (error) {
      reject(error);
      return;
    }

    if (info.done) {
      resolve(value);
    } else {
      Promise.resolve(value).then(_next, _throw);
    }
  }

  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
          args = arguments;
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args);

        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
        }

        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
        }

        _next(undefined);
      });
    };
  }

  /**
   * Created by hustcc on 18/5/20.
   * Contract: i@hust.cc
   */
  var SEC_ARRAY = [60, 60, 24, 7, 365 / 7 / 12, 12];
  /**
   * change f into int, remove decimal. Just for code compression
   * @param f
   * @returns {number}
   */

  var toInt = function toInt(f) {
    return parseInt(f);
  };
  /**
   * format Date / string / timestamp to Date instance.
   * @param input
   * @returns {*}
   */

  var toDate = function toDate(input) {
    if (input instanceof Date) return input;
    if (!isNaN(input) || /^\d+$/.test(input)) return new Date(toInt(input));
    input = (input || '').trim().replace(/\.\d+/, '') // remove milliseconds
    .replace(/-/, '/').replace(/-/, '/').replace(/(\d)T(\d)/, '$1 $2').replace(/Z/, ' UTC') // 2017-2-5T3:57:52Z -> 2017-2-5 3:57:52UTC
    .replace(/([\+\-]\d\d)\:?(\d\d)/, ' $1$2'); // -04:00 -> -0400

    return new Date(input);
  };
  /**
   * format the diff second to *** time ago, with setting locale
   * @param diff
   * @param localeFunc
   * @returns {string | void | *}
   */

  var formatDiff = function formatDiff(diff, localeFunc) {
    // if locale is not exist, use defaultLocale.
    // if defaultLocale is not exist, use build-in `en`.
    // be sure of no error when locale is not exist.
    var i = 0,
        agoin = diff < 0 ? 1 : 0,
        // timein or timeago
    total_sec = diff = Math.abs(diff);

    for (; diff >= SEC_ARRAY[i] && i < SEC_ARRAY.length; i++) {
      diff /= SEC_ARRAY[i];
    }

    diff = toInt(diff);
    i *= 2;
    if (diff > (i === 0 ? 9 : 1)) i += 1;
    return localeFunc(diff, i, total_sec)[agoin].replace('%s', diff);
  };
  /**
   * calculate the diff second between date to be formatted an now date.
   * @param date
   * @param nowDate
   * @returns {number}
   */

  var diffSec = function diffSec(date, nowDate) {
    nowDate = nowDate ? toDate(nowDate) : new Date();
    return (nowDate - toDate(date)) / 1000;
  };
  /**
   * nextInterval: calculate the next interval time.
   * - diff: the diff sec between now and date to be formatted.
   *
   * What's the meaning?
   * diff = 61 then return 59
   * diff = 3601 (an hour + 1 second), then return 3599
   * make the interval with high performance.
   **/

  var nextInterval = function nextInterval(diff) {
    var rst = 1,
        i = 0,
        d = Math.abs(diff);

    for (; diff >= SEC_ARRAY[i] && i < SEC_ARRAY.length; i++) {
      diff /= SEC_ARRAY[i];
      rst *= SEC_ARRAY[i];
    }

    d = d % rst;
    d = d ? rst - d : rst;
    return Math.ceil(d);
  };

  /**
   * Created by hustcc on 18/5/20.
   * Contract: i@hust.cc
   */
  var EN = 'second_minute_hour_day_week_month_year'.split('_');
  var ZH = '秒_分钟_小时_天_周_个月_年'.split('_');

  var zh_CN = function zh_CN(number, index) {
    if (index === 0) return ['刚刚', '片刻后'];
    var unit = ZH[parseInt(index / 2)];
    return [number + " " + unit + "\u524D", number + " " + unit + "\u540E"];
  };

  var en_US = function en_US(number, index) {
    if (index === 0) return ['just now', 'right now'];
    var unit = EN[parseInt(index / 2)];
    if (number > 1) unit += 's';
    return [number + " " + unit + " ago", "in " + number + " " + unit];
  };
  /**
   * 所有的语言
   * @type {{en: function(*, *), zh_CN: function(*, *)}}
   */


  var Locales = {
    en_US: en_US,
    zh_CN: zh_CN
  };
  /**
   * 获取语言函数
   * @param locale
   * @returns {*}
   */

  var getLocale = function getLocale(locale) {
    return Locales[locale] || en_US;
  };

  var ATTR_TIMEAGO_TID = 'timeago-tid';
  var ATTR_DATETIME = 'datetime';
  /**
   * get the node attribute, native DOM and jquery supported.
   * @param node
   * @param name
   * @returns {*}
   */

  var getAttribute = function getAttribute(node, name) {
    if (node.getAttribute) return node.getAttribute(name); // native dom

    if (node.attr) return node.attr(name); // jquery dom
  };
  /**
   * get the datetime attribute, `data-timeagp` / `datetime` are supported.
   * @param node
   * @returns {*}
   */


  var getDateAttribute = function getDateAttribute(node) {
    return getAttribute(node, ATTR_DATETIME);
  };
  /**
   * set the node attribute, native DOM and jquery supported.
   * @param node
   * @param timerId
   * @returns {*}
   */

  var saveTimerId = function saveTimerId(node, timerId) {
    if (node.setAttribute) return node.setAttribute(ATTR_TIMEAGO_TID, timerId);
    if (node.attr) return node.attr(ATTR_TIMEAGO_TID, timerId);
  };
  var getTimerId = function getTimerId(node) {
    return getAttribute(node, ATTR_TIMEAGO_TID);
  };

  var clear = function clear(tid) {
    clearTimeout(tid);
  }; // 定时运行


  var run = function run(node, date, localeFunc, nowDate) {
    // 先清理掉之前的
    clear(getTimerId(node)); // get diff seconds

    var diff = diffSec(date, nowDate); // render

    node.innerText = formatDiff(diff, localeFunc);
    var tid = setTimeout(function () {
      run(node, date, localeFunc, nowDate);
    }, nextInterval(diff) * 1000, 0x7FFFFFFF); // there is no need to save node in object. Just save the key
    saveTimerId(node, tid);
  }; // 取消一个 node 的实时渲染

  var render = function render(nodes, locale, nowDate) {
    // by .length
    if (nodes.length === undefined) nodes = [nodes];
    var node;

    for (var i = 0; i < nodes.length; i++) {
      node = nodes[i];
      var date = getDateAttribute(node);
      var localeFunc = getLocale(locale);
      run(node, date, localeFunc, nowDate);
    }

    return nodes;
  };

  function updateTime() {
    var allDates = document.querySelectorAll('.labelCreated:not([datetime])');
    Array.prototype.forEach.call(allDates, function (el) {
      el.title = el.innerHTML;
      el.setAttribute('datetime', el.innerHTML);
    });
    render(allDates);
  }
  updateTime();

  function xhr(url, method, data) {
    return new Promise(function (resolve, reject) {
      var x = new XMLHttpRequest();

      x.onreadystatechange = function () {
        if (x.readyState == 4) {
          x.status < 400 ? resolve(x.responseText) : reject(x.responseText);
        }
      };

      x.onerror = reject;
      x.open(method, url, true);
      x.send(data || null);
    });
  }

  function get(url) {
    return xhr(url, 'get');
  }
  function form(el, data) {
    return xhr(el.action, el.method, data || new FormData(el));
  }

  if (!Element.prototype.matches) Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;

  if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
      var el = this;

      do {
        if (el.matches(s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);

      return null;
    };
  }

  Function.prototype.$asyncbind = function $asyncbind(self, catcher) {

    if (!Function.prototype.$asyncbind) {
      Object.defineProperty(Function.prototype, "$asyncbind", {
        value: $asyncbind,
        enumerable: false,
        configurable: true,
        writable: true
      });
    }

    if (!$asyncbind.trampoline) {
      $asyncbind.trampoline = function trampoline(t, x, s, e, u) {
        return function b(q) {
          while (q) {
            if (q.then) {
              q = q.then(b, e);
              return u ? undefined : q;
            }

            try {
              if (q.pop) {
                if (q.length) return q.pop() ? x.call(t) : q;
                q = s;
              } else q = q.call(t);
            } catch (r) {
              return e(r);
            }
          }
        };
      };
    }

    if (!$asyncbind.LazyThenable) {
      $asyncbind.LazyThenable = function () {
        function isThenable(obj) {
          return obj && obj instanceof Object && typeof obj.then === "function";
        }

        function resolution(p, r, how) {
          try {
            var x = how ? how(r) : r;
            if (p === x) return p.reject(new TypeError("Promise resolution loop"));

            if (isThenable(x)) {
              x.then(function (y) {
                resolution(p, y);
              }, function (e) {
                p.reject(e);
              });
            } else {
              p.resolve(x);
            }
          } catch (ex) {
            p.reject(ex);
          }
        }

        function _unchained(v) {}

        function thenChain(res, rej) {
          this.resolve = res;
          this.reject = rej;
        }

        function Chained() {}
        Chained.prototype = {
          resolve: _unchained,
          reject: _unchained,
          then: thenChain
        };

        function then(res, rej) {
          var chain = new Chained();

          try {
            this._resolver(function (value) {
              return isThenable(value) ? value.then(res, rej) : resolution(chain, value, res);
            }, function (ex) {
              resolution(chain, ex, rej);
            });
          } catch (ex) {
            resolution(chain, ex, rej);
          }

          return chain;
        }

        function Thenable(resolver) {
          this._resolver = resolver;
          this.then = then;
        }

        Thenable.resolve = function (v) {
          return Thenable.isThenable(v) ? v : {
            then: function then(resolve) {
              return resolve(v);
            }
          };
        };

        Thenable.isThenable = isThenable;
        return Thenable;
      }();

      $asyncbind.EagerThenable = $asyncbind.Thenable = ($asyncbind.EagerThenableFactory = function (tick) {
        tick = tick || typeof process === "object" && process.nextTick || typeof setImmediate === "function" && setImmediate || function (f) {
          setTimeout(f, 0);
        };

        var soon = function () {
          var fq = [],
              fqStart = 0,
              bufferSize = 1024;

          function callQueue() {
            while (fq.length - fqStart) {
              try {
                fq[fqStart]();
              } catch (ex) {}

              fq[fqStart++] = undefined;

              if (fqStart === bufferSize) {
                fq.splice(0, bufferSize);
                fqStart = 0;
              }
            }
          }

          return function (fn) {
            fq.push(fn);
            if (fq.length - fqStart === 1) tick(callQueue);
          };
        }();

        function Zousan(func) {
          if (func) {
            var me = this;
            func(function (arg) {
              me.resolve(arg);
            }, function (arg) {
              me.reject(arg);
            });
          }
        }

        Zousan.prototype = {
          resolve: function resolve(value) {
            if (this.state !== undefined) return;
            if (value === this) return this.reject(new TypeError("Attempt to resolve promise with self"));
            var me = this;

            if (value && (typeof value === "function" || typeof value === "object")) {
              try {
                var first = 0;
                var then = value.then;

                if (typeof then === "function") {
                  then.call(value, function (ra) {
                    if (!first++) {
                      me.resolve(ra);
                    }
                  }, function (rr) {
                    if (!first++) {
                      me.reject(rr);
                    }
                  });
                  return;
                }
              } catch (e) {
                if (!first) this.reject(e);
                return;
              }
            }

            this.state = STATE_FULFILLED;
            this.v = value;
            if (me.c) soon(function () {
              for (var n = 0, l = me.c.length; n < l; n++) {
                STATE_FULFILLED(me.c[n], value);
              }
            });
          },
          reject: function reject(reason) {
            if (this.state !== undefined) return;
            this.state = STATE_REJECTED;
            this.v = reason;
            var clients = this.c;
            if (clients) soon(function () {
              for (var n = 0, l = clients.length; n < l; n++) {
                STATE_REJECTED(clients[n], reason);
              }
            });
          },
          then: function then(onF, onR) {
            var p = new Zousan();
            var client = {
              y: onF,
              n: onR,
              p: p
            };

            if (this.state === undefined) {
              if (this.c) this.c.push(client);else this.c = [client];
            } else {
              var s = this.state,
                  a = this.v;
              soon(function () {
                s(client, a);
              });
            }

            return p;
          }
        };

        function STATE_FULFILLED(c, arg) {
          if (typeof c.y === "function") {
            try {
              var yret = c.y.call(undefined, arg);
              c.p.resolve(yret);
            } catch (err) {
              c.p.reject(err);
            }
          } else c.p.resolve(arg);
        }

        function STATE_REJECTED(c, reason) {
          if (typeof c.n === "function") {
            try {
              var yret = c.n.call(undefined, reason);
              c.p.resolve(yret);
            } catch (err) {
              c.p.reject(err);
            }
          } else c.p.reject(reason);
        }

        Zousan.resolve = function (val) {
          if (val && val instanceof Zousan) return val;
          var z = new Zousan();
          z.resolve(val);
          return z;
        };

        Zousan.reject = function (err) {
          if (err && err instanceof Zousan) return err;
          var z = new Zousan();
          z.reject(err);
          return z;
        };

        Zousan.version = "2.3.3-nodent";
        return Zousan;
      })();
    }

    function boundThen() {
      return resolver.apply(self, arguments);
    }

    var resolver = this;

    switch (catcher) {
      case true:
        return new $asyncbind.Thenable(boundThen);

      case 0:
        return new $asyncbind.LazyThenable(boundThen);

      case undefined:
        boundThen.then = boundThen;
        return boundThen;

      default:
        return function () {
          try {
            return resolver.apply(self, arguments);
          } catch (ex) {
            return catcher(ex);
          }
        };
    }
  };
  var $ = document.querySelector.bind(document);

  var $$ = function $$(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  };

  var isBoard = !!$('#board-page');

  var getUrl = function getUrl(OP) {
    return "/" + OP.dataset.boarduri + "/res/" + OP.id + ".html";
  };

  var getErrorReason = function getErrorReason(data) {
    var label = fragment(data).querySelector('#errorLabel');
    return label && label.innerHTML;
  };

  var isCaptchaError = function isCaptchaError(reason) {
    return reason && reason.indexOf('captcha') > 0;
  };

  var fragment = function fragment(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div;
  };

  var preview = $('#preview');
  var textarea = $('#postingForm textarea');

  var remainingChars = function remainingChars() {
    return $('#labelMessageLength').innerHTML = 4096 - textarea.value.length;
  };

  textarea.oninput = remainingChars;

  var hideForm = function hideForm() {
    return $('#showForm').checked = false;
  };

  onhashchange = markPost;
  markPost();
  $('#postingForm form').onsubmit = onsubmit;
  $('#postingForm form > b').onclick = hideForm;
  $$('.opCell').forEach(updateMentions);

  function postHandlers(parent) {
    Array.prototype.slice.call(parent.querySelectorAll('.linkQuote')).forEach(function (el) {
      if (isBoard) {
        el.hash = el.hash.replace('q', '');
      } else {
        el.onclick = function () {
          return quickReply(el.hash.slice(2));
        };
      }
    });
    Array.prototype.slice.call(parent.querySelectorAll('.panelBacklinks a, .quoteLink')).forEach(function (el) {
      el.onmouseover = showPreview;

      el.onmouseout = function () {
        return preview.style.display = 'none';
      };
    });
    Array.prototype.slice.call(parent.querySelectorAll('.innerUpload')).forEach(function (el) {
      return el.onclick = loadUpload;
    });
  }

  postHandlers($('#divThreads'));

  function quickReply(quoteId) {
    $('#showForm').checked = true;
    textarea.focus();
    if (quoteId) location.hash = 'q' + quoteId;
  }

  $$('.labelOmission').forEach(function (el) {
    return el.onclick =
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee() {
      var OP, divPosts, result, newPosts;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!el.classList.contains('loading')) {
                _context.next = 2;
                break;
              }

              return _context.abrupt("return");

            case 2:
              OP = el.closest('.opCell');
              divPosts = OP.querySelector('.divPosts');

              if (!el.classList.contains('loaded')) {
                _context.next = 9;
                break;
              }

              divPosts.classList.toggle('compact');
              el.innerHTML = 'Show/Hide';
              _context.next = 19;
              break;

            case 9:
              el.classList.add('loading');
              _context.next = 12;
              return get(getUrl(OP));

            case 12:
              result = _context.sent;
              el.innerHTML = 'Showing all replies';
              el.classList.replace('loading', 'loaded');
              newPosts = fragment(result).querySelector('.divPosts');
              postHandlers(newPosts);
              OP.replaceChild(newPosts, divPosts);
              updateTime();

            case 19:
              el.classList.toggle('open');
              updateMentions(OP);

            case 21:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));
  });

  function updateMentions(OP) {
    var backLinks = {};
    var links = OP.querySelectorAll('.quoteLink');

    for (var i = 0; i < links.length; i++) {
      var el = links[i];
      var linkedId = el.hash.slice(1);
      var selfId = el.closest('.postCell').id;
      if (!backLinks[linkedId]) backLinks[linkedId] = {};
      backLinks[linkedId][selfId] = 1;
    }

    for (var link in backLinks) {
      var html = '';

      for (var k in backLinks[link]) {
        html += "<a href=\"" + getUrl(OP) + "#" + k + "\">>>" + k + "</a>";
      }

      link = $("[id=\"" + link + "\"] " + (link === OP.id && '.innerOP ') + ".panelBacklinks");
      if (link) link.innerHTML = html;
    }
  }

  function markPost() {
    var hash = location.hash;

    if (hash) {
      var isLinkQuote = hash[1] === 'q';
      var hashValue = hash.slice(isLinkQuote ? 2 : 1);
      var alreadyMarked = $('.markedPost');
      if (alreadyMarked) alreadyMarked.classList.remove('markedPost');
      var newMarked = $("[id=\"" + hashValue + "\"]:not(.opCell) .innerPost");
      if (newMarked) newMarked.classList.add('markedPost');

      if (isLinkQuote) {
        var value = textarea.value;
        var addition = '>>' + hashValue + '\n';

        if (value.indexOf('\n' + addition) === -1) {
          if (value && value[value.length - 1] !== '\n') {
            addition = '\n' + addition;
          }

          textarea.value += addition;
          remainingChars();
        }
      }
    } else {
      hideForm();
    }
  }

  function showPreview() {
    var bbox = this.getBoundingClientRect();
    var linkedId = this.hash.slice(1);
    var postCell = $("[id=\"" + linkedId + "\"]");
    if (postCell.classList.contains('opCell')) postCell = postCell.querySelector('.innerOP');
    preview.innerHTML = postCell.innerHTML;
    var style = preview.style;
    style.display = 'block';
    style.left = bbox.right + 'px';
    style.top = bbox.bottom + 'px';
  }

  function loadUpload(e) {
    e.preventDefault();
    var img = this;
    var imgClass = img.classList;
    var panelClass = img.closest('.panelUploads').classList;

    if (imgClass.contains('loaded')) {
      imgClass.toggle('expanded');
      panelClass.toggle('expanded');
    } else if (!imgClass.contains('loading')) {
      imgClass.add('loading');
      var imgLink = img.querySelector('.imgLink');
      var mimeId = imgLink.dataset.filemime.slice(0, 5);
      var src = imgLink.href;
      var toggle = toggleUpload(imgClass, panelClass);
      var embed;

      if (mimeId === 'image') {
        embed = document.createElement('img');
        embed.onload = toggle;
      } else {
        embed = document.createElement(mimeId);
        embed.autoplay = embed.controls = embed.muted = true;
        embed.onloadstart = toggle;
      }

      embed.className = 'origMedia';
      embed.src = src;
      img.insertBefore(embed, img.firstChild);
    }
  }

  function toggleUpload(imgClass, panelClass) {
    return function () {
      if (imgClass.contains('loading')) {
        panelClass.add('expanded');
        imgClass.replace('loading', 'loaded');
        imgClass.add('expanded');
      }
    };
  }

  var toggleBtn = function toggleBtn(btn) {
    btn.disabled = !btn.disabled;
    btn.classList.toggle('loading');
  };

  function onsubmit(_x) {
    return _onsubmit.apply(this, arguments);
  }

  function _onsubmit() {
    _onsubmit = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee3(e) {
      var form$1, button, result, errorReason, errorMsg;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              e.preventDefault();
              form$1 = this;
              button = form$1.querySelector('button');

              if (!button.disabled) {
                _context3.next = 5;
                break;
              }

              return _context3.abrupt("return");

            case 5:
              toggleBtn(button);
              _context3.prev = 6;
              _context3.next = 9;
              return form(form$1);

            case 9:
              result = _context3.sent;
              appendPost(result);
              _context3.next = 17;
              break;

            case 13:
              _context3.prev = 13;
              _context3.t0 = _context3["catch"](6);
              errorReason = getErrorReason(_context3.t0);

              if (isCaptchaError(errorReason)) {
                showCaptcha();
              } else {
                errorMsg = 'Failed to post';
                errorMsg += '.\nReason: ' + errorReason;
                alert(errorMsg);
              }

            case 17:
              toggleBtn(button);

            case 18:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this, [[6, 13]]);
    }));
    return _onsubmit.apply(this, arguments);
  }

  function appendPost(result) {
    if (!result) return;
    result = fragment(result);
    $('#postingForm form').reset();
    remainingChars();
    var postCell = result.querySelector('.opCell');
    var divThreads = $('#divThreads');
    var existingOP = divThreads.querySelector("[id=\"" + postCell.id + "\"]");

    if (existingOP) {
      postCell = postCell.querySelector('.postCell:last-child');
      existingOP.querySelector('.divPosts').appendChild(postCell);
    } else {
      divThreads.insertBefore(postCell, divThreads.firstChild);
    }

    postHandlers(postCell);
    var postClass = postCell.querySelector('.innerPost').classList;
    postClass.add('newPost');
    location.hash = '#' + postCell.id;
    postClass.remove('newPost');
    updateTime();
    hideForm();
    updateMentions(existingOP || postCell);
  }

  function showCaptcha() {
    $('#captchaModal').style.display = 'block';
    $('#captchaModal img').src = '/captcha.js?' + Date.now();
  }

  var hideCaptcha = function hideCaptcha() {
    return $('#captchaModal').style.display = 'none';
  };

  $('#captchaModal').onclick = function (e) {
    e.target === this && hideCaptcha();
  };

  $('#captchaModal').onsubmit =
  /*#__PURE__*/
  function () {
    var _ref2 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2(e) {
      var form$1, button, origForm, data, result, reason;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              e.preventDefault();
              form$1 = this;
              button = form$1.querySelector('button');

              if (!button.disabled) {
                _context2.next = 5;
                break;
              }

              return _context2.abrupt("return");

            case 5:
              toggleBtn(button);
              origForm = $('#postingForm form');
              data = new FormData(origForm);
              data.set('captcha', form$1.querySelector('input').value);
              _context2.prev = 9;
              _context2.next = 12;
              return form(origForm, data);

            case 12:
              result = _context2.sent;
              hideCaptcha();
              appendPost(result);
              _context2.next = 22;
              break;

            case 17:
              _context2.prev = 17;
              _context2.t0 = _context2["catch"](9);
              reason = getErrorReason(_context2.t0);
              if (isCaptchaError(reason)) showCaptcha();
              form$1.querySelector('span').innerHTML = reason || 'Error';

            case 22:
              toggleBtn(button);

            case 23:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[9, 17]]);
    }));

    return function (_x2) {
      return _ref2.apply(this, arguments);
    };
  }();

  var mimeExts = {
    'imagepng': '.png',
    'imagejpeg': '.jpg',
    'imagegif': '.gif',
    'imagebmp': '.bmp',
    'videomp4': '.mp4'
  };
  addEventListener('error', function (e) {
    if (e.target instanceof Image) {
      var match = e.target.src.replace(/\w+$/, function (match) {
        if (mimeExts[match]) {
          e.target.src += mimeExts[match];
        }
      });
    }
  }, true);

}());
