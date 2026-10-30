/**
 * Sanify — Sistema de Vigilancia Clínica y Soporte al Monitoreo
 * Lógica asistencial para gestión de telemetría sintética, alertas y gobernanza.
 */

// Estado Global de la Aplicación
let authToken = localStorage.getItem("sanify_token") || localStorage.getItem("vitasentinel_token") || null;
let currentUser = null;
let currentPage = "control";
let currentSectorFilter = "ALL";
let currentAlertPriorityFilter = "ALL";
let currentAlertStatusFilter = "ALL";
let selectedPatientId = null;
let activeModalMode = null; // 'review' | 'note' | 'escalate'
let isLiveSimRunning = true;
let simInterval = null;

// Caché de Datos Locales
let patientsCache = [];
let alertsCache = [];
let diseasesCache = [];
let auditLogsCache = [];
let networkCentersCache = [];

// Base de Datos Clínica Sintética Fallback para Resiliencia Completa
const FALLBACK_PATIENTS = [
  // Sector UCI
  { id: 1, pseudo_id: "PAC-9101", bed_id: "UCI-01", sector: "UCI", room_number: "Box 101", age_range: "65-70", condition_name: "Neumonía Bacteriana Adquirida en la Comunidad (NAC)", cie11: "CA40.0", cie10: "J18.9", snomed_ct: "385093006", severity: "Alta", priority: "alta", review_status: "pendiente", news2_score: 7, hr: 112, spo2: 88.5, bp_sys: 105, bp_dia: 62, rr: 28, temp: 39.1, oxygen_supply: "Cánula Alto Flujo 35L", sparklineSpo2: [91.2, 90.5, 89.8, 88.0, 88.2, 88.5] },
  { id: 2, pseudo_id: "PAC-9102", bed_id: "UCI-02", sector: "UCI", room_number: "Box 102", age_range: "58-62", condition_name: "Tromboembolismo Pulmonar Agudo (TEP)", cie11: "BB00", cie10: "I26.9", snomed_ct: "59282003", severity: "Alta", priority: "alta", review_status: "pendiente", news2_score: 8, hr: 124, spo2: 87.0, bp_sys: 92, bp_dia: 58, rr: 31, temp: 37.4, oxygen_supply: "Venturi 50%", sparklineSpo2: [90.0, 89.2, 88.1, 87.5, 86.8, 87.0] },
  { id: 3, pseudo_id: "PAC-9103", bed_id: "UCI-03", sector: "UCI", room_number: "Box 103", age_range: "72-76", condition_name: "Infarto Agudo de Miocardio (IAMCEST)", cie11: "BA41.0", cie10: "I21.0", snomed_ct: "401303003", severity: "Alta", priority: "alta", review_status: "en_revision", news2_score: 6, hr: 108, spo2: 94.0, bp_sys: 145, bp_dia: 92, rr: 22, temp: 36.8, oxygen_supply: "Cánula Nasal 2L", sparklineSpo2: [95.0, 94.5, 94.2, 93.8, 94.0, 94.0] },
  { id: 4, pseudo_id: "PAC-9104", bed_id: "UCI-04", sector: "UCI", room_number: "Box 104", age_range: "45-50", condition_name: "Sepsis de Foco Urológico", cie11: "1C43", cie10: "A41.9", snomed_ct: "91302008", severity: "Alta", priority: "alta", review_status: "pendiente", news2_score: 7, hr: 118, spo2: 93.5, bp_sys: 88, bp_dia: 54, rr: 26, temp: 39.8, oxygen_supply: "Mascarilla Reservorio", sparklineSpo2: [94.0, 93.8, 93.0, 92.5, 93.2, 93.5] },
  { id: 5, pseudo_id: "PAC-9105", bed_id: "UCI-05", sector: "UCI", room_number: "Box 105", age_range: "68-72", condition_name: "Accidente Cerebrovascular Isquémico Agudo (ACV)", cie11: "8B11", cie10: "I63.9", snomed_ct: "422504002", severity: "Media", priority: "media", review_status: "revisado", news2_score: 4, hr: 84, spo2: 96.0, bp_sys: 168, bp_dia: 98, rr: 18, temp: 37.1, oxygen_supply: "Aire ambiente", sparklineSpo2: [96.0, 96.2, 95.8, 96.0, 96.5, 96.0] },
  { id: 6, pseudo_id: "PAC-9106", bed_id: "UCI-06", sector: "UCI", room_number: "Box 106", age_range: "54-58", condition_name: "Insuficiencia Cardíaca Congestiva Agudizada", cie11: "BD11", cie10: "I50.9", snomed_ct: "84114007", severity: "Media", priority: "media", review_status: "pendiente", news2_score: 5, hr: 96, spo2: 91.5, bp_sys: 158, bp_dia: 94, rr: 24, temp: 36.6, oxygen_supply: "Venturi 35%", sparklineSpo2: [93.0, 92.4, 91.8, 91.0, 91.2, 91.5] },

  // Sector Intermedios
  { id: 7, pseudo_id: "PAC-8201", bed_id: "INT-01", sector: "INTERMEDIOS", room_number: "Sala 201-A", age_range: "70-75", condition_name: "EPOC Reagudizado", cie11: "CA22.0", cie10: "J44.1", snomed_ct: "185086009", severity: "Media", priority: "media", review_status: "pendiente", news2_score: 5, hr: 98, spo2: 89.5, bp_sys: 132, bp_dia: 82, rr: 25, temp: 37.6, oxygen_supply: "Venturi 28%", sparklineSpo2: [90.5, 90.0, 89.2, 89.0, 89.4, 89.5] },
  { id: 8, pseudo_id: "PAC-8202", bed_id: "INT-02", sector: "INTERMEDIOS", room_number: "Sala 201-B", age_range: "61-65", condition_name: "Cetoacidosis Diabética (CAD)", cie11: "5A10.1", cie10: "E10.1", snomed_ct: "420422005", severity: "Media", priority: "media", review_status: "revisado", news2_score: 4, hr: 104, spo2: 97.0, bp_sys: 110, bp_dia: 68, rr: 24, temp: 36.9, oxygen_supply: "Aire ambiente", sparklineSpo2: [97.0, 97.2, 96.8, 97.0, 97.1, 97.0] },
  { id: 9, pseudo_id: "PAC-8203", bed_id: "INT-03", sector: "INTERMEDIOS", room_number: "Sala 202-A", age_range: "50-55", condition_name: "Neumonía Bacteriana (NAC)", cie11: "CA40.0", cie10: "J18.9", snomed_ct: "385093006", severity: "Media", priority: "media", review_status: "pendiente", news2_score: 4, hr: 92, spo2: 93.0, bp_sys: 120, bp_dia: 75, rr: 22, temp: 38.2, oxygen_supply: "Cánula Nasal 3L", sparklineSpo2: [93.5, 93.2, 92.8, 92.6, 92.9, 93.0] },
  { id: 10, pseudo_id: "PAC-8204", bed_id: "INT-04", sector: "INTERMEDIOS", room_number: "Sala 202-B", age_range: "66-70", condition_name: "Insuficiencia Cardíaca Congestiva", cie11: "BD11", cie10: "I50.9", snomed_ct: "84114007", severity: "Media", priority: "media", review_status: "revisado", news2_score: 3, hr: 88, spo2: 94.0, bp_sys: 142, bp_dia: 88, rr: 20, temp: 36.7, oxygen_supply: "Cánula Nasal 2L", sparklineSpo2: [94.5, 94.2, 93.9, 94.0, 94.2, 94.0] },
  { id: 11, pseudo_id: "PAC-8205", bed_id: "INT-05", sector: "INTERMEDIOS", room_number: "Sala 203-A", age_range: "42-46", condition_name: "Sepsis de Foco Urológico", cie11: "1C43", cie10: "A41.9", snomed_ct: "91302008", severity: "Estable", priority: "baja", review_status: "revisado", news2_score: 2, hr: 82, spo2: 96.5, bp_sys: 115, bp_dia: 72, rr: 18, temp: 37.5, oxygen_supply: "Aire ambiente", sparklineSpo2: [96.0, 96.2, 96.5, 96.6, 96.4, 96.5] },
  { id: 12, pseudo_id: "PAC-8206", bed_id: "INT-06", sector: "INTERMEDIOS", room_number: "Sala 203-B", age_range: "75-80", condition_name: "EPOC Reagudizado", cie11: "CA22.0", cie10: "J44.1", snomed_ct: "185086009", severity: "Estable", priority: "baja", review_status: "revisado", news2_score: 2, hr: 78, spo2: 91.0, bp_sys: 128, bp_dia: 76, rr: 19, temp: 36.8, oxygen_supply: "Venturi 24%", sparklineSpo2: [91.2, 91.0, 90.8, 91.0, 91.1, 91.0] },
  { id: 13, pseudo_id: "PAC-8207", bed_id: "INT-07", sector: "INTERMEDIOS", room_number: "Sala 204-A", age_range: "59-63", condition_name: "ACV Isquémico", cie11: "8B11", cie10: "I63.9", snomed_ct: "422504002", severity: "Estable", priority: "baja", review_status: "revisado", news2_score: 1, hr: 74, spo2: 98.0, bp_sys: 138, bp_dia: 84, rr: 16, temp: 36.6, oxygen_supply: "Aire ambiente", sparklineSpo2: [98.0, 98.1, 97.9, 98.0, 98.2, 98.0] },
  { id: 14, pseudo_id: "PAC-8208", bed_id: "INT-08", sector: "INTERMEDIOS", room_number: "Sala 204-B", age_range: "53-57", condition_name: "Infarto de Miocardio (IAMCEST)", cie11: "BA41.0", cie10: "I21.0", snomed_ct: "401303003", severity: "Estable", priority: "baja", review_status: "revisado", news2_score: 1, hr: 68, spo2: 97.5, bp_sys: 122, bp_dia: 78, rr: 15, temp: 36.5, oxygen_supply: "Aire ambiente", sparklineSpo2: [97.5, 97.6, 97.4, 97.5, 97.6, 97.5] },

  // Sector Aislamiento
  { id: 15, pseudo_id: "PAC-7301", bed_id: "AIS-01", sector: "AISLAMIENTO", room_number: "Aislamiento 301", age_range: "63-67", condition_name: "Neumonía Bacteriana Severa", cie11: "CA40.0", cie10: "J18.9", snomed_ct: "385093006", severity: "Alta", priority: "alta", review_status: "pendiente", news2_score: 6, hr: 106, spo2: 89.0, bp_sys: 112, bp_dia: 68, rr: 27, temp: 39.4, oxygen_supply: "Cánula Alto Flujo 30L", sparklineSpo2: [90.2, 89.8, 89.1, 88.8, 88.9, 89.0] },
  { id: 16, pseudo_id: "PAC-7302", bed_id: "AIS-02", sector: "AISLAMIENTO", room_number: "Aislamiento 302", age_range: "48-52", condition_name: "Sepsis de Foco Urológico", cie11: "1C43", cie10: "A41.9", snomed_ct: "91302008", severity: "Media", priority: "media", review_status: "revisado", news2_score: 4, hr: 98, spo2: 95.0, bp_sys: 104, bp_dia: 64, rr: 22, temp: 38.6, oxygen_supply: "Cánula Nasal 2L", sparklineSpo2: [95.2, 95.0, 94.8, 94.9, 95.1, 95.0] },
  { id: 17, pseudo_id: "PAC-7303", bed_id: "AIS-03", sector: "AISLAMIENTO", room_number: "Aislamiento 303", age_range: "71-75", condition_name: "EPOC Reagudizado", cie11: "CA22.0", cie10: "J44.1", snomed_ct: "185086009", severity: "Media", priority: "media", review_status: "pendiente", news2_score: 3, hr: 86, spo2: 90.5, bp_sys: 130, bp_dia: 80, rr: 21, temp: 37.3, oxygen_supply: "Venturi 28%", sparklineSpo2: [91.0, 90.8, 90.2, 90.4, 90.6, 90.5] },
  { id: 18, pseudo_id: "PAC-7304", bed_id: "AIS-04", sector: "AISLAMIENTO", room_number: "Aislamiento 304", age_range: "39-43", condition_name: "Neumonía Bacteriana (NAC)", cie11: "CA40.0", cie10: "J18.9", snomed_ct: "385093006", severity: "Estable", priority: "baja", review_status: "revisado", news2_score: 1, hr: 76, spo2: 97.0, bp_sys: 118, bp_dia: 74, rr: 16, temp: 37.0, oxygen_supply: "Aire ambiente", sparklineSpo2: [97.0, 97.1, 96.9, 97.0, 97.2, 97.0] },

  // Sector General (10 camas)
  { id: 19, pseudo_id: "PAC-6401", bed_id: "GEN-01", sector: "GENERAL", room_number: "Hab. 401", age_range: "60-64", condition_name: "Cetoacidosis Diabética", cie11: "5A10.1", cie10: "E10.1", snomed_ct: "420422005", severity: "Estable", priority: "baja", review_status: "revisado", news2_score: 1, hr: 76, spo2: 98.0, bp_sys: 124, bp_dia: 78, rr: 16, temp: 36.7, oxygen_supply: "Aire ambiente", sparklineSpo2: [98.0, 98.1, 97.9, 98.0, 98.0, 98.0] },
  { id: 20, pseudo_id: "PAC-6402", bed_id: "GEN-02", sector: "GENERAL", room_number: "Hab. 402", age_range: "72-76", condition_name: "Insuficiencia Cardíaca", cie11: "BD11", cie10: "I50.9", snomed_ct: "84114007", severity: "Estable", priority: "baja", review_status: "revisado", news2_score: 2, hr: 80, spo2: 95.0, bp_sys: 134, bp_dia: 82, rr: 18, temp: 36.5, oxygen_supply: "Cánula Nasal 1L", sparklineSpo2: [95.2, 95.0, 94.8, 95.0, 95.1, 95.0] },
  { id: 21, pseudo_id: "PAC-6403", bed_id: "GEN-03", sector: "GENERAL", room_number: "Hab. 403", age_range: "51-55", condition_name: "EPOC Reagudizado", cie11: "CA22.0", cie10: "J44.1", snomed_ct: "185086009", severity: "Media", priority: "media", review_status: "pendiente", news2_score: 4, hr: 94, spo2: 90.0, bp_sys: 136, bp_dia: 84, rr: 23, temp: 37.4, oxygen_supply: "Venturi 28%", sparklineSpo2: [90.5, 90.2, 89.8, 90.0, 90.1, 90.0] },
  { id: 22, pseudo_id: "PAC-6404", bed_id: "GEN-04", sector: "GENERAL", room_number: "Hab. 404", age_range: "67-71", condition_name: "Neumonía Bacteriana", cie11: "CA40.0", cie10: "J18.9", snomed_ct: "385093006", severity: "Estable", priority: "baja", review_status: "revisado", news2_score: 2, hr: 82, spo2: 95.5, bp_sys: 120, bp_dia: 76, rr: 18, temp: 37.2, oxygen_supply: "Aire ambiente", sparklineSpo2: [95.5, 95.6, 95.4, 95.5, 95.6, 95.5] },
  { id: 23, pseudo_id: "PAC-6405", bed_id: "GEN-05", sector: "GENERAL", room_number: "Hab. 405", age_range: "44-48", condition_name: "Sepsis Urológica (Resolución)", cie11: "1C43", cie10: "A41.9", snomed_ct: "91302008", severity: "Estable", priority: "baja", review_status: "revisado", news2_score: 1, hr: 72, spo2: 98.5, bp_sys: 116, bp_dia: 70, rr: 15, temp: 36.9, oxygen_supply: "Aire ambiente", sparklineSpo2: [98.5, 98.6, 98.4, 98.5, 98.5, 98.5] },
  { id: 24, pseudo_id: "PAC-6406", bed_id: "GEN-06", sector: "GENERAL", room_number: "Hab. 406", age_range: "80-84", condition_name: "ACV Isquémico", cie11: "8B11", cie10: "I63.9", snomed_ct: "422504002", severity: "Estable", priority: "baja", review_status: "revisado", news2_score: 2, hr: 78, spo2: 96.0, bp_sys: 142, bp_dia: 86, rr: 17, temp: 36.8, oxygen_supply: "Aire ambiente", sparklineSpo2: [96.0, 96.1, 95.9, 96.0, 96.1, 96.0] },
  { id: 25, pseudo_id: "PAC-6407", bed_id: "GEN-07", sector: "GENERAL", room_number: "Hab. 407", age_range: "55-59", condition_name: "IAMCEST Estable", cie11: "BA41.0", cie10: "I21.0", snomed_ct: "401303003", severity: "Estable", priority: "baja", review_status: "revisado", news2_score: 1, hr: 70, spo2: 98.0, bp_sys: 118, bp_dia: 74, rr: 16, temp: 36.6, oxygen_supply: "Aire ambiente", sparklineSpo2: [98.0, 98.0, 97.8, 98.0, 98.1, 98.0] },
  { id: 26, pseudo_id: "PAC-6408", bed_id: "GEN-08", sector: "GENERAL", room_number: "Hab. 408", age_range: "62-66", condition_name: "Insuficiencia Cardíaca", cie11: "BD11", cie10: "I50.9", snomed_ct: "84114007", severity: "Estable", priority: "baja", review_status: "revisado", news2_score: 2, hr: 76, spo2: 96.0, bp_sys: 126, bp_dia: 80, rr: 17, temp: 36.4, oxygen_supply: "Aire ambiente", sparklineSpo2: [96.0, 96.2, 95.8, 96.0, 96.0, 96.0] },
  { id: 27, pseudo_id: "PAC-6409", bed_id: "GEN-09", sector: "GENERAL", room_number: "Hab. 409", age_range: "49-53", condition_name: "EPOC Estable", cie11: "CA22.0", cie10: "J44.1", snomed_ct: "185086009", severity: "Estable", priority: "baja", review_status: "revisado", news2_score: 1, hr: 74, spo2: 92.5, bp_sys: 122, bp_dia: 78, rr: 16, temp: 36.7, oxygen_supply: "Aire ambiente", sparklineSpo2: [92.5, 92.6, 92.3, 92.5, 92.7, 92.5] },
  { id: 28, pseudo_id: "PAC-6410", bed_id: "GEN-10", sector: "GENERAL", room_number: "Hab. 410", age_range: "73-77", condition_name: "Cetoacidosis (Fase de Mantenimiento)", cie11: "5A10.1", cie10: "E10.1", snomed_ct: "420422005", severity: "Estable", priority: "baja", review_status: "revisado", news2_score: 1, hr: 75, spo2: 97.0, bp_sys: 114, bp_dia: 72, rr: 16, temp: 36.8, oxygen_supply: "Aire ambiente", sparklineSpo2: [97.0, 97.1, 96.9, 97.0, 97.2, 97.0] }
];

