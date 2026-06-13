import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { AlertData } from "./AlertCard";

interface AlertFormProps {
  patientId: string;
  onSave: (data: {
    type: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    message: string;
    active: boolean;
  }) => Promise<void>;
  onClose: () => void;
  initialAlert?: AlertData | null;
}

export const AlertForm: React.FC<AlertFormProps> = ({
  patientId,
  onSave,
  onClose,
  initialAlert
}) => {
  const [type, setType] = useState<string>("ALLERGY");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [message, setMessage] = useState<string>("");
  const [active, setActive] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Set initial fields if editing
  useEffect(() => {
    if (initialAlert) {
      setType(initialAlert.type);
      setSeverity(initialAlert.severity);
      setMessage(initialAlert.message);
      setActive(initialAlert.active);
    } else {
      setType("ALLERGY");
      setSeverity("MEDIUM");
      setMessage("");
      setActive(true);
    }
  }, [initialAlert]);

  const presets = [
    { type: "ALLERGY", label: "Alergia severa a Betalactámicos", text: "Alergia anafiláctica grave confirmada a betalactámicos (Penicilinas y Cefalosporinas)." },
    { type: "MEDICAL_RISK", label: "Diabetes Mellitus descompensada", text: "Paciente con Diabetes Mellitus Tipo 2 descompensada. Cuidado con insulinoterapia basal." },
    { type: "SPECIAL_CONDITION", label: "Déficit motor permanente", text: "Paciente con parálisis flácida de extremidades inferiores. Requiere asistencia integral en traslados." },
    { type: "ADMINISTRATIVE", label: "Consentimiento informado pendiente", text: "Procedimiento quirúrgico programado sin firmas de consentimiento médico." }
  ];

  const handlePresetSelect = (p: typeof presets[0]) => {
    setType(p.type);
    setMessage(p.text);
    if (p.type === "ALLERGY") setSeverity("HIGH");
    else if (p.type === "MEDICAL_RISK") setSeverity("HIGH");
    else setSeverity("MEDIUM");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Front-end Form Field Validations
    if (!message || message.trim() === "") {
      setError("El mensaje clínico es obligatorio.");
      return;
    }

    if (message.trim().length < 5) {
      setError("El mensaje clínico es muy breve. Detalle al menos 5 letras para seguridad clínica.");
      return;
    }

    if (message.length > 500) {
      setError("El mensaje clínico no puede superar los 500 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        type,
        severity,
        message: message.trim(),
        active
      });
      onClose();
    } catch (err: any) {
      // Collect errors returned from backend validation or duplication logic
      setError(err.message || "Error al guardar la alerta clínica.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div 
        id="alert_form_modal"
        className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col border border-slate-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialAlert ? "Editar Alerta de Riesgo" : "Registrar Nueva Alerta Médica"}
            </h3>
            <p className="text-xs text-slate-500 font-medium">NHC Paciente: {patientId}</p>
          </div>
          <button
            id="close_form_modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
          {error && (
            <div id="form_error_banner" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          {/* Quick presets (only shown when creating a new record) */}
          {!initialAlert && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Plantillas Médicas de Acceso Rápido</label>
              <div className="grid grid-cols-2 gap-1.5">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 hover:border-indigo-400 transition-all text-[11px] font-medium leading-tight cursor-pointer truncate"
                  >
                    💡 {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alert Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Clasificación Básica</label>
            <select
              id="form_input_type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALLERGY">Alergia (ALLERGY)</option>
              <option value="MEDICAL_RISK">Riesgo Clínico (MEDICAL_RISK)</option>
              <option value="SPECIAL_CONDITION">Condición Especial (SPECIAL_CONDITION)</option>
              <option value="ADMINISTRATIVE">Precaución Administrativa (ADMINISTRATIVE)</option>
            </select>
          </div>

          {/* Severity Badges selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Nivel de Gravedad Médica</label>
            <div className="grid grid-cols-3 gap-2">
              {(["LOW", "MEDIUM", "HIGH"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSeverity(lvl)}
                  className={`py-2 px-3 border rounded-xl text-xs font-bold text-center capitalize transition-all cursor-pointer ${
                    severity === lvl
                      ? lvl === "HIGH"
                        ? "bg-red-600 border-red-600 text-white shadow-sm ring-2 ring-red-400/50"
                        : lvl === "MEDIUM"
                        ? "bg-amber-500 border-amber-500 text-white shadow-sm ring-2 ring-amber-300/50"
                        : "bg-sky-600 border-sky-600 text-white shadow-sm ring-2 ring-sky-300/50"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Description Text area */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Mensaje de Alerta Médica</label>
              <span className={`text-[10px] font-mono ${message.length > 450 ? "text-red-500 font-bold" : "text-slate-400"}`}>
                {message.length} / 500
              </span>
            </div>
            <textarea
              id="form_textarea_message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describa íntegramente la alerta médica. Por ejemplo: Alergia grave diagnosticada por choque anafiláctico a penicilinas..."
              rows={4}
              maxLength={500}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent leading-relaxed resize-none"
            />
          </div>

          {/* Status active checkbox */}
          <div className="flex items-center gap-3 py-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
            <input
              id="form_checkbox_active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4.5 w-4.5 text-indigo-600 border-slate-300 rounded-md focus:ring-indigo-500 cursor-pointer"
            />
            <div className="text-left">
              <label htmlFor="form_checkbox_active" className="block text-xs font-bold text-slate-800 cursor-pointer">
                Activar Alerta de Inmediato
              </label>
              <p className="text-[10px] text-slate-500">
                Las alertas activas bloquean de forma imperativa cualquier registro idéntico nuevo para {patientId}.
              </p>
            </div>
          </div>

          {/* Footer action buttons */}
          <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
            <button
              id="close_cancel_btn"
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="submit_save_btn"
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-55"
            >
              {submitting ? (
                <span>Procesando...</span>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{initialAlert ? "Aplicar Cambios" : "Guardar Alerta"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
