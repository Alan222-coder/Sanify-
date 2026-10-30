const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");

const {
  ensureClinicalTables,
  seedClinicalStudiesAndLabs,
  seedEpidemiologicalCases,
  analyzeDiseaseCohort,
  getPatientFullRecords
} = require("./server_clinical_data");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "sanify-clinical-secret-2026";

// Base de datos SQLite para Sanify
const db = new Database(path.join(__dirname, "vitasentinel.db"));
db.pragma("foreign_keys = ON");

// Inicialización del esquema de datos clínicos sintéticos
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'clinico', -- clinico, investigador, coordinador, admin
  theme TEXT DEFAULT 'light',
  font_size TEXT DEFAULT 'normal',
  reduced_motion INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pseudo_id TEXT NOT NULL UNIQUE,
  bed_id TEXT NOT NULL UNIQUE,
  sector TEXT NOT NULL, -- UCI, INTERMEDIOS, AISLAMIENTO, GENERAL
  room_number TEXT NOT NULL,
  age_range TEXT NOT NULL,
  condition_name TEXT NOT NULL,
  cie11 TEXT,
  cie10 TEXT,
  snomed_ct TEXT,
  severity TEXT NOT NULL, -- 'Alta', 'Media', 'Estable'
  priority TEXT NOT NULL, -- 'alta', 'media', 'baja'
  review_status TEXT DEFAULT 'pendiente', -- 'pendiente', 'en_revision', 'revisado'
  news2_score INTEGER DEFAULT 0,
  hr INTEGER NOT NULL,
  spo2 REAL NOT NULL,
  bp_sys INTEGER NOT NULL,
  bp_dia INTEGER NOT NULL,
  rr INTEGER NOT NULL,
  temp REAL NOT NULL,
  oxygen_supply TEXT DEFAULT 'Aire ambiente',
  admission_time TEXT DEFAULT CURRENT_TIMESTAMP,
  last_vitals_update TEXT DEFAULT CURRENT_TIMESTAMP,
  reviewed_by TEXT,
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  pseudo_id TEXT NOT NULL,
  bed_id TEXT NOT NULL,
  priority TEXT NOT NULL, -- 'alta', 'media', 'baja'
  motive TEXT NOT NULL,
  detected_at TEXT DEFAULT CURRENT_TIMESTAMP,
  assignee TEXT DEFAULT 'Equipo de Guardia',
  status TEXT DEFAULT 'pendiente', -- 'pendiente', 'en_revision', 'resuelta', 'escalada'
  notes TEXT DEFAULT '',
  resolved_by TEXT,
  resolved_at TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clinical_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  note_type TEXT DEFAULT 'Evolución', -- 'Evolución', 'Enfermería', 'Revisión Alerta', 'Pase de Guardia'
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details TEXT,
  ip_address TEXT DEFAULT '127.0.0.1 (Local)',
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// Catálogo clínico maestro de enfermedades sintéticas con taxonomía real (CIE-11, CIE-10, SNOMED-CT)
const CLINICAL_DISEASES_DB = [
  {
    id: "pneumonia_bac",
    name: "Neumonía Bacteriana Adquirida en la Comunidad (NAC)",
    cie11: "CA40.0",
    cie10: "J18.9",
    snomedCt: "385093006",
    category: "Neumología",
    severityDefault: "Alta",
    syndromes: ["Condensación Pulmonar", "Insuficiencia Respiratoria Aguda", "Síndrome Febril Agudo"],
    typicalVitals: { hr: [90, 118], bp: "115/75", rr: [24, 32], spo2: [86, 92], temp: [38.5, 39.8] },
    oxygenResponse: "Buena respuesta inicial a cánula nasal (2-4 L/min) con meta SpO2 > 94%",
    complicationWindow: "Riesgo de sepsis o derrame paraneumónico en ventana de 24-48h",
    demoPrevalencePct: 24,
    syntheticCohortSize: 142
  },
  {
    id: "tep_agudo",
    name: "Tromboembolismo Pulmonar Agudo (TEP)",
    cie11: "BB00",
    cie10: "I26.9",
    snomedCt: "59282003",
    category: "Neumología / Vascular",
    severityDefault: "Alta",
    syndromes: ["Disnea Súbita Inexplicada", "Sobrecarga Ventricular Derecha", "Hipoxemia Refractaria"],
    typicalVitals: { hr: [105, 135], bp: "95/60", rr: [28, 36], spo2: [84, 90], temp: [36.8, 37.6] },
    oxygenResponse: "Respuesta parcial a oxígeno; requiere monitoreo estrecho de presión arterial y hemodinámica",
    complicationWindow: "Ventana crítica de inestabilidad hemodinámica en las primeras 6-12 horas",
    demoPrevalencePct: 11,
    syntheticCohortSize: 68
  },
  {
    id: "epoc_reagudizado",
    name: "Enfermedad Pulmonar Obstructiva Crónica (EPOC) Reagudizada",
    cie11: "CA22.0",
    cie10: "J44.1",
    snomedCt: "185086009",
    category: "Neumología",
    severityDefault: "Media",
    syndromes: ["Broncoobstrucción Aguda", "Hipercapnia Potencial", "Fatiga Muscular Respiratoria"],
    typicalVitals: { hr: [88, 108], bp: "135/85", rr: [22, 28], spo2: [88, 92], temp: [37.2, 38.3] },
    oxygenResponse: "Oxigenoterapia titula (meta 88-92%) para prevenir narcosis hipercápnica",
    complicationWindow: "Monitoreo de acidosis respiratoria con gasometría en 2-4 horas",
    demoPrevalencePct: 19,
    syntheticCohortSize: 115
  },
  {
    id: "iamcest",
    name: "Infarto Agudo de Miocardio con Elevación de ST (IAMCEST)",
    cie11: "BA41.0",
    cie10: "I21.0",
    snomedCt: "401303003",
    category: "Cardiología",
    severityDefault: "Alta",
    syndromes: ["Dolor Torácico Opresivo", "Isquemia Miocárdica Aguda", "Riesgo de Arritmia Maligna"],
    typicalVitals: { hr: [60, 115], bp: "140/90", rr: [18, 24], spo2: [94, 98], temp: [36.5, 37.2] },
    oxygenResponse: "Indicado solo si SpO2 < 90% o en signos de hipoxemia manifiesta",
    complicationWindow: "Ventana de reperfusión prioritaria (<120 min) y monitoreo de arritmias",
    demoPrevalencePct: 15,
    syntheticCohortSize: 92
  },
  {
    id: "sepsis_urinaria",
    name: "Sepsis de Foco Urológico / Pielonefritis Complicada",
    cie11: "1C43",
    cie10: "A41.9",
    snomedCt: "91302008",
    category: "Infectología",
    severityDefault: "Alta",
    syndromes: ["Respuesta Inflamatoria Sistémica", "Oliguria Potencial", "Inestabilidad Térmica"],
    typicalVitals: { hr: [100, 125], bp: "90/55", rr: [22, 28], spo2: [93, 96], temp: [38.8, 40.1] },
    oxygenResponse: "Monitoreo de perfusión tisular, lactato sérico y balance hidroelectrolítico",
    complicationWindow: "Primeras 6 horas clave para resucitación guiada por objetivos",
    demoPrevalencePct: 16,
    syntheticCohortSize: 98
  },
  {
    id: "insuf_cardiaca_aguda",
    name: "Insuficiencia Cardíaca Congestiva Agudizada",
    cie11: "BD11",
    cie10: "I50.9",
    snomedCt: "84114007",
    category: "Cardiología",
    severityDefault: "Media",
    syndromes: ["Congestión Pulmonar", "Sobrecarga de Volumen", "Ortopnea"],
    typicalVitals: { hr: [85, 110], bp: "155/95", rr: [24, 30], spo2: [89, 93], temp: [36.4, 37.1] },
    oxygenResponse: "Optimización con soporte ventilatorio no invasivo si hay fatiga",
    complicationWindow: "Respuesta a diuréticos evaluable a las 2 y 6 horas",
    demoPrevalencePct: 18,
    syntheticCohortSize: 110
  },
  {
    id: "acv_isquemico",
    name: "Accidente Cerebrovascular Isquémico Agudo (Ictus)",
    cie11: "8B11",
    cie10: "I63.9",
    snomedCt: "422504002",
    category: "Neurología",
    severityDefault: "Alta",
    syndromes: ["Déficit Neurológico Focal", "Alteración del Habla", "Asimetría Facial"],
    typicalVitals: { hr: [72, 95], bp: "165/100", rr: [16, 20], spo2: [95, 99], temp: [36.6, 37.4] },
    oxygenResponse: "Mantener normoxia; evitar hipertermia y oscilaciones tensionales bruscas",
    complicationWindow: "Ventana terapéutica aguda (0-4.5 horas para fibrinolisis)",
    demoPrevalencePct: 12,
    syntheticCohortSize: 74
  },
  {
    id: "cetoacidosis_diabetica",
    name: "Cetoacidosis Diabética (CAD) Moderada/Severa",
    cie11: "5A10.1",
    cie10: "E10.1",
    snomedCt: "420422005",
    category: "Endocrinología",
    severityDefault: "Media",
    syndromes: ["Respiración de Kussmaul", "Deshidratación Severa", "Alteración del Sensorio"],
    typicalVitals: { hr: [100, 120], bp: "105/65", rr: [26, 34], spo2: [96, 99], temp: [36.3, 37.2] },
    oxygenResponse: "Corrección electrolítica y glucémica secuencial con bomba de infusión",
    complicationWindow: "Monitoreo horario de potasio y brecha aniónica en las primeras 12h",
    demoPrevalencePct: 8,
    syntheticCohortSize: 52
  }
];

