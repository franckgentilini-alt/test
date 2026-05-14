// we-rando — "Je veux être informé" form handler

(function () {
  // Pre-fill hidden inspiration field from URL param ?inspiration=nom-du-sejour
  var params = new URLSearchParams(window.location.search);
  var inspirationParam = params.get('inspiration');
  if (inspirationParam) {
    document.getElementById('inspiration').value = inspirationParam;
  }

  var form         = document.getElementById('we-rando-form');
  var confirmation = document.getElementById('confirmation');
  var submitBtn    = form.querySelector('.btn-submit');

  // --- Validation helpers ---

  function showError(fieldId, message) {
    var el = document.getElementById(fieldId + '-error');
    if (el) el.textContent = message;
    var input = document.getElementById(fieldId);
    if (input) input.classList.add('invalid');
  }

  function clearError(fieldId) {
    var el = document.getElementById(fieldId + '-error');
    if (el) el.textContent = '';
    var input = document.getElementById(fieldId);
    if (input) input.classList.remove('invalid');
  }

  function showGroupError(groupId, errorId, message) {
    var group = document.getElementById(groupId);
    if (group) group.classList.add('invalid');
    var el = document.getElementById(errorId);
    if (el) el.textContent = message;
  }

  function clearGroupError(groupId, errorId) {
    var group = document.getElementById(groupId);
    if (group) group.classList.remove('invalid');
    var el = document.getElementById(errorId);
    if (el) el.textContent = '';
  }

  function getRadioValue(name) {
    var checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : null;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // --- Live validation ---

  form.querySelector('#prenom').addEventListener('input', function () {
    if (this.value.trim()) clearError('prenom');
  });

  form.querySelector('#email').addEventListener('input', function () {
    if (isValidEmail(this.value.trim())) clearError('email');
  });

  ['intention', 'notification', 'similaires'].forEach(function (name) {
    form.querySelectorAll('input[name="' + name + '"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        clearGroupError(name + '-group', name + '-error');
      });
    });
  });

  // --- Envoi via fonction Netlify (le token reste côté serveur) ---

  function sendToAirtable(payload) {
    return fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (res) {
      if (!res.ok) return res.json().then(function (e) { throw e; });
      return res.json();
    });
  }

  // --- Form submit ---

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var valid = true;

    var prenom = form.querySelector('#prenom').value.trim();
    if (!prenom) {
      showError('prenom', 'Votre prénom est requis.');
      valid = false;
    } else {
      clearError('prenom');
    }

    var email = form.querySelector('#email').value.trim();
    if (!email) {
      showError('email', 'Votre email est requis.');
      valid = false;
    } else if (!isValidEmail(email)) {
      showError('email', 'Veuillez saisir un email valide.');
      valid = false;
    } else {
      clearError('email');
    }

    if (!getRadioValue('intention')) {
      showGroupError('intention-group', 'intention-error', 'Veuillez sélectionner une option.');
      valid = false;
    } else {
      clearGroupError('intention-group', 'intention-error');
    }

    if (!getRadioValue('notification')) {
      showGroupError('notification-group', 'notification-error', 'Veuillez indiquer votre préférence.');
      valid = false;
    } else {
      clearGroupError('notification-group', 'notification-error');
    }

    if (!getRadioValue('similaires')) {
      showGroupError('similaires-group', 'similaires-error', 'Veuillez indiquer votre préférence.');
      valid = false;
    } else {
      clearGroupError('similaires-group', 'similaires-error');
    }

    if (!valid) {
      var firstError = form.querySelector('.invalid, .radio-group.invalid');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Build payload (mappings gérés côté serveur dans netlify/functions/submit.js)
    var payload = {
      prenom:       prenom,
      email:        email,
      intention:    getRadioValue('intention'),
      notification: getRadioValue('notification'),
      similaires:   getRadioValue('similaires'),
      inspiration:  document.getElementById('inspiration').value,
      groupe:       getRadioValue('groupe'),
      periode:      getRadioValue('periode'),
      message:      form.querySelector('#message').value.trim(),
    };

    // Disable button during request
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours…';

    sendToAirtable(payload)
      .then(function () {
        form.classList.add('hidden');
        confirmation.classList.remove('hidden');
        confirmation.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(function (err) {
        console.error('[we-rando] Airtable error:', err);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Je veux être informé en avant-première →';
        alert("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
      });
  });
})();
