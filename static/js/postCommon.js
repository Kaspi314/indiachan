var postCommon = {};

postCommon.init = function() {

  if (!document.getElementById('fieldPostingPassword')) {
    return;
  }

  postCommon.selectedCell = '<div class="removeButton">✖</div>'
      + '<span class="nameLabel"></span><div class="spoilerPanel">'
      + '<input type="checkbox" class="spoilerCheckBox">Spoiler</div>';

  postCommon.selectedFiles = [];

  if (document.getElementById('divUpload')) {
    postCommon.setDragAndDrop();
  }

  var savedPassword = localStorage.deletionPassword;

  if (savedPassword) {

    document.getElementById('fieldPostingPassword').value = savedPassword;

    if (document.getElementById('deletionFieldPassword')) {
      document.getElementById('deletionFieldPassword').value = savedPassword;
    }

  }

  var nameField = document.getElementById('fieldName');

  if (nameField) {
    nameField.value = localStorage.name || '';
  }

  document.getElementById('alwaysUseBypassDiv').style.display = 'table-row';

  var bypassCheckBox = document.getElementById('alwaysUseBypassCheckBox');

  if (localStorage.ensureBypass && JSON.parse(localStorage.ensureBypass)) {
    bypassCheckBox.checked = true;
  }

  bypassCheckBox.addEventListener('change', function() {
    localStorage.setItem('ensureBypass', bypassCheckBox.checked);
  });

  var flagCombo = document.getElementById('flagCombobox');

  if (flagCombo && localStorage.savedFlags) {

    var flagInfo = JSON.parse(localStorage.savedFlags);

    if (flagInfo[api.boardUri]) {

      for (var i = 0; i < flagCombo.options.length; i++) {

        if (flagCombo.options[i].value === flagInfo[api.boardUri]) {
          flagCombo.selectedIndex = i;

          postCommon.showFlagPreview(flagCombo);

          break;
        }

      }

    }

  }

  if (flagCombo) {
    postCommon.setFlagPreviews(flagCombo);
  }

  var formMore = document.getElementById('formMore');

  formMore.style.display = 'table-row';

  var toggled = false;

  var extra = document.getElementById('extra');

  extra.className = 'hidden';

  formMore.children[0].onclick = function() {

    if (toggled) {
      formMore.children[0].innerHTML = 'More';
      extra.className = 'hidden';
    } else {
      formMore.children[0].innerHTML = 'Less';
      extra.className = '';
    }

    toggled = !toggled;

    localStorage.setItem('showExtra', toggled);

  };

  if (localStorage.showExtra && JSON.parse(localStorage.showExtra)) {
    formMore.children[0].onclick();
  }

};

postCommon.showFlagPreview = function(combo) {

  var index = combo.selectedIndex;

  var src;

  if (!index) {
    src = '';
  } else {
    src = '/' + api.boardUri + '/flags/' + combo.options[index].value;
  }

  var previews = document.getElementsByClassName('flagPreview');

  for (var i = 0; i < previews.length; i++) {
    previews[i].src = src;
  }

};

postCommon.setFlagPreviews = function(combo) {

  combo.addEventListener('change', function() {
    postCommon.showFlagPreview(combo);
  });

};

postCommon.savedSelectedFlag = function(selectedFlag) {

  var savedFlagData = localStorage.savedFlags ? JSON
      .parse(localStorage.savedFlags) : {};

  savedFlagData[api.boardUri] = selectedFlag;

  localStorage.setItem('savedFlags', JSON.stringify(savedFlagData));

};

postCommon.addDndCell = function(cell, removeButton) {

  if (postCommon.selectedDivQr) {
    var clonedCell = cell.cloneNode(true);
    clonedCell.getElementsByClassName('removeButton')[0].onclick = removeButton.onclick;
    postCommon.selectedDivQr.appendChild(clonedCell);

    var sourceSpoiler = cell.getElementsByClassName('spoilerCheckBox')[0];
    var destinationSpoiler = clonedCell
        .getElementsByClassName('spoilerCheckBox')[0];

    sourceSpoiler.addEventListener('change', function() {
      if (destinationSpoiler) {
        destinationSpoiler.checked = sourceSpoiler.checked;
      }
    });

    destinationSpoiler.addEventListener('change', function() {
      sourceSpoiler.checked = destinationSpoiler.checked;
    });

  }

  postCommon.selectedDiv.appendChild(cell);

};

postCommon.addSelectedFile = function(file) {

  var cell = document.createElement('div');
  cell.className = 'selectedCell';

  cell.innerHTML = postCommon.selectedCell;

  var nameLabel = cell.getElementsByClassName('nameLabel')[0];
  nameLabel.innerHTML = file.name;

  var removeButton = cell.getElementsByClassName('removeButton')[0];

  removeButton.onclick = function() {
    var index = postCommon.selectedFiles.indexOf(file);

    if (postCommon.selectedDivQr) {

      for (var i = 0; i < postCommon.selectedDiv.childNodes.length; i++) {
        if (postCommon.selectedDiv.childNodes[i] === cell) {
          postCommon.selectedDivQr
              .removeChild(postCommon.selectedDivQr.childNodes[i]);
        }
      }

    }

    postCommon.selectedDiv.removeChild(cell);

    postCommon.selectedFiles.splice(postCommon.selectedFiles.indexOf(file), 1);
  };

  postCommon.selectedFiles.push(file);

  if (!file.type.indexOf('image/')) {

    var fileReader = new FileReader();

    fileReader.onloadend = function() {

      var dndThumb = document.createElement('img');
      dndThumb.src = fileReader.result;
      dndThumb.className = 'dragAndDropThumb';
      cell.appendChild(dndThumb);

      postCommon.addDndCell(cell, removeButton);

    };

    fileReader.readAsDataURL(file);

  } else {
    postCommon.addDndCell(cell, removeButton);
  }

};