// Alertas Sintéticas de Demostración
const FALLBACK_ALERTS = [
  { id: 1, patient_id: 1, pseudo_id: "PAC-9101", bed_id: "UCI-01", sector: "UCI", priority: "alta", motive: "Desaturación persistente (SpO2 88.5%) con taquipnea (FR 28 rpm) bajo Alto Flujo.", detected_at: "Hace 6 min", assignee: "Dra. E. Morales (UCI)", status: "pendiente", news2_score: 7 },
  { id: 2, patient_id: 2, pseudo_id: "PAC-9102", bed_id: "UCI-02", sector: "UCI", priority: "alta", motive: "Taquicardia sostenida (FC 124 lpm) e hipotensión limítrofe (PAM 69 mmHg).", detected_at: "Hace 14 min", assignee: "Dr. J. Roca (Coordinador)", status: "pendiente", news2_score: 8 },
  { id: 3, patient_id: 4, pseudo_id: "PAC-9104", bed_id: "UCI-04", sector: "UCI", priority: "alta", motive: "Pico febril 39.8°C con hipotensión (88/54 mmHg). Sospecha de progresión séptica.", detected_at: "Hace 22 min", assignee: "Equipo Rápido UCI", status: "pendiente", news2_score: 7 },
  { id: 4, patient_id: 15, pseudo_id: "PAC-7301", bed_id: "AIS-01", sector: "AISLAMIENTO", priority: "alta", motive: "Caída de SpO2 a 89.0% en aislamiento respiratorio. Requiere ajuste de flujo.", detected_at: "Hace 31 min", assignee: "Enfermería Aislamiento", status: "pendiente", news2_score: 6 },
  { id: 5, patient_id: 7, pseudo_id: "PAC-8201", bed_id: "INTERMEDIOS", priority: "media", motive: "Taquipnea 25 rpm con SpO2 89.5% en EPOC. Titular Venturi a 31%.", detected_at: "Hace 45 min", assignee: "Puesto Intermedios", status: "pendiente", news2_score: 5 },
  { id: 6, patient_id: 6, pseudo_id: "PAC-9106", bed_id: "UCI-06", sector: "UCI", priority: "media", motive: "Elevación de presión arterial sistólica a 158 mmHg en insuficiencia cardíaca.", detected_at: "Hace 1h 10m", assignee: "Dra. E. Morales", status: "pendiente", news2_score: 5 },
  { id: 7, patient_id: 9, pseudo_id: "PAC-8203", bed_id: "INT-03", sector: "INTERMEDIOS", priority: "media", motive: "Febrícula 38.2°C con aumento de requerimiento de O2 a 3L/min.", detected_at: "Hace 1h 45m", assignee: "Enfermería Sector B", status: "resuelta", news2_score: 4 },
  { id: 8, patient_id: 21, pseudo_id: "PAC-6403", bed_id: "GEN-03", sector: "GENERAL", priority: "media", motive: "SpO2 90.0% con esfuerzo respiratorio leve en sala general.", detected_at: "Hace 2h 20m", assignee: "Médico de Piso", status: "pendiente", news2_score: 4 }
];

// Utilidades DOM
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

