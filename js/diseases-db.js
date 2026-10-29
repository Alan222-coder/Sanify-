// js/diseases-db.js - Base de Datos Global de Enfermedades con Codificación CIE-11, CIE-10 y SNOMED-CT
// Diseñada para el Razonamiento Clínico a Tres Niveles: Sindromático, Paraclínico y Temporal

const GLOBAL_DISEASES_DB = [
    // ==========================================
    // 1. NEUMOLOGÍA Y APARATO RESPIRATORIO
    // ==========================================
    {
        id: "pneumonia_bac",
        name: "Neumonía Bacteriana Adquirida en la Comunidad (NAC)",
        cie11: "CA40.0",
        cie10: "J18.9",
        snomedCt: "385093006 - Community acquired pneumonia",
        category: "Neumología",
        syndromes: ["Síndrome de Condensación Pulmonar", "Insuficiencia Respiratoria Aguda", "Síndrome Febril Agudo"],
        severity: "Grave (Prioridad II)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Agudo (1-24 horas)",
            progressionRate: "Rápido si no recibe antibiótico",
            complicationWindow: "Riesgo de shock séptico o derrame paraneumónico en 24-48h"
        },
        oxygenProfile: {
            expectedSpo2Range: [86.0, 92.0],
            hypoxiaRisk: "Alto",
            responseToOxygen: "Buena respuesta inicial a cánula nasal (2-4 L/min) con mejora de SpO2 > 94%"
        },
        physicalSigns: {
            eyes: "Normales o inyección conjuntival leve por fiebre",
            skin: "Palidez cutánea, diaforesis profusa, cianosis acral si SpO2 < 88%",
            neurological: "Lúcido o confusión leve en ancianos (Glasgow 14-15)",
            respiratory: "Taquipnea (>24 rpm), crepitantes focales en base, matidez a la percusión",
            cardiovascular: "Taquicardia sinusal reactiva (90-115 lpm)"
        },
        vitalsProfile: {
            bpmRange: [90, 118],
            bpSysRange: [110, 145],
            bpDiaRange: [70, 90],
            tempRange: [38.5, 40.0],
            respRateRange: [24, 32]
        },
        labProfile: {
            leukocytes: [14000, 22000],
            neutrophilsPercent: [80, 92],
            hemoglobin: [12.0, 15.5],
            platelets: [180000, 380000],
            glucose: [110, 160],
            creatinine: [0.9, 1.4],
            potassium: [3.8, 4.8],
            sodium: [133, 142],
            crp: [80, 220],
            lactate: [1.6, 2.8],
            arterialPh: [7.34, 7.42],
            specificBiomarkers: "Procalcitonina > 0.5 mcg/L (infección bacteriana alta). Hemocultivos positivos en 20%."
        },
        goldStandardDiagnostic: "Radiografía de tórax con infiltrado alveolar lobar / TAC de tórax de alta resolución",
        standardTreatment: "Ceftriaxona 2g IV/24h + Claritromicina 500mg IV/12h + Oxigenoterapia titulada meta SpO2 93-96%",
        description: "Infección aguda del parénquima pulmonar por patógenos bacterianos (ej. Streptococcus pneumoniae), que produce exudado alveolar, hipoxemia por efecto shunt y respuesta inflamatoria sistémica."
    },
    {
        id: "pulmonary_embolism",
        name: "Tromboembolismo Pulmonar Agudo (TEP)",
        cie11: "BD00",
        cie10: "I26.9",
        snomedCt: "59282003 - Pulmonary embolism",
        category: "Neumología / Vascular",
        syndromes: ["Insuficiencia Respiratoria Aguda", "Dolor Torácico Pleurítico", "Síndrome de Hipoperfusión"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Hiperagudo (< 1 hora)",
            progressionRate: "Fulminante / Crítico",
            complicationWindow: "Paro cardíaco por cor pulmonale agudo o disfunción ventricular derecha en minutos"
        },
        oxygenProfile: {
            expectedSpo2Range: [80.0, 89.0],
            hypoxiaRisk: "Crítico",
            responseToOxygen: "Refractaria o respuesta parcial con máscara reservorio (hipoxemia por espacio muerto)"
        },
        physicalSigns: {
            eyes: "Normales con midriasis refleja por descarga adrenérgica",
            skin: "Palidez marcada, sudoración fría, cianosis labial, frialdad distal",
            neurological: "Síncope o ansiedad extrema / sensación de muerte inminente",
            respiratory: "Taquipnea severa (>30 rpm), disnea súbita sin ruidos adventicios mayores",
            cardiovascular: "Taquicardia marcada (>120 lpm), ingurgitación yugular a 45°, hipotensión en TEP masivo"
        },
        vitalsProfile: {
            bpmRange: [110, 140],
            bpSysRange: [80, 105],
            bpDiaRange: [50, 70],
            tempRange: [36.4, 37.5],
            respRateRange: [28, 38]
        },
        labProfile: {
            leukocytes: [9000, 15000],
            neutrophilsPercent: [68, 80],
            hemoglobin: [12.0, 15.0],
            platelets: [160000, 320000],
            glucose: [100, 150],
            creatinine: [1.0, 1.8],
            potassium: [3.6, 4.6],
            sodium: [136, 144],
            crp: [15, 60],
            lactate: [2.5, 5.2],
            arterialPh: [7.45, 7.55],
            specificBiomarkers: "Dímero D masivamente elevado (> 2500 ng/mL FEU). Troponina I positiva por sobrecarga del ventrículo derecho."
        },
        goldStandardDiagnostic: "Angiotomografía Computarizada de Arterias Pulmonares (Angio-TAC)",
        standardTreatment: "Anticoagulación inmediata con Heparina de Bajo Peso Molecular / Fibrinolisis sistémica si hay hipotensión (Alteplasa 100 mg)",
        description: "Oclusión mecánica súbita del lecho arterial pulmonar por un émbolo trombótico originado típicamente en miembros inferiores, provocando aumento agudo de postcarga de VD e hipoxemia severa."
    },
    {
        id: "copd_exacerbation",
        name: "Enfermedad Pulmonar Obstructiva Crónica (EPOC) Reagudizada",
        cie11: "CA22.0",
        cie10: "J44.1",
        snomedCt: "195951007 - Acute exacerbation of chronic obstructive bronchitis",
        category: "Neumología",
        syndromes: ["Insuficiencia Respiratoria Hipercápnica", "Síndrome Broncoobstructivo"],
        severity: "Grave (Prioridad II)",
        isCanNotMiss: false,
        temporalProfile: {
            onsetSpeed: "Subagudo (1-3 días)",
            progressionRate: "Moderado a rápido",
            complicationWindow: "Acidosis respiratoria severa y narcosis por CO2 en 12-24h"
        },
        oxygenProfile: {
            expectedSpo2Range: [82.0, 89.0],
            hypoxiaRisk: "Crítico",
            responseToOxygen: "Sensible: titular meta SpO2 88-92% para evitar abolición del estímulo hipóxico y narcosis"
        },
        physicalSigns: {
            eyes: "Inyección conjuntival por hipercapnia ('ojos rojos congestivos'), quemosis",
            skin: "Plétora facial, cianosis periférica, piel caliente y sudorosa (vasodilatación por CO2)",
            neurological: "Asterixis (flapping tremor), somnolencia, desorientación si PaCO2 > 65 mmHg",
            respiratory: "Espiración muy prolongada, sibilancias espiratorias difusas, tiraje intercostal",
            cardiovascular: "Taquicardia (100-115 lpm), signos de cor pulmonale"
        },
        vitalsProfile: {
            bpmRange: [98, 122],
            bpSysRange: [130, 165],
            bpDiaRange: [80, 95],
            tempRange: [37.2, 38.6],
            respRateRange: [26, 34]
        },
        labProfile: {
            leukocytes: [11000, 18000],
            neutrophilsPercent: [75, 88],
            hemoglobin: [15.5, 18.5],
            platelets: [200000, 360000],
            glucose: [110, 170],
            creatinine: [0.9, 1.3],
            potassium: [3.7, 4.9],
            sodium: [135, 143],
            crp: [45, 140],
            lactate: [1.3, 2.2],
            arterialPh: [7.28, 7.35],
            specificBiomarkers: "Gasometría: PaCO2 elevada (55-75 mmHg), HCO3 elevado crónico compensador (> 30 mEq/L)."
        },
        goldStandardDiagnostic: "Gasometría arterial + Radiografía de tórax (hiperinsuflación y aplanamiento diafragmático)",
        standardTreatment: "Broncodilatadores inhalados (Salbutamol + Ipratropio) + Corticoide sistémico (Metilprednisolona) + Ventilación Mecánica No Invasiva (BiPAP)",
        description: "Empeoramiento agudo de los síntomas respiratorios en paciente con limitación crónica del flujo aéreo, desencadenado por infección traqueobronquial o polución ambiental."
    },
    {
        id: "severe_acute_asthma",
        name: "Crisis Asmática Severa / Estatus Asmático",
        cie11: "CA23.0",
        cie10: "J45.901",
        snomedCt: "370221004 - Severe acute asthma",
        category: "Neumología",
        syndromes: ["Insuficiencia Respiratoria Aguda", "Síndrome Broncoobstructivo Severo"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Agudo (1-6 horas)",
            progressionRate: "Rápido / Potencialmente fatal",
            complicationWindow: "Tórax silente, paro respiratorio por fatiga muscular en < 2 horas"
        },
        oxygenProfile: {
            expectedSpo2Range: [85.0, 91.0],
            hypoxiaRisk: "Crítico",
            responseToOxygen: "Requiere alto flujo; si SpO2 cae < 90% indica agotamiento ventilatorio"
        },
        physicalSigns: {
            eyes: "Normales con expresión de pánico y angustia extrema",
            skin: "Diaforesis profusa, palidez generalizada, cianosis ungueal",
            neurological: "Incapacidad para pronunciar oraciones completas, letargia si hay hipercapnia",
            respiratory: "Tórax hiperinsuflado, sibilancias inspiratorias y espiratorias audibles a distancia o silencio auscultatorio",
            cardiovascular: "Taquicardia severa (>125 lpm), pulso paradójico > 15 mmHg"
        },
        vitalsProfile: {
            bpmRange: [115, 145],
            bpSysRange: [125, 155],
            bpDiaRange: [75, 95],
            tempRange: [36.5, 37.6],
            respRateRange: [30, 42]
        },
        labProfile: {
            leukocytes: [9000, 16000],
            neutrophilsPercent: [65, 80],
            hemoglobin: [13.0, 16.0],
            platelets: [220000, 390000],
            glucose: [110, 160],
            creatinine: [0.8, 1.2],
            potassium: [3.3, 4.3],
            sodium: [137, 144],
            crp: [10, 40],
            lactate: [1.8, 3.4],
            arterialPh: [7.32, 7.46],
            specificBiomarkers: "Eosinofilia en sangre periférica. PaCO2 normal o elevada es signo de paro respiratorio inminente."
        },
        goldStandardDiagnostic: "Espirometría / Flujometría PEF < 50% del predicho + Gasometría arterial",
        standardTreatment: "Nebulización continua con Salbutamol + Bromuro de Ipratropio + Sulfato de Magnesio 2g IV + Hidrocortisona 200mg IV",
        description: "Broncoespasmo extremo y edema de la vía aérea en paciente hiperreactivo, con riesgo de fatiga diafragmática y paro respiratorio si no se rompe el espasmo de inmediato."
    },

    // ==========================================
    // 2. INFECTOLOGÍA Y MEDICINA TROPICAL / GLOBAL
    // ==========================================
    {
        id: "dengue_severe",
        name: "Dengue con Signos de Alarma / Dengue Grave",
        cie11: "1D20.1",
        cie10: "A91",
        snomedCt: "38362002 - Dengue hemorrhagic fever",
        category: "Infectología Tropical",
        syndromes: ["Síndrome Febril Hemorrágico", "Síndrome de Extravasación Plasmática", "Trombocitopenia"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Agudo (3-5 días de fiebre, choque en día 5-7)",
            progressionRate: "Crítico en fase de defervescencia",
            complicationWindow: "Choque hipovolémico por fuga capilar masiva entre 24 y 48h de caída de fiebre"
        },
        oxygenProfile: {
            expectedSpo2Range: [92.0, 96.0],
            hypoxiaRisk: "Moderado",
            responseToOxygen: "Buena, salvo que desarrolle derrame pleural masivo o distrés respiratorio"
        },
        physicalSigns: {
            eyes: "Ojos rojos (inyección conjuntival bilateral muy dolorosa) con dolor retroocular intenso",
            skin: "Manchas en la piel: exantema maculopapular confluente 'islas blancas en mar rojo', petequias en miembros, torniquete (+)",
            neurological: "Letargo, somnolencia marcada o irritabilidad",
            respiratory: "Taquipnea por compensación de acidosis o derrame pleural derecho",
            cardiovascular: "Presión de pulso estrecha (diferencial < 20 mmHg), pulso filiforme, extremidades frías"
        },
        vitalsProfile: {
            bpmRange: [105, 135],
            bpSysRange: [85, 105],
            bpDiaRange: [65, 80],
            tempRange: [38.2, 40.2],
            respRateRange: [22, 30]
        },
        labProfile: {
            leukocytes: [2200, 4800],
            neutrophilsPercent: [45, 60],
            hemoglobin: [14.5, 17.8],
            platelets: [25000, 75000],
            glucose: [90, 135],
            creatinine: [0.9, 1.6],
            potassium: [3.4, 4.4],
            sodium: [130, 137],
            crp: [20, 65],
            lactate: [2.8, 5.0],
            arterialPh: [7.30, 7.38],
            specificBiomarkers: "Antígeno NS1 positivo (días 1-5), IgM Dengue ELISA (+). Transaminasas ALT/AST elevadas (>3x normal)."
        },
        goldStandardDiagnostic: "RT-PCR para virus Dengue / Antígeno NS1 + Hemograma seriado con Hematocrito y Plaquetas",
        standardTreatment: "Reanimación con Cristaloides isotónicos titulados (Ringer Lactato 10-20 ml/kg/h) con monitoreo estricto de diuresis",
        description: "Infección viral transmitida por mosquito Aedes aegypti que desencadena respuesta inmunológica aberrante, produciendo fuga plasmática vascular, hemoconcentración, sangrado mucocutáneo y colapso circulatorio."
    },
    {
        id: "meningococcemia",
        name: "Meningococcemia Aguda / Púrpura Fulminante",
        cie11: "1C11.1",
        cie10: "A39.2",
        snomedCt: "23511006 - Meningococcal septicemia",
        category: "Infectología",
        syndromes: ["Shock Séptico", "Síndrome Purpúrico Petequial", "Falla Multiorgánica Fulminante"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Hiperagudo (horas de evolución)",
            progressionRate: "Fulminante / Máxima letalidad",
            complicationWindow: "Choque refractario y necrosis hemorrágica suprarrenal (Waterhouse-Friderichsen) en 6-12 horas"
        },
        oxygenProfile: {
            expectedSpo2Range: [88.0, 94.0],
            hypoxiaRisk: "Crítico",
            responseToOxygen: "Requiere intubación orotraqueal temprana y ventilación mecánica por acidosis metabólica extrema"
        },
        physicalSigns: {
            eyes: "Ojos rojos con petequias conjuntivales extensas y hemorragia subconjuntival",
            skin: "Manchas en la piel: erupción petequial que progresa en minutos a placas purpúricas estrelladas no blanqueables",
            neurological: "Deterioro rápido del sensorio (Glasgow de 15 a 8 en pocas horas), rigidez nucal variable",
            respiratory: "Respiración acidótica de Kussmaul rápida y profunda",
            cardiovascular: "Hipotensión refractaria, taquicardia extrema (>130 lpm), livedo reticularis generalizado"
        },
        vitalsProfile: {
            bpmRange: [125, 160],
            bpSysRange: [65, 85],
            bpDiaRange: [35, 55],
            tempRange: [39.0, 41.0],
            respRateRange: [28, 40]
        },
        labProfile: {
            leukocytes: [18000, 35000],
            neutrophilsPercent: [85, 96],
            hemoglobin: [10.5, 13.5],
            platelets: [15000, 60000],
            glucose: [65, 120],
            creatinine: [2.0, 4.2],
            potassium: [5.2, 6.8],
            sodium: [128, 136],
            crp: [180, 350],
            lactate: [5.5, 12.0],
            arterialPh: [7.10, 7.25],
            specificBiomarkers: "Dímero D > 10000 ng/mL, Fibrinógeno < 100 mg/dL (CID franca). Diplococos gramnegativos en frotis de raspado de petequias."
        },
        goldStandardDiagnostic: "Hemocultivo / PCR en sangre para Neisseria meningitidis / Punción Lumbar (si no hay coagulopatía extrema)",
        standardTreatment: "Ceftriaxona 2g IV cada 12h de inmediato (sin esperar cultivos) + Noradrenalina + Hidrocortisona en shock refractario",
        description: "Bacteriemia fulminante por Neisseria meningitidis caracterizada por endotoxemia masiva, daño endotelial difuso, trombosis microvascular, necrosis cutánea y colapso hemodinámico letal."
    },
    {
        id: "measles_sarampion",
        name: "Sarampión Clásico con Complicaciones Respiratorias",
        cie11: "1F03",
        cie10: "B05.9",
        snomedCt: "14189004 - Measles",
        category: "Infectología / Pediatría",
        syndromes: ["Síndrome Exantemático Febril", "Triple Catarro (Oculonasotraqueal)"],
        severity: "Grave (Prioridad II)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Subagudo (pródromo catarral de 3-4 días, luego exantema)",
            progressionRate: "Moderado a rápido",
            complicationWindow: "Neumonía bacteriana secundaria o encefalitis postinfecciosa en días 5-8"
        },
        oxygenProfile: {
            expectedSpo2Range: [91.0, 95.0],
            hypoxiaRisk: "Moderado a Alto",
            responseToOxygen: "Responde a O2 suplementario si hay compromiso bronquial o neumónico"
        },
        physicalSigns: {
            eyes: "Ojos rojos (conjuntivitis bilateral severa) con fotofobia intensa, lagrimeo y edema palpebral",
            skin: "Manchas en la piel: exantema maculopapular eritematoso retroauricular que desciende centrífugamente a cara, tronco y extremidades",
            mucosas: "Manchas de Koplik: puntos blancos azulados con halo eritematoso en mucosa yugal frente a segundos molares",
            neurological: "Irritabilidad, decaimiento marcado, letargia si hay encefalomielitis",
            respiratory: "Tos seca perruna traqueal, coriza nasal seropurulenta, tiraje leve"
        },
        vitalsProfile: {
            bpmRange: [100, 130],
            bpSysRange: [95, 115],
            bpDiaRange: [60, 75],
            tempRange: [39.0, 40.5],
            respRateRange: [22, 32]
        },
        labProfile: {
            leukocytes: [3000, 6500],
            neutrophilsPercent: [40, 55],
            hemoglobin: [11.5, 13.5],
            platelets: [120000, 220000],
            glucose: [85, 125],
            creatinine: [0.6, 1.0],
            potassium: [3.8, 4.6],
            sodium: [134, 141],
            crp: [35, 95],
            lactate: [1.2, 2.2],
            arterialPh: [7.36, 7.43],
            specificBiomarkers: "Serología IgM específica anti-sarampión positiva / RT-PCR en hisopado nasofaríngeo."
        },
        goldStandardDiagnostic: "Detección de ARN viral por RT-PCR / Serología IgM específica anti-sarampión",
        standardTreatment: "Aislamiento aéreo estricto + Vitamina A (200.000 UI) + Soporte hidroelectrolítico y antipirético",
        description: "Infección viral de alta transmisibilidad por Morbillivirus caracterizada por la tríada clásica de coriza, conjuntivitis y tos (triple catarro), manchas patognomónicas de Koplik y exantema confluente."
    },
    {
        id: "malaria_falciparum",
        name: "Malaria Grave / Paludismo por Plasmodium falciparum",
        cie11: "1F40",
        cie10: "B50.9",
        snomedCt: "24831006 - Malignant tertian malaria",
        category: "Infectología Tropical",
        syndromes: ["Síndrome Febril Periódico", "Anemia Hemolítica Aguda", "Malaria Cerebral"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Agudo (días de incubación tras picadura en zona endémica)",
            progressionRate: "Rápido hacia disfunción multiorgánica",
            complicationWindow: "Coma profundo, convulsiones o acidosis láctica mortal en 12-24h"
        },
        oxygenProfile: {
            expectedSpo2Range: [89.0, 94.0],
            hypoxiaRisk: "Alto",
            responseToOxygen: "Parcial debido a secuestro microvascular pulmonar y anemia profunda"
        },
        physicalSigns: {
            eyes: "Ojos con escleras ictéricas (ictericia flavínica) y palidez conjuntival extrema por hemólisis",
            skin: "Manchas cutáneas por sudoración masiva, palidez cérea, ictericia cutánea",
            neurological: "Malaria cerebral: confusión, crisis convulsivas tónico-clónicas, coma (Glasgow < 9)",
            respiratory: "Respiración profunda por acidosis láctica, riesgo de edema agudo de pulmón no cardiogénico",
            cardiovascular: "Hipotensión ortostática, taquicardia hiperdinámica compensatoria"
        },
        vitalsProfile: {
            bpmRange: [110, 140],
            bpSysRange: [85, 110],
            bpDiaRange: [50, 70],
            tempRange: [38.8, 41.2],
            respRateRange: [24, 36]
        },
        labProfile: {
            leukocytes: [4500, 9500],
            neutrophilsPercent: [60, 75],
            hemoglobin: [6.5, 9.8],
            platelets: [35000, 90000],
            glucose: [45, 95],
            creatinine: [1.8, 3.5],
            potassium: [3.9, 5.2],
            sodium: [130, 138],
            crp: [85, 210],
            lactate: [4.0, 8.5],
            arterialPh: [7.22, 7.33],
            specificBiomarkers: "Gota gruesa con parasitemia > 5% (trofozoítos y gametocitos). Bilirrubina indirecta y LDH muy elevadas."
        },
        goldStandardDiagnostic: "Gota gruesa y frotis de sangre periférica teñido con Giemsa / Prueba rápida de antígeno Pf-HRP2",
        standardTreatment: "Artesunato intravenoso (2.4 mg/kg a las 0, 12 y 24h) + Manejo intensivo de hipoglucemia y fluidos",
        description: "Infección parasitaria eritrocítica severa transmitida por Anopheles, donde los glóbulos rojos parasitados forman rosetas y se adhieren al endotelio capilar de cerebro y riñón, causando anoxia tisular crítica."
    },
    {
        id: "septic_shock",
        name: "Sepsis y Choque Séptico de Foco Urinario / Abdominal",
        cie11: "1G41",
        cie10: "R65.21",
        snomedCt: "76571007 - Septic shock",
        category: "Medicina Crítica / Infectología",
        syndromes: ["Shock Distributivo", "Disfunción Multiorgánica", "Síndrome de Respuesta Inflamatoria Sistémica"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Agudo (horas a 1 día)",
            progressionRate: "Fulminante sin reanimación inmediata",
            complicationWindow: "Paro por vasodilatación refractaria y fallo mitocondrial en < 6 horas"
        },
        oxygenProfile: {
            expectedSpo2Range: [88.0, 93.0],
            hypoxiaRisk: "Crítico",
            responseToOxygen: "Insuficiente: requiere aporte de oxígeno pero la disoxia es a nivel celular/microvascular"
        },
        physicalSigns: {
            eyes: "Normales o inyección conjuntival, pupilas con respuesta tórpida en encefalopatía séptica",
            skin: "Manchas cutáneas de moteado (mottling score en rodillas 2-4), extremidades calientes iniciales que tornan a frías y cianóticas",
            neurological: "Encefalopatía séptica: desorientación, estupor (Glasgow 10-13)",
            respiratory: "Polipnea marcada (>28 rpm) para compensar la acidosis láctica",
            cardiovascular: "Hipotensión con PAM < 65 mmHg a pesar de fluidos (requiere vasopresores), taquicardia (>120 lpm)"
        },
        vitalsProfile: {
            bpmRange: [115, 145],
            bpSysRange: [70, 90],
            bpDiaRange: [38, 55],
            tempRange: [38.8, 40.5],
            respRateRange: [28, 38]
        },
        labProfile: {
            leukocytes: [19000, 32000],
            neutrophilsPercent: [86, 96],
            hemoglobin: [10.0, 13.0],
            platelets: [40000, 110000],
            glucose: [150, 240],
            creatinine: [2.1, 3.8],
            potassium: [4.8, 6.0],
            sodium: [132, 140],
            crp: [150, 320],
            lactate: [4.2, 9.5],
            arterialPh: [7.18, 7.30],
            specificBiomarkers: "Procalcitonina > 10 ng/mL. Hemocultivos seriados positivos para bacilos gramnegativos o cocos."
        },
        goldStandardDiagnostic: "Criterios Sepsis-3 (Infección sospechada + aumento de SOFA ≥ 2 + Lactato > 2 mmol/L con vasopresores)",
        standardTreatment: "Paquete de la primera hora: Hemocultivos + Antibiótico de amplio espectro (Meropenem / Piperacilina-Tazobactam) + Cristaloides 30 ml/kg + Noradrenalina",
        description: "Disfunción orgánica potencialmente mortal causada por una respuesta desregulada del huésped a la infección, con anomalías circulatorias y celulares profundas que aumentan drásticamente la mortalidad."
    },

    // ==========================================
    // 3. CARDIOLOGÍA Y APARATO CARDIOVASCULAR
    // ==========================================
    {
        id: "ami_stemi",
        name: "Infarto Agudo de Miocardio con Elevación del ST (IAMCEST)",
        cie11: "BA41.0",
        cie10: "I21.0",
        snomedCt: "401303003 - Acute ST segment elevation myocardial infarction",
        category: "Cardiología",
        syndromes: ["Síndrome Coronario Agudo", "Dolor Torácico Opresivo", "Riesgo de Paro Cardíaco"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Hiperagudo (< 1-2 horas)",
            progressionRate: "Crítico / 'El tiempo es músculo'",
            complicationWindow: "Fibrilación ventricular o choque cardiogénico en los primeros 90 minutos"
        },
        oxygenProfile: {
            expectedSpo2Range: [92.0, 96.0],
            hypoxiaRisk: "Moderado a Alto si hay edema pulmonar",
            responseToOxygen: "Oxígeno solo si SpO2 < 90% (el exceso de O2 causa vasoconstricción coronaria por radicales libres)"
        },
        physicalSigns: {
            eyes: "Normales con midriasis adrenérgica y facies de dolor agónico",
            skin: "Palidez extrema, sudoración fría profusa ('diaforesis pegajosa'), piloerección",
            neurological: "Sensación inminente de muerte (angor animi), sin déficit focal",
            respiratory: "Disnea refleja, estertores crepitantes si hay falla ventricular izquierda (Killip II-III)",
            cardiovascular: "Ritmo de galope (S3/S4), bradicardia o taquicardia arritmogénica"
        },
        vitalsProfile: {
            bpmRange: [65, 115],
            bpSysRange: [95, 150],
            bpDiaRange: [60, 95],
            tempRange: [36.6, 37.4],
            respRateRange: [20, 28]
        },
        labProfile: {
            leukocytes: [10000, 16000],
            neutrophilsPercent: [70, 85],
            hemoglobin: [12.5, 15.5],
            platelets: [180000, 340000],
            glucose: [130, 210],
            creatinine: [0.9, 1.4],
            potassium: [3.8, 4.6],
            sodium: [137, 143],
            crp: [15, 60],
            lactate: [1.8, 3.8],
            arterialPh: [7.34, 7.42],
            specificBiomarkers: "Troponina I de alta sensibilidad masivamente elevada (> 500 ng/L). CPK-MB elevada > 25 U/L."
        },
        goldStandardDiagnostic: "Electrocardiograma de 12 derivaciones en < 10 minutos (supradesnivel del ST > 1 mm en derivaciones contiguas) + Coronariografía urgente",
        standardTreatment: "Angioplastia coronaria primaria urgente (meta < 90 min) + Doble antiagregación (Aspirina 300mg + Ticagrelor 180mg) + Heparina no fraccionada",
        description: "Necrosis celular miocárdica aguda causada por la oclusión trombótica completa y súbita de una arteria coronaria epicárdica tras la rotura de una placa aterosclerótica vulnerable."
    },
    {
        id: "hypertensive_emergency",
        name: "Crisis Hipertensiva tipo Emergencia con Daño a Órgano Blanco",
        cie11: "BA00",
        cie10: "I10",
        snomedCt: "706882009 - Hypertensive emergency",
        category: "Cardiología",
        syndromes: ["Emergencia Cardiovascular", "Cefalea Hipertensiva", "Disfunción Orgánica Aguda"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Agudo (horas)",
            progressionRate: "Rápido / Peligro de ACV o edema pulmonar",
            complicationWindow: "Hemorragia cerebral o disección aórtica si no se titula descenso tensional"
        },
        oxygenProfile: {
            expectedSpo2Range: [92.0, 97.0],
            hypoxiaRisk: "Moderado a Alto si sobreviene edema pulmonar",
            responseToOxygen: "Excelente con ventilación a presión positiva si hay congestión retrógrada"
        },
        physicalSigns: {
            eyes: "Ojos rojos leves por congestión conjuntival, retinopatía hipertensiva (hemorragias en llama y exudados en fondo de ojo)",
            skin: "Rubicundez facial, piel sudorosa",
            neurological: "Cefalea occipital pulsátil severa, escotomas centellantes, náuseas y vómitos en escopetazo",
            respiratory: "Disnea en decúbito (ortopnea), ruidos crepitantes pulmonares",
            cardiovascular: "Cifras tensionales extremas (PAS ≥ 190 mmHg y/o PAD ≥ 115 mmHg), choque de punta desplazado"
        },
        vitalsProfile: {
            bpmRange: [100, 125],
            bpSysRange: [190, 230],
            bpDiaRange: [115, 135],
            tempRange: [36.6, 37.3],
            respRateRange: [22, 28]
        },
        labProfile: {
            leukocytes: [8000, 13000],
            neutrophilsPercent: [65, 78],
            hemoglobin: [13.0, 16.0],
            platelets: [200000, 360000],
            glucose: [115, 170],
            creatinine: [1.3, 2.2],
            potassium: [3.6, 4.5],
            sodium: [138, 145],
            crp: [10, 35],
            lactate: [1.4, 2.5],
            arterialPh: [7.35, 7.44],
            specificBiomarkers: "Sedimento urinario con microhematuria y proteinuria. Troponina discretamente positiva por sobrecarga parietal."
        },
        goldStandardDiagnostic: "Monitorización invasiva de presión arterial continua + Fondo de ojo + ECG + Radiografía de tórax",
        standardTreatment: "Labetalol IV en infusión continua titulada o Nitroprusiato de Sodio (reducir PAM máximo 20-25% en la primera hora para evitar isquemia cerebral)",
        description: "Elevación tensional severa con evidencia de lesión aguda y progresiva en órganos diana (cerebro, corazón, retina o riñones), que requiere reducción farmacológica parenteral inmediata."
    },
    {
        id: "aortic_dissection",
        name: "Disección Aórtica Aguda Tipo A de Stanford",
        cie11: "BD52",
        cie10: "I71.0",
        snomedCt: "233989006 - Dissection of aorta",
        category: "Cardiología / Cirugía Cardiovascular",
        syndromes: ["Dolor Torácico Desgarrador", "Déficit de Pulso", "Shock Cardiogénico"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Hiperagudo (inicio en un segundo)",
            progressionRate: "Catastrófico / Mortalidad 1-2% por hora",
            complicationWindow: "Ruptura aórtica o taponamiento cardíaco en las primeras 24-48 horas"
        },
        oxygenProfile: {
            expectedSpo2Range: [91.0, 96.0],
            hypoxiaRisk: "Moderado a Alto",
            responseToOxygen: "Aporte complementario para mantener SpO2 > 95%"
        },
        physicalSigns: {
            eyes: "Normales o síndrome de Horner unilateral (ptosis, miosis, anhidrosis) por compresión de la cadena simpática",
            skin: "Palidez intensa, sudoración fría, livedo en extremidades isquémicas",
            neurological: "Déficit neurológico focal transitorio por compromiso de carótidas (ACV isquémico sincrónico)",
            respiratory: "Taquipnea antálgica sin ruidos pulmonares mayores",
            cardiovascular: "Asimetría de pulsos (> 20 mmHg de diferencia entre brazos), soplo diastólico de insuficiencia aórtica aguda"
        },
        vitalsProfile: {
            bpmRange: [85, 120],
            bpSysRange: [160, 210],
            bpDiaRange: [90, 115],
            tempRange: [36.4, 37.2],
            respRateRange: [22, 30]
        },
        labProfile: {
            leukocytes: [11000, 17000],
            neutrophilsPercent: [75, 88],
            hemoglobin: [11.0, 14.5],
            platelets: [170000, 310000],
            glucose: [120, 180],
            creatinine: [1.2, 2.0],
            potassium: [3.8, 4.7],
            sodium: [136, 143],
            crp: [25, 80],
            lactate: [2.2, 4.5],
            arterialPh: [7.32, 7.42],
            specificBiomarkers: "Dímero D muy elevado (> 1600 ng/mL). Troponina positiva si diseca el ostium de la coronaria derecha."
        },
        goldStandardDiagnostic: "Angio-TAC toracoabdominal urgente (Visualización del flap intimal y falsa luz)",
        standardTreatment: "Cirugía cardíaca abierta de emergencia + Bloqueo beta adrenérgico inmediato (Esmolol IV) para mantener FC < 60 lpm y PAS < 110 mmHg",
        description: "Desgarro de la íntima aórtica con propagación de sangre hacia la capa media creando una falsa luz, con altísimo riesgo de ruptura intrapericárdica, taponamiento y muerte súbita."
    },

    // ==========================================
    // 4. GASTROENTEROLOGÍA Y ABDOMEN AGUDO
    // ==========================================
    {
        id: "appendicitis_peritonitis",
        name: "Apendicitis Aguda Perforada con Peritonitis Generalizada",
        cie11: "DB10.1",
        cie10: "K35.2",
        snomedCt: "47693006 - Perforated acute appendicitis",
        category: "Cirugía General / Gastroenterología",
        syndromes: ["Abdomen Agudo Quirúrgico", "Síndrome Peritoneal", "Sepsis Intraabdominal"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Agudo (progresión de 12-36 horas)",
            progressionRate: "Rápido hacia shock séptico",
            complicationWindow: "Foco séptico intraabdominal y absceso subfrénico en 24h"
        },
        oxygenProfile: {
            expectedSpo2Range: [93.0, 97.0],
            hypoxiaRisk: "Moderado (respiración superficial por dolor abdominal)",
            responseToOxygen: "Mantiene buena saturación con aire ambiente o soporte mínimo"
        },
        physicalSigns: {
            eyes: "Ojos con hundimiento periocular leve por deshidratación e inyección conjuntival febril",
            skin: "Facies dolorosa hipocrática, piel terrosa, palidez y sudoración",
            neurological: "Lúcido pero postrado en posición antiálgica (flexión del muslo derecho)",
            respiratory: "Respiración costal pura rápida y superficial para no movilizar el diafragma",
            abdominal: "Abdomen en tabla (defensa involuntaria generalizada), Blumberg (++), Rovsing (+), silencio auscultatorio"
        },
        vitalsProfile: {
            bpmRange: [110, 135],
            bpSysRange: [95, 115],
            bpDiaRange: [60, 75],
            tempRange: [38.6, 40.0],
            respRateRange: [24, 32]
        },
        labProfile: {
            leukocytes: [16000, 26000],
            neutrophilsPercent: [85, 95],
            hemoglobin: [12.0, 14.5],
            platelets: [220000, 420000],
            glucose: [110, 155],
            creatinine: [1.0, 1.7],
            potassium: [3.5, 4.4],
            sodium: [133, 140],
            crp: [110, 260],
            lactate: [2.4, 4.8],
            arterialPh: [7.31, 7.39],
            specificBiomarkers: "Procalcitonina elevada. Desviación a la izquierda con baciliformes > 10%."
        },
        goldStandardDiagnostic: "Tomografía Computarizada de Abdomen y Pelvis con contraste (diámetro apendicular > 6 mm, fecalito y líquido libre)",
        standardTreatment: "Apendicectomía laparoscópica urgente + Lavado peritoneal profuso + Ceftriaxona 2g + Metronidazol 500mg IV",
        description: "Obstrucción de la luz apendicular que produce necrosis isquémica parietal, perforación libre hacia el peritoneo y liberación de contenido entérico purulento con peritonitis química y bacteriana."
    },
    {
        id: "acute_pancreatitis",
        name: "Pancreatitis Aguda Grave Necrotizante",
        cie11: "DC31",
        cie10: "K85.9",
        snomedCt: "197456007 - Acute pancreatitis",
        category: "Gastroenterología",
        syndromes: ["Dolor Abdominal Epigástrico 'en Cinturón'", "Síndrome de Respuesta Inflamatoria Sistémica", "Tercer Espacio Masivo"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Agudo (tras ingesta copiosa o transgresión enólica)",
            progressionRate: "Rápido / Deterioro en 24-48 horas",
            complicationWindow: "Falla respiratoria (SDRA) y necrosis pancreática infectada a partir del día 3"
        },
        oxygenProfile: {
            expectedSpo2Range: [88.0, 93.0],
            hypoxiaRisk: "Alto por derrame pleural izquierdo y SDRA por fosfolipasa A2",
            responseToOxygen: "Requiere oxigenoterapia de soporte y monitoreo estricto de gases"
        },
        physicalSigns: {
            eyes: "Ojos con escleras subictéricas (si la etiología es litiásica biliar) y conjuntivas secas",
            skin: "Signo de Cullen (equimosis periumbilical) y Signo de Grey-Turner (equimosis en flancos) en pancreatitis hemorrágica",
            neurological: "Agitación psicomotriz o letargia por toxemia enzimática",
            respiratory: "Disnea, hipoventilación en base pulmonar izquierda con derrame serohemático",
            abdominal: "Dolor epigástrico transfictivo atroz irradiado a espalda, timpanismo por íleo paralítico"
        },
        vitalsProfile: {
            bpmRange: [110, 138],
            bpSysRange: [88, 110],
            bpDiaRange: [55, 70],
            tempRange: [38.2, 39.5],
            respRateRange: [24, 34]
        },
        labProfile: {
            leukocytes: [15000, 24000],
            neutrophilsPercent: [80, 92],
            hemoglobin: [14.0, 17.5],
            platelets: [180000, 350000],
            glucose: [140, 250],
            creatinine: [1.5, 2.8],
            potassium: [3.4, 4.6],
            sodium: [132, 139],
            crp: [150, 320],
            lactate: [2.5, 4.6],
            arterialPh: [7.30, 7.38],
            specificBiomarkers: "Lipasa sérica masivamente elevada (> 3 veces valor normal, ej. > 600 U/L). Amilasa sérica > 1000 U/L. Hipocalcemia (< 8.0 mg/dL)."
        },
        goldStandardDiagnostic: "Criterios de Atlanta (2 de 3: Dolor típico + Lipasa/Amilasa >3x + Hallazgos en TAC) + TAC dinámico con contraste a las 72h",
        standardTreatment: "Fluidoterapia agresiva guiada por metas (Ringer Lactato 250-500 ml/h inicial) + Analgesia mayor con opioides (Fentanilo/Morfina) + Nutrición enteral precoz",
        description: "Activación prematura intrapancreática de enzimas digestivas con autodigestión del parénquima glandular, liberación masiva de citoquinas proinflamatorias y fuga masiva de volumen intravascular hacia el retroperitoneo."
    },

    // ==========================================
    // 5. NEUROLOGÍA Y SISTEMA NERVIOSO
    // ==========================================
    {
        id: "ischemic_stroke",
        name: "Accidente Cerebrovascular Isquémico Agudo (ACV / Ictus)",
        cie11: "8B11",
        cie10: "I63.9",
        snomedCt: "422504002 - Ischemic stroke",
        category: "Neurología",
        syndromes: ["Déficit Neurológico Focal Súbito", "Síndrome Hemisférico", "Pérdida de Función Motora"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Hiperagudo (inicio repentino en minutos)",
            progressionRate: "Ventana terapéutica crítica de 4.5 horas",
            complicationWindow: "Transformación hemorrágica o edema cerebral masivo con enclavamiento en 24-72h"
        },
        oxygenProfile: {
            expectedSpo2Range: [94.0, 98.0],
            hypoxiaRisk: "Moderado (alto si hay pérdida de reflejos de deglución y broncoaspiración)",
            responseToOxygen: "Mantener SpO2 > 94% para proteger la penumbra isquémica"
        },
        physicalSigns: {
            eyes: "Desviación conjugada de la mirada hacia el hemisferio lesionado, hemianopsia homónima",
            face: "Parálisis facial central unilateral (asimetría en comisura labial, frente conservada)",
            skin: "Normal, posible palidez",
            neurological: "Hemiplejía/hemiparesia braquiocrural contralateral, afasia de Broca/Wernicke o disartria grave",
            cardiovascular: "Frecuente hipertensión reactiva permisiva para perfusión cerebral"
        },
        vitalsProfile: {
            bpmRange: [75, 105],
            bpSysRange: [160, 205],
            bpDiaRange: [90, 115],
            tempRange: [36.6, 37.5],
            respRateRange: [16, 22]
        },
        labProfile: {
            leukocytes: [7500, 12500],
            neutrophilsPercent: [60, 75],
            hemoglobin: [13.0, 16.0],
            platelets: [180000, 320000],
            glucose: [100, 160],
            creatinine: [0.8, 1.3],
            potassium: [3.8, 4.6],
            sodium: [136, 144],
            crp: [5, 25],
            lactate: [1.0, 1.8],
            arterialPh: [7.36, 7.44],
            specificBiomarkers: "Glucemia capilar de urgencia normal (regla de oro para descartar hipoglucemia que simula ictus)."
        },
        goldStandardDiagnostic: "Tomografía Axial Computarizada cerebral simple urgente (descartar hemorragia) + Angio-TAC / Resonancia Cerebral con Difusión (DWI)",
        standardTreatment: "Trombólisis endovenosa con Alteplasa (rtPA 0.9 mg/kg) si tiempo < 4.5 horas / Trombectomía mecánica si oclusión de gran vaso en < 24h",
        description: "Interrupción focal del flujo sanguíneo cerebral debida a oclusión tromboembólica arterial, originando un área de necrosis central rodeada de penumbra isquémica potencialmente recuperable."
    },
    {
        id: "bacterial_meningitis",
        name: "Meningitis Bacteriana Aguda del Adulto",
        cie11: "1D01.0",
        cie10: "G00.9",
        snomedCt: "95884007 - Acute bacterial meningitis",
        category: "Neurología / Infectología",
        syndromes: ["Síndrome Meníngeo", "Síndrome de Hipertensión Endocraneana", "Síndrome Febril"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Agudo (< 24 horas)",
            progressionRate: "Rápido / Peligro de daño cerebral irreversible",
            complicationWindow: "Edema cerebral, herniación uncal o estatus epiléptico en 12h"
        },
        oxygenProfile: {
            expectedSpo2Range: [93.0, 97.0],
            hypoxiaRisk: "Moderado a Alto si cae Glasgow < 8",
            responseToOxygen: "Responde bien; asegurar vía aérea permeable"
        },
        physicalSigns: {
            eyes: "Ojos rojos con fotofobia extrema, papiledema en fondo de ojo (hipertensión endocraneana)",
            skin: "Fiebre alta, puede tener petequias si es meningocócica",
            neurological: "Rigidez de nuca marcada (resistencia dolorosa a la flexión), Signo de Kernig (+), Signo de Brudzinski (+), estupor",
            respiratory: "Patrón respiratorio variable, taquipnea febril"
        },
        vitalsProfile: {
            bpmRange: [100, 130],
            bpSysRange: [120, 160],
            bpDiaRange: [75, 95],
            tempRange: [38.8, 40.5],
            respRateRange: [22, 30]
        },
        labProfile: {
            leukocytes: [16000, 28000],
            neutrophilsPercent: [85, 95],
            hemoglobin: [12.0, 14.5],
            platelets: [160000, 340000],
            glucose: [100, 160],
            creatinine: [0.9, 1.5],
            potassium: [3.7, 4.6],
            sodium: [130, 138],
            crp: [120, 280],
            lactate: [2.8, 5.0],
            arterialPh: [7.32, 7.42],
            specificBiomarkers: "Punción lumbar: LCR turbio con pleocitosis a predominio polimorfonuclear (> 1000 leucocitos/mm3), proteinorraquia elevada (> 150 mg/dL) y glucorraquia muy disminuida (< 40% de glucemia sérica)."
        },
        goldStandardDiagnostic: "Punción Lumbar y análisis citoquímico y microbiológico del LCR (tinción de Gram y cultivo) previa TAC cerebral",
        standardTreatment: "Dexametasona 10mg IV 15 min antes de primera dosis de antibiótico + Ceftriaxona 2g IV c/12h + Vancomicina 15-20 mg/kg c/12h",
        description: "Inflamación purulenta aguda de las leptomeninges y del espacio subaracnoideo por invasión hematógena de bacterias patógenas (Streptococcus pneumoniae, Neisseria meningitidis), provocando hipertensión endocraneana y toxicidad neuronal."
    },

    // ==========================================
    // 6. ENDOCRINOLOGÍA Y METABOLISMO
    // ==========================================
    {
        id: "diabetic_ketoacidosis",
        name: "Cetoacidosis Diabética Severa (CAD)",
        cie11: "5A11",
        cie10: "E10.1",
        snomedCt: "70747000 - Diabetic ketoacidosis",
        category: "Endocrinología",
        syndromes: ["Acidosis Metabólica con Anión Gap Elevado", "Deshidratación Hiperosmolar", "Trastorno Electrolítico Severo"],
        severity: "Grave (Prioridad II)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Agudo (24-48 horas)",
            progressionRate: "Rápido / Riesgo de colapso hemodinámico",
            complicationWindow: "Edema cerebral por corrección osmolar desmedida o arritmias por hipocalemia"
        },
        oxygenProfile: {
            expectedSpo2Range: [94.0, 98.0],
            hypoxiaRisk: "Bajo (salvo que desarrolle neumonía aspirativa o edema pulmonar)",
            responseToOxygen: "Normal, no requiere alto flujo"
        },
        physicalSigns: {
            eyes: "Ojos hundidos por intensa deshidratación celular, halo periocular seco",
            skin: "Piel seca, caliente y enrojecida, pérdida marcada de turgencia (signo del pliegue positivo)",
            aliento: "Aliento cetósico con olor dulzón patognomónico a manzana podrida / acetona",
            neurological: "Somnolencia, letargo, desorientación temporoespacial, riesgo de coma cetósico",
            respiratory: "Respiración de Kussmaul (hiperventilación profunda, rápida y rítmica para expeler CO2)",
            abdominal: "Dolor abdominal difuso que simula abdomen agudo quirúrgico secundario a cetonemia"
        },
        vitalsProfile: {
            bpmRange: [105, 135],
            bpSysRange: [95, 120],
            bpDiaRange: [60, 75],
            tempRange: [36.5, 38.0],
            respRateRange: [28, 38]
        },
        labProfile: {
            leukocytes: [14000, 24000],
            neutrophilsPercent: [78, 90],
            hemoglobin: [14.0, 17.0],
            platelets: [210000, 390000],
            glucose: [380, 650],
            creatinine: [1.4, 2.6],
            potassium: [4.8, 6.2],
            sodium: [126, 134],
            crp: [30, 90],
            lactate: [1.8, 3.5],
            arterialPh: [7.10, 7.25],
            specificBiomarkers: "Gasometría: pH < 7.25, HCO3 < 12 mEq/L, Anión Gap > 16. Cetonemia elevada (> 3.0 mmol/L) y cetonuria (+++)."
        },
        goldStandardDiagnostic: "Tríada diagnóstica: Glucosa > 250 mg/dL + pH venoso/arterial < 7.30 con HCO3 < 18 + Cetonemia/Cetonuria positiva",
        standardTreatment: "Expansión volémica vigorosa con Suero Fisiológico 0.9% (1000 ml/h en primeras 2h) + Infusión continua de Insulina rápida (0.1 UI/kg/h) tras asegurar K > 3.3 mEq/L + Reposición profiláctica de Potasio",
        description: "Déficit absoluto de insulina asociado al aumento de hormonas contrarreguladoras (glucagón, cortisol, catecolaminas), con lipólisis masiva, cetogénesis hepática descontrolada y acidosis metabólica con anión gap ensanchado."
    },

    // ==========================================
    // 7. DERMATOLOGÍA Y REUMATOLOGÍA SISTÉMICA
    // ==========================================
    {
        id: "stevens_johnson",
        name: "Síndrome de Stevens-Johnson / Necrólisis Epidérmica Tóxica (SSJ/NET)",
        cie11: "EH60",
        cie10: "L51.1",
        snomedCt: "73442001 - Stevens-Johnson syndrome",
        category: "Dermatología / Alergia e Inmunología",
        syndromes: ["Desprendimiento Epidérmico Agudo", "Compromiso Mucoso Multiorgánico", "Shock Distributivo Hipovolémico"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Subagudo (1 a 3 semanas post-fármaco desencadenante)",
            progressionRate: "Rápido / Desprendimiento cutáneo en 24-48h",
            complicationWindow: "Sepsis bacteriana por pérdida de barrera cutánea y ceguera en fase aguda"
        },
        oxygenProfile: {
            expectedSpo2Range: [91.0, 96.0],
            hypoxiaRisk: "Alto si hay epitelización bronquial y desprendimiento mucoso traqueal",
            responseToOxygen: "Cuidadoso soporte ventilatorio con humidificación estricta"
        },
        physicalSigns: {
            eyes: "Ojos rojos (conjuntivitis pseudomembranosa severa, quemosis, sinequias y riesgo de ulceración corneal y ceguera)",
            skin: "Manchas en la piel: máculas eritematosas o purpúricas atípicas en diana confluentes que evolucionan a flictenas y desprendimiento epidérmico en láminas (Signo de Nikolsky positivo)",
            mucosas: "Estomatitis erosiva masiva con costras hemorrágicas dolorosas en labios, afectación genital y esofágica",
            neurological: "Dolor cutáneo extremo que imposibilita el roce con sábanas, taquicardia refleja",
            cardiovascular: "Hipotensión y deshidratación idéntica a gran quemado"
        },
        vitalsProfile: {
            bpmRange: [110, 135],
            bpSysRange: [88, 110],
            bpDiaRange: [55, 70],
            tempRange: [38.5, 40.0],
            respRateRange: [22, 30]
        },
        labProfile: {
            leukocytes: [3500, 8500],
            neutrophilsPercent: [50, 70],
            hemoglobin: [11.0, 13.5],
            platelets: [110000, 200000],
            glucose: [110, 160],
            creatinine: [1.3, 2.4],
            potassium: [3.3, 4.4],
            sodium: [129, 136],
            crp: [80, 190],
            lactate: [2.2, 4.2],
            arterialPh: [7.32, 7.42],
            specificBiomarkers: "Biopsia cutánea por congelación que demuestra necrosis epidérmica de espesor total con hendidura dermoepidérmica."
        },
        goldStandardDiagnostic: "Biopsia cutánea con inmunofluorescencia directa + Escala pronóstica SCORTEN",
        standardTreatment: "Retirada inmediata del fármaco causal + Ingreso urgente en Unidad de Grandes Quemados + Inmunoglobulina Humana Intravenosa (IVIG) o Ciclosporina + Cuidado ocular intensivo con lágrimas artificiales y lubricación permanente",
        description: "Reacción adversa a medicamentos mediada por linfocitos T citotóxicos que induce apoptosis masiva de queratinocitos a través de la vía Fas-FasL y granulisina, desprendiendo la epidermis como una quemadura de segundo grado extensa."
    },
    {
        id: "kawasaki_disease",
        name: "Enfermedad de Kawasaki Clásica",
        cie11: "BD42",
        cie10: "M30.3",
        snomedCt: "234170000 - Kawasaki disease",
        category: "Pediatría / Reumatología",
        syndromes: ["Vasculitis Sistémica de Mediano Calibre", "Síndrome Febril Prolongado", "Riesgo de Aneurisma Coronario"],
        severity: "Grave (Prioridad II)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Subagudo (fiebre > 5 días refractaria a antipiréticos)",
            progressionRate: "Fase aguda (1-2 semanas)",
            complicationWindow: "Aneurismas en arterias coronarias a partir de la segunda semana"
        },
        oxygenProfile: {
            expectedSpo2Range: [96.0, 99.0],
            hypoxiaRisk: "Bajo",
            responseToOxygen: "Habitualmente no requiere oxígeno suplementario salvo miocarditis"
        },
        physicalSigns: {
            eyes: "Ojos rojos (inyección conjuntival bilateral bulbar sin exudado purulento ni dolor corneal)",
            skin: "Manchas en la piel: exantema polimorfo en tronco y eritema palmo-plantar con edema indurado indoloroso, posterior descamación periungueal",
            mucosas: "Labios eritematosos fisurados y sangrantes, lengua en fresa ('frambuesa')",
            cuello: "Linfadenopatía cervical aguda no supurativa > 1.5 cm unilateral",
            cardiovascular: "Taquicardia desproporcionada a la fiebre por miocarditis subyacente"
        },
        vitalsProfile: {
            bpmRange: [120, 150],
            bpSysRange: [90, 110],
            bpDiaRange: [55, 70],
            tempRange: [39.0, 40.5],
            respRateRange: [26, 36]
        },
        labProfile: {
            leukocytes: [14000, 25000],
            neutrophilsPercent: [75, 88],
            hemoglobin: [10.0, 12.0],
            platelets: [450000, 900000],
            glucose: [85, 120],
            creatinine: [0.5, 0.9],
            potassium: [3.8, 4.6],
            sodium: [131, 137],
            crp: [90, 220],
            lactate: [1.2, 2.0],
            arterialPh: [7.38, 7.45],
            specificBiomarkers: "VSG > 40 mm/h. Piuria estéril en sedimento urinario. Hipoalbuminemia marcada."
        },
        goldStandardDiagnostic: "Criterios clínicos de la American Heart Association (Fiebre ≥ 5 días + 4 de 5 criterios físicos) + Ecocardiograma transtorácico bidimensional",
        standardTreatment: "Inmunoglobulina Intravenosa (IVIG 2 g/kg en infusión única de 12 horas) + Ácido Acetilsalicílico (Aspirina en dosis antiinflamatoria 30-50 mg/kg/día)",
        description: "Vasculitis necrosante aguda autolimitada de vasos de mediano calibre, con especial predilección por las arterias coronarias, que afecta primordialmente a lactantes y niños pequeños."
    },
    {
        id: "lyme_disease",
        name: "Enfermedad de Lyme Aguda / Borreliosis",
        cie11: "1C1G",
        cie10: "A69.2",
        snomedCt: "23502006 - Lyme disease",
        category: "Infectología",
        syndromes: ["Eritema Migratorio", "Síndrome Febril con Mialgias", "Bloqueo Cardíaco de Conducción"],
        severity: "Moderado (Prioridad III)",
        isCanNotMiss: false,
        temporalProfile: {
            onsetSpeed: "Subagudo (7-14 días tras picadura de garrapata)",
            progressionRate: "Gradual",
            complicationWindow: "Carditis de Lyme (bloqueo AV de 3er grado) y parálisis facial en semanas"
        },
        oxygenProfile: {
            expectedSpo2Range: [96.0, 99.0],
            hypoxiaRisk: "Bajo",
            responseToOxygen: "No requiere aporte"
        },
        physicalSigns: {
            eyes: "Ojos con conjuntivitis leve o visión borrosa ocasional",
            skin: "Manchas en la piel: Eritema migrans patognomónico (lesión eritematosa anular expansiva con aclaramiento central en forma de 'ojo de buey' o diana)",
            neurological: "Parálisis del nervio facial (Bell) bilateral en 10% de casos tempranos diseminados",
            cardiovascular: "Bradicardia o síncope si desarrolla bloqueo auriculoventricular"
        },
        vitalsProfile: {
            bpmRange: [60, 95],
            bpSysRange: [110, 130],
            bpDiaRange: [70, 85],
            tempRange: [37.6, 38.8],
            respRateRange: [16, 20]
        },
        labProfile: {
            leukocytes: [7000, 12000],
            neutrophilsPercent: [60, 72],
            hemoglobin: [12.5, 15.0],
            platelets: [180000, 320000],
            glucose: [90, 130],
            creatinine: [0.8, 1.1],
            potassium: [3.9, 4.6],
            sodium: [137, 143],
            crp: [25, 70],
            lactate: [1.0, 1.8],
            arterialPh: [7.38, 7.44],
            specificBiomarkers: "Serología ELISA para Borrelia burgdorferi seguida de Western Blot confirmatorio (criterios CDC de 2 pasos)."
        },
        goldStandardDiagnostic: "Diagnóstico clínico si hay eritema migrans en zona endémica / Serología en dos pasos (ELISA + Western Blot)",
        standardTreatment: "Doxiciclina oral 100 mg cada 12h por 14-21 días (o Ceftriaxona IV 2g/día si hay bloqueo cardíaco avanzado o neuroborreliosis)",
        description: "Zoonosis espiroquetal transmitida por garrapatas del complejo Ixodes, causada por Borrelia burgdorferi, con compromiso cutáneo inicial típico en diana y potencial afectación articular, cardíaca y neurológica."
    },
    {
        id: "lupus_flare",
        name: "Lupus Eritematoso Sistémico (LES) en Actividad Severa",
        cie11: "4A40",
        cie10: "M32.9",
        snomedCt: "55464009 - Systemic lupus erythematosus",
        category: "Reumatología",
        syndromes: ["Enfermedad Autoinmune Multisistémica", "Nefritis Lúpica", "Pancitopenia Inmune"],
        severity: "Grave (Prioridad II)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Subagudo a Crónico con reagudización",
            progressionRate: "Moderado a rápido en brote nefrítico",
            complicationWindow: "Falla renal terminal o hemorragia alveolar difusa en días"
        },
        oxygenProfile: {
            expectedSpo2Range: [92.0, 97.0],
            hypoxiaRisk: "Moderado (salvo pleuritis o hemorragia alveolar que causan hipoxemia severa)",
            responseToOxygen: "Buena salvo compromiso alveolar difuso"
        },
        physicalSigns: {
            eyes: "Ojos rojos (epiescleritis o escleritis lúpica), fotosensibilidad ocular, exudados retinianos algodonosos",
            skin: "Manchas en la piel: eritema malar en 'alas de mariposa' que respeta los surcos nasogenianos, lesiones discoides y livedo reticularis",
            neurological: "Psicosis lúpica, cefalea refractaria, convulsiones en neurolupus",
            respiratory: "Frote pleurítico audible, derrame pleural bilateral",
            cardiovascular: "Frote pericárdico (pericarditis lúpica), fenómeno de Raynaud en dedos de manos y pies"
        },
        vitalsProfile: {
            bpmRange: [88, 115],
            bpSysRange: [130, 165],
            bpDiaRange: [85, 100],
            tempRange: [37.8, 39.2],
            respRateRange: [20, 26]
        },
        labProfile: {
            leukocytes: [2800, 5200],
            neutrophilsPercent: [55, 70],
            hemoglobin: [9.0, 11.5],
            platelets: [70000, 140000],
            glucose: [90, 130],
            creatinine: [1.4, 2.5],
            potassium: [4.2, 5.2],
            sodium: [135, 142],
            crp: [15, 45],
            lactate: [1.2, 2.2],
            arterialPh: [7.34, 7.42],
            specificBiomarkers: "Anticuerpos Antinucleares (ANA) positivos título > 1:320. Anti-DNAdc elevado y complemento sérico consumido (C3 y C4 muy bajos). Proteinuria en orina de 24h > 1.5 g."
        },
        goldStandardDiagnostic: "Criterios EULAR/ACR 2019 (ANA positivo + puntuación ≥ 10) + Biopsia renal percutánea",
        standardTreatment: "Pulsos de Metilprednisolona 1g IV/día por 3 días + Micofenolato de Mofetilo o Ciclofosfamida IV + Hidroxicloroquina",
        description: "Enfermedad autoinmune crónica sistémica caracterizada por la pérdida de autotolerancia frente a antígenos nucleares, depósito de inmunocomplejos en lechos vasculares y daño inflamatorio en riñón, piel, articulaciones y sistema nervioso."
    },

    // ==========================================
    // 8. NEFROLOGÍA Y UROLOGÍA
    // ==========================================
    {
        id: "acute_kidney_injury",
        name: "Injuria Renal Aguda (IRA) Oligoanúrica Grado KDIGO 3",
        cie11: "GB60",
        cie10: "N17.9",
        snomedCt: "14669001 - Acute kidney injury",
        category: "Nefrología",
        syndromes: ["Síndrome Urémico Agudo", "Sobrecarga Hídrica", "Hiperkalemia Grave"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Agudo (24-48 horas)",
            progressionRate: "Rápido / Riesgo inminente de arritmia mortal",
            complicationWindow: "Paro cardíaco por fibrilación ventricular secundaria a potasio > 6.5 mEq/L"
        },
        oxygenProfile: {
            expectedSpo2Range: [87.0, 93.0],
            hypoxiaRisk: "Crítico por edema agudo de pulmón no cardiogénico por hipervolemia",
            responseToOxygen: "Requiere VMNI / Hemodiálisis urgente para remover volumen"
        },
        physicalSigns: {
            eyes: "Edema periorbitario matutino marcado bilateral, ojos hinchados",
            skin: "Palidez terrosa 'pajiza', escarcha urémica en casos avanzados, equimosis por disfunción plaquetaria",
            neurological: "Asterixis (temblor aleteante), encefalopatía urémica con somnolencia profunda y mioclonías",
            respiratory: "Crepitantes difusos bilaterales en marea ascendente por edema pulmonar",
            cardiovascular: "Hipertensión severa por sobrecarga hidrosalina, frote pericárdico urémico"
        },
        vitalsProfile: {
            bpmRange: [95, 125],
            bpSysRange: [160, 200],
            bpDiaRange: [95, 115],
            tempRange: [36.2, 37.3],
            respRateRange: [24, 34]
        },
        labProfile: {
            leukocytes: [9000, 15000],
            neutrophilsPercent: [68, 80],
            hemoglobin: [9.5, 12.0],
            platelets: [140000, 280000],
            glucose: [110, 170],
            creatinine: [4.5, 8.2],
            potassium: [6.2, 7.5],
            sodium: [128, 135],
            crp: [35, 90],
            lactate: [2.0, 3.8],
            arterialPh: [7.15, 7.28],
            specificBiomarkers: "Urea sérica > 180 mg/dL. ECG con ondas T picudas simétricas, ensanchamiento del QRS y pérdida de la onda P."
        },
        goldStandardDiagnostic: "Criterios KDIGO (Creatinina sérica > 3x basal o diuresis < 0.3 ml/kg/h por ≥ 24 horas o anuria ≥ 12 horas)",
        standardTreatment: "Medidas cardioprotectoras inmediatas (Gluconato de Calcio 10% IV) + Solución polarizante (Glucosa 50% + Insulina rápida 10 UI) + Salbutamol + Hemodiálisis de urgencia",
        description: "Deterioro abrupto e intenso de la función renal con acumulación de productos nitrogenados, incapacidad para mantener el equilibrio hidroelectrolítico y ácido-base, con anuria y riesgo letal por hiperpotasemia."
    },

    // ==========================================
    // 9. TOXICOLOGÍA Y URGENCIAS
    // ==========================================
    {
        id: "carbon_monoxide",
        name: "Intoxicación Aguda por Monóxido de Carbono (CO)",
        cie11: "NE61",
        cie10: "T58",
        snomedCt: "269607008 - Carbon monoxide poisoning",
        category: "Toxicología",
        syndromes: ["Hipoxia Tisular sin Cianosis", "Cefalea Intensa y Vómitos", "Encefalopatía Anóxica"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Agudo (exposición en ambiente cerrado con brasero/calefón)",
            progressionRate: "Rápido según concentración de gas ambiental",
            complicationWindow: "Coma, edema cerebral y síndrome neurológico tardío en horas"
        },
        oxygenProfile: {
            expectedSpo2Range: [98.0, 100.0],
            hypoxiaRisk: "Crítico a nivel celular (el oxímetro confunde carboxihemoglobina con oxihemoglobina)",
            responseToOxygen: "Responde a Oxígeno al 100% por máscara con reservorio o Cámara Hiperbárica"
        },
        physicalSigns: {
            eyes: "Ojos con pupilas dilatadas reactivas, hemorragias retinianas en llama",
            skin: "Coloración 'rojo cereza' clásica en piel y mucosas (signo tardío/postmortem), diaforesis",
            neurological: "Cefalea holocraneana pulsátil severa, mareo, ataxia, síncope, convulsiones y coma",
            respiratory: "Taquipnea sin estertores auscultatorios",
            cardiovascular: "Taquicardia refleja, arritmias ventriculares e isquemia miocárdica silente"
        },
        vitalsProfile: {
            bpmRange: [105, 135],
            bpSysRange: [110, 140],
            bpDiaRange: [70, 90],
            tempRange: [36.2, 37.2],
            respRateRange: [22, 32]
        },
        labProfile: {
            leukocytes: [8000, 14000],
            neutrophilsPercent: [60, 75],
            hemoglobin: [13.0, 16.0],
            platelets: [200000, 350000],
            glucose: [110, 160],
            creatinine: [0.9, 1.4],
            potassium: [3.6, 4.5],
            sodium: [136, 143],
            crp: [5, 20],
            lactate: [3.5, 7.8],
            arterialPh: [7.25, 7.35],
            specificBiomarkers: "Cooximetría arterial: Carboxihemoglobina (COHb) > 20-30% (normal en no fumadores < 2%). Troponina I positiva por hipoxia miocárdica."
        },
        goldStandardDiagnostic: "Cooximetría en gasometría arterial o venosa demostrando Carboxihemoglobina (COHb) elevada",
        standardTreatment: "Oxígeno normobárico al 100% con mascarilla con reservorio y flujo a 15 L/min inmediatamente (reduce vida media de COHb de 320 min a 80 min) o Oxigenoterapia Hiperbárica (OHB a 2.8 ATA)",
        description: "Gas incoloro e inodoro con afinidad por la hemoglobina 200 veces superior al oxígeno, que desplaza la curva de disociación hacia la izquierda, bloquea el complejo IV mitocondrial y causa anoxia celular profunda."
    },
    // ==========================================
    // 10. INFECTOLOGÍA GLOBAL Y ENFERMEDADES TRANSMISIBLES ADICIONALES
    // ==========================================
    {
        id: "tuberculosis_pulmonary",
        name: "Tuberculosis Pulmonar Cavitada Activa",
        cie11: "1B10",
        cie10: "A15.0",
        snomedCt: "154283005 - Pulmonary tuberculosis",
        category: "Infectología / Neumología",
        syndromes: ["Síndrome Consuntivo", "Hemoptisis", "Síndrome Febril Prolongado"],
        severity: "Grave (Prioridad II)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Subagudo a Crónico (semanas a meses)",
            progressionRate: "Gradual pero destructivo",
            complicationWindow: "Hemoptisis cataclísmica o diseminación miliar en semanas"
        },
        oxygenProfile: {
            expectedSpo2Range: [89.0, 94.0],
            hypoxiaRisk: "Moderado a Alto si hay destrucción parenquimatosa extensa",
            responseToOxygen: "Responde bien a bajo flujo"
        },
        physicalSigns: {
            eyes: "Normales con palidez conjuntival por anemia de trastornos crónicos",
            skin: "Palidez cérea, caquexia, sudoración nocturna profusa ('diaforesis que empapa sábanas')",
            respiratory: "Crepitantes y soplo anfórico apical, tos productiva con esputo numular hemoptoico",
            cuello: "Adenopatías cervicales coalescentes indoloras (escrófula)"
        },
        vitalsProfile: {
            bpmRange: [85, 110],
            bpSysRange: [100, 125],
            bpDiaRange: [60, 80],
            tempRange: [37.8, 38.8],
            respRateRange: [20, 26]
        },
        labProfile: {
            leukocytes: [8000, 14000],
            neutrophilsPercent: [65, 80],
            hemoglobin: [9.5, 12.0],
            platelets: [300000, 520000], // Trombocitosis reactiva crónica
            glucose: [90, 130],
            creatinine: [0.7, 1.2],
            potassium: [3.7, 4.6],
            sodium: [132, 139],
            crp: [45, 130],
            lactate: [1.2, 2.0],
            arterialPh: [7.36, 7.43],
            specificBiomarkers: "Baciloscopía en esputo (tinción de Ziehl-Neelsen) con Bacilos Ácido-Alcohol Resistentes (BAAR +++). Prueba molecular GeneXpert MTB/RIF positiva."
        },
        goldStandardDiagnostic: "Prueba molecular GeneXpert MTB/RIF en esputo + Cultivo en medio Lowenstein-Jensen / TAC de tórax con caverna apical",
        standardTreatment: "Aislamiento aéreo respiratorio estricto con mascarilla N95 + Esquema cuádruple DOTS (Isoniazida, Rifampicina, Pirazinamida, Etambutol por 2 meses, luego HR por 4 meses)",
        description: "Infección bacteriana crónica por Mycobacterium tuberculosis que induce formación de granulomas caseificantes en lóbulos superiores pulmonares con cavitación tisular y necrosis."
    },
    {
        id: "covid19_ards",
        name: "COVID-19 Severo con Síndrome de Distrés Respiratorio Agudo (SDRA)",
        cie11: "RA01.0",
        cie10: "U07.1",
        snomedCt: "840539006 - COVID-19",
        category: "Infectología / Medicina Crítica",
        syndromes: ["Insuficiencia Respiratoria Hipoxémica Severa", "Tormenta de Citoquinas", "Coagulopatía Inmunotrombótica"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Subagudo (deterioro abrupto entre días 7-10 de síntomas)",
            progressionRate: "Rápido / 'Hipoxemia feliz' silenciosa",
            complicationWindow: "Falla respiratoria catastrófica y microtrombosis pulmonar en 24-48h"
        },
        oxygenProfile: {
            expectedSpo2Range: [78.0, 87.0],
            hypoxiaRisk: "Crítico",
            responseToOxygen: "Refractaria a oxígeno convencional (requiere cánula nasal de alto flujo, pronación o intubación)"
        },
        physicalSigns: {
            eyes: "Inyección conjuntival bilateral ('ojo rojo COVID')",
            skin: "Cianosis central peribucal, lesiones perniosis-like ('dedos COVID') en pies",
            neurological: "Anosmia y ageusia tempranas, confusión por hipoxia grave",
            respiratory: "Taquipnea extrema (>32 rpm), tiraje supraclavicular e intercostal, respiración paradójica",
            cardiovascular: "Taquicardia refleja y riesgo elevado de embolia pulmonar"
        },
        vitalsProfile: {
            bpmRange: [105, 130],
            bpSysRange: [115, 145],
            bpDiaRange: [70, 90],
            tempRange: [38.2, 39.8],
            respRateRange: [30, 42]
        },
        labProfile: {
            leukocytes: [3800, 9500],
            neutrophilsPercent: [80, 92],
            hemoglobin: [12.0, 15.0],
            platelets: [140000, 260000],
            glucose: [120, 190],
            creatinine: [1.0, 1.8],
            potassium: [3.5, 4.5],
            sodium: [131, 138],
            crp: [110, 260],
            lactate: [2.2, 4.4],
            arterialPh: [7.30, 7.42],
            specificBiomarkers: "Dímero D muy elevado (> 3000 ng/mL). Ferritina sérica > 1500 ng/mL. Linfopenia absoluta (< 800/uL). IL-6 marcadamente elevada."
        },
        goldStandardDiagnostic: "RT-PCR de hisopado nasofaríngeo para SARS-CoV-2 + TAC de tórax con patrón en vidrio deslustrado periférico bilateral y consolidaciones subpleurales",
        standardTreatment: "Dexametasona 6 mg IV/día + Posición en prono vigil (16h/día) + Heparina de bajo peso molecular en dosis tromboprofiláctica/terapéutica + Oxígeno de alto flujo",
        description: "Infección viral por SARS-CoV-2 con unión al receptor ECA2 del epitelio alveolar y endotelio capilar, desencadenando cascada hiperinflamatoria, daño alveolar difuso e hipoxemia severa por shunt intrapulmonar."
    },
    {
        id: "anaphylactic_shock",
        name: "Choque Anafiláctico Severo por Fármacos / Alimentos",
        cie11: "4A84",
        cie10: "T78.2",
        snomedCt: "39579001 - Anaphylactic shock",
        category: "Alergología / Medicina de Urgencias",
        syndromes: ["Shock Distributivo Hipovolémico", "Estridor Laríngeo / Asfixia", "Colapso Circulatorio Inmediato"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Hiperagudo (segundos a minutos tras exposición)",
            progressionRate: "Catastrófico / Cuestión de minutos",
            complicationWindow: "Edema de glotis y colapso cardiovascular irreversible en < 15 minutos"
        },
        oxygenProfile: {
            expectedSpo2Range: [75.0, 88.0],
            hypoxiaRisk: "Crítico por obstrucción alta de la vía aérea",
            responseToOxygen: "Ineficaz si hay cierre total glótico antes de administrar adrenalina"
        },
        physicalSigns: {
            eyes: "Ojos rojos (inyección conjuntival bulbar), edema angioneurótico palpebral bilateral masivo ('ojos cerrados por hinchazón')",
            skin: "Manchas en la piel: habones urticarianos eritematosos pruriginosos generalizados y angioedema labial y facial marcado",
            respiratory: "Estridor inspiratorio laríngeo audible a distancia, disfonía, broncoespasmo severo con sibilancias espiratorias",
            cardiovascular: "Hipotensión arterial profunda súbita (PAS < 70 mmHg), taquicardia refleja extrema (>140 lpm) y colapso"
        },
        vitalsProfile: {
            bpmRange: [120, 160],
            bpSysRange: [60, 85],
            bpDiaRange: [30, 50],
            tempRange: [36.2, 37.2],
            respRateRange: [28, 44]
        },
        labProfile: {
            leukocytes: [9000, 17000],
            neutrophilsPercent: [65, 80],
            hemoglobin: [13.5, 17.0], // Hemoconcentración por extravasación masiva
            platelets: [180000, 320000],
            glucose: [110, 170],
            creatinine: [0.9, 1.5],
            potassium: [3.8, 4.6],
            sodium: [135, 142],
            crp: [5, 20],
            lactate: [3.0, 6.5],
            arterialPh: [7.24, 7.35],
            specificBiomarkers: "Triptasa sérica mastocitaria muy elevada (tomada entre 30 min y 2 horas del evento). IgE total elevada."
        },
        goldStandardDiagnostic: "Diagnóstico exclusivamente clínico inmediato (criterios NIAID/FAAN de anafilaxia) + Dosaje de triptasa sérica",
        standardTreatment: "Adrenalina (Epinefrina) 1:1000 intramuscular inmediata en cara anterolateral del muslo (0.5 mg en adultos) + Oxígeno al 100% + Cristaloides a chorro + Salbutamol + Hidrocortisona y Clorfenamina IV",
        description: "Reacción de hipersensibilidad sistémica de tipo I mediada por IgE con degranulación masiva e instantánea de mastocitos y basófilos, liberando histamina y leucotrienos que causan broncoconstricción letal y vasodilatación con shock."
    },
    {
        id: "guillain_barre",
        name: "Síndrome de Guillain-Barré con Parálisis Respiratoria Ascendente",
        cie11: "8C01",
        cie10: "G61.0",
        snomedCt: "40956001 - Guillain-Barre syndrome",
        category: "Neurología",
        syndromes: ["Polirradiculoneuropatía Desmielinizante Aguda", "Parálisis Flácida Arreactiva", "Falla Ventilatoria Neuromuscular"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Subagudo (días a 2 semanas tras infección respiratoria o digestiva)",
            progressionRate: "Progresión ascendente rápida",
            complicationWindow: "Parálisis diafragmática y disautonomía cardíaca en 24-72h"
        },
        oxygenProfile: {
            expectedSpo2Range: [86.0, 93.0],
            hypoxiaRisk: "Crítico por hipoventilación neuromuscular",
            responseToOxygen: "Requiere intubación y ventilación mecánica invasiva si la capacidad vital forzada cae < 15-20 ml/kg"
        },
        physicalSigns: {
            eyes: "Oftalmoparesia o ptosis palpebral bilateral en variante Miller-Fisher o debilidad facial diplejía",
            skin: "Normal, episodios de sudoración profusa y fluctuaciones vasomotoras por disautonomía",
            neurological: "Debilidad motora simétrica ascendente flácida (comienza en piernas y sube a brazos y tronco), arreflexia osteotendinosa universal (abolida 0/4)",
            respiratory: "Disnea por parálisis frénica diafragmática, incapacidad para toser o contar hasta 20 en una sola respiración",
            cardiovascular: "Labilidad tensional severa y taqui-bradiarritmias por inestabilidad autonómica"
        },
        vitalsProfile: {
            bpmRange: [60, 130], // Fluctuante por disautonomía
            bpSysRange: [90, 180], // Muy lábil
            bpDiaRange: [55, 105],
            tempRange: [36.5, 37.3],
            respRateRange: [24, 36]
        },
        labProfile: {
            leukocytes: [6000, 11000],
            neutrophilsPercent: [55, 70],
            hemoglobin: [12.5, 15.0],
            platelets: [200000, 350000],
            glucose: [90, 130],
            creatinine: [0.8, 1.1],
            potassium: [3.8, 4.7],
            sodium: [134, 142],
            crp: [5, 25],
            lactate: [1.2, 2.0],
            arterialPh: [7.28, 7.36], // Acidosis respiratoria hipercápnica
            specificBiomarkers: "Punción lumbar: Disociación albuminocitológica patognomónica (proteínas elevadas > 80-150 mg/dL con recuento celular normal < 5 leucocitos/mm3). Anticuerpos anti-gangliósidos (anti-GQ1b, anti-GM1)."
        },
        goldStandardDiagnostic: "Electromiografía y estudios de conducción nerviosa (bloqueos de conducción y enlentecimiento de latencias) + Punción Lumbar (disociación albuminocitológica)",
        standardTreatment: "Inmunoglobulina Humana Intravenosa (IVIG 0.4 g/kg/día por 5 días) o Plasmaféresis (5 sesiones en días alternos) + Monitorización estrecha de capacidad vital forzada en UCI",
        description: "Trastorno autoinmune postinfeccioso donde autoanticuerpos dirigidos contra antígenos microbianos (ej. Campylobacter jejuni) reconocen por mimetismo molecular los gangliósidos de los nervios periféricos, destruyendo la vaina de mielina."
    },
    {
        id: "cholera_gravis",
        name: "Cólera Grave con Choque Hipovolémico Deshidratante",
        cie11: "1A00",
        cie10: "A00.9",
        snomedCt: "63650001 - Cholera",
        category: "Infectología / Salud Global",
        syndromes: ["Diarrea Acuosa Secretora Masiva", "Deshidratación Grado III / Choque Hipovolémico", "Acidosis Metabólica Severa"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Agudo (horas)",
            progressionRate: "Pérdida de hasta 1 litro de líquido por hora",
            complicationWindow: "Fallecimiento por shock hipovolémico en 4-12 horas sin rehidratación"
        },
        oxygenProfile: {
            expectedSpo2Range: [94.0, 98.0],
            hypoxiaRisk: "Moderado (hipoperfusión tisular)",
            responseToOxygen: "Responde al recuperar la volemia"
        },
        physicalSigns: {
            eyes: "Ojos profundamente hundidos en las órbitas ('facies colérica'), ausencia total de lágrimas, córneas secas",
            skin: "Piel grisácea, fría y apergaminada con 'manos de lavandera' (arrugadas), signo del pliegue cutáneo que tarda más de 3 segundos en desaparecer",
            deposiciones: "Diarreas profusas indoloras líquidas con aspecto patognomónico de 'agua de arroz' con olor a pescado dulce",
            neurological: "Letargo profundo, somnolencia, calambres musculares atroces en pantorrillas por hipopotasemia",
            cardiovascular: "Pulsos periféricos no palpables, hipotensión severa e indetectable"
        },
        vitalsProfile: {
            bpmRange: [120, 155],
            bpSysRange: [60, 85],
            bpDiaRange: [30, 50],
            tempRange: [35.5, 36.8], // Frecuente hipotermia por shock
            respRateRange: [28, 40]
        },
        labProfile: {
            leukocytes: [12000, 22000],
            neutrophilsPercent: [75, 88],
            hemoglobin: [16.5, 20.0], // Hemoconcentración extrema por deshidratación
            platelets: [250000, 480000],
            glucose: [70, 110],
            creatinine: [2.5, 5.0], // Injuria renal aguda prerrenal masiva
            potassium: [2.5, 3.4], // Hipopotasemia severa por pérdidas digestivas
            sodium: [130, 142],
            crp: [15, 50],
            lactate: [4.5, 9.0],
            arterialPh: [7.10, 7.24], // Acidosis metabólica por pérdida masiva de bicarbonato fecal
            specificBiomarkers: "Microscopía de campo oscuro en heces frescas mostrando bacilos móviles en 'dardos'. Cultivo en agar selectivo TCBS confirmando Vibrio cholerae O1 o O139."
        },
        goldStandardDiagnostic: "Cultivo de materia fecal en medio selectivo TCBS (Tiosulfato-Citrato-Bilis-Sacarosa) / Prueba rápida de antígeno de Vibrio cholerae",
        standardTreatment: "Rehidratación intravenosa masiva inmediata con Solución Ringer Lactato (100 ml/kg en 3 horas en adultos: 30 ml/kg en primeros 30 min) + Sales de Rehidratación Oral (SRO OMS) en cuanto tolere + Doxiciclina 300 mg dosis única o Azitromicina",
        description: "Infección entérica bacteriana aguda por Vibrio cholerae que coloniza el intestino delgado y secreta la toxina colérica, la cual estimula irreversiblemente la adenilil ciclasa enterocítica provocando secreción masiva de agua y electrolitos hacia el lumen."
    },
    {
        id: "acute_heart_failure_pulmonary_edema",
        name: "Insuficiencia Cardíaca Aguda con Edema Agudo de Pulmón Cardiogénico",
        cie11: "BD10",
        cie10: "I50.9",
        snomedCt: "84114007 - Heart failure",
        category: "Cardiología",
        syndromes: ["Congestión Pulmonar Severa", "Insuficiencia Respiratoria Aguda", "Sobrecarga de Presión Telediastólica"],
        severity: "Crítico (Prioridad I)",
        isCanNotMiss: true,
        temporalProfile: {
            onsetSpeed: "Agudo (horas a 1 día)",
            progressionRate: "Rápido hacia asfixia 'ahogamiento en líquido propio'",
            complicationWindow: "Paro hipóxico en < 2 horas si no se alivia la precarga y postcarga"
        },
        oxygenProfile: {
            expectedSpo2Range: [78.0, 87.0],
            hypoxiaRisk: "Crítico",
            responseToOxygen: "Excelente respuesta a Ventilación No Invasiva (CPAP a 8-10 cmH2O) + Diuréticos y Vasodilatadores"
        },
        physicalSigns: {
            eyes: "Expresión de terror, ojos muy abiertos, ingurgitación venosa periocular",
            skin: "Palidez fría, sudoración copiosa y fría ('diaforesis profusa'), cianosis labial y distal",
            respiratory: "Disnea extrema que impide hablar, ortopnea a 90°, tos con expectoración rosada asalmonada y espumosa, crepitantes pulmonares en marea ascendente hasta vértices",
            cardiovascular: "Ritmo de galope ventricular (S3), ingurgitación yugular bilateral a 45°, hipertensión reactiva o hipotensión si hay shock cardiogénico"
        },
        vitalsProfile: {
            bpmRange: [110, 140],
            bpSysRange: [150, 210], // En EAP hipertensivo
            bpDiaRange: [95, 120],
            tempRange: [36.5, 37.3],
            respRateRange: [32, 44]
        },
        labProfile: {
            leukocytes: [9000, 15000],
            neutrophilsPercent: [68, 80],
            hemoglobin: [11.5, 15.0],
            platelets: [180000, 320000],
            glucose: [120, 180],
            creatinine: [1.2, 2.2],
            potassium: [3.8, 4.8],
            sodium: [134, 142],
            crp: [15, 55],
            lactate: [2.0, 4.2],
            arterialPh: [7.28, 7.36],
            specificBiomarkers: "Péptido Natriurético tipo B (BNP > 400 pg/mL o NT-proBNP > 1000-1800 pg/mL). Troponina I con elevación leve o moderada."
        },
        goldStandardDiagnostic: "Ecocardiograma transtorácico urgente (Fracción de Eyección reducida o preservada y presiones de llenado elevadas) + Radiografía de tórax (alas de mariposa, líneas B de Kerley) + NT-proBNP",
        standardTreatment: "Sentar al paciente con piernas colgando + CPAP a 8-10 cmH2O con FiO2 100% + Furosemida 40-80 mg IV en bolo + Nitroglicerina sublingual o infusión intravenosa si PAS > 110 mmHg",
        description: "Aumento brusco de la presión hidrostática en los capilares pulmonares que supera la presión oncótica plasmática, forzando la trasudación masiva de líquido hacia el intersticio y alvéolos, impidiendo el intercambio de oxígeno."
    }
];