// Sembrado de datos sintéticos demostrativos iniciales
function seedSyntheticData() {
  // Migración automática de correos existentes a @sanify.org
  try {
    db.prepare("UPDATE users SET email = REPLACE(email, '@vitasentinel.org', '@sanify.org') WHERE email LIKE '%@vitasentinel.org'").run();
  } catch (e) {
    // Si ya están migrados o no existe la tabla todavía
  }

  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const passHash = bcrypt.hashSync("clinica123", salt);
    
    const insertUser = db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)");
    insertUser.run("Dra. Elena Morales", "elena.morales@sanify.org", passHash, "clinico");
    insertUser.run("Dr. Javier Roca", "javier.roca@sanify.org", passHash, "coordinador");
    insertUser.run("Dra. Beatriz Santos", "beatriz.santos@sanify.org", passHash, "investigador");
    insertUser.run("Lic. Marcos Vega (Admin)", "admin@sanify.org", passHash, "admin");

    // Registro inicial de auditoría
    db.prepare("INSERT INTO audit_logs (user_name, user_role, action, resource, details) VALUES (?, ?, ?, ?, ?)")
      .run("Sistema Sanify", "system", "INICIALIZACIÓN", "Base de datos sintética", "Carga inicial de usuarios demostrativos y taxonomía clínica.");
  }

  const patientCount = db.prepare("SELECT COUNT(*) as c FROM patients").get().c;
  if (patientCount === 0) {
    // Definición de las 28 camas sintéticas de la sala de internación
    const initialBeds = [
      // Sector A: UCI Cuidados Críticos (6 camas)
      { pseudo_id: "PAC-9101", bed_id: "UCI-01", sector: "UCI", room_number: "Box 101", age_range: "65-70", condition: "pneumonia_bac", severity: "Alta", priority: "alta", news2: 7, hr: 112, spo2: 88.5, bp_sys: 105, bp_dia: 62, rr: 28, temp: 39.1, o2: "Cánula Alto Flujo 35L" },
      { pseudo_id: "PAC-9102", bed_id: "UCI-02", sector: "UCI", room_number: "Box 102", age_range: "58-62", condition: "tep_agudo", severity: "Alta", priority: "alta", news2: 8, hr: 124, spo2: 87.0, bp_sys: 92, bp_dia: 58, rr: 31, temp: 37.4, o2: "Venturi 50%" },
      { pseudo_id: "PAC-9103", bed_id: "UCI-03", sector: "UCI", room_number: "Box 103", age_range: "72-76", condition: "iamcest", severity: "Alta", priority: "alta", news2: 6, hr: 108, spo2: 94.0, bp_sys: 145, bp_dia: 92, rr: 22, temp: 36.8, o2: "Cánula Nasal 2L" },
      { pseudo_id: "PAC-9104", bed_id: "UCI-04", sector: "UCI", room_number: "Box 104", age_range: "45-50", condition: "sepsis_urinaria", severity: "Alta", priority: "alta", news2: 7, hr: 118, spo2: 93.5, bp_sys: 88, bp_dia: 54, rr: 26, temp: 39.8, o2: "Mascarilla Reservorio" },
      { pseudo_id: "PAC-9105", bed_id: "UCI-05", sector: "UCI", room_number: "Box 105", age_range: "68-72", condition: "acv_isquemico", severity: "Media", priority: "media", news2: 4, hr: 84, spo2: 96.0, bp_sys: 168, bp_dia: 98, rr: 18, temp: 37.1, o2: "Aire ambiente" },
      { pseudo_id: "PAC-9106", bed_id: "UCI-06", sector: "UCI", room_number: "Box 106", age_range: "54-58", condition: "insuf_cardiaca_aguda", severity: "Media", priority: "media", news2: 5, hr: 96, spo2: 91.5, bp_sys: 158, bp_dia: 94, rr: 24, temp: 36.6, o2: "Venturi 35%" },

      // Sector B: Cuidados Intermedios (8 camas)
      { pseudo_id: "PAC-8201", bed_id: "INT-01", sector: "INTERMEDIOS", room_number: "Sala 201-A", age_range: "70-75", condition: "epoc_reagudizado", severity: "Media", priority: "media", news2: 5, hr: 98, spo2: 89.5, bp_sys: 132, bp_dia: 82, rr: 25, temp: 37.6, o2: "Venturi 28%" },
      { pseudo_id: "PAC-8202", bed_id: "INT-02", sector: "INTERMEDIOS", room_number: "Sala 201-B", age_range: "61-65", condition: "cetoacidosis_diabetica", severity: "Media", priority: "media", news2: 4, hr: 104, spo2: 97.0, bp_sys: 110, bp_dia: 68, rr: 24, temp: 36.9, o2: "Aire ambiente" },
      { pseudo_id: "PAC-8203", bed_id: "INT-03", sector: "INTERMEDIOS", room_number: "Sala 202-A", age_range: "50-55", condition: "pneumonia_bac", severity: "Media", priority: "media", news2: 4, hr: 92, spo2: 93.0, bp_sys: 120, bp_dia: 75, rr: 22, temp: 38.2, o2: "Cánula Nasal 3L" },
      { pseudo_id: "PAC-8204", bed_id: "INT-04", sector: "INTERMEDIOS", room_number: "Sala 202-B", age_range: "66-70", condition: "insuf_cardiaca_aguda", severity: "Media", priority: "media", news2: 3, hr: 88, spo2: 94.0, bp_sys: 142, bp_dia: 88, rr: 20, temp: 36.7, o2: "Cánula Nasal 2L" },
      { pseudo_id: "PAC-8205", bed_id: "INT-05", sector: "INTERMEDIOS", room_number: "Sala 203-A", age_range: "42-46", condition: "sepsis_urinaria", severity: "Estable", priority: "baja", news2: 2, hr: 82, spo2: 96.5, bp_sys: 115, bp_dia: 72, rr: 18, temp: 37.5, o2: "Aire ambiente" },
      { pseudo_id: "PAC-8206", bed_id: "INT-06", sector: "INTERMEDIOS", room_number: "Sala 203-B", age_range: "75-80", condition: "epoc_reagudizado", severity: "Estable", priority: "baja", news2: 2, hr: 78, spo2: 91.0, bp_sys: 128, bp_dia: 76, rr: 19, temp: 36.8, o2: "Venturi 24%" },
      { pseudo_id: "PAC-8207", bed_id: "INT-07", sector: "INTERMEDIOS", room_number: "Sala 204-A", age_range: "59-63", condition: "acv_isquemico", severity: "Estable", priority: "baja", news2: 1, hr: 74, spo2: 98.0, bp_sys: 138, bp_dia: 84, rr: 16, temp: 36.6, o2: "Aire ambiente" },
      { pseudo_id: "PAC-8208", bed_id: "INT-08", sector: "INTERMEDIOS", room_number: "Sala 204-B", age_range: "53-57", condition: "iamcest", severity: "Estable", priority: "baja", news2: 1, hr: 68, spo2: 97.5, bp_sys: 122, bp_dia: 78, rr: 15, temp: 36.5, o2: "Aire ambiente" },

      // Sector C: Aislamiento Respiratorio e Infeccioso (4 camas)
      { pseudo_id: "PAC-7301", bed_id: "AIS-01", sector: "AISLAMIENTO", room_number: "Aislamiento 301", age_range: "63-67", condition: "pneumonia_bac", severity: "Alta", priority: "alta", news2: 6, hr: 106, spo2: 89.0, bp_sys: 112, bp_dia: 68, rr: 27, temp: 39.4, o2: "Cánula Alto Flujo 30L" },
      { pseudo_id: "PAC-7302", bed_id: "AIS-02", sector: "AISLAMIENTO", room_number: "Aislamiento 302", age_range: "48-52", condition: "sepsis_urinaria", severity: "Media", priority: "media", news2: 4, hr: 98, spo2: 95.0, bp_sys: 104, bp_dia: 64, rr: 22, temp: 38.6, o2: "Cánula Nasal 2L" },
      { pseudo_id: "PAC-7303", bed_id: "AIS-03", sector: "AISLAMIENTO", room_number: "Aislamiento 303", age_range: "71-75", condition: "epoc_reagudizado", severity: "Media", priority: "media", news2: 3, hr: 86, spo2: 90.5, bp_sys: 130, bp_dia: 80, rr: 21, temp: 37.3, o2: "Venturi 28%" },
      { pseudo_id: "PAC-7304", bed_id: "AIS-04", sector: "AISLAMIENTO", room_number: "Aislamiento 304", age_range: "39-43", condition: "pneumonia_bac", severity: "Estable", priority: "baja", news2: 1, hr: 76, spo2: 97.0, bp_sys: 118, bp_dia: 74, rr: 16, temp: 37.0, o2: "Aire ambiente" },

      // Sector D: Hospitalización General y Cuidados Médicos (10 camas)
      { pseudo_id: "PAC-6401", bed_id: "GEN-01", sector: "GENERAL", room_number: "Hab. 401", age_range: "60-64", condition: "cetoacidosis_diabetica", severity: "Estable", priority: "baja", news2: 1, hr: 76, spo2: 98.0, bp_sys: 124, bp_dia: 78, rr: 16, temp: 36.7, o2: "Aire ambiente" },
      { pseudo_id: "PAC-6402", bed_id: "GEN-02", sector: "GENERAL", room_number: "Hab. 402", age_range: "72-76", condition: "insuf_cardiaca_aguda", severity: "Estable", priority: "baja", news2: 2, hr: 80, spo2: 95.0, bp_sys: 134, bp_dia: 82, rr: 18, temp: 36.5, o2: "Cánula Nasal 1L" },
      { pseudo_id: "PAC-6403", bed_id: "GEN-03", sector: "GENERAL", room_number: "Hab. 403", age_range: "51-55", condition: "epoc_reagudizado", severity: "Media", priority: "media", news2: 4, hr: 94, spo2: 90.0, bp_sys: 136, bp_dia: 84, rr: 23, temp: 37.4, o2: "Venturi 28%" },
      { pseudo_id: "PAC-6404", bed_id: "GEN-04", sector: "GENERAL", room_number: "Hab. 404", age_range: "67-71", condition: "pneumonia_bac", severity: "Estable", priority: "baja", news2: 2, hr: 82, spo2: 95.5, bp_sys: 120, bp_dia: 76, rr: 18, temp: 37.2, o2: "Aire ambiente" },
      { pseudo_id: "PAC-6405", bed_id: "GEN-05", sector: "GENERAL", room_number: "Hab. 405", age_range: "44-48", condition: "sepsis_urinaria", severity: "Estable", priority: "baja", news2: 1, hr: 72, spo2: 98.5, bp_sys: 116, bp_dia: 70, rr: 15, temp: 36.9, o2: "Aire ambiente" },
      { pseudo_id: "PAC-6406", bed_id: "GEN-06", sector: "GENERAL", room_number: "Hab. 406", age_range: "80-84", condition: "acv_isquemico", severity: "Estable", priority: "baja", news2: 2, hr: 78, spo2: 96.0, bp_sys: 142, bp_dia: 86, rr: 17, temp: 36.8, o2: "Aire ambiente" },
      { pseudo_id: "PAC-6407", bed_id: "GEN-07", sector: "GENERAL", room_number: "Hab. 407", age_range: "55-59", condition: "iamcest", severity: "Estable", priority: "baja", news2: 1, hr: 70, spo2: 98.0, bp_sys: 118, bp_dia: 74, rr: 16, temp: 36.6, o2: "Aire ambiente" },
      { pseudo_id: "PAC-6408", bed_id: "GEN-08", sector: "GENERAL", room_number: "Hab. 408", age_range: "62-66", condition: "insuf_cardiaca_aguda", severity: "Estable", priority: "baja", news2: 2, hr: 76, spo2: 96.0, bp_sys: 126, bp_dia: 80, rr: 17, temp: 36.4, o2: "Aire ambiente" },
      { pseudo_id: "PAC-6409", bed_id: "GEN-09", sector: "GENERAL", room_number: "Hab. 409", age_range: "49-53", condition: "epoc_reagudizado", severity: "Estable", priority: "baja", news2: 1, hr: 74, spo2: 92.5, bp_sys: 122, bp_dia: 78, rr: 16, temp: 36.7, o2: "Aire ambiente" },
      { pseudo_id: "PAC-6410", bed_id: "GEN-10", sector: "GENERAL", room_number: "Hab. 410", age_range: "73-77", condition: "cetoacidosis_diabetica", severity: "Estable", priority: "baja", news2: 1, hr: 75, spo2: 97.0, bp_sys: 114, bp_dia: 72, rr: 16, temp: 36.8, o2: "Aire ambiente" }
    ];

    const insertPatient = db.prepare(`
      INSERT INTO patients (pseudo_id, bed_id, sector, room_number, age_range, condition_name, cie11, cie10, snomed_ct, severity, priority, news2_score, hr, spo2, bp_sys, bp_dia, rr, temp, oxygen_supply)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertNote = db.prepare(`
      INSERT INTO clinical_notes (patient_id, author_name, author_role, note_type, content)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const b of initialBeds) {
      const dis = CLINICAL_DISEASES_DB.find(d => d.id === b.condition) || CLINICAL_DISEASES_DB[0];
      const res = insertPatient.run(
        b.pseudo_id, b.bed_id, b.sector, b.room_number, b.age_range,
        dis.name, dis.cie11, dis.cie10, dis.snomedCt,
        b.severity, b.priority, b.news2,
        b.hr, b.spo2, b.bp_sys, b.bp_dia, b.rr, b.temp, b.o2
      );
      const patId = res.lastInsertRowid;

      insertNote.run(
        patId,
        "Dra. Elena Morales",
        "Especialista en Medicina Interna",
        "Evolución",
        `Ingreso en sala de internación sector ${b.sector}. Signos vitales basales registrados. Monitoreo continuo activado según protocolo institucional.`
      );
    }

    // Inicializar alertas sintéticas priorizadas para los pacientes críticos y de revisión
    const insertAlert = db.prepare(`
      INSERT INTO alerts (patient_id, pseudo_id, bed_id, priority, motive, assignee, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const criticalPats = db.prepare("SELECT id, pseudo_id, bed_id, priority, hr, spo2, rr FROM patients WHERE priority IN ('alta', 'media')").all();
    for (const cp of criticalPats) {
      if (cp.priority === "alta") {
        insertAlert.run(
          cp.id, cp.pseudo_id, cp.bed_id, "alta",
          `Desaturación significativa (SpO2 ${cp.spo2}%) y taquipnea (FR ${cp.rr} rpm). Indicador de alerta clínica prioritario.`,
          "Guardia Médica UCI",
          "pendiente"
        );
      } else if (cp.priority === "media") {
        insertAlert.run(
          cp.id, cp.pseudo_id, cp.bed_id, "media",
          `Variación de parámetros basales (FC ${cp.hr} lpm). Requiere verificación asistencial y balance horario.`,
          "Enfermería de Sector",
          "pendiente"
        );
      }
    }
  }
}

seedSyntheticData();
ensureClinicalTables(db);
seedClinicalStudiesAndLabs(db);
seedEpidemiologicalCases(db);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Middleware de autenticación y auditoría
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No autenticado. Inicie sesión en Sanify." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Sesión clínica expirada o inválida." });
  }
}

// Función auxiliar de auditoría
function recordAudit(userName, userRole, action, resource, details) {
  try {
    db.prepare("INSERT INTO audit_logs (user_name, user_role, action, resource, details) VALUES (?, ?, ?, ?, ?)")
      .run(userName || "Anónimo", userRole || "general", action, resource, details || "");
  } catch (err) {
    console.error("Error registrando auditoría:", err.message);
  }
}

// Rutas de Autenticación y Perfil
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email=?").get((email || "").trim().toLowerCase());
  if (!user || !(await bcrypt.compare(password || "", user.password_hash))) {
    return res.status(401).json({ error: "Credenciales incorrectas. Verifique correo institucional y contraseña." });
  }
  const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });

  recordAudit(user.name, user.role, "ACCESO_SISTEMA", "Sesión de Usuario", "Inicio de sesión exitoso en estación clínica.");

  res.json({ token, user: payload, theme: user.theme, font_size: user.font_size, reduced_motion: user.reduced_motion });
});

app.post("/api/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ error: "Complete todos los campos. La contraseña requiere al menos 6 caracteres." });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const validRole = ["clinico", "investigador", "coordinador", "admin"].includes(role) ? role : "clinico";
    const result = db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)")
      .run(name.trim(), email.trim().toLowerCase(), hash, validRole);
    
    const userPayload = { id: result.lastInsertRowid, name: name.trim(), email: email.trim().toLowerCase(), role: validRole };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "12h" });

    recordAudit(userPayload.name, userPayload.role, "ALTA_USUARIO", "Gestión de Personal", "Registro de nuevo profesional en plataforma.");

    res.json({ token, user: userPayload, theme: "light", font_size: "normal", reduced_motion: 0 });
  } catch (e) {
    if (String(e).includes("UNIQUE")) return res.status(409).json({ error: "Ese correo ya está registrado en la institución." });
    res.status(500).json({ error: "No se pudo crear la cuenta de usuario." });
  }
});

app.get("/api/me", auth, (req, res) => {
  const user = db.prepare("SELECT id, name, email, role, theme, font_size, reduced_motion, created_at FROM users WHERE id=?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
  res.json(user);
});

app.put("/api/me/preferences", auth, (req, res) => {
  const { theme, font_size, reduced_motion, role } = req.body;
  db.prepare(`
    UPDATE users SET 
      theme = COALESCE(?, theme),
      font_size = COALESCE(?, font_size),
      reduced_motion = COALESCE(?, reduced_motion),
      role = COALESCE(?, role)
    WHERE id=?
  `).run(theme || null, font_size || null, reduced_motion !== undefined ? Number(reduced_motion) : null, role || null, req.user.id);

  recordAudit(req.user.name, role || req.user.role, "CONFIG_PREFERENCIAS", "Interfaz de Usuario", `Ajuste de preferencias: tema=${theme}, rol=${role}`);
  res.json({ ok: true });
});

// Rutas de Unidad de Monitoreo (Sala de Internación)
app.get("/api/ward/beds", auth, (req, res) => {
  const { sector, priority, review_status, q } = req.query;
  let sql = "SELECT * FROM patients WHERE 1=1";
  const params = [];

  if (sector && sector !== "ALL") {
    sql += " AND sector = ?";
    params.push(sector);
  }
  if (priority && priority !== "ALL") {
    sql += " AND priority = ?";
    params.push(priority);
  }
  if (review_status && review_status !== "ALL") {
    sql += " AND review_status = ?";
    params.push(review_status);
  }
  if (q) {
    sql += " AND (pseudo_id LIKE ? OR bed_id LIKE ? OR condition_name LIKE ? OR room_number LIKE ?)";
    const term = `%${q}%`;
    params.push(term, term, term, term);
  }

  sql += " ORDER BY CASE priority WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END, bed_id ASC";
  const rows = db.prepare(sql).all(...params);

  // Mapear con datos de tendencia sintética para los sparklines
  const enriched = rows.map(pat => {
    // Generar serie sintética de últimas 12 horas para el mapa
    const sparklineSpo2 = [
      Math.max(78, pat.spo2 + 1.2), Math.max(78, pat.spo2 + 0.8),
      Math.max(78, pat.spo2 - 0.4), Math.max(78, pat.spo2 - 1.1),
      Math.max(78, pat.spo2 + 0.2), pat.spo2
    ].map(v => Number(v.toFixed(1)));

    return {
      ...pat,
      sparklineSpo2,
      activeAlertsCount: db.prepare("SELECT COUNT(*) as c FROM alerts WHERE patient_id=? AND status != 'resuelta'").get(pat.id).c
    };
  });

  res.json(enriched);
});

app.get("/api/ward/beds/:id", auth, (req, res) => {
  const patient = db.prepare("SELECT * FROM patients WHERE id=? OR bed_id=? OR pseudo_id=?").get(req.params.id, req.params.id, req.params.id);
  if (!patient) return res.status(404).json({ error: "Cama o paciente no localizado en sala." });

  const notes = db.prepare("SELECT * FROM clinical_notes WHERE patient_id=? ORDER BY created_at DESC").all(patient.id);
  const alerts = db.prepare("SELECT * FROM alerts WHERE patient_id=? ORDER BY detected_at DESC").all(patient.id);

  // Registro de auditoría por visualización de ficha clínica
  recordAudit(req.user.name, req.user.role, "CONSULTA_FICHA", `Paciente ${patient.pseudo_id}`, `Apertura de telemetría y antecedentes en cama ${patient.bed_id}`);

  res.json({ patient, notes, alerts, isDemoSynthetic: true });
});

app.post("/api/ward/beds/:id/review", auth, (req, res) => {
  const patient = db.prepare("SELECT * FROM patients WHERE id=?").get(req.params.id);
  if (!patient) return res.status(404).json({ error: "Paciente no encontrado." });

  const { noteText, markStatus } = req.body;
  const newStatus = markStatus || "revisado";

  db.prepare(`
    UPDATE patients SET 
      review_status = ?,
      reviewed_by = ?,
      reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, req.user.name, patient.id);

  if (noteText && noteText.trim()) {
    db.prepare(`
      INSERT INTO clinical_notes (patient_id, author_name, author_role, note_type, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(patient.id, req.user.name, req.user.role, "Revisión Asistencial", noteText.trim());
  }

  recordAudit(req.user.name, req.user.role, "REVISION_CLINICA", `Paciente ${patient.pseudo_id}`, `Cama ${patient.bed_id} marcada como ${newStatus}. Nota: ${noteText || 'Sin observaciones adicionales'}`);

  res.json({ ok: true, message: `Cama ${patient.bed_id} actualizada a estado '${newStatus}'.` });
});

app.post("/api/ward/beds/:id/notes", auth, (req, res) => {
  const patient = db.prepare("SELECT * FROM patients WHERE id=?").get(req.params.id);
  if (!patient) return res.status(404).json({ error: "Paciente no encontrado." });

  const { content, note_type } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: "El contenido de la nota no puede estar vacío." });

  db.prepare(`
    INSERT INTO clinical_notes (patient_id, author_name, author_role, note_type, content)
    VALUES (?, ?, ?, ?, ?)
  `).run(patient.id, req.user.name, req.user.role, note_type || "Evolución", content.trim());

  recordAudit(req.user.name, req.user.role, "REGISTRO_NOTA", `Paciente ${patient.pseudo_id}`, `Nueva nota tipo '${note_type || "Evolución"}' guardada en historial.`);

  res.json({ ok: true });
});

// Rutas de Alertas y Seguimiento
app.get("/api/alerts", auth, (req, res) => {
  const { priority, status } = req.query;
  let sql = `
    SELECT a.*, p.sector, p.condition_name, p.room_number, p.news2_score, p.spo2, p.hr, p.rr
    FROM alerts a
    JOIN patients p ON a.patient_id = p.id
    WHERE 1=1
  `;
  const params = [];
  if (priority && priority !== "ALL") {
    sql += " AND a.priority = ?";
    params.push(priority);
  }
  if (status && status !== "ALL") {
    sql += " AND a.status = ?";
    params.push(status);
  }

  sql += " ORDER BY CASE a.priority WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END, a.detected_at DESC";
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.post("/api/alerts/:id/action", auth, (req, res) => {
  const alert = db.prepare("SELECT * FROM alerts WHERE id=?").get(req.params.id);
  if (!alert) return res.status(404).json({ error: "Alerta clínica no encontrada." });

  const { action, observation } = req.body; // 'revisar', 'escalar', 'resolver'
  let newStatus = alert.status;

  if (action === "revisar") newStatus = "en_revision";
  else if (action === "escalar") newStatus = "escalada";
  else if (action === "resolver") newStatus = "resuelta";

  db.prepare(`
    UPDATE alerts SET 
      status = ?,
      notes = CASE WHEN notes = '' THEN ? ELSE notes || ' | ' || ? END,
      resolved_by = ?,
      resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, observation || `Acción '${action}' ejecutada`, observation || `Acción '${action}'`, req.user.name, alert.id);

  recordAudit(
    req.user.name, req.user.role, "ACCION_ALERTA", `Alerta #${alert.id} (${alert.pseudo_id})`,
    `Estado cambiado a ${newStatus}. Acción: ${action}. Detalle: ${observation || 'Sin nota'}`
  );

  res.json({ ok: true, status: newStatus });
});