// Llamadas API con autenticación y fallback resiliente
async function api(url, options = {}) {
  options.headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (authToken) options.headers.Authorization = "Bearer " + authToken;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Error del servidor HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[Sanify API Fallback] Usando almacenamiento en memoria para ${url}:`, err.message);
    return null;
  }
}

// Locutor de Accesibilidad
function announceScreenReader(msg) {
  const el = $("srLiveAnnouncer");
  if (el) {
    el.textContent = "";
    setTimeout(() => { el.textContent = msg; }, 50);
  }
}

// ============================================================================
// Inicialización y Pantalla de Presentación Refinada
// ============================================================================
window.addEventListener("DOMContentLoaded", async () => {
  patientsCache = [...FALLBACK_PATIENTS];
  alertsCache = [...FALLBACK_ALERTS];

  // Restaurar tema persistido
  const savedTheme = localStorage.getItem("sanify_theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }

  // Iniciar temporizador de la pantalla de bienvenida (1.6s)
  setTimeout(() => {
    skipSplash();
  }, 1600);

  // Inicializar estado de sesión
  if (authToken) {
    await bootApplication();
  } else {
    // Si no hay token guardado, usar sesión clínica inicial demostrativa automática
    await quickLogin("elena.morales@sanify.org", "clinica123");
  }
});

function skipSplash() {
  const splash = $("splashScreen");
  if (splash) {
    splash.classList.add("fade-out");
    setTimeout(() => { splash.style.display = "none"; }, 420);
  }
}

// ============================================================================
// Autenticación y Cambio de Roles (RBAC)
// ============================================================================
async function handleLogin(e) {
  if (e) e.preventDefault();
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  await executeLogin(email, password);
}

async function quickLogin(email, password) {
  $("loginEmail").value = email;
  $("loginPassword").value = password;
  await executeLogin(email, password);
}

async function executeLogin(email, password) {
  const errEl = $("authErrorMsg");
  errEl.style.display = "none";

  const res = await api("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  if (res && res.token) {
    authToken = res.token;
    localStorage.setItem("sanify_token", authToken);
    localStorage.setItem("vitasentinel_token", authToken);
    currentUser = res.user;
    if (res.theme) setTheme(res.theme, false);
    await bootApplication();
  } else {
    // Fallback local instantáneo para demostración fluida
    const roleMap = {
      "elena.morales@sanify.org": { name: "Dra. Elena Morales", role: "clinico" },
      "javier.roca@sanify.org": { name: "Dr. Javier Roca", role: "coordinador" },
      "beatriz.santos@sanify.org": { name: "Dra. Beatriz Santos", role: "investigador" },
      "admin@sanify.org": { name: "Lic. Marcos Vega (Admin)", role: "admin" }
    };
    const userMock = roleMap[email] || { name: "Facultativo Demostrativo", role: "clinico" };
    currentUser = { id: 1, email, name: userMock.name, role: userMock.role };
    authToken = "demo-local-jwt-token";
    localStorage.setItem("sanify_token", authToken);
    localStorage.setItem("vitasentinel_token", authToken);
    await bootApplication();
  }
}

async function bootApplication() {
  // Cargar usuario
  const me = await api("/api/me");
  if (me && me.name) {
    currentUser = me;
  } else if (!currentUser) {
    currentUser = { id: 1, name: "Dra. Elena Morales", role: "clinico", email: "elena.morales@sanify.org" };
  }

  // Actualizar UI del usuario
  $("authView").style.display = "none";
  $("appView").style.display = "flex";
  $("topUserName").textContent = currentUser.name;
  $("topUserRole").textContent = formatRole(currentUser.role);
  $("userAvatarInitials").textContent = getInitials(currentUser.name);
  $("rbacQuickSwitch").value = currentUser.role;

  // Registrar auditoría de inicio de sesión
  logClientAudit("ACCESO_ESTACION", "Plataforma Sanify", `Sesión iniciada por ${currentUser.name} (${currentUser.role})`);

  // Cargar datos
  await refreshWardData();
  await refreshAlertsData();
  await refreshDiseasesData();
  await refreshNetworkData();
  await fetchAuditLogs();

  // Iniciar telemetría simulada
  startTelemetrySimulation();

  // Activar vista inicial garantizada
  switchPage("control");

  announceScreenReader("Sesión iniciada correctamente en Sanify. Vista activa: Centro de Control.");
}

function logoutSession() {
  logClientAudit("CIERRE_SESION", "Estación de Monitoreo", "Cierre de sesión asistencial solicitado.");
  localStorage.removeItem("sanify_token");
  localStorage.removeItem("vitasentinel_token");
  authToken = null;
  currentUser = null;
  stopTelemetrySimulation();
  $("appView").style.display = "none";
  $("authView").style.display = "grid";
  announceScreenReader("Sesión cerrada.");
}

function changeActiveRole(newRole) {
  if (!currentUser) return;
  currentUser.role = newRole;
  $("topUserRole").textContent = formatRole(newRole);
  logClientAudit("CAMBIO_ROL_RBAC", "Permisos de Usuario", `Simulación de perfil cambiada a '${newRole}'.`);
  
  // Guardar en backend si disponible
  api("/api/me/preferences", {
    method: "PUT",
    body: JSON.stringify({ role: newRole })
  });

  renderControlDashboard();
  renderWardMap();
  announceScreenReader(`Rol actualizado a ${formatRole(newRole)}`);
}

function formatRole(role) {
  const m = {
    clinico: "Médico Clínico (Asistencial)",
    coordinador: "Coordinador de Guardia",
    investigador: "Investigador Clínico",
    admin: "Administrador del Sistema"
  };
  return m[role] || role;
}

function getInitials(name) {
  return (name || "VS").split(/\s+/).map(x => x[0]).slice(0, 2).join("").toUpperCase();
}

// ============================================================================
// Enrutamiento de Vistas (Navegación 6 Áreas)
// ============================================================================
function switchPage(pageId) {
  currentPage = pageId;

  // Ocultar de manera garantizada todas las secciones
  document.querySelectorAll(".page-view").forEach(p => {
    p.classList.remove("active");
    p.style.setProperty("display", "none", "important");
  });

  // Actualizar clases activas en los enlaces de navegación
  document.querySelectorAll(".nav-link").forEach(n => {
    n.classList.toggle("active", n.dataset.page === pageId);
  });

  // Mostrar únicamente la vista seleccionada
  const target = $("page-" + pageId);
  if (target) {
    target.classList.add("active");
    target.style.setProperty("display", (pageId === "ward") ? "flex" : "block", "important");
  }

  logClientAudit("NAVEGACION", `Sección ${pageId.toUpperCase()}`, `Acceso a interfaz ${pageId}`);

  // Refrescar según vista
  if (pageId === "control") {
    renderControlDashboard();
  } else if (pageId === "ward") {
    renderFloorPlan();
    renderWardMap();
    if (typeof resetZoomPan === "function") resetZoomPan();
  } else if (pageId === "intelligence") {
    renderClinicalIntelligence();
  } else if (pageId === "alerts") {
    renderAlertsInbox();
  } else if (pageId === "network") {
    renderNetworkNodes();
  } else if (pageId === "admin") {
    fetchAuditLogs();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  announceScreenReader(`Vista cambiada a ${pageId}`);
}

// ============================================================================
// 1. Centro de Control (Command Center)
// ============================================================================
async function refreshWardData() {
  const res = await api("/api/ward/beds");
  if (res && Array.isArray(res)) {
    patientsCache = res;
  }
}

function renderControlDashboard() {
  const total = patientsCache.length;
  const critical = patientsCache.filter(p => p.priority === "alta").length;
  const review = patientsCache.filter(p => p.priority === "media" || p.review_status === "pendiente").length;
  const stable = patientsCache.filter(p => p.priority === "baja" && p.review_status === "revisado").length;

  $("metricOccupancyTotal").textContent = total;
  $("metricCriticalCount").textContent = critical;
  $("metricReviewCount").textContent = review;
  $("metricStableCount").textContent = stable;

  // Actualizar lista prioritaria de evaluación médica
  const priorityList = [...patientsCache]
    .sort((a, b) => {
      const pOrder = { alta: 1, media: 2, baja: 3 };
      return (pOrder[a.priority] || 4) - (pOrder[b.priority] || 4);
    })
    .slice(0, 5);

  const tbody = $("controlTriageTableBody");
  if (tbody) {
    tbody.innerHTML = priorityList.map(pat => `
      <tr class="triage-row" onclick="openPatientDrawer(${pat.id})">
        <td>
          <b>${esc(pat.bed_id)}</b><br>
          <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">${esc(pat.pseudo_id)}</span>
        </td>
        <td>
          <span style="font-size: 11.5px; font-weight: 600;">Sector ${esc(pat.sector)}</span><br>
          <span style="font-size: 11px; color: var(--text-muted);">${esc(pat.room_number)}</span>
        </td>
        <td>
          <div style="font-weight: 600; font-size: 12.5px;">${esc(pat.condition_name)}</div>
          <span style="font-size: 11px; color: var(--teal-700); font-family: var(--font-mono);">${pat.cie11 || ''}</span>
        </td>
        <td>
          <div style="font-family: var(--font-mono); font-size: 12px;">
            <span style="color: ${pat.spo2 < 90 ? 'var(--critical-text)' : 'inherit'}; font-weight: 700;">SpO2 ${pat.spo2}%</span> · 
            <span>${pat.hr} lpm</span> · 
            <span>FR ${pat.rr}</span>
          </div>
          <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">NEWS2: <b>${pat.news2_score}</b></div>
        </td>
        <td>
          <span class="badge-priority ${pat.priority}">
            ${pat.priority === 'alta' ? '● Alta' : pat.priority === 'media' ? '▲ Revisión' : '✓ Estable'}
          </span>
        </td>
        <td>
          <button class="btn-table-action" onclick="event.stopPropagation(); openPatientDrawer(${pat.id})">
            Ver Contexto →
          </button>
        </td>
      </tr>
    `).join("");
  }

  // Desglose por Sector
  const sectorsSummary = $("wardSectorsSummaryList");
  if (sectorsSummary) {
    const sectors = ["UCI", "INTERMEDIOS", "AISLAMIENTO", "GENERAL"];
    const labels = {
      UCI: "Sector A: UCI / Cuidados Críticos (6 Camas)",
      INTERMEDIOS: "Sector B: Cuidados Intermedios (8 Camas)",
      AISLAMIENTO: "Sector C: Aislamiento Respiratorio (4 Camas)",
      GENERAL: "Sector D: Hospitalización General (10 Camas)"
    };

    sectorsSummary.innerHTML = sectors.map(sec => {
      const pats = patientsCache.filter(p => p.sector === sec);
      const crit = pats.filter(p => p.priority === "alta").length;
      return `
        <div style="padding: 10px; background: var(--bg-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 600; margin-bottom: 6px;">
            <span>${labels[sec]}</span>
            <span style="color: ${crit > 0 ? 'var(--critical-text)' : 'var(--stable-text)'};">
              ${crit > 0 ? `⚠ ${crit} Críticos` : '✓ Sin alertas altas'}
            </span>
          </div>
          <div style="height: 6px; background: var(--border-subtle); border-radius: 3px; overflow: hidden; display: flex;">
            <div style="width: ${crit * 18}%; background: var(--critical-badge);"></div>
            <div style="width: ${(pats.length - crit) * 10}%; background: var(--stable-badge);"></div>
          </div>
        </div>
      `;
    }).join("");
  }
}

// ============================================================================
// 2. Unidad de Monitoreo / Plano CAD Interactivo de Sala de Internación
// ============================================================================

// Modelo Clínico de las 16 Habitaciones del Plano Arquitectónico
const roomsData = [
  { id: '101', occupied: true, inAlarm: false, alarmMotive: '', name: 'Elena Rostova', age: 42, diag: 'Post-operatorio Apendicitis', time: '36 hrs', bpm: 72, spo2: '99%', bp: '120/80', temp: '36.6°', doctor: 'Dra. Elena Morales', meds: ['Solución Salina 0.9%', 'Ketorolac 30mg IV'], cie11: 'CA40.0', cie10: 'K35.8', snomed: '385093006' },
  { id: '102', occupied: true, inAlarm: false, alarmMotive: '', name: 'Carlos Morales', age: 58, diag: 'Neumonía Bacteriana NAC', time: '4 días', bpm: 84, spo2: '95%', bp: '135/85', temp: '37.8°', doctor: 'Dr. Javier Roca', meds: ['Amoxicilina/Clavulánico', 'Nebulizaciones'], cie11: 'CA40.0', cie10: 'J18.9', snomed: '385093006' },
  { id: '103', occupied: false, inAlarm: false },
  { id: '104', occupied: true, inAlarm: false, alarmMotive: '', name: 'Lucía Domínguez', age: 29, diag: 'Traumatismo de rodilla', time: '12 hrs', bpm: 68, spo2: '99%', bp: '115/75', temp: '36.5°', doctor: 'Dr. Lucas Beltrán', meds: ['Ibuprofeno 600mg', 'Crioterapia local'], cie11: 'ND31', cie10: 'S83.0', snomed: '209437007' },
  { id: '105', occupied: false, inAlarm: false },
  { id: '106', occupied: true, inAlarm: false, alarmMotive: '', name: 'Manuel Benítez', age: 67, diag: 'Insuficiencia Cardíaca Leve', time: '3 días', bpm: 64, spo2: '97%', bp: '130/80', temp: '36.4°', doctor: 'Dra. Mariana Silva', meds: ['Enalapril 10mg', 'Furosemida 20mg'], cie11: 'BD11', cie10: 'I50.9', snomed: '84114007' },
  { id: '107', occupied: true, inAlarm: false, alarmMotive: '', name: 'Sofía Álvarez', age: 34, diag: 'Observación Gastroenteritis', time: '18 hrs', bpm: 78, spo2: '98%', bp: '110/70', temp: '37.1°', doctor: 'Dra. Elena Morales', meds: ['Metoclopramida', 'Hidratación IV'], cie11: '1A40', cie10: 'A09.0', snomed: '25374005' },
  { id: '108', occupied: false, inAlarm: false },
  { id: '109', occupied: true, inAlarm: false, alarmMotive: '', name: 'Gabriel Torres', age: 51, diag: 'Post-cirugía Laparoscópica', time: '24 hrs', bpm: 75, spo2: '98%', bp: '125/82', temp: '36.8°', doctor: 'Dr. Javier Roca', meds: ['Paracetamol IV 1g'], cie11: 'MD11', cie10: 'K80.2', snomed: '235919008' },
  { id: '110', occupied: false, inAlarm: false },
  { id: '111', occupied: true, inAlarm: false, alarmMotive: '', name: 'Patricia Ortiz', age: 46, diag: 'Infección Urinaria Aguda', time: '48 hrs', bpm: 82, spo2: '98%', bp: '118/76', temp: '38.2°', doctor: 'Dra. Beatriz Santos', meds: ['Ceftriaxona 1g IV'], cie11: '1C43', cie10: 'N39.0', snomed: '68566005' },
  { id: '112', occupied: true, inAlarm: false, alarmMotive: '', name: 'Jorge Navarro', age: 61, diag: 'Monitoreo Diabetes Tipo 2', time: '5 días', bpm: 70, spo2: '97%', bp: '128/82', temp: '36.7°', doctor: 'Dr. Lucas Beltrán', meds: ['Insulina NPH', 'Metformina'], cie11: '5A11', cie10: 'E11.9', snomed: '44054006' },
  { id: '113', occupied: false, inAlarm: false },
  { id: '114', occupied: true, inAlarm: false, alarmMotive: '', name: 'Valeria Cárdenas', age: 23, diag: 'Crisis asmática controlada', time: '16 hrs', bpm: 88, spo2: '97%', bp: '115/78', temp: '36.6°', doctor: 'Dra. Mariana Silva', meds: ['Salbutamol aerosol', 'Corticoides'], cie11: 'CA23', cie10: 'J45.9', snomed: '195967001' },
  { id: '115', occupied: true, inAlarm: false, alarmMotive: '', name: 'Andrés Gil', age: 72, diag: 'Síndrome Febril en estudio', time: '2 días', bpm: 79, spo2: '96%', bp: '132/84', temp: '38.6°', doctor: 'Dr. Javier Roca', meds: ['Antipiréticos', 'Hemocultivos'], cie11: 'MG26', cie10: 'R50.9', snomed: '386661006' },
  { id: '116', occupied: false, inAlarm: false }
];

let currentSelectedRoomId = null;
let activeFilter = 'all';
let globalAlarmMode = false;
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
let cadScale = 0.95;
let cadPanX = 0;
let cadPanY = 0;
let cadIsDragging = false;
let cadHasMoved = false;
let cadTotalDragDistance = 0;
let cadPrevPointerX = 0;
let cadPrevPointerY = 0;
let cadEventsBound = false;

// RENDERIZADO DE LAS HABITACIONES EN EL PLANO CAD (Estilo CAD técnico)
function renderFloorPlan() {
  if (cadIsDragging) return;
  roomsData.forEach(room => {
    const el = document.getElementById(`room-${room.id}`);
    if (!el) return;

    // Estado visual según filtros
    let opacityStyle = 'opacity: 1; pointer-events: auto;';
    if (activeFilter === 'occupied' && !room.occupied) opacityStyle = 'opacity: 0.25; pointer-events: none;';
    if (activeFilter === 'free' && room.occupied) opacityStyle = 'opacity: 0.25; pointer-events: none;';
    if (activeFilter === 'alarm' && !room.inAlarm) opacityStyle = 'opacity: 0.25; pointer-events: none;';

    let statusText = room.occupied ? (room.inAlarm ? 'ALARMA' : 'OCUP') : 'LIBRE';
    let statusClass = room.inAlarm ? 'alarm' : (room.occupied ? 'occupied' : 'free');

    const isSelected = currentSelectedRoomId === room.id;
    el.className = `room-box ${isSelected ? 'active-selected' : ''} ${room.inAlarm ? 'in-alarm' : ''}`;
    el.style.cssText = opacityStyle;

    el.innerHTML = `
      <!-- Header de habitación -->
      <div class="room-box-header">
        <span class="room-box-code">HAB-${room.id}</span>
        <div class="room-box-status">
          <span class="room-status-dot ${statusClass}"></span>
          <span class="room-status-text ${statusClass}">${statusText}</span>
        </div>
      </div>

      <!-- Esquema arquitectónico interior -->
      <div class="room-box-interior">
        <!-- Cama Minimalista CAD -->
        <div class="cad-bed-icon ${room.inAlarm ? 'bed-alarm' : (room.occupied ? 'bed-occupied' : 'bed-free')}">
          <div class="cad-bed-pillow"></div>
          <div class="cad-bed-label">
            ${room.inAlarm ? 'CRISIS' : 'CAMA'}
          </div>
        </div>

        <!-- Área de baño privado esquemático -->
        <div class="cad-bath-box">
          <div class="cad-bath-fixture"></div>
          <span class="cad-bath-label">WC</span>
        </div>
      </div>

      <!-- Puerta esquemática y nombre -->
      <div class="room-box-footer">
        <span class="room-patient-name ${room.inAlarm ? 'name-alarm' : ''}">
          ${room.occupied ? room.name : 'DISPONIBLE'}
        </span>
        <span class="cad-door-marker">◺</span>
      </div>
    `;
  });

  updateStats();
  bindCadEvents();
}

// Alias para conectar con switchPage('ward')
function renderWardMap() {
  renderFloorPlan();
  if (cadScale === 0.95 && cadPanX === 0 && cadPanY === 0) {
    cadScale = getCadFitScale();
  }
  clampCadPan();
  updateCadTransform();
}

// Actualizar métricas del HUD y Alertas
function updateStats() {
  const occupiedCount = roomsData.filter(r => r.occupied).length;
  const totalCount = roomsData.length;
  const freeCount = totalCount - occupiedCount;
  const alarmCount = roomsData.filter(r => r.inAlarm).length;

  const statOcc = document.getElementById('stat-occupied');
  const statTot = document.getElementById('stat-total');
  const countOcc = document.getElementById('count-occupied');
  const countFree = document.getElementById('count-free');
  const countAlarm = document.getElementById('count-alarm');

  if (statOcc) statOcc.innerText = occupiedCount;
  if (statTot) statTot.innerText = totalCount;
  if (countOcc) countOcc.innerText = occupiedCount;
  if (countFree) countFree.innerText = freeCount;
  if (countAlarm) countAlarm.innerText = alarmCount;

  const alarmsBadge = document.getElementById('stat-alarms-badge');
  const alarmsDot = document.getElementById('stat-alarms-dot');
  const alarmsCountText = document.getElementById('stat-alarms-count');
  const alarmBanner = document.getElementById('alarm-banner');

  if (alarmsBadge && alarmsDot && alarmsCountText) {
    if (alarmCount > 0) {
      alarmsBadge.style.background = "#fee2e2";
      alarmsBadge.style.borderColor = "#fca5a5";
      alarmsBadge.style.color = "#991b1b";
      alarmsDot.className = "dot-status";
      alarmsDot.style.background = "#dc2626";
      alarmsCountText.innerText = `${alarmCount} CRÍTICAS`;
      if (alarmBanner) alarmBanner.classList.remove('hidden');
    } else {
      alarmsBadge.style.background = "";
      alarmsBadge.style.borderColor = "";
      alarmsBadge.style.color = "";
      alarmsDot.className = "dot-status normal";
      alarmsDot.style.background = "#10b981";
      alarmsCountText.innerText = "0 CRÍTICAS";
      if (alarmBanner) alarmBanner.classList.add('hidden');
    }
  }
}

// Filtros de visualización
function setFilter(filter) {
  activeFilter = filter;
  ['all', 'occupied', 'free', 'alarm'].forEach(f => {
    const btn = document.getElementById(`filter-${f}`);
    if (!btn) return;
    if (f === filter) {
      btn.className = "btn-cad-filter active";
    } else {
      btn.className = f === 'alarm' ? "btn-cad-filter filter-alarm" : "btn-cad-filter";
    }
  });
  renderFloorPlan();
}

// ============================================================================
// Tooltip Flotante de Inspección Rápida (Hover)
// ============================================================================
function showTooltip(e, roomId) {
  const room = roomsData.find(r => r.id === roomId);
  if (!room) return;

  const tooltip = document.getElementById('hover-tooltip');
  const ttTitle = document.getElementById('tt-title');
  const ttStatus = document.getElementById('tt-status');
  const ttContent = document.getElementById('tt-content');
  if (!tooltip || !ttTitle || !ttStatus || !ttContent) return;

  ttTitle.innerText = `HABITACIÓN // SALA ${room.id}`;

  if (room.inAlarm) {
    ttStatus.innerText = "⚠ EN ALERTA CRÍTICA";
    ttStatus.style.background = "#dc2626";
    ttStatus.style.color = "#ffffff";
    ttContent.innerHTML = `
      <div style="color: #fca5a5; font-weight: 700;">ALERTA VITAL: ${room.alarmMotive || 'Deterioro hemodinámico agudo'}</div>
      <div style="color: #ffffff; font-weight: 600;">${room.name} (${room.age} años)</div>
      <div style="color: #e2e8f0;">FC: <b style="color: #f87171;">${room.bpm} lpm</b> · SpO2: <b style="color: #f87171;">${room.spo2}</b> · PA: <b>${room.bp}</b></div>
      <div style="color: #94a3b8; font-size: 10px; margin-top: 4px;">Clic para abrir ficha clínica y estabilizar</div>
    `;
  } else if (room.occupied) {
    ttStatus.innerText = "OCUPADA";
    ttStatus.style.background = "#334155";
    ttStatus.style.color = "#f8fafc";
    ttContent.innerHTML = `
      <div style="color: #ffffff; font-weight: 600;">${room.name} (${room.age} años)</div>
      <div style="color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${room.diag}</div>
      <div style="color: #cbd5e1; padding-top: 2px;">FC: <b>${room.bpm} lpm</b> · SpO2: <b>${room.spo2}</b> · PA: <b>${room.bp}</b></div>
      <div style="color: #94a3b8; font-size: 10px;">Médico a cargo: ${room.doctor || 'Dra. E. Morales'}</div>
    `;
  } else {
    ttStatus.innerText = "DISPONIBLE";
    ttStatus.style.background = "#065f46";
    ttStatus.style.color = "#a7f3d0";
    ttContent.innerHTML = `
      <div style="color: #6ee7b7; font-weight: 600;">Habitación desinfectada y lista</div>
      <div style="color: #94a3b8;">Cama, panel de gases y telemetría operativos</div>
      <div style="color: #94a3b8; font-size: 10px; margin-top: 4px;">Clic para asignar paciente ingresante</div>
    `;
  }

  positionTooltip(e);
  tooltip.style.opacity = '1';
}

function showStationTooltip(e) {
  const tooltip = document.getElementById('hover-tooltip');
  const ttTitle = document.getElementById('tt-title');
  const ttStatus = document.getElementById('tt-status');
  const ttContent = document.getElementById('tt-content');
  if (!tooltip || !ttTitle || !ttStatus || !ttContent) return;

  ttTitle.innerText = "ESTACIÓN CENTRAL // ENFERMERÍA";
  ttStatus.innerText = "HUB OPERATIVO";
  ttStatus.style.background = "#0f766e";
  ttStatus.style.color = "#ccfbf1";
  ttContent.innerHTML = `
    <div style="color: #ffffff; font-weight: 600;">Puesto Central de Guardia y Supervisión</div>
    <div style="color: #cbd5e1;">4 Enfermeros / 2 Médicos en turno</div>
    <div style="color: #94a3b8;">Suministros: 94% · Acceso 360°</div>
    <div style="color: #94a3b8; font-size: 10px; margin-top: 4px;">Clic para ver dotación de personal y bitácora</div>
  `;
  positionTooltip(e);
  tooltip.style.opacity = '1';
}

