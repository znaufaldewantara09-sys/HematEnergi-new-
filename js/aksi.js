document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var storageKey = 'hematEnergiChallengeProgress';
  var challengeList = document.getElementById('challengeList');
  var checkboxes = Array.prototype.slice.call(challengeList.querySelectorAll('input[type="checkbox"]'));
  var progressLabel = document.getElementById('challengeProgressLabel');
  var progressPercent = document.getElementById('challengeProgressPercent');
  var progressTrack = document.getElementById('challengeProgressTrack');
  var progressBar = document.getElementById('challengeProgressBar');
  var storageStatus = document.getElementById('challengeStorageStatus');

  function setStorageError() {
    storageStatus.textContent = 'Progres tidak dapat disimpan di browser ini. Periksa pengaturan penyimpanan browser Anda.';
    storageStatus.classList.add('is-error');
  }

  function updateProgress() {
    var completed = checkboxes.filter(function (checkbox) { return checkbox.checked; }).length;
    var percentage = Math.round((completed / checkboxes.length) * 100);
    progressLabel.textContent = completed + ' dari ' + checkboxes.length + ' tantangan selesai';
    progressPercent.textContent = percentage + '%';
    progressTrack.setAttribute('aria-valuenow', String(completed));
    progressBar.style.width = percentage + '%';
    checkboxes.forEach(function (checkbox) {
      checkbox.closest('.challenge-item').classList.toggle('is-complete', checkbox.checked);
    });
  }

  try {
    var savedProgress = window.localStorage.getItem(storageKey);
    if (savedProgress) {
      var completedChallenges = JSON.parse(savedProgress);
      if (!Array.isArray(completedChallenges)) {
        throw new Error('Format progres tersimpan tidak valid.');
      }
      checkboxes.forEach(function (checkbox) {
        checkbox.checked = completedChallenges.indexOf(checkbox.value) !== -1;
      });
    }
  } catch (error) {
    console.error('Gagal membaca progres tantangan:', error);
    setStorageError();
  }

  updateProgress();

  checkboxes.forEach(function (checkbox) {
    checkbox.addEventListener('change', function () {
      updateProgress();
      try {
        var completedChallenges = checkboxes.filter(function (item) { return item.checked; })
          .map(function (item) { return item.value; });
        window.localStorage.setItem(storageKey, JSON.stringify(completedChallenges));
        storageStatus.textContent = 'Progres tantangan disimpan di browser ini.';
        storageStatus.classList.remove('is-error');
      } catch (error) {
        console.error('Gagal menyimpan progres tantangan:', error);
        setStorageError();
      }
    });
  });
});