// Rutas de Inteligencia Clínica y Cohortes
app.get("/api/intelligence/diseases", auth, (req, res) => {
  const { q, category } = req.query;
  let list = CLINICAL_DISEASES_DB;

  if (category && category !== "ALL") {
    list = list.filter(d => d.category.toLowerCase().includes(category.toLowerCase()));
  }
  if (q) {
    const term = q.toLowerCase();
    list = list.filter(d => 
      d.name.toLowerCase().includes(term) ||
      (d.cie11 && d.cie11.toLowerCase().includes(term)) ||
      (d.cie10 && d.cie10.toLowerCase().includes(term)) ||
      (d.snomedCt && d.snomedCt.toLowerCase().includes(term))
    );
  }

  res.json({
    provenance: "Sanify Clinical Taxonomy Engine v3.0 (Sintético con estándares CIE-11, CIE-10 y SNOMED-CT)",
    disclaimer: "Los datos de inteligencia clínica son puramente exploratorios y de demostración analítica. Correlaciones no constituyen diagnóstico ni causalidad médica.",
    total: list.length,
    diseases: list
  });
});

app.get("/api/intelligence/compare", auth, (req, res) => {
  const { ids } = req.query; // e.g. "pneumonia_bac,tep_agudo,epoc_reagudizado"
  if (!ids) return res.status(400).json({ error: "Especifique identificadores de condición a comparar." });

  const idArr = ids.split(",").map(x => x.trim());
  const selected = CLINICAL_DISEASES_DB.filter(d => idArr.includes(d.id));

  recordAudit(req.user.name, req.user.role, "COMPARACION_COHORTES", "Inteligencia Clínica", `Comparación de condiciones: ${idArr.join(", ")}`);

  res.json({
    compared: selected,
    indicators: [
      { key: "SpO2 Basal Esperado", note: "Rango típico en fase no compensada" },
      { key: "Ventana Crítica de Complicación", note: "Período de máxima vigilancia recomendada" },
      { key: "Respuesta a Oxigenoterapia", note: "Perfil de titulación de soporte respiratorio" },
      { key: "Prevalencia en Cohorte Demo", note: "Frecuencia porcentual en muestra sintética" }
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      validationNotice: "Datos generados sintéticamente para soporte exploratorio asistencial."
    }
  });
});