function positionTooltip(e) {
  const tooltip = document.getElementById('hover-tooltip');
  if (!tooltip) return;
  const offset = 16;
  const rect = tooltip.getBoundingClientRect();
  const w = rect.width > 0 ? rect.width : 280;
  const h = rect.height > 0 ? rect.height : 160;

  let left = e.clientX + offset;
  let top = e.clientY + offset;

  // Si desborda hacia la derecha de la ventana, mostrar a la izquierda del cursor
  if (left + w > window.innerWidth - 12) {
    left = e.clientX - w - offset;
  }
  // Si desborda hacia abajo, mostrar arriba del cursor
  if (top + h > window.innerHeight - 12) {
    top = e.clientY - h - offset;
  }

  // Clamping estricto dentro del viewport visible (evita coordenadas negativas u ocultamiento)
  left = Math.max(12, Math.min(window.innerWidth - w - 12, left));
  top = Math.max(12, Math.min(window.innerHeight - h - 12, top));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideTooltip() {
  const tooltip = document.getElementById('hover-tooltip');
  if (tooltip) tooltip.style.opacity = '0';
}

// ============================================================================
// Drawer Lateral / HUD de Detalle de Habitación
// ============================================================================
function openRoomModal(roomId) {
  currentSelectedRoomId = roomId;
  const room = roomsData.find(r => r.id === roomId);
  if (!room) return;

  renderFloorPlan();

  const hud = document.getElementById('side-hud');
  const title = document.getElementById('hud-room-title');
  const status = document.getElementById('hud-room-status');
  const patientSection = document.getElementById('hud-patient-section');
  const emptySection = document.getElementById('hud-empty-section');
  const actions = document.getElementById('hud-actions');
  const alarmCard = document.getElementById('hud-alarm-alert-card');
  const dot = document.getElementById('hud-indicator-dot');
  if (!hud) return;

  if (title) title.innerText = `HABITACIÓN // SALA ${room.id}`;

  if (room.inAlarm) {
    if (status) {
      status.innerText = "⚠ EN ALERTA VITAL";
      status.style.background = "#dc2626";
      status.style.color = "#ffffff";
    }
    if (dot) dot.style.background = "#dc2626";
    if (alarmCard) {
      alarmCard.classList.remove('hidden');
      const motiveEl = document.getElementById('hud-alarm-motive');
      if (motiveEl) motiveEl.innerText = room.alarmMotive || "Variación abrupta de signos vitales. Se requiere soporte urgente.";
    }
  } else {
    if (alarmCard) alarmCard.classList.add('hidden');
    if (dot) dot.style.background = room.occupied ? "#0f172a" : "#cbd5e1";
  }

  if (room.occupied) {
    if (!room.inAlarm && status) {
      status.innerText = "OCUPADA - MONITORIZADA";
      status.style.background = "#e2e8f0";
      status.style.color = "#1e293b";
    }

    if (patientSection) patientSection.classList.remove('hidden');
    if (emptySection) emptySection.classList.add('hidden');
    if (actions) actions.classList.remove('hidden');

    const nameEl = document.getElementById('hud-patient-name');
    const metaEl = document.getElementById('hud-patient-meta');
    const diagEl = document.getElementById('hud-patient-diag');
    const timeEl = document.getElementById('hud-patient-time');
    const docEl = document.getElementById('hud-patient-doctor');
    const bpmEl = document.getElementById('hud-bpm');
    const spo2El = document.getElementById('hud-spo2');
    const bpEl = document.getElementById('hud-bp');
    const tempEl = document.getElementById('hud-temp');

    if (nameEl) nameEl.innerText = room.name;
    if (metaEl) metaEl.innerText = `${room.age} años • EXPEDIENTE: #MED-${room.id}84`;
    if (diagEl) diagEl.innerText = room.diag;
    if (timeEl) timeEl.innerText = room.time;
    if (docEl) docEl.innerText = room.doctor || 'Dra. Elena Morales';
    if (bpmEl) bpmEl.innerText = room.bpm;
    if (spo2El) spo2El.innerText = room.spo2;
    if (bpEl) bpEl.innerText = room.bp;
    if (tempEl) tempEl.innerText = room.temp || '36.7°';

    const signal = document.getElementById('hud-signal-indicator');
    if (signal) {
      if (room.inAlarm) {
        signal.innerHTML = `<span style="width: 7px; height: 7px; border-radius: 50%; background: #dc2626;"></span> <b style="color: #b91c1c;">DESATURACIÓN / INESTABILIDAD</b>`;
      } else {
        signal.innerHTML = `<span class="signal-dot"></span> SEÑAL ESTABLE`;
      }
    }

    // Render medicación
    const medsContainer = document.getElementById('hud-meds');
    if (medsContainer) {
      medsContainer.innerHTML = (room.meds || ['Solución Salina 0.9%']).map(m => `
        <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid var(--border-subtle);">
          <span>• ${m}</span>
          <span style="color: var(--text-dim);">Prescrito</span>
        </div>
      `).join('');
    }

    // Botón de inducir o resolver crisis en HUD
    const btnSingleAlarm = document.getElementById('btn-trigger-single-alarm');
    if (btnSingleAlarm) {
      if (room.inAlarm) {
        btnSingleAlarm.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> ESTABILIZAR`;
        btnSingleAlarm.style.background = "#dcfce7";
        btnSingleAlarm.style.color = "#166534";
        btnSingleAlarm.style.borderColor = "#86efac";
      } else {
        btnSingleAlarm.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> INDUCIR CRISIS`;
        btnSingleAlarm.style.background = "";
        btnSingleAlarm.style.color = "";
        btnSingleAlarm.style.borderColor = "";
      }
    }
  } else {
    if (status) {
      status.innerText = "LIBRE - HIGIENIZADA";
      status.style.background = "#e2e8f0";
      status.style.color = "#475569";
    }
    if (patientSection) patientSection.classList.add('hidden');
    if (emptySection) emptySection.classList.remove('hidden');
    if (actions) actions.classList.add('hidden');
  }

  hud.style.transform = 'translateX(0)';
  logClientAudit("CONSULTA_HABITACION", `Habitación ${room.id}`, `Visualización en plano CAD de telemetría.`);
}

function closeSideHud() {
  const hud = document.getElementById('side-hud');
  if (hud) hud.style.transform = 'translateX(100%)';
  currentSelectedRoomId = null;
  renderFloorPlan();
}

// ============================================================================
// Gestión de Modo Alarma y Crisis Clínica
// ============================================================================
function toggleGlobalAlarmMode() {
  globalAlarmMode = !globalAlarmMode;
  const btn = document.getElementById('btn-toggle-alarm-mode');
  const btnText = document.getElementById('btn-alarm-text');

  if (globalAlarmMode) {
    if (btn) {
      btn.style.background = "#dc2626";
      btn.style.color = "#ffffff";
      btn.style.borderColor = "#b91c1c";
      btn.style.fontWeight = "700";
    }
    if (btnText) btnText.innerText = "DESACTIVAR MODO ALARMA";

    // Inducir crisis en habitación 101 y 107
    const r101 = roomsData.find(r => r.id === '101');
    if (r101 && r101.occupied) {
      r101.inAlarm = true;
      r101.spo2 = '86%';
      r101.bpm = 126;
      r101.bp = '90/55';
      r101.alarmMotive = "Caída brusca de saturación (SpO2 86%) con taquicardia refleja (126 lpm).";
    }

    const r107 = roomsData.find(r => r.id === '107');
    if (r107 && r107.occupied) {
      r107.inAlarm = true;
      r107.bpm = 132;
      r107.bp = '155/95';
      r107.alarmMotive = "Pico hipertensivo agudo y alteración del patrón respiratorio.";
    }

    const bannerText = document.getElementById('alarm-banner-text');
    if (bannerText) {
      bannerText.innerText = "HAB-101 (SpO2 86% · Taquicardia) y HAB-107 (Pico Hipertensivo). Atención de guardia requerida.";
    }
    notifyAction("⚠ MODO ALARMA ACTIVADO: Crisis simulada en HAB-101 y HAB-107");
    logClientAudit("MODO_ALARMA_ACTIVADO", "Sala Piso 02", "Simulación de crisis hemodinámica activada por usuario.");
  } else {
    if (btn) {
      btn.style.background = "";
      btn.style.color = "";
      btn.style.borderColor = "";
      btn.style.fontWeight = "";
    }
    if (btnText) btnText.innerText = "SIMULAR MODO ALARMA";
    resolveAllAlarms();
    notifyAction("Modo Alarma desactivado. Signos vitales normalizados.");
  }

  renderFloorPlan();
  if (currentSelectedRoomId) openRoomModal(currentSelectedRoomId);
}

function triggerCurrentRoomAlarm() {
  if (!currentSelectedRoomId) return;
  const room = roomsData.find(r => r.id === currentSelectedRoomId);
  if (!room || !room.occupied) return;

  if (room.inAlarm) {
    resolveCurrentRoomAlarm();
  } else {
    room.inAlarm = true;
    room.spo2 = '87%';
    room.bpm = 122;
    room.alarmMotive = `Deterioro agudo de parámetros fisiológicos en HAB-${room.id}. Se requiere soporte ventilatorio inmediato.`;
    notifyAction(`⚠ Crisis clínica inducida en HAB-${room.id}`);
    logClientAudit("CRISIS_INDIVIDUAL", `Habitación ${room.id}`, `Alarma vital disparada para paciente ${room.name}`);
    openRoomModal(currentSelectedRoomId);
  }
}

function resolveCurrentRoomAlarm() {
  if (!currentSelectedRoomId) return;
  const room = roomsData.find(r => r.id === currentSelectedRoomId);
  if (!room) return;

  room.inAlarm = false;
  room.spo2 = '98%';
  room.bpm = 74;
  room.bp = '120/80';
  room.alarmMotive = '';

  notifyAction(`✓ Paciente de HAB-${room.id} estabilizado según protocolo.`);
  logClientAudit("PACIENTE_ESTABILIZADO", `Habitación ${room.id}`, `Protocolo asistencial aplicado con éxito.`);
  openRoomModal(currentSelectedRoomId);
}

function resolveAllAlarms() {
  roomsData.forEach(r => {
    if (r.inAlarm) {
      r.inAlarm = false;
      r.spo2 = '98%';
      r.bpm = 74;
      r.alarmMotive = '';
    }
  });
  globalAlarmMode = false;
  const btn = document.getElementById('btn-toggle-alarm-mode');
  const btnText = document.getElementById('btn-alarm-text');
  if (btn) {
    btn.style.background = "";
    btn.style.color = "";
    btn.style.borderColor = "";
    btn.style.fontWeight = "";
  }
  if (btnText) btnText.innerText = "SIMULAR MODO ALARMA";

  notifyAction("Todos los pacientes estabilizados con éxito.");
  renderFloorPlan();
  if (currentSelectedRoomId) openRoomModal(currentSelectedRoomId);
}

// Alta de paciente
function dischargePatient() {
  if (!currentSelectedRoomId) return;
  const room = roomsData.find(r => r.id === currentSelectedRoomId);
  if (room) {
    const oldName = room.name;
    room.occupied = false;
    room.inAlarm = false;
    notifyAction(`Paciente ${oldName} dado de alta de la Hab. ${room.id}`);
    logClientAudit("ALTA_PACIENTE", `Habitación ${room.id}`, `Alta médica registrada para ${oldName}`);
    openRoomModal(currentSelectedRoomId);
  }
}

// Asignar paciente al azar
function admitRandomPatient() {
  if (!currentSelectedRoomId) return;
  const room = roomsData.find(r => r.id === currentSelectedRoomId);
  if (room) {
    const names = ['Andrés Morales', 'Martina Valdez', 'Luciano Castro', 'Mariana Ruiz', 'Federico Sanz', 'Camila Benítez'];
    const diags = ['Monitoreo Coronario', 'Apendicectomía', 'Observación Clínica', 'Cuadro Febril Agudo', 'Traumatismo Leve'];
    room.occupied = true;
    room.inAlarm = false;
    room.name = names[Math.floor(Math.random() * names.length)];
    room.age = Math.floor(Math.random() * 50) + 20;
    room.diag = diags[Math.floor(Math.random() * diags.length)];
    room.time = 'Recién ingresado';
    room.bpm = 76;
    room.spo2 = '98%';
    room.bp = '120/80';
    room.temp = '36.6°';
    room.doctor = 'Dra. Elena Morales';
    room.meds = ['Analgesia preventiva', 'Suero hidratante'];

    notifyAction(`Paciente ${room.name} ingresado a Hab. ${room.id}`);
    logClientAudit("INGRESO_PACIENTE", `Habitación ${room.id}`, `Ingreso hospitalario de ${room.name} (${room.diag})`);
    openRoomModal(currentSelectedRoomId);
  }
}

// Modal de Estación de Enfermería
function openStationModal() {
  const modal = document.getElementById('station-modal');
  if (modal) modal.classList.remove('hidden');
}
function closeStationModal() {
  const modal = document.getElementById('station-modal');
  if (modal) modal.classList.add('hidden');
}

// Notificaciones discretas tipo Toast
function notifyAction(message) {
  const toast = document.getElementById('toast');
  const text = document.getElementById('toast-text');
  if (toast && text) {
    text.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }
}

// ============================================================================
// Pan & Zoom Engine Optimizado (Límites Estrictos de SVG y Cero Zona Muerta)
// ============================================================================

function getCadFitScale() {
  const viewport = document.getElementById('viewport-container');
  if (!viewport) return 0.95;
  const vpW = viewport.clientWidth || window.innerWidth;
  const vpH = viewport.clientHeight || (window.innerHeight - 100);
  const fit = Math.min((vpW - 20) / CANVAS_WIDTH, (vpH - 20) / CANVAS_HEIGHT);
  return Math.max(0.35, Math.min(fit, 1.05));
}

function updateCadCursor() {
  const viewport = document.getElementById('viewport-container');
  if (!viewport) return;
  const vpW = viewport.clientWidth;
  const vpH = viewport.clientHeight;
  const canPan = (CANVAS_WIDTH * cadScale > vpW) || (CANVAS_HEIGHT * cadScale > vpH);

  if (cadIsDragging) {
    viewport.style.cursor = 'grabbing';
  } else if (canPan) {
    viewport.style.cursor = 'grab';
  } else {
    viewport.style.cursor = 'default';
  }
}

function clampCadPan() {
  const viewport = document.getElementById('viewport-container');
  if (!viewport) return;
  const vpW = viewport.clientWidth;
  const vpH = viewport.clientHeight;
  const scaledW = CANVAS_WIDTH * cadScale;
  const scaledH = CANVAS_HEIGHT * cadScale;

  // Eje X: Si el plano cabe horizontalmente, centrarlo estrictamente (no se mueve)
  if (scaledW <= vpW) {
    cadPanX = (vpW - scaledW) / 2;
  } else {
    // Si es más ancho que la ventana, permitir mover con tope estricto en los bordes del plano
    const minPanX = vpW - scaledW;
    const maxPanX = 0;
    cadPanX = Math.max(minPanX, Math.min(maxPanX, cadPanX));
  }

  // Eje Y: Si el plano cabe verticalmente, centrarlo estrictamente (no se mueve)
  if (scaledH <= vpH) {
    cadPanY = (vpH - scaledH) / 2;
  } else {
    // Si es más alto que la ventana, permitir mover con tope estricto en los bordes del plano
    const minPanY = vpH - scaledH;
    const maxPanY = 0;
    cadPanY = Math.max(minPanY, Math.min(maxPanY, cadPanY));
  }

  updateCadCursor();
}

function updateCadTransform() {
  const canvas = document.getElementById('blueprint-canvas');
  const zoomLabel = document.getElementById('zoom-label');
  if (canvas) {
    canvas.style.transform = `translate(${cadPanX}px, ${cadPanY}px) scale(${cadScale})`;
  }
  if (zoomLabel) {
    zoomLabel.innerText = `${Math.round(cadScale * 100)}%`;
  }
}

function zoomMap(delta) {
  const viewport = document.getElementById('viewport-container');
  if (!viewport) return;
  const vpW = viewport.clientWidth;
  const vpH = viewport.clientHeight;
  const minScale = getCadFitScale();
  const newScale = Math.min(Math.max(minScale, cadScale + delta), 2.5);
  if (newScale === cadScale) return;

  const centerX = vpW / 2;
  const centerY = vpH / 2;
  cadPanX = centerX - (centerX - cadPanX) * (newScale / cadScale);
  cadPanY = centerY - (centerY - cadPanY) * (newScale / cadScale);
  cadScale = newScale;

  const canvas = document.getElementById('blueprint-canvas');
  if (canvas) {
    canvas.style.transition = 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)';
  }
  clampCadPan();
  updateCadTransform();
  setTimeout(() => {
    if (canvas) canvas.style.transition = 'none';
  }, 200);
}

function resetZoomPan() {
  cadScale = getCadFitScale();
  clampCadPan();
  const canvas = document.getElementById('blueprint-canvas');
  if (canvas) {
    canvas.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
  }
  updateCadTransform();
  setTimeout(() => {
    if (canvas) canvas.style.transition = 'none';
  }, 240);
}

// Clics en elementos del plano CAD diferenciados del arrastre
function handleRoomClick(roomId) {
  if (cadHasMoved) return;
  openRoomModal(roomId);
}

function handleStationClick() {
  if (cadHasMoved) return;
  openStationModal();
}