// Mapeo auxiliar de síntomas comunes a conceptos estandarizados SNOMED-CT / CIE-11
const CLINICAL_SYMPTOM_MAP = {
    "ojos rojos": { term: "Inyección ciliar o conjuntival", snomed: "193889008", icd11: "9A03" },
    "manchas en la piel": { term: "Exantema o erupción cutánea", snomed: "271807003", icd11: "ME60" },
    "petequias": { term: "Petequias cutáneas hemorrágicas", snomed: "271813007", icd11: "ME65" },
    "ictericia": { term: "Ictericia escleral y cutánea", snomed: "18165001", icd11: "MD80" },
    "fiebre": { term: "Pirexia / Síndrome febril", snomed: "386661006", icd11: "MG26" },
    "disnea": { term: "Dificultad respiratoria / Disnea", snomed: "267036007", icd11: "MD11" },
    "dolor torácico": { term: "Dolor torácico anginoso o pleurítico", snomed: "29857009", icd11: "MD30" },
    "dolor abdominal": { term: "Dolor abdominal agudo", snomed: "21522000", icd11: "MD81" },
    "cefalea": { term: "Cefalea aguda / Dolor de cabeza", snomed: "25064002", icd11: "MB40" },
    "vomitos": { term: "Vómitos y emesis profusa", snomed: "422400008", icd11: "MD90" },
    "tos": { term: "Tos productiva o seca", snomed: "49727002", icd11: "MD10" }
};

if (typeof window !== 'undefined') {
    window.GLOBAL_DISEASES_DB = GLOBAL_DISEASES_DB;
    window.CLINICAL_SYMPTOM_MAP = CLINICAL_SYMPTOM_MAP;
}
