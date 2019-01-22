(function () {
  'use strict';

  var global = window;
  var document = global.document;
  var timeago = global.timeago;
  var $ = global.$;
  var axios = global.axios;

  var $floatingMenu = $('#floatingMenu');
  var $threadList = $('#threadList');
  var isReply = document.body.id === 'page-thread';

  var getErrorReason = function (e) { return $(e && e.response && e.response.data).find('#errorLabel').html() || ''; };
  var isCaptchaError = function (reason) { return reason && reason.indexOf('captcha') > 0; };

  var hideReply = function () {
    $('#postingForm').removeClass('vis');
  };

  var quickReply = function (e) {
    e.preventDefault();

    var target = e.target.pathname;
    var threadId = '';
    var quoteId;
    var isReplyLocal = isReply;
    if (target) {
      isReplyLocal = 1;
      threadId = target.match(/\d+/)[0];
      quoteId = e.target.hash.match(/\d+/)[0];
    }

    var $form = $('#postingForm').addClass('vis');
    $form.find('.formTitle span').html(isReplyLocal ? 'Reply' : 'New Thread');
    $form.find('form').prop('action', isReplyLocal ? '/replyThread.js' : '/newThread.js');
    $form.find('#formButton').html(isReplyLocal ? 'Reply' : 'Post');

    // only modify threadIdentifier if board page
    if (!isReply) {
      $form.find('#threadIdentifier').val(isReplyLocal ? threadId : '');
    }

    $form.find('textarea').focus();

    if (quoteId) {
      location.hash = 'q' + quoteId;
    }
  };

  $('.labelOmission').click(function() {
    var $this = $(this);
    if ($this.hasClass('loading')) {
      return;
    }

    var $parent = $this.closest('.opCell');
    var $posts = $parent.find('.divPosts');
    if ($this.hasClass('loaded')) {
      $posts.toggleClass('compact');
      $this.html('Show/Hide');
      updateMentions($parent);
      return $this.toggleClass('open');
    }

    $this.addClass('loading');
    axios.get(threadUrl($parent)).then(function (response) {
      $this.html('Showing all replies');
      $this.addClass('open loaded').removeClass('loading');
      $posts.html($(response.data).find('.divPosts').html());
      updateTime($posts);
      updateMentions($parent);
    });
  });

  var threadUrl = function ($parent) { return '/' + $parent.data('boarduri') + '/res/' + $parent.attr('id') + '.html'; };

  function updateMentions($parent) {
    var backLinks = {};

    $parent.find('.quoteLink').each(function(index, el) {
      var linkedId = el.href.replace(/.+#/, '');
      var selfId = $(el).closest('.postCell').attr('id');
      if (!backLinks[linkedId]) {
        backLinks[linkedId] = {};
      }
      backLinks[linkedId][selfId] = 1;
    });

    for (var l in backLinks) {
      var html = '';
      for (var k in backLinks[l]) {
        html += '<a href="' + threadUrl($parent) + '#' + k + '">>>' + k + '</a>';
      }
      if (l == $parent.attr('id')) {
        l += ' .innerOP';
      }
      $('#' + l).find('.panelBacklinks').html(html);
    }
  }

  function updateTime($parent) {
    if (!$parent) {
      $parent = $threadList;
    }
    $parent.find('.labelCreated').each(function(i, el) {
      try {
        var postDate = new Date(el.innerText.replace(/(\w+)\/(\w+)/, '$2/$1'));
        el.setAttribute('datetime', new Date(postDate.getTime() - postDate.getTimezoneOffset() * 60 * 1000).toISOString());
        timeago().render(el);
      } catch(e) {}
    });
  }

  $threadList
  .on('mouseover', '.panelBacklinks a, .quoteLink', function() {
    var bbox = this.getBoundingClientRect();
    var linkedId = $(this).prop('href').replace(/.+#/, '');
    var postCell = $('#' + linkedId);

    if (postCell.hasClass('opCell')) {
      postCell = postCell.find('.innerOP').html();
    } else {
      postCell = postCell.html();
    }

    $floatingMenu.css({
      left: bbox.right,
      top: bbox.bottom
    }).html(postCell).show();
  })
  .on('mouseout', '.panelBacklinks a, .quoteLink', function() {
    $floatingMenu.hide();
  })
  .on('click', '.innerUpload', function(e) {
    e.preventDefault();
    var $this = $(this);
    var $panelUploads = $this.closest('.panelUploads');

    if ($this.hasClass('loaded')) {
      $this.toggleClass('expanded');
      $panelUploads.toggleClass('expanded');
    } else if (!$this.hasClass('loading')) {
      $this.addClass('loading');
      var $imgLink = $this.find('.imgLink');
      var mimeId = $imgLink.data('filemime').slice(0, 5);
      var src = $imgLink.prop('href');

      var embed;
      if (mimeId === 'image') {
        embed = "<img class=\"origMedia\" src=\"" + src + "\">";
      } else {
        embed = "<" + mimeId + " class=\"origMedia\" src=\"" + src + "\" autoplay controls muted></" + mimeId + ">";
      }
      $(embed)
        .on('loadstart load', function () {
          if ($this.hasClass('loading')) {
            $panelUploads.addClass('expanded');
            $this.addClass('loaded expanded').removeClass('loading');
          }
        })
        .prependTo($this);
    }
  })
  .on('click', '.quickReply', quickReply);

  $('.mainLink.quickReply').click(quickReply);

  function updateRemaining() {
    $('#labelMessageLength').html(4096 - $('#postingForm textarea').val().length);
  }

  $('.catalogCell').click(function(){$(this).addClass('active');});
  $('#postingForm textarea').on('input', updateRemaining);

  $('#postingForm form').submit(function(e) {
    e.preventDefault();
    var $btn = $(this).find('.btn');
    if ($btn.prop('disabled')) {
      return;
    }
    disableBtn($btn);

    var action = this.action;
    var requestData = {
      method: this.method,
      url: action,
      data: new FormData(this),
      headers: {
        'Content-Type': this.enctype
      }
    };

    axios.request(requestData)
    .catch(function (error) {
      var errorMsg = 'Failed to post';
      var errorReason = getErrorReason(error);
      if (isCaptchaError(errorReason)) {
        return showCaptcha(requestData);
      }
      errorMsg += '.\nReason: ' + errorReason;
      alert(errorMsg);
    })
    .then(function (response) {
      response && appendPost(response.data);
      resetButton($btn);
    });
  });

  $('.opCell').each(function(i, el) {
    updateMentions($(el));
  });

  function markPost() {
    var hash = location.hash;
    if (hash) {
      var isLinkQuote = hash[1] === 'q';
      var hashValue = hash.slice(isLinkQuote ? 2 : 1);
      $('.markedPost').removeClass('markedPost');
      $('#' + hashValue + ':not(.opCell) .innerPost').addClass('markedPost');

      if (isLinkQuote) {
        var textarea = $('#postingForm textarea')[0];
        var addition = '>>' + hashValue + '\n';
        var value = textarea.value;
        if (value && value[value.length - 1] !== '\n') {
          addition = '\n' + addition;
        }
        textarea.value += addition;
        updateRemaining();
      }
    } else {
      hideReply();
    }
  }

  function appendPost(data) {
    $('#postingForm form')[0].reset();
    updateRemaining();
    var $newPost = $(data).find('.opCell');
    var updatedId;
    if (isReply) {
      var $postCell = $newPost.find('.postCell').last();
      var $innerPost = $postCell.children('.innerPost').addClass('newPost');
      $postCell.appendTo('.divPosts');
      $innerPost.prop('offsetWidth');
      $innerPost.removeClass('newPost');
      $newPost = $postCell;
      updateMentions($('.opCell'));
    } else {
      var $existingPost = $(("#divThreads #" + ($newPost.attr('id'))));
      if ($existingPost.length) {
        $existingPost.html($newPost.html());
        $newPost = $existingPost;
        updatedId = $newPost.find('.postCell').last().attr('id');
      } else {
        $newPost.prependTo('#divThreads');
      }
      updateMentions($newPost);
    }
    location.hash = '#' + (updatedId || $newPost.attr('id'));
    updateTime($newPost);
    hideReply();
  }

  $('.divMore').click(function() {
    $(this).toggleClass('open');
  });

  $('#moreActions').click(function() {
    $('#divThreads').toggleClass('moreActions');
  });

  updateTime();
  markPost();

  onhashchange = markPost;

  $('.formTitle').click(hideReply);

  var showCaptcha = function (requestData) { return new Promise(function (resolve, reject) {
    $('#captchaModal').show().on('submit', function(e) {
      e.preventDefault();
      var $this = $(this);
      var $btn = $this.find('.btn');
      if ($btn.prop('disabled')) { return }
      disableBtn($btn);
      requestData.data.set('captcha', $this.find('input').val());
      axios(requestData)
        .then(function (response) {
          $('#captchaModal').hide().off();
          resolve(response);
        })
        .catch(function (e) {
          var reason = getErrorReason(e);
          if (isCaptchaError(reason)) {
            loadCaptchaImg();
          }
          $this.find('span').html(reason || 'Error');
        })
        .then(function () {
          resetButton($btn);
        });
    });
    loadCaptchaImg();
  }); };

  var loadCaptchaImg = function () { return $('#captchaModal img').prop('src', '/captcha.js?' + Date.now()); };
  var disableBtn = function ($btn) { return $btn.prop('disabled', true).addClass('loading'); };
  var resetButton = function ($btn) { return $btn.prop('disabled', false).removeClass('loading'); };

}());
