// we-rando — "Je veux être informé" form handler

(function () {
  // ─── Airtable config ───────────────────────────────────────────────────────
  // Remplacez VOTRE_TOKEN par un Personal Access Token Airtable
  // (airtable.com/create/tokens) avec le scope data.records:write sur la base.
  // En production, ne jamais exposer ce token côté client — passez par un proxy.
  var AIRTABLE_TOKEN = 'VOTRE_TOKEN';
  var AIRTABLE_BASE  = 'appY20zCunDeN9qLS';
  var AIRTABLE_TABLE = 'tblxVBBDsNJjDMayp';
  // ───────────────────────────────────────────────────────────────────────────

  // Correspondances valeurs form → libellés Airtable
  var INTENTION_MAP = {
    projet_6mois:    'Projet concret dans les 6 mois',
    annee_prochaine: "Projet pour l'année prochaine",
    en_maturation:   'Idée en cours de maturation',
    curieux:         'Juste pour être au courant',
  };

  var GROUPE_MAP = {
    solo:       'Solo',
    duo:        'Duo',
    amis:       'Entre amis',
    famille:    'En famille',
    entreprise: 'Entreprise / CE',
    nsp:        'Je ne sais pas encore',
  };

  var PERIODE_MAP = {
    printemps: 'Printemps',
    ete:       'Été',
    automne:   'Automne',
    hiver:     'Hiver',
    nsp:       'Pas encore défini',
  };

  var NOTIFICATION_MAP = {
    email_seul:  'Email dès publication',
    email_appel: 'Email + appel Franck',
    auto:        'Je reviendrai consulter',
  };

  var SIMILAIRES_MAP = {
    similaires:        'Oui — même destination / même esprit',
    toutes:            'Oui — toute nouveauté we-rando',
    uniquement_celle_ci: 'Non — uniquement celle-ci',
  };

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

  // --- Airtable submission ---

  function sendToAirtable(fields) {
    return fetch(
      'https://api.airtable.com/v0/' + AIRTABLE_BASE + '/' + AIRTABLE_TABLE,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + AIRTABLE_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: [{ fields: fields }] }),
      }
    ).then(function (res) {
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

    // Build Airtable fields object
    var fields = {
      'Prénom':                   prenom,
      'Email':                    email,
      'Intention':                INTENTION_MAP[getRadioValue('intention')],
      'Préférence de notification': NOTIFICATION_MAP[getRadioValue('notification')],
      'Inspirations similaires':  SIMILAIRES_MAP[getRadioValue('similaires')],
      'Date soumission':          new Date().toISOString(),
    };

    var inspiration = document.getElementById('inspiration').value;
    if (inspiration) fields['Inspiration'] = inspiration;

    var groupe = getRadioValue('groupe');
    if (groupe) fields['Type de groupe'] = GROUPE_MAP[groupe];

    var periode = getRadioValue('periode');
    if (periode) fields['Période souhaitée'] = PERIODE_MAP[periode];

    var message = form.querySelector('#message').value.trim();
    if (message) fields['Message pour Franck'] = message;

    // Disable button during request
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours…';

    sendToAirtable(fields)
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
