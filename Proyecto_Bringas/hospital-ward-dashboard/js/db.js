// js/db.js - Sistema de Información Hospitalaria y Registro Clínico Electrónico (EHR / HIS)
// Soporte Integral para Historial Completo de Pacientes, CDSS y Módulo Epidemiológico de Patrones

class HospitalDatabase {
    constructor() {
        this.dailyReportsKey = 'hospital_history_db';
        this.patientsRegistryKey = 'hospital_patients_db';
        this.seedInitialHistoricalDataIfEmpty();
    }

    // --- REPORTE DIARIO Y SCOREBOARD ---
    getHistory() {
        try {
            const data = localStorage.getItem(this.dailyReportsKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error al leer historial de reportes:', e);
            return [];
        }
    }

    saveDayReport(report) {
        try {
            const history = this.getHistory();
            const existingIndex = history.findIndex(r => r.dayNumber === report.dayNumber);
            if (existingIndex !== -1) {
                history[existingIndex] = report;
            } else {
                history.push(report);
            }
            localStorage.setItem(this.dailyReportsKey, JSON.stringify(history));
            return true;
        } catch (e) {
            console.error('Error al guardar reporte diario:', e);
            return false;
        }
    }

    calculateRank(saved, lost, reputation, netProfit) {
        if (lost === 0 && saved >= 4 && reputation >= 85) return { grade: 'S', color: 'text-amber-500 font-extrabold', title: 'Excelencia Médica e Institucional' };
        if (lost === 0 && saved >= 2) return { grade: 'A', color: 'text-emerald-600 font-bold', title: 'Gestión Asistencial Sobresaliente' };
        if (saved > lost && reputation >= 65) return { grade: 'B', color: 'text-sky-600 font-bold', title: 'Desempeño Clínico Conforme' };
        if (saved >= lost) return { grade: 'C', color: 'text-yellow-600 font-semibold', title: 'Regular - Requiere Auditoría Clínica' };
        return { grade: 'F', color: 'text-rose-600 font-black', title: 'Crisis Asistencial e Institucional' };
    }

    // --- REGISTRO CLÍNICO ELECTRÓNICO (EHR) DE PACIENTES ---
    getPatientsRegistry() {
        try {
            const data = localStorage.getItem(this.patientsRegistryKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error al leer registro de pacientes:', e);
            return [];
        }
    }

    registerPatient(patientData) {
        try {
            const registry = this.getPatientsRegistry();
            const existingIndex = registry.findIndex(p => p.recordId === patientData.recordId);
            
            // Garantizar persistencia íntegra de síntomas, constantes vitales y tratamientos
            const sanitized = {
                recordId: patientData.recordId,
                folio: patientData.folio || `FOL-${Math.floor(1000 + Math.random() * 9000)}`,
                bedNumber: patientData.bedNumber || "Cama --",
                serviceUnit: patientData.serviceUnit || "Medicina Interna",
                triageLevel: patientData.triageLevel || "Nivel III - Urgencia",
                triageCode: patientData.triageCode || "III",
                name: patientData.name,
                avatar: patientData.avatar || "👤",
                rutDni: patientData.rutDni || patientData.dni || "12.345.678-9",
                age: patientData.age,
                gender: patientData.gender,
                bloodType: patientData.bloodType || "O+",
                insurance: patientData.insurance || "FONASA - Tramo A",
                allergy: patientData.allergy || "Sin antecedentes alérgicos",
                admissionDate: patientData.admissionDate || new Date().toISOString().split('T')[0],
                admissionTime: patientData.admissionTime || "07:00",
                dischargeDate: patientData.dischargeDate || null,
                dischargeTime: patientData.dischargeTime || null,
                primaryDiagnosis: patientData.disease || patientData.primaryDiagnosis,
                disease: patientData.disease || patientData.primaryDiagnosis,
                cie10Code: patientData.cie10Code || "Z00.0",
                cie11Code: patientData.cie11Code || "",
                snomedCode: patientData.snomedCode || "",
                diseaseDescription: patientData.diseaseDescription || "",
                comorbidities: patientData.comorbidities || "Ninguna documentada",
                prescriptions: patientData.prescriptions || patientData.possibleCure || "",
                possibleCure: patientData.possibleCure || "",
                status: patientData.status || "Hospitalizado",
                epicrisis: patientData.epicrisis || patientData.notes || "Paciente ingresado en el servicio bajo monitorización activa.",
                financialBalance: patientData.financialImpact || patientData.financialBalance || "$0.00",
                lastHealth: patientData.health !== undefined ? Number(patientData.health.toFixed(2)) : 50.00,
                // SÍNTOMAS COMPLETOS: Siempre preservados en el historial
                symptoms: Array.isArray(patientData.symptoms) ? [...patientData.symptoms] : (patientData.symptoms ? [patientData.symptoms] : []),
                // CONSTANTES VITALES AL INGRESO
                vitals: patientData.vitals ? { ...patientData.vitals } : { bpm: 80, bpSys: 120, bpDia: 80, spo2: 96.0, temp: 37.0, respRate: 18 },
                // CONSTANTES VITALES AL EGRESO / DEFUNCIÓN
                finalVitals: patientData.finalVitals || null,
                // HISTORIAL TERAPÉUTICO Y ALERTAS CDSS
                treatmentHistory: Array.isArray(patientData.treatmentHistory) ? [...patientData.treatmentHistory] : [],
                demographics: patientData.demographics || {},
                antecedents: patientData.antecedents || {},
                painSemiology: patientData.painSemiology || {},
                physicalExam: patientData.physicalExam || {},
                labResults: patientData.labResults || {}
            };

            if (existingIndex !== -1) {
                // Preservar síntomas y vitals existentes si la actualización no los incluye
                const existing = registry[existingIndex];
                if ((!sanitized.symptoms || sanitized.symptoms.length === 0) && existing.symptoms) {
                    sanitized.symptoms = existing.symptoms;
                }
                if (!sanitized.vitals && existing.vitals) {
                    sanitized.vitals = existing.vitals;
                }
                if (!sanitized.treatmentHistory && existing.treatmentHistory) {
                    sanitized.treatmentHistory = existing.treatmentHistory;
                }
                registry[existingIndex] = { ...existing, ...sanitized };
            } else {
                registry.push(sanitized);
            }
            localStorage.setItem(this.patientsRegistryKey, JSON.stringify(registry));
            return true;
        } catch (e) {
            console.error('Error al registrar paciente en base de datos:', e);
            return false;
        }
    }

    updatePatientStatus(recordId, status, exitTime, financialImpact, epicrisisNotes, finalVitals = null, treatmentLog = null) {
        try {
            const registry = this.getPatientsRegistry();
            const patient = registry.find(p => p.recordId === recordId);
            if (patient) {
                patient.status = status;
                if (exitTime) {
                    patient.dischargeTime = exitTime;
                    patient.dischargeDate = new Date().toISOString().split('T')[0];
                }
                if (financialImpact) patient.financialBalance = financialImpact;
                if (epicrisisNotes) patient.epicrisis = epicrisisNotes;
                if (finalVitals) patient.finalVitals = { ...finalVitals };
                if (treatmentLog) {
                    if (!patient.treatmentHistory) patient.treatmentHistory = [];
                    patient.treatmentHistory.push(treatmentLog);
                }
                localStorage.setItem(this.patientsRegistryKey, JSON.stringify(registry));
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error al actualizar estado del paciente:', e);
            return false;
        }
    }

    addTreatmentRecord(recordId, treatmentData) {
        try {
            const registry = this.getPatientsRegistry();
            const patient = registry.find(p => p.recordId === recordId);
            if (patient) {
                if (!patient.treatmentHistory) patient.treatmentHistory = [];
                patient.treatmentHistory.push({
                    timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                    ...treatmentData
                });
                localStorage.setItem(this.patientsRegistryKey, JSON.stringify(registry));
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error al registrar tratamiento en BD:', e);
            return false;
        }
    }

    // --- MÓDULO EPIDEMIOLÓGICO Y ANÁLISIS DE PATRONES ---

    // Obtener todos los pacientes que padecieron una patología específica
    getPatientsByDisease(diseaseName) {
        const registry = this.getPatientsRegistry();
        if (!diseaseName || diseaseName === 'all') return registry;

        const term = diseaseName.toLowerCase().trim();
        return registry.filter(p => {
            const pDisease = (p.primaryDiagnosis || p.disease || '').toLowerCase();
            const pCie = (p.cie10Code || '').toLowerCase();
            const pCie11 = (p.cie11Code || '').toLowerCase();
            return pDisease.includes(term) || pCie.includes(term) || pCie11.includes(term);
        });
    }

    // Detección de Patrones Clínicos de la Cohorte
    calculateDiseasePatterns(diseaseName) {
        const cohort = this.getPatientsByDisease(diseaseName);
        if (cohort.length === 0) {
            return null;
        }

        const totalCases = cohort.length;
        const curedCount = cohort.filter(p => p.status.includes('Alta') || p.status.includes('Salvado') || p.status.includes('Curado')).length;
        const deceasedCount = cohort.filter(p => p.status.includes('Fallecido') || p.status.includes('Óbito')).length;
        const hospitalizedCount = cohort.filter(p => p.status === 'Hospitalizado').length;

        const closedCases = curedCount + deceasedCount;
        const mortalityRate = closedCases > 0 ? Number(((deceasedCount / closedCases) * 100).toFixed(1)) : 0.0;
        const cureRate = closedCases > 0 ? Number(((curedCount / closedCases) * 100).toFixed(1)) : 100.0;

        // Distribución etaria
        const ages = cohort.map(p => Number(p.age) || 0).filter(a => a > 0);
        const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
        const minAge = ages.length > 0 ? Math.min(...ages) : 0;
        const maxAge = ages.length > 0 ? Math.max(...ages) : 0;

        const pediatricCount = ages.filter(a => a < 18).length;
        const adultCount = ages.filter(a => a >= 18 && a < 65).length;
        const geriatricCount = ages.filter(a => a >= 65).length;

        // Distribución por sexo
        const maleCount = cohort.filter(p => p.gender === 'M').length;
        const femaleCount = cohort.filter(p => p.gender === 'F').length;

        // Frecuencia de Síntomas
        const symptomCounts = {};
        cohort.forEach(p => {
            const syms = Array.isArray(p.symptoms) ? p.symptoms : (p.symptoms ? [p.symptoms] : []);
            syms.forEach(s => {
                const clean = s.trim();
                if (clean) {
                    symptomCounts[clean] = (symptomCounts[clean] || 0) + 1;
                }
            });
        });

        const topSymptoms = Object.entries(symptomCounts)
            .map(([symptom, count]) => ({
                symptom,
                count,
                percentage: Number(((count / totalCases) * 100).toFixed(1))
            }))
            .sort((a, b) => b.count - a.count);

        // Prevalencia de Alergias
        let allergicCount = 0;
        const allergyTypes = {};
        cohort.forEach(p => {
            if (p.allergy && !p.allergy.toLowerCase().includes('sin') && !p.allergy.toLowerCase().includes('ninguna')) {
                allergicCount++;
                const key = p.allergy.split('(')[0].trim();
                allergyTypes[key] = (allergyTypes[key] || 0) + 1;
            }
        });

        // Comorbilidades más comunes
        const comorbidityCounts = {};
        cohort.forEach(p => {
            if (p.comorbidities && !p.comorbidities.toLowerCase().includes('ninguna') && !p.comorbidities.toLowerCase().includes('sin')) {
                const parts = p.comorbidities.split(/[,;]/).map(c => c.trim()).filter(Boolean);
                parts.forEach(c => {
                    comorbidityCounts[c] = (comorbidityCounts[c] || 0) + 1;
                });
            }
        });

        const topComorbidities = Object.entries(comorbidityCounts)
            .map(([comorbidity, count]) => ({
                comorbidity,
                count,
                percentage: Number(((count / totalCases) * 100).toFixed(1))
            }))
            .sort((a, b) => b.count - a.count);

        // Eventos adversos o errores de prescripción documentados
        let adverseReactions = 0;
        cohort.forEach(p => {
            if (Array.isArray(p.treatmentHistory)) {
                adverseReactions += p.treatmentHistory.filter(t => t.hadAdverseReaction).length;
            }
        });

        return {
            diseaseName,
            totalCases,
            hospitalizedCount,
            curedCount,
            deceasedCount,
            mortalityRate,
            cureRate,
            avgAge,
            minAge,
            maxAge,
            ageDistribution: {
                pediatric: pediatricCount,
                adult: adultCount,
                geriatric: geriatricCount
            },
            genderDistribution: {
                male: maleCount,
                female: femaleCount,
                malePercent: Number(((maleCount / totalCases) * 100).toFixed(1)),
                femalePercent: Number(((femaleCount / totalCases) * 100).toFixed(1))
            },
            topSymptoms,
            allergyPrevalence: {
                totalAllergic: allergicCount,
                percentage: Number(((allergicCount / totalCases) * 100).toFixed(1)),
                breakdown: allergyTypes
            },
            topComorbidities,
            adverseReactionsCount: adverseReactions
        };
    }

    // Comparación con la Línea Base del Hospital
    compareDiseaseWithBaseline(diseaseName) {
        const diseasePattern = this.calculateDiseasePatterns(diseaseName);
        if (!diseasePattern) return null;

        const allPatients = this.getPatientsRegistry();
        const totalAll = allPatients.length;
        if (totalAll === 0) return null;

        const allCured = allPatients.filter(p => p.status.includes('Alta') || p.status.includes('Salvado')).length;
        const allDeceased = allPatients.filter(p => p.status.includes('Fallecido') || p.status.includes('Óbito')).length;
        const allClosed = allCured + allDeceased;
        const baselineMortality = allClosed > 0 ? Number(((allDeceased / allClosed) * 100).toFixed(1)) : 0.0;

        const allAges = allPatients.map(p => Number(p.age) || 0).filter(a => a > 0);
        const baselineAvgAge = allAges.length > 0 ? Math.round(allAges.reduce((a, b) => a + b, 0) / allAges.length) : 0;

        let allAllergicCount = 0;
        allPatients.forEach(p => {
            if (p.allergy && !p.allergy.toLowerCase().includes('sin') && !p.allergy.toLowerCase().includes('ninguna')) {
                allAllergicCount++;
            }
        });
        const baselineAllergyPercent = Number(((allAllergicCount / totalAll) * 100).toFixed(1));

        return {
            disease: diseasePattern,
            baseline: {
                totalPatients: totalAll,
                mortalityRate: baselineMortality,
                avgAge: baselineAvgAge,
                allergyPercent: baselineAllergyPercent
            },
            deltas: {
                mortalityDelta: Number((diseasePattern.mortalityRate - baselineMortality).toFixed(1)),
                ageDelta: diseasePattern.avgAge - baselineAvgAge,
                allergyDelta: Number((diseasePattern.allergyPrevalence.percentage - baselineAllergyPercent).toFixed(1))
            }
        };
    }

    // --- CÁLCULO DE KPIs HOSPITALARIOS Y GESTIÓN SANITARIA ---
    getHospitalKPIs(totalBeds = 6) {
        const registry = this.getPatientsRegistry();
        const totalAdmitted = registry.length;
        const active = registry.filter(p => p.status === "Hospitalizado").length;
        const discharged = registry.filter(p => p.status.includes("Alta") || p.status.includes("Salvado") || p.status.includes("Curado")).length;
        const deceased = registry.filter(p => p.status.includes("Fallecido") || p.status.includes("Óbito")).length;
        
        const closedCases = discharged + deceased;
        const mortalityRate = closedCases > 0 ? Number(((deceased / closedCases) * 100).toFixed(2)) : 0.00;
        const occupancyRate = Number(((active / totalBeds) * 100).toFixed(2));
        const recoveryRate = closedCases > 0 ? Number(((discharged / closedCases) * 100).toFixed(2)) : 100.00;

        return {
            totalAdmitted,
            active,
            discharged,
            deceased,
            occupancyRate,
            mortalityRate,
            recoveryRate
        };
    }

    // --- EXPORTACIÓN FORMAL A CSV (RFC 4180) ---
    exportToCSV() {
        const registry = this.getPatientsRegistry();
        if (registry.length === 0) {
            alert('No hay registros en la base de datos para exportar.');
            return false;
        }

        const headers = [
            "Nº Historia Clínica",
            "Nº Folio",
            "Cama Asignada",
            "Servicio Clínico",
            "Nivel Triaje",
            "Nombre Completo",
            "RUT / DNI",
            "Edad",
            "Sexo",
            "Grupo Sanguíneo",
            "Previsión Médica",
            "Alergias Documentadas",
            "Diagnóstico Principal",
            "Código CIE-10",
            "Síntomas Registrados",
            "Estado Clínico",
            "Fecha Admisión",
            "Hora Admisión",
            "Fecha Egreso",
            "Hora Egreso",
            "Balance Financiero"
        ];

        const escapeCSV = (str) => {
            if (str === null || str === undefined) return '""';
            const text = String(str).replace(/"/g, '""');
            return `"${text}"`;
        };

        const rows = registry.map(p => [
            escapeCSV(p.recordId),
            escapeCSV(p.folio),
            escapeCSV(p.bedNumber),
            escapeCSV(p.serviceUnit),
            escapeCSV(p.triageLevel),
            escapeCSV(p.name),
            escapeCSV(p.rutDni),
            escapeCSV(p.age),
            escapeCSV(p.gender),
            escapeCSV(p.bloodType),
            escapeCSV(p.insurance),
            escapeCSV(p.allergy),
            escapeCSV(p.primaryDiagnosis || p.disease),
            escapeCSV(p.cie10Code),
            escapeCSV(Array.isArray(p.symptoms) ? p.symptoms.join(' | ') : p.symptoms),
            escapeCSV(p.status),
            escapeCSV(p.admissionDate),
            escapeCSV(p.admissionTime),
            escapeCSV(p.dischargeDate || 'N/A'),
            escapeCSV(p.dischargeTime || 'N/A'),
            escapeCSV(p.financialBalance)
        ].join(','));

        const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `Registro_Clinico_Hospital_San_Rafael_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    }

    clearAllData() {
        localStorage.removeItem(this.dailyReportsKey);
        localStorage.removeItem(this.patientsRegistryKey);
        this.seedInitialHistoricalDataIfEmpty();
    }

    // Semilla inicial rica con variedad demográfica, síntomas y estados clínicos
    seedInitialHistoricalDataIfEmpty() {
        try {
            const current = localStorage.getItem(this.patientsRegistryKey);
            if (current && JSON.parse(current).length >= 10) return;

            const seedCases = [
                {
                    recordId: "HC-2026-0081",
                    folio: "FOL-7102",
                    bedNumber: "Cama Histórica (Alta)",
                    serviceUnit: "Medicina Interna",
                    triageLevel: "Nivel III - Urgencia",
                    triageCode: "III",
                    name: "Guillermo Paredes",
                    age: 68,
                    gender: "M",
                    rutDni: "9.845.210-4",
                    bloodType: "A+",
                    insurance: "FONASA Tramo B",
                    allergy: "Penicilina (Exantema maculopapular)",
                    disease: "Neumonía Bacteriana Adquirida en la Comunidad",
                    cie10Code: "J18.9 - Neumonía no especificada",
                    cie11Code: "CA40.0",
                    diseaseDescription: "Infiltrado basal derecho con fiebre elevada y tos mucopurulenta.",
                    comorbidities: "EPOC leve, Tabaquismo suspendido",
                    prescriptions: "Levofloxacino 750mg IV c/24h (Esquema alternativo por alergia a betalactámicos) + O2 cánula",
                    status: "Alta Médica con Resolución",
                    admissionDate: "2026-10-10",
                    admissionTime: "08:30",
                    dischargeDate: "2026-10-13",
                    dischargeTime: "14:00",
                    financialBalance: "+$950.00",
                    lastHealth: 100.00,
                    symptoms: ["Fiebre de 38.9°C", "Tos productiva verdosa", "Dolor pleurítico derecho", "Disnea de medianos esfuerzos"],
                    vitals: { bpm: 98, bpSys: 130, bpDia: 82, spo2: 90.0, temp: 38.9, respRate: 24 },
                    finalVitals: { bpm: 72, bpSys: 120, bpDia: 78, spo2: 98.0, temp: 36.6, respRate: 16 },
                    epicrisis: "Paciente tratado con protocolo seguro alternativo (Levofloxacino) por antecedente de alergia a penicilina. Excelente respuesta clínica sin eventos adversos.",
                    treatmentHistory: [
                        { timestamp: "09:00", treatmentName: "Protocolo Alternativo (Levofloxacino)", hadAdverseReaction: false, notes: "Tratamiento adecuado para paciente alérgico a betalactámicos" }
                    ]
                },
                {
                    recordId: "HC-2026-0082",
                    folio: "FOL-7103",
                    bedNumber: "Cama Histórica (Óbito)",
                    serviceUnit: "Medicina Interna",
                    triageLevel: "Nivel I - Resucitación",
                    triageCode: "I",
                    name: "Marta Echeverría",
                    age: 79,
                    gender: "F",
                    rutDni: "7.332.901-2",
                    bloodType: "O+",
                    insurance: "FONASA Tramo A",
                    allergy: "Penicilina",
                    disease: "Neumonía Bacteriana Adquirida en la Comunidad",
                    cie10Code: "J18.9 - Neumonía no especificada",
                    cie11Code: "CA40.0",
                    diseaseDescription: "Consolidación multilobar bilateral con insuficiencia respiratoria severa y shock séptico.",
                    comorbidities: "Diabetes Mellitus Tipo 2, Insuficiencia Cardíaca",
                    prescriptions: "Ceftriaxona IV 2g (Generó reacción adversa grave por alergia)",
                    status: "Fallecimiento Intrahospitalario",
                    admissionDate: "2026-10-09",
                    admissionTime: "11:20",
                    dischargeDate: "2026-10-10",
                    dischargeTime: "04:15",
                    financialBalance: "-$350.00",
                    lastHealth: 0.00,
                    symptoms: ["Fiebre de 39.4°C", "Cianosis central", "Taquipnea severa (32 rpm)", "Confusión mental aguda", "Hipotensión arterial"],
                    vitals: { bpm: 125, bpSys: 85, bpDia: 50, spo2: 82.0, temp: 39.4, respRate: 32 },
                    finalVitals: { bpm: 0, bpSys: 0, bpDia: 0, spo2: 0.0, temp: 35.8, respRate: 0 },
                    epicrisis: "Paciente de edad avanzada que ingresó en falla respiratoria. Se documentó choque anafiláctico secundario y paro cardiorrespiratorio no recuperado.",
                    treatmentHistory: [
                        { timestamp: "11:45", treatmentName: "Protocolo Estándar (Ceftriaxona)", hadAdverseReaction: true, notes: "Reacción anafiláctica severa por antecedente alérgico no respetado" }
                    ]
                },
                {
                    recordId: "HC-2026-0083",
                    folio: "FOL-7104",
                    bedNumber: "Cama Histórica (Alta)",
                    serviceUnit: "Cirugía General",
                    triageLevel: "Nivel I - Crítico Quirúrgico",
                    triageCode: "I",
                    name: "Esteban Riquelme",
                    age: 31,
                    gender: "M",
                    rutDni: "17.904.120-K",
                    bloodType: "B+",
                    insurance: "Isapre Consalud",
                    allergy: "Sin antecedentes alérgicos",
                    disease: "Apendicitis Aguda Flegmonosa con Peritonitis Focal",
                    cie10Code: "K35.8 - Apendicitis aguda con peritonitis",
                    cie11Code: "DB10.1",
                    diseaseDescription: "Apendicitis aguda flegmonosa perforada en punta con peritonitis localizada en fosa ilíaca derecha.",
                    comorbidities: "Ninguna",
                    prescriptions: "Apendicectomía laparoscópica + Ceftriaxona/Metronidazol + Analgesia IV",
                    status: "Alta Médica con Resolución",
                    admissionDate: "2026-10-11",
                    admissionTime: "16:40",
                    dischargeDate: "2026-10-13",
                    dischargeTime: "11:30",
                    financialBalance: "+$1,650.00",
                    lastHealth: 100.00,
                    symptoms: ["Dolor severo en fosa ilíaca derecha (EVA 9)", "Abdomen en tabla focal", "Náuseas y vómitos biliosos", "Fiebre 38.6°C"],
                    vitals: { bpm: 118, bpSys: 110, bpDia: 68, spo2: 97.0, temp: 38.6, respRate: 22 },
                    finalVitals: { bpm: 68, bpSys: 118, bpDia: 74, spo2: 99.0, temp: 36.5, respRate: 15 },
                    epicrisis: "Intervención quirúrgica precoz exitosa. Buena tolerancia oral postoperatoria y resolución completa del cuadro peritoneal.",
                    treatmentHistory: [
                        { timestamp: "17:15", treatmentName: "Apendicectomía de urgencia + Antibioticoterapia", hadAdverseReaction: false, notes: "Cirugía laparoscópica sin incidentes" }
                    ]
                },
                {
                    recordId: "HC-2026-0084",
                    folio: "FOL-7105",
                    bedNumber: "Cama Histórica (Alta)",
                    serviceUnit: "Endocrinología",
                    triageLevel: "Nivel II - Urgencia Calificada",
                    triageCode: "II",
                    name: "Andrea Solís",
                    age: 24,
                    gender: "F",
                    rutDni: "20.155.882-9",
                    bloodType: "A-",
                    insurance: "FONASA Tramo C",
                    allergy: "Sulfamidas",
                    disease: "Cetoacidosis Diabética Severa Descompensada",
                    cie10Code: "E10.1 - Diabetes tipo 1 con cetoacidosis",
                    cie11Code: "5A11",
                    diseaseDescription: "Grave descompensación diabética con glucemia 520 mg/dL, pH 7.15 y cetonemia 4.2 mmol/L.",
                    comorbidities: "Diabetes Mellitus Tipo 1",
                    prescriptions: "Insulina cristalina en infusión continua + Hidratación intensiva + Aporte de potasio",
                    status: "Alta Médica con Resolución",
                    admissionDate: "2026-10-12",
                    admissionTime: "02:15",
                    dischargeDate: "2026-10-13",
                    dischargeTime: "18:00",
                    financialBalance: "+$1,200.00",
                    lastHealth: 100.00,
                    symptoms: ["Respiración de Kussmaul rápida y profunda", "Aliento cetósico a manzana ácida", "Deshidratación severa", "Dolor abdominal difuso", "Polidipsia y poliuria masiva"],
                    vitals: { bpm: 122, bpSys: 95, bpDia: 58, spo2: 98.0, temp: 36.9, respRate: 28 },
                    finalVitals: { bpm: 74, bpSys: 115, bpDia: 72, spo2: 99.0, temp: 36.7, respRate: 16 },
                    epicrisis: "Cierre de anión gap y corrección de acidosis metabólica a las 14 horas de tratamiento con insulina y fluidos. Esquema basal reiniciado favorablemente.",
                    treatmentHistory: [
                        { timestamp: "02:40", treatmentName: "Infusión de Insulina + Suero Salino + KCl", hadAdverseReaction: false, notes: "Protocolo endocrinológico estricto cumplido" }
                    ]
                },
                {
                    recordId: "HC-2026-0085",
                    folio: "FOL-7106",
                    bedNumber: "Cama Histórica (Alta)",
                    serviceUnit: "Cardiología y UCI",
                    triageLevel: "Nivel I - Crítico Inmediato",
                    triageCode: "I",
                    name: "Manuel Carvajal",
                    age: 58,
                    gender: "M",
                    rutDni: "11.240.381-6",
                    bloodType: "O+",
                    insurance: "Isapre CruzBlanca",
                    allergy: "Sin antecedentes alérgicos",
                    disease: "Infarto Agudo de Miocardio (IAM con elevación de ST)",
                    cie10Code: "I21.0 - Infarto agudo del miocardio de pared anterior",
                    cie11Code: "BA41.0",
                    diseaseDescription: "Oclusión aguda de arteria descendente anterior con supradesnivel de ST en V1-V4 y troponinas masivas.",
                    comorbidities: "Hipertensión arterial, Tabaquismo activo, Dislipidemia",
                    prescriptions: "Angioplastia coronaria primaria con Stent + Doble antiagregación plaquetaria + Heparina",
                    status: "Alta Médica con Resolución",
                    admissionDate: "2026-10-08",
                    admissionTime: "19:10",
                    dischargeDate: "2026-10-12",
                    dischargeTime: "12:00",
                    financialBalance: "+$1,850.00",
                    lastHealth: 98.00,
                    symptoms: ["Dolor opresivo precordial 'pata de elefante' irradiado a brazo izquierdo y cuello", "Diaforesis fría profusa", "Sensación de muerte inminente", "Náuseas intensas"],
                    vitals: { bpm: 105, bpSys: 155, bpDia: 98, spo2: 93.0, temp: 36.7, respRate: 22 },
                    finalVitals: { bpm: 66, bpSys: 118, bpDia: 72, spo2: 98.0, temp: 36.5, respRate: 14 },
                    epicrisis: "Reperfusión coronaria exitosa antes de 90 minutos de puerta-balón. Fracción de eyección del VI preservada al alta (52%).",
                    treatmentHistory: [
                        { timestamp: "19:35", treatmentName: "Angioplastia Primaria de Urgencia", hadAdverseReaction: false, notes: "TIMI 3 flujo restablecido" }
                    ]
                },
                {
                    recordId: "HC-2026-0086",
                    folio: "FOL-7107",
                    bedNumber: "Cama Histórica (Alta)",
                    serviceUnit: "Pediatría",
                    triageLevel: "Nivel III - Urgencia",
                    triageCode: "III",
                    name: "Valentina Henríquez",
                    age: 6,
                    gender: "F",
                    rutDni: "27.409.112-3",
                    bloodType: "O-",
                    insurance: "FONASA Tramo A",
                    allergy: "Sin antecedentes alérgicos",
                    disease: "Crisis Asmática Severa Aguda",
                    cie10Code: "J45.0 - Asma con exacerbación aguda",
                    cie11Code: "CA23.0",
                    diseaseDescription: "Broncoespasmo infantil agudo con sibilancias audibles a distancia y tiraje intercostal.",
                    comorbidities: "Asma atópica infantil",
                    prescriptions: "Salbutamol nebulizado c/20m + Corticoide sistémico IV + Oxigenoterapia por cánula",
                    status: "Alta Médica con Resolución",
                    admissionDate: "2026-10-10",
                    admissionTime: "21:00",
                    dischargeDate: "2026-10-11",
                    dischargeTime: "17:30",
                    financialBalance: "+$850.00",
                    lastHealth: 100.00,
                    symptoms: ["Disnea sibilante de inicio brusco", "Tiraje subcostal e intercostal", "Tos seca espasmódica", "SpO2 88% aire ambiente"],
                    vitals: { bpm: 135, bpSys: 100, bpDia: 60, spo2: 88.0, temp: 36.8, respRate: 36 },
                    finalVitals: { bpm: 88, bpSys: 98, bpDia: 62, spo2: 99.0, temp: 36.6, respRate: 20 },
                    epicrisis: "Remisión completa de sibilancias y trabajo respiratorio. Se otorga alta médica con plan de acción por escrito y técnica inhalatoria educada a la madre.",
                    treatmentHistory: [
                        { timestamp: "21:15", treatmentName: "Nebulización broncodilatadora + Hidrocortisona IV", hadAdverseReaction: false, notes: "Respuesta broncodilatadora rápida" }
                    ]
                }
            ];

            const existingRegistry = this.getPatientsRegistry();
            const merged = [...existingRegistry];
            seedCases.forEach(sc => {
                if (!merged.find(p => p.recordId === sc.recordId)) {
                    merged.push(sc);
                }
            });
            localStorage.setItem(this.patientsRegistryKey, JSON.stringify(merged));

            // Sembrar informes de jornadas previas con pacientes curados y óbitos explícitos
            const existingReports = this.getHistory();
            if (!existingReports || existingReports.length === 0 || !existingReports[0].curedPatients) {
                const sampleHistoricalReports = [
                    {
                        dayNumber: 0,
                        date: "Guardia Anterior",
                        saved: 2,
                        lost: 1,
                        treatments: 5,
                        startingFunds: 4000.00,
                        finalFunds: 4800.00,
                        income: 1450.00,
                        expenses: 650.00,
                        netProfit: 800.00,
                        reputation: 85.00,
                        survivalRate: 66.7,
                        rank: "A",
                        rankColor: "text-emerald-600 font-bold",
                        rankTitle: "Gestión Asistencial Sobresaliente",
                        curedPatients: [
                            {
                                recordId: "HC-2026-0081",
                                folio: "FOL-7102",
                                name: "Guillermo Paredes",
                                age: 68,
                                gender: "M",
                                bloodType: "A+",
                                insurance: "FONASA Tramo B",
                                disease: "Neumonía Bacteriana Adquirida en la Comunidad",
                                cie10Code: "J18.9",
                                bedNumber: "Cama Histórica",
                                time: "14:00",
                                day: 0,
                                rewardFunds: 950.00,
                                rewardRep: 6.00
                            },
                            {
                                recordId: "HC-2026-0083",
                                folio: "FOL-7104",
                                name: "Esteban Riquelme",
                                age: 41,
                                gender: "M",
                                bloodType: "B+",
                                insurance: "Isapre Banmédica",
                                disease: "Apendicitis Aguda Complicada",
                                cie10Code: "K35.8",
                                bedNumber: "Cama Histórica",
                                time: "18:30",
                                day: 0,
                                rewardFunds: 1200.00,
                                rewardRep: 8.00
                            }
                        ],
                        deceasedPatients: [
                            {
                                recordId: "HC-2026-0082",
                                folio: "FOL-7103",
                                name: "Marta Echeverría",
                                age: 79,
                                gender: "F",
                                bloodType: "O+",
                                insurance: "FONASA Tramo A",
                                disease: "Neumonía Bacteriana Adquirida en la Comunidad",
                                cie10Code: "J18.9",
                                bedNumber: "Cama Histórica",
                                time: "04:15",
                                day: 0,
                                cause: "Choque anafiláctico por betalactámicos y sepsis severa"
                            }
                        ]
                    }
                ];
                localStorage.setItem(this.dailyReportsKey, JSON.stringify(sampleHistoricalReports));
            }
        } catch (e) {
            console.error('Error al sembrar datos históricos en BD:', e);
        }
    }

    // Lista Maestra de Pacientes con Datos Clave para Vista Rápida Médica
    getAllPatientsWithKeyData() {
        const registry = this.getPatientsRegistry();
        return registry.map(p => {
            const statusStr = (p.status || '').toLowerCase();
            const isDeceased = statusStr.includes('fallecid') || statusStr.includes('óbito') || statusStr.includes('defunci') || p.lastHealth === 0;
            const isCured = statusStr.includes('alta') || statusStr.includes('salvado') || statusStr.includes('curado');
            const isHospitalized = !isDeceased && !isCured;

            return {
                recordId: p.recordId,
                folio: p.folio || `FOL-${p.recordId}`,
                name: p.name || 'Paciente no identificado',
                avatar: p.avatar || (p.gender === 'F' ? '👩' : '👨'),
                rutDni: p.rutDni || p.dni || 'Sin DNI',
                gender: p.gender || 'M',
                insurance: p.insurance || 'FONASA - Tramo A',
                bloodType: p.bloodType || 'O+',
                age: p.age || 45,
                statusText: isDeceased ? 'Fallecido (Óbito)' : isCured ? 'Curado (Alta Médica)' : 'Hospitalizado (En Cama)',
                isDeceased,
                isCured,
                isHospitalized,
                disease: p.primaryDiagnosis || p.disease || 'Patología en evaluación',
                cie10Code: p.cie10Code || '',
                allergy: p.allergy || 'Sin alergias',
                admissionDate: p.admissionDate || 'Día 1',
                admissionTime: p.admissionTime || '07:00',
                dischargeTime: p.dischargeTime || null,
                bedNumber: p.bedNumber || 'En Sala'
            };
        });
    }
}

window.hospitalDB = new HospitalDatabase();