postCommon.clearSelectedFiles = function() {

  if (!document.getElementById('divUpload')) {
    return;
  }

  postCommon.selectedFiles = [];

  while (postCommon.selectedDiv.firstChild) {
    postCommon.selectedDiv.removeChild(postCommon.selectedDiv.firstChild);
  }

  if (postCommon.selectedDivQr) {
    while (postCommon.selectedDivQr.firstChild) {
      postCommon.selectedDivQr.removeChild(postCommon.selectedDivQr.firstChild);
    }
  }

};

postCommon.setDragAndDrop = function(qr) {

  var fileInput = document.getElementById('inputFiles');

  if (!qr) {
    fileInput.style.display = 'none';
    document.getElementById('dragAndDropDiv').style.display = 'block';

    fileInput.onchange = function() {

      for (var i = 0; i < fileInput.files.length; i++) {
        postCommon.addSelectedFile(fileInput.files[i]);
      }

      fileInput.type = "text";
      fileInput.type = "file";
    };
  }

  var drop = document.getElementById(qr ? 'dropzoneQr' : 'dropzone');
  drop.onclick = function() {
    fileInput.click();
  };

  if (!qr) {
    postCommon.selectedDiv = document.getElementById('selectedDiv');
  } else {
    postCommon.selectedDivQr = document.getElementById('selectedDivQr');
  }

  drop.addEventListener('dragover', function handleDragOver(event) {

    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';

  }, false);

  drop.addEventListener('drop', function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    for (var i = 0; i < evt.dataTransfer.files.length; i++) {
      postCommon.addSelectedFile(evt.dataTransfer.files[i])
    }

  }, false);

};

postCommon.newCheckExistance = function(file, callback) {

  var reader = new FileReader();

  reader.onloadend = function() {

    var mime = file.type;
    var md5 = SparkMD5.ArrayBuffer.hash(reader.result);

    var identifier = md5 + '-' + mime.replace('/', '');

    api.formApiRequest('checkFileIdentifier', {}, function requested(status,
        data) {

      if (status !== 'ok') {
        console.log(data);
        callback();
      } else {
        callback(md5, mime, data);
      }

    }, false, {
      identifier : identifier
    });

  };

  reader.readAsArrayBuffer(file);

};

postCommon.newGetFilesToUpload = function(callback, index, files) {

  index = index || 0;
  files = files || [];

  if (!document.getElementById('divUpload')
      || index >= postCommon.selectedFiles.length) {
    callback(files);
    return;
  }

  var spoiled = postCommon.selectedDiv
      .getElementsByClassName('spoilerCheckBox')[index].checked;

  var file = postCommon.selectedFiles[index];

  postCommon.newCheckExistance(file, function checked(md5, mime, found) {

    var toPush = {
      name : postCommon.selectedFiles[index].name,
      spoiler : spoiled,
      md5 : md5,
      mime : mime
    };

    if (!found) {
      toPush.content = file;
    }

    files.push(toPush);

    postCommon.newGetFilesToUpload(callback, ++index, files);

  });

};

postCommon.displayBlockBypassPrompt = function(callback) {

  var outerPanel = captchaModal
      .getCaptchaModal('You need a block bypass to post');

  var okButton = outerPanel.getElementsByClassName('modalOkButton')[0];

  okButton.onclick = function() {

    var typedCaptcha = outerPanel.getElementsByClassName('modalAnswer')[0].value
        .trim();

    if (typedCaptcha.length !== 6 && typedCaptcha.length !== 24) {
      alert('Captchas are exactly 6 (24 if no cookies) characters long.');
      return;
    } else if (/\W/.test(typedCaptcha)) {
      alert('Invalid captcha.');
      return;
    }

    api.formApiRequest('renewBypass', {
      captcha : typedCaptcha
    }, function requestComplete(status, data) {

      if (status === 'ok') {

        if (callback) {
          callback();
        }

        outerPanel.remove();

      } else {
        alert(status + ': ' + JSON.stringify(data));
      }
    });

  };

};

postCommon.storeUsedPostingPassword = function(boardUri, threadId, postId) {

  var storedData = JSON.parse(localStorage.postingPasswords || '{}');

  var key = boardUri + '/' + threadId

  if (postId) {
    key += '/' + postId;
  }

  storedData[key] = localStorage.deletionPassword;

  localStorage.setItem('postingPasswords', JSON.stringify(storedData));

};

postCommon.init();