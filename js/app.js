// js/app.js - Controlador Asistencial Clínico: Triaje Manchester, Prescripción CDSS, Búsqueda Epidemiológica y Patrones

let activeModalPatientId = null;
let activePrescriptionPatientId = null;
let currentEpidemiologyDisease = "Neumonía Bacteriana Adquirida en la Comunidad (NAC)";
let currentEpidemiologyFilter = "all";
let epidemiologyShuffleSeed = false;

// Helpers de formateo numérico clínico
function formatNum(val, decimals = 2) {
    if (val === undefined || val === null || isNaN(val)) return (0).toFixed(decimals);
    return Number(val).toFixed(decimals);
}

function formatCurrency(val) {
    if (val === undefined || val === null || isNaN(val)) return '$0.00';
    return `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function initTheme() {
    const saved = localStorage.getItem('hospital_theme_mode');
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');

    if (saved === 'dark') {
        body.classList.add('dark-mode');
        if (icon) icon.textContent = '☀️';
        if (text) text.textContent = 'Modo Día';
    } else {
        body.classList.remove('dark-mode');
        if (icon) icon.textContent = '🌙';
        if (text) text.textContent = 'Modo Noche';
    }
}

function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');
    localStorage.setItem('hospital_theme_mode', isDark ? 'dark' : 'light');

    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    if (text) text.textContent = isDark ? 'Modo Día' : 'Modo Noche';

    if (window.soundManager) window.soundManager.playClick();
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    // Inicializar suscripción a eventos clínicos
    window.hospitalGame.subscribe((data, logs, dayReport, activeEvent) => {
        renderTopBar(data.hospital);
        renderPatientsGrid(data.patients, data.hospital);
        renderEventLogs(logs);
        updateStoreModal(data.hospital);
        handleBlackoutState(data.hospital);
        handleActiveEventModal(activeEvent);

        if (data.hospital.dayEnded && dayReport) {
            renderScoreboardModal(dayReport);
        }
    });

    window.hospitalGame.start();
    setupGlobalControls();
    window.hospitalGame.notify();
    startECGLoops();
    populateEpidemiologyDiseases();
});

// Renderizado de Barra Superior y Contadores Hospitalarios
function renderTopBar(hospital) {
    const fundsEl = document.getElementById('hud-funds');
    const repEl = document.getElementById('hud-reputation');
    const timeEl = document.getElementById('hud-time');
    const dayEl = document.getElementById('hud-day');
    const shiftProgressEl = document.getElementById('hud-shift-progress');
    const shiftPercentText = document.getElementById('hud-shift-percent');
    const cluesTextEl = document.getElementById('hud-clues-text');

    if (fundsEl) fundsEl.textContent = formatCurrency(hospital.funds);
    if (repEl) repEl.textContent = `${formatNum(hospital.reputation, 2)}%`;
    if (timeEl) timeEl.textContent = hospital.time;
    if (dayEl) dayEl.textContent = `DÍA ${hospital.day}`;

    // Progreso del turno clínico (07:00 a 22:00 = 15 horas = 900 minutos)
    const [hours, minutes] = hospital.time.split(':').map(Number);
    const elapsedMinutes = Math.max(0, (hours - hospital.dayStartHour) * 60 + minutes);
    const totalMinutes = (hospital.dayEndHour - hospital.dayStartHour) * 60;
    const progressPercent = Math.min(100, (elapsedMinutes / totalMinutes) * 100);

    if (shiftProgressEl) shiftProgressEl.style.width = `${progressPercent.toFixed(1)}%`;
    if (shiftPercentText) shiftPercentText.textContent = `${progressPercent.toFixed(1)}%`;

    if (cluesTextEl && hospital.clues) {
        cluesTextEl.textContent = `Consulta (${hospital.clues.available}/${hospital.clues.maxDaily})`;
    }

    // Personal Médico
    const docFree = hospital.staff.doctors.total - hospital.staff.doctors.busy;
    const nurseFree = hospital.staff.nurses.total - hospital.staff.nurses.busy;
    const docEl = document.getElementById('hud-doctors');
    const nurseEl = document.getElementById('hud-nurses');
    if (docEl) docEl.textContent = `${docFree}/${hospital.staff.doctors.total}`;
    if (nurseEl) nurseEl.textContent = `${nurseFree}/${hospital.staff.nurses.total}`;

    // Suministros
    const sup = hospital.supplies;
    const supAnt = document.getElementById('sup-antibiotics');
    const supSer = document.getElementById('sup-serums');
    const supAna = document.getElementById('sup-analgesics');
    const supOxy = document.getElementById('sup-oxygen');
    const supIns = document.getElementById('sup-insulin');

    if (supAnt) supAnt.textContent = sup.antibiotics;
    if (supSer) supSer.textContent = sup.serums;
    if (supAna) supAna.textContent = sup.analgesics;
    if (supOxy) supOxy.textContent = sup.oxygen;
    if (supIns) supIns.textContent = sup.insulin;

    // Selector de velocidad
    document.querySelectorAll('.speed-btn').forEach(btn => {
        const speed = parseInt(btn.dataset.speed);
        if (speed === hospital.gameSpeed) {
            btn.classList.add('bg-teal-700', 'text-white', 'font-bold');
            btn.classList.remove('bg-slate-100', 'text-slate-700');
        } else {
            btn.classList.remove('bg-teal-700', 'text-white', 'font-bold');
            btn.classList.add('bg-slate-100', 'text-slate-700');
        }
    });
}

// Banner de Contingencia Eléctrica
function handleBlackoutState(hospital) {
    const banner = document.getElementById('blackout-warning-bar');
    const secondsEl = document.getElementById('blackout-seconds-left');
    if (!banner) return;

    if (hospital.isBlackoutActive) {
        banner.classList.remove('hidden');
        if (secondsEl) secondsEl.textContent = hospital.blackoutTimer;
    } else {
        banner.classList.add('hidden');
    }
}

function resolveBlackoutQuick() {
    if (window.hospitalGame.data.hospital.funds >= 500) {
        window.hospitalGame.data.hospital.funds -= 500;
        window.hospitalGame.data.hospital.dayStats.expenses += 500;
        window.hospitalGame.resolveBlackout();
    } else {
        alert('Fondos insuficientes para combustible ($500 necesarios).');
    }
}

// Eventos Inesperados Mayores
function handleActiveEventModal(activeEvent) {
    const modal = document.getElementById('event-modal');
    if (!modal) return;

    if (activeEvent) {
        document.getElementById('event-icon').textContent = activeEvent.icon || '📢';
        document.getElementById('event-title').textContent = activeEvent.title;
        document.getElementById('event-desc').textContent = activeEvent.description;
        document.getElementById('event-effect').textContent = activeEvent.effectText;

        const actionBtn = document.getElementById('event-action-btn');
        const cancelBtn = document.getElementById('event-cancel-btn');

        actionBtn.textContent = activeEvent.actionButtonText || 'Aceptar';
        if (activeEvent.cancelButtonText) {
            cancelBtn.textContent = activeEvent.cancelButtonText;
            cancelBtn.classList.remove('hidden');
        } else {
            cancelBtn.classList.add('hidden');
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function executeCurrentEventAction() {
    const event = window.hospitalGame.activeEventModal;
    if (event && event.executeAction) {
        event.executeAction();
    }
    window.hospitalGame.dismissEventModal();
}

function dismissEventModal() {
    window.hospitalGame.dismissEventModal();
}

// Renderizado de Cuadrícula de Camas de Hospital
function renderPatientsGrid(patients, hospital) {
    const container = document.getElementById('patients-grid');
    if (!container) return;
    container.innerHTML = '';

    patients.forEach(patient => {
        const card = createPatientCard(patient, hospital);
        container.appendChild(card);
    });
}

function createPatientCard(patient, hospital) {
    const card = document.createElement('div');
    const isDeceased = patient.severity === 'deceased';
    const isCritical = patient.severity === 'critical' || patient.health < 30 || patient.isSpecialCritical;
    const isSevere = !isCritical && (patient.severity === 'severe' || patient.health < 50);
    const isHealing = patient.isUnderTreatment;
    const isCured = patient.severity === 'cured' || (patient.cureProgress >= 100 && patient.health >= 90);

    let cardClasses = 'card-medical-clean p-3.5 sm:p-4 flex flex-col justify-between relative ';
    if (isDeceased) {
        cardClasses += 'card-deceased';
    } else if (isCritical) {
        cardClasses += 'priority-urgent';
    } else if (isSevere) {
        cardClasses += 'priority-high';
    } else if (isHealing) {
        cardClasses += 'card-healing';
    } else if (isCured) {
        cardClasses += 'priority-stable border-teal-400';
    } else {
        cardClasses += 'priority-stable';
    }

    card.className = cardClasses;

    // Badges de Estado Clínico Estandarizados
    const severityConfig = {
        critical: { label: 'CRÍTICO • PRIORIDAD I', bg: 'bg-red-50 text-red-700 border-red-200' },
        severe: { label: 'URGENTE • PRIORIDAD II', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
        moderate: { label: 'MODERADO • PRIORIDAD III', bg: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
        stable: { label: 'ESTABLE • PRIORIDAD IV', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        cured: { label: 'ALTA AUTORIZADA', bg: 'bg-teal-50 text-teal-800 border-teal-300' },
        deceased: { label: 'DECESO CERTIFICADO', bg: 'bg-slate-100 text-slate-600 border-slate-300' }
    };
    const sev = severityConfig[patient.severity] || severityConfig.moderate;

    const healthVal = Math.max(0, Math.min(100, Number(patient.health.toFixed(2))));
    const healthPercent = Number(healthVal.toFixed(2));
    const healthColor = healthPercent > 65 ? 'bg-emerald-600' : healthPercent > 30 ? 'bg-amber-500' : 'bg-red-600';

    const hasAllergy = patient.allergy && !patient.allergy.toLowerCase().includes('sin') && !patient.allergy.toLowerCase().includes('ninguna');

    // Iniciales formales del paciente
    const names = (patient.name || 'Paciente').trim().split(' ');
    const initials = names.length > 1 ? (names[0][0] + names[names.length - 1][0]).toUpperCase() : names[0].substring(0, 2).toUpperCase();

    // Alerta sutil y profesional de urgencia
    let bannerHtml = '';
    if (isDeceased) {
        bannerHtml = `
            <div class="mb-2 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-between border border-slate-300">
                <span>Constatación médica: Deceso confirmado</span>
                <span class="font-mono-numbers text-[10px] text-slate-500 font-bold">ASISTOLIA</span>
            </div>
        `;
    } else if (patient.health <= 25) {
        bannerHtml = `
            <div class="mb-2 px-2.5 py-1 rounded bg-red-50 text-red-800 text-xs font-semibold flex items-center justify-between border border-red-300">
                <span>Alerta de Telemetría: Deterioro hemodinámico severo</span>
                <span class="font-mono-numbers text-[10px] bg-red-700 text-white px-1.5 py-0.2 rounded font-bold">URGENTE</span>
            </div>
        `;
    }

    card.innerHTML = `
        ${bannerHtml}

        <!-- Cabecera de la Cama: Cama, Estado y Alergia -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <div class="flex items-center space-x-2">
                <span class="font-mono-numbers font-bold text-xs uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    ${patient.bedNumber}
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded border ${sev.bg} font-semibold">
                    ${sev.label}
                </span>
            </div>
            
            ${hasAllergy ? `
                <span class="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-700 font-semibold border border-red-200 truncate max-w-[140px]" title="Alergia documentada: ${patient.allergy}">
                    Alergia: ${patient.allergy.split('(')[0].trim()}
                </span>
            ` : ''}
        </div>

        <!-- Ficha del Paciente: Iniciales, Nombre, Edad, Sexo y Sangre -->
        <div class="mt-2.5 flex items-center space-x-2.5">
            <div class="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center font-bold text-xs select-none shadow-xs shrink-0">
                ${isDeceased ? 'DEC' : initials}
            </div>

            <div class="flex-1 min-w-0">
                <div class="flex items-baseline justify-between">
                    <h3 class="font-bold text-sm text-slate-900 truncate ${isDeceased ? 'line-through text-slate-400' : ''}" title="${patient.name}">
                        ${patient.name}
                    </h3>
                    <span class="text-[11px] font-mono-numbers text-slate-500 font-medium">${patient.age} años</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1.5 flex-wrap">
                    <span>${patient.gender === 'M' ? 'Masc.' : 'Fem.'}</span>
                    <span>•</span>
                    <span class="badge-blood-type">${patient.bloodType}</span>
                    <span>•</span>
                    <span class="truncate text-[10px] text-slate-500 max-w-[110px]">${patient.insurance ? patient.insurance.split('-')[0].trim() : 'FONASA'}</span>
                </div>
            </div>
        </div>

        <!-- Diagnóstico de Ingreso -->
        <div class="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div class="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                <span class="font-semibold uppercase tracking-wider text-slate-600">Diagnóstico de Ingreso</span>
                <span class="font-mono-numbers font-semibold text-teal-800 bg-white px-1.5 py-0.2 rounded border border-slate-200">${patient.cie10Code ? patient.cie10Code.split(' - ')[0] : 'CIE-10'}</span>
            </div>
            <div class="font-semibold text-xs ${isDeceased ? 'text-red-700' : 'text-slate-900'} truncate" title="${patient.disease}">
                ${patient.disease}
            </div>
            ${isHealing ? `
                <div class="mt-1 flex items-center space-x-1 text-[11px] text-teal-800 font-medium">
                    <span>Infusión activa en curso (${formatNum(patient.treatmentTimer, 0)}/${patient.treatmentTotalDuration}s)</span>
                </div>
            ` : ''}
        </div>

        <!-- Constantes Vitales - Telemetría de Cabecera -->
        <div class="mt-2 grid grid-cols-4 gap-1.5 font-mono-numbers text-center">
            <div class="vital-metric-chip">
                <span class="v-label">FC</span>
                <span class="v-value ${isDeceased ? 'text-slate-400' : 'text-emerald-700'}">${isDeceased ? 0 : Math.round(patient.vitals.bpm)}</span>
                <span class="v-unit">lpm</span>
            </div>
            <div class="vital-metric-chip">
                <span class="v-label">PA</span>
                <span class="v-value ${isDeceased ? 'text-slate-400' : 'text-sky-800'} text-[11px]">${isDeceased ? '0/0' : `${Math.round(patient.vitals.bpSys)}/${Math.round(patient.vitals.bpDia)}`}</span>
                <span class="v-unit">mmHg</span>
            </div>
            <div class="vital-metric-chip">
                <span class="v-label">SpO2</span>
                <span class="v-value ${isDeceased ? 'text-slate-400' : patient.vitals.spo2 < 92 ? 'text-red-600' : 'text-teal-800'}">${isDeceased ? 0 : formatNum(patient.vitals.spo2, 0)}%</span>
                <span class="v-unit">Sat O2</span>
            </div>
            <div class="vital-metric-chip">
                <span class="v-label">TEMP</span>
                <span class="v-value ${isDeceased ? 'text-slate-400' : patient.vitals.temp > 38 ? 'text-amber-700' : 'text-slate-700'}">${isDeceased ? '--' : `${formatNum(patient.vitals.temp, 1)}`}</span>
                <span class="v-unit">°C</span>
            </div>
        </div>

        <!-- Barras de Estabilidad y Evolución -->
        <div class="mt-2 space-y-1">
            <div>
                <div class="flex items-center justify-between text-[10px] mb-0.5">
                    <span class="text-slate-500 font-medium">Estabilidad Clínica</span>
                    <span class="font-mono-numbers font-bold ${isDeceased ? 'text-slate-400' : healthColor.replace('bg-', 'text-')}">${formatNum(patient.health, 1)}%</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div class="${healthColor} h-full rounded-full transition-all duration-300" style="width: ${healthPercent}%"></div>
                </div>
            </div>

            <div>
                <div class="flex items-center justify-between text-[10px] mb-0.5">
                    <span class="text-slate-500 font-medium">Evolución Terapéutica</span>
                    <span class="font-mono-numbers font-bold text-teal-800">${formatNum(patient.cureProgress, 1)}%</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-teal-700 h-full rounded-full transition-all duration-300" style="width: ${Number(patient.cureProgress.toFixed(2))}%"></div>
                </div>
            </div>
        </div>

        <!-- Botonera Asistencial -->
        <div class="mt-2.5 pt-2 border-t border-slate-200 flex items-center space-x-1.5">
            ${isDeceased ? `
                <button onclick="certifyDeath(${patient.id})" class="btn-medical flex-1 py-1.5 px-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center space-x-1 shadow-xs">
                    <span>Certificar Defunción</span>
                </button>
            ` : isCured ? `
                <button onclick="dischargePatient(${patient.id})" class="btn-medical flex-1 py-1.5 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs flex items-center justify-center space-x-1">
                    <span>Firmar Alta Médica</span>
                </button>
            ` : isHealing ? `
                <div class="flex-1 py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium flex items-center justify-center space-x-1">
                    <span>Tratamiento en curso...</span>
                </div>
            ` : `
                <button onclick="openPrescriptionModal(${patient.id})" class="btn-medical flex-1 py-1.5 px-2 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs shadow-xs flex items-center justify-center space-x-1">
                    <span>Prescribir</span>
                </button>
                <button onclick="emergencyStabilize(${patient.id})" class="btn-medical py-1.5 px-2 rounded-lg bg-white hover:bg-red-50 border border-slate-300 text-red-700 font-semibold text-xs" title="Estabilización hemodinámica (+22% salud, 1 Suero)">
                    <span>Estabilizar</span>
                </button>
            `}

            <!-- BOTÓN DE FICHA CLÍNICA / DETALLE -->
            <button onclick="openDossierModal(${patient.id})" class="btn-medical px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center space-x-1 shadow-xs" title="Ver ficha clínica completa, monitor de cabecera y semiología">
                <span>Ver Ficha</span>
            </button>
        </div>
    `;

    return card;
}

// =========================================================================
// MODAL DE PRESCRIPCIÓN ASISTIDA CDSS Y PREVENCIÓN DE ERRORES DE ALERGIA
// =========================================================================
function openPrescriptionModal(patientId) {
    activePrescriptionPatientId = patientId;
    const patient = window.hospitalGame.data.patients.find(p => p.id === patientId);
    if (!patient) return;

    if (window.soundManager) window.soundManager.playClick();

    // Rellenar Ficha del Paciente
    const strip = document.getElementById('presc-patient-strip');
    const hasAllergy = patient.allergy && !patient.allergy.toLowerCase().includes('sin') && !patient.allergy.toLowerCase().includes('ninguna');

    strip.innerHTML = `
        <div>
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Cama Asignada</span>
            <strong class="text-slate-900 text-sm">${patient.bedNumber} - ${patient.name}</strong>
        </div>
        <div>
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Edad / Sexo</span>
            <span class="text-slate-800 font-mono-numbers">${patient.age} años (${patient.gender})</span>
        </div>
        <div>
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Diagnóstico</span>
            <strong class="text-teal-800">${patient.disease}</strong>
        </div>
        <div>
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Alergias Documentadas</span>
            <span class="font-bold ${hasAllergy ? 'text-rose-700 bg-rose-100 px-2 py-0.5 rounded' : 'text-slate-600'}">${patient.allergy}</span>
        </div>
    `;

    // Evaluar Alergias y Configurar CDSS
    const treatments = patient.availableTreatments || {};
    const std = treatments.standard || {
        name: "Protocolo Estándar",
        medication: patient.possibleCure,
        containsAllergens: ["Penicilina"],
        requiredResources: patient.requiredResources
    };
    const alt = treatments.alternative || {
        name: "Protocolo Alternativo Seguro",
        medication: "Esquema alternativo antialérgico",
        containsAllergens: [],
        requiredResources: patient.requiredResources
    };
    const contra = treatments.contraindicated || null;

    const bannerContainer = document.getElementById('presc-cdss-banner');
    const patientAllergy = (patient.allergy || '').toLowerCase();
    
    // Comprobar si el estándar contiene un alérgeno del paciente
    let stdIsContraindicated = false;
    let allergenMatched = "";
    if (std.containsAllergens) {
        for (const al of std.containsAllergens) {
            if (patientAllergy.includes(al.toLowerCase())) {
                stdIsContraindicated = true;
                allergenMatched = al;
                break;
            }
        }
    }

    if (stdIsContraindicated) {
        bannerContainer.innerHTML = `
            <div class="cdss-alert-box p-4 flex items-start space-x-3 text-xs text-rose-900">
                <span class="text-2xl">🛡️</span>
                <div>
                    <h5 class="font-black text-sm uppercase tracking-wide text-rose-800">
                        ALERTA DE SEGURIDAD FARMACOLÓGICA: ¡CONTRAINDICACIÓN POR ALERGIA DETECTADA!
                    </h5>
                    <p class="mt-1 leading-relaxed">
                        El paciente presenta antecedente documentado de hipersensibilidad a <strong>${patient.allergy}</strong>. El protocolo estándar de primera línea contiene compuestos afines (<strong>${allergenMatched}</strong>). Administrar este tratamiento desencadenará una <strong>reacción anafiláctica severa con riesgo vital</strong>.
                    </p>
                    <div class="mt-2.5 font-bold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        ✅ SUGERENCIA CDSS: Prescribir el <strong>Protocolo Alternativo Seguro</strong> (${alt.name}), el cual no contiene betalactámicos y es biológicamente compatible.
                    </div>
                </div>
            </div>
        `;
    } else {
        bannerContainer.innerHTML = `
            <div class="cdss-safe-box p-3.5 flex items-start space-x-3 text-xs text-emerald-900">
                <span class="text-xl">✅</span>
                <div>
                    <h5 class="font-bold text-emerald-800">Evaluación CDSS: Fármacos Compatibles y Seguros</h5>
                    <p class="mt-0.5 text-slate-700">
                        No se detectan contraindicaciones de alergia conocidas para los esquemas recomendados. Puedes administrar el Protocolo Estándar o Alternativo con tranquilidad.
                    </p>
                </div>
            </div>
        `;
    }

    // Configurar Tarjeta Estándar
    const cardStd = document.getElementById('presc-card-standard');
    cardStd.className = `treatment-card-option p-4 ${stdIsContraindicated ? 'is-contraindicated' : 'is-recommended'}`;
    const reqStd = std.requiredResources || patient.requiredResources;
    cardStd.innerHTML = `
        <div class="flex items-start justify-between flex-wrap gap-2">
            <div>
                <div class="flex items-center space-x-2">
                    <span class="font-extrabold text-sm text-slate-900">${std.name}</span>
                    ${stdIsContraindicated 
                        ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">¡ALERTA ALERGIA! ⚠️</span>` 
                        : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Primera Línea</span>`
                    }
                </div>
                <div class="text-xs text-slate-700 font-semibold mt-1">
                    Fármacos: <span class="text-teal-900">${std.medication}</span>
                </div>
                <p class="text-xs text-slate-600 mt-1 leading-relaxed">
                    ${std.description || 'Protocolo ministerial de primera línea.'}
                </p>
                <div class="mt-2 text-[11px] text-slate-500 font-mono-numbers">
                    Insumos: 💊 ${reqStd.antibiotics || 0} Antibiótico | 🧪 ${reqStd.serums || 0} Suero | 🫁 ${reqStd.oxygen || 0} Oxígeno | 🩺 ${reqStd.doctor || 0} Méd. | 🩹 ${reqStd.nurse || 0} Enf.
                </div>
            </div>

            <button onclick="executePrescription('std')" class="btn-medical px-4 py-2 rounded-xl ${
                stdIsContraindicated ? 'bg-rose-600 hover:bg-rose-700 text-white font-bold' : 'bg-teal-700 hover:bg-teal-800 text-white font-bold'
            } text-xs shadow shrink-0">
                ${stdIsContraindicated ? '⚠️ Prescribir de todas formas (Riesgo)' : 'Prescribir Protocolo Estándar'}
            </button>
        </div>
    `;

    // Configurar Tarjeta Alternativa
    const cardAlt = document.getElementById('presc-card-alternative');
    cardAlt.className = `treatment-card-option p-4 ${stdIsContraindicated ? 'is-recommended' : ''}`;
    const reqAlt = alt.requiredResources || patient.requiredResources;
    cardAlt.innerHTML = `
        <div class="flex items-start justify-between flex-wrap gap-2">
            <div>
                <div class="flex items-center space-x-2">
                    <span class="font-extrabold text-sm text-slate-900">${alt.name}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                        ${stdIsContraindicated ? '🌟 RECOMENDADO POR CDSS' : 'Esquema Alternativo'}
                    </span>
                </div>
                <div class="text-xs text-slate-700 font-semibold mt-1">
                    Fármacos: <span class="text-teal-900">${alt.medication}</span>
                </div>
                <p class="text-xs text-slate-600 mt-1 leading-relaxed">
                    ${alt.description || 'Esquema de rescate para prevenir hipersensibilidad.'}
                </p>
                <div class="mt-2 text-[11px] text-slate-500 font-mono-numbers">
                    Insumos: 💊 ${reqAlt.antibiotics || 0} Antibiótico | 🧪 ${reqAlt.serums || 0} Suero | 🫁 ${reqAlt.oxygen || 0} Oxígeno | 🩺 ${reqAlt.doctor || 0} Méd. | 🩹 ${reqAlt.nurse || 0} Enf.
                </div>
            </div>

            <button onclick="executePrescription('alt')" class="btn-medical px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow shrink-0">
                Prescribir Protocolo Seguro
            </button>
        </div>
    `;

    // Tarjeta de Consecuencias (Tratamiento Inadecuado)
    const cardContra = document.getElementById('presc-card-contraindicated');
    if (contra) {
        cardContra.classList.remove('hidden');
        cardContra.innerHTML = `
            <div class="flex items-start justify-between gap-3">
                <div>
                    <span class="text-[10px] uppercase font-bold text-rose-800 tracking-wider flex items-center space-x-1">
                        <span>⚠️</span> <span>Tratamiento Inadecuado / Consecuencias de Mala Praxis:</span>
                    </span>
                    <div class="font-bold text-rose-900 mt-0.5">${contra.name}</div>
                    <p class="text-rose-800 mt-0.5">${contra.consequence}</p>
                </div>
                <button onclick="executePrescription('contra')" class="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-900 text-xs font-bold shrink-0">
                    Probar Inadecuado
                </button>
            </div>
        `;
    } else {
        cardContra.classList.add('hidden');
    }

    const modal = document.getElementById('prescription-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closePrescriptionModal() {
    const modal = document.getElementById('prescription-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    activePrescriptionPatientId = null;
}

function executePrescription(optionKey) {
    if (!activePrescriptionPatientId) return;

    const result = window.hospitalGame.prescribeTreatment(activePrescriptionPatientId, optionKey);
    closePrescriptionModal();

    if (result.isAdverseReaction) {
        alert(`🚨 ADVERTENCIA CLÍNICA:\n\n${result.message}\n\nEl paciente ha sufrido una descompensación severa por administración de alérgeno contraindicado.`);
    }
}

// =========================================================================
// MÓDULO EPIDEMIOLÓGICO: BÚSQUEDA POR ENFERMEDAD, PATRONES Y COMPARACIÓN BD
// =========================================================================
function populateEpidemiologyDiseases() {
    const select = document.getElementById('epi-disease-select');
    if (!select) return;

    const catalog = window.CLINICAL_DISEASES_CATALOG || [];
    select.innerHTML = catalog.map(d => `<option value="${d.name}">${d.name} (${d.category})</option>`).join('');

    if (catalog.length > 0) {
        currentEpidemiologyDisease = catalog[0].name;
        renderEpidemiologyDiseaseCard(catalog[0]);
    }
}

function openEpidemiologyModal() {
    if (window.soundManager) window.soundManager.playClick();
    populateEpidemiologyDiseases();
    onEpidemiologyDiseaseChange(currentEpidemiologyDisease);

    const modal = document.getElementById('epidemiology-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeEpidemiologyModal() {
    const modal = document.getElementById('epidemiology-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function onEpidemiologyDiseaseChange(diseaseName) {
    currentEpidemiologyDisease = diseaseName;
    const catalog = window.CLINICAL_DISEASES_CATALOG || [];
    const disease = catalog.find(d => d.name === diseaseName);
    if (disease) {
        renderEpidemiologyDiseaseCard(disease);
    }

    // Ocultar paneles de resultados previos
    document.getElementById('epi-patterns-panel').classList.add('hidden');
    document.getElementById('epi-comparison-panel').classList.add('hidden');

    renderEpidemiologyCohort();
}

function renderEpidemiologyDiseaseCard(d) {
    const card = document.getElementById('epi-disease-info-card');
    if (!card) return;

    card.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
                <span class="font-bold text-teal-800 text-sm">${d.name}</span>
                <span class="text-slate-500 font-mono-numbers text-[11px] ml-2">CIE-10: ${d.cie10} | CIE-11: ${d.cie11}</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">${d.category}</span>
        </div>
        <p class="text-slate-600 mt-1 text-xs leading-relaxed">${d.description}</p>
        <div class="mt-1.5 flex flex-wrap gap-1">
            <span class="text-[10px] text-slate-500 font-semibold mr-1">Síntomas guía:</span>
            ${d.symptoms.map(s => `<span class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-700">${s}</span>`).join('')}
        </div>
    `;
}

// Renderizado de Cohorte de Pacientes Desordenada con Filtros
function renderEpidemiologyCohort() {
    const grid = document.getElementById('epi-patients-grid');
    const countText = document.getElementById('epi-patients-count-text');
    if (!grid) return;

    let cohort = window.hospitalDB.getPatientsByDisease(currentEpidemiologyDisease);

    // Aplicar Filtro
    if (currentEpidemiologyFilter === 'discharged') {
        cohort = cohort.filter(p => p.status.includes('Alta') || p.status.includes('Salvado'));
    } else if (currentEpidemiologyFilter === 'hospitalized') {
        cohort = cohort.filter(p => p.status === 'Hospitalizado');
    } else if (currentEpidemiologyFilter === 'deceased') {
        cohort = cohort.filter(p => p.status.includes('Fallecido') || p.status.includes('Óbito'));
    } else if (currentEpidemiologyFilter === 'pediatric') {
        cohort = cohort.filter(p => Number(p.age) < 18);
    } else if (currentEpidemiologyFilter === 'geriatric') {
        cohort = cohort.filter(p => Number(p.age) >= 65);
    } else if (currentEpidemiologyFilter === 'allergic') {
        cohort = cohort.filter(p => p.allergy && !p.allergy.toLowerCase().includes('sin') && !p.allergy.toLowerCase().includes('ninguna'));
    }

    // Desordenar si el usuario pulsó el botón
    if (epidemiologyShuffleSeed) {
        cohort = cohort.slice().sort(() => Math.random() - 0.5);
    }

    if (countText) {
        countText.textContent = `Mostrando ${cohort.length} paciente(s) con diagnóstico de ${currentEpidemiologyDisease}`;
    }

    if (cohort.length === 0) {
        grid.innerHTML = `
            <div class="col-span-2 text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                No se encontraron expedientes para este filtro en la base de datos.
            </div>
        `;
        return;
    }

    grid.innerHTML = cohort.map(p => {
        let statusBadge = '';
        if (p.status.includes('Alta') || p.status.includes('Salvado')) {
            statusBadge = `<span class="px-2 py-0.5 rounded-full status-pill-discharged text-[10px] font-bold">Alta Médica 🏆</span>`;
        } else if (p.status.includes('Fallecido') || p.status.includes('Óbito')) {
            statusBadge = `<span class="px-2 py-0.5 rounded-full status-pill-deceased text-[10px] font-bold">Óbito 💀</span>`;
        } else {
            statusBadge = `<span class="px-2 py-0.5 rounded-full status-pill-hospitalized text-[10px] font-semibold">Hospitalizado 🩺</span>`;
        }

        const syms = Array.isArray(p.symptoms) ? p.symptoms : (p.symptoms ? [p.symptoms] : []);
        const hasAllergy = p.allergy && !p.allergy.toLowerCase().includes('sin') && !p.allergy.toLowerCase().includes('ninguna');

        return `
            <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 hover:border-teal-400 transition-all shadow-xs flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <span class="text-xl">${p.avatar || '👤'}</span>
                            <div>
                                <h4 class="font-bold text-xs sm:text-sm text-slate-900">${p.name}</h4>
                                <span class="text-[10px] text-slate-500 font-mono-numbers">${p.recordId} • ${p.age} años (${p.gender})</span>
                            </div>
                        </div>
                        ${statusBadge}
                    </div>

                    <div class="mt-2 text-xs">
                        <div class="text-[11px] text-slate-600">
                            Cama: <strong class="text-slate-800">${p.bedNumber}</strong> | Servicio: <span class="text-slate-700">${p.serviceUnit || 'Medicina'}</span>
                        </div>
                        <div class="text-[11px] mt-0.5 ${hasAllergy ? 'text-rose-700 font-bold' : 'text-slate-500'}">
                            Alergia: ${p.allergy}
                        </div>
                    </div>

                    <!-- Lista de Síntomas Históricos Completos -->
                    <div class="mt-2 pt-1.5 border-t border-slate-200">
                        <span class="text-[10px] uppercase font-bold text-slate-500 block mb-1">Síntomas Documentados:</span>
                        <div class="flex flex-wrap gap-1">
                            ${syms.map(s => `<span class="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-700">${s}</span>`).join('')}
                        </div>
                    </div>
                </div>

                <div class="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span class="text-[10px] text-slate-400 font-mono-numbers">Adm: ${p.admissionDate || 'Día 1'}</span>
                    <button onclick="openEhrDetailModal('${p.recordId}')" class="btn-medical px-3 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs flex items-center space-x-1" title="Ver ficha clínica completa y constantes vitales">
                        <span>📄</span>
                        <span>Ver Condiciones & Expediente</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function filterEpidemiologyList(filterType) {
    currentEpidemiologyFilter = filterType;
    document.querySelectorAll('[id^="epi-filter-"]').forEach(btn => {
        btn.className = "px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all";
    });
    const activeBtn = document.getElementById(`epi-filter-${filterType}`);
    if (activeBtn) {
        activeBtn.className = "px-2.5 py-1 rounded-lg bg-teal-600 text-white text-xs font-bold transition-all shadow-xs";
    }
    renderEpidemiologyCohort();
}

function shuffleEpidemiologyList() {
    epidemiologyShuffleSeed = true;
    renderEpidemiologyCohort();
    if (window.soundManager) window.soundManager.playClick();
}

// 🧠 BOTÓN PARA ENCONTRAR PATRONES CLÍNICOS
function triggerPatternDiscovery() {
    const patterns = window.hospitalDB.calculateDiseasePatterns(currentEpidemiologyDisease);
    const panel = document.getElementById('epi-patterns-panel');
    if (!panel) return;

    if (!patterns) {
        alert('No hay suficientes pacientes con esta patología en la base de datos para extraer patrones.');
        return;
    }

    if (window.soundManager) window.soundManager.playClick();

    panel.innerHTML = `
        <div class="bg-teal-50/70 p-4 sm:p-5 rounded-2xl border-2 border-teal-300 text-xs shadow-xs">
            <div class="flex items-center justify-between pb-3 border-b border-teal-200">
                <div class="flex items-center space-x-2">
                    <span class="text-xl">🧠</span>
                    <div>
                        <h4 class="font-extrabold text-sm text-teal-900 uppercase">Patrones Clínicos Descubiertos en ${patterns.diseaseName}</h4>
                        <p class="text-[11px] text-teal-700">Análisis computarizado sobre una cohorte de <strong>${patterns.totalCases} paciente(s)</strong></p>
                    </div>
                </div>
                <button onclick="document.getElementById('epi-patterns-panel').classList.add('hidden')" class="text-teal-700 hover:text-teal-950 font-bold p-1">✕</button>
            </div>

            <!-- Grilla de Estadísticas de Patrón -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 font-mono-numbers">
                <div class="bg-white p-2.5 rounded-xl border border-teal-200 shadow-xs">
                    <span class="text-[10px] text-slate-500 uppercase block font-bold">Edad Promedio</span>
                    <strong class="text-base text-teal-900 font-black">${patterns.avgAge} años</strong>
                    <span class="text-[10px] text-slate-400 block mt-0.5">Rango: ${patterns.minAge} a ${patterns.maxAge}a</span>
                </div>

                <div class="bg-white p-2.5 rounded-xl border border-teal-200 shadow-xs">
                    <span class="text-[10px] text-slate-500 uppercase block font-bold">Tasa Supervivencia</span>
                    <strong class="text-base text-emerald-700 font-black">${patterns.cureRate}%</strong>
                    <span class="text-[10px] text-slate-400 block mt-0.5">${patterns.curedCount} curados / ${patterns.deceasedCount} óbitos</span>
                </div>

                <div class="bg-white p-2.5 rounded-xl border border-teal-200 shadow-xs">
                    <span class="text-[10px] text-slate-500 uppercase block font-bold">Tasa de Mortalidad</span>
                    <strong class="text-base ${patterns.mortalityRate > 15 ? 'text-rose-700' : 'text-slate-800'} font-black">${patterns.mortalityRate}%</strong>
                    <span class="text-[10px] text-slate-400 block mt-0.5">Letalidad en sala</span>
                </div>

                <div class="bg-white p-2.5 rounded-xl border border-teal-200 shadow-xs">
                    <span class="text-[10px] text-slate-500 uppercase block font-bold">Prevalencia Alergias</span>
                    <strong class="text-base text-amber-700 font-black">${patterns.allergyPrevalence.percentage}%</strong>
                    <span class="text-[10px] text-slate-400 block mt-0.5">${patterns.allergyPrevalence.totalAllergic} con alergia documentada</span>
                </div>
            </div>

            <!-- Síntomas Más Prevalentes con Barras Visuales -->
            <div class="mt-3.5 bg-white p-3.5 rounded-xl border border-teal-200">
                <span class="text-[11px] uppercase font-bold text-teal-900 block mb-2">
                    📊 Síntomas Más Frecuentes en esta Enfermedad (Jerarquía de Prevalencia):
                </span>
                <div class="space-y-2">
                    ${patterns.topSymptoms.slice(0, 5).map(s => `
                        <div>
                            <div class="flex items-center justify-between text-xs mb-0.5 font-semibold">
                                <span class="text-slate-800">${s.symptom}</span>
                                <span class="font-mono-numbers text-teal-800">${s.percentage}% (${s.count} casos)</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                <div class="bg-teal-600 h-full rounded-full" style="width: ${s.percentage}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Conclusiones Médicas del Motor de Patrones -->
            <div class="mt-3 bg-white p-3 rounded-xl border border-teal-200 text-xs text-slate-700">
                <span class="font-bold text-teal-900 block mb-1">💡 Conclusión Asistencial Extraída por el Sistema:</span>
                <p class="leading-relaxed">
                    La cohorte de <strong>${patterns.diseaseName}</strong> se concentra en pacientes con edad media de <strong>${patterns.avgAge} años</strong>. El síntoma patognomónico principal es <strong>'${patterns.topSymptoms[0]?.symptom || 'Fiebre'}'</strong> (presente en el ${patterns.topSymptoms[0]?.percentage || 100}% de los casos). Se registran <strong>${patterns.adverseReactionsCount} error(es) por mala praxis farmacológica</strong> en el historial. Mantener la recomendación CDSS de verificación de alergias previo a infusión.
                </p>
            </div>
        </div>
    `;

    panel.classList.remove('hidden');
}

// ⚖️ BOTÓN PARA COMPARAR CON LÍNEA BASE DE LA BASE DE DATOS
function triggerBaselineComparison() {
    const comparison = window.hospitalDB.compareDiseaseWithBaseline(currentEpidemiologyDisease);
    const panel = document.getElementById('epi-comparison-panel');
    if (!panel) return;

    if (!comparison) {
        alert('No hay suficientes datos hospitalarios para generar la comparación.');
        return;
    }

    if (window.soundManager) window.soundManager.playClick();

    const d = comparison.disease;
    const b = comparison.baseline;
    const delta = comparison.deltas;

    panel.innerHTML = `
        <div class="bg-sky-50/70 p-4 sm:p-5 rounded-2xl border-2 border-sky-300 text-xs shadow-xs">
            <div class="flex items-center justify-between pb-3 border-b border-sky-200">
                <div class="flex items-center space-x-2">
                    <span class="text-xl">⚖️</span>
                    <div>
                        <h4 class="font-extrabold text-sm text-sky-900 uppercase">Comparación Frente a Frente: Cohorte vs Línea Base Hospitalaria</h4>
                        <p class="text-[11px] text-sky-700">Contrastando ${d.diseaseName} contra el promedio general del hospital (${b.totalPatients} pacientes registrados)</p>
                    </div>
                </div>
                <button onclick="document.getElementById('epi-comparison-panel').classList.add('hidden')" class="text-sky-700 hover:text-sky-950 font-bold p-1">✕</button>
            </div>

            <div class="overflow-x-auto mt-3 rounded-xl border border-sky-200 bg-white">
                <table class="w-full text-left border-collapse text-xs">
                    <thead class="bg-slate-50 text-slate-600 text-[10px] uppercase font-mono-numbers border-b border-sky-200">
                        <tr>
                            <th class="py-2.5 px-3">Variable Clínica</th>
                            <th class="py-2.5 px-3 text-teal-800 font-bold">${d.diseaseName}</th>
                            <th class="py-2.5 px-3 text-slate-700 font-bold">Línea Base Hospital</th>
                            <th class="py-2.5 px-3 text-center">Desviación (Delta)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 font-mono-numbers">
                        <tr>
                            <td class="py-2 px-3 font-semibold text-slate-800">Tasa de Mortalidad</td>
                            <td class="py-2 px-3 font-bold ${d.mortalityRate > b.mortalityRate ? 'text-rose-700' : 'text-emerald-700'}">${d.mortalityRate}%</td>
                            <td class="py-2 px-3 text-slate-600">${b.mortalityRate}%</td>
                            <td class="py-2 px-3 text-center font-bold ${delta.mortalityDelta > 0 ? 'text-rose-700' : 'text-emerald-700'}">
                                ${delta.mortalityDelta > 0 ? '+' : ''}${delta.mortalityDelta}%
                            </td>
                        </tr>
                        <tr>
                            <td class="py-2 px-3 font-semibold text-slate-800">Edad Media de Pacientes</td>
                            <td class="py-2 px-3 font-bold text-slate-900">${d.avgAge} años</td>
                            <td class="py-2 px-3 text-slate-600">${b.avgAge} años</td>
                            <td class="py-2 px-3 text-center font-bold ${delta.ageDelta > 0 ? 'text-amber-700' : 'text-sky-700'}">
                                ${delta.ageDelta > 0 ? '+' : ''}${delta.ageDelta} años
                            </td>
                        </tr>
                        <tr>
                            <td class="py-2 px-3 font-semibold text-slate-800">Prevalencia de Alergias</td>
                            <td class="py-2 px-3 font-bold text-amber-700">${d.allergyPrevalence.percentage}%</td>
                            <td class="py-2 px-3 text-slate-600">${b.allergyPercent}%</td>
                            <td class="py-2 px-3 text-center font-bold text-slate-700">
                                ${delta.allergyDelta > 0 ? '+' : ''}${delta.allergyDelta}%
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    panel.classList.remove('hidden');
}

// =========================================================================
// MODAL DE DETALLE / EPICRISIS OFICIAL CON HISTORIAL COMPLETO DE SÍNTOMAS
// =========================================================================
function openEhrDetailModal(recordId) {
    const registry = window.hospitalDB.getPatientsRegistry();
    const patient = registry.find(p => p.recordId === recordId);
    if (!patient) return;

    if (window.soundManager) window.soundManager.playClick();

    document.getElementById('epicrisis-record-id').textContent = patient.recordId;
    document.getElementById('epicrisis-folio').textContent = `FOLIO: ${patient.folio || 'FOL-0000'}`;
    document.getElementById('epicrisis-service-title').textContent = `Servicio de ${patient.serviceUnit || 'Medicina Interna'} • Cuidados y Hospitalización`;
    document.getElementById('epicrisis-patient-name').textContent = patient.name;
    document.getElementById('epicrisis-patient-rut').textContent = patient.rutDni || patient.dni || '--';
    document.getElementById('epicrisis-patient-age-gender').textContent = `${patient.age} años / ${patient.gender === 'M' ? 'Masculino' : 'Femenino'}`;
    document.getElementById('epicrisis-patient-blood').textContent = patient.bloodType || 'O+';
    document.getElementById('epicrisis-patient-insurance').textContent = patient.insurance || 'FONASA - Tramo A';
    document.getElementById('epicrisis-patient-allergy').textContent = patient.allergy || 'Sin antecedentes alérgicos';

    document.getElementById('epicrisis-bed-unit').textContent = `${patient.bedNumber} • ${patient.serviceUnit || 'Medicina Interna'}`;
    document.getElementById('epicrisis-cie10').textContent = patient.cie10Code || 'CIE-10 Z00.0';
    document.getElementById('epicrisis-description').textContent = patient.diseaseDescription || patient.primaryDiagnosis || '';
    document.getElementById('epicrisis-comorbidities').textContent = patient.comorbidities || 'Ninguna comorbilidad documentada';

    // Rellenar Lista Completa de Síntomas Históricos (Curado, Activo o Fallecido)
    const symptomsBox = document.getElementById('epicrisis-symptoms-list');
    const syms = Array.isArray(patient.symptoms) ? patient.symptoms : (patient.symptoms ? [patient.symptoms] : []);
    if (syms.length > 0) {
        symptomsBox.innerHTML = syms.map(s => `
            <span class="px-2.5 py-1 rounded-md bg-white border border-teal-300 text-teal-900 font-semibold shadow-xs">
                • ${s}
            </span>
        `).join('');
    } else {
        symptomsBox.innerHTML = `<span class="text-slate-400 italic">No se documentaron síntomas específicos en el ingreso.</span>`;
    }

    // Constantes Vitales de Ingreso y Egreso
    const vitIn = patient.vitals || {};
    const vitOut = patient.finalVitals || patient.vitals || {};

    document.getElementById('epicrisis-vitals-admission').innerHTML = `
        <div>Pulso: <strong>${vitIn.bpm || '--'} LPM</strong> | Presión: <strong>${vitIn.bpSys || '--'}/${vitIn.bpDia || '--'} mmHg</strong></div>
        <div>SpO2: <strong>${vitIn.spo2 || '--'}%</strong> | Temp: <strong>${vitIn.temp || '--'}°C</strong></div>
    `;

    document.getElementById('epicrisis-vitals-discharge').innerHTML = `
        <div>Pulso: <strong>${vitOut.bpm !== undefined ? vitOut.bpm : '--'} LPM</strong> | Presión: <strong>${vitOut.bpSys !== undefined ? `${vitOut.bpSys}/${vitOut.bpDia}` : '--'} mmHg</strong></div>
        <div>SpO2: <strong>${vitOut.spo2 !== undefined ? vitOut.spo2 : '--'}%</strong> | Temp: <strong>${vitOut.temp !== undefined ? vitOut.temp : '--'}°C</strong></div>
    `;

    // Estado e Historial de Tratamientos
    const statusBadge = document.getElementById('epicrisis-status-badge');
    if (patient.status.includes('Alta') || patient.status.includes('Salvado')) {
        statusBadge.textContent = 'ALTA MÉDICA (RESUELTO)';
        statusBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold status-pill-discharged';
    } else if (patient.status.includes('Fallecido') || patient.status.includes('Óbito')) {
        statusBadge.textContent = 'ÓBITO / DEFUNCIÓN';
        statusBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold status-pill-deceased';
    } else {
        statusBadge.textContent = 'HOSPITALIZADO EN SALA';
        statusBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold status-pill-hospitalized';
    }

    document.getElementById('epicrisis-notes').textContent = patient.epicrisis || 'Paciente bajo monitorización activa y plan de cuidados continuos.';

    const histBox = document.getElementById('epicrisis-treatment-history-box');
    if (patient.treatmentHistory && patient.treatmentHistory.length > 0) {
        histBox.innerHTML = `
            <span class="text-[10px] uppercase font-bold text-slate-500 block mb-1">Registro de Tratamientos y Eventos de Prescripción:</span>
            <div class="space-y-1">
                ${patient.treatmentHistory.map(th => `
                    <div class="p-2 rounded-lg ${th.hadAdverseReaction ? 'bg-rose-50 border border-rose-200 text-rose-900 font-bold' : 'bg-white border border-slate-200 text-slate-700'}">
                        [${th.timestamp || '--:--'}] ${th.treatmentName || 'Tratamiento'} - ${th.notes || ''}
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        histBox.innerHTML = `
            <span class="text-slate-400 italic">Tratamiento prescrito: ${patient.prescriptions || patient.possibleCure || 'Protocolo clínico estándar administrado según evolución.'}</span>
        `;
    }

    const modal = document.getElementById('ehr-detail-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeEhrDetailModal() {
    const modal = document.getElementById('ehr-detail-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Modal de Expediente Clínico de Cama
function openDossierModal(patientId) {
    const patient = window.hospitalGame.data.patients.find(p => p.id === patientId);
    if (!patient) return;

    if (window.soundManager) window.soundManager.playClick();

    document.getElementById('dossier-record-id').textContent = patient.recordId || `HC-2026-0${patient.id}00`;
    document.getElementById('dossier-bed').textContent = patient.bedNumber.toUpperCase();
    document.getElementById('dossier-name').textContent = patient.name;
    document.getElementById('dossier-dni').textContent = patient.rutDni || patient.dni || "15.420.910-K";
    document.getElementById('dossier-age-gender').textContent = `${patient.age} años / ${patient.gender === 'M' ? 'Masculino' : 'Femenino'}`;
    document.getElementById('dossier-blood').textContent = patient.bloodType;
    document.getElementById('dossier-insurance').textContent = patient.insurance || "FONASA - Tramo A";
    document.getElementById('dossier-allergy').textContent = patient.allergy;
    document.getElementById('dossier-cie10').textContent = patient.cie10Code || "J18.9 - Diagnóstico Clínico";
    document.getElementById('dossier-description').textContent = patient.diseaseDescription;

    const symptomsContainer = document.getElementById('dossier-symptoms');
    symptomsContainer.innerHTML = (patient.symptoms || []).map(s => `<span class="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 text-[11px] font-medium">• ${s}</span>`).join('');

    document.getElementById('dossier-possible-cure').textContent = patient.possibleCure;

    const modal = document.getElementById('dossier-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeDossierModal() {
    const modal = document.getElementById('dossier-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Registro de Eventos Clínicos
function renderEventLogs(logs) {
    const list = document.getElementById('event-logs-list');
    if (!list) return;

    list.innerHTML = logs.map(log => {
        const typeClasses = {
            info: 'text-slate-700 border-l-3 border-teal-600 bg-slate-50',
            success: 'text-emerald-800 border-l-3 border-emerald-600 bg-emerald-50/50',
            warning: 'text-amber-800 border-l-3 border-amber-600 bg-amber-50/50',
            danger: 'text-rose-800 border-l-3 border-rose-600 bg-rose-50/60 font-semibold'
        };
        const cls = typeClasses[log.type] || typeClasses.info;

        return `
            <div class="px-2.5 py-1 rounded text-xs mb-1 ${cls}">
                <span class="font-mono-numbers text-[10px] text-slate-400 mr-1.5">[${log.time}]</span>
                <span>${log.text}</span>
            </div>
        `;
    }).join('');
}

// Trazador Continuo ECG en Canvas con Estilo Médico Limpio
function startECGLoops() {
    let t = 0;
    function renderECGFrame() {
        t += 1;
        const patients = window.hospitalGame.data.patients;

        patients.forEach(p => {
            const canvas = document.getElementById(`ecg-canvas-${p.id}`);
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;

            ctx.clearRect(0, 0, w, h);

            if (p.severity === 'deceased') {
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(0, h / 2);
                ctx.lineTo(w, h / 2);
                ctx.stroke();
                return;
            }

            const isCrit = p.severity === 'critical' || p.health < 30;
            ctx.strokeStyle = isCrit ? '#e11d48' : p.isUnderTreatment ? '#059669' : '#0d9488';
            ctx.lineWidth = 1.4;
            ctx.lineJoin = 'round';
            ctx.beginPath();

            const bpm = p.vitals.bpm || 80;
            const speed = (bpm / 60) * 2.8;

            for (let x = 0; x < w; x++) {
                const phase = (x + t * speed) % 70;
                let y = h / 2;

                if (phase > 15 && phase < 22) {
                    y -= Math.sin((phase - 15) / 7 * Math.PI) * 3;
                } else if (phase >= 25 && phase < 28) {
                    y += 3;
                } else if (phase >= 28 && phase < 33) {
                    y -= 10;
                } else if (phase >= 33 && phase < 37) {
                    y += 5;
                } else if (phase >= 42 && phase < 52) {
                    y -= Math.sin((phase - 42) / 10 * Math.PI) * 3.5;
                }

                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        });

        // Renderizar trazador ECG en el monitor de Ficha Médica Ampliada si está abierto
        if (activeModalPatientId !== null) {
            const dossierCanvas = document.getElementById('dossier-ecg-canvas');
            const dossierModal = document.getElementById('dossier-modal');
            if (dossierCanvas && dossierModal && !dossierModal.classList.contains('hidden')) {
                const p = patients.find(pat => pat.id === activeModalPatientId);
                if (p) {
                    const ctx = dossierCanvas.getContext('2d');
                    const w = dossierCanvas.width;
                    const h = dossierCanvas.height;
                    ctx.clearRect(0, 0, w, h);

                    if (p.severity === 'deceased') {
                        ctx.strokeStyle = '#e11d48';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(0, h / 2);
                        ctx.lineTo(w, h / 2);
                        ctx.stroke();
                    } else {
                        const isCrit = p.severity === 'critical' || p.health < 30;
                        ctx.strokeStyle = isCrit ? '#e11d48' : p.isUnderTreatment ? '#059669' : '#0284c7';
                        ctx.lineWidth = 1.8;
                        ctx.lineJoin = 'round';
                        ctx.beginPath();

                        const bpm = (p.vitals && p.vitals.bpm) ? p.vitals.bpm : 80;
                        const speed = (bpm / 60) * 2.8;

                        for (let x = 0; x < w; x++) {
                            const phase = (x + t * speed) % 70;
                            let y = h / 2;

                            if (phase > 15 && phase < 22) {
                                y -= Math.sin((phase - 15) / 7 * Math.PI) * 4;
                            } else if (phase >= 25 && phase < 28) {
                                y += 4;
                            } else if (phase >= 28 && phase < 33) {
                                y -= 11;
                            } else if (phase >= 33 && phase < 37) {
                                y += 6;
                            } else if (phase >= 42 && phase < 52) {
                                y -= Math.sin((phase - 42) / 10 * Math.PI) * 4;
                            }

                            if (x === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    }
                }
            }
        }

        requestAnimationFrame(renderECGFrame);
    }

    requestAnimationFrame(renderECGFrame);
}

// Acciones Directas de Cama
function emergencyStabilize(id) {
    window.hospitalGame.stabilizePatient(id);
}

function dischargePatient(id) {
    window.hospitalGame.dischargePatient(id);
}

function certifyDeath(id) {
    window.hospitalGame.certifyDeath(id);
}

// Edición de Ficha
function openEditModal(patientId) {
    activeModalPatientId = patientId;
    const patient = window.hospitalGame.data.patients.find(p => p.id === patientId);
    if (!patient) return;

    if (window.soundManager) window.soundManager.playClick();

    document.getElementById('edit-patient-title').textContent = `Modificar Ficha: ${patient.bedNumber} - ${patient.name}`;
    document.getElementById('edit-name').value = patient.name;
    document.getElementById('edit-age').value = patient.age;
    document.getElementById('edit-gender').value = patient.gender;
    document.getElementById('edit-blood').value = patient.bloodType;
    document.getElementById('edit-allergy').value = patient.allergy;
    document.getElementById('edit-disease').value = patient.disease;
    document.getElementById('edit-disease-desc').value = patient.diseaseDescription;
    document.getElementById('edit-symptoms').value = (patient.symptoms || []).join(', ');
    document.getElementById('edit-possible-cure').value = patient.possibleCure;

    const lockedHealthEl = document.getElementById('edit-health-locked');
    if (lockedHealthEl) {
        lockedHealthEl.textContent = `${formatNum(patient.health, 2)}%`;
    }

    const modal = document.getElementById('edit-patient-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeEditModal() {
    const modal = document.getElementById('edit-patient-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    activeModalPatientId = null;
}

function savePatientEdit(e) {
    e.preventDefault();
    if (!activeModalPatientId) return;

    const symptomsRaw = document.getElementById('edit-symptoms').value;
    const symptomsArr = symptomsRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const updated = {
        name: document.getElementById('edit-name').value,
        age: parseInt(document.getElementById('edit-age').value) || 30,
        gender: document.getElementById('edit-gender').value,
        bloodType: document.getElementById('edit-blood').value,
        allergy: document.getElementById('edit-allergy').value,
        disease: document.getElementById('edit-disease').value,
        diseaseDescription: document.getElementById('edit-disease-desc').value,
        symptoms: symptomsArr,
        possibleCure: document.getElementById('edit-possible-cure').value
    };

    window.hospitalGame.updatePatient(activeModalPatientId, updated);
    closeEditModal();
    if (window.soundManager) window.soundManager.playHeal();
}

// Consultas Médicas Senior
function requestMedicalClue() {
    const result = window.hospitalGame.requestClue();
    const modal = document.getElementById('clue-modal');
    const textEl = document.getElementById('clue-modal-text');
    const subtitleEl = document.getElementById('clue-modal-subtitle');

    if (!result.ok && result.reason === "no_clues") {
        textEl.textContent = result.message;
        subtitleEl.textContent = "Consultas de hoy agotadas (0/3)";
    } else {
        textEl.innerHTML = result.tip.replace(/\n/g, '<br>');
        subtitleEl.textContent = `Consultas disponibles hoy: ${result.remaining !== undefined ? result.remaining : 0}/3`;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeClueModal() {
    const modal = document.getElementById('clue-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function buyExtraClueDirect() {
    const ok = window.hospitalGame.buyExtraClue();
    if (ok) {
        closeClueModal();
        requestMedicalClue();
    } else {
        alert('Fondos insuficientes para solicitar consulta senior ($2,500 requeridos).');
    }
}

// Farmacia
function openStoreModal() {
    if (window.soundManager) window.soundManager.playClick();
    const modal = document.getElementById('store-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeStoreModal() {
    const modal = document.getElementById('store-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function updateStoreModal(hospital) {
    const balanceEl = document.getElementById('store-balance');
    if (balanceEl) balanceEl.textContent = formatCurrency(hospital.funds);

    Object.keys(hospital.storePrices).forEach(key => {
        const item = hospital.storePrices[key];
        const btn = document.getElementById(`buy-btn-${key}`);
        if (btn) {
            if (hospital.funds < item.cost) {
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    });
}

function buyStoreItem(key) {
    window.hospitalGame.buyItem(key);
}

function renderTodayOutcomes(cured, lost) {
    const curedListEl = document.getElementById('sb-cured-patients-list');
    const lostListEl = document.getElementById('sb-deceased-patients-list');
    const curedBadge = document.getElementById('sb-cured-count-badge');
    const lostBadge = document.getElementById('sb-lost-count-badge');

    if (curedBadge) curedBadge.textContent = cured.length;
    if (lostBadge) lostBadge.textContent = lost.length;

    if (curedListEl) {
        if (cured.length === 0) {
            curedListEl.innerHTML = `<div class="text-center py-4 text-slate-400 text-xs italic">Aún no se registran altas médicas en este turno.</div>`;
        } else {
            curedListEl.innerHTML = cured.map(p => `
                <div class="p-2.5 rounded-lg bg-white border border-emerald-200 flex items-center justify-between shadow-xs">
                    <div>
                        <div class="font-bold text-slate-900 flex items-center space-x-1.5">
                            <span class="text-emerald-700 font-bold">Alta</span>
                            <span>${p.name}</span>
                            <span class="text-[10px] text-slate-500 font-mono-numbers">(${p.age}a • ${p.bloodType || 'O+'})</span>
                        </div>
                        <div class="text-[11px] text-emerald-800 font-medium">${p.disease}</div>
                        <div class="text-[10px] text-slate-500 font-mono-numbers">Alta a las ${p.time || '14:00'} • Obra: ${p.insurance || 'FONASA'}</div>
                    </div>
                    <span class="badge-cured-status text-[10px]">Alta Médica</span>
                </div>
            `).join('');
        }
    }

    if (lostListEl) {
        if (lost.length === 0) {
            lostListEl.innerHTML = `<div class="text-center py-4 text-emerald-700 text-xs font-semibold">Sin defunciones registradas hoy. Desempeño asistencial conforme.</div>`;
        } else {
            lostListEl.innerHTML = lost.map(p => `
                <div class="p-2.5 rounded-lg bg-white border border-rose-200 flex items-center justify-between shadow-xs">
                    <div>
                        <div class="font-bold text-slate-900 flex items-center space-x-1.5">
                            <span class="text-red-700 font-bold">Óbito</span>
                            <span>${p.name}</span>
                            <span class="text-[10px] text-slate-500 font-mono-numbers">(${p.age}a • ${p.bloodType || 'O+'})</span>
                        </div>
                        <div class="text-[11px] text-rose-800 font-medium">${p.disease}</div>
                        <div class="text-[10px] text-slate-500 font-mono-numbers">Deceso a las ${p.time || '04:00'} • Causa: ${p.cause || 'Complicaciones'}</div>
                    </div>
                    <span class="badge-deceased-status text-[10px]">Deceso Registrado</span>
                </div>
            `).join('');
        }
    }
}

// Modal EHR & Scoreboard
function renderScoreboardModal(report) {
    document.getElementById('sb-day-title') && (document.getElementById('sb-day-title').textContent = `INFORME CLÍNICO DEL DÍA ${report.dayNumber}`);
    
    const rankEl = document.getElementById('sb-rank-grade');
    if (rankEl) {
        rankEl.textContent = report.rank;
        rankEl.className = `font-black text-5xl font-mono-numbers ${report.rankColor}`;
    }
    const rankTitleEl = document.getElementById('sb-rank-title');
    if (rankTitleEl) rankTitleEl.textContent = report.rankTitle;

    document.getElementById('sb-saved') && (document.getElementById('sb-saved').textContent = report.saved);
    document.getElementById('sb-lost') && (document.getElementById('sb-lost').textContent = report.lost);
    document.getElementById('sb-treatments') && (document.getElementById('sb-treatments').textContent = report.treatments);
    document.getElementById('sb-survival') && (document.getElementById('sb-survival').textContent = `${formatNum(report.survivalRate, 2)}%`);

    document.getElementById('sb-income') && (document.getElementById('sb-income').textContent = `+${formatCurrency(report.income)}`);
    document.getElementById('sb-expenses') && (document.getElementById('sb-expenses').textContent = `-${formatCurrency(report.expenses)}`);
    
    const netEl = document.getElementById('sb-net');
    if (netEl) {
        netEl.textContent = `${report.netProfit >= 0 ? '+' : ''}${formatCurrency(report.netProfit)}`;
        netEl.className = `font-mono-numbers font-bold text-xs sm:text-sm ${report.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`;
    }

    document.getElementById('sb-final-funds') && (document.getElementById('sb-final-funds').textContent = formatCurrency(report.finalFunds));
    document.getElementById('sb-reputation') && (document.getElementById('sb-reputation').textContent = `${formatNum(report.reputation, 2)}%`);

    const cured = report.curedPatients || window.hospitalGame?.data?.hospital?.dayStats?.curedPatients || [];
    const lost = report.deceasedPatients || window.hospitalGame?.data?.hospital?.dayStats?.deceasedPatients || [];
    renderTodayOutcomes(cured, lost);

    updateEhrKPIs();
    renderKeyDataPatientsTable();
    renderHistoryTable();
    renderPatientsRegistryTable();
    switchDbTab('scoreboard');

    const modal = document.getElementById('scoreboard-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function switchDbTab(tab) {
    const scContent = document.getElementById('db-content-scoreboard');
    const patContent = document.getElementById('db-content-patients');
    const keyContent = document.getElementById('db-content-key-patients');

    const scBtn = document.getElementById('tab-btn-scoreboard');
    const patBtn = document.getElementById('tab-btn-patients');
    const keyBtn = document.getElementById('tab-btn-key-patients');

    const activeCls = "px-4 py-1.5 rounded-xl bg-teal-700 text-white font-bold text-xs shadow flex items-center space-x-1.5 transition-all";
    const inactiveCls = "px-4 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold text-xs flex items-center space-x-1.5 transition-all";

    if (scContent) scContent.classList.add('hidden');
    if (patContent) patContent.classList.add('hidden');
    if (keyContent) keyContent.classList.add('hidden');

    if (scBtn) scBtn.className = inactiveCls;
    if (patBtn) patBtn.className = inactiveCls;
    if (keyBtn) keyBtn.className = inactiveCls;

    if (tab === 'scoreboard') {
        if (scContent) scContent.classList.remove('hidden');
        if (scBtn) scBtn.className = activeCls;
        renderHistoryTable();
    } else if (tab === 'patients') {
        if (patContent) patContent.classList.remove('hidden');
        if (patBtn) patBtn.className = activeCls;
        renderPatientsRegistryTable();
    } else {
        // 'key-patients'
        if (keyContent) keyContent.classList.remove('hidden');
        if (keyBtn) keyBtn.className = activeCls;
        renderKeyDataPatientsTable();
    }
}

function updateEhrKPIs() {
    const kpi = window.hospitalDB.getHospitalKPIs(6);
    const tocEl = document.getElementById('ehr-kpi-toc');
    const tocSub = document.getElementById('ehr-kpi-toc-sub');
    const tmbEl = document.getElementById('ehr-kpi-tmb');
    const tmbSub = document.getElementById('ehr-kpi-tmb-sub');
    const tacEl = document.getElementById('ehr-kpi-tac');
    const tacSub = document.getElementById('ehr-kpi-tac-sub');
    const fundsEl = document.getElementById('ehr-kpi-funds');

    if (tocEl) tocEl.textContent = `${formatNum(kpi.occupancyRate, 2)}%`;
    if (tocSub) tocSub.textContent = `${kpi.active} / 6 camas operativas`;
    if (tmbEl) tmbEl.textContent = `${formatNum(kpi.mortalityRate, 2)}%`;
    if (tmbSub) tmbSub.textContent = `${kpi.deceased} defunciones registradas`;
    if (tacEl) tacEl.textContent = `${formatNum(kpi.recoveryRate, 2)}%`;
    if (tacSub) tacSub.textContent = `${kpi.discharged} pacientes curados`;
    if (fundsEl) fundsEl.textContent = formatCurrency(window.hospitalGame.data.hospital.funds);
}

let keyPatientsSearchQuery = '';
let keyPatientsStatusFilter = 'all';
let keyPatientsBloodFilter = 'all';

function filterKeyPatients() {
    const searchInput = document.getElementById('key-patients-search-input');
    const statusSelect = document.getElementById('key-patients-status-filter');
    const bloodSelect = document.getElementById('key-patients-blood-filter');

    if (searchInput) keyPatientsSearchQuery = searchInput.value.toLowerCase().trim();
    if (statusSelect) keyPatientsStatusFilter = statusSelect.value;
    if (bloodSelect) keyPatientsBloodFilter = bloodSelect.value;

    renderKeyDataPatientsTable();
}

function renderKeyDataPatientsTable() {
    const list = document.getElementById('db-key-patients-table-body');
    const countEl = document.getElementById('key-patients-count-text');
    if (!list) return;

    updateEhrKPIs();

    const allPatients = window.hospitalDB.getAllPatientsWithKeyData();
    const totalCount = allPatients.length;

    let filtered = allPatients.filter(p => {
        if (keyPatientsSearchQuery) {
            const q = keyPatientsSearchQuery;
            const matchName = p.name && p.name.toLowerCase().includes(q);
            const matchRut = (p.rutDni || '').toLowerCase().includes(q);
            const matchDisease = (p.disease || '').toLowerCase().includes(q);
            const matchIns = (p.insurance || '').toLowerCase().includes(q);
            const matchBlood = (p.bloodType || '').toLowerCase().includes(q);
            const matchBed = (p.bedNumber || '').toLowerCase().includes(q);

            if (!matchName && !matchRut && !matchDisease && !matchIns && !matchBlood && !matchBed) {
                return false;
            }
        }

        if (keyPatientsStatusFilter !== 'all') {
            if (keyPatientsStatusFilter === 'alive' && p.isDeceased) return false;
            if (keyPatientsStatusFilter === 'deceased' && !p.isDeceased) return false;
            if (keyPatientsStatusFilter === 'cured' && !p.isCured) return false;
            if (keyPatientsStatusFilter === 'hospitalized' && !p.isHospitalized) return false;
        }

        if (keyPatientsBloodFilter !== 'all') {
            if (p.bloodType !== keyPatientsBloodFilter) return false;
        }

        return true;
    });

    if (countEl) countEl.textContent = `Mostrando ${filtered.length} de ${totalCount} pacientes en registro institucional`;

    if (filtered.length === 0) {
        list.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-400 text-xs">No se encontraron pacientes con los criterios seleccionados.</td></tr>`;
        return;
    }

    list.innerHTML = filtered.map(p => {
        let statusBadge = '';
        if (p.isDeceased) {
            statusBadge = `<span class="badge-deceased-status">Deceso (Óbito)</span>`;
        } else if (p.isCured) {
            statusBadge = `<span class="badge-cured-status">Alta Médica</span>`;
        } else {
            statusBadge = `<span class="badge-alive">Hospitalizado</span>`;
        }

        const cieDisplay = p.cie10Code ? p.cie10Code.split(' - ')[0] : 'CIE-10';
        const pNames = (p.name || 'Paciente').trim().split(' ');
        const pInitials = pNames.length > 1 ? (pNames[0][0] + pNames[pNames.length - 1][0]).toUpperCase() : pNames[0].substring(0, 2).toUpperCase();

        return `
            <tr class="ehr-row">
                <td class="py-2.5 px-3">
                    <div class="flex items-center space-x-2.5">
                        <div class="w-7 h-7 rounded bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center font-bold text-[10px] select-none shrink-0 shadow-xs">
                            ${p.isDeceased ? 'DEC' : pInitials}
                        </div>
                        <div>
                            <div class="text-slate-900 font-bold text-xs">${p.name}</div>
                            <div class="text-[10px] text-slate-500 font-mono-numbers">${p.rutDni} • ${p.gender === 'M' ? 'Masc.' : 'Fem.'}</div>
                        </div>
                    </div>
                </td>
                <td class="py-2.5 px-3">
                    <span class="badge-insurance-tag">${p.insurance}</span>
                </td>
                <td class="py-2.5 px-3">
                    <span class="badge-blood-type">${p.bloodType}</span>
                </td>
                <td class="py-2.5 px-3 text-slate-800 font-mono-numbers font-bold">
                    ${p.age} años
                </td>
                <td class="py-2.5 px-3">
                    ${statusBadge}
                </td>
                <td class="py-2.5 px-3">
                    <div class="text-slate-900 font-medium truncate max-w-[200px]" title="${p.disease}">${p.disease}</div>
                    <div class="text-[10px] text-teal-800 font-mono-numbers">${cieDisplay}</div>
                </td>
                <td class="py-2.5 px-3 text-center">
                    <button onclick="openEhrDetailModal('${p.recordId}')" class="btn-medical px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs flex items-center space-x-1 mx-auto" title="Ver ficha clínica y epicrisis completa">
                        <span>Ver Ficha</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

let ehrSearchQuery = '';
let ehrStatusFilter = 'all';

function filterEhrPatients() {
    const searchInput = document.getElementById('ehr-search-input');
    const statusSelect = document.getElementById('ehr-status-filter');

    if (searchInput) ehrSearchQuery = searchInput.value.toLowerCase().trim();
    if (statusSelect) ehrStatusFilter = statusSelect.value;

    renderPatientsRegistryTable();
}

function renderPatientsRegistryTable() {
    const list = document.getElementById('db-patients-table-body');
    const countEl = document.getElementById('ehr-count-text');
    if (!list) return;

    updateEhrKPIs();

    const registry = window.hospitalDB.getPatientsRegistry();
    const totalCount = registry.length;

    let filtered = registry.filter(p => {
        if (ehrSearchQuery) {
            const matchName = p.name && p.name.toLowerCase().includes(ehrSearchQuery);
            const matchRut = (p.rutDni || p.dni || '').toLowerCase().includes(ehrSearchQuery);
            const matchCie = (p.cie10Code || '').toLowerCase().includes(ehrSearchQuery);
            const matchDisease = (p.primaryDiagnosis || p.disease || '').toLowerCase().includes(ehrSearchQuery);
            const matchBed = (p.bedNumber || '').toLowerCase().includes(ehrSearchQuery);
            const matchRecord = (p.recordId || '').toLowerCase().includes(ehrSearchQuery);
            const matchSyms = Array.isArray(p.symptoms) && p.symptoms.some(s => s.toLowerCase().includes(ehrSearchQuery));

            if (!matchName && !matchRut && !matchCie && !matchDisease && !matchBed && !matchRecord && !matchSyms) {
                return false;
            }
        }
        if (ehrStatusFilter !== 'all') {
            if (ehrStatusFilter === 'Hospitalizado' && p.status !== 'Hospitalizado') return false;
            if (ehrStatusFilter === 'Alta' && !p.status.includes('Alta') && !p.status.includes('Salvado')) return false;
            if (ehrStatusFilter === 'Fallecido' && !p.status.includes('Fallecido') && !p.status.includes('Óbito')) return false;
        }
        return true;
    });

    if (countEl) countEl.textContent = `Mostrando ${filtered.length} de ${totalCount} historias clínicas en EHR`;

    if (filtered.length === 0) {
        list.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-slate-400 text-xs">No se encontraron expedientes con los criterios seleccionados.</td></tr>`;
        return;
    }

    list.innerHTML = filtered.slice().reverse().map(p => {
        let statusBadge = '';
        if (p.status.includes('Salvado') || p.status.includes('Alta')) {
            statusBadge = `<span class="px-2 py-0.5 rounded-full status-pill-discharged text-[10px] font-bold">Alta Médica 🏆</span>`;
        } else if (p.status.includes('Fallecido') || p.status.includes('Óbito')) {
            statusBadge = `<span class="px-2 py-0.5 rounded-full status-pill-deceased text-[10px] font-bold">Óbito 💀</span>`;
        } else {
            statusBadge = `<span class="px-2 py-0.5 rounded-full status-pill-hospitalized text-[10px] font-semibold">Hospitalizado 🩺</span>`;
        }

        let triageCode = p.triageCode || 'III';
        let triageClass = 'triage-manchester-3';
        if (triageCode === 'I') triageClass = 'triage-manchester-1';
        else if (triageCode === 'II') triageClass = 'triage-manchester-2';
        else if (triageCode === 'IV') triageClass = 'triage-manchester-4';
        else if (triageCode === 'V') triageClass = 'triage-manchester-5';

        const displayFolio = p.folio || p.recordId;
        const diseaseText = p.primaryDiagnosis || p.disease;
        const cie10Display = p.cie10Code ? p.cie10Code.split(' - ')[0] : 'CIE-10';

        return `
            <tr class="ehr-row">
                <td class="py-2 px-3">
                    <div class="text-teal-800 font-bold">${p.recordId}</div>
                    <div class="text-[10px] text-slate-400">${displayFolio}</div>
                </td>
                <td class="py-2 px-3">
                    <div class="font-bold text-slate-800">${p.bedNumber}</div>
                    <div class="text-[10px] text-slate-500">${p.serviceUnit || 'Medicina'}</div>
                </td>
                <td class="py-2 px-3">
                    <div class="text-slate-900 font-bold">${p.name}</div>
                    <div class="text-[10px] text-slate-500 font-mono-numbers">${p.rutDni || '--'} • ${p.age}a (${p.gender})</div>
                </td>
                <td class="py-2 px-3">
                    <div class="text-slate-800 font-medium truncate max-w-[160px]" title="${diseaseText}">${diseaseText}</div>
                    <div class="text-[10px] text-teal-700 font-mono-numbers">${cie10Display}</div>
                </td>
                <td class="py-2 px-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${triageClass}">
                        ${p.triageLevel || 'Nivel III'}
                    </span>
                </td>
                <td class="py-2 px-3">${statusBadge}</td>
                <td class="py-2 px-3 text-slate-600 font-mono-numbers text-[10px]">
                    <div>Ing: ${p.admissionDate || 'Día 1'} [${p.admissionTime || '07:00'}]</div>
                    <div class="text-slate-400">Egr: ${p.dischargeTime || 'En sala'}</div>
                </td>
                <td class="py-2 px-3 text-center">
                    <button onclick="openEhrDetailModal('${p.recordId}')" class="btn-medical px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-teal-800 border border-slate-300 text-[11px] font-semibold transition-colors flex items-center space-x-1 mx-auto" title="Ver ficha completa y síntomas">
                        <span>📄</span>
                        <span>Ver Epicrisis</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderHistoryTable() {
    const list = document.getElementById('history-table-body');
    if (!list) return;

    const history = window.hospitalDB.getHistory();
    if (history.length === 0) {
        list.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-slate-400 text-xs">No hay jornadas cerradas archivadas aún.</td></tr>`;
        return;
    }

    list.innerHTML = history.slice().reverse().map(h => {
        const curedCount = h.curedPatients ? h.curedPatients.length : h.saved;
        const deceasedCount = h.deceasedPatients ? h.deceasedPatients.length : h.lost;

        return `
            <tr class="border-b border-slate-100 text-xs hover:bg-slate-50 transition-colors">
                <td class="py-2 px-3 font-mono-numbers text-teal-800 font-bold">Día ${h.dayNumber}</td>
                <td class="py-2 px-3 font-mono-numbers font-extrabold ${h.rankColor}">${h.rank}</td>
                <td class="py-2 px-3 text-emerald-700 font-bold">${h.saved} salvados</td>
                <td class="py-2 px-3 ${h.lost > 0 ? 'text-rose-700 font-bold' : 'text-slate-500'}">${h.lost} óbitos</td>
                <td class="py-2 px-3 font-mono-numbers ${h.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'} font-semibold">${h.netProfit >= 0 ? '+' : ''}${formatCurrency(h.netProfit)}</td>
                <td class="py-2 px-3 font-mono-numbers text-slate-900 font-bold">${formatCurrency(h.finalFunds)}</td>
                <td class="py-2 px-3 text-center">
                    <button onclick="openShiftHistoryDetailModal(${h.dayNumber})" class="btn-medical px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-bold inline-flex items-center space-x-1 shadow-xs" title="Ver listado nominal de quién fue curado y quién falleció en el Día ${h.dayNumber}">
                        <span>👥</span>
                        <span>Ver Pacientes (${curedCount}/${deceasedCount})</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openShiftHistoryDetailModal(dayNumber) {
    const history = window.hospitalDB.getHistory();
    const report = history.find(h => h.dayNumber === dayNumber);
    if (!report) return;

    if (window.soundManager) window.soundManager.playClick();

    const titleEl = document.getElementById('hist-modal-title');
    const subEl = document.getElementById('hist-modal-subtitle');
    const curedCountEl = document.getElementById('hist-modal-cured-count');
    const lostCountEl = document.getElementById('hist-modal-lost-count');
    const rankEl = document.getElementById('hist-modal-rank');
    const profitEl = document.getElementById('hist-modal-profit');

    if (titleEl) titleEl.textContent = `Auditoría Nominal del Día ${report.dayNumber} (${report.date || 'Jornada Archivada'})`;
    if (subEl) subEl.textContent = `Calificación de Guardia: Rango ${report.rank} (${report.rankTitle || 'Gestión Asistencial'}) • Supervivencia: ${formatNum(report.survivalRate, 1)}%`;
    
    if (curedCountEl) curedCountEl.textContent = report.saved;
    if (lostCountEl) lostCountEl.textContent = report.lost;
    if (rankEl) rankEl.textContent = report.rank;
    if (profitEl) profitEl.textContent = `${report.netProfit >= 0 ? '+' : ''}${formatCurrency(report.netProfit)}`;

    const curedListEl = document.getElementById('hist-modal-cured-list');
    const deceasedListEl = document.getElementById('hist-modal-deceased-list');

    const cured = report.curedPatients || [];
    const deceased = report.deceasedPatients || [];

    if (curedListEl) {
        if (cured.length === 0) {
            curedListEl.innerHTML = `<div class="text-center py-4 text-slate-400 text-xs italic">No se registraron altas nominales en esta jornada (${report.saved} salvados según cómputo numérico).</div>`;
        } else {
            curedListEl.innerHTML = cured.map(p => `
                <div class="p-2.5 rounded-lg bg-white border border-emerald-200 shadow-xs">
                    <div class="flex items-center justify-between">
                        <strong class="text-slate-900 text-xs">${p.name}</strong>
                        <span class="badge-cured-status text-[10px]">Alta Médica</span>
                    </div>
                    <div class="text-[11px] text-emerald-800 font-medium mt-0.5">${p.disease}</div>
                    <div class="text-[10px] text-slate-500 font-mono-numbers mt-0.5 flex items-center justify-between">
                        <span>${p.age} años • Sangre: ${p.bloodType || 'O+'} • ${p.insurance || 'FONASA'}</span>
                        <span class="text-emerald-700 font-bold">Alta: ${p.time || '14:00'}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    if (deceasedListEl) {
        if (deceased.length === 0) {
            deceasedListEl.innerHTML = `<div class="text-center py-4 text-emerald-700 text-xs font-semibold">Sin defunciones registradas en este turno.</div>`;
        } else {
            deceasedListEl.innerHTML = deceased.map(p => `
                <div class="p-2.5 rounded-lg bg-white border border-rose-200 shadow-xs">
                    <div class="flex items-center justify-between">
                        <strong class="text-slate-900 text-xs">${p.name}</strong>
                        <span class="badge-deceased-status text-[10px]">Deceso Registrado</span>
                    </div>
                    <div class="text-[11px] text-rose-800 font-medium mt-0.5">${p.disease}</div>
                    <div class="text-[10px] text-slate-500 font-mono-numbers mt-0.5 flex items-center justify-between">
                        <span>${p.age} años • Sangre: ${p.bloodType || 'O+'} • ${p.insurance || 'FONASA'}</span>
                        <span class="text-rose-700 font-bold">Óbito: ${p.time || '04:00'}</span>
                    </div>
                    <div class="text-[10px] text-slate-600 mt-1 italic border-t border-rose-100 pt-0.5">Causa: ${p.cause || 'Complicaciones clínicas agudas'}</div>
                </div>
            `).join('');
        }
    }

    const modal = document.getElementById('shift-history-detail-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeShiftHistoryDetailModal() {
    const modal = document.getElementById('shift-history-detail-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Modal de Ficha Médica Ampliada de Cama (Ver más detalles)
function openDossierModal(patientId) {
    const patient = window.hospitalGame.data.patients.find(p => p.id === patientId);
    if (!patient) return;

    activeModalPatientId = patientId;
    if (window.soundManager) window.soundManager.playClick();

    const isDeceased = patient.severity === 'deceased';

    document.getElementById('dossier-record-id').textContent = patient.recordId || `HC-2026-0${patient.id}00`;
    document.getElementById('dossier-bed').textContent = patient.bedNumber.toUpperCase();
    document.getElementById('dossier-name').textContent = patient.name;
    document.getElementById('dossier-dni').textContent = patient.rutDni || patient.dni || "15.420.910-K";
    document.getElementById('dossier-age-gender').textContent = `${patient.age} años / ${patient.gender === 'M' ? 'Masculino' : 'Femenino'}`;
    document.getElementById('dossier-blood').textContent = patient.bloodType;
    document.getElementById('dossier-insurance').textContent = patient.insurance || "FONASA - Tramo A";
    document.getElementById('dossier-allergy').textContent = patient.allergy;

    // Vitals
    document.getElementById('dossier-v-bpm').textContent = isDeceased ? '0' : Math.round(patient.vitals.bpm);
    document.getElementById('dossier-v-bp').textContent = isDeceased ? '0/0' : `${Math.round(patient.vitals.bpSys)}/${Math.round(patient.vitals.bpDia)}`;
    document.getElementById('dossier-v-spo2').textContent = isDeceased ? '0%' : `${formatNum(patient.vitals.spo2, 1)}%`;
    document.getElementById('dossier-v-temp').textContent = isDeceased ? '--' : `${formatNum(patient.vitals.temp, 1)}°C`;

    const rhythmBadge = document.getElementById('dossier-rhythm-badge');
    const rhythmText = document.getElementById('dossier-rhythm-text');
    if (isDeceased) {
        if (rhythmBadge) rhythmBadge.className = 'text-[11px] font-mono-numbers font-bold uppercase tracking-wider flex items-center space-x-1.5 text-rose-700';
        if (rhythmText) rhythmText.textContent = 'ASISTOLIA / LÍNEA PLANA';
    } else {
        if (rhythmBadge) rhythmBadge.className = 'text-[11px] font-mono-numbers font-bold uppercase tracking-wider flex items-center space-x-1.5 text-emerald-700';
        if (rhythmText) rhythmText.textContent = 'RITMO SINUSAL NORMAL';
    }

    document.getElementById('dossier-cie10').textContent = patient.cie10Code || "J18.9";
    document.getElementById('dossier-disease-title').textContent = patient.disease;
    document.getElementById('dossier-description').textContent = patient.diseaseDescription || "Monitorización clínica activa en sala.";

    const symptomsContainer = document.getElementById('dossier-symptoms');
    symptomsContainer.innerHTML = (patient.symptoms || []).map(s => `<span class="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 text-[11px] font-medium">• ${s}</span>`).join('');

    const cureEl = document.getElementById('dossier-possible-cure');
    if (cureEl) cureEl.textContent = isDeceased ? 'Sin conducta activa (Paciente fallecido)' : patient.possibleCure;

    const statusEl = document.getElementById('dossier-treatment-status');
    if (statusEl) {
        statusEl.textContent = patient.isUnderTreatment ? `En curso (${formatNum(patient.treatmentTimer, 1)}s)` : (isDeceased ? 'Deceso' : 'Disponible');
    }

    const reqContainer = document.getElementById('dossier-resources-strip');
    if (reqContainer) {
        const req = patient.requiredResources || {};
        const badges = [];
        if (req.antibiotics) badges.push(`<span class="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">💊 ${req.antibiotics} Antibióticos</span>`);
        if (req.serums) badges.push(`<span class="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">🧪 ${req.serums} Sueros</span>`);
        if (req.analgesics) badges.push(`<span class="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">💉 ${req.analgesics} Analgésicos</span>`);
        if (req.oxygen) badges.push(`<span class="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">🫁 ${req.oxygen} Oxígeno</span>`);
        if (req.insulin) badges.push(`<span class="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">🧬 ${req.insulin} Insulina</span>`);
        if (req.doctor) badges.push(`<span class="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">🩺 ${req.doctor} Médico</span>`);
        if (req.nurse) badges.push(`<span class="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">🩹 ${req.nurse} Enfermero</span>`);
        reqContainer.innerHTML = badges.join('');
    }

    const prescribeBtn = document.getElementById('dossier-btn-prescribe');
    if (prescribeBtn) {
        if (isDeceased || patient.severity === 'cured' || patient.isUnderTreatment) {
            prescribeBtn.classList.add('hidden');
        } else {
            prescribeBtn.classList.remove('hidden');
        }
    }

    const modal = document.getElementById('dossier-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function handleDossierPrescribe() {
    closeDossierModal();
    if (activeModalPatientId !== null) {
        openPrescriptionModal(activeModalPatientId);
    }
}

function closeDossierModal() {
    activeModalPatientId = null;
    const modal = document.getElementById('dossier-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function exportEhrCSV() {
    window.hospitalDB.exportToCSV();
}

function closeScoreboardModal() {
    const modal = document.getElementById('scoreboard-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function startNextDayFromScoreboard() {
    closeScoreboardModal();
    window.hospitalGame.startNextDay();
}

function openHistoryModalDirectly() {
    updateEhrKPIs();
    renderKeyDataPatientsTable();
    renderPatientsRegistryTable();
    renderHistoryTable();
    switchDbTab('key-patients'); // Pestaña de pacientes clave por defecto
    const modal = document.getElementById('scoreboard-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function openTutorialModal() {
    if (window.soundManager) window.soundManager.playClick();
    const modal = document.getElementById('tutorial-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeTutorialModal() {
    const modal = document.getElementById('tutorial-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function setupGlobalControls() {
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const speed = parseInt(btn.dataset.speed);
            window.hospitalGame.setSpeed(speed);
            if (window.soundManager) window.soundManager.playClick();
        });
    });

    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            const enabled = window.soundManager.toggle();
            soundBtn.textContent = enabled ? '🔊 ON' : '🔇 OFF';
            if (enabled && window.soundManager) window.soundManager.playClick();
        });
    }

    const resetBtn = document.getElementById('btn-reset-game');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('¿Deseas reiniciar la sala hospitalaria y restablecer pacientes?')) {
                window.hospitalDB.clearAllData();
                window.hospitalGame.resetState();
            }
        });
    }

    const fastForwardBtn = document.getElementById('btn-end-shift-quick');
    if (fastForwardBtn) {
        fastForwardBtn.addEventListener('click', () => {
            if (confirm('¿Deseas avanzar el reloj al final de la jornada (22:00) para emitir el informe clínico diario?')) {
                window.hospitalGame.advanceToEndOfDay();
            }
        });
    }
}
