// /server/models/patientValidator.js
// Validação pura do recurso Patient (FHIR mínimo) conforme decisões do grupo.
// - Campos mínimos obrigatórios: resourceType, name (>=1), gender, birthDate
// - identifier no formato FHIR-like: identifier: [{ value: <ID> }]
// - POST ignora identifier do cliente (validator remove se vier)
// - PUT exige identifier[0].value == idFromUrl, senão 400
// - 400: body não é objeto JSON válido / identifier inválido no PUT
// - 422: regra de negócio / campos mínimos / resourceType / valores inválidos

function deepClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return null;
  }
}

function isPlainObject(x) {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function trimOrEmpty(v) {
  return typeof v === "string" ? v.trim() : "";
}

function isValidBirthDate(iso) {
  // Formato YYYY-MM-DD
  if (typeof iso !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;

  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) return false;

  // Regra simples: não permitir datas futuras
  const today = new Date();
  const dtLocal = new Date(y, m - 1, d);
  if (dtLocal > today) return false;

  return true;
}

function normalizeName(name) {
  // Aceita várias formas e normaliza para array de { text }
  if (!name) return [];
  if (typeof name === "string") {
    const t = name.trim();
    return t ? [{ text: t }] : [];
  }
  if (Array.isArray(name)) {
    return name
      .map(n => {
        if (typeof n === "string") {
          const t = n.trim();
          return t ? { text: t } : null;
        }
        if (isPlainObject(n)) {
          const text = trimOrEmpty(n.text);
          const family = trimOrEmpty(n.family);
          const given = Array.isArray(n.given) ? n.given.map(trimOrEmpty).filter(Boolean) : [];
          if (text || family || given.length > 0) {
            const out = {};
            if (text) out.text = text;
            if (family) out.family = family;
            if (given.length > 0) out.given = given;
            return out;
          }
        }
        return null;
      })
      .filter(Boolean);
  }
  if (isPlainObject(name)) {
    const text = trimOrEmpty(name.text);
    const family = trimOrEmpty(name.family);
    const given = Array.isArray(name.given) ? name.given.map(trimOrEmpty).filter(Boolean) : [];
    if (text || family || given.length > 0) {
      const out = {};
      if (text) out.text = text;
      if (family) out.family = family;
      if (given.length > 0) out.given = given;
      return [out];
    }
  }
  return [];
}

function normalizeGender(g) {
  const v = trimOrEmpty(g).toLowerCase();
  return v;
}

function genderAllowed(g) {
  return ["male", "female", "other", "unknown"].includes(g);
}

/**
 * normalizePatient(patient)
 * - Clona o objeto.
 * - Garante tipos básicos.
 * - Remove identifier no CREATE (POST) depois em validateForCreate.
 * - Não valida; apenas normaliza.
 */
function normalizePatient(patient) {
  const clone = deepClone(patient);
  if (!isPlainObject(clone)) return null;

  const norm = {};

  norm.resourceType = trimOrEmpty(clone.resourceType) || clone.resourceType;

  // name mínimo
  norm.name = normalizeName(clone.name);

  // gender mínimo
  norm.gender = normalizeGender(clone.gender);

  // birthDate mínimo
  norm.birthDate = trimOrEmpty(clone.birthDate);

  // active opcional
  if (typeof clone.active === "boolean") {
    norm.active = clone.active;
  } else if (typeof clone.active === "string") {
    norm.active = clone.active.trim().toLowerCase() === "true";
  }

  // telecom/address opcionais (mantém se vierem corretos)
  if (Array.isArray(clone.telecom)) norm.telecom = clone.telecom;
  if (Array.isArray(clone.address)) norm.address = clone.address;

  // identifier opcional (só PUT usa)
  if (Array.isArray(clone.identifier)) norm.identifier = clone.identifier;

  return norm;
}

/**
 * validateForCreate(patient)
 * - Para POST /Patient
 * - Ignora identifier do cliente (remove se vier)
 */
function validateForCreate(patient) {
  const normalized = normalizePatient(patient);
  if (!normalized) {
    return { ok: false, status: 400, message: "Body must be a JSON object." };
  }

  // POST ignora identifier enviado pelo cliente
  delete normalized.identifier;

  // Regras mínimas
  if (normalized.resourceType !== "Patient") {
    return { ok: false, status: 422, message: "resourceType must be 'Patient'." };
  }

  if (!Array.isArray(normalized.name) || normalized.name.length === 0) {
    return { ok: false, status: 422, message: "Patient must have at least one name." };
  }

  if (!normalized.gender) {
    return { ok: false, status: 422, message: "Patient.gender is required." };
  }
  if (!genderAllowed(normalized.gender)) {
    return { ok: false, status: 422, message: "Patient.gender must be male, female, other, or unknown." };
  }

  if (!normalized.birthDate) {
    return { ok: false, status: 422, message: "Patient.birthDate is required." };
  }
  if (!isValidBirthDate(normalized.birthDate)) {
    return { ok: false, status: 422, message: "Patient.birthDate must be a valid past date in YYYY-MM-DD." };
  }

  return { ok: true, patient: normalized };
}

/**
 * validateForUpdate(patient, idFromUrl)
 * - Para PUT /Patient/<ID>
 * - identifier[0].value deve existir e ser igual ao idFromUrl, senão 400
 */
function validateForUpdate(patient, idFromUrl) {
  const normalized = normalizePatient(patient);
  if (!normalized) {
    return { ok: false, status: 400, message: "Body must be a JSON object." };
  }

  const urlId = Number(idFromUrl);
  if (!Number.isInteger(urlId) || urlId <= 0) {
    return { ok: false, status: 400, message: "URL id must be a positive integer." };
  }

  // Verificar identifier obrigatório no PUT
  const identArr = normalized.identifier;
  if (!Array.isArray(identArr) || identArr.length === 0) {
    return { ok: false, status: 400, message: "Patient.identifier is required for update." };
  }

  const identVal = Number(identArr[0]?.value);
  if (!Number.isInteger(identVal) || identVal <= 0) {
    return {
      ok: false,
      status: 400,
      message: "Patient.identifier[0].value must be a positive integer."
    };
  }

  if (identVal !== urlId) {
    return {
      ok: false,
      status: 400,
      message: "Patient.identifier[0].value must match the id in the URL."
    };
  }

  // Regras mínimas iguais ao create
  if (normalized.resourceType !== "Patient") {
    return { ok: false, status: 422, message: "resourceType must be 'Patient'." };
  }

  if (!Array.isArray(normalized.name) || normalized.name.length === 0) {
    return { ok: false, status: 422, message: "Patient must have at least one name." };
  }

  if (!normalized.gender) {
    return { ok: false, status: 422, message: "Patient.gender is required." };
  }
  if (!genderAllowed(normalized.gender)) {
    return { ok: false, status: 422, message: "Patient.gender must be male, female, other, or unknown." };
  }

  if (!normalized.birthDate) {
    return { ok: false, status: 422, message: "Patient.birthDate is required." };
  }
  if (!isValidBirthDate(normalized.birthDate)) {
    return { ok: false, status: 422, message: "Patient.birthDate must be a valid past date in YYYY-MM-DD." };
  }

  return { ok: true, patient: normalized };
}

module.exports = {
  normalizePatient,
  validateForCreate,
  validateForUpdate
};