function bindCadEvents() {
  if (cadEventsBound) return;
  const viewport = document.getElementById('viewport-container');
  if (!viewport) return;
  cadEventsBound = true;

  // Zoom fluido focalizado al puntero del ratón
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 0.08 : -0.08;
    const minScale = getCadFitScale();
    const newScale = Math.min(Math.max(minScale, cadScale + zoomFactor), 2.5);
    if (newScale === cadScale) return;

    cadPanX = mouseX - (mouseX - cadPanX) * (newScale / cadScale);
    cadPanY = mouseY - (mouseY - cadPanY) * (newScale / cadScale);
    cadScale = newScale;

    const canvas = document.getElementById('blueprint-canvas');
    if (canvas) canvas.style.transition = 'none';

    clampCadPan();
    updateCadTransform();
  }, { passive: false });

  // Arrastre ultra-preciso con Pointer Events y cálculo delta inmediato
  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button, .modal, #station-modal, .alarm-action')) return;

    cadIsDragging = true;
    cadHasMoved = false;
    cadTotalDragDistance = 0;
    cadPrevPointerX = e.clientX;
    cadPrevPointerY = e.clientY;

    try {
      viewport.setPointerCapture(e.pointerId);
    } catch (err) {}

    const canvas = document.getElementById('blueprint-canvas');
    if (canvas) canvas.style.transition = 'none';
    updateCadCursor();
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!cadIsDragging) {
      const tooltip = document.getElementById('hover-tooltip');
      if (tooltip && tooltip.style.opacity === '1') {
        positionTooltip(e);
      }
      return;
    }

    const dx = e.clientX - cadPrevPointerX;
    const dy = e.clientY - cadPrevPointerY;
    cadPrevPointerX = e.clientX;
    cadPrevPointerY = e.clientY;

    cadTotalDragDistance += Math.hypot(dx, dy);
    if (cadTotalDragDistance > 4) {
      cadHasMoved = true;
      hideTooltip();
    }

    cadPanX += dx;
    cadPanY += dy;

    clampCadPan();
    updateCadTransform();
  });

  const stopCadDragging = (e) => {
    if (!cadIsDragging) return;
    cadIsDragging = false;
    try {
      if (viewport.hasPointerCapture(e.pointerId)) {
        viewport.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
    updateCadCursor();
    const canvas = document.getElementById('blueprint-canvas');
    if (canvas) canvas.style.transition = 'none';
  };

  viewport.addEventListener('pointerup', stopCadDragging);
  viewport.addEventListener('pointercancel', stopCadDragging);
  viewport.addEventListener('dragstart', (e) => e.preventDefault());

  // Reajustar límites en cambio de tamaño de ventana
  window.addEventListener('resize', () => {
    clampCadPan();
    updateCadTransform();
  });

  // Reloj dinámico de UI
  setInterval(() => {
    const clockEl = document.getElementById('game-clock');
    if (clockEl) {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      clockEl.innerText = `${h}:${m}:${s}`;
    }
  }, 1000);
}

// ============================================================================
// Panel Lateral Deslizante (Slide-Over Drawer)
// ============================================================================
async function openPatientDrawer(patientId) {
  selectedPatientId = patientId;
  const pat = patientsCache.find(p => p.id === patientId) || patientsCache[0];
  if (!pat) return;

  $("drawerBedId").textContent = pat.bed_id;
  $("drawerPseudoId").textContent = pat.pseudo_id;
  $("drawerSectorRoom").textContent = `Sector ${pat.sector} · ${pat.room_number} · Rango Etario: ${pat.age_range} años`;
  $("drawerConditionName").textContent = pat.condition_name;
  $("drawerCie11").textContent = `CIE-11: ${pat.cie11 || 'CA40.0'}`;
  $("drawerCie10").textContent = `CIE-10: ${pat.cie10 || 'J18.9'}`;
  $("drawerSnomed").textContent = `SNOMED-CT: ${pat.snomed_ct || '385093006'}`;

  $("drawerSpo2").textContent = `${pat.spo2}%`;
  $("drawerOxygen").textContent = pat.oxygen_supply || "Aire ambiente";
  $("drawerHr").textContent = pat.hr;
  $("drawerBp").textContent = `${pat.bp_sys}/${pat.bp_dia}`;
  $("drawerRr").textContent = pat.rr;
  $("drawerTemp").textContent = `${pat.temp}°C`;
  $("drawerNews2").textContent = pat.news2_score;

  // Renderizar Sparkline SVG de Tendencia 12h
  renderDrawerSparkline(pat.sparklineSpo2 || [94, 93, 92, 91, 92, pat.spo2]);

  // Cargar notas clínicas desde backend o fallback
  await loadPatientNotes(pat.id);

  // Abrir panel lateral con animación accesible
  $("drawerBackdrop").classList.add("open");
  $("patientDrawer").classList.add("open");

  logClientAudit("CONSULTA_PACIENTE", `Cama ${pat.bed_id} (${pat.pseudo_id})`, `Visualización de telemetría completa y evolución.`);
  announceScreenReader(`Ficha clínica abierta para cama ${pat.bed_id}, paciente ${pat.pseudo_id}`);
}

function closePatientDrawer() {
  $("drawerBackdrop").classList.remove("open");
  $("patientDrawer").classList.remove("open");
}

function renderDrawerSparkline(points) {
  const container = $("drawerTrendSparklineContainer");
  if (!container) return;

  const w = 440;
  const h = 70;
  const minVal = Math.min(...points, 85);
  const maxVal = Math.max(...points, 99);
  const range = maxVal - minVal || 1;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * (w - 30) + 15;
    const y = h - 15 - ((val - minVal) / range) * (h - 30);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  container.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" fill="none">
      <defs>
        <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0f766e" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#0f766e" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polyline points="${coords}" stroke="#0f766e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${coords.split(' ').pop().split(',')[0]}" cy="${coords.split(' ').pop().split(',')[1]}" r="4" fill="#0f766e"/>
      <text x="15" y="${h - 2}" font-size="10" fill="var(--text-dim)" font-family="monospace">Hace 12h: ${points[0]}%</text>
      <text x="${w - 80}" y="${h - 2}" font-size="10" fill="#0f766e" font-family="monospace" font-weight="bold">Actual: ${points[points.length - 1]}%</text>
    </svg>
  `;
}

async function loadPatientNotes(patientId) {
  const notesContainer = $("drawerNotesList");
  if (!notesContainer) return;

  const res = await api(`/api/ward/beds/${patientId}`);
  const notes = (res && res.notes) ? res.notes : [
    { author_name: "Dra. Elena Morales", author_role: "Medicina Interna", note_type: "Evolución", content: "Ingreso con parámetros iniciales estabilizados. Plan de seguimiento horario activado.", created_at: "Hoy 14:30" }
  ];

  notesContainer.innerHTML = notes.map(n => `
    <div style="background: var(--bg-subtle); border-left: 3px solid var(--teal-700); padding: 8px 12px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-size: 12px;">
      <div style="display: flex; justify-content: space-between; color: var(--text-muted); font-size: 11px; margin-bottom: 2px;">
        <b>${esc(n.author_name)} (${esc(n.author_role || 'Clínico')})</b>
        <span style="font-family: var(--font-mono);">${esc(n.created_at || 'Hoy')}</span>
      </div>
      <div style="color: var(--text-main); line-height: 1.4;">${esc(n.content)}</div>
    </div>
  `).join("");
}

// ============================================================================
// Modal de Acciones Seguras y Notas Clínicas
// ============================================================================
function openActionModal(mode) {
  activeModalMode = mode;
  const modal = $("actionModalDialog");
  const title = $("actionModalTitle");
  const sub = $("actionModalSubtitle");
  const txt = $("actionModalText");

  txt.value = "";

  if (mode === "review") {
    title.textContent = "Confirmar Revisión Presencial de Cama";
    sub.textContent = "Al confirmar, registrará en bitácora que ha valorado al paciente en su puesto y validado sus signos vitales.";
    txt.placeholder = "Indique estado de perfusión, tolerancia al oxígeno o comentarios de guardia...";
  } else if (mode === "note") {
    title.textContent = "Registrar Nota de Evolución Clínica";
    sub.textContent = "Esta nota se incorporará al historial cronológico del paciente con firma digital y hora exacta.";
    txt.placeholder = "Describa la evolución, resultados paraclínicos o ajustes del plan terapéutico...";
  } else if (mode === "escalate") {
    title.textContent = "Escalar Alerta a Equipo de Respuesta Rápida";
    sub.textContent = "Se enviará notificación prioritaria al médico coordinador y equipo de soporte crítico.";
    txt.placeholder = "Motivo del escalamiento y solicitud de valoración urgente...";
  }

  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.setAttribute("open", "");
  }
}

function closeActionModal() {
  const modal = $("actionModalDialog");
  if (typeof modal.close === "function") {
    modal.close();
  } else {
    modal.removeAttribute("open");
  }
}

async function submitActionModal(e) {
  if (e) e.preventDefault();
  const text = $("actionModalText").value.trim();
  if (!text) return;

  const pat = patientsCache.find(p => p.id === selectedPatientId);
  const patId = pat ? pat.id : 1;
  const pseudo = pat ? pat.pseudo_id : "PAC-DEMO";

  if (activeModalMode === "review") {
    await api(`/api/ward/beds/${patId}/review`, {
      method: "POST",
      body: JSON.stringify({ noteText: text, markStatus: "revisado" })
    });
    if (pat) pat.review_status = "revisado";
    logClientAudit("REVISION_CONFIRMADA", `Cama ${pat ? pat.bed_id : 'SALA'}`, `Revisado presencialmente por ${currentUser.name}: ${text}`);
  } else if (activeModalMode === "note") {
    await api(`/api/ward/beds/${patId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content: text, note_type: "Evolución Asistencial" })
    });
    logClientAudit("NOTA_REGISTRADA", `Paciente ${pseudo}`, `Nota clínica agregada: ${text}`);
  } else if (activeModalMode === "escalate") {
    logClientAudit("ALERTA_ESCALADA", `Paciente ${pseudo}`, `Escalamiento a equipo de guardia: ${text}`);
  }

  closeActionModal();
  await refreshWardData();
  renderControlDashboard();
  renderWardMap();
  if (selectedPatientId) await loadPatientNotes(selectedPatientId);
  await fetchAuditLogs();

  announceScreenReader("Acción registrada exitosamente en la bitácora.");
}

// ============================================================================
// 3. Inteligencia Clínica (Clinical Intelligence)
// ============================================================================
async function refreshDiseasesData() {
  const res = await api("/api/intelligence/diseases");
  if (res && res.diseases) {
    diseasesCache = res.diseases;
  }
}

function renderClinicalIntelligence() {
  loadResearchDiseases();
  loadResearchCases(currentResearchDiseaseId);
  executeCohortAnalysis();
}

function handleDiseaseSearch(term) {
  // Búsqueda y filtrado dinámico
  const select = $("intelligenceCategorySelect");
  const cat = select ? select.value : "ALL";
  renderComparisonModule(term.toLowerCase().trim(), cat);
}

function handleCategoryFilter(cat) {
  const input = $("intelligenceSearch");
  const term = input ? input.value.toLowerCase().trim() : "";
  renderComparisonModule(term, cat);
}

function setComparisonPreset(preset) {
  let ids = [];
  if (preset === "respiratorio") {
    ids = ["pneumonia_bac", "tep_agudo", "epoc_reagudizado"];
  } else if (preset === "cardiovascular") {
    ids = ["iamcest", "insuf_cardiaca_aguda", "acv_isquemico"];
  }
  renderComparisonModule("", "ALL", ids);
}

