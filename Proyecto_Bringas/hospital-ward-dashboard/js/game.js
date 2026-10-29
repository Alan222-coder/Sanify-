// js/game.js - Motor Clínico, Soporte de Decisiones (CDSS), Alergias y Sincronización EHR

class HospitalGame {
    constructor() {
        this.data = this.loadState() || JSON.parse(JSON.stringify(INITIAL_GAME_DATA));
        this.eventLogs = [
            { time: "07:00", text: "Turno clínico iniciado (07:00 a 22:00). Sistema de Alerta Temprana activo.", type: "info" },
            { time: "07:00", text: "⚠️ ALERTA QUIRÚRGICA: Cama 02 (Lucía B.) presenta microperforación apendicular grave.", type: "danger" }
        ];
        this.timer = null;
        this.listeners = [];
        this.currentDayReport = null;
        this.activeEventModal = null;

        this.syncInitialPatientsToDB();
    }

    syncInitialPatientsToDB() {
        if (!window.hospitalDB) return;
        const registry = window.hospitalDB.getPatientsRegistry();
        this.data.patients.forEach(p => {
            const existing = registry.find(r => r.recordId === p.recordId);
            if (!existing) {
                window.hospitalDB.registerPatient({
                    recordId: p.recordId,
                    folio: p.folio || `FOL-${Math.floor(1000 + Math.random() * 9000)}`,
                    bedNumber: p.bedNumber,
                    serviceUnit: p.serviceUnit || "Medicina Interna",
                    triageLevel: p.triageLevel || "Nivel III - Urgencia",
                    triageCode: p.triageCode || "III",
                    name: p.name,
                    avatar: p.avatar || "👤",
                    age: p.age,
                    gender: p.gender,
                    rutDni: p.rutDni || p.dni || "12.345.678-9",
                    bloodType: p.bloodType,
                    insurance: p.insurance,
                    allergy: p.allergy,
                    disease: p.disease,
                    cie10Code: p.cie10Code || "Z00.0",
                    cie11Code: p.cie11Code || "",
                    diseaseDescription: p.diseaseDescription,
                    comorbidities: p.comorbidities,
                    status: "Hospitalizado",
                    admissionDate: new Date().toISOString().split('T')[0],
                    admissionTime: this.data.hospital.time,
                    financialImpact: "En curso",
                    health: Number(p.health.toFixed(2)),
                    symptoms: p.symptoms || [],
                    vitals: p.vitals || null,
                    possibleCure: p.possibleCure || "",
                    treatmentHistory: []
                });
            }
        });
    }

