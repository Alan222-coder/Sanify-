// js/data.js - Datos Iniciales, Pacientes Formalizados, Catálogo Clínico y CDSS de Alergias

const INITIAL_GAME_DATA = {
    hospital: {
        name: "Hospital Central San Rafael - Pabellón de Hospitalización A",
        funds: 4800.00,
        reputation: 85.00,
        curedCount: 0,
        lostCount: 0,
        emergencyCount: 0,
        gameSpeed: 1, // 0: Pausa, 1: Normal, 2: Rápido, 3: Ultra
        day: 1,
        time: "07:00",
        dayStartHour: 7,
        dayEndHour: 22,
        dayEnded: false,
        inGameMinutesPerTick: 1.36,
        timeCounterMinutes: 0.00,
        isBlackoutActive: false,
        blackoutTimer: 0,
        clues: {
            available: 3,
            maxDaily: 3,
            price: 2500.00,
            usedToday: 0
        },
        dayStats: {
            saved: 0,
            lost: 0,
            treatments: 0,
            startingFunds: 4800.00,
            income: 0.00,
            expenses: 0.00,
            curedPatients: [],
            deceasedPatients: []
        },
        staff: {
            doctors: { total: 3, busy: 0 },
            nurses: { total: 5, busy: 0 }
        },
        supplies: {
            antibiotics: 12,
            serums: 16,
            analgesics: 10,
            oxygen: 8,
            insulin: 6
        },
        storePrices: {
            antibiotics: { name: "Lote de Antibióticos (x5)", count: 5, cost: 250.00, key: "antibiotics", icon: "💊" },
            serums: { name: "Pack de Sueros Salinos (x5)", count: 5, cost: 150.00, key: "serums", icon: "🧪" },
            analgesics: { name: "Pack de Analgésicos Mayores (x5)", count: 5, cost: 200.00, key: "analgesics", icon: "💉" },
            oxygen: { name: "Recarga de Balones de Oxígeno (x3)", count: 3, cost: 300.00, key: "oxygen", icon: "🫁" },
            insulin: { name: "Viales de Insulina Rápida (x4)", count: 4, cost: 280.00, key: "insulin", icon: "🧬" },
            doctor: { name: "Contratar Médico Especialista", count: 1, cost: 1400.00, type: "doctor", icon: "🩺" },
            nurse: { name: "Contratar Enfermero/a de Guardia", count: 1, cost: 800.00, type: "nurse", icon: "🩹" },
            clue: { name: "Interconsulta Médica Senior (1 Pista)", count: 1, cost: 2500.00, type: "clue", icon: "💡" }
        }
    },

    patients: [
        {
            id: 1,
            recordId: "HC-2026-0101",
            folio: "FOL-8921",
            bedNumber: "Cama 01",
            serviceUnit: "Medicina Interna",
            triageLevel: "Nivel III - Urgencia",
            triageCode: "III",
            name: "Carlos Mendoza",
            age: 64,
            gender: "M",
            rutDni: "12.845.912-4",
            insurance: "FONASA Tramo A",
            avatar: "👨‍🦳",
            bloodType: "A+",
            allergy: "Penicilina (Anafilaxia previa severa)",
            disease: "Neumonía Bacteriana Adquirida en la Comunidad",
            cie11Code: "CA40.0 - Neumonía adquirida en la comunidad",
            cie10Code: "J18.9 - Neumonía no especificada",
            snomedCode: "385093006 - Community acquired pneumonia",
            diseaseDescription: "Infiltrado alveolar en lóbulo inferior derecho con fiebre cuantificada en 39.1°C, expectoración mucopurulenta y taquipnea.",
            comorbidities: "Tabaquismo crónico (IPA 35), Hipertensión arterial estadio 1",
            symptoms: ["Fiebre de 39.1°C", "Tos productiva verdosa", "Disnea moderada", "Dolor pleurítico derecho"],
            severity: "moderate",
            health: 64.00,
            cureProgress: 20.00,
            decayRate: 0.10,
            isSpecialCritical: false,
            isUnderTreatment: false,
            treatmentTimer: 0,
            treatmentTotalDuration: 22,
            possibleCure: "Levofloxacino IV 750mg + Oxigenoterapia (Esquema seguro antialérgico)",
            requiredResources: { antibiotics: 2, serums: 1, analgesics: 0, oxygen: 1, insulin: 0, doctor: 0, nurse: 1 },
            dischargeReward: { funds: 950.00, reputation: 6.00 },
            vitals: { bpm: 94, bpSys: 135, bpDia: 85, spo2: 91.0, temp: 39.1, respRate: 26 },
            notes: "Ingreso por urgencias. Crepitantes bibasales audibles. Paciente colaborador.",
            availableTreatments: {
                standard: {
                    id: "std",
                    name: "Protocolo Estándar (Ceftriaxona IV 2g)",
                    class: "Cefalosporina / Betalactámico",
                    medication: "Ceftriaxona 2g IV/24h + Oxígeno cánula nasal 3 L/min",
                    containsAllergens: ["Penicilina", "Betalactámicos", "Cefalosporinas"],
                    description: "Tratamiento bactericida de primera línea institucional para NAC.",
                    requiredResources: { antibiotics: 2, serums: 1, analgesics: 0, oxygen: 1, insulin: 0, doctor: 0, nurse: 1 },
                    isSafeForPatient: false,
                    contraindicationReason: "¡CONTRAINDICADO! El paciente tiene anafilaxia documentada a Penicilina y betalactámicos cruzados."
                },
                alternative: {
                    id: "alt",
                    name: "Protocolo Seguro de Rescate (Levofloxacino IV 750mg)",
                    class: "Fluoroquinolona respiratoria (Sin betalactámicos)",
                    medication: "Levofloxacino 750mg IV/24h + Oxigenoterapia cánula 3 L/min",
                    containsAllergens: ["Quinolonas"],
                    description: "Esquema seguro de elección para pacientes alérgicos a betalactámicos con excelente biodisponibilidad pulmonar.",
                    requiredResources: { antibiotics: 2, serums: 1, analgesics: 0, oxygen: 1, insulin: 0, doctor: 0, nurse: 1 },
                    isSafeForPatient: true,
                    recommendationReason: "Recomendado por CDSS: Cobertura contra Streptococcus pneumoniae y atípicos sin riesgo inmunológico."
                },
                contraindicated: {
                    id: "contra",
                    name: "Penicilina Sódica a Dosis Altas",
                    medication: "Penicilina G Sódica 4.000.000 UI IV",
                    consequence: "Desencadena Shock Anafiláctico inmediato, edema de Quincke con cierre de vía aérea y asistolia.",
                    healthPenalty: 35
                }
            },
            evolutionConsequences: "Si no recibe tratamiento oportuno o se administra betalactámico, evolucionará a shock séptico o anafilaxia con insuficiencia respiratoria fatal."
        },
        {
            id: 2,
            recordId: "HC-2026-0102",
            folio: "FOL-8922",
            bedNumber: "Cama 02",
            serviceUnit: "Cirugía General y Digestiva",
            triageLevel: "Nivel I - Resucitación / Crítico Inmediato",
            triageCode: "I",
            name: "Lucía Benítez",
            age: 28,
            gender: "F",
            rutDni: "19.340.582-7",
            insurance: "Isapre Colmena Golden",
            avatar: "👩",
            bloodType: "O+",
            allergy: "Sin antecedentes alérgicos",
            disease: "Apendicitis Aguda Flegmonosa con Peritonitis Focal",
            cie11Code: "DB10.1 - Apendicitis aguda perforada",
            cie10Code: "K35.8 - Apendicitis aguda con peritonitis",
            snomedCode: "47693006 - Perforated acute appendicitis",
            diseaseDescription: "¡CASO ESPECIAL CRÍTICO! Cuadro peritoneal agudo con Blumberg y Rovsing positivos. Microperforación apendicular con líquido libre en fondo de saco.",
            comorbidities: "Sin antecedentes mórbidos relevantes",
            symptoms: ["Dolor fosa ilíaca derecha", "Abdomen en tabla", "Vómitos biliosos", "Fiebre 38.8°C"],
            severity: "critical",
            health: 36.00,
            cureProgress: 0.00,
            decayRate: 0.65,
            isSpecialCritical: true,
            isUnderTreatment: false,
            treatmentTimer: 0,
            treatmentTotalDuration: 26,
            possibleCure: "Apendicectomía laparoscópica de urgencia + Ceftriaxona/Metronidazol + Analgesia IV",
            requiredResources: { antibiotics: 2, serums: 1, analgesics: 2, oxygen: 0, insulin: 0, doctor: 1, nurse: 1 },
            dischargeReward: { funds: 1650.00, reputation: 12.00 },
            vitals: { bpm: 124, bpSys: 98, bpDia: 58, spo2: 96.0, temp: 38.8, respRate: 24 },
            notes: "Alerta quirúrgica activa. Requiere médico especialista inmediatamente o entrará en shock séptico.",
            availableTreatments: {
                standard: {
                    id: "std",
                    name: "Cirugía Laparoscópica de Urgencia + Triple Terapia Antibiótica",
                    class: "Resolución Quirúrgica Asistida + Cefalosporina/Metronidazol",
                    medication: "Apendicectomía Laparoscópica + Ceftriaxona 2g + Metronidazol 500mg IV + Tramadol 50mg",
                    containsAllergens: ["Penicilina", "Cefalosporinas"],
                    description: "Tratamiento de elección definitivo para controlar foco peritoneal y prevenir peritonitis fecal.",
                    requiredResources: { antibiotics: 2, serums: 1, analgesics: 2, oxygen: 0, insulin: 0, doctor: 1, nurse: 1 },
                    isSafeForPatient: true,
                    recommendationReason: "Recomendado por CDSS: Paciente sin alergias conocidas; la intervención quirúrgica inmediata es mandatoria."
                },
                alternative: {
                    id: "alt",
                    name: "Cirugía + Esquema Antibiótico No Betalactámico (Ciprofloxacino)",
                    class: "Cirugía + Quinolona + Antianaeróbico",
                    medication: "Apendicectomía + Ciprofloxacino 400mg IV + Metronidazol 500mg IV + Analgesia",
                    containsAllergens: ["Quinolonas"],
                    description: "Protocolo alternativo de excelente eficacia para descontaminación intraabdominal.",
                    requiredResources: { antibiotics: 2, serums: 1, analgesics: 2, oxygen: 0, insulin: 0, doctor: 1, nurse: 1 },
                    isSafeForPatient: true,
                    recommendationReason: "Opción válida y segura para control peritoneal."
                },
                contraindicated: {
                    id: "contra",
                    name: "Manejo Exclusivamente Analgésico sin Cirugía",
                    medication: "Ketorolaco IV sin intervención quirúrgica",
                    consequence: "Perforación libre con peritonitis fecaloidea generalizada, shock séptico refractario y fallo multiorgánico.",
                    healthPenalty: 40
                }
            },
            evolutionConsequences: "Riesgo inminente de peritonitis purulenta generalizada y shock séptico en menos de 2 horas si no se opera."
        },
        {
            id: 3,
            recordId: "HC-2026-0103",
            folio: "FOL-8923",
            bedNumber: "Cama 03",
            serviceUnit: "Traumatología y Ortopedia",
            triageLevel: "Nivel IV - Urgencia Menor",
            triageCode: "IV",
            name: "Matías Morales",
            age: 19,
            gender: "M",
            rutDni: "22.115.890-3",
            insurance: "Seguro Deportivo Universitario",
            avatar: "🧑",
            bloodType: "B+",
            allergy: "AINEs (Ibuprofeno/Ketorolaco/Aspirina)",
            disease: "Traumatismo Torácico Cerrado y Fractura Costal Izquierda",
            cie11Code: "NC12.3 - Fractura de costilla",
            cie10Code: "S22.3 - Fractura de costilla",
            snomedCode: "361114002 - Fracture of rib",
            diseaseDescription: "Fisura de 5to y 6to arco costal posterior izquierdo secundaria a traumatismo deportivo de alto impacto. Sin neumotórax.",
            comorbidities: "Deportista de alto rendimiento (Rugby)",
            symptoms: ["Dolor pleurítico intenso", "Hematoma costal", "Respiración superficial antálgica"],
            severity: "stable",
            health: 82.00,
            cureProgress: 45.00,
            decayRate: 0.05,
            isSpecialCritical: false,
            isUnderTreatment: false,
            treatmentTimer: 0,
            treatmentTotalDuration: 16,
            possibleCure: "Faja de contención torácica elástica + Paracetamol IV 1g c/8h + Espirometría incentivada volumétrica",
            requiredResources: { antibiotics: 0, serums: 1, analgesics: 2, oxygen: 0, insulin: 0, doctor: 0, nurse: 1 },
            dischargeReward: { funds: 750.00, reputation: 5.00 },
            vitals: { bpm: 74, bpSys: 120, bpDia: 78, spo2: 98.0, temp: 36.8, respRate: 18 },
            notes: "Evolución favorable. Dolor controlado con pauta regular de analgesia.",
            availableTreatments: {
                standard: {
                    id: "std",
                    name: "Analgésicos Antiinflamatorios Comunes (Ketorolaco / Dexketoprofeno)",
                    class: "AINEs clásicos",
                    medication: "Ketorolaco 30mg IV c/8h + Suero Salino",
                    containsAllergens: ["AINEs", "Ibuprofeno", "Ketorolaco", "Aspirina"],
                    description: "Pauta convencional de dolor traumático en pacientes sin alergias.",
                    requiredResources: { antibiotics: 0, serums: 1, analgesics: 2, oxygen: 0, insulin: 0, doctor: 0, nurse: 1 },
                    isSafeForPatient: false,
                    contraindicationReason: "¡ALERTA ROJA! El paciente presenta hipersensibilidad a AINEs documentada. Riesgo de broncoespasmo severo y shock por pseudoalergia."
                },
                alternative: {
                    id: "alt",
                    name: "Protocolo Seguro Sin AINEs (Paracetamol IV + Opioide Débil)",
                    class: "Analgésico no ácido + Opioide",
                    medication: "Paracetamol 1g IV + Tramadol 50mg infusión + Faja torácica elástica",
                    containsAllergens: ["Paracetamol"],
                    description: "Manejo antálgico óptimo sin inhibición de COX-1 en pacientes intolerantes a AINEs.",
                    requiredResources: { antibiotics: 0, serums: 1, analgesics: 2, oxygen: 0, insulin: 0, doctor: 0, nurse: 1 },
                    isSafeForPatient: true,
                    recommendationReason: "Recomendado por CDSS: Totalmente seguro para alérgicos a antiinflamatorios no esteroideos."
                },
                contraindicated: {
                    id: "contra",
                    name: "Inyección de Ketorolaco Intravenoso",
                    medication: "Ketorolaco trometamol 60mg bolo IV",
                    consequence: "Crisis de broncoespasmo severo (asma por aspirina/AINEs), angioedema palpebral y desaturación aguda.",
                    healthPenalty: 30
                }
            },
            evolutionConsequences: "El dolor restrictivo puede desencadenar atelectasias basales y neumonía secundaria por hipoventilación."
        },
        {
            id: 4,
            recordId: "HC-2026-0104",
            folio: "FOL-8924",
            bedNumber: "Cama 04",
            serviceUnit: "Unidad de Cuidados Intensivos (UCI)",
            triageLevel: "Nivel I - Emergencia Crítica",
            triageCode: "I",
            name: "Elena Rostova",
            age: 52,
            gender: "F",
            rutDni: "16.702.441-9",
            insurance: "Seguro Internacional MedLife",
            avatar: "👩‍🦱",
            bloodType: "AB-",
            allergy: "Látex (Requiere guantes de nitrilo y vías libres de látex)",
            disease: "Crisis Hipertensiva tipo Emergencia con Angina Inestable",
            cie11Code: "BA00 - Hipertensión esencial con afectación orgánica",
            cie10Code: "I10 / I20.0 - Hipertensión y angina inestable",
            snomedCode: "706882009 - Hypertensive emergency",
            diseaseDescription: "¡CASO ESPECIAL CRÍTICO! Cifras tensionales de 195/115 mmHg con dolor retroesternal opresivo irradiado a mandíbula y alteración de onda T.",
            comorbidities: "Dislipidemia mixta, Hipertensión refractaria, Estrés severo",
            symptoms: ["Cefalea occipital severa", "Opresión precordial", "Visión borrosa", "Cifras de 195/115 mmHg"],
            severity: "severe",
            health: 45.00,
            cureProgress: 15.00,
            decayRate: 0.40,
            isSpecialCritical: true,
            isUnderTreatment: false,
            treatmentTimer: 0,
            treatmentTotalDuration: 24,
            possibleCure: "Infusión titulada de Labetalol IV + Nitroglicerina + Antiagregación (Equipo libre de látex)",
            requiredResources: { antibiotics: 0, serums: 2, analgesics: 1, oxygen: 1, insulin: 0, doctor: 1, nurse: 1 },
            dischargeReward: { funds: 1400.00, reputation: 9.00 },
            vitals: { bpm: 112, bpSys: 195, bpDia: 115, spo2: 94.0, temp: 37.1, respRate: 22 },
            notes: "Paciente de alto riesgo cardiovascular. Requiere atención de médico especialista.",
            availableTreatments: {
                standard: {
                    id: "std",
                    name: "Protocolo Antihipertensivo Titulado (Labetalol IV + Nitroglicerina en circuito libre de látex)",
                    class: "Bloqueador alfa/beta + Vasodilatador venoso",
                    medication: "Labetalol bolo 20mg IV seguido de infusión + NTG sublingual + Monitorización no invasiva",
                    containsAllergens: [],
                    description: "Control gradual y seguro de PAM previniendo infarto agudo de miocardio.",
                    requiredResources: { antibiotics: 0, serums: 2, analgesics: 1, oxygen: 1, insulin: 0, doctor: 1, nurse: 1 },
                    isSafeForPatient: true,
                    recommendationReason: "Recomendado por CDSS: Descenso controlado de presión arterial sin contacto con látex."
                },
                alternative: {
                    id: "alt",
                    name: "Infusión de Nitroprusiato de Sodio + Oxígeno por Cánula",
                    class: "Vasodilatador arterial directo",
                    medication: "Nitroprusiato 0.5 mcg/kg/min + Sedación antálgica",
                    containsAllergens: [],
                    description: "Terapia de segunda línea para emergencias hipertensivas refractarias.",
                    requiredResources: { antibiotics: 0, serums: 2, analgesics: 1, oxygen: 1, insulin: 0, doctor: 1, nurse: 1 },
                    isSafeForPatient: true,
                    recommendationReason: "Seguro y eficaz en unidad monitorizada."
                },
                contraindicated: {
                    id: "contra",
                    name: "Nifedipino Sublingual Rápido / Contacto con Material de Látex",
                    medication: "Nifedipino cápsula mordida + sonda de látex",
                    consequence: "Caída brusca incontrolada de presión arterial (robo coronario), hipoperfusión cerebral y reacción de contacto grave.",
                    healthPenalty: 35
                }
            },
            evolutionConsequences: "Riesgo de accidente cerebrovascular hemorrágico, disección aórtica o infarto agudo de miocardio."
        },
        {
            id: 5,
            recordId: "HC-2026-0105",
            folio: "FOL-8925",
            bedNumber: "Cama 05",
            serviceUnit: "Pediatría y Cuidados Entéricos",
            triageLevel: "Nivel III - Urgencia",
            triageCode: "III",
            name: "Tomás Gómez",
            age: 8,
            gender: "M",
            rutDni: "26.831.205-0",
            insurance: "FONASA Tramo B",
            avatar: "👦",
            bloodType: "O-",
            allergy: "Sin antecedentes alérgicos",
            disease: "Gastroenteritis Aguda Infecciosa con Deshidratación Grado II",
            cie11Code: "1A03 - Gastroenteritis bacteriana / viral",
            cie10Code: "A09 - Diarrea y gastroenteritis infecciosa",
            snomedCode: "25374005 - Acute gastroenteritis",
            diseaseDescription: "Pérdida hidroelectrolítica severa por vómitos profusos y diarreas líquidas. Signo del pliegue positivo, mucosas secas y oliguria relativa.",
            comorbidities: "Sin antecedentes patológicos relevantes",
            symptoms: ["Vómitos continuos", "Sequedad de mucosas", "Letargo", "Ojos hundidos"],
            severity: "moderate",
            health: 58.00,
            cureProgress: 35.00,
            decayRate: 0.08,
            isSpecialCritical: false,
            isUnderTreatment: false,
            treatmentTimer: 0,
            treatmentTotalDuration: 18,
            possibleCure: "Fluidoterapia endovenosa de rehidratación (Solución Hartmann 20 ml/kg) + Ondansetrón IV + Probióticos",
            requiredResources: { antibiotics: 1, serums: 3, analgesics: 0, oxygen: 0, insulin: 0, doctor: 0, nurse: 1 },
            dischargeReward: { funds: 850.00, reputation: 6.00 },
            vitals: { bpm: 102, bpSys: 96, bpDia: 60, spo2: 99.0, temp: 38.0, respRate: 22 },
            notes: "Mejoría clínica evidente tras segunda carga de hidratación. Tolera pequeños sorbos de agua.",
            availableTreatments: {
                standard: {
                    id: "std",
                    name: "Expansión Rápida con Solución Hartmann + Ondansetrón IV",
                    class: "Cristaloide balanceado + Antiemético selectivo 5-HT3",
                    medication: "Solución Ringer Lactato / Hartmann 20ml/kg + Ondansetrón 0.15 mg/kg IV + Ciprofloxacino pediátrico",
                    containsAllergens: [],
                    description: "Restablece el volumen intravascular sin generar acidosis hiperclorémica.",
                    requiredResources: { antibiotics: 1, serums: 3, analgesics: 0, oxygen: 0, insulin: 0, doctor: 0, nurse: 1 },
                    isSafeForPatient: true,
                    recommendationReason: "Recomendado por CDSS: Corrección óptima del déficit hidroelectrolítico pediátrico."
                },
                alternative: {
                    id: "alt",
                    name: "Suero Fisiológico al 0.9% + Sales de Rehidratación Oral Guiada",
                    class: "Cristaloide isotónico clásico",
                    medication: "Suero Fisiológico 0.9% 1000cc + Reposición oral fraccionada",
                    containsAllergens: [],
                    description: "Alternativa clásica para recuperación paulatina de tolerancia oral.",
                    requiredResources: { antibiotics: 1, serums: 3, analgesics: 0, oxygen: 0, insulin: 0, doctor: 0, nurse: 1 },
                    isSafeForPatient: true,
                    recommendationReason: "Seguro y efectivo."
                },
                contraindicated: {
                    id: "contra",
                    name: "Loperamida Oral en Dosis de Adulto",
                    medication: "Loperamida 2mg cada 4 horas",
                    consequence: "Íleo paralítico severo, retención de toxinas en luz intestinal, riesgo de megacolon tóxico y perforación.",
                    healthPenalty: 35
                }
            },
            evolutionConsequences: "La deshidratación grave no corregida progresa a shock hipovolémico y fracaso renal agudo prerrenal."
        },
        {
            id: 6,
            recordId: "HC-2026-0106",
            folio: "FOL-8926",
            bedNumber: "Cama 06",
            serviceUnit: "Endocrinología y Metabólica",
            triageLevel: "Nivel II - Urgencia Calificada",
            triageCode: "II",
            name: "Clara Santana",
            age: 73,
            gender: "F",
            rutDni: "10.455.198-2",
            insurance: "Cruz Blanca Senior",
            avatar: "👵",
            bloodType: "A-",
            allergy: "Sulfamidas (Sulfametoxazol / Fármacos sulfatados)",
            disease: "Cetoacidosis Diabética Severa Descompensada",
            cie11Code: "5A11 - Cetoacidosis diabética",
            cie10Code: "E10.1 - Diabetes tipo 1 con cetoacidosis",
            snomedCode: "70747000 - Diabetic ketoacidosis",
            diseaseDescription: "Grave descompensación metabólica con hiperglucemia de 480 mg/dL, acidosis metabólica con anión gap elevado (pH 7.18) y cetonuria marcada.",
            comorbidities: "Diabetes Mellitus Tipo 1 de 35 años de evolución, Retinopatía, Neuropatía",
            symptoms: ["Respiración de Kussmaul", "Aliento cetósico", "Desorientación temporoespacial", "Hiperglucemia 480 mg/dL"],
            severity: "severe",
            health: 50.00,
            cureProgress: 25.00,
            decayRate: 0.20,
            isSpecialCritical: false,
            isUnderTreatment: false,
            treatmentTimer: 0,
            treatmentTotalDuration: 25,
            possibleCure: "Bomba de infusión continua de Insulina rápida (0.1 UI/kg/h) + Reexpansión salina + Reposición de Potasio (KCl)",
            requiredResources: { antibiotics: 0, serums: 2, analgesics: 0, oxygen: 1, insulin: 2, doctor: 1, nurse: 1 },
            dischargeReward: { funds: 1400.00, reputation: 9.00 },
            vitals: { bpm: 100, bpSys: 110, bpDia: 70, spo2: 95.0, temp: 36.9, respRate: 30 },
            notes: "Paciente frágil. Vigilar descenso paulatino de glucosa no superior a 70-100 mg/dL por hora para evitar edema cerebral.",
            availableTreatments: {
                standard: {
                    id: "std",
                    name: "Bomba de Insulina Rápida Continua + Fluidoterapia + KCl",
                    class: "Hormona hipoglucemiante pura + Electrolitos",
                    medication: "Insulina Regular IV 0.1 UI/kg/h + Suero Salino 0.9% 1000cc/h + Cloruro de Potasio 20 mEq/L",
                    containsAllergens: ["Insulina"],
                    description: "Protocolo ministerial estándar de oro para frenar la lipólisis y corregir la acidosis con monitorización de kalemia.",
                    requiredResources: { antibiotics: 0, serums: 2, analgesics: 0, oxygen: 1, insulin: 2, doctor: 1, nurse: 1 },
                    isSafeForPatient: true,
                    recommendationReason: "Recomendado por CDSS: Libre de compuestos sulfamidados. Imprescindible para cerrar anión gap."
                },
                alternative: {
                    id: "alt",
                    name: "Insulina Rápida Subcutánea Horaria + Solución Polielectrolítica",
                    class: "Hipoglucemiante fraccionado",
                    medication: "Insulina Lispro/Aspart sc cada hora + Rehidratación intensa",
                    containsAllergens: [],
                    description: "Alternativa para situaciones con bombas de infusión ocupadas.",
                    requiredResources: { antibiotics: 0, serums: 2, analgesics: 0, oxygen: 1, insulin: 2, doctor: 1, nurse: 1 },
                    isSafeForPatient: true,
                    recommendationReason: "Protocolo seguro y validado."
                },
                contraindicated: {
                    id: "contra",
                    name: "Sulfonilureas (Glibenclamida) / Cotrimoxazol",
                    medication: "Sulfamida oral en paciente con cetoacidosis",
                    consequence: "Shock anafiláctico por alergia a sulfas y agravamiento del coma hiperosmolar con hipotensión refractaria.",
                    healthPenalty: 35
                }
            },
            evolutionConsequences: "La progresión de la acidosis láctica y cetósica lleva a colapso hemodinámico, arritmias ventriculares por diskalemia y coma profundo."
        }
    ]
};

