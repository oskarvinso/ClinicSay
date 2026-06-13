# ClinicSay PatientAlertsPanel - Soporte a Decisiones Clínicas

Este repositorio contiene la implementación del panel `PatientAlertsPanel`, diseñado para alertar al personal clínico sobre alergias, riesgos y condiciones críticas en tiempo real dentro de la ficha del paciente de ClinicSay. La documentación prioriza buenas prácticas de seguridad clínica y principios arquitectónicos sólidos.

---

## 🏛️ Arquitectura (DDD aplicada)

El proyecto sigue principios de Domain-Driven Design (DDD) para mantener la lógica clínica aislada y testeable. La solución se organiza en cuatro capas:

```
PRESENTATION  -> React UI, Controllers, DTOs
APPLICATION   -> Casos de uso (Create/Update/Get/Delete)
DOMAIN        -> Entidades, Enums, Reglas de negocio
INFRASTRUCTURE -> Repositorios, adaptadores, simulador de DB
```

### Capas principales
- `src/backend/domain` — Entidades de dominio (`AlertEntity`), enums (`AlertSeverity`, `AlertType`) y contratos (`IAlertRepository`).
- `src/backend/application` — Casos de uso: `CreateAlertUseCase`, `UpdateAlertUseCase`, `GetAlertsUseCase`, `DeleteAlertUseCase`.
- `src/backend/infrastructure` — Implementaciones de persistencia (ej. `PrismaAlertRepository`) y `PrismaClientSimulator` para pruebas locales.
- `src/backend/presentation` y `src/components` — Endpoints y componentes React que conforman la UI clínica.

---

## 🔒 Regla de Negocio Principal — Anti-Duplicado Clínico

No puede existir más de una alerta activa idéntica para el mismo paciente (mismo `patientId`, `type`, `message`, y `active = true`).

Estrategias de mitigación:
- En BD relacional, usar un índice único parcial sobre (patientId, type, message) cuando `active = true`.
- En la capa de aplicación, normalizar mensajes con `.replace(/\s+/g,' ').trim().toLowerCase()` antes de comparar.
- Las violaciones deben mapear a respuestas HTTP semánticas (`409 Conflict` para duplicados en creación, `400 Bad Request` para ediciones inválidas).

---

## 🛠️ Uso local

### Requisitos
- Node.js v20+

### Instalación
```bash
npm install
```

### Desarrollo
```bash
npm run dev
```

### Tests
```bash
npx tsx tests/run-tests.ts
```

### Build
```bash
npm run build
```

---

## 🧪 Cobertura de pruebas

El arnés de pruebas (`tests/run-tests.ts`) cubre:
- Lógica de dominio: bloqueo de duplicados activos.
- Historial: permitir duplicados inactivos para trazabilidad.
- Endpoints: respuestas correctas (`201`, `409`).
- Integración UI: ordenación por prioridad (alertas críticas arriba).

---

## 👥 Seguridad y buenas prácticas

- Protección de PHI: minimizar exposición de datos sensibles en endpoints.
- Sanitización: React ya escapa strings; validar entradas en backend.
- Robustez: casos de uso con invariantes claros y pruebas unitarias.
