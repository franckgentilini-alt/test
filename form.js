// we-rando — "Je veux être informé" form handler

(function () {
  // Pre-fill hidden inspiration field from URL param ?inspiration=nom-du-sejour
  const params = new URLSearchParams(window.location.search);
  const inspirationParam = params.get('inspiration');
  if (inspirationParam) {
    document.getElementById('inspiration').value = inspirationParam;
  }

  const form = document.getElementById('we-rando-form');
  const confirmation = document.getElementById('confirmation');

  // --- Validation helpers ---

  function showError(fieldId, message) {
    const el = document.getElementById(fieldId + '-error');
    if (el) el.textContent = message;
    const input = document.getElementById(fieldId);
    if (input) input.classList.add('invalid');
  }

  function clearError(fieldId) {
    const el = document.getElementById(fieldId + '-error');
    if (el) el.textContent = '';
    const input = document.getElementById(fieldId);
    if (input) input.classList.remove('invalid');
  }

  function showGroupError(groupId, errorId, message) {
    const group = document.getElementById(groupId);
    if (group) group.classList.add('invalid');
    const el = document.getElementById(errorId);
    if (el) el.textContent = message;
  }

  function clearGroupError(groupId, errorId) {
    const group = document.getElementById(groupId);
    if (group) group.classList.remove('invalid');
    const el = document.getElementById(errorId);
    if (el) el.textContent = '';
  }

  function getRadioValue(name) {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : null;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // --- Live validation on inputs ---

  form.querySelector('#prenom').addEventListener('input', function () {
    if (this.value.trim()) clearError('prenom');
  });

  form.querySelector('#email').addEventListener('input', function () {
    if (isValidEmail(this.value.trim())) clearError('email');
  });

  ['intention', 'notification', 'similaires'].forEach(function (name) {
    form.querySelectorAll(`input[name="${name}"]`).forEach(function (radio) {
      radio.addEventListener('change', function () {
        clearGroupError(name + '-group', name + '-error');
      });
    });
  });

  // --- Form submission ---

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    let valid = true;

    // Prénom
    const prenom = form.querySelector('#prenom').value.trim();
    if (!prenom) {
      showError('prenom', 'Votre prénom est requis.');
      valid = false;
    } else {
      clearError('prenom');
    }

    // Email
    const email = form.querySelector('#email').value.trim();
    if (!email) {
      showError('email', 'Votre email est requis.');
      valid = false;
    } else if (!isValidEmail(email)) {
      showError('email', 'Veuillez saisir un email valide.');
      valid = false;
    } else {
      clearError('email');
    }

    // Intention (Q3)
    if (!getRadioValue('intention')) {
      showGroupError('intention-group', 'intention-error', 'Veuillez sélectionner une option.');
      valid = false;
    } else {
      clearGroupError('intention-group', 'intention-error');
    }

    // Notification (Q7)
    if (!getRadioValue('notification')) {
      showGroupError('notification-group', 'notification-error', 'Veuillez indiquer votre préférence.');
      valid = false;
    } else {
      clearGroupError('notification-group', 'notification-error');
    }

    // Similaires (Q8)
    if (!getRadioValue('similaires')) {
      showGroupError('similaires-group', 'similaires-error', 'Veuillez indiquer votre préférence.');
      valid = false;
    } else {
      clearGroupError('similaires-group', 'similaires-error');
    }

    if (!valid) {
      // Scroll to first error
      const firstError = form.querySelector('.invalid, .radio-group.invalid');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Build payload
    const payload = {
      inspiration: document.getElementById('inspiration').value,
      prenom,
      email,
      intention: getRadioValue('intention'),
      groupe: getRadioValue('groupe'),
      periode: getRadioValue('periode'),
      message: form.querySelector('#message').value.trim(),
      notification: getRadioValue('notification'),
      similaires: getRadioValue('similaires'),
      submitted_at: new Date().toISOString(),
    };

    console.info('[we-rando] Form payload:', payload);

    // TODO: replace with real API call (Fillout webhook / backend endpoint)
    // fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

    // Show confirmation
    form.classList.add('hidden');
    confirmation.classList.remove('hidden');
    confirmation.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
