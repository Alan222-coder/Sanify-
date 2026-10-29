// js/diagnostics.js - Controlador de la Estación de Diagnóstico Clínico
// Razonamiento Médico a 3 Niveles: Sindromático, Paraclínico y Temporal

class ClinicalDiagnosticsStation {
    constructor() {
        this.currentPatientId = 1;
        this.activeTab = 'profile'; // 'profile', 'oxygen', 'labs', 'differential', 'encyclopedia', 'compare'
        this.selectedDiseaseId = 'pneumonia_bac';
        this.compareDiseaseAId = 'pneumonia_bac';
        this.compareDiseaseBId = 'pulmonary_embolism';
        this.searchQuery = '';
        this.selectedCategory = 'all';
        this.selectedSignFilter = 'all';

        this.init();
    }

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        const pIdFromUrl = urlParams.get('patientId');
        const pIdFromStorage = localStorage.getItem('hospital_active_patient_diag');
        if (pIdFromUrl) {
            this.currentPatientId = Number(pIdFromUrl);
        } else if (pIdFromStorage) {
            this.currentPatientId = Number(pIdFromStorage);
        }

        this.loadPatientsData();
        this.setupEventListeners();
        this.renderAll();
    }

    loadPatientsData() {
        try {
            const saved = localStorage.getItem('hospital_tycoon_save');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.patients && parsed.patients.length > 0) {
                    this.patients = parsed.patients;
                    this.hospitalTime = parsed.hospital?.time || "07:00";
                    this.hospitalDay = parsed.hospital?.day || 1;
                    return;
                }
            }
        } catch (e) {
            console.error('Error al cargar datos guardados:', e);
        }

        // Fallback a INITIAL_GAME_DATA
        if (typeof INITIAL_GAME_DATA !== 'undefined' && INITIAL_GAME_DATA.patients) {
            this.patients = JSON.parse(JSON.stringify(INITIAL_GAME_DATA.patients));
            this.hospitalTime = INITIAL_GAME_DATA.hospital?.time || "07:00";
            this.hospitalDay = INITIAL_GAME_DATA.hospital?.day || 1;
        } else {
            this.patients = [];
            this.hospitalTime = "07:00";
            this.hospitalDay = 1;
        }
    }

    saveCurrentState() {
        try {
            const saved = localStorage.getItem('hospital_tycoon_save');
            if (saved) {
                const parsed = JSON.parse(saved);
                parsed.patients = this.patients;
                localStorage.setItem('hospital_tycoon_save', JSON.stringify(parsed));
            }
        } catch (e) {
            console.error('Error al guardar estado de pacientes:', e);
        }
    }

    getCurrentPatient() {
        const found = this.patients.find(p => p.id === this.currentPatientId);
        return found || this.patients[0] || null;
    }

    switchPatient(patientId) {
        this.currentPatientId = Number(patientId);
        this.renderAll();
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        
        // Actualizar pestañas activas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('bg-cyan-600', 'text-white', 'shadow-lg', 'shadow-cyan-600/30', 'font-bold');
                btn.classList.remove('bg-slate-900', 'text-slate-400', 'hover:bg-slate-800');
            } else {
                btn.classList.remove('bg-cyan-600', 'text-white', 'shadow-lg', 'shadow-cyan-600/30', 'font-bold');
                btn.classList.add('bg-slate-900', 'text-slate-400', 'hover:bg-slate-800');
            }
        });

        // Mostrar panel correspondiente
        document.querySelectorAll('.tab-panel').forEach(panel => {
            if (panel.id === `panel-${tabId}`) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
        });

        // Re-renderizado específico si es oxígeno o comparador
        if (tabId === 'oxygen') {
            this.renderOxygenTimeline();
        } else if (tabId === 'differential') {
            this.renderDifferentialDiagnostic();
        } else if (tabId === 'compare') {
            this.renderDualComparator();
        }
    }

    setupEventListeners() {
        // Escucha de eventos de almacenamiento si el simulador avanza en otra pestaña
        window.addEventListener('storage', (e) => {
            if (e.key === 'hospital_tycoon_save') {
                this.loadPatientsData();
                this.renderPatientHeader();
                if (this.activeTab === 'oxygen') this.renderOxygenTimeline();
                if (this.activeTab === 'differential') this.renderDifferentialDiagnostic();
            }
        });
    }

    renderAll() {
        this.renderPatientHeader();
        this.renderPatientSelector();
        this.renderProfileTab();
        this.renderOxygenTab();
        this.renderLabsTab();
        this.renderDifferentialTab();
        this.renderEncyclopediaTab();
        this.renderCompareTab();
    }

    renderPatientHeader() {
        const patient = this.getCurrentPatient();
        if (!patient) return;

        const nameEl = document.getElementById('header-patient-name');
        const badgeEl = document.getElementById('header-patient-badge');
        const vitalsBar = document.getElementById('header-vitals-strip');

        if (nameEl) nameEl.textContent = `${patient.name} (${patient.age} años, ${patient.gender === 'M' ? 'Masc' : 'Fem'})`;
        if (badgeEl) {
            badgeEl.textContent = `${patient.bedNumber} • ${patient.recordId}`;
        }

        if (vitalsBar) {
            const spo2Color = patient.vitals.spo2 >= 95 ? 'text-emerald-400' : patient.vitals.spo2 >= 90 ? 'text-amber-400' : 'text-rose-400 animate-pulse';
            const tempColor = patient.vitals.temp >= 38 ? 'text-amber-400' : 'text-slate-300';
            const bpColor = patient.vitals.bpSys >= 140 || patient.vitals.bpDia >= 90 ? 'text-amber-400' : 'text-cyan-400';

            vitalsBar.innerHTML = `
                <div class="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span class="text-xs text-slate-500 font-mono-numbers">SpO2:</span>
                    <strong class="font-mono-numbers font-extrabold ${spo2Color}">${patient.vitals.spo2.toFixed(1)}%</strong>
                </div>
                <div class="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span class="text-xs text-slate-500 font-mono-numbers">FC:</span>
                    <strong class="font-mono-numbers font-extrabold text-emerald-400">${Math.round(patient.vitals.bpm)} lpm</strong>
                </div>
                <div class="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span class="text-xs text-slate-500 font-mono-numbers">PA:</span>
                    <strong class="font-mono-numbers font-extrabold ${bpColor}">${Math.round(patient.vitals.bpSys)}/${Math.round(patient.vitals.bpDia)}</strong>
                </div>
                <div class="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span class="text-xs text-slate-500 font-mono-numbers">FR:</span>
                    <strong class="font-mono-numbers font-extrabold text-blue-400">${patient.vitals.respRate || 22} rpm</strong>
                </div>
                <div class="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span class="text-xs text-slate-500 font-mono-numbers">Temp:</span>
                    <strong class="font-mono-numbers font-extrabold ${tempColor}">${patient.vitals.temp.toFixed(1)}°C</strong>
                </div>
                <div class="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span class="text-xs text-slate-500 font-mono-numbers">Salud:</span>
                    <strong class="font-mono-numbers font-extrabold ${patient.health > 60 ? 'text-emerald-400' : patient.health > 30 ? 'text-amber-400' : 'text-rose-400'}">${patient.health.toFixed(1)}%</strong>
                </div>
            `;
        }
    }

    renderPatientSelector() {
        const select = document.getElementById('patient-selector-dropdown');
        if (!select) return;

        select.innerHTML = '';
        this.patients.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.selected = p.id === this.currentPatientId;
            opt.textContent = `${p.bedNumber}: ${p.name} (${p.disease.substring(0, 32)}...)`;
            select.appendChild(opt);
        });
    }

    // ==========================================
    // PESTAÑA 1: PERFIL CLÍNICO Y SEMIOLOGÍA
    // ==========================================
    renderProfileTab() {
        const p = this.getCurrentPatient();
        if (!p) return;

        // Demográficos
        const demo = p.demographics || { ethnicity: "Hispano", residence: "Santiago", occupation: "No registrada", recentTravel: "Ninguno" };
        document.getElementById('demo-age-gender').textContent = `${p.age} años / ${p.gender === 'M' ? 'Masculino' : 'Femenino'}`;
        document.getElementById('demo-ethnicity').textContent = demo.ethnicity;
        document.getElementById('demo-residence').textContent = demo.residence;
        document.getElementById('demo-travel').textContent = demo.recentTravel;

        // Antecedentes
        const ante = p.antecedents || { familyHistory: "Sin datos", personalPathological: p.comorbidities || "Sin datos", surgicalHistory: "Ninguna", allergies: p.allergy, currentMedications: "Ninguna" };
        document.getElementById('ante-family').textContent = ante.familyHistory;
        document.getElementById('ante-personal').textContent = ante.personalPathological;
        document.getElementById('ante-surgical').textContent = ante.surgicalHistory;
        document.getElementById('ante-allergies').textContent = ante.allergies;
        document.getElementById('ante-medications').textContent = ante.currentMedications;

        // Motivo de consulta
        document.getElementById('chief-complaint-text').textContent = p.chiefComplaint || p.diseaseDescription || "Ingreso por urgencias asistenciales.";

        // Semiología del Dolor (ALICIA)
        const pain = p.painSemiology || { hasPain: false, location: "No refiere", irradiation: "No irradia", intensityEVA: 0, character: "Asintomático", aggravating: "Ninguno", relieving: "Ninguno" };
        const evaEl = document.getElementById('pain-eva-bar');
        const evaNum = document.getElementById('pain-eva-number');
        if (evaEl && evaNum) {
            evaNum.textContent = `${pain.intensityEVA} / 10`;
            evaEl.style.width = `${pain.intensityEVA * 10}%`;
            if (pain.intensityEVA >= 7) {
                evaEl.className = "bg-rose-500 h-full rounded-full transition-all";
                evaNum.className = "text-sm font-mono-numbers font-black text-rose-400";
            } else if (pain.intensityEVA >= 4) {
                evaEl.className = "bg-amber-500 h-full rounded-full transition-all";
                evaNum.className = "text-sm font-mono-numbers font-black text-amber-400";
            } else {
                evaEl.className = "bg-emerald-500 h-full rounded-full transition-all";
                evaNum.className = "text-sm font-mono-numbers font-black text-emerald-400";
            }
        }
        document.getElementById('pain-location').textContent = pain.location;
        document.getElementById('pain-irradiation').textContent = pain.irradiation;
        document.getElementById('pain-character').textContent = pain.character;
        document.getElementById('pain-aggravating').textContent = pain.aggravating;
        document.getElementById('pain-relieving').textContent = pain.relieving;

        // Examen Físico e Inspector Visual
        const exam = p.physicalExam || {
            eyes: "Normales",
            skin: "Normal",
            neurological: { glasgow: 15, orientation: "Lúcido", signs: "Sin alteraciones" },
            cardiopulmonary: "Sin hallazgos patológicos mayores",
            abdomen: "Blando, indoloro"
        };

        const eyesEl = document.getElementById('exam-eyes-text');
        const skinEl = document.getElementById('exam-skin-text');
        const neuroEl = document.getElementById('exam-neuro-text');
        const cardioEl = document.getElementById('exam-cardio-text');
        const abdEl = document.getElementById('exam-abdomen-text');

        if (eyesEl) eyesEl.textContent = exam.eyes;
        if (skinEl) skinEl.textContent = exam.skin;
        if (neuroEl) neuroEl.textContent = `Glasgow ${exam.neurological?.glasgow || 15}/15. ${exam.neurological?.orientation || 'Lúcido'}. ${exam.neurological?.signs || ''}`;
        if (cardioEl) cardioEl.textContent = exam.cardiopulmonary;
        if (abdEl) abdEl.textContent = exam.abdomen;

        // Resaltado visual en el Avatar anatómico de hallazgos
        this.updateAnatomicalAvatar(exam);
    }

    updateAnatomicalAvatar(exam) {
        const eyeBadge = document.getElementById('avatar-badge-eyes');
        const skinBadge = document.getElementById('avatar-badge-skin');
        const chestBadge = document.getElementById('avatar-badge-chest');
        const abdBadge = document.getElementById('avatar-badge-abdomen');

        if (eyeBadge) {
            if (exam.eyes.toLowerCase().includes('inyección') || exam.eyes.toLowerCase().includes('rojo') || exam.eyes.toLowerCase().includes('conjuntiv')) {
                eyeBadge.className = "badge-sign bg-rose-500/20 text-rose-300 border border-rose-500 px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1 animate-pulse";
                eyeBadge.innerHTML = "<span>👁️</span> <span>Ojos Rojos Detectados</span>";
            } else if (exam.eyes.toLowerCase().includes('icteric')) {
                eyeBadge.className = "badge-sign bg-amber-500/20 text-amber-300 border border-amber-500 px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1";
                eyeBadge.innerHTML = "<span>👁️</span> <span>Escleras Ictéricas</span>";
            } else if (exam.eyes.toLowerCase().includes('hundid')) {
                eyeBadge.className = "badge-sign bg-cyan-500/20 text-cyan-300 border border-cyan-500 px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1";
                eyeBadge.innerHTML = "<span>👁️</span> <span>Ojos Hundidos (Deshidratación)</span>";
            } else {
                eyeBadge.className = "badge-sign bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded text-[11px]";
                eyeBadge.innerHTML = "<span>👁️</span> <span>Ojos Normales</span>";
            }
        }

        if (skinBadge) {
            if (exam.skin.toLowerCase().includes('mancha') || exam.skin.toLowerCase().includes('exantema') || exam.skin.toLowerCase().includes('petequia') || exam.skin.toLowerCase().includes('púrpura')) {
                skinBadge.className = "badge-sign bg-rose-500/20 text-rose-300 border border-rose-500 px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1 animate-pulse";
                skinBadge.innerHTML = "<span>🧴</span> <span>Manchas / Exantema Cutáneo</span>";
            } else if (exam.skin.toLowerCase().includes('pliegue')) {
                skinBadge.className = "badge-sign bg-amber-500/20 text-amber-300 border border-amber-500 px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1";
                skinBadge.innerHTML = "<span>🧴</span> <span>Signo del Pliegue (+)</span>";
            } else if (exam.skin.toLowerCase().includes('palidez')) {
                skinBadge.className = "badge-sign bg-blue-500/20 text-blue-300 border border-blue-500 px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1";
                skinBadge.innerHTML = "<span>🧴</span> <span>Palidez Marcada</span>";
            } else {
                skinBadge.className = "badge-sign bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded text-[11px]";
                skinBadge.innerHTML = "<span>🧴</span> <span>Piel sin Lesiones</span>";
            }
        }
    }

    // Permite al médico alternar signos físicos en el paciente para evaluar cambios diagnósticos
    toggleClinicalSign(type, signValue) {
        const p = this.getCurrentPatient();
        if (!p) return;

        if (!p.physicalExam) {
            p.physicalExam = { eyes: "Normales", skin: "Normal", neurological: { glasgow: 15, orientation: "Lúcido" }, cardiopulmonary: "Normal", abdomen: "Normal" };
        }

        if (type === 'eyes') {
            p.physicalExam.eyes = signValue;
        } else if (type === 'skin') {
            p.physicalExam.skin = signValue;
        }

        this.saveCurrentState();
        this.renderProfileTab();
        this.renderDifferentialTab();
    }

    // ==========================================
    // PESTAÑA 2: HISTORIAL CONTINUO DE OXÍGENO (SpO2)
    // ==========================================
    renderOxygenTab() {
        this.renderOxygenTimeline();
    }

    renderOxygenTimeline() {
        const p = this.getCurrentPatient();
        if (!p) return;

        const history = p.spo2History && p.spo2History.length > 0 ? p.spo2History : [
            { time: "07:00", spo2: p.vitals.spo2, bpm: p.vitals.bpm, o2Flow: "Aire ambiente" }
        ];

        // Cálculo de métricas
        const spo2Values = history.map(h => h.spo2);
        const currentSpo2 = spo2Values[spo2Values.length - 1];
        const minSpo2 = Math.min(...spo2Values);
        const maxSpo2 = Math.max(...spo2Values);
        const avgSpo2 = (spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length).toFixed(1);
        const hypoxemiaEvents = history.filter(h => h.spo2 < 92.0).length;

        // Asignar métricas en el DOM
        const curEl = document.getElementById('o2-metric-current');
        const minEl = document.getElementById('o2-metric-min');
        const maxEl = document.getElementById('o2-metric-max');
        const avgEl = document.getElementById('o2-metric-avg');
        const hypoxEl = document.getElementById('o2-metric-hypox');
        const supportEl = document.getElementById('o2-metric-support');

        if (curEl) {
            curEl.textContent = `${currentSpo2.toFixed(1)}%`;
            curEl.className = `font-mono-numbers text-2xl font-black ${currentSpo2 >= 95 ? 'text-emerald-400' : currentSpo2 >= 90 ? 'text-amber-400' : 'text-rose-400 animate-pulse'}`;
        }
        if (minEl) minEl.textContent = `${minSpo2.toFixed(1)}%`;
        if (maxEl) maxEl.textContent = `${maxSpo2.toFixed(1)}%`;
        if (avgEl) avgEl.textContent = `${avgSpo2}%`;
        if (hypoxEl) hypoxEl.textContent = `${hypoxemiaEvents} registros (<92%)`;
        if (supportEl) supportEl.textContent = history[history.length - 1]?.o2Flow || "Aire ambiente (FiO2 21%)";

        // Renderizado del Gráfico SVG
        this.drawOxygenSvgChart(history);

        // Tabla detallada de registros
        const tbody = document.getElementById('o2-history-table-body');
        if (tbody) {
            tbody.innerHTML = '';
            // Mostrar los registros del más reciente al más antiguo
            const reversed = [...history].reverse();
            reversed.forEach(row => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-800/40 transition-colors border-b border-slate-800/60";
                
                let badgeClass = "text-emerald-400 bg-emerald-950/60 border border-emerald-800/60";
                let statusLabel = "Normoxemia";
                if (row.spo2 < 90.0) {
                    badgeClass = "text-rose-400 bg-rose-950/60 border border-rose-800/60 font-black animate-pulse";
                    statusLabel = "Hipoxemia Severa";
                } else if (row.spo2 < 94.0) {
                    badgeClass = "text-amber-400 bg-amber-950/60 border border-amber-800/60";
                    statusLabel = "Hipoxemia Leve-Mod";
                }

                tr.innerHTML = `
                    <td class="py-2 px-3 text-cyan-300 font-bold">${row.time}</td>
                    <td class="py-2 px-3 font-black text-sm ${row.spo2 < 92 ? 'text-rose-400' : 'text-slate-100'}">${row.spo2.toFixed(1)}%</td>
                    <td class="py-2 px-3"><span class="px-2 py-0.5 rounded text-[10px] ${badgeClass}">${statusLabel}</span></td>
                    <td class="py-2 px-3 text-slate-300">${row.bpm || '--'} lpm</td>
                    <td class="py-2 px-3 text-slate-400 text-[11px]">${row.o2Flow || 'Aire ambiente'}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    drawOxygenSvgChart(history) {
        const container = document.getElementById('o2-chart-container');
        if (!container) return;

        const width = 800;
        const height = 260;
        const padding = { top: 20, right: 30, bottom: 40, left: 50 };

        // Rango de SpO2 visible: 75% a 100%
        const yMin = 75;
        const yMax = 100;

        const xScale = (index) => {
            if (history.length <= 1) return padding.left;
            return padding.left + (index / (history.length - 1)) * (width - padding.left - padding.right);
        };

        const yScale = (val) => {
            const clamped = Math.max(yMin, Math.min(yMax, val));
            return height - padding.bottom - ((clamped - yMin) / (yMax - yMin)) * (height - padding.top - padding.bottom);
        };

        // Construir coordenadas de la línea
        const points = history.map((h, i) => `${xScale(i)},${yScale(h.spo2)}`).join(' ');

        // Zonas de fondo
        const yNormLine = yScale(95);
        const yMildLine = yScale(90);

        let svgHtml = `
            <svg viewBox="0 0 ${width} ${height}" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
                <!-- Zona Verde: Normoxemia (95 - 100%) -->
                <rect x="${padding.left}" y="${yScale(100)}" width="${width - padding.left - padding.right}" height="${yScale(95) - yScale(100)}" fill="rgba(16, 185, 129, 0.08)" />
                
                <!-- Zona Ámbar: Hipoxemia Leve (90 - 94.9%) -->
                <rect x="${padding.left}" y="${yScale(95)}" width="${width - padding.left - padding.right}" height="${yScale(90) - yScale(95)}" fill="rgba(245, 158, 11, 0.08)" />

                <!-- Zona Roja: Hipoxemia Severa (< 90%) -->
                <rect x="${padding.left}" y="${yScale(90)}" width="${width - padding.left - padding.right}" height="${height - padding.bottom - yScale(90)}" fill="rgba(244, 63, 94, 0.12)" />

                <!-- Líneas Guía Horizontales -->
                <line x1="${padding.left}" y1="${yScale(100)}" x2="${width - padding.right}" y2="${yScale(100)}" stroke="#334155" stroke-dasharray="3 3" />
                <text x="${padding.left - 8}" y="${yScale(100) + 4}" fill="#94a3b8" font-size="10" font-family="monospace" text-anchor="end">100%</text>

                <line x1="${padding.left}" y1="${yNormLine}" x2="${width - padding.right}" y2="${yNormLine}" stroke="rgba(16, 185, 129, 0.4)" stroke-dasharray="4 4" />
                <text x="${padding.left - 8}" y="${yNormLine + 4}" fill="#10b981" font-size="10" font-family="monospace" text-anchor="end">95%</text>

                <line x1="${padding.left}" y1="${yMildLine}" x2="${width - padding.right}" y2="${yMildLine}" stroke="rgba(244, 63, 94, 0.5)" stroke-dasharray="4 4" />
                <text x="${padding.left - 8}" y="${yMildLine + 4}" fill="#f43f5e" font-size="10" font-family="monospace" text-anchor="end">90%</text>

                <line x1="${padding.left}" y1="${yScale(80)}" x2="${width - padding.right}" y2="${yScale(80)}" stroke="#1e293b" stroke-dasharray="3 3" />
                <text x="${padding.left - 8}" y="${yScale(80) + 4}" fill="#64748b" font-size="10" font-family="monospace" text-anchor="end">80%</text>

                <!-- Área bajo la curva con gradiente -->
                <defs>
                    <linearGradient id="o2Gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.4"/>
                        <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0"/>
                    </linearGradient>
                </defs>
                <polygon points="${padding.left},${height - padding.bottom} ${points} ${xScale(history.length - 1)},${height - padding.bottom}" fill="url(#o2Gradient)" />

                <!-- Línea de Trayectoria de SpO2 -->
                <polyline fill="none" stroke="#06b6d4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${points}" />

                <!-- Puntos Individuales con interactividad visual -->
        `;

        history.forEach((h, i) => {
            const cx = xScale(i);
            const cy = yScale(h.spo2);
            const dotColor = h.spo2 >= 95 ? '#10b981' : h.spo2 >= 90 ? '#f59e0b' : '#f43f5e';

            svgHtml += `
                <circle cx="${cx}" cy="${cy}" r="4.5" fill="${dotColor}" stroke="#0f172a" stroke-width="2" />
                <text x="${cx}" y="${height - padding.bottom + 16}" fill="#94a3b8" font-size="10" font-family="monospace" text-anchor="middle">${h.time}</text>
                <text x="${cx}" y="${cy - 8}" fill="${dotColor}" font-size="10" font-weight="bold" font-family="monospace" text-anchor="middle">${h.spo2.toFixed(1)}%</text>
            `;
        });

        svgHtml += `</svg>`;
        container.innerHTML = svgHtml;
    }

    // ==========================================
    // PESTAÑA 3: LABORATORIO SANGUÍNEO COMPLETO
    // ==========================================
    renderLabsTab() {
        const p = this.getCurrentPatient();
        if (!p) return;

        const labs = p.labResults;
        const noLabContainer = document.getElementById('labs-empty-state');
        const labContentContainer = document.getElementById('labs-content-grid');

        if (!labs || !labs.isDone) {
            if (noLabContainer) noLabContainer.classList.remove('hidden');
            if (labContentContainer) labContentContainer.classList.add('hidden');
            return;
        }

        if (noLabContainer) noLabContainer.classList.add('hidden');
        if (labContentContainer) labContentContainer.classList.remove('hidden');

        document.getElementById('labs-timestamp').textContent = `Muestra extraída a las ${labs.sampledAt} h`;

        // Hemograma
        this.renderLabRow('lab-leukocytes', labs.hemogram.leukocytes, '/uL', 4000, 10000, 'Leucocitos Totales');
        this.renderLabRow('lab-neutrophils', labs.hemogram.neutrophilsPercent, '%', 40, 70, 'Neutrófilos Segmentados');
        this.renderLabRow('lab-hemoglobin', labs.hemogram.hemoglobin, 'g/dL', 12.0, 16.5, 'Hemoglobina');
        this.renderLabRow('lab-hematocrit', labs.hemogram.hematocrit, '%', 36, 48, 'Hematocrito');
        this.renderLabRow('lab-platelets', labs.hemogram.platelets, '/uL', 150000, 400000, 'Plaquetas');

        // Bioquímica y Renal
        this.renderLabRow('lab-glucose', labs.biochemistry.glucose, 'mg/dL', 70, 105, 'Glucemia en Ayunas');
        this.renderLabRow('lab-urea', labs.biochemistry.urea, 'mg/dL', 15, 45, 'Urea Sérica');
        this.renderLabRow('lab-creatinine', labs.biochemistry.creatinine, 'mg/dL', 0.6, 1.2, 'Creatinina Plasmática');
        this.renderLabRow('lab-sodium', labs.biochemistry.sodium, 'mEq/L', 135, 145, 'Sodio (Na+)');
        this.renderLabRow('lab-potassium', labs.biochemistry.potassium, 'mEq/L', 3.5, 5.0, 'Potasio (K+)');
        this.renderLabRow('lab-chlorine', labs.biochemistry.chlorine, 'mEq/L', 96, 106, 'Cloro (Cl-)');

        // Gasometría y Ácido-Base
        this.renderLabRow('lab-ph', labs.bloodGas.arterialPh, '', 7.35, 7.45, 'pH Arterial');
        this.renderLabRow('lab-pao2', labs.bloodGas.paO2, 'mmHg', 80, 100, 'Presión Parcial de O2 (PaO2)');
        this.renderLabRow('lab-paco2', labs.bloodGas.paCO2, 'mmHg', 35, 45, 'Presión Parcial de CO2 (PaCO2)');
        this.renderLabRow('lab-bicarbonate', labs.bloodGas.bicarbonate, 'mEq/L', 22, 26, 'Bicarbonato Actual (HCO3-)');
        this.renderLabRow('lab-lactate', labs.bloodGas.lactate, 'mmol/L', 0.5, 2.0, 'Ácido Láctico');

        // Biomarcadores
        this.renderLabRow('lab-crp', labs.biomarkers.crp, 'mg/L', 0, 5, 'Proteína C Reactiva (PCR)');
        this.renderLabRow('lab-procalcitonin', labs.biomarkers.procalcitonin, 'mcg/L', 0, 0.25, 'Procalcitonina');
        this.renderLabRow('lab-troponin', labs.biomarkers.troponinI, 'ng/mL', 0, 0.04, 'Troponina I Cardíaca');
        this.renderLabRow('lab-dimerd', labs.biomarkers.dimerD, 'ng/mL', 0, 500, 'Dímero D');

        // Interpretación Médica Automatizada
        const interpEl = document.getElementById('labs-interpretation-summary');
        if (interpEl) {
            const interpretations = [];
            if (labs.hemogram.leukocytes > 12000) interpretations.push("• Leucocitosis con predominio de neutrófilos sugestiva de respuesta inflamatoria o bacteriana aguda.");
            if (labs.biomarkers.crp > 50) interpretations.push("• Elevación marcada de reactantes de fase aguda (PCR > 50 mg/L).");
            if (labs.bloodGas.paO2 < 75) interpretations.push(`• Hipoxemia arterial comprobada (PaO2 ${labs.bloodGas.paO2} mmHg). Correlaciona con la curva de SpO2.`);
            if (labs.bloodGas.arterialPh < 7.30) interpretations.push(`• Acidosis metabólica/mixta severa (pH ${labs.bloodGas.arterialPh}).`);
            if (labs.biochemistry.glucose > 250) interpretations.push(`• Hiperglucemia crítica descompensada (${labs.biochemistry.glucose} mg/dL).`);
            if (labs.biomarkers.troponinI > 0.04) interpretations.push(`• Daño miocárdico / isquemia aguda indicada por elevación de Troponina I.`);

            interpEl.innerHTML = interpretations.length > 0 
                ? interpretations.join('<br>') 
                : "• Perfil analítico paraclínico dentro de límites fisiológicos normales.";
        }
    }

    renderLabRow(elementId, val, unit, minRef, maxRef, label) {
        const el = document.getElementById(elementId);
        if (!el) return;

        const isHigh = val > maxRef;
        const isLow = val < minRef;
        const isNormal = !isHigh && !isLow;

        let badge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">NORMAL</span>`;
        let valColor = "text-white font-bold";

        if (isHigh) {
            badge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">ALTO ▲</span>`;
            valColor = "text-rose-400 font-black";
        } else if (isLow) {
            badge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">BAJO ▼</span>`;
            valColor = "text-amber-400 font-black";
        }

        el.innerHTML = `
            <div class="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/80">
                <span class="text-slate-300">${label}</span>
                <div class="flex items-center space-x-3">
                    <span class="text-[11px] text-slate-500 font-mono-numbers">Ref: ${minRef} - ${maxRef}</span>
                    <span class="${valColor} font-mono-numbers text-xs">${val} ${unit}</span>
                    ${badge}
                </div>
            </div>
        `;
    }

    requestNewLabTest() {
        const p = this.getCurrentPatient();
        if (!p) return;

        // Simula la toma y procesamiento de laboratorio
        p.labResults.sampledAt = this.hospitalTime;
        p.labResults.isDone = true;

        // Añadir leves variaciones realistas
        if (p.isUnderTreatment) {
            p.labResults.biomarkers.crp = Math.max(10, Number((p.labResults.biomarkers.crp * 0.85).toFixed(1)));
            p.labResults.hemogram.leukocytes = Math.max(7000, Math.round(p.labResults.hemogram.leukocytes * 0.9));
        }

        this.saveCurrentState();
        this.renderLabsTab();
        this.renderDifferentialTab();

        alert(`✅ Muestra sanguínea procesada con éxito a las ${this.hospitalTime}. Nuevos resultados paraclínicos cargados.`);
    }

    // ==========================================
    // PESTAÑA 4: MOTOR DE SIMILITUD Y DIAGNÓSTICO DIFERENCIAL A 3 NIVELES
    // ==========================================
    renderDifferentialTab() {
        this.renderDifferentialDiagnostic();
    }

    renderDifferentialDiagnostic() {
        const p = this.getCurrentPatient();
        if (!p || typeof GLOBAL_DISEASES_DB === 'undefined') return;

        // Ejecutar algoritmo de compatibilidad a 3 niveles
        const results = GLOBAL_DISEASES_DB.map(disease => {
            const scoreObj = this.calculateCompatibilityScore(p, disease);
            return {
                disease,
                ...scoreObj
            };
        });

        // Ordenar por compatibilidad global descendente
        results.sort((a, b) => b.totalScore - a.totalScore);

        // Identificar el Top 5
        const top5 = results.slice(0, 5);

        // Separar la más probable y las alertas Red Flag críticas
        const mostLikely = top5[0];
        const redFlags = top5.filter(r => r.disease.isCanNotMiss && r.disease.id !== mostLikely.disease.id && r.totalScore > 40);

        // Renderizar Alerta Red Flag
        const redFlagContainer = document.getElementById('diff-red-flags-container');
        if (redFlagContainer) {
            if (redFlags.length > 0) {
                redFlagContainer.innerHTML = redFlags.map(rf => `
                    <div class="bg-rose-950/70 border-2 border-rose-600 rounded-2xl p-4 flex items-start space-x-3 text-rose-200 shadow-xl mb-3 animate-pulse">
                        <span class="text-3xl">🚨</span>
                        <div class="flex-1">
                            <div class="flex items-center justify-between">
                                <h4 class="font-extrabold text-sm text-white uppercase tracking-wide">REGLA DE ORO / CAN'T MISS: ${rf.disease.name}</h4>
                                <span class="bg-rose-600 text-white text-xs px-2 py-0.5 rounded font-black">${rf.totalScore}% Coincidencia</span>
                            </div>
                            <p class="text-xs text-rose-300 mt-1">CIE-11: <strong>${rf.disease.cie11}</strong> • ${rf.disease.temporalProfile.complicationWindow}</p>
                            <div class="text-[11px] text-rose-200/90 mt-1.5 font-medium">
                                💡 Conducta obligatoria: Descartar inmediatamente mediante ${rf.disease.goldStandardDiagnostic}.
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                redFlagContainer.innerHTML = `
                    <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400 flex items-center space-x-2">
                        <span class="text-emerald-400">🛡️</span>
                        <span>No se detectan alertas catastróficas de extrema gravedad no reconocidas para este cuadro.</span>
                    </div>
                `;
            }
        }

        // Renderizar Lista Top 5
        const listContainer = document.getElementById('diff-top5-list');
        if (listContainer) {
            listContainer.innerHTML = top5.map((item, index) => {
                const d = item.disease;
                const isWinner = index === 0;

                let scoreBarColor = "bg-emerald-500";
                if (item.totalScore < 70) scoreBarColor = "bg-amber-500";
                if (item.totalScore < 50) scoreBarColor = "bg-slate-500";

                return `
                    <div class="p-4 rounded-2xl border ${isWinner ? 'bg-cyan-950/30 border-cyan-500/80 shadow-lg shadow-cyan-500/10' : 'bg-slate-900/80 border-slate-800'} transition-all hover:border-slate-700">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="flex items-center space-x-2.5">
                                <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${isWinner ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}">
                                    #${index + 1}
                                </span>
                                <div>
                                    <h4 class="font-extrabold text-sm text-white flex items-center space-x-2">
                                        <span>${d.name}</span>
                                        ${d.isCanNotMiss ? '<span class="text-[10px] bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800 font-bold">RED FLAG 🚨</span>' : ''}
                                    </h4>
                                    <div class="text-[11px] text-slate-400 space-x-2 font-mono-numbers">
                                        <span>CIE-11: <strong class="text-cyan-400">${d.cie11}</strong></span>
                                        <span>•</span>
                                        <span>CIE-10: <strong class="text-slate-300">${d.cie10}</strong></span>
                                        <span>•</span>
                                        <span class="text-slate-500">${d.category}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="text-right">
                                <div class="text-base font-black font-mono-numbers ${item.totalScore >= 75 ? 'text-cyan-300' : 'text-slate-300'}">
                                    ${item.totalScore}%
                                </div>
                                <span class="text-[10px] text-slate-500 uppercase">Compatibilidad</span>
                            </div>
                        </div>

                        <!-- Barra de Compatibilidad Global -->
                        <div class="w-full bg-slate-950 rounded-full h-2 overflow-hidden mt-3 border border-slate-800">
                            <div class="${scoreBarColor} h-full rounded-full transition-all duration-500" style="width: ${item.totalScore}%"></div>
                        </div>

                        <!-- Desglose de los 3 Niveles Médicos -->
                        <div class="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px]">
                            <div class="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                                <span class="text-[9px] uppercase text-slate-500 font-bold block">1. Sindromático</span>
                                <strong class="text-cyan-400 font-mono-numbers">${item.syndromicScore}%</strong>
                                <span class="text-[10px] text-slate-400 block truncate" title="${item.syndromicMatchNote}">${item.syndromicMatchNote}</span>
                            </div>

                            <div class="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                                <span class="text-[9px] uppercase text-slate-500 font-bold block">2. Paraclínico / Labs</span>
                                <strong class="text-blue-400 font-mono-numbers">${item.paraclinicalScore}%</strong>
                                <span class="text-[10px] text-slate-400 block truncate" title="${item.paraclinicalMatchNote}">${item.paraclinicalMatchNote}</span>
                            </div>

                            <div class="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                                <span class="text-[9px] uppercase text-slate-500 font-bold block">3. Temporal / Cinética</span>
                                <strong class="text-emerald-400 font-mono-numbers">${item.temporalScore}%</strong>
                                <span class="text-[10px] text-slate-400 block truncate" title="${d.temporalProfile.onsetSpeed}">${d.temporalProfile.onsetSpeed}</span>
                            </div>
                        </div>

                        <!-- Acciones Rápidas -->
                        <div class="mt-3 flex items-center justify-between text-xs pt-2">
                            <span class="text-[11px] text-slate-400">🔬 Gold Standard: <strong class="text-slate-200">${d.goldStandardDiagnostic.substring(0, 48)}...</strong></span>
                            <button onclick="window.diagnosticsStation.openDiseaseInComparator('${d.id}')" class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center space-x-1 border border-cyan-500/40">
                                <span>⚖️</span>
                                <span>Comparar Frente a Frente</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Algoritmo Multidimensional de Compatibilidad Diagnóstica
    calculateCompatibilityScore(patient, disease) {
        let syndromicPoints = 0;
        let paraclinicalPoints = 0;
        let temporalPoints = 0;

        // --- NIVEL 1: COINCIDENCIA SINDROMÁTICA & EXAMEN FÍSICO (40%) ---
        // Evaluar ojos rojos
        const patientEyes = (patient.physicalExam?.eyes || "").toLowerCase();
        const diseaseEyes = (disease.physicalSigns?.eyes || "").toLowerCase();
        if ((patientEyes.includes('inyección') || patientEyes.includes('rojo')) && (diseaseEyes.includes('inyección') || diseaseEyes.includes('rojo'))) {
            syndromicPoints += 25;
        } else if ((patientEyes.includes('icter') && diseaseEyes.includes('icter')) || (patientEyes.includes('hundid') && diseaseEyes.includes('hundid'))) {
            syndromicPoints += 20;
        } else if (patientEyes.includes('normal') && diseaseEyes.includes('normal')) {
            syndromicPoints += 15;
        }

        // Evaluar manchas en la piel
        const patientSkin = (patient.physicalExam?.skin || "").toLowerCase();
        const diseaseSkin = (disease.physicalSigns?.skin || "").toLowerCase();
        if ((patientSkin.includes('mancha') || patientSkin.includes('exantema') || patientSkin.includes('petequia')) && 
            (diseaseSkin.includes('mancha') || diseaseSkin.includes('exantema') || diseaseSkin.includes('petequia') || diseaseSkin.includes('púrpura'))) {
            syndromicPoints += 25;
        } else if ((patientSkin.includes('palidez') && diseaseSkin.includes('palidez')) || (patientSkin.includes('pliegue') && diseaseSkin.includes('pliegue'))) {
            syndromicPoints += 20;
        } else if (patientSkin.includes('normal') && diseaseSkin.includes('normal')) {
            syndromicPoints += 15;
        }

        // Evaluar síntomas cardinales
        const patientSymptoms = patient.symptoms || [];
        let matchedSymptomsCount = 0;
        disease.syndromes.forEach(syn => {
            patientSymptoms.forEach(sym => {
                if (syn.toLowerCase().includes('respirat') && sym.toLowerCase().includes('disnea')) matchedSymptomsCount++;
                if (syn.toLowerCase().includes('febril') && sym.toLowerCase().includes('fiebre')) matchedSymptomsCount++;
                if (syn.toLowerCase().includes('peritoneal') && sym.toLowerCase().includes('abdomen')) matchedSymptomsCount++;
            });
        });
        syndromicPoints += Math.min(50, matchedSymptomsCount * 25);
        const syndromicScore = Math.min(100, syndromicPoints);

        // --- NIVEL 2: COINCIDENCIA PARACLÍNICA (40%) ---
        // Concordancia de Oxígeno SpO2
        const pSpo2 = patient.vitals.spo2;
        const [dSpo2Min, dSpo2Max] = disease.oxygenProfile.expectedSpo2Range;
        if (pSpo2 >= dSpo2Min - 2 && pSpo2 <= dSpo2Max + 2) {
            paraclinicalPoints += 35;
        } else if (Math.abs(pSpo2 - dSpo2Min) < 5 || Math.abs(pSpo2 - dSpo2Max) < 5) {
            paraclinicalPoints += 20;
        }

        // Concordancia de Leucocitos
        if (patient.labResults && patient.labResults.hemogram) {
            const pLeuk = patient.labResults.hemogram.leukocytes;
            const [dLeukMin, dLeukMax] = disease.labProfile.leukocytes;
            if (pLeuk >= dLeukMin * 0.8 && pLeuk <= dLeukMax * 1.2) {
                paraclinicalPoints += 25;
            } else {
                paraclinicalPoints += 10;
            }

            // PCR y Glucosa
            const pCrp = patient.labResults.biomarkers?.crp || 10;
            const [dCrpMin, dCrpMax] = disease.labProfile.crp;
            if (pCrp >= dCrpMin * 0.7 && pCrp <= dCrpMax * 1.3) {
                paraclinicalPoints += 20;
            }

            const pGlu = patient.labResults.biochemistry?.glucose || 100;
            const [dGluMin, dGluMax] = disease.labProfile.glucose;
            if (pGlu >= dGluMin * 0.7 && pGlu <= dGluMax * 1.3) {
                paraclinicalPoints += 20;
            }
        } else {
            paraclinicalPoints += 50; // Sin labs tomados
        }
        const paraclinicalScore = Math.min(100, paraclinicalPoints);

        // --- NIVEL 3: COINCIDENCIA TEMPORAL (20%) ---
        if (disease.temporalProfile.onsetSpeed.includes('Agudo') || disease.temporalProfile.onsetSpeed.includes('Hiperagudo')) {
            temporalPoints = 85;
        } else {
            temporalPoints = 50;
        }
        const temporalScore = Math.min(100, temporalPoints);

        // Score Global Ponderado
        const totalScore = Math.round((syndromicScore * 0.35) + (paraclinicalScore * 0.40) + (temporalScore * 0.25));

        return {
            totalScore,
            syndromicScore,
            paraclinicalScore,
            temporalScore,
            syndromicMatchNote: `${matchedSymptomsCount} síndromes coincidentes`,
            paraclinicalMatchNote: `SpO2 y biomarcadores compatibles`
        };
    }

    // ==========================================
    // PESTAÑA 5: BASE DE DATOS MUNDIAL & ENCICLOPEDIA
    // ==========================================
    renderEncyclopediaTab() {
        if (typeof GLOBAL_DISEASES_DB === 'undefined') return;

        const container = document.getElementById('encyclopedia-cards-grid');
        if (!container) return;

        const filtered = GLOBAL_DISEASES_DB.filter(d => {
            const matchesQuery = !this.searchQuery || 
                d.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                d.cie11.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                d.cie10.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (d.physicalSigns.eyes && d.physicalSigns.eyes.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                (d.physicalSigns.skin && d.physicalSigns.skin.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                d.category.toLowerCase().includes(this.searchQuery.toLowerCase());

            const matchesCategory = this.selectedCategory === 'all' || d.category.toLowerCase().includes(this.selectedCategory.toLowerCase());
            
            return matchesQuery && matchesCategory;
        });

        document.getElementById('encyclopedia-count').textContent = `Mostrando ${filtered.length} de ${GLOBAL_DISEASES_DB.length} patologías indexadas`;

        container.innerHTML = filtered.map(d => `
            <div class="bg-slate-900 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between">
                <div>
                    <div class="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">${d.category}</span>
                            <h4 class="font-black text-base text-white mt-0.5">${d.name}</h4>
                        </div>
                        <span class="font-mono-numbers text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700 text-cyan-300 font-bold">
                            CIE-11: ${d.cie11}
                        </span>
                    </div>

                    <p class="text-xs text-slate-300 mt-3 leading-relaxed">
                        ${d.description}
                    </p>

                    <!-- Signos Visuales Clave (Ojos y Manchas) -->
                    <div class="mt-3.5 space-y-1.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
                        <div class="flex items-start space-x-2">
                            <span class="text-sm">👁️</span>
                            <div class="text-[11px]"><strong class="text-slate-300">Ojos:</strong> <span class="text-slate-400">${d.physicalSigns.eyes}</span></div>
                        </div>
                        <div class="flex items-start space-x-2">
                            <span class="text-sm">🧴</span>
                            <div class="text-[11px]"><strong class="text-slate-300">Piel / Manchas:</strong> <span class="text-slate-400">${d.physicalSigns.skin}</span></div>
                        </div>
                        <div class="flex items-start space-x-2">
                            <span class="text-sm">🫁</span>
                            <div class="text-[11px]"><strong class="text-slate-300">SpO2 Típico:</strong> <span class="text-teal-400 font-mono-numbers font-bold">${d.oxygenProfile.expectedSpo2Range[0]}% - ${d.oxygenProfile.expectedSpo2Range[1]}%</span> (${d.oxygenProfile.hypoxiaRisk} riesgo)</div>
                        </div>
                    </div>

                    <!-- Datos Paraclínicos Esperados -->
                    <div class="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono-numbers text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                        <div>Leucocitos: <strong class="text-slate-200">${d.labProfile.leukocytes[0]}-${d.labProfile.leukocytes[1]}</strong></div>
                        <div>PCR esperada: <strong class="text-slate-200">${d.labProfile.crp[0]}-${d.labProfile.crp[1]} mg/L</strong></div>
                        <div>Temperatura: <strong class="text-slate-200">${d.vitalsProfile.tempRange[0]}-${d.vitalsProfile.tempRange[1]}°C</strong></div>
                        <div>SNOMED-CT: <strong class="text-slate-200">${d.snomedCt.split(' - ')[0]}</strong></div>
                    </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button onclick="window.diagnosticsStation.openDiseaseInComparator('${d.id}')" class="flex-1 py-1.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1">
                        <span>⚖️</span> <span>Comparar con Paciente</span>
                    </button>
                    <button onclick="window.diagnosticsStation.openDiseaseInDiseaseComparison('${d.id}')" class="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700">
                        Vs Otra
                    </button>
                </div>
            </div>
        `).join('');
    }

    onSearchInput(query) {
        this.searchQuery = query;
        this.renderEncyclopediaTab();
    }

    onCategoryFilterChange(category) {
        this.selectedCategory = category;
        this.renderEncyclopediaTab();
    }

    // ==========================================
    // PESTAÑA 6: COMPARADOR DUAL CARA A CARA
    // ==========================================
    renderCompareTab() {
        this.renderDualComparator();
    }

    openDiseaseInComparator(diseaseId) {
        this.selectedDiseaseId = diseaseId;
        this.switchTab('compare');
        document.getElementById('compare-mode-patient').checked = true;
        this.renderDualComparator();
    }

    openDiseaseInDiseaseComparison(diseaseId) {
        this.compareDiseaseAId = diseaseId;
        this.switchTab('compare');
        document.getElementById('compare-mode-disease').checked = true;
        this.renderDualComparator();
    }

    renderDualComparator() {
        if (typeof GLOBAL_DISEASES_DB === 'undefined') return;

        const isPatientMode = document.getElementById('compare-mode-patient')?.checked ?? true;
        const patient = this.getCurrentPatient();
        const diseaseA = GLOBAL_DISEASES_DB.find(d => d.id === this.selectedDiseaseId) || GLOBAL_DISEASES_DB[0];
        const diseaseB = GLOBAL_DISEASES_DB.find(d => d.id === this.compareDiseaseBId) || GLOBAL_DISEASES_DB[1];

        const colLeftTitle = document.getElementById('comp-left-title');
        const colRightTitle = document.getElementById('comp-right-title');
        const tableBody = document.getElementById('comp-table-body');

        if (!tableBody) return;

        if (isPatientMode) {
            if (colLeftTitle) colLeftTitle.innerHTML = `👤 Paciente: <strong class="text-white">${patient.name}</strong> (${patient.bedNumber})`;
            if (colRightTitle) colRightTitle.innerHTML = `🦠 Catálogo: <strong class="text-cyan-400">${diseaseA.name}</strong> (CIE-11: ${diseaseA.cie11})`;

            // Filas de comparación Paciente vs Enfermedad
            const rows = [
                {
                    parameter: "Saturación de Oxígeno (SpO2)",
                    leftVal: `${patient.vitals.spo2.toFixed(1)}% (${patient.spo2History && patient.spo2History.length > 0 ? 'Curva registrada' : 'Basal'})`,
                    rightVal: `${diseaseA.oxygenProfile.expectedSpo2Range[0]}% - ${diseaseA.oxygenProfile.expectedSpo2Range[1]}% (${diseaseA.oxygenProfile.hypoxiaRisk} riesgo)`,
                    isMatch: patient.vitals.spo2 >= diseaseA.oxygenProfile.expectedSpo2Range[0] - 2 && patient.vitals.spo2 <= diseaseA.oxygenProfile.expectedSpo2Range[1] + 2
                },
                {
                    parameter: "Signos Oculares (Ojos Rojos / Escleras)",
                    leftVal: patient.physicalExam?.eyes || "Normal",
                    rightVal: diseaseA.physicalSigns.eyes,
                    isMatch: (patient.physicalExam?.eyes || "").toLowerCase().includes("inyección") === diseaseA.physicalSigns.eyes.toLowerCase().includes("inyección")
                },
                {
                    parameter: "Signos Cutáneos (Manchas / Exantema)",
                    leftVal: patient.physicalExam?.skin || "Normal",
                    rightVal: diseaseA.physicalSigns.skin,
                    isMatch: (patient.physicalExam?.skin || "").toLowerCase().includes("mancha") === diseaseA.physicalSigns.skin.toLowerCase().includes("mancha")
                },
                {
                    parameter: "Leucocitos Sanguíneos (/uL)",
                    leftVal: patient.labResults?.hemogram ? `${patient.labResults.hemogram.leukocytes} /uL` : "No procesado",
                    rightVal: `${diseaseA.labProfile.leukocytes[0]} - ${diseaseA.labProfile.leukocytes[1]} /uL`,
                    isMatch: patient.labResults?.hemogram && patient.labResults.hemogram.leukocytes >= diseaseA.labProfile.leukocytes[0] * 0.8
                },
                {
                    parameter: "Proteína C Reactiva (PCR mg/L)",
                    leftVal: patient.labResults?.biomarkers ? `${patient.labResults.biomarkers.crp} mg/L` : "No procesado",
                    rightVal: `${diseaseA.labProfile.crp[0]} - ${diseaseA.labProfile.crp[1]} mg/L`,
                    isMatch: patient.labResults?.biomarkers && patient.labResults.biomarkers.crp >= diseaseA.labProfile.crp[0] * 0.7
                },
                {
                    parameter: "Temperatura Corporal (°C)",
                    leftVal: `${patient.vitals.temp.toFixed(1)}°C`,
                    rightVal: `${diseaseA.vitalsProfile.tempRange[0]}°C - ${diseaseA.vitalsProfile.tempRange[1]}°C`,
                    isMatch: patient.vitals.temp >= diseaseA.vitalsProfile.tempRange[0] - 0.5 && patient.vitals.temp <= diseaseA.vitalsProfile.tempRange[1] + 0.5
                },
                {
                    parameter: "Frecuencia Cardíaca (lpm)",
                    leftVal: `${Math.round(patient.vitals.bpm)} lpm`,
                    rightVal: `${diseaseA.vitalsProfile.bpmRange[0]} - ${diseaseA.vitalsProfile.bpmRange[1]} lpm`,
                    isMatch: patient.vitals.bpm >= diseaseA.vitalsProfile.bpmRange[0] - 10 && patient.vitals.bpm <= diseaseA.vitalsProfile.bpmRange[1] + 10
                },
                {
                    parameter: "Presión Arterial (mmHg)",
                    leftVal: `${Math.round(patient.vitals.bpSys)}/${Math.round(patient.vitals.bpDia)} mmHg`,
                    rightVal: `${diseaseA.vitalsProfile.bpSysRange[0]}-${diseaseA.vitalsProfile.bpSysRange[1]} / ${diseaseA.vitalsProfile.bpDiaRange[0]}-${diseaseA.vitalsProfile.bpDiaRange[1]} mmHg`,
                    isMatch: Math.abs(patient.vitals.bpSys - diseaseA.vitalsProfile.bpSysRange[0]) < 25
                },
                {
                    parameter: "Velocidad de Evolución y Cinética",
                    leftVal: "Instauración en curso en sala",
                    rightVal: `${diseaseA.temporalProfile.onsetSpeed} (${diseaseA.temporalProfile.progressionRate})`,
                    isMatch: true
                },
                {
                    parameter: "Prueba Gold Standard Confirmatoria",
                    leftVal: "Evaluación clínica hospitalaria",
                    rightVal: diseaseA.goldStandardDiagnostic,
                    isMatch: false
                },
                {
                    parameter: "Tratamiento / Protocolo de Elección",
                    leftVal: patient.possibleCure || "Soporte",
                    rightVal: diseaseA.standardTreatment,
                    isMatch: false
                }
            ];

            tableBody.innerHTML = rows.map(r => `
                <tr class="border-b border-slate-800 text-xs">
                    <td class="py-3 px-4 font-bold text-slate-300 w-1/4">${r.parameter}</td>
                    <td class="py-3 px-4 text-slate-200 w-1/3">${r.leftVal}</td>
                    <td class="py-3 px-4 text-slate-300 w-1/3">${r.rightVal}</td>
                    <td class="py-3 px-4 text-center">
                        ${r.isMatch 
                            ? '<span class="text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-700">✓ Coincide</span>' 
                            : '<span class="text-slate-400 bg-slate-950 px-2 py-0.5 rounded text-[11px]">Diferente</span>'}
                    </td>
                </tr>
            `).join('');

        } else {
            // Modo Enfermedad vs Enfermedad
            if (colLeftTitle) colLeftTitle.innerHTML = `🦠 Enfermedad A: <strong class="text-cyan-400">${diseaseA.name}</strong> (${diseaseA.cie11})`;
            if (colRightTitle) colRightTitle.innerHTML = `🦠 Enfermedad B: <strong class="text-amber-400">${diseaseB.name}</strong> (${diseaseB.cie11})`;

            const rows = [
                {
                    parameter: "Especialidad & Categoría",
                    leftVal: diseaseA.category,
                    rightVal: diseaseB.category
                },
                {
                    parameter: "Código CIE-11 & CIE-10",
                    leftVal: `CIE-11: ${diseaseA.cie11} | CIE-10: ${diseaseA.cie10}`,
                    rightVal: `CIE-11: ${diseaseB.cie11} | CIE-10: ${diseaseB.cie10}`
                },
                {
                    parameter: "Saturación de Oxígeno Esperada",
                    leftVal: `${diseaseA.oxygenProfile.expectedSpo2Range[0]}% - ${diseaseA.oxygenProfile.expectedSpo2Range[1]}% (${diseaseA.oxygenProfile.hypoxiaRisk} riesgo)`,
                    rightVal: `${diseaseB.oxygenProfile.expectedSpo2Range[0]}% - ${diseaseB.oxygenProfile.expectedSpo2Range[1]}% (${diseaseB.oxygenProfile.hypoxiaRisk} riesgo)`
                },
                {
                    parameter: "Signos Oculares (Ojos)",
                    leftVal: diseaseA.physicalSigns.eyes,
                    rightVal: diseaseB.physicalSigns.eyes
                },
                {
                    parameter: "Signos Dermatológicos (Manchas en la Piel)",
                    leftVal: diseaseA.physicalSigns.skin,
                    rightVal: diseaseB.physicalSigns.skin
                },
                {
                    parameter: "Leucocitos Típicos (/uL)",
                    leftVal: `${diseaseA.labProfile.leukocytes[0]} - ${diseaseA.labProfile.leukocytes[1]} /uL`,
                    rightVal: `${diseaseB.labProfile.leukocytes[0]} - ${diseaseB.labProfile.leukocytes[1]} /uL`
                },
                {
                    parameter: "Proteína C Reactiva (PCR mg/L)",
                    leftVal: `${diseaseA.labProfile.crp[0]} - ${diseaseA.labProfile.crp[1]} mg/L`,
                    rightVal: `${diseaseB.labProfile.crp[0]} - ${diseaseB.labProfile.crp[1]} mg/L`
                },
                {
                    parameter: "Cinética y Velocidad de Complicación",
                    leftVal: `${diseaseA.temporalProfile.onsetSpeed} - ${diseaseA.temporalProfile.complicationWindow}`,
                    rightVal: `${diseaseB.temporalProfile.onsetSpeed} - ${diseaseB.temporalProfile.complicationWindow}`
                },
                {
                    parameter: "Prueba Gold Standard Confirmatoria",
                    leftVal: diseaseA.goldStandardDiagnostic,
                    rightVal: diseaseB.goldStandardDiagnostic
                },
                {
                    parameter: "Tratamiento de Elección",
                    leftVal: diseaseA.standardTreatment,
                    rightVal: diseaseB.standardTreatment
                }
            ];

            tableBody.innerHTML = rows.map(r => `
                <tr class="border-b border-slate-800 text-xs">
                    <td class="py-3 px-4 font-bold text-slate-300 w-1/4">${r.parameter}</td>
                    <td class="py-3 px-4 text-slate-200 w-3/8">${r.leftVal}</td>
                    <td class="py-3 px-4 text-slate-300 w-3/8">${r.rightVal}</td>
                    <td class="py-3 px-4 text-center">
                        <span class="text-cyan-400 font-mono-numbers text-[10px]">CIE-11</span>
                    </td>
                </tr>
            `).join('');
        }
    }

    onCompareDiseaseASelect(id) {
        this.selectedDiseaseId = id;
        this.compareDiseaseAId = id;
        this.renderDualComparator();
    }

    onCompareDiseaseBSelect(id) {
        this.compareDiseaseBId = id;
        this.renderDualComparator();
    }
}

// Inicialización global
document.addEventListener('DOMContentLoaded', () => {
    window.diagnosticsStation = new ClinicalDiagnosticsStation();
});
