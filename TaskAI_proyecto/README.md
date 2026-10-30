# VitaSentinel — Plataforma de Vigilancia Clínica y Monitoreo Asistencial

**VitaSentinel** es una plataforma web sanitaria profesional diseñada para la vigilancia clínica hospitalaria, el monitoreo centralizado de pacientes internados, la detección priorizada de alertas y el análisis exploratorio de cohortes e inteligencia epidemiológica.

> [!IMPORTANT]
> **Aviso Regulatorio y Ético Obligatorio:**
> VitaSentinel es un sistema de soporte y asistencia al juicio clínico humano. **No constituye un dispositivo médico de diagnóstico autónomo ni toma decisiones prescriptivas o terapéuticas automáticas**. Todos los datos, pacientes, parámetros fisiológicos y eventos mostrados en esta versión son **estrictamente sintéticos y demostrativos**. Cualquier implementación en entornos reales requiere validación clínica protocolizada, aprobación de comités éticos e integración segura bajo estándares HL7 FHIR y normativas de privacidad vigentes.

---

## 🏥 Arquitectura del Sistema y Módulos Sanitarios

La interfaz ha sido reconstruida bajo principios de ergonomía clínica visual, accesibilidad (WCAG 2.1 AA/AAA) y navegación estructurada en 6 áreas especializadas:

1. **Centro de Control (Command Center)**  
   - Resumen operativo en tiempo real: Censo de ocupación (28 camas), pacientes críticos, casos en revisión y evolución estable.
   - Roster de pacientes con necesidad de evaluación presencial inmediata.
   - Distribución de carga asistencial por sectores.

2. **Unidad de Monitoreo (Plano Esquemático de Sala)**  
   - Mapa arquitectónico profesional de internación hospitalaria dividido en 4 sectores:
     - **Sector A:** UCI / Cuidados Críticos (Box 101 a 106).
     - **Sector B:** Cuidados Intermedios / Alta Dependencia (Salas 201 a 204).
     - **Sector C:** Aislamiento Respiratorio (Salas 301 a 304 con presión negativa).
     - **Sector D:** Hospitalización General y Cuidados Médicos (Habitaciones 401 a 410).
   - Pods de cama interactivos con telemetría en vivo, código pseudonimizado (`PAC-XXXX`), prioridad por color + icono + texto, y score sintético NEWS2.
   - **Slide-Over Drawer:** Panel lateral deslizante con antecedentes, codificación **CIE-11, CIE-10 y SNOMED-CT**, trazado *sparkline* de tendencia a 12 horas, notas de evolución y acciones de confirmación asistencial.

3. **Inteligencia Clínica**  
   - Catálogo estandarizado de patologías agudas y crónicas (Neumología, Cardiología, Infectología, Neurología, Endocrinología).
   - **Comparador Multicondición:** Contraste simultáneo de rangos basales de signos vitales, ventanas críticas de complicación, respuesta a oxigenoterapia y prevalencia en cohortes.
   - Visualización de distribuciones etarias y matriz de severidad.
   - Aviso de gobernanza: análisis exploratorio que no asume causalidad.

4. **Alertas y Seguimiento**  
   - Bandeja priorizada con filtros por nivel de criticidad (Alta, Media, Baja) y estado de revisión.
   - Acciones seguras no prescriptivas: *Ver contexto clínico*, *Marcar cama revisada*, *Escalar según protocolo* y *Registrar nota*.
   - Tarjeta de estimación de riesgo demostrativa explicada, no determinista.

5. **Centros y Red Hospitalaria**  
   - Módulo preparado para federación multi-institucional en red sanitaria metropolitana.
   - Monitoreo agregado de 4 nodos hospitalarios simulados (800 camas).
   - Conector con perfil HL7 FHIR Release 4 y métricas de latencia de red.

6. **Administración, Seguridad y Bitácora de Auditoría**  
   - **Control de Acceso Basado en Roles (RBAC):**
     - *Médico Clínico (Asistencial)*: Ronda médica, telemetría y evolución.
     - *Coordinador de Guardia*: Gestión global de camas y escalamiento de alertas.
     - *Investigador Clínico*: Inteligencia clínica y cohortes anonimizadas.
     - *Administrador del Sistema*: Auditoría inmutable y configuración.
   - **Bitácora de Auditoría en Tiempo Real:** Trazabilidad inmutable de accesos, consultas de fichas, revisiones y notas clínicas con sello de tiempo.
   - **Accesibilidad y Ergonomía Visual:**
     - Modo Claro Clínico (óptimo para turnos diurnos).
     - Modo Nocturno Suave (para puestos de guardia con baja iluminación ambiental).
     - Modo de Alto Contraste asistencial.
     - Escalado tipográfico para pantallas de sala.
     - Soporte riguroso para `prefers-reduced-motion`.

---

## 🚀 Puesta en Marcha

### Requisitos
- **Node.js**: v18+ (probado y verificado en Node.js v24 LTS).
- **NPM**: Incluido con Node.js.

### Instalación y Ejecución

```bash
# 1. Acceder al directorio del proyecto
cd TaskAI_proyecto

# 2. Instalar dependencias limpias
npm install

# 3. Iniciar el servidor clínico
npm start
```

La plataforma estará disponible en:
👉 **`http://localhost:3000`**

### Usuarios Demostrativos Pre-configurados (RBAC)

| Profesional | Correo | Rol Asistencial | Contraseña |
| :--- | :--- | :--- | :--- |
| **Dra. Elena Morales** | `elena.morales@vitasentinel.org` | Médico Clínico (Asistencial) | `clinica123` |
| **Dr. Javier Roca** | `javier.roca@vitasentinel.org` | Coordinador de Guardia | `clinica123` |
| **Dra. Beatriz Santos** | `beatriz.santos@vitasentinel.org` | Investigadora Clínica | `clinica123` |
| **Lic. Marcos Vega** | `admin@vitasentinel.org` | Administrador del Sistema | `clinica123` |

*(La pantalla de inicio de sesión incluye botones de acceso directo a cada perfil para facilitar la evaluación rápida).*

---

## 🔒 Privacidad, Gobernanza y Seguridad de Datos

1. **Datos Sintéticos y Anonimización:** Ningún dato personal identificable (PII) ni información clínica protegida (PHI) real es almacenada o transmitida. Todos los identificadores siguen esquemas pseudonimizados estandarizados (`PAC-9101`, etc.).
2. **Auditoría Permanente:** Cada visualización de paciente, confirmación de alerta o registro de evolución genera un evento auditable con usuario, rol, IP y marca de tiempo en la tabla SQLite `audit_logs`.
3. **Resiliencia Operativa:** La arquitectura del frontend incorpora mecanismos de almacenamiento y simulación local en memoria, garantizando que la interfaz y las herramientas analíticas permanezcan operativas incluso ante eventuales desconexiones del backend.