    loadState() {
        try {
            const saved = localStorage.getItem('hospital_tycoon_save');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (!parsed.hospital.clues) {
                    parsed.hospital.clues = { available: 3, maxDaily: 3, price: 2500.00, usedToday: 0 };
                }
                if (!parsed.hospital.inGameMinutesPerTick) {
                    parsed.hospital.inGameMinutesPerTick = 1.36;
                }
                if (parsed.patients && Array.isArray(parsed.patients)) {
                    parsed.patients.forEach(p => {
                        const initP = INITIAL_GAME_DATA.patients.find(ip => ip.id === p.id);
                        if (initP) {
                            if (!p.availableTreatments) p.availableTreatments = initP.availableTreatments;
                            if (!p.evolutionConsequences) p.evolutionConsequences = initP.evolutionConsequences;
                            if (!p.symptoms || p.symptoms.length === 0) p.symptoms = initP.symptoms;
                            if (!p.demographics) p.demographics = initP.demographics;
                            if (!p.antecedents) p.antecedents = initP.antecedents;
                            if (!p.chiefComplaint) p.chiefComplaint = initP.chiefComplaint;
                            if (!p.painSemiology) p.painSemiology = initP.painSemiology;
                            if (!p.physicalExam) p.physicalExam = initP.physicalExam;
                            if (!p.labResults) p.labResults = JSON.parse(JSON.stringify(initP.labResults || {}));
                            if (!p.spo2History || p.spo2History.length === 0) p.spo2History = JSON.parse(JSON.stringify(initP.spo2History || []));
                            if (!p.cie11Code) p.cie11Code = initP.cie11Code;
                            if (!p.snomedCode) p.snomedCode = initP.snomedCode;
                        }
                    });
                }
                return parsed;
            }
        } catch (e) {
            console.error('Error al cargar datos guardados:', e);
        }
        return null;
    }

    saveState() {
        try {
            localStorage.setItem('hospital_tycoon_save', JSON.stringify(this.data));
        } catch (e) {
            console.error('Error al guardar datos:', e);
        }
    }

    resetState() {
        localStorage.removeItem('hospital_tycoon_save');
        this.data = JSON.parse(JSON.stringify(INITIAL_GAME_DATA));
        this.eventLogs = [
            { time: "07:00", text: "Simulación y registro clínico de pacientes reiniciados a valores estándar.", type: "info" }
        ];
        this.currentDayReport = null;
        this.activeEventModal = null;
        this.syncInitialPatientsToDB();
        this.notify();
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.data, this.eventLogs, this.currentDayReport, this.activeEventModal));
        this.saveState();
    }

    addLog(text, type = "info") {
        this.eventLogs.unshift({
            time: this.data.hospital.time,
            text,
            type
        });
        if (this.eventLogs.length > 40) {
            this.eventLogs.pop();
        }
    }

    start() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.tick(), 1000);
    }

    setSpeed(speed) {
        this.data.hospital.gameSpeed = speed;
        if (this.timer) clearInterval(this.timer);
        if (speed > 0) {
            const interval = speed === 1 ? 1000 : speed === 2 ? 450 : 180;
            this.timer = setInterval(() => this.tick(), interval);
        }
        this.notify();
    }

    tick() {
        if (this.data.hospital.gameSpeed === 0 || this.data.hospital.dayEnded) return;

        // Gestión del apagón eléctrico
        if (this.data.hospital.isBlackoutActive) {
            this.data.hospital.blackoutTimer -= 1;
            if (this.data.hospital.blackoutTimer <= 0) {
                this.resolveBlackout();
            }
        }

        // Avanzar reloj del hospital
        this.advanceTime();

        // Procesar cada uno de los 6 pacientes con precisión estricta a 2 decimales
        this.data.patients.forEach(patient => {
            if (patient.severity === 'deceased' || patient.severity === 'cured') {
                return;
            }

            if (this.data.hospital.isBlackoutActive && patient.isUnderTreatment) {
                return;
            }

            if (patient.isUnderTreatment) {
                patient.treatmentTimer += 1;
                
                // Respuesta terapéutica favorable
                patient.health = Number(Math.min(100.00, patient.health + 1.50).toFixed(2));
                patient.cureProgress = Number(Math.min(100.00, patient.cureProgress + 2.20).toFixed(2));

                // Normalización de signos vitales
                patient.vitals.bpm = Math.round(patient.vitals.bpm + (75 - patient.vitals.bpm) * 0.05);
                patient.vitals.spo2 = Number((patient.vitals.spo2 + (98.0 - patient.vitals.spo2) * 0.05).toFixed(1));
                patient.vitals.temp = Number((patient.vitals.temp + (36.8 - patient.vitals.temp) * 0.05).toFixed(1));
                
                if (patient.vitals.bpSys > 120) patient.vitals.bpSys = Math.round(patient.vitals.bpSys - 0.6);
                if (patient.vitals.bpSys < 120) patient.vitals.bpSys = Math.round(patient.vitals.bpSys + 0.4);

                if (patient.treatmentTimer >= patient.treatmentTotalDuration) {
                    patient.isUnderTreatment = false;
                    patient.treatmentTimer = 0;
                    this.releaseStaff(patient.requiredResources);

                    if (patient.cureProgress >= 95.00) {
                        patient.cureProgress = 100.00;
                        patient.health = 100.00;
                        patient.severity = 'cured';
                        this.addLog(`🎉 ¡${patient.name} (${patient.bedNumber}) ha completado su tratamiento con éxito! Listo para el Alta Médica.`, 'success');
                        if (window.soundManager) window.soundManager.playHeal();
                    } else {
                        if (patient.severity === 'critical') patient.severity = 'severe';
                        else if (patient.severity === 'severe') patient.severity = 'moderate';
                        else if (patient.severity === 'moderate') patient.severity = 'stable';
                        
                        this.addLog(`💊 Ciclo completado en ${patient.bedNumber}. Paciente estabilizado al ${Number(patient.health).toFixed(2)}% de salud.`, 'info');
                    }
                }
            } else {
                // Decaimiento natural de la enfermedad si no se trata
                const decay = patient.decayRate || (
                    patient.severity === 'critical' ? 0.65 :
                    patient.severity === 'severe' ? 0.28 :
                    patient.severity === 'moderate' ? 0.10 : 0.05
                );

                patient.health = Number(Math.max(0.00, patient.health - decay).toFixed(2));

                // Oscilaciones fisiológicas
                patient.vitals.bpm = Math.round(patient.vitals.bpm + (Math.random() * 2 - 1));
                patient.vitals.spo2 = Number(Math.min(100.0, Math.max(65.0, patient.vitals.spo2 + (Math.random() * 0.4 - 0.2))).toFixed(1));
                patient.vitals.temp = Number((patient.vitals.temp + (Math.random() * 0.06 - 0.03)).toFixed(1));

                // 💀 CONDICIÓN DE FALLECIMIENTO
                if (patient.health <= 0.00) {
                    patient.health = 0.00;
                    patient.severity = 'deceased';
                    patient.isUnderTreatment = false;
                    const finalVitals = {
                        bpm: 0,
                        bpSys: 0,
                        bpDia: 0,
                        spo2: 0.0,
                        temp: Number(patient.vitals.temp.toFixed(1)),
                        respRate: 0
                    };
                    patient.vitals = finalVitals;

                    this.releaseStaff(patient.requiredResources);

                    this.data.hospital.lostCount += 1;
                    this.data.hospital.dayStats.lost += 1;
                    this.data.hospital.reputation = Number(Math.max(10.00, this.data.hospital.reputation - 15.00).toFixed(2));
                    this.data.hospital.funds = Number(Math.max(0.00, this.data.hospital.funds - 350.00).toFixed(2));
                    this.data.hospital.dayStats.expenses = Number((this.data.hospital.dayStats.expenses + 350.00).toFixed(2));

                    if (!this.data.hospital.dayStats.deceasedPatients) {
                        this.data.hospital.dayStats.deceasedPatients = [];
                    }
                    if (!this.data.hospital.dayStats.deceasedPatients.some(p => p.recordId === patient.recordId)) {
                        this.data.hospital.dayStats.deceasedPatients.push({
                            recordId: patient.recordId,
                            folio: patient.folio || `FOL-${patient.recordId}`,
                            name: patient.name,
                            age: patient.age,
                            gender: patient.gender,
                            bloodType: patient.bloodType,
                            insurance: patient.insurance || 'FONASA - Tramo A',
                            disease: patient.disease,
                            cie10Code: patient.cie10Code || '',
                            bedNumber: patient.bedNumber,
                            time: this.data.hospital.time,
                            day: this.data.hospital.day,
                            symptoms: Array.isArray(patient.symptoms) ? [...patient.symptoms] : [],
                            cause: `Complicaciones graves de ${patient.disease}`
                        });
                    }

                    if (window.hospitalDB) {
                        window.hospitalDB.updatePatientStatus(
                            patient.recordId,
                            "Fallecimiento Intrahospitalario",
                            this.data.hospital.time,
                            "-$350.00",
                            `Óbito confirmado a las ${this.data.hospital.time} por complicaciones secundarias de ${patient.disease}. Síntomas registrados al deceso: ${patient.symptoms.join(', ')}.`,
                            finalVitals
                        );
                    }

                    this.addLog(`💀 ¡FALLECIMIENTO EN ${patient.bedNumber}! ${patient.name} ha muerto. Sanción asistencial: -$350.00 y -15.00% reputación.`, 'danger');
                    if (window.soundManager) window.soundManager.playFlatline();
                } else if (patient.health <= 25.00 && patient.severity !== 'critical') {
                    patient.severity = 'critical';
                    this.data.hospital.emergencyCount++;
                    this.addLog(`🚨 ¡CÓDIGO ROJO en ${patient.bedNumber}! ${patient.name} en riesgo de paro (${Number(patient.health).toFixed(2)}% salud). ¡Estabiliza de inmediato!`, 'danger');
                    if (window.soundManager) window.soundManager.playAlarm();
                }
            }

            // Registro cronológico continuo de SpO2 y constantes vitales
            if (!patient.spo2History) patient.spo2History = [];
            const lastHist = patient.spo2History[patient.spo2History.length - 1];
            if (!lastHist || lastHist.time !== this.data.hospital.time) {
                patient.spo2History.push({
                    time: this.data.hospital.time,
                    spo2: Number(patient.vitals.spo2.toFixed(1)),
                    bpm: Math.round(patient.vitals.bpm),
                    bpSys: Math.round(patient.vitals.bpSys),
                    bpDia: Math.round(patient.vitals.bpDia),
                    temp: Number(patient.vitals.temp.toFixed(1)),
                    o2Flow: patient.isUnderTreatment ? "Bajo infusión terapéutica activa" : (patient.vitals.spo2 < 92 ? "Aire ambiente (Alerta Hipoxemia)" : "Aire ambiente (FiO2 21%)")
                });
                if (patient.spo2History.length > 60) {
                    patient.spo2History.shift();
                }
            }
        });

        // Eventos mayores
        if (Math.random() < 0.012 && !this.activeEventModal && !this.data.hospital.isBlackoutActive) {
            this.triggerMajorUnexpectedEvent();
        }

        this.notify();
    }

    advanceTime() {
        let [hours, minutes] = this.data.hospital.time.split(':').map(Number);
        
        this.data.hospital.timeCounterMinutes = Number(((this.data.hospital.timeCounterMinutes || 0) + (this.data.hospital.inGameMinutesPerTick || 1.36)).toFixed(2));
        
        const addedMinutes = Math.floor(this.data.hospital.timeCounterMinutes);
        if (addedMinutes >= 1) {
            this.data.hospital.timeCounterMinutes = Number((this.data.hospital.timeCounterMinutes - addedMinutes).toFixed(2));
            minutes += addedMinutes;
            
            while (minutes >= 60) {
                minutes -= 60;
                hours += 1;
            }
        }

        this.data.hospital.time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        if (hours >= this.data.hospital.dayEndHour && !this.data.hospital.dayEnded) {
            this.endOfDay();
        }
    }

    // --- EVENTOS INESPERADOS MAYORES ---
    triggerMajorUnexpectedEvent() {
        const events = [
            {
                id: 'blackout',
                title: '⚡ ¡CORTE DE ENERGÍA EN EL SERVICIO ASISTENCIAL!',
                icon: '⚡',
                description: 'Fallo imprevisto en la red eléctrica central. Los monitores y bombas de perfusión requieren generador auxiliar.',
                effectText: 'Los tratamientos en curso se detienen durante 35 segundos salvo que se active el generador.',
                actionButtonText: 'Arrancar Generador Auxiliar (-$500.00)',
                cancelButtonText: 'Esperar Restauración de Red',
                executeAction: () => {
                    if (this.data.hospital.funds >= 500.00) {
                        this.data.hospital.funds = Number((this.data.hospital.funds - 500.00).toFixed(2));
                        this.data.hospital.dayStats.expenses = Number((this.data.hospital.dayStats.expenses + 500.00).toFixed(2));
                        this.resolveBlackout();
                        this.addLog(`⚡ Generador de emergencia activado (-$500.00). Soporte vital restablecido.`, 'success');
                    } else {
                        this.addLog(`❌ Fondos insuficientes para combustible del generador.`, 'warning');
                    }
                },
                onTrigger: () => {
                    this.data.hospital.isBlackoutActive = true;
                    this.data.hospital.blackoutTimer = 35;
                    if (window.soundManager) window.soundManager.playPowerBuzz();
                }
            },
            {
                id: 'vip_patient',
                title: '🎩 ¡INGRESO INSTITUCIONAL DE PACIENTE DESTACADO!',
                icon: '🎩',
                description: 'Un paciente distinguido ingresa derivado a nuestra unidad asistencial por su alta calidad médica.',
                effectText: 'El paciente realiza un anticipo de $800.00 para dotación de sala.',
                actionButtonText: 'Aceptar Asignación',
                executeAction: () => {
                    this.data.hospital.funds = Number((this.data.hospital.funds + 800.00).toFixed(2));
                    this.data.hospital.dayStats.income = Number((this.data.hospital.dayStats.income + 800.00).toFixed(2));
                    this.addLog(`🎩 Donación asistencial registrada: +$800.00 en fondos hospitalarios.`, 'success');
                    if (window.soundManager) window.soundManager.playCoins();
                }
            },
            {
                id: 'ministerial_donation',
                title: '📦 ¡REMESAS DEL MINISTERIO DE SALUD!',
                icon: '📦',
                description: 'Plan de fortalecimiento hospitalario nacional: se abastece de emergencia a nuestra sala.',
                effectText: 'Se incorporan al almacén: +2 Sueros Salinos, +2 Oxígenos y +2 Antibióticos.',
                actionButtonText: 'Incorporar Suministros',
                executeAction: () => {
                    this.data.hospital.supplies.serums += 2;
                    this.data.hospital.supplies.oxygen += 2;
                    this.data.hospital.supplies.antibiotics += 2;
                    this.addLog(`📦 Insumos ministeriales incorporados sin costo al almacén.`, 'success');
                    if (window.soundManager) window.soundManager.playCoins();
                }
            }
        ];

        const chosen = events[Math.floor(Math.random() * events.length)];
        if (chosen.onTrigger) chosen.onTrigger();
        this.activeEventModal = chosen;
        
        if (window.soundManager) window.soundManager.playEventMajor();
        this.addLog(`📢 EVENTO ASISTENCIAL: ${chosen.title}`, 'warning');
        this.notify();
    }

    resolveBlackout() {
        this.data.hospital.isBlackoutActive = false;
        this.data.hospital.blackoutTimer = 0;
        this.addLog(`💡 Red eléctrica y soporte vital restablecidos formalmente.`, 'success');
        if (window.soundManager) window.soundManager.playHeal();
    }

    dismissEventModal() {
        this.activeEventModal = null;
        this.notify();
    }

    // --- PISTAS ASISTIDAS ---
    requestClue() {
        const clues = this.data.hospital.clues;
        if (clues.available <= 0) {
            return {
                ok: false,
                reason: "no_clues",
                message: `Cupo diario agotado (${clues.maxDaily}/${clues.maxDaily}). Puedes solicitar una interconsulta médica senior por $${Number(clues.price).toFixed(2)}.`
            };
        }

        const livingPatients = this.data.patients.filter(p => p.severity !== 'deceased' && p.severity !== 'cured');
        if (livingPatients.length === 0) {
            return {
                ok: true,
                tip: "¡Excelente labor médica! Todas las camas activas están curadas o bajo control. Procede a formalizar las altas médicas."
            };
        }

        livingPatients.sort((a, b) => a.health - b.health);
        const target = livingPatients[0];

        const req = target.requiredResources;
        const sup = this.data.hospital.supplies;
        const staff = this.data.hospital.staff;

        const missingSupplies = [];
        if (req.antibiotics > sup.antibiotics) missingSupplies.push(`${req.antibiotics - sup.antibiotics} Antibiótico(s)`);
        if (req.serums > sup.serums) missingSupplies.push(`${req.serums - sup.serums} Suero(s)`);
        if (req.analgesics > sup.analgesics) missingSupplies.push(`${req.analgesics - sup.analgesics} Analgésico(s)`);
        if (req.oxygen > sup.oxygen) missingSupplies.push(`${req.oxygen - sup.oxygen} Oxígeno`);
        if (req.insulin > sup.insulin) missingSupplies.push(`${req.insulin - sup.insulin} Insulina`);

        const freeDocs = staff.doctors.total - staff.doctors.busy;
        const freeNurses = staff.nurses.total - staff.nurses.busy;
        const missingStaff = [];
        if (req.doctor > freeDocs) missingStaff.push(`${req.doctor - freeDocs} Médico(s)`);
        if (req.nurse > freeNurses) missingStaff.push(`${req.nurse - freeNurses} Enfermero(s)`);

        let recommendation = `🩺 **Dictamen Clínico para ${target.name} (${target.bedNumber}):**\n\n`;
        recommendation += `Diagnóstico: **${target.disease}** | Alergia: **${target.allergy}** | Vitalidad: **${Number(target.health).toFixed(2)}%**.\n\n`;

        if (target.isUnderTreatment) {
            recommendation += `✅ Actualmente **bajo infusión terapéutica** (${target.treatmentTimer}/${target.treatmentTotalDuration}s). Mantener monitorización hasta el fin del ciclo.`;
        } else if (missingSupplies.length === 0 && missingStaff.length === 0) {
            recommendation += `💡 Tienes insumos y personal disponibles. Pulsa **'Prescribir Tratamiento'** y atiende las sugerencias del sistema para evitar errores de alergia.`;
        } else {
            recommendation += `⚠️ **Conducta recomendada:** `;
            if (missingSupplies.length > 0) {
                recommendation += `Adquirir en Farmacia: **${missingSupplies.join(', ')}**. `;
            }
            if (missingStaff.length > 0) {
                recommendation += `Dotación de personal requerida: **${missingStaff.join(', ')}**. `;
            }
        }

        clues.available -= 1;
        clues.usedToday += 1;

        if (window.soundManager) window.soundManager.playClue();
        this.addLog(`💡 Interconsulta clínica emitida para ${target.bedNumber}. Consultas restantes: ${clues.available}.`, 'info');
        this.notify();

        return {
            ok: true,
            tip: recommendation,
            remaining: clues.available
        };
    }

    buyExtraClue() {
        const clues = this.data.hospital.clues;
        if (this.data.hospital.funds < clues.price) {
            this.addLog(`❌ Fondos insuficientes para interconsulta senior ($${Number(clues.price).toFixed(2)} requeridos).`, 'warning');
            return false;
        }

        this.data.hospital.funds = Number((this.data.hospital.funds - clues.price).toFixed(2));
        this.data.hospital.dayStats.expenses = Number((this.data.hospital.dayStats.expenses + clues.price).toFixed(2));
        clues.available += 1;

        if (window.soundManager) window.soundManager.playCoins();
        this.addLog(`💡 Interconsulta médica senior solicitada (-$${Number(clues.price).toFixed(2)}). 1 consulta adicionada.`, 'success');
        this.notify();
        return true;
    }

    endOfDay() {
        this.data.hospital.dayEnded = true;
        this.data.hospital.gameSpeed = 0;

        const stats = this.data.hospital.dayStats;
        const netProfit = Number((stats.income - stats.expenses).toFixed(2));
        const totalCases = stats.saved + stats.lost;
        const survivalRate = totalCases > 0 ? Number(((stats.saved / totalCases) * 100.00).toFixed(2)) : 100.00;

        const rankObj = window.hospitalDB.calculateRank(
            stats.saved,
            stats.lost,
            this.data.hospital.reputation,
            netProfit
        );

        const report = {
            dayNumber: this.data.hospital.day,
            date: new Date().toLocaleDateString('es-ES'),
            saved: stats.saved,
            lost: stats.lost,
            curedPatients: Array.isArray(stats.curedPatients) ? [...stats.curedPatients] : [],
            deceasedPatients: Array.isArray(stats.deceasedPatients) ? [...stats.deceasedPatients] : [],
            treatments: stats.treatments,
            startingFunds: Number(stats.startingFunds.toFixed(2)),
            finalFunds: Number(this.data.hospital.funds.toFixed(2)),
            income: Number(stats.income.toFixed(2)),
            expenses: Number(stats.expenses.toFixed(2)),
            netProfit: netProfit,
            reputation: Number(this.data.hospital.reputation.toFixed(2)),
            survivalRate: survivalRate,
            rank: rankObj.grade,
            rankColor: rankObj.color,
            rankTitle: rankObj.title
        };

        this.currentDayReport = report;
        window.hospitalDB.saveDayReport(report);

        this.addLog(`🌙 Fin de Jornada del Día ${this.data.hospital.day}. Informe registrado en Base de Datos. Calificación: Rango ${rankObj.grade}.`, 'info');
        if (window.soundManager) window.soundManager.playDayComplete();

        this.notify();
    }

    startNextDay() {
        this.data.hospital.day += 1;
        this.data.hospital.time = "07:00";
        this.data.hospital.timeCounterMinutes = 0.00;
        this.data.hospital.dayEnded = false;
        this.data.hospital.isBlackoutActive = false;
        this.data.hospital.clues.available = 3;
        this.data.hospital.clues.usedToday = 0;

        this.data.hospital.dayStats = {
            saved: 0,
            lost: 0,
            treatments: 0,
            startingFunds: Number(this.data.hospital.funds.toFixed(2)),
            income: 0.00,
            expenses: 0.00,
            curedPatients: [],
            deceasedPatients: []
        };
        this.currentDayReport = null;
        this.activeEventModal = null;
        this.data.hospital.gameSpeed = 1;

        this.addLog(`☀️ Inicia el Día ${this.data.hospital.day}. Turno clínico habilitado. Consultas renovadas (3/3).`, 'info');
        if (window.soundManager) window.soundManager.playClick();

        this.notify();
    }

    advanceToEndOfDay() {
        if (this.data.hospital.dayEnded) return;
        this.data.hospital.time = "21:58";
        this.advanceTime();
    }

    // Comprobar si se pueden suministrar los recursos de una opción terapéutica
    canApplyTreatment(patient, customReq = null) {
        if (this.data.hospital.isBlackoutActive) return { ok: false, reason: "Corte de energía: bombas de infusión inactivas" };
        if (patient.severity === 'deceased') return { ok: false, reason: "Paciente fallecido" };
        if (patient.isUnderTreatment || patient.severity === 'cured') return { ok: false, reason: "Paciente en tratamiento o curado" };

        const req = customReq || patient.requiredResources;
        const sup = this.data.hospital.supplies;
        const staff = this.data.hospital.staff;

        const missing = [];
        if (req.antibiotics > sup.antibiotics) missing.push(`Antibióticos (${sup.antibiotics}/${req.antibiotics})`);
        if (req.serums > sup.serums) missing.push(`Sueros (${sup.serums}/${req.serums})`);
        if (req.analgesics > sup.analgesics) missing.push(`Analgésicos (${sup.analgesics}/${req.analgesics})`);
        if (req.oxygen > sup.oxygen) missing.push(`Oxígeno (${sup.oxygen}/${req.oxygen})`);
        if (req.insulin > sup.insulin) missing.push(`Insulina (${sup.insulin}/${req.insulin})`);

        const freeDoctors = staff.doctors.total - staff.doctors.busy;
        const freeNurses = staff.nurses.total - staff.nurses.busy;
        if (req.doctor > freeDoctors) missing.push(`Médicos libres (${freeDoctors}/${req.doctor})`);
        if (req.nurse > freeNurses) missing.push(`Enfermeros libres (${freeNurses}/${req.nurse})`);

        if (missing.length > 0) {
            return { ok: false, reason: `Faltan recursos: ${missing.join(', ')}` };
        }

        return { ok: true };
    }

    // --- SOPORTE A DECISIONES CLÍNICAS (CDSS): PRESCRIPCIÓN Y PREVENCIÓN DE ERRORES ---
    prescribeTreatment(patientId, optionKey = 'std') {
        const patient = this.data.patients.find(p => p.id === patientId);
        if (!patient) return { ok: false, reason: "Paciente no encontrado" };

        const treatments = patient.availableTreatments || {};
        let option = treatments[optionKey];

        // Si no existen opciones estructuradas en el objeto, crear opciones por defecto
        if (!option) {
            if (optionKey === 'std') {
                option = {
                    name: "Protocolo Estándar",
                    medication: patient.possibleCure,
                    containsAllergens: [],
                    requiredResources: patient.requiredResources
                };
            } else if (optionKey === 'alt') {
                option = {
                    name: "Protocolo Alternativo Seguro",
                    medication: "Terapia de segunda línea con protección gástrica",
                    containsAllergens: [],
                    requiredResources: patient.requiredResources
                };
            }
        }

        const req = option.requiredResources || patient.requiredResources;
        const check = this.canApplyTreatment(patient, req);
        if (!check.ok) {
            this.addLog(`❌ No se pudo prescribir en ${patient.bedNumber}: ${check.reason}`, 'warning');
            return check;
        }

        // 🛡️ COMPROBACIÓN DE SEGURIDAD FARMACOLÓGICA Y ALERGIAS (CDSS)
        const patientAllergy = (patient.allergy || '').toLowerCase();
        let isContraindicated = false;
        let allergenDetected = "";

        if (option.containsAllergens && Array.isArray(option.containsAllergens)) {
            for (const allergen of option.containsAllergens) {
                if (patientAllergy.includes(allergen.toLowerCase())) {
                    isContraindicated = true;
                    allergenDetected = allergen;
                    break;
                }
            }
        }

        // Consumir insumos
        const sup = this.data.hospital.supplies;
        sup.antibiotics -= req.antibiotics || 0;
        sup.serums -= req.serums || 0;
        sup.analgesics -= req.analgesics || 0;
        sup.oxygen -= req.oxygen || 0;
        sup.insulin -= req.insulin || 0;

        // Asignar personal
        const staff = this.data.hospital.staff;
        staff.doctors.busy += req.doctor || 0;
        staff.nurses.busy += req.nurse || 0;

        // SI SE ADMINISTRÓ UN FÁRMACO CONTRAINDICADO (ERROR MÉDICO HUMANO)
        if (isContraindicated) {
            // Caída violenta de salud por choque anafiláctico / descompensación severa
            patient.health = Number(Math.max(5.00, patient.health - 34.00).toFixed(2));
            patient.severity = 'critical';
            patient.isSpecialCritical = true;

            // Desestabilización de constantes vitales
            patient.vitals.spo2 = Number(Math.max(72.0, patient.vitals.spo2 - 14.0).toFixed(1));
            patient.vitals.bpm = Math.min(150, patient.vitals.bpm + 35);
            patient.vitals.bpSys = Math.max(70, patient.vitals.bpSys - 40);

            // Penalización reputacional por negligencia médica
            this.data.hospital.reputation = Number(Math.max(10.00, this.data.hospital.reputation - 12.00).toFixed(2));

            // Registro en historial
            if (window.hospitalDB) {
                window.hospitalDB.addTreatmentRecord(patient.recordId, {
                    treatmentName: option.name,
                    medication: option.medication,
                    hadAdverseReaction: true,
                    notes: `🚨 ERROR MÉDICO GRAVE: Fármaco con ${allergenDetected} administrado a paciente alérgico. Reacción anafiláctica y colapso circulatorio inducidos.`
                });
            }

            // Liberar personal inmediatamente tras evento adverso
            this.releaseStaff(req);
            patient.isUnderTreatment = false;

            this.addLog(`🚨 ¡ERROR DE PRESCRIPCIÓN EN ${patient.bedNumber}! ${patient.name} era alérgico a ${allergenDetected}. ¡Shock anafiláctico provocado (-34% salud, -12% reputación)!`, 'danger');
            if (window.soundManager) window.soundManager.playAlarm();

            this.notify();
            return {
                ok: false,
                isAdverseReaction: true,
                message: `¡Error grave! Paciente alérgico a ${allergenDetected}. Se ha provocado un shock anafiláctico agudo.`
            };
        }

        // SI LA PRESCRIPCIÓN ES ADECUADA Y SEGURA
        patient.isUnderTreatment = true;
        patient.treatmentTimer = 0;
        patient.requiredResources = req;
        this.data.hospital.dayStats.treatments += 1;

        if (window.hospitalDB) {
            window.hospitalDB.addTreatmentRecord(patient.recordId, {
                treatmentName: option.name,
                medication: option.medication,
                hadAdverseReaction: false,
                notes: `Prescripción adecuada validada. Paciente tolerando infusión favorablemente.`
            });
        }

        this.addLog(`💉 Prescripción segura iniciada en ${patient.bedNumber} (${option.name}). Personal y recursos asignados.`, 'success');
        if (window.soundManager) window.soundManager.playHeal();

        this.notify();
        return { ok: true };
    }

    startTreatment(patientId) {
        // Redirigir al método de prescripción estándar
        return this.prescribeTreatment(patientId, 'std').ok;
    }

    releaseStaff(req) {
        if (!req) return;
        const staff = this.data.hospital.staff;
        staff.doctors.busy = Math.max(0, staff.doctors.busy - (req.doctor || 0));
        staff.nurses.busy = Math.max(0, staff.nurses.busy - (req.nurse || 0));
    }

    stabilizePatient(patientId) {
        const patient = this.data.patients.find(p => p.id === patientId);
        if (!patient || patient.severity === 'deceased') return false;

        const sup = this.data.hospital.supplies;
        if (sup.serums < 1) {
            this.addLog(`❌ Estabilización fallida en ${patient.bedNumber}: Necesitas al menos 1 Suero en el almacén.`, 'warning');
            return false;
        }

        sup.serums -= 1;
        patient.health = Number(Math.min(100.00, patient.health + 22.00).toFixed(2));
        if (patient.health > 35.00 && patient.severity === 'critical') {
            patient.severity = 'severe';
        }

        if (window.soundManager) window.soundManager.playHeartBeat();
        this.addLog(`⚡ Maniobra de soporte vital en ${patient.bedNumber}. Vitalidad restablecida a ${Number(patient.health).toFixed(2)}%.`, 'success');

        this.notify();
        return true;
    }

    dischargePatient(patientId) {
        const patient = this.data.patients.find(p => p.id === patientId);
        if (!patient) return false;

        if (patient.severity !== 'cured' && patient.cureProgress < 95.00 && patient.health < 90.00) {
            this.addLog(`⚠️ El paciente ${patient.name} aún no cumple los criterios de alta médica.`, 'warning');
            return false;
        }

        const reward = patient.dischargeReward || { funds: 800.00, reputation: 5.00 };
        this.data.hospital.funds = Number((this.data.hospital.funds + reward.funds).toFixed(2));
        this.data.hospital.dayStats.income = Number((this.data.hospital.dayStats.income + reward.funds).toFixed(2));
        this.data.hospital.dayStats.saved += 1;
        this.data.hospital.reputation = Number(Math.min(100.00, this.data.hospital.reputation + reward.reputation).toFixed(2));
        this.data.hospital.curedCount += 1;

        if (!this.data.hospital.dayStats.curedPatients) {
            this.data.hospital.dayStats.curedPatients = [];
        }
        this.data.hospital.dayStats.curedPatients.push({
            recordId: patient.recordId,
            folio: patient.folio || `FOL-${patient.recordId}`,
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            bloodType: patient.bloodType,
            insurance: patient.insurance || 'FONASA - Tramo A',
            disease: patient.disease,
            cie10Code: patient.cie10Code || '',
            bedNumber: patient.bedNumber,
            time: this.data.hospital.time,
            day: this.data.hospital.day,
            rewardFunds: reward.funds,
            rewardRep: reward.reputation
        });

        if (window.hospitalDB) {
            window.hospitalDB.updatePatientStatus(
                patient.recordId,
                "Alta Médica con Resolución",
                this.data.hospital.time,
                `+$${Number(reward.funds).toFixed(2)}`,
                `Paciente dado de alta favorablemente con resolución clínica completa de ${patient.disease}. Síntomas resueltos: ${patient.symptoms.join(', ')}. Se indican pautas de seguimiento ambulatorio.`,
                patient.vitals
            );
        }

        if (window.soundManager) window.soundManager.playCoins();
        this.addLog(`🏆 Alta Médica formalizada para ${patient.name}. Recompensa: +$${Number(reward.funds).toFixed(2)} y +${Number(reward.reputation).toFixed(2)}% Reputación.`, 'success');

        this.admitNewPatient(patient.id);
        this.notify();
        return true;
    }

    certifyDeath(patientId) {
        const patient = this.data.patients.find(p => p.id === patientId);
        if (!patient || patient.severity !== 'deceased') return false;

        if (this.data.hospital.funds < 100.00) {
            this.addLog(`❌ Fondos insuficientes para higienización de la cama ($100.00 requeridos).`, 'warning');
            return false;
        }

        this.data.hospital.funds = Number((this.data.hospital.funds - 100.00).toFixed(2));
        this.data.hospital.dayStats.expenses = Number((this.data.hospital.dayStats.expenses + 100.00).toFixed(2));

        this.addLog(`📜 Defunción de ${patient.name} certificada formalmente. Unidad de cama higienizada (-$100.00).`, 'info');
        this.admitNewPatient(patientId);

        if (window.soundManager) window.soundManager.playClick();
        this.notify();
        return true;
    }

    // --- GENERADOR DE PACIENTES DIVERSOS Y REALISTAS CON DIVERSAS PATOLOGÍAS ---
    admitNewPatient(bedId) {
        const catalog = window.CLINICAL_DISEASES_CATALOG || [];
        const chosenDisease = catalog.length > 0 
            ? catalog[Math.floor(Math.random() * catalog.length)] 
            : {
                name: "Crisis Asmática Severa Aguda",
                category: "Neumología",
                cie10: "J45.0 - Asma con exacerbación aguda",
                cie11: "CA23.0",
                serviceUnit: "Medicina Interna y Respiratorio",
                triageCode: "III",
                triageLevel: "Nivel III - Urgencia",
                severity: "moderate",
                baseHealth: 58.00,
                decayRate: 0.12,
                symptoms: ["Disnea sibilante", "Opresión torácica", "SpO2 al 89%"],
                description: "Broncoespasmo agudo con sibilancias espiratorias difusas y tiraje bilateral.",
                standardTreatment: {
                    name: "Nebulización con Salbutamol + Corticoide IV",
                    medication: "Salbutamol 5mg + Hidrocortisona 200mg IV + O2",
                    containsAllergens: [],
                    resources: { antibiotics: 0, serums: 1, analgesics: 0, oxygen: 2, insulin: 0, doctor: 0, nurse: 1 }
                },
                alternativeTreatment: {
                    name: "Bromuro de Ipratropio + Sulfato de Magnesio",
                    medication: "Ipratropio neb + MgSO4 IV + O2 cánula",
                    containsAllergens: [],
                    resources: { antibiotics: 0, serums: 1, analgesics: 0, oxygen: 2, insulin: 0, doctor: 0, nurse: 1 }
                },
                reward: { funds: 850.00, reputation: 6.00 }
            };

        // Generar diversidad demográfica (Pediatría, adultos, geriatría)
        const demographicsPool = [
            { name: "Sofía Valenzuela", age: 9, gender: "F", avatar: "👧", blood: "O+", ins: "FONASA Tramo A" },
            { name: "Agustín Morales", age: 12, gender: "M", avatar: "👦", blood: "A+", ins: "FONASA Tramo B" },
            { name: "Camila Navarro", age: 24, gender: "F", avatar: "👩", blood: "B-", ins: "Isapre CruzBlanca" },
            { name: "Diego Albornoz", age: 33, gender: "M", avatar: "👨", blood: "O-", ins: "Isapre Colmena" },
            { name: "Marcela Fuentes", age: 47, gender: "F", avatar: "👩‍🦱", blood: "A-", ins: "FONASA Tramo C" },
            { name: "Hernán Sepúlveda", age: 55, gender: "M", avatar: "👨‍🦰", blood: "AB+", ins: "FONASA Tramo D" },
            { name: "Teresa Bustamante", age: 72, gender: "F", avatar: "👵", blood: "O+", ins: "Isapre Banmédica" },
            { name: "Arnoldo Cárdenas", age: 81, gender: "M", avatar: "👨‍🦳", blood: "A+", ins: "FONASA Tramo A" }
        ];

        const demo = demographicsPool[Math.floor(Math.random() * demographicsPool.length)];

        // Alergias documentadas variadas
        const allergiesPool = [
            "Sin antecedentes alérgicos",
            "Sin antecedentes alérgicos",
            "Penicilina (Anafilaxia previa severa)",
            "Betalactámicos y Cefalosporinas",
            "AINEs (Ibuprofeno/Aspirina/Ketorolaco)",
            "Sulfamidas (Sulfametoxazol)",
            "Látex (Eritema de contacto y angioedema)",
            "Dipirona (Metamizol)"
        ];
        const assignedAllergy = allergiesPool[Math.floor(Math.random() * allergiesPool.length)];

        const index = this.data.patients.findIndex(p => p.id === bedId);
        if (index !== -1) {
            const bedNumber = this.data.patients[index].bedNumber;
            const newRecordId = `HC-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
            
            // Tratamientos estructurados con comprobación previa
            const stdSafe = !chosenDisease.standardTreatment.containsAllergens.some(a => assignedAllergy.toLowerCase().includes(a.toLowerCase()));
            const altSafe = !chosenDisease.alternativeTreatment.containsAllergens.some(a => assignedAllergy.toLowerCase().includes(a.toLowerCase()));

            const newPatient = {
                id: bedId,
                recordId: newRecordId,
                folio: `FOL-${Math.floor(1000 + Math.random() * 9000)}`,
                bedNumber: bedNumber,
                name: demo.name,
                age: demo.age,
                gender: demo.gender,
                avatar: demo.avatar,
                bloodType: demo.blood,
                insurance: demo.ins,
                rutDni: `${Math.floor(8 + Math.random() * 18)}.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}-${Math.floor(Math.random() * 9)}`,
                allergy: assignedAllergy,
                serviceUnit: chosenDisease.serviceUnit,
                triageLevel: chosenDisease.triageLevel,
                triageCode: chosenDisease.triageCode,
                disease: chosenDisease.name,
                cie10Code: chosenDisease.cie10,
                cie11Code: chosenDisease.cie11,
                diseaseDescription: chosenDisease.description,
                comorbidities: demo.age > 60 ? "Hipertensión arterial, Diabetes Tipo 2" : (demo.age < 18 ? "Ninguna comorbilidad infantil" : "Sin antecedentes mórbidos"),
                symptoms: [...chosenDisease.symptoms],
                severity: chosenDisease.severity,
                health: Number((chosenDisease.baseHealth + (Math.random() * 8 - 4)).toFixed(2)),
                cureProgress: 0.00,
                decayRate: chosenDisease.decayRate,
                isSpecialCritical: chosenDisease.severity === 'critical',
                isUnderTreatment: false,
                treatmentTimer: 0,
                treatmentTotalDuration: 22,
                possibleCure: chosenDisease.standardTreatment.medication,
                requiredResources: { ...chosenDisease.standardTreatment.resources },
                dischargeReward: { ...chosenDisease.reward },
                vitals: {
                    bpm: 80 + Math.floor(Math.random() * 25),
                    bpSys: 115 + Math.floor(Math.random() * 25),
                    bpDia: 75 + Math.floor(Math.random() * 15),
                    spo2: Number((93.0 + Math.random() * 5).toFixed(1)),
                    temp: Number((37.0 + Math.random() * 1.8).toFixed(1)),
                    respRate: 18 + Math.floor(Math.random() * 8)
                },
                availableTreatments: {
                    standard: {
                        id: "std",
                        name: chosenDisease.standardTreatment.name,
                        class: "Protocolo de Primera Línea",
                        medication: chosenDisease.standardTreatment.medication,
                        containsAllergens: chosenDisease.standardTreatment.containsAllergens,
                        description: "Esquema empírico inicial estándar según protocolos clínicos.",
                        requiredResources: { ...chosenDisease.standardTreatment.resources },
                        isSafeForPatient: stdSafe,
                        contraindicationReason: !stdSafe ? `¡CONTRAINDICADO! El paciente es alérgico a ${assignedAllergy}.` : null
                    },
                    alternative: {
                        id: "alt",
                        name: chosenDisease.alternativeTreatment.name,
                        class: "Protocolo de Rescate Seguro",
                        medication: chosenDisease.alternativeTreatment.medication,
                        containsAllergens: chosenDisease.alternativeTreatment.containsAllergens,
                        description: "Esquema alternativo seguro para pacientes con contraindicaciones.",
                        requiredResources: { ...chosenDisease.alternativeTreatment.resources },
                        isSafeForPatient: altSafe,
                        recommendationReason: !stdSafe ? "Tratamiento recomendado por CDSS para prevenir anafilaxia." : "Alternativa válida y segura."
                    },
                    contraindicated: chosenDisease.contraindicatedTreatment ? {
                        id: "contra",
                        name: chosenDisease.contraindicatedTreatment.name,
                        consequence: chosenDisease.contraindicatedTreatment.consequence,
                        healthPenalty: 35
                    } : null
                },
                evolutionConsequences: "El retraso o error de prescripción causará descompensación hemodinámica grave o anafilaxia fatal.",
                notes: "Ingreso asistencial registrado en sistema. Monitorización continua activada."
            };

            this.data.patients[index] = newPatient;

            if (window.hospitalDB) {
                window.hospitalDB.registerPatient({
                    recordId: newPatient.recordId,
                    folio: newPatient.folio,
                    bedNumber: newPatient.bedNumber,
                    serviceUnit: newPatient.serviceUnit,
                    triageLevel: newPatient.triageLevel,
                    triageCode: newPatient.triageCode,
                    name: newPatient.name,
                    avatar: newPatient.avatar,
                    age: newPatient.age,
                    gender: newPatient.gender,
                    rutDni: newPatient.rutDni,
                    bloodType: newPatient.bloodType,
                    insurance: newPatient.insurance,
                    allergy: newPatient.allergy,
                    disease: newPatient.disease,
                    cie10Code: newPatient.cie10Code,
                    cie11Code: newPatient.cie11Code,
                    diseaseDescription: newPatient.diseaseDescription,
                    comorbidities: newPatient.comorbidities,
                    symptoms: newPatient.symptoms,
                    vitals: newPatient.vitals,
                    status: "Hospitalizado",
                    admissionDate: new Date().toISOString().split('T')[0],
                    admissionTime: this.data.hospital.time,
                    financialImpact: "En curso",
                    health: Number(newPatient.health.toFixed(2)),
                    possibleCure: newPatient.possibleCure
                });
            }

            this.addLog(`📥 Nuevo ingreso en ${bedNumber}: ${newPatient.name} (${newPatient.age} años) - ${newPatient.disease}.`, 'info');
        }
    }

    buyItem(itemKey) {
        if (itemKey === 'clue') {
            return this.buyExtraClue();
        }

        const item = this.data.hospital.storePrices[itemKey];
        if (!item) return false;

        if (this.data.hospital.funds < item.cost) {
            this.addLog(`❌ Fondos insuficientes para adquirir ${item.name} ($${Number(item.cost).toFixed(2)} requeridos).`, 'warning');
            return false;
        }

        this.data.hospital.funds = Number((this.data.hospital.funds - item.cost).toFixed(2));
        this.data.hospital.dayStats.expenses = Number((this.data.hospital.dayStats.expenses + item.cost).toFixed(2));

        if (item.type === 'doctor') {
            this.data.hospital.staff.doctors.total += 1;
            this.addLog(`🩺 Médico especialista incorporado a la dotación de guardia.`, 'success');
        } else if (item.type === 'nurse') {
            this.data.hospital.staff.nurses.total += 1;
            this.addLog(`🩹 Enfermero/a incorporado/a al equipo asistencial.`, 'success');
        } else {
            this.data.hospital.supplies[item.key] += item.count;
            this.addLog(`📦 Adquisición registrada: ${item.name} (+${item.count} en almacén).`, 'success');
        }

        if (window.soundManager) window.soundManager.playCoins();
        this.notify();
        return true;
    }

    updatePatient(patientId, fields) {
        const patient = this.data.patients.find(p => p.id === patientId);
        if (!patient) return false;

        delete fields.health;
        delete fields.severity;

        Object.assign(patient, fields);

        if (window.hospitalDB) {
            window.hospitalDB.registerPatient({
                recordId: patient.recordId,
                name: patient.name,
                age: patient.age,
                gender: patient.gender,
                allergy: patient.allergy,
                disease: patient.disease,
                cie10Code: patient.cie10Code,
                symptoms: patient.symptoms,
                vitals: patient.vitals
            });
        }

        this.addLog(`📝 Expediente de ${patient.name} (${patient.bedNumber}) actualizado formalmente.`, 'info');
        this.notify();
        return true;
    }

    resetState() {
        this.data = JSON.parse(JSON.stringify(INITIAL_GAME_DATA));
        this.logs = [];
        this.currentDayReport = null;
        this.activeEventModal = null;
        this.syncInitialPatientsToDB();
        this.addLog("🔄 Sala hospitalaria y pacientes reiniciados formalmente.", "info");
        this.notify();
    }
}

window.hospitalGame = new HospitalGame();