app.get("/api/intelligence/cohorts", auth, (req, res) => {
  // Estadísticas sintéticas agregadas para visualizaciones
  const ageDistribution = [
    { group: "<18 años (Pediátrico demo)", percentage: 6, count: 28 },
    { group: "18-49 años (Adulto joven)", percentage: 22, count: 104 },
    { group: "50-69 años (Adulto medio)", percentage: 41, count: 195 },
    { group: "70+ años (Adulto mayor)", percentage: 31, count: 148 }
  ];

  const wardDistribution = [
    { unit: "UCI Adultos", count: 6, capacity: 6, occupancyPct: 100 },
    { unit: "Cuidados Intermedios", count: 8, capacity: 8, occupancyPct: 100 },
    { unit: "Aislamiento Infeccioso", count: 4, capacity: 4, occupancyPct: 100 },
    { unit: "Hospitalización General", count: 10, capacity: 10, occupancyPct: 100 }
  ];

  const severityBreakdown = {
    alta: db.prepare("SELECT COUNT(*) as c FROM patients WHERE priority='alta'").get().c,
    media: db.prepare("SELECT COUNT(*) as c FROM patients WHERE priority='media'").get().c,
    baja: db.prepare("SELECT COUNT(*) as c FROM patients WHERE priority='baja'").get().c
  };

  res.json({
    totalPatientsMonitored: 28,
    occupancyPct: 100,
    ageDistribution,
    wardDistribution,
    severityBreakdown,
    datasetNotice: "Muestra agregada sintética de 475 episodios clínicos simulados para análisis de patrones."
  });
});