// =========================================================================
// CATÁLOGO DE 16+ ENFERMEDADES REALISTAS Y DIVERSAS PARA GENERADOR Y COHORTES
// =========================================================================
const CLINICAL_DISEASES_CATALOG = [
    {
        id: "nac",
        name: "Neumonía Bacteriana Adquirida en la Comunidad (NAC)",
        category: "Neumología",
        cie10: "J18.9 - Neumonía no especificada",
        cie11: "CA40.0",
        serviceUnit: "Medicina Interna",
        triageCode: "III",
        triageLevel: "Nivel III - Urgencia",
        severity: "moderate",
        baseHealth: 62.00,
        decayRate: 0.10,
        symptoms: ["Fiebre de 39.1°C", "Tos productiva verdosa", "Disnea moderada", "Dolor pleurítico derecho"],
        description: "Infección alveolar bacteriana con exudado inflamatorio y condensación pulmonar.",
        standardTreatment: {
            name: "Protocolo Estándar (Ceftriaxona IV + O2)",
            medication: "Ceftriaxona 2g IV + Cánula nasal 3 L/min",
            containsAllergens: ["Penicilina", "Betalactámicos", "Cefalosporinas"],
            resources: { antibiotics: 2, serums: 1, analgesics: 0, oxygen: 1, insulin: 0, doctor: 0, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Protocolo Seguro (Levofloxacino IV 750mg)",
            medication: "Levofloxacino 750mg IV/24h + Oxigenoterapia",
            containsAllergens: ["Quinolonas"],
            resources: { antibiotics: 2, serums: 1, analgesics: 0, oxygen: 1, insulin: 0, doctor: 0, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Penicilina Sódica IV",
            consequence: "Shock anafiláctico severo y broncoespasmo fulminante si el paciente es alérgico a betalactámicos."
        },
        reward: { funds: 950.00, reputation: 6.00 }
    },
    {
        id: "apendicitis",
        name: "Apendicitis Aguda Flegmonosa con Peritonitis",
        category: "Cirugía General",
        cie10: "K35.8 - Apendicitis aguda con peritonitis",
        cie11: "DB10.1",
        serviceUnit: "Cirugía General",
        triageCode: "I",
        triageLevel: "Nivel I - Crítico Quirúrgico",
        severity: "critical",
        baseHealth: 38.00,
        decayRate: 0.65,
        symptoms: ["Dolor fosa ilíaca derecha", "Abdomen en tabla", "Vómitos biliosos", "Fiebre 38.8°C"],
        description: "Inflamación y microperforación apendicular con reacción peritoneal localizada.",
        standardTreatment: {
            name: "Apendicectomía Laparoscópica + Ceftriaxona/Metronidazol",
            medication: "Cirugía inmediata + Ceftriaxona 2g IV + Metronidazol 500mg IV",
            containsAllergens: ["Penicilina", "Cefalosporinas"],
            resources: { antibiotics: 2, serums: 1, analgesics: 2, oxygen: 0, insulin: 0, doctor: 1, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Cirugía + Ciprofloxacino / Metronidazol",
            medication: "Cirugía laparoscópica + Ciprofloxacino 400mg IV + Metronidazol",
            containsAllergens: ["Quinolonas"],
            resources: { antibiotics: 2, serums: 1, analgesics: 2, oxygen: 0, insulin: 0, doctor: 1, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Analgesia con AINEs sin intervención quirúrgica",
            consequence: "Peritonitis fecaloidea generalizada, shock séptico refractario y asistolia."
        },
        reward: { funds: 1650.00, reputation: 12.00 }
    },
    {
        id: "iam",
        name: "Infarto Agudo de Miocardio (IAM con elevación de ST)",
        category: "Cardiología",
        cie10: "I21.0 - Infarto agudo del miocardio",
        cie11: "BA41.0",
        serviceUnit: "Unidad Coronaria / UCI",
        triageCode: "I",
        triageLevel: "Nivel I - Emergencia Inmediata",
        severity: "critical",
        baseHealth: 32.00,
        decayRate: 0.70,
        symptoms: ["Dolor retroesternal opresivo intenso", "Irradiación a mandíbula y brazo izquierdo", "Diaforesis fría profusa", "Disnea aguda"],
        description: "Oclusión trombótica aguda de arteria coronaria epicárdica con necrosis transmural.",
        standardTreatment: {
            name: "Protocolo Reperfusión Coronaria + Antiagregación Plaquetaria",
            medication: "Angioplastia primaria / Fibrinolisis + AAS 300mg + Clopidogrel + Heparina IV",
            containsAllergens: ["Aspirina", "AINEs"],
            resources: { antibiotics: 0, serums: 2, analgesics: 2, oxygen: 1, insulin: 0, doctor: 1, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Reperfusión con Antiagregación Libre de Aspirina (Clopidogrel + Ticagrelor)",
            medication: "Clopidogrel 600mg + Heparina IV + Morfina antálgica en alérgicos a AINEs",
            containsAllergens: [],
            resources: { antibiotics: 0, serums: 2, analgesics: 2, oxygen: 1, insulin: 0, doctor: 1, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Aspirina en megadosis a paciente con alergia a AINEs",
            consequence: "Broncoespasmo anafilactoide masivo que agrava la hipoxia miocárdica y provoca fibrilación ventricular."
        },
        reward: { funds: 1900.00, reputation: 14.00 }
    },
    {
        id: "crisis_asmatica",
        name: "Crisis Asmática Severa Aguda",
        category: "Neumología",
        cie10: "J45.0 - Asma con exacerbación aguda",
        cie11: "CA23.0",
        serviceUnit: "Medicina Interna y Respiratorio",
        triageCode: "II",
        triageLevel: "Nivel II - Urgencia Calificada",
        severity: "severe",
        baseHealth: 48.00,
        decayRate: 0.28,
        symptoms: ["Disnea sibilante de reposo", "Tiraje intercostal bilateral", "SpO2 88% aire ambiente", "Habla entrecortada"],
        description: "Broncoespasmo e inflamación traqueobronquial severa con atrapamiento aéreo.",
        standardTreatment: {
            name: "Nebulización con Salbutamol + Corticoide Sistémico IV + O2",
            medication: "Salbutamol 5mg neb c/20m + Hidrocortisona 200mg IV + O2 máscara",
            containsAllergens: [],
            resources: { antibiotics: 0, serums: 1, analgesics: 0, oxygen: 2, insulin: 0, doctor: 0, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Bromuro de Ipratropio + Sulfato de Magnesio IV + O2",
            medication: "Ipratropio nebulizado + MgSO4 2g IV en infusión + O2 cánula",
            containsAllergens: [],
            resources: { antibiotics: 0, serums: 1, analgesics: 0, oxygen: 2, insulin: 0, doctor: 0, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Betabloqueadores no selectivos (Propranolol)",
            consequence: "Bloqueo adrenérgico beta-2 total, paro respiratorio irreversible por broncoconstricción refleja."
        },
        reward: { funds: 850.00, reputation: 7.00 }
    },
    {
        id: "pielonefritis",
        name: "Pielonefritis Aguda Complicada / Sepsis Urinaria",
        category: "Nefrología e Infectología",
        cie10: "N10 - Nefritis tubulointersticial aguda",
        cie11: "GB50",
        serviceUnit: "Nefrología",
        triageCode: "II",
        triageLevel: "Nivel II - Urgencia Calificada",
        severity: "severe",
        baseHealth: 46.00,
        decayRate: 0.25,
        symptoms: ["Fiebre de 39.5°C con escalofríos", "Dolor en fosa lumbar (Giordano positivo)", "Disuria severa", "Náuseas"],
        description: "Infección bacteriana ascendente con bacteriemia y riesgo de absceso renal.",
        standardTreatment: {
            name: "Ceftriaxona IV 2g + Hidratación de Gran Volumen",
            medication: "Ceftriaxona 2g IV c/24h + Suero Salino 2000 cc/24h + Analgesia renal",
            containsAllergens: ["Penicilina", "Betalactámicos", "Cefalosporinas"],
            resources: { antibiotics: 2, serums: 2, analgesics: 1, oxygen: 0, insulin: 0, doctor: 0, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Gentamicina / Amikacina IV (Esquema seguro antialérgico)",
            medication: "Amikacina 15 mg/kg IV + Fluidoterapia salina intensa",
            containsAllergens: ["Aminoglucósidos"],
            resources: { antibiotics: 2, serums: 2, analgesics: 1, oxygen: 0, insulin: 0, doctor: 0, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Ampicilina a paciente con anafilaxia a Penicilina",
            consequence: "Shock anafiláctico fulminante superpuesto al cuadro infeccioso urinario."
        },
        reward: { funds: 1100.00, reputation: 8.00 }
    },
    {
        id: "cetoacidosis",
        name: "Cetoacidosis Diabética Severa Descompensada",
        category: "Endocrinología",
        cie10: "E10.1 - Diabetes tipo 1 con cetoacidosis",
        cie11: "5A11",
        serviceUnit: "Endocrinología y Metabólica",
        triageCode: "II",
        triageLevel: "Nivel II - Urgencia Calificada",
        severity: "severe",
        baseHealth: 50.00,
        decayRate: 0.22,
        symptoms: ["Respiración de Kussmaul", "Aliento cetósico a acetona", "Deshidratación profunda", "Hiperglucemia > 450 mg/dL"],
        description: "Déficit absoluto de insulina que activa lipólisis masiva y acidosis metabólica severa.",
        standardTreatment: {
            name: "Bomba de Insulina Rápida + Suero Salino + KCl",
            medication: "Insulina Cristalina 0.1 UI/kg/h + NaCl 0.9% 1000 cc/h + Cloruro de Potasio",
            containsAllergens: ["Insulina"],
            resources: { antibiotics: 0, serums: 2, analgesics: 0, oxygen: 1, insulin: 2, doctor: 1, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Insulina Rápida en Microdosis Horarias + Suero Polielectrolítico",
            medication: "Insulina análoga horaria + Monitoreo de kalemia estricto",
            containsAllergens: [],
            resources: { antibiotics: 0, serums: 2, analgesics: 0, oxygen: 1, insulin: 2, doctor: 1, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Sulfamidas hipoglucemiantes orales en alérgico a sulfas",
            consequence: "Shock anafiláctico y empeoramiento de cetonemia con hipotensión refractaria."
        },
        reward: { funds: 1400.00, reputation: 9.00 }
    },
    {
        id: "crisis_hta",
        name: "Crisis Hipertensiva tipo Emergencia con Angina Inestable",
        category: "Cardiología",
        cie10: "I10 / I20.0 - Hipertensión y angina inestable",
        cie11: "BA00",
        serviceUnit: "UCI y Cuidados Críticos",
        triageCode: "I",
        triageLevel: "Nivel I - Emergencia Crítica",
        severity: "severe",
        baseHealth: 45.00,
        decayRate: 0.35,
        symptoms: ["Cefalea occipital severa", "Opresión precordial", "Visión borrosa", "Cifras de 195/115 mmHg"],
        description: "Elevación crítica de tensión arterial con daño miocárdico y riesgo vascular inminente.",
        standardTreatment: {
            name: "Labetalol IV Titulado + Nitroglicerina Sublingual",
            medication: "Labetalol 20mg bolo IV + NTG 0.6mg sl + Monitorización continua",
            containsAllergens: [],
            resources: { antibiotics: 0, serums: 2, analgesics: 1, oxygen: 1, insulin: 0, doctor: 1, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Nitroprusiato de Sodio IV Titulado",
            medication: "Nitroprusiato 0.5-2 mcg/kg/min en bomba fotosensible",
            containsAllergens: [],
            resources: { antibiotics: 0, serums: 2, analgesics: 1, oxygen: 1, insulin: 0, doctor: 1, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Uso de vías o sondas de látex en paciente alérgico a látex",
            consequence: "Urticaria gigante, angioedema de cuello y colapso circulatorio grave."
        },
        reward: { funds: 1400.00, reputation: 9.00 }
    },
    {
        id: "colecistitis",
        name: "Colecistitis Aguda Litiásica con Piocolecisto",
        category: "Cirugía General",
        cie10: "K80.0 - Colecistitis aguda",
        cie11: "DC11.0",
        serviceUnit: "Cirugía General",
        triageCode: "I",
        triageLevel: "Nivel I - Crítico Quirúrgico",
        severity: "critical",
        baseHealth: 36.00,
        decayRate: 0.58,
        symptoms: ["Dolor agudo en hipocondrio derecho (Murphy +)", "Ictericia leve", "Fiebre 38.7°C", "Defensa epigástrica"],
        description: "Obstrucción del conducto cístico con proliferación bacteriana y distensión vesicular supurada.",
        standardTreatment: {
            name: "Colecistectomía Laparoscópica + Ceftriaxona/Metronidazol",
            medication: "Cirugía de urgencia + Ceftriaxona 2g IV + Metronidazol 500mg IV + Analgesia",
            containsAllergens: ["Penicilina", "Cefalosporinas"],
            resources: { antibiotics: 2, serums: 2, analgesics: 2, oxygen: 0, insulin: 0, doctor: 1, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Cirugía + Levofloxacino / Metronidazol (Sin betalactámicos)",
            medication: "Colecistectomía + Levofloxacino 750mg IV + Metronidazol 500mg IV",
            containsAllergens: ["Quinolonas"],
            resources: { antibiotics: 2, serums: 2, analgesics: 2, oxygen: 0, insulin: 0, doctor: 1, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Administración de betalactámicos en alérgico a penicilina",
            consequence: "Shock anafiláctico intraoperatorio con broncoespasmo severo e inestabilidad hemodinámica."
        },
        reward: { funds: 1550.00, reputation: 11.00 }
    },
    {
        id: "tep",
        name: "Tromboembolismo Pulmonar Agudo (TEP)",
        category: "Neumología / Vascular",
        cie10: "I26.9 - Embolia pulmonar",
        cie11: "BD00",
        serviceUnit: "UCI y Cuidados Críticos",
        triageCode: "I",
        triageLevel: "Nivel I - Emergencia Crítica",
        severity: "critical",
        baseHealth: 30.00,
        decayRate: 0.68,
        symptoms: ["Disnea súbita e inexplicable", "Dolor torácico pleurítico", "Taquicardia severa > 120 lpm", "Hemoptisis leve"],
        description: "Oclusión embólica del lecho vascular pulmonar con sobrecarga ventricular derecha aguda.",
        standardTreatment: {
            name: "Anticoagulación Inmediata con Heparina de Bajo Peso Molecular (Enoxaparina)",
            medication: "Enoxaparina 1 mg/kg sc cada 12h + Oxigenoterapia alto flujo + Monitorización",
            containsAllergens: ["Heparina"],
            resources: { antibiotics: 0, serums: 2, analgesics: 1, oxygen: 2, insulin: 0, doctor: 1, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Inhibidores Directos del Factor Xa (Fondaparinux / Rivaroxabán)",
            medication: "Fondaparinux 7.5mg sc/24h + Soporte ventilatorio",
            containsAllergens: [],
            resources: { antibiotics: 0, serums: 2, analgesics: 1, oxygen: 2, insulin: 0, doctor: 1, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Retraso terapéutico o heparina en trombocitopenia inducida por heparina (HIT)",
            consequence: "Cor pulmonale agudo fulminante con disociación electromecánica y paro cardíaco."
        },
        reward: { funds: 1800.00, reputation: 13.00 }
    },
    {
        id: "shock_anafilactico",
        name: "Shock Anafiláctico Severo",
        category: "Inmunología y Alergología",
        cie10: "T78.2 - Choque anafiláctico no especificado",
        cie11: "4A84",
        serviceUnit: "Urgencias y Reanimación",
        triageCode: "I",
        triageLevel: "Nivel I - Paro Inminente",
        severity: "critical",
        baseHealth: 22.00,
        decayRate: 0.85,
        symptoms: ["Estridor laríngeo y edema de glotis", "Hipotensión severa (TA 65/35)", "Urticaria y angioedema", "Colapso circulatorio"],
        description: "Reacción alérgica mediada por IgE de evolución fulminante con vasodilatación y asfixia.",
        standardTreatment: {
            name: "Adrenalina Intramuscular Inmediata + Fluidos + Corticoides",
            medication: "Adrenalina 0.5mg IM en vasto lateral + Hidrocortisona 300mg IV + Suero Fisiológico a chorro + O2",
            containsAllergens: [],
            resources: { antibiotics: 0, serums: 3, analgesics: 0, oxygen: 2, insulin: 0, doctor: 1, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Adrenalina IM Repetida + Difenhidramina IV + Metilprednisolona",
            medication: "Adrenalina cada 5 minutos + Antihistamínico H1 y H2 + Cargas de 1000cc",
            containsAllergens: [],
            resources: { antibiotics: 0, serums: 3, analgesics: 0, oxygen: 2, insulin: 0, doctor: 1, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Administrar solo antihistamínicos orales sin adrenalina",
            consequence: "Asfixia por oclusión mecánica completa de glotis y colapso cardiopulmonar en menos de 90 segundos."
        },
        reward: { funds: 1750.00, reputation: 15.00 }
    },
    {
        id: "eap_icc",
        name: "Insuficiencia Cardíaca Descompensada (Edema Agudo de Pulmón)",
        category: "Cardiología",
        cie10: "I50.1 - Insuficiencia ventricular izquierda",
        cie11: "BD11.0",
        serviceUnit: "Cardiología y UCI",
        triageCode: "I",
        triageLevel: "Nivel I - Emergencia Respiratoria",
        severity: "critical",
        baseHealth: 34.00,
        decayRate: 0.60,
        symptoms: ["Ortopnea extrema", "Expectoración rosada asalmonada", "Estertores húmedos en marea ascendente", "Cianosis periférica"],
        description: "Aumento brusco de presiones de llenado capilar pulmonar con trasudado masivo alveolar.",
        standardTreatment: {
            name: "Furosemida IV a Dosis Altas + Nitroglicerina + Oxígeno CPAP",
            medication: "Furosemida 80mg bolo IV + NTG infusión titulada + Ventilación no invasiva",
            containsAllergens: ["Furosemida", "Sulfas"],
            resources: { antibiotics: 0, serums: 1, analgesics: 1, oxygen: 2, insulin: 0, doctor: 1, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Ácido Etacrínico (Diurético sin sulfamida) + Nitroglicerina + CPAP",
            medication: "Ácido etacrínico 50mg IV en pacientes alérgicos a sulfas/furosemida + NTG + O2",
            containsAllergens: [],
            resources: { antibiotics: 0, serums: 1, analgesics: 1, oxygen: 2, insulin: 0, doctor: 1, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Carga rápida de suero fisiológico o furosemida en alérgico a sulfamidas",
            consequence: "Ahogamiento alveolar irreversible por sobrecarga hídrica masiva o anafilaxia grave."
        },
        reward: { funds: 1600.00, reputation: 11.00 }
    },
    {
        id: "acv_isquemico",
        name: "Accidente Cerebrovascular Isquémico Agudo (ACV)",
        category: "Neurología",
        cie10: "I63.9 - Infarto cerebral no especificado",
        cie11: "8B11",
        serviceUnit: "Neurología y Unidad de Stroke",
        triageCode: "I",
        triageLevel: "Nivel I - Código Ictus",
        severity: "critical",
        baseHealth: 35.00,
        decayRate: 0.55,
        symptoms: ["Hemiplejía fasciobraquiocrural súbita", "Afasia global", "Desviación de la comisura bucal", "Hemianopsia"],
        description: "Isquemia focal encefálica en ventana terapéutica con penumbra isquémica en riesgo.",
        standardTreatment: {
            name: "Trombólisis Intravenosa con Alteplasa (r-tPA) + Neuroprotección",
            medication: "Alteplasa 0.9 mg/kg en 60 min + Control estricto de PA < 185/110",
            containsAllergens: [],
            resources: { antibiotics: 0, serums: 2, analgesics: 0, oxygen: 1, insulin: 0, doctor: 1, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Trombectomía Mecánica Endovascular + Antiagregación",
            medication: "Cateterismo neurovascular + Heparinización controlada",
            containsAllergens: [],
            resources: { antibiotics: 0, serums: 2, analgesics: 0, oxygen: 1, insulin: 0, doctor: 1, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Antihipertensivos agresivos que derrumben la presión arterial",
            consequence: "Pérdida inmediata de la penumbra isquémica por hipoperfusión cerebral con infarto masivo irreversible."
        },
        reward: { funds: 1850.00, reputation: 13.00 }
    },
    {
        id: "hda_ulcera",
        name: "Hemorragia Digestiva Alta por Úlcera Péptica Sangrante",
        category: "Gastroenterología",
        cie10: "K25.0 - Úlcera gástrica aguda con hemorragia",
        cie11: "DA60",
        serviceUnit: "Gastroenterología y Endoscopía",
        triageCode: "I",
        triageLevel: "Nivel I - Urgencia Hemorrágica",
        severity: "critical",
        baseHealth: 33.00,
        decayRate: 0.62,
        symptoms: ["Hematemesis en posos de café", "Melena fétida abundante", "Hipotensión ortostática", "Palidez cutánea extrema"],
        description: "Erosión de vaso arterial en lecho ulceroso gástrico con shock hipovolémico.",
        standardTreatment: {
            name: "Endoscopía Terapéutica con Clip + Omeprazol IV en Bomba Continua",
            medication: "Clip metálico endoscópico + Omeprazol 80mg bolo y 8mg/h + Expansión volémica",
            containsAllergens: ["Omeprazol"],
            resources: { antibiotics: 0, serums: 3, analgesics: 1, oxygen: 0, insulin: 0, doctor: 1, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Escleroterapia Endoscópica con Adrenalina + Pantoprazol IV",
            medication: "Adrenalina 1:10.000 local + Pantoprazol 80mg IV + Transfusión globular",
            containsAllergens: [],
            resources: { antibiotics: 0, serums: 3, analgesics: 1, oxygen: 0, insulin: 0, doctor: 1, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Administración de AINEs o anticoagulantes en hemorragia activa",
            consequence: "Exanguinación gástrica masiva incontrolable, paro hipovolémico en asistolia."
        },
        reward: { funds: 1700.00, reputation: 12.00 }
    },
    {
        id: "meningitis",
        name: "Meningitis Bacteriana Aguda",
        category: "Infectología y Neurología",
        cie10: "G00.9 - Meningitis bacteriana",
        cie11: "1D01.0",
        serviceUnit: "Infectología y Cuidados Críticos",
        triageCode: "I",
        triageLevel: "Nivel I - Crítico Infeccioso",
        severity: "critical",
        baseHealth: 31.00,
        decayRate: 0.65,
        symptoms: ["Fiebre de 40.0°C", "Rigidez de nuca franca (Kernig y Brudzinski +)", "Cefalea holocraneana insoportable", "Fotofobia y vómitos en chorro"],
        description: "Infección purulenta de leptomeninges y espacio subaracnoideo por Neisseria meningitidis / S. pneumoniae.",
        standardTreatment: {
            name: "Ceftriaxona IV 4g/día + Ampicilina + Dexametasona IV",
            medication: "Ceftriaxona 2g c/12h + Dexametasona 10mg IV antes de antibiótico + Aislamiento en gotas",
            containsAllergens: ["Penicilina", "Betalactámicos", "Cefalosporinas"],
            resources: { antibiotics: 2, serums: 2, analgesics: 1, oxygen: 0, insulin: 0, doctor: 1, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Vancomicina IV + Meropenem / Cloranfenicol (Sin penicilinas clásicas)",
            medication: "Vancomicina 20mg/kg c/12h + Dexametasona IV + Suero fisiológico",
            containsAllergens: ["Glicopéptidos"],
            resources: { antibiotics: 2, serums: 2, analgesics: 1, oxygen: 0, insulin: 0, doctor: 1, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Penicilina directa a paciente alérgico a betalactámicos",
            consequence: "Choque anafiláctico con edema cerebral fulminante y enclavamiento amigdalino."
        },
        reward: { funds: 1800.00, reputation: 14.00 }
    },
    {
        id: "pancreatitis",
        name: "Pancreatitis Aguda Biliar Grave",
        category: "Gastroenterología",
        cie10: "K85.1 - Pancreatitis aguda biliar",
        cie11: "DC31",
        serviceUnit: "Gastroenterología y Cuidados Intensivos",
        triageCode: "II",
        triageLevel: "Nivel II - Urgencia Mayor",
        severity: "severe",
        baseHealth: 44.00,
        decayRate: 0.32,
        symptoms: ["Dolor epigástrico 'en cinturón' transfictivo", "Lipasa sérica > 1500 U/L", "Íleo paralítico reflejo", "Fiebre y taquicardia"],
        description: "Autodigestión enzimática pancreática activada por litiasis coledociana impactada.",
        standardTreatment: {
            name: "Fluidoterapia Agresiva con Ringer Lactato + Analgesia Mayor IV",
            medication: "Ringer Lactato 250-500 ml/h + Tramadol / Fentanilo IV + Ayuno digestivo inicial",
            containsAllergens: [],
            resources: { antibiotics: 1, serums: 3, analgesics: 2, oxygen: 0, insulin: 0, doctor: 1, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Suero Fisiológico Titulado + Buprenorfina + Protección Gástrica",
            medication: "Solución Salina 0.9% guiada por diuresis + Analgesia opioide",
            containsAllergens: [],
            resources: { antibiotics: 1, serums: 3, analgesics: 2, oxygen: 0, insulin: 0, doctor: 1, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Morfina pura espasmogénica del esfínter de Oddi",
            consequence: "Empeoramiento de la presión en conducto pancreático, necrosis retroperitoneal y SIRS masivo."
        },
        reward: { funds: 1500.00, reputation: 10.00 }
    },
    {
        id: "gastroenteritis",
        name: "Gastroenteritis Aguda Infecciosa con Deshidratación Severa",
        category: "Pediatría y Cuidados Entéricos",
        cie10: "A09 - Diarrea y gastroenteritis infecciosa",
        cie11: "1A03",
        serviceUnit: "Pediatría",
        triageCode: "III",
        triageLevel: "Nivel III - Urgencia",
        severity: "moderate",
        baseHealth: 58.00,
        decayRate: 0.12,
        symptoms: ["Vómitos continuos", "Sequedad de mucosas", "Letargo", "Ojos hundidos"],
        description: "Infección entérica bacteriana o viral con pérdidas líquidas de gran cuantía.",
        standardTreatment: {
            name: "Solución Hartmann IV + Ondansetrón Pediátrico",
            medication: "Hartmann 20ml/kg en 1 hora + Ondansetrón 0.15 mg/kg IV",
            containsAllergens: [],
            resources: { antibiotics: 1, serums: 3, analgesics: 0, oxygen: 0, insulin: 0, doctor: 0, nurse: 1 }
        },
        alternativeTreatment: {
            name: "Suero Fisiológico al 0.9% + Reposición de Electrolitos Orales",
            medication: "Solución isotónica salina + Sales de rehidratación",
            containsAllergens: [],
            resources: { antibiotics: 1, serums: 3, analgesics: 0, oxygen: 0, insulin: 0, doctor: 0, nurse: 1 }
        },
        contraindicatedTreatment: {
            name: "Loperamida o anticolinérgicos en pediatría",
            consequence: "Megacolon tóxico, translocación bacteriana y sepsis entérica aguda."
        },
        reward: { funds: 850.00, reputation: 6.00 }
    }
];

window.INITIAL_GAME_DATA = INITIAL_GAME_DATA;
window.CLINICAL_DISEASES_CATALOG = CLINICAL_DISEASES_CATALOG;