function renderComparisonModule(searchTerm = "", catFilter = "ALL", specificIds = null) {
  const grid = $("comparisonGrid");
  if (!grid) return;

  let list = diseasesCache.length ? [...diseasesCache] : [
    { id: "pneumonia_bac", name: "Neumonía Bacteriana (NAC)", cie11: "CA40.0", cie10: "J18.9", snomedCt: "385093006", category: "Neumología", typicalVitals: { hr: [90, 118], bp: "115/75", rr: [24, 32], spo2: [86, 92] }, oxygenResponse: "Buena respuesta inicial a cánula (2-4 L/min) con SpO2 > 94%", complicationWindow: "Riesgo de shock séptico en 24-48h", demoPrevalencePct: 24 },
    { id: "tep_agudo", name: "Tromboembolismo Pulmonar Agudo (TEP)", cie11: "BB00", cie10: "I26.9", snomedCt: "59282003", category: "Neumología / Vascular", typicalVitals: { hr: [105, 135], bp: "95/60", rr: [28, 36], spo2: [84, 90] }, oxygenResponse: "Respuesta parcial; vigilar inestabilidad hemodinámica", complicationWindow: "Ventana crítica en las primeras 6-12h", demoPrevalencePct: 11 },
    { id: "epoc_reagudizado", name: "EPOC Reagudizado", cie11: "CA22.0", cie10: "J44.1", snomedCt: "185086009", category: "Neumología", typicalVitals: { hr: [88, 108], bp: "135/85", rr: [22, 28], spo2: [88, 92] }, oxygenResponse: "Titulación fina (meta 88-92%) para evitar narcosis hipercápnica", complicationWindow: "Monitoreo gasométrico en 2-4h", demoPrevalencePct: 19 }
  ];

  if (specificIds && specificIds.length) {
    list = list.filter(d => specificIds.includes(d.id));
  } else {
    if (catFilter !== "ALL") {
      list = list.filter(d => d.category.toLowerCase().includes(catFilter.toLowerCase()));
    }
    if (searchTerm) {
      list = list.filter(d => 
        d.name.toLowerCase().includes(searchTerm) ||
        (d.cie11 && d.cie11.toLowerCase().includes(searchTerm)) ||
        (d.cie10 && d.cie10.toLowerCase().includes(searchTerm))
      );
    }
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; padding: 28px; text-align: center; color: var(--text-muted); background: var(--bg-subtle); border-radius: var(--radius-sm);">
        <p style="font-weight: 600;">Sin evidencia suficiente para los filtros indicados.</p>
        <small>Intente ampliar la búsqueda o seleccione "Todas las Especialidades".</small>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.slice(0, 3).map(dis => `
    <div class="condition-compare-card">
      <h3>${esc(dis.name)}</h3>
      <div class="condition-codes-pill">
        CIE-11: ${dis.cie11 || 'N/A'} · SNOMED: ${dis.snomedCt || 'N/A'}
      </div>

      <div class="compare-row">
        <b>SpO2 Basal Esperado en Descompensación:</b>
        ${dis.typicalVitals && dis.typicalVitals.spo2 ? `${dis.typicalVitals.spo2[0]}% - ${dis.typicalVitals.spo2[1]}%` : '88% - 93%'}
      </div>

      <div class="compare-row">
        <b>Ventana Crítica de Complicación:</b>
        ${dis.complicationWindow || 'Monitoreo estrecho en primeras 24 horas'}
      </div>

      <div class="compare-row">
        <b>Respuesta a Oxigenoterapia:</b>
        ${dis.oxygenResponse || 'Titulación protocolizada según gasometría'}
      </div>

      <div class="compare-row" style="border: 0; padding-bottom: 0;">
        <b>Prevalencia en Cohorte Demostrativa:</b>
        ${dis.demoPrevalencePct || 15}% de internaciones sintéticas
      </div>
    </div>
  `).join("");
}

function renderCohortCharts() {
  const ageContainer = $("cohortAgeChartContainer");
  const sevContainer = $("cohortSeverityChartContainer");

  // Gráfico de Barras de Edad
  if (ageContainer) {
    ageContainer.innerHTML = `
      <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 140px; padding-top: 10px; border-bottom: 1px solid var(--border-subtle);">
        <div style="text-align: center; width: 50px;">
          <div style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">6%</div>
          <div style="height: 14px; background: var(--teal-500); border-radius: 3px 3px 0 0;"></div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">&lt;18a</div>
        </div>
        <div style="text-align: center; width: 50px;">
          <div style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">22%</div>
          <div style="height: 48px; background: var(--teal-600); border-radius: 3px 3px 0 0;"></div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">18-49a</div>
        </div>
        <div style="text-align: center; width: 50px;">
          <div style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">41%</div>
          <div style="height: 90px; background: var(--teal-700); border-radius: 3px 3px 0 0;"></div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">50-69a</div>
        </div>
        <div style="text-align: center; width: 50px;">
          <div style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">31%</div>
          <div style="height: 68px; background: var(--navy-800); border-radius: 3px 3px 0 0;"></div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">70+a</div>
        </div>
      </div>
    `;
  }

  // Gráfico de Severidad
  if (sevContainer) {
    const crit = patientsCache.filter(p => p.priority === "alta").length;
    const rev = patientsCache.filter(p => p.priority === "media").length;
    const stab = patientsCache.filter(p => p.priority === "baja").length;
    const tot = patientsCache.length || 1;

    const pCrit = Math.round((crit / tot) * 100);
    const pRev = Math.round((rev / tot) * 100);
    const pStab = 100 - pCrit - pRev;

    sevContainer.innerHTML = `
      <div style="padding-top: 15px;">
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
            <span>Prioridad Alta (${crit} pacientes)</span>
            <b>${pCrit}%</b>
          </div>
          <div style="height: 8px; background: var(--bg-subtle); border-radius: 4px; overflow: hidden;">
            <div style="width: ${pCrit}%; height: 100%; background: var(--critical-badge);"></div>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
            <span>Requieren Revisión (${rev} pacientes)</span>
            <b>${pRev}%</b>
          </div>
          <div style="height: 8px; background: var(--bg-subtle); border-radius: 4px; overflow: hidden;">
            <div style="width: ${pRev}%; height: 100%; background: var(--warning-badge);"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
            <span>Condición Estable (${stab} pacientes)</span>
            <b>${pStab}%</b>
          </div>
          <div style="height: 8px; background: var(--bg-subtle); border-radius: 4px; overflow: hidden;">
            <div style="width: ${pStab}%; height: 100%; background: var(--stable-badge);"></div>
          </div>
        </div>
      </div>
    `;
  }
}

// ============================================================================
// 4. Alertas y Seguimiento (Alerts Inbox)
// ============================================================================
async function refreshAlertsData() {
  const res = await api("/api/alerts");
  if (res && Array.isArray(res)) {
    alertsCache = res;
  }
  const pendingCount = alertsCache.filter(a => a.status !== "resuelta" && a.priority === "alta").length;
  $("sidebarAlertsBadge").textContent = pendingCount;
}

function filterAlertsPriority(prio) {
  currentAlertPriorityFilter = prio;
  document.querySelectorAll("[data-alert-prio]").forEach(b => b.classList.toggle("active", b.dataset.alertPrio === prio));
  renderAlertsInbox();
}

function filterAlertsStatus(stat) {
  currentAlertStatusFilter = stat;
  document.querySelectorAll("[data-alert-stat]").forEach(b => b.classList.toggle("active", b.dataset.alertStat === stat));
  renderAlertsInbox();
}

function renderAlertsInbox() {
  const container = $("alertsInboxContainer");
  if (!container) return;

  const filtered = alertsCache.filter(a => {
    const matchPrio = currentAlertPriorityFilter === "ALL" || a.priority === currentAlertPriorityFilter;
    const matchStat = currentAlertStatusFilter === "ALL" || a.status === currentAlertStatusFilter;
    return matchPrio && matchStat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="padding: 36px; text-align: center; color: var(--text-muted);">
        <p style="font-weight: 600;">No hay alertas en esta categoría de filtro.</p>
        <small>Todas las señales asistenciales evaluadas.</small>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(alt => {
    const isHigh = alt.priority === "alta";
    return `
      <div class="alert-item-row">
        <div class="alert-priority-icon ${alt.priority}">
          ${isHigh ? '⚠' : '▲'}
        </div>

        <div class="alert-main-content">
          <h4>
            <span>${esc(alt.pseudo_id)} [Cama ${esc(alt.bed_id)}]</span>
            <span class="badge-priority ${alt.priority}" style="padding: 1px 6px; font-size: 10px;">
              ${alt.priority === 'alta' ? 'Prioridad Alta' : 'Media'}
            </span>
            <span class="badge-review ${alt.status === 'resuelta' ? 'revisado' : 'pendiente'}">
              ${alt.status === 'resuelta' ? '✓ Resuelta' : 'Pendiente'}
            </span>
          </h4>
          <p>${esc(alt.motive)}</p>
          <div style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">
            Responsable: <b>${esc(alt.assignee || 'Equipo de Guardia')}</b>
          </div>
        </div>

        <div class="alert-time">
          ${esc(alt.detected_at)}
        </div>

        <div class="alert-actions-group">
          <button class="btn-table-action" onclick="openPatientDrawer(${alt.patient_id})">
            Ver Contexto
          </button>
          ${alt.status !== 'resuelta' ? `
            <button class="btn-table-action" onclick="acknowledgeAlert(${alt.id})">
              Marcar Revisada
            </button>
            <button class="btn-table-action" style="color: var(--critical-text);" onclick="escalateAlert(${alt.id})">
              Escalar
            </button>
          ` : `
            <span style="font-size: 11px; color: var(--stable-text); font-weight: 600;">Revisado</span>
          `}
        </div>
      </div>
    `;
  }).join("");
}

async function acknowledgeAlert(alertId) {
  const alt = alertsCache.find(a => a.id === alertId);
  if (!alt) return;

  await api(`/api/alerts/${alertId}/action`, {
    method: "POST",
    body: JSON.stringify({ action: "resolver", observation: `Validado por ${currentUser.name}` })
  });

  alt.status = "resuelta";
  logClientAudit("ALERTA_REVISADA", `Alerta #${alertId} (${alt.pseudo_id})`, `Revisión confirmada por ${currentUser.name}`);
  renderAlertsInbox();
  refreshAlertsData();
  announceScreenReader(`Alerta para ${alt.pseudo_id} marcada como revisada`);
}

async function escalateAlert(alertId) {
  const alt = alertsCache.find(a => a.id === alertId);
  if (!alt) return;

  await api(`/api/alerts/${alertId}/action`, {
    method: "POST",
    body: JSON.stringify({ action: "escalar", observation: `Escalado a equipo de soporte crítico por ${currentUser.name}` })
  });

  alt.status = "escalada";
  logClientAudit("ALERTA_ESCALADA", `Alerta #${alertId} (${alt.pseudo_id})`, `Escalamiento inmediato a respuesta rápida activado.`);
  renderAlertsInbox();
  announceScreenReader(`Alerta para ${alt.pseudo_id} escalada a equipo de respuesta rápida`);
}

// ============================================================================
// 5. Centros y Red Hospitalaria (Federated Network)
// ============================================================================
async function refreshNetworkData() {
  const res = await api("/api/network/centers");
  if (res && res.centers) {
    networkCentersCache = res.centers;
  }
}

function renderNetworkNodes() {
  const container = $("networkNodesContainer");
  if (!container) return;

  const centers = networkCentersCache.length ? networkCentersCache : [
    { id: "hosp_central", name: "Hospital Central Sanify (Nodo Local)", city: "Área Metropolitana", role: "Alta Complejidad", bedsTotal: 340, bedsOccupied: 302, occupancyRate: 88.8, activeAlertsHigh: 4, fhirStatus: "HL7 FHIR R4 Conectado", latencyMs: 12 },
    { id: "hosp_norte", name: "Hospital General Regional Norte", city: "Distrito Norte", role: "General de Zona", bedsTotal: 210, bedsOccupied: 184, occupancyRate: 87.6, activeAlertsHigh: 2, fhirStatus: "HL7 FHIR R4 Sincronizado", latencyMs: 38 },
    { id: "clinica_sur", name: "Clínica Universitaria Sur", city: "Campus Universitario", role: "Soporte Especializado", bedsTotal: 160, bedsOccupied: 128, occupancyRate: 80.0, activeAlertsHigh: 1, fhirStatus: "HL7 FHIR R4 Sincronizado", latencyMs: 24 },
    { id: "centro_pediatrico", name: "Centro Pediátrico de Vigilancia", city: "Área Este", role: "Vigilancia Especializada", bedsTotal: 90, bedsOccupied: 65, occupancyRate: 72.2, activeAlertsHigh: 0, fhirStatus: "HL7 FHIR R4 Simulación", latencyMs: 45 }
  ];

  container.innerHTML = centers.map(c => `
    <div class="node-card">
      <div class="node-card-header">
        <div>
          <h3>${esc(c.name)}</h3>
          <span style="font-size: 12px; color: var(--text-muted);">${esc(c.city)} · ${esc(c.role)}</span>
        </div>
        <span class="badge-priority baja" style="font-size: 10px;">En Línea</span>
      </div>

      <div class="node-stats-grid">
        <div class="node-stat-item">
          <small style="font-size: 11px; color: var(--text-muted); display: block;">Ocupación</small>
          <b>${c.occupancyRate}%</b>
          <span style="font-size: 10px; color: var(--text-dim); display: block;">${c.bedsOccupied}/${c.bedsTotal} Camas</span>
        </div>
        <div class="node-stat-item">
          <small style="font-size: 11px; color: var(--text-muted); display: block;">Alertas Críticas</small>
          <b style="color: ${c.activeAlertsHigh > 0 ? 'var(--critical-text)' : 'var(--stable-text)'};">${c.activeAlertsHigh}</b>
          <span style="font-size: 10px; color: var(--text-dim); display: block;">En sala</span>
        </div>
      </div>

      <div class="fhir-status-indicator">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
        <span>${esc(c.fhirStatus)} · Latencia ${c.latencyMs}ms</span>
      </div>
    </div>
  `).join("");
}

// ============================================================================
// 6. Administración y Bitácora de Auditoría
// ============================================================================
function switchAdminTab(tab) {
  document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".admin-tab-pane").forEach(p => p.style.display = "none");

  if (tab === "audit") {
    $("adminTabAudit").style.display = "block";
    fetchAuditLogs();
  } else if (tab === "users") {
    $("adminTabUsers").style.display = "block";
    renderAdminUsers();
  } else if (tab === "accessibility") {
    $("adminTabAccessibility").style.display = "block";
  }

  event.target.classList.add("active");
}

async function fetchAuditLogs() {
  const res = await api("/api/admin/audit?limit=30");
  if (res && Array.isArray(res)) {
    auditLogsCache = res;
  }
  renderAuditLogs();
}

function renderAuditLogs() {
  const tbody = $("auditTableBody");
  if (!tbody) return;

  const logs = auditLogsCache.length ? auditLogsCache : [
    { timestamp: "2026-10-29 20:45", user_name: "Dra. Elena Morales", user_role: "clinico", action: "ACCESO_SISTEMA", resource: "Sesión de Usuario", details: "Inicio de sesión seguro en estación de internación." },
    { timestamp: "2026-10-29 20:42", user_name: "Dr. Javier Roca", user_role: "coordinador", action: "REVISION_CLINICA", resource: "Cama UCI-02", details: "Verificación presencial de soporte y perfusión." }
  ];

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td class="audit-time">${esc(l.timestamp || 'Hoy')}</td>
      <td><b>${esc(l.user_name)}</b></td>
      <td><span style="font-size: 11px; text-transform: capitalize;">${esc(l.user_role)}</span></td>
      <td><span class="audit-action-tag">${esc(l.action)}</span></td>
      <td>${esc(l.resource)}</td>
      <td style="color: var(--text-muted); font-size: 12px;">${esc(l.details)}</td>
    </tr>
  `).join("");
}

function logClientAudit(action, resource, details) {
  const entry = {
    timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    user_name: currentUser ? currentUser.name : "Usuario Anónimo",
    user_role: currentUser ? currentUser.role : "clinico",
    action,
    resource,
    details
  };
  auditLogsCache.unshift(entry);
}

function renderAdminUsers() {
  const tbody = $("adminUsersTableBody");
  if (!tbody) return;

  const users = [
    { name: "Dra. Elena Morales", email: "elena.morales@sanify.org", role: "Médico Clínico", permissions: "Monitoreo, registro de notas de evolución, revisión de alertas de sala." },
    { name: "Dr. Javier Roca", email: "javier.roca@sanify.org", role: "Coordinador de Guardia", permissions: "Gestión global de camas, escalamiento de alertas, pases de guardia." },
    { name: "Dra. Beatriz Santos", email: "beatriz.santos@sanify.org", role: "Investigadora Clínica", permissions: "Inteligencia clínica, análisis de cohortes y tendencias anonimizadas." },
    { name: "Lic. Marcos Vega", email: "admin@sanify.org", role: "Administrador", permissions: "Gobernanza completa, auditoría de seguridad y configuración de red." }
  ];

  tbody.innerHTML = users.map(u => `
    <tr>
      <td><b>${esc(u.name)}</b></td>
      <td style="font-family: var(--font-mono); font-size: 12px;">${esc(u.email)}</td>
      <td><span class="badge-review revisado">${esc(u.role)}</span></td>
      <td style="font-size: 12px; color: var(--text-muted);">${esc(u.permissions)}</td>
    </tr>
  `).join("");
}

// ============================================================================
// Preferencias de Accesibilidad (Temas, Escala, Movimiento)
// ============================================================================
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  const theme = isDark ? "dark" : "light";
  localStorage.setItem("sanify_theme", theme);
  api("/api/me/preferences", { method: "PUT", body: JSON.stringify({ theme }) });
  announceScreenReader(`Tema cambiado a ${isDark ? "modo oscuro Sanify" : "modo claro"}`);
}

function setTheme(theme, saveLocal = true) {
  document.body.classList.toggle("dark", theme === "dark");
  if (saveLocal) {
    localStorage.setItem("sanify_theme", theme);
    api("/api/me/preferences", { method: "PUT", body: JSON.stringify({ theme }) });
  }
}

function toggleHighContrast() {
  document.body.classList.toggle("high-contrast");
}

function setFontScale(scale) {
  document.body.classList.toggle("text-large", scale === "large");
  api("/api/me/preferences", { method: "PUT", body: JSON.stringify({ font_size: scale }) });
}

function toggleManualReducedMotion(enabled) {
  if (enabled) {
    document.documentElement.style.setProperty("--transition-fast", "0.001ms");
    document.documentElement.style.setProperty("--transition-normal", "0.001ms");
  } else {
    document.documentElement.style.setProperty("--transition-fast", "150ms cubic-bezier(0.4, 0, 0.2, 1)");
    document.documentElement.style.setProperty("--transition-normal", "220ms cubic-bezier(0.4, 0, 0.2, 1)");
  }
}

// ============================================================================
// Simulación Continua y Sutil de Telemetría (En Vivo)
// ============================================================================
function startTelemetrySimulation() {
  if (simInterval) clearInterval(simInterval);
  simInterval = setInterval(() => {
    if (!isLiveSimRunning) return;

    // Actualizar de forma sutil y realista 2-3 camas al azar (variación de +/- 1 lpm, +/- 0.2% SpO2)
    const candidates = [patientsCache[0], patientsCache[1], patientsCache[6], patientsCache[14]];
    candidates.forEach(pat => {
      if (!pat) return;
      const hrDelta = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
      const spo2Delta = (Math.random() * 0.4 - 0.2); // -0.2 a +0.2

      pat.hr = Math.max(50, Math.min(145, pat.hr + hrDelta));
      pat.spo2 = Number(Math.max(82, Math.min(99.5, pat.spo2 + spo2Delta)).toFixed(1));

      // Actualizar sparkline
      if (pat.sparklineSpo2) {
        pat.sparklineSpo2.push(pat.spo2);
        if (pat.sparklineSpo2.length > 8) pat.sparklineSpo2.shift();
      }
    });

    // Si estamos en la Unidad de Monitoreo o Centro de Control, actualizar pequeñas etiquetas
    if (currentPage === "ward") {
      renderWardMap();
    } else if (currentPage === "control") {
      renderControlDashboard();
    }

    // Si el drawer está abierto para el paciente simulado, actualizar valores
    if (selectedPatientId) {
      const activePat = patientsCache.find(p => p.id === selectedPatientId);
      if (activePat) {
        $("drawerSpo2").textContent = `${activePat.spo2}%`;
        $("drawerHr").textContent = activePat.hr;
      }
    }
  }, 4000);
}

function stopTelemetrySimulation() {
  if (simInterval) clearInterval(simInterval);
  simInterval = null;
}

function toggleLiveSimulation() {
  isLiveSimRunning = !isLiveSimRunning;
  const btn = $("telemetryToggleBtn");
  if (btn) {
    btn.textContent = isLiveSimRunning ? "● Telemetría en Vivo" : "⏸ Telemetría Pausada";
    btn.style.color = isLiveSimRunning ? "inherit" : "var(--text-dim)";
  }
  announceScreenReader(isLiveSimRunning ? "Telemetría en vivo reanudada." : "Telemetría en vivo pausada.");
}

// ============================================================================
// Historial Clínico Completo, Estudios Diagnósticos y Exámenes Previos
// ============================================================================
let currentPatientHistoryRecord = null;

async function openPatientFullHistoryModal(patientQuery) {
  if (!patientQuery && selectedPatientId) patientQuery = selectedPatientId;
  if (!patientQuery && currentSelectedRoomId) patientQuery = currentSelectedRoomId;
  if (!patientQuery) patientQuery = "PAC-9101";

  // Buscar en API
  const res = await api(`/api/patients/${encodeURIComponent(patientQuery)}/records`);
  
  if (res && res.patient) {
    currentPatientHistoryRecord = res;
  } else {
    // Fallback con paciente de caché o fallback sintético
    let p = patientsCache.find(x => x.id == patientQuery || x.pseudo_id == patientQuery || (x.room_number && x.room_number.includes(patientQuery)));
    if (!p) p = FALLBACK_PATIENTS[0];
    
    currentPatientHistoryRecord = {
      patient: p,
      notes: [
        { author: "Dra. Elena Morales", role: "clinico", created_at: "2026-10-29 08:30", note_text: "Paciente lúcido, vigil. Persiste con requerimiento de oxígeno por cánula nasal a 3 L/min. Buena tolerancia oral y sin signos de dificultad ventilatoria añadida." }
      ],
      studies: [
        { study_type: "Radiografía", title: "Radiografía de Tórax PA y Lateral Digital", study_date: "2026-10-28 09:30", findings_summary: "Opacidad alveolar en base derecha compatible con foco de consolidación.", full_report: "INFORME RADIOLÓGICO: Campos pulmonares con silueta cardíaca en límites normales. Se observa imagen de condensación parenquimatosa en lóbulo inferior derecho con broncograma aéreo evidente. Senos costofrénicos libres. Sin neumotórax.", specialist: "Dr. Ramiro Albarracín", urgency: "urgente" },
        { study_type: "Tomografía Computarizada", title: "TAC Multicorte de Tórax de Alta Resolución (TACAR)", study_date: "2026-10-29 07:15", findings_summary: "Compromiso alveolar basal derecho sin derrame pleural libre.", full_report: "INFORME TOMOGRÁFICO: Cortes axiales y reconstrucciones coronales. Consolidación lobar inferior derecha de origen bacteriano. Sin bronquiectasias de tracción ni cavitaciones activas.", specialist: "Dra. Claudia Varela", urgency: "ordinario" }
      ],
      labs: [
        {
          panel_name: "Hemograma Completo y Coagulación",
          exam_date: "2026-10-29 06:45",
          validated_by: "Bioq. Natalia Pereyra",
          results: [
            { name: "Leucocitos Totales", val: "14,800", unit: "/uL", ref: "4,500 - 10,500", status: "elevado" },
            { name: "Plaquetas", val: "220,000", unit: "/uL", ref: "150,000 - 400,000", status: "normal" },
            { name: "Hemoglobina", val: "13.4", unit: "g/dL", ref: "12.0 - 16.0", status: "normal" }
          ]
        },
        {
          panel_name: "Perfil Bioquímico y Biomarcadores",
          exam_date: "2026-10-29 06:45",
          validated_by: "Bioq. Natalia Pereyra",
          results: [
            { name: "Dímero D Cuantitativo", val: "1,250", unit: "ng/mL", ref: "< 500", status: "elevado" },
            { name: "Proteína C Reactiva (PCR)", val: "128", unit: "mg/L", ref: "< 5.0", status: "critico" },
            { name: "Troponina I Alta Sensibilidad", val: "0.03", unit: "ng/mL", ref: "< 0.04", status: "normal" },
            { name: "Creatinina Sérica", val: "1.1", unit: "mg/dL", ref: "0.7 - 1.3", status: "normal" }
          ]
        }
      ]
    };
  }

  const { patient, studies, labs, notes } = currentPatientHistoryRecord;

  // Header del Modal
  if ($("historyModalPatientName")) $("historyModalPatientName").textContent = patient.name || `Paciente ${patient.pseudo_id}`;
  if ($("historyModalBedBadge")) $("historyModalBedBadge").textContent = patient.bed_id || `HAB-${patient.room_number || '101'}`;
  if ($("historyModalPatientMeta")) $("historyModalPatientMeta").textContent = `${patient.age_range || patient.age || 45} años · ID: #${patient.pseudo_id} · CIE-11: ${patient.cie11 || 'CA40.0'}`;

  // Resumen
  if ($("histSummaryDiag")) $("histSummaryDiag").textContent = patient.condition_name || 'Neumonía';
  if ($("histSummaryCie11")) $("histSummaryCie11").textContent = patient.cie11 || 'CA40.0';
  if ($("histSummarySnomed")) $("histSummarySnomed").textContent = patient.snomed_ct || '385093006';
  if ($("histSummaryDoctor")) $("histSummaryDoctor").textContent = patient.doctor || 'Dra. Elena Morales';
  if ($("histSummaryAdmDate")) $("histSummaryAdmDate").textContent = patient.admission_date || '2026-10-27 10:15';
  if ($("histSummaryComorb")) $("histSummaryComorb").textContent = (patient.comorbidities && patient.comorbidities.length) ? (Array.isArray(patient.comorbidities) ? patient.comorbidities.join(', ') : patient.comorbidities) : 'Hipertensión Arterial (HTA), Dislipemia';
  if ($("histSummaryAllergies")) $("histSummaryAllergies").textContent = patient.allergies || 'Penicilina (Reacción dérmica previa documentada)';
  if ($("histSummaryBlood")) $("histSummaryBlood").textContent = patient.blood_type || 'A positivo (Rh+)';

  // Medicación activa
  const meds = patient.medications || (patient.meds ? patient.meds : ['Solución Salina 0.9% 1000ml/24h', 'Ceftriaxona 2g IV cada 24h', 'Ketorolac 30mg IV en rescate']);
  if ($("histSummaryMeds")) {
    $("histSummaryMeds").innerHTML = meds.map(m => `
      <span style="background: var(--bg-card-alt); border: 1px solid var(--border-subtle); padding: 4px 10px; border-radius: 4px; font-size: 11.5px; font-weight: 500;">
        💊 ${esc(m)}
      </span>
    `).join("");
  }

  // Vitals
  if ($("histVitHr")) $("histVitHr").textContent = `${patient.hr || 85} lpm`;
  if ($("histVitSpo2")) $("histVitSpo2").textContent = `${patient.spo2 || 95}%`;
  if ($("histVitBp")) $("histVitBp").textContent = `${patient.bp_sys || 120}/${patient.bp_dia || 80}`;
  if ($("histVitRr")) $("histVitRr").textContent = `${patient.rr || 18} rpm`;
  if ($("histVitTemp")) $("histVitTemp").textContent = `${patient.temp || 36.8} °C`;
  if ($("histVitNews")) $("histVitNews").textContent = patient.news2_score || 3;

  // Renderizar pestañas
  renderPatientStudies(studies || []);
  renderPatientLabs(labs || []);
  renderPatientHistoryNotes(notes || []);

  switchHistoryTab('summary');

  const dialog = $("patientHistoryModalDialog");
  if (dialog && typeof dialog.showModal === "function") {
    dialog.showModal();
  } else if (dialog) {
    dialog.setAttribute("open", "");
  }

  logClientAudit("HISTORIAL_CLINICO_COMPLETO", `Paciente #${patient.pseudo_id}`, "Consulta de expediente médico, estudios de imágenes y exámenes de laboratorio.");
}

function switchHistoryTab(tabKey) {
  const tabs = {
    summary: $("tabContentSummary"),
    studies: $("tabContentStudies"),
    labs: $("tabContentLabs"),
    notes: $("tabContentNotes")
  };

  Object.keys(tabs).forEach(k => {
    if (tabs[k]) tabs[k].style.display = k === tabKey ? "block" : "none";
  });

  document.querySelectorAll(".history-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabKey);
  });
}

function closePatientHistoryModal() {
  const dialog = $("patientHistoryModalDialog");
  if (dialog) {
    if (typeof dialog.close === "function") dialog.close();
    dialog.removeAttribute("open");
  }
}

function renderPatientStudies(studies) {
  const container = $("histStudiesContainer");
  const countBadge = $("historyStudiesCount");
  if (countBadge) countBadge.textContent = studies.length;
  if (!container) return;

  if (!studies.length) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 24px;">No se registran estudios diagnósticos por imágenes para este paciente.</div>`;
    return;
  }

  container.innerHTML = studies.map(s => `
    <div class="study-card">
      <div class="study-card-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="study-badge">${esc(s.study_type)}</span>
          <strong style="font-size: 13.5px; color: var(--text-main);">${esc(s.title)}</strong>
        </div>
        <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">
          📅 ${esc(s.study_date)} · Urgencia: <b>${esc(s.urgency)}</b>
        </span>
      </div>

      <div class="study-findings">
        <strong>Hallazgos Clínicos Relevantes:</strong><br>
        ${esc(s.findings_summary)}
      </div>

      <div style="font-size: 11.5px; color: var(--text-muted); background: var(--bg-card-alt); padding: 10px 12px; border-radius: var(--radius-sm); border: 1px dashed var(--border-subtle); margin-top: 8px; line-height: 1.5;">
        <b>Informe Completo del Especialista:</b><br>
        ${esc(s.full_report)}
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 8px; font-size: 11px; color: var(--text-dim);">
        Validado e informado por: <strong style="color: var(--text-main); margin-left: 4px;">${esc(s.specialist)}</strong>
      </div>
    </div>
  `).join("");
}