// Rutas de Centros y Red Hospitalaria (Federación)
app.get("/api/network/centers", auth, (req, res) => {
  const fictitiousNetwork = [
    {
      id: "hosp_central",
      name: "Hospital Central Sanify (Nodo Local)",
      city: "Área Metropolitana",
      role: "Centro de Alta Complejidad",
      status: "En línea (Servicio Activo)",
      bedsTotal: 340,
      bedsOccupied: 302,
      occupancyRate: 88.8,
      activeAlertsHigh: 4,
      fhirStatus: "HL7 FHIR R4 Conectado",
      latencyMs: 12
    },
    {
      id: "hosp_norte",
      name: "Hospital General Regional Norte",
      city: "Distrito Norte",
      role: "Hospital General de Zona",
      status: "En línea (Federado)",
      bedsTotal: 210,
      bedsOccupied: 184,
      occupancyRate: 87.6,
      activeAlertsHigh: 2,
      fhirStatus: "HL7 FHIR R4 Sincronizado",
      latencyMs: 38
    },
    {
      id: "clinica_sur",
      name: "Clínica Universitaria Sur",
      city: "Campus Universitario",
      role: "Investigación y Soporte Especializado",
      status: "En línea (Federado)",
      bedsTotal: 160,
      bedsOccupied: 128,
      occupancyRate: 80.0,
      activeAlertsHigh: 1,
      fhirStatus: "HL7 FHIR R4 Sincronizado",
      latencyMs: 24
    },
    {
      id: "centro_pediatrico",
      name: "Centro Pediátrico de Alta Vigilancia",
      city: "Área Este",
      role: "Vigilancia Pediátrica Especializada",
      status: "Monitoreo Sintético Activo",
      bedsTotal: 90,
      bedsOccupied: 65,
      occupancyRate: 72.2,
      activeAlertsHigh: 0,
      fhirStatus: "HL7 FHIR R4 Conexión de Prueba",
      latencyMs: 45
    }
  ];

  res.json({
    networkName: "Red Hospitalaria Federada Sanify (Ambiente Sintético Demostrativo)",
    totalNetworkBeds: 800,
    totalNetworkOccupied: 679,
    aggregatedOccupancy: 84.8,
    interoperabilityStandard: "HL7 FHIR Release 4 / Perfil Clínico Sintético",
    centers: fictitiousNetwork,
    disclaimer: "La interconexión con centros externos opera exclusivamente con identificadores y telemetría sintética demostrativa. La conexión real requiere acuerdos de intercambio seguro, auditoría HIPAA/GDPR y pasarelas HL7 FHIR validadas."
  });
});

