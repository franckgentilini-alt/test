const AIRTABLE_BASE  = 'appY20zCunDeN9qLS';
const AIRTABLE_TABLE = 'tblxVBBDsNJjDMayp';

const INTENTION_MAP = {
  projet_6mois:    'Projet concret dans les 6 mois',
  annee_prochaine: "Projet pour l'année prochaine",
  en_maturation:   'Idée en cours de maturation',
  curieux:         'Juste pour être au courant',
};

const GROUPE_MAP = {
  solo:       'Solo',
  duo:        'Duo',
  amis:       'Entre amis',
  famille:    'En famille',
  entreprise: 'Entreprise / CE',
  nsp:        'Je ne sais pas encore',
};

const PERIODE_MAP = {
  printemps: 'Printemps',
  ete:       'Été',
  automne:   'Automne',
  hiver:     'Hiver',
  nsp:       'Pas encore défini',
};

const NOTIFICATION_MAP = {
  email_seul:  'Email dès publication',
  email_appel: 'Email + appel Franck',
  auto:        'Je reviendrai consulter',
};

const SIMILAIRES_MAP = {
  similaires:           'Oui — même destination / même esprit',
  toutes:               'Oui — toute nouveauté we-rando',
  uniquement_celle_ci:  'Non — uniquement celle-ci',
};

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Token manquant' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON invalide' }) };
  }

  const fields = {
    'Prénom':                    data.prenom,
    'Email':                     data.email,
    'Intention':                 INTENTION_MAP[data.intention],
    'Préférence de notification': NOTIFICATION_MAP[data.notification],
    'Inspirations similaires':   SIMILAIRES_MAP[data.similaires],
    'Date soumission':           new Date().toISOString(),
  };

  if (data.inspiration) fields['Inspiration']       = data.inspiration;
  if (data.groupe)      fields['Type de groupe']    = GROUPE_MAP[data.groupe];
  if (data.periode)     fields['Période souhaitée'] = PERIODE_MAP[data.periode];
  if (data.message)     fields['Message pour Franck'] = data.message;

  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records: [{ fields }] }),
    }
  );

  const json = await res.json();

  if (!res.ok) {
    return { statusCode: res.status, body: JSON.stringify(json) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  };
};