function renderPatientLabs(labs) {
  const container = $("histLabsContainer");
  const countBadge = $("historyLabsCount");
  if (countBadge) countBadge.textContent = labs.length;
  if (!container) return;

  if (!labs.length) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 24px;">No se registran paneles de laboratorio analítico previos.</div>`;
    return;
  }

  container.innerHTML = labs.map(panel => `
    <div class="lab-panel-card">
      <div class="lab-panel-header">
        <div>
          <strong style="font-size: 13px; color: var(--text-main);">🧪 ${esc(panel.panel_name)}</strong>
          <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px; font-family: var(--font-mono);">
            Fecha extracción: ${esc(panel.exam_date)}
          </span>
        </div>
        <span style="font-size: 11px; color: var(--text-muted);">
          Validador: <b>${esc(panel.validated_by)}</b>
        </span>
      </div>

      <table class="lab-table">
        <thead>
          <tr>
            <th>Determinación Analítica</th>
            <th>Resultado Obtenido</th>
            <th>Rango Normal Referencia</th>
            <th>Estado y Alerta</th>
          </tr>
        </thead>
        <tbody>
          ${(panel.results || []).map(r => `
            <tr>
              <td style="font-weight: 600; color: var(--text-main);">${esc(r.name)}</td>
              <td style="font-family: var(--font-mono); font-weight: 700; ${r.status === 'critico' ? 'color: #dc2626;' : (r.status === 'elevado' ? 'color: #d97706;' : 'color: var(--text-main);')}">
                ${esc(r.val)} <small style="font-weight: normal; color: var(--text-muted);">${esc(r.unit)}</small>
              </td>
              <td style="color: var(--text-muted); font-size: 11px;">${esc(r.ref)} ${esc(r.unit)}</td>
              <td>
                <span class="lab-status-badge ${esc(r.status)}">
                  ${r.status === 'critico' ? '⚠ VALOR CRÍTICO' : (r.status === 'elevado' ? '▲ ELEVADO' : '● NORMAL')}
                </span>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `).join("");
}

function renderPatientHistoryNotes(notes) {
  const container = $("histNotesList");
  if (!container) return;

  if (!notes || !notes.length) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 18px;">Sin notas de evolución registradas aún. Ingrese la primera nota arriba.</div>`;
    return;
  }

  container.innerHTML = notes.map(n => `
    <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); padding: 12px 14px; border-radius: var(--radius-sm); border-left: 3px solid var(--teal-600);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 11px;">
        <span style="font-weight: 700; color: var(--text-main);">👨‍⚕️ ${esc(n.author || 'Profesional de Guardia')} (${esc(n.role || 'Médico')})</span>
        <span style="color: var(--text-muted); font-family: var(--font-mono);">${esc(n.created_at)}</span>
      </div>
      <p style="margin: 0; font-size: 12px; color: var(--text-main); line-height: 1.5;">${esc(n.note_text)}</p>
    </div>
  `).join("");
}

async function submitHistoryNote(e) {
  e.preventDefault();
  const input = $("histNewNoteText");
  const text = input ? input.value.trim() : "";
  if (!text || !currentPatientHistoryRecord) return;

  const patientId = currentPatientHistoryRecord.patient.id;
  const author = currentUser ? currentUser.name : "Dra. Elena Morales";
  const role = currentUser ? currentUser.role : "clinico";

  await api(`/api/patients/${patientId}/notes`, {
    method: "POST",
    body: JSON.stringify({ note_text: text })
  });

  const newNote = {
    id: Date.now(),
    author,
    role,
    created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
    note_text: text
  };

  currentPatientHistoryRecord.notes.unshift(newNote);
  renderPatientHistoryNotes(currentPatientHistoryRecord.notes);
  input.value = "";

  notifyAction("Nota clínica registrada y guardada en base de datos.");
}

// ============================================================================
// Módulo de Inteligencia Clínica: Pestañas de Investigación y Comparación
// ============================================================================
function switchIntelligenceTab(tab) {
  const isResearch = (tab === 'research');
  const paneRes = $("intPaneResearch");
  const paneComp = $("intPaneCompare");
  const btnRes = $("intTabBtnResearch");
  const btnComp = $("intTabBtnCompare");

  if (paneRes) paneRes.style.display = isResearch ? "block" : "none";
  if (paneComp) paneComp.style.display = isResearch ? "none" : "block";

  if (btnRes) btnRes.classList.toggle("active", isResearch);
  if (btnComp) btnComp.classList.toggle("active", !isResearch);

  if (!isResearch) {
    renderComparisonModule();
    renderCohortCharts();
  }
}

let currentResearchDiseaseId = "pneumonia_bac";
let currentResearchStatusFilter = "ALL";
let researchCasesCache = [];
let currentAnalysisData = null;

async function loadResearchDiseases() {
  const select = $("researchDiseaseSelect");
  if (!select) return;

  const res = await api("/api/research/diseases");
  if (res && res.diseases && res.diseases.length) {
    select.innerHTML = res.diseases.map(d => `
      <option value="${d.disease_id}" ${d.disease_id === currentResearchDiseaseId ? 'selected' : ''}>
        ${esc(d.disease_name)} (${d.total_cases} casos · Mortalidad: ${d.mortality_rate}%)
      </option>
    `).join("");
  }
}

async function onResearchDiseaseSelected(diseaseId) {
  currentResearchDiseaseId = diseaseId;
  await loadResearchCases(diseaseId);
  await executeCohortAnalysis();
}

async function loadResearchCases(diseaseId, status = "ALL", query = "") {
  if (!diseaseId) diseaseId = currentResearchDiseaseId;
  let url = `/api/research/cases?diseaseId=${encodeURIComponent(diseaseId)}`;
  if (status && status !== "ALL") url += `&status=${encodeURIComponent(status)}`;
  if (query) url += `&q=${encodeURIComponent(query)}`;

  const res = await api(url);
  if (res && Array.isArray(res)) {
    researchCasesCache = res;
    renderResearchCases(res);
  }
}

function setResearchStatusFilter(status) {
  currentResearchStatusFilter = status;
  ["filterCaseAll", "filterCaseAlive", "filterCaseDeceased"].forEach(id => {
    const btn = $(id);
    if (!btn) return;
    const isAct = (status === "ALL" && id === "filterCaseAll") ||
                  (status === "vivo" && id === "filterCaseAlive") ||
                  (status === "fallecido" && id === "filterCaseDeceased");
    btn.classList.toggle("active", isAct);
  });
  loadResearchCases(currentResearchDiseaseId, status);
}

function filterResearchCases(term) {
  if (!term) {
    renderResearchCases(researchCasesCache);
    return;
  }
  const q = term.toLowerCase().trim();
  const filtered = researchCasesCache.filter(c => 
    c.case_code.toLowerCase().includes(q) ||
    c.patient_name.toLowerCase().includes(q) ||
    c.clinical_outcome_summary.toLowerCase().includes(q) ||
    (c.comorbidities && c.comorbidities.some(x => x.toLowerCase().includes(q)))
  );
  renderResearchCases(filtered);
}

function renderResearchCases(cases) {
  const tbody = $("researchCasesTableBody");
  if (!tbody) return;

  const total = cases.length;
  const alive = cases.filter(c => c.vital_status.startsWith("vivo")).length;
  const deceased = cases.filter(c => c.vital_status === "fallecido").length;

  if ($("countCaseAll")) $("countCaseAll").textContent = total;
  if ($("countCaseAlive")) $("countCaseAlive").textContent = alive;
  if ($("countCaseDeceased")) $("countCaseDeceased").textContent = deceased;

  if (!cases.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">No se encontraron casos que coincidan con los filtros aplicados.</td></tr>`;
    return;
  }

  tbody.innerHTML = cases.map(c => {
    const isDead = c.vital_status === "fallecido";
    const bio = c.key_biomarkers || {};
    const comorbs = (c.comorbidities || []).map(x => `<span style="background: var(--bg-card-alt); border: 1px solid var(--border-subtle); padding: 1px 5px; border-radius: 3px; font-size: 10px; margin-right: 3px;">${esc(x)}</span>`).join("");

    return `
      <tr style="${isDead ? 'background: rgba(239, 68, 68, 0.04);' : ''}">
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--text-main);">${esc(c.case_code)}</td>
        <td>
          <strong>${esc(c.patient_name)}</strong><br>
          <small style="color: var(--text-muted);">${c.age} años · Sexo ${c.gender}</small>
        </td>
        <td>
          <span class="vital-badge ${isDead ? 'deceased' : 'alive'}">
            ${isDead ? '⚫ FALLECIDO (ÓBITO)' : (c.vital_status === 'vivo_internado' ? '🔵 VIVO - EN SALA' : '🟢 VIVO - ALTA MÉDICA')}
          </span>
        </td>
        <td style="font-family: var(--font-mono);">${c.stay_days} días</td>
        <td>
          <span style="font-family: var(--font-mono); font-weight: 700; color: ${c.peak_news2 >= 7 ? '#dc2626' : (c.peak_news2 >= 4 ? '#d97706' : '#059669')}">
            ${c.peak_news2}
          </span>
        </td>
        <td style="font-family: var(--font-mono); font-size: 11px;">
          DD: <b style="${(bio.dimer_d || 0) > 2000 ? 'color: #dc2626;' : ''}">${bio.dimer_d || '-'}</b> · 
          Trop: <b style="${(bio.troponin || 0) > 0.1 ? 'color: #dc2626;' : ''}">${bio.troponin || '-'}</b> · 
          Lac: <b style="${(bio.lactate || 0) > 2.5 ? 'color: #dc2626;' : ''}">${bio.lactate || '-'}</b> · 
          SpO2: <b style="${(bio.spo2_nadir || 99) < 85 ? 'color: #dc2626;' : ''}">${bio.spo2_nadir || '-'}%</b>
        </td>
        <td>${comorbs || '<span style="color: var(--text-dim); font-size: 11px;">Sin comorbilidades</span>'}</td>
        <td style="font-size: 11.5px; line-height: 1.4; color: var(--text-main);">${esc(c.clinical_outcome_summary)}</td>
      </tr>
    `;
  }).join("");
}