// Rutas de Administración y Auditoría
app.get("/api/admin/audit", auth, (req, res) => {
  const { limit, action } = req.query;
  let sql = "SELECT * FROM audit_logs WHERE 1=1";
  const params = [];

  if (action && action !== "ALL") {
    sql += " AND action = ?";
    params.push(action);
  }

  sql += " ORDER BY id DESC LIMIT ?";
  params.push(Number(limit) || 50);

  const logs = db.prepare(sql).all(...params);
  res.json(logs);
});

app.get("/api/admin/users", auth, (req, res) => {
  const users = db.prepare("SELECT id, name, email, role, theme, created_at FROM users ORDER BY id ASC").all();
  res.json(users);
});

// ============================================================================
// Rutas de Historial Clínico Completo (Estudios, TAC, Rx, Laboratorio Anterior)
// ============================================================================
app.get("/api/patients/:id/records", auth, (req, res) => {
  const records = getPatientFullRecords(db, req.params.id);
  if (!records) return res.status(404).json({ error: "Historial de paciente no localizado." });

  recordAudit(
    req.user.name, req.user.role, "CONSULTA_HISTORIAL_COMPLETO",
    `Paciente ${records.patient.pseudo_id}`,
    `Acceso a estudios complementarios y exámenes de laboratorio anteriores.`
  );

  res.json(records);
});