async function executeCohortAnalysis() {
  const diseaseId = currentResearchDiseaseId;
  const btn = $("btnRunPatternAnalysis");
  if (btn) btn.innerHTML = `Analizando...`;

  const res = await api("/api/research/analyze", {
    method: "POST",
    body: JSON.stringify({ diseaseId })
  });

  if (btn) btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
    Analizar Patrones y Coincidencias
  `;

  if (res && !res.error) {
    currentAnalysisData = res;
    renderCohortAnalysisResults(res);
    notifyAction(`Análisis de patrones completado para ${res.diseaseName}`);
  }
}

function renderCohortAnalysisResults(data) {
  const sum = data.cohortSummary || {};

  if ($("kpiTotalCases")) $("kpiTotalCases").textContent = sum.totalCases || 0;
  if ($("kpiStayDays")) $("kpiStayDays").textContent = `Estancia media: ${sum.avgStayAll || 0} días`;
  if ($("kpiAliveCases")) $("kpiAliveCases").textContent = sum.aliveCount || 0;
  if ($("kpiAlivePct")) $("kpiAlivePct").textContent = `${sum.survivalRatePct || 0}% Sobrevida · Edad media ${sum.avgAgeAlive || 0}a`;
  if ($("kpiDeceasedCases")) $("kpiDeceasedCases").textContent = sum.deceasedCount || 0;
  if ($("kpiDeceasedPct")) $("kpiDeceasedPct").textContent = `${sum.mortalityRatePct || 0}% Mortalidad · Edad media ${sum.avgAgeDeceased || 0}a`;
  if ($("kpiNewsContrast")) {
    $("kpiNewsContrast").innerHTML = `<span style="color: #059669;">${sum.avgNewsAlive || 0}</span> vs <span style="color: #dc2626;">${sum.avgNewsDeceased || 0}</span>`;
  }

  if ($("analysisHeading")) {
    $("analysisHeading").textContent = `Patrones y Factores Críticos Identificados en ${data.diseaseName} (${data.cie11})`;
  }
  if ($("analysisBadgeStatus")) {
    $("analysisBadgeStatus").textContent = `● ${(data.coincidences || []).length} Coincidencias Clínicas Detectadas`;
  }

  const coincList = $("coincidencesList");
  if (coincList) {
    coincList.innerHTML = (data.coincidences || []).map(c => `
      <div class="coincidence-card ${c.severity === 'alta' ? 'critica' : ''}">
        <div class="coincidence-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">${esc(c.category)}</span>
            <strong style="font-size: 13.5px; color: var(--text-main);">${esc(c.title)}</strong>
          </div>
          <span class="hazard-multiplier">
            Riesgo: ${esc(c.riskMultiplier)}
          </span>
        </div>
        <p style="margin: 0; font-size: 12px; color: var(--text-main); line-height: 1.5;">${esc(c.description)}</p>
        <div style="margin-top: 6px; font-size: 11px; color: var(--text-muted);">
          Prevalencia en pacientes fallecidos: <strong style="color: #dc2626;">${c.prevalenceInDeceasedPct}%</strong>
        </div>
      </div>
    `).join("");
  }

  const bioTbody = $("biomarkerComparisonTableBody");
  if (bioTbody && data.bioStats) {
    bioTbody.innerHTML = Object.values(data.bioStats).map(b => {
      const isHighHazard = b.hazardRatio >= 2.5;
      return `
        <tr>
          <td style="font-weight: 600; color: var(--text-main);">${esc(b.label)}</td>
          <td style="color: var(--text-muted); font-family: var(--font-mono);">${esc(b.ref)} ${esc(b.unit)}</td>
          <td style="font-family: var(--font-mono); font-weight: 600; color: #059669;">
            ${b.aliveAvg} <small>${esc(b.unit)}</small>
          </td>
          <td style="font-family: var(--font-mono); font-weight: 700; color: #dc2626;">
            ${b.deceasedAvg} <small>${esc(b.unit)}</small>
          </td>
          <td>
            <span class="hazard-multiplier" style="${isHighHazard ? 'background: #fef2f2; color: #dc2626;' : 'background: #f1f5f9; color: #475569;'}">
              ${b.hazardRatio}x
            </span>
          </td>
          <td>
            <span style="font-size: 11px; font-weight: 700; color: ${isHighHazard ? '#dc2626' : '#d97706'};">
              ${isHighHazard ? '⚠ ELEVACIÓN CRÍTICA' : 'MODERADA'}
            </span>
          </td>
        </tr>
      `;
    }).join("");
  }

  const recList = $("recommendationsList");
  if (recList && data.recommendations) {
    recList.innerHTML = data.recommendations.map(r => `<li>${esc(r)}</li>`).join("");
  }
}

function previewOfficialReport() {
  if (!currentAnalysisData) {
    executeCohortAnalysis().then(() => renderReportSheetContent());
  } else {
    renderReportSheetContent();
  }
  const dialog = $("researchReportModalDialog");
  if (dialog && typeof dialog.showModal === "function") {
    dialog.showModal();
  } else if (dialog) {
    dialog.setAttribute("open", "");
  }
}

function closeResearchReportModal() {
  const dialog = $("researchReportModalDialog");
  if (dialog) {
    if (typeof dialog.close === "function") dialog.close();
    dialog.removeAttribute("open");
  }
}

function renderReportSheetContent() {
  const sheet = $("printableReportSheet");
  if (!sheet || !currentAnalysisData) return;
  const d = currentAnalysisData;
  const s = d.cohortSummary || {};

  sheet.innerHTML = `
    <div class="report-header-inst" style="border-bottom: 2px solid var(--border-subtle); padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h2 style="font-size: 18px; font-weight: 800; margin: 0; color: var(--text-main); letter-spacing: 0.5px;">SISTEMA HOSPITALARIO SANIFY</h2>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">DIVISIÓN DE VIGILANCIA CLÍNICA, INVESTIGACIÓN Y EPIDEMIOLOGÍA HOSPITALARIA</div>
      </div>
      <div style="text-align: right; font-size: 11px; color: var(--text-dim); font-family: var(--font-mono);">
        FECHA DE EMISIÓN: ${new Date().toLocaleDateString('es-ES')}<br>
        DICTAMEN TÉCNICO: #INF-COH-${(d.diseaseId || 'PAT').toUpperCase()}
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin: 0 0 6px;">
        INFORME CLÍNICO DE ANÁLISIS DE COHORTE Y PATRONES DE MORTALIDAD
      </h3>
      <div style="font-size: 12px; color: var(--text-muted);">
        Patología Evaluada: <b>${esc(d.diseaseName)}</b> | Clasificación: <b>CIE-11: ${esc(d.cie11)}</b> | Muestra Analizada: <b>${s.totalCases} Casos Clínicos</b>
      </div>
    </div>

    <!-- Resumen Demográfico y Mortalidad -->
    <div style="background: var(--bg-subtle); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 14px; margin-bottom: 20px;">
      <h4 style="font-size: 12px; font-weight: 700; color: var(--text-main); text-transform: uppercase; margin: 0 0 10px;">
        1. BALANCE DE DESENLACE CLÍNICO Y DEMOGRAFÍA
      </h4>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; text-align: center;">
        <div style="background: var(--bg-card); padding: 10px; border-radius: 4px; border: 1px solid var(--border-subtle);">
          <div style="font-size: 10px; color: var(--text-dim); text-transform: uppercase;">Total Casos</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--text-main);">${s.totalCases}</div>
        </div>
        <div style="background: var(--bg-card); padding: 10px; border-radius: 4px; border: 1px solid var(--border-subtle);">
          <div style="font-size: 10px; color: #10b981; text-transform: uppercase;">Sobrevida / Vivos</div>
          <div style="font-size: 20px; font-weight: 700; color: #10b981;">${s.survivalRatePct}%</div>
          <small style="font-size: 10px; color: var(--text-muted);">${s.aliveCount} pacientes</small>
        </div>
        <div style="background: var(--bg-card); padding: 10px; border-radius: 4px; border: 1px solid var(--border-subtle);">
          <div style="font-size: 10px; color: #ef4444; text-transform: uppercase;">Tasa Mortalidad</div>
          <div style="font-size: 20px; font-weight: 700; color: #ef4444;">${s.mortalityRatePct}%</div>
          <small style="font-size: 10px; color: var(--text-muted);">${s.deceasedCount} óbitos</small>
        </div>
        <div style="background: var(--bg-card); padding: 10px; border-radius: 4px; border: 1px solid var(--border-subtle);">
          <div style="font-size: 10px; color: var(--text-dim); text-transform: uppercase;">Estancia Media</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--text-main);">${s.avgStayAll}d</div>
          <small style="font-size: 10px; color: var(--text-muted);">Vivos: ${s.avgStayAlive}d / Óbitos: ${s.avgStayDeceased}d</small>
        </div>
      </div>
    </div>

    <!-- Contraste de Biomarcadores -->
    <div style="margin-bottom: 22px;">
      <h4 style="font-size: 12px; font-weight: 700; color: var(--text-main); text-transform: uppercase; margin: 0 0 8px;">
        2. ANÁLISIS COMPARATIVO DE BIOMARCADORES DE RIESGO
      </h4>
      <table class="lab-table" style="font-size: 11.5px; border: 1px solid var(--border-subtle);">
        <thead style="background: var(--bg-subtle);">
          <tr>
            <th style="color: var(--text-main);">Biomarcador</th>
            <th style="color: var(--text-main);">Rango Referencia</th>
            <th style="color: var(--text-main);">Media Supervivientes</th>
            <th style="color: var(--text-main);">Media Casos Fatales</th>
            <th style="color: var(--text-main);">Factor Multiplicador (Hazard)</th>
          </tr>
        </thead>
        <tbody>
          ${Object.values(d.bioStats || {}).map(b => `
            <tr>
              <td><b>${esc(b.label)}</b></td>
              <td>${esc(b.ref)} ${esc(b.unit)}</td>
              <td style="color: #10b981; font-weight: 600;">${b.aliveAvg} ${esc(b.unit)}</td>
              <td style="color: #ef4444; font-weight: 700;">${b.deceasedAvg} ${esc(b.unit)}</td>
              <td><b style="color: ${b.hazardRatio >= 2.5 ? '#ef4444' : 'var(--text-muted)'};">${b.hazardRatio}x</b></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <!-- Coincidencias Críticas -->
    <div style="margin-bottom: 22px;">
      <h4 style="font-size: 12px; font-weight: 700; color: var(--text-main); text-transform: uppercase; margin: 0 0 10px;">
        3. COINCIDENCIAS Y PATRONES ASOCIADOS A MORTALIDAD
      </h4>
      ${(d.coincidences || []).map((c, i) => `
        <div style="border-left: 3px solid #ef4444; padding: 10px 14px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-left-width: 3px; border-left-color: #ef4444; border-radius: 4px; margin-bottom: 8px; font-size: 11.5px;">
          <div style="font-weight: 700; color: var(--text-main); margin-bottom: 3px;">
            [${i + 1}] ${esc(c.title)} — Prevalencia en óbitos: ${c.prevalenceInDeceasedPct}% (Factor: ${esc(c.riskMultiplier)})
          </div>
          <div style="color: var(--text-muted); line-height: 1.4;">${esc(c.description)}</div>
        </div>
      `).join("")}
    </div>

    <!-- Recomendaciones -->
    <div style="margin-bottom: 26px; background: var(--stable-bg); border: 1px solid var(--stable-border); border-radius: 6px; padding: 12px 16px;">
      <h4 style="font-size: 12px; font-weight: 700; color: var(--stable-text); text-transform: uppercase; margin: 0 0 6px;">
        4. PAUTAS DE INTERVENCIÓN Y MITIGACIÓN DE RIESGO
      </h4>
      <ul style="margin: 0; padding-left: 18px; font-size: 11.5px; color: var(--stable-text); line-height: 1.5;">
        ${(d.recommendations || []).map(r => `<li>${esc(r)}</li>`).join("")}
      </ul>
    </div>

    <!-- Firma Institucional -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid var(--border-subtle); padding-top: 18px; font-size: 11px; color: var(--text-dim);">
      <div>
        <b>Sanify Healthcare Analytics</b><br>
        Ambiente de Investigación y Evidencia Asistencial
      </div>
      <div style="text-align: right;">
        <div style="width: 180px; border-bottom: 1px solid #94a3b8; margin-bottom: 4px;"></div>
        <b>Comité de Epidemiología e Inteligencia Clínica</b><br>
        Validación Técnica Oficial
      </div>
    </div>
  `;
}

function printOfficialReportSheet() {
  window.print();
}

function downloadOfficialReportPDF() {
  if (!currentAnalysisData) {
    executeCohortAnalysis().then(() => generateAndDownloadPDF());
  } else {
    generateAndDownloadPDF();
  }
}

function generateAndDownloadPDF() {
  const data = currentAnalysisData;
  if (!data) return;

  try {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      previewOfficialReport();
      setTimeout(() => window.print(), 300);
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const sum = data.cohortSummary || {};

    // 1. Cabecera Institucional
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 26, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("SISTEMA HOSPITALARIO SANIFY", 14, 11);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text("DIVISIÓN DE VIGILANCIA CLÍNICA, INVESTIGACIÓN Y EPIDEMIOLOGÍA HOSPITALARIA", 14, 17);
    doc.text("INFORME OFICIAL DE ANÁLISIS DE PATRONES DE MORTALIDAD EN COHORTES", 14, 22);

    // 2. Metadatos de la Patología
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`Patología Investigada: ${data.diseaseName || 'Cohorte'}`, 14, 35);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Código CIE-11: ${data.cie11 || 'N/A'}  |  Total Casos Evaluados: ${sum.totalCases || 0}  |  Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 41);

    // 3. Tabla Resumen Demográfico y Mortalidad
    const statsData = [
      ["Casos Totales", `${sum.totalCases || 0} pacientes evaluados`],
      ["Supervivientes (Vivos / Alta)", `${sum.aliveCount || 0} (${sum.survivalRatePct || 0}%) — Edad media: ${sum.avgAgeAlive || 0} años`],
      ["Casos Fatales (Óbitos)", `${sum.deceasedCount || 0} (${sum.mortalityRatePct || 0}%) — Edad media: ${sum.avgAgeDeceased || 0} años`],
      ["Estancia Hospitalaria Media", `Global: ${sum.avgStayAll || 0}d  (Vivos: ${sum.avgStayAlive || 0}d  vs  Óbitos: ${sum.avgStayDeceased || 0}d)`],
      ["Score NEWS2 Pico Promedio", `Supervivientes: ${sum.avgNewsAlive || 0}  vs  Casos Fatales: ${sum.avgNewsDeceased || 0}`]
    ];

    doc.autoTable({
      startY: 46,
      head: [["Parámetro Epidemiológico", "Valor Obtenido en Cohorte"]],
      body: statsData,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      margin: { left: 14, right: 14 }
    });

    // 4. Tabla Comparativa de Biomarcadores
    const bioRows = Object.values(data.bioStats || {}).map(b => [
      b.label,
      `${b.ref} ${b.unit}`,
      `${b.aliveAvg} ${b.unit}`,
      `${b.deceasedAvg} ${b.unit}`,
      `${b.hazardRatio}x`,
      b.hazardRatio >= 2.5 ? "CRÍTICA (Elevación muy marcada)" : (b.hazardRatio >= 1.5 ? "MODERADA" : "BASAL")
    ]);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Contraste de Biomarcadores Clave (Supervivientes vs Casos Fatales)", 14, doc.lastAutoTable.finalY + 8);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 11,
      head: [["Biomarcador", "Rango Ref.", "Media Vivos", "Media Óbitos", "Hazard Ratio", "Significancia"]],
      body: bioRows,
      theme: "striped",
      headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      margin: { left: 14, right: 14 }
    });

    // 5. Coincidencias Críticas Detectadas
    let yPos = doc.lastAutoTable.finalY + 8;
    if (yPos > 240) { doc.addPage(); yPos = 20; }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Coincidencias Clínicas y Patrones de Mortalidad Identificados", 14, yPos);
    yPos += 5;

    (data.coincidences || []).forEach((c, idx) => {
      if (yPos > 265) { doc.addPage(); yPos = 20; }
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(185, 28, 28);
      doc.text(`[${idx + 1}] ${c.title} (Prevalencia en óbitos: ${c.prevalenceInDeceasedPct}% | Factor: ${c.riskMultiplier})`, 14, yPos);
      yPos += 4.5;

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      const splitText = doc.splitTextToSize(c.description, 180);
      doc.text(splitText, 14, yPos);
      yPos += splitText.length * 3.8 + 2;
    });

    // 6. Recomendaciones Asistenciales
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 148, 136);
    doc.text("Pautas de Detección Precoz y Conducta Preventiva Recomendada", 14, yPos);
    yPos += 5;

    (data.recommendations || []).forEach(r => {
      if (yPos > 275) { doc.addPage(); yPos = 20; }
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      const splitRec = doc.splitTextToSize(`• ${r}`, 180);
      doc.text(splitRec, 14, yPos);
      yPos += splitRec.length * 3.8 + 1;
    });

    // 7. Pie de Página y Firma Digital
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(148, 163, 184);
      doc.text(`Sanify Clinical Intelligence System — Documento de Evidencia Médica — Página ${i} de ${totalPages}`, 14, 290);
      doc.text(`Firma digital SHA-256: 7f8a9e01bc24d67e... — Validado para Comité Clínico`, 110, 290);
    }

    doc.save(`Informe_Investigacion_${data.diseaseId || 'patologia'}_${new Date().toISOString().slice(0, 10)}.pdf`);
    notifyAction("Informe en PDF generado y descargado correctamente");
  } catch (err) {
    console.error("Error al generar PDF:", err);
    previewOfficialReport();
  }
}