// ============================================================================
// Rutas de Investigación Epidemiológica y Análisis de Patrones Clínicos
// ============================================================================
app.get("/api/research/diseases", auth, (req, res) => {
  const diseases = db.prepare(`
    SELECT 
      disease_id, disease_name, cie11,
      COUNT(*) as total_cases,
      SUM(CASE WHEN vital_status LIKE 'vivo%' THEN 1 ELSE 0 END) as alive_cases,
      SUM(CASE WHEN vital_status = 'fallecido' THEN 1 ELSE 0 END) as deceased_cases,
      ROUND(AVG(stay_days), 1) as avg_stay_days
    FROM epidemiological_cases
    GROUP BY disease_id
    ORDER BY total_cases DESC
  `).all();

  const formatted = diseases.map(d => ({
    ...d,
    mortality_rate: d.total_cases > 0 ? Number(((d.deceased_cases / d.total_cases) * 100).toFixed(1)) : 0
  }));

  res.json({
    provenance: "Sanify Clinical Research & Cohort Intelligence Database",
    total_diseases: formatted.length,
    diseases: formatted
  });
});

app.get("/api/research/cases", auth, (req, res) => {
  const { diseaseId, status, q } = req.query;
  let sql = "SELECT * FROM epidemiological_cases WHERE 1=1";
  const params = [];

  if (diseaseId && diseaseId !== "ALL") {
    sql += " AND disease_id = ?";
    params.push(diseaseId);
  }

  if (status && status !== "ALL") {
    if (status === "vivo") {
      sql += " AND vital_status LIKE 'vivo%'";
    } else if (status === "fallecido") {
      sql += " AND vital_status = 'fallecido'";
    }
  }

  if (q) {
    sql += " AND (case_code LIKE ? OR patient_name LIKE ? OR comorbidities_json LIKE ?)";
    const term = `%${q}%`;
    params.push(term, term, term);
  }

  sql += " ORDER BY CASE vital_status WHEN 'fallecido' THEN 1 ELSE 2 END, id ASC";
  const cases = db.prepare(sql).all(...params);

  const enriched = cases.map(c => ({
    ...c,
    comorbidities: JSON.parse(c.comorbidities_json || "[]"),
    key_biomarkers: JSON.parse(c.key_biomarkers_json || "{}"),
    interventions: JSON.parse(c.interventions_json || "[]")
  }));

  recordAudit(
    req.user.name, req.user.role, "INVESTIGACION_COHORTES",
    `Enfermedad ${diseaseId || 'Todas'}`,
    `Consulta de ${enriched.length} casos clínicos (filtro estado: ${status || 'todos'}).`
  );

  res.json(enriched);
});

app.post("/api/research/analyze", auth, (req, res) => {
  const { diseaseId } = req.body;
  if (!diseaseId) return res.status(400).json({ error: "Debe especificar la enfermedad a investigar." });

  const analysis = analyzeDiseaseCohort(db, diseaseId);
  if (analysis.error) return res.status(404).json(analysis);

  recordAudit(
    req.user.name, req.user.role, "ANALISIS_PATRONES_CLINICOS",
    `Enfermedad: ${analysis.diseaseName} (${analysis.cie11})`,
    `Ejecución de algoritmo de coincidencia de biomarcadores y riesgo de mortalidad en cohorte.`
  );

  res.json(analysis);
});

// Servir la aplicación frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  Sanify — Plataforma de Vigilancia Clínica`);
  console.log(`  Servidor activo en: http://localhost:${PORT}`);
  console.log(`  Base de datos: ${path.join(__dirname, "vitasentinel.db")}`);
  console.log(`  Modo: Demostración Asistencial con Datos Sintéticos`);
  console.log(`======================================================\n`);
});
