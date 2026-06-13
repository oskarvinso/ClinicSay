import React from "react";
import { ShieldAlert, TriangleAlert, Info, Trash2, Edit, CheckCircle, XCircle } from "lucide-react";

export interface AlertData {
  id: string;
  patientId: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  message: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AlertCardProps {
  alert: AlertData;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onEdit: (alert: AlertData) => void;
  onDelete: (id: string) => void;
  isActionLoading: boolean;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onToggleActive,
  onEdit,
  onDelete,
  isActionLoading
}) => {
  const getSeverityStyles = () => {
    if (!alert.active) {
      return "border-l-4 border-slate-300 bg-slate-50/60 text-slate-600 opacity-70 shadow-sm";
    }

    switch (alert.severity) {
      case "HIGH":
        return "border-l-4 border-red-600 bg-red-50/90 text-red-950 shadow-md ring-1 ring-red-200/50 animate-pulse-subtle";
      case "MEDIUM":
        return "border-l-4 border-amber-500 bg-amber-50/80 text-amber-950 shadow-sm ring-1 ring-amber-100/50";
      case "LOW":
        return "border-l-4 border-sky-500 bg-sky-50/50 text-sky-950 shadow-xs";
      default:
        return "border-l-2 border-slate-400 bg-slate-50 text-slate-900";
    }
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case "ALLERGY":
        return "Alergia Médica";
      case "MEDICAL_RISK":
        return "Riesgo Clínico";
      case "SPECIAL_CONDITION":
        return "Condición Especial";
      case "ADMINISTRATIVE":
        return "Precaución Administrativa";
      default:
        return type;
    }
  };

  const getCategoryIcon = () => {
    if (alert.severity === "HIGH" && alert.active) {
      return <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0" />;
    }
    if (alert.severity === "MEDIUM" && alert.active) {
      return <TriangleAlert className="h-5 w-5 text-amber-600 flex-shrink-0" />;
    }
    return <Info className="h-5 w-5 text-slate-500 flex-shrink-0" />;
  };

  return (
    <div
      id={`alert_card_${alert.id}`}
      className={`relative p-5 rounded-xl transition-all duration-300 flex flex-col justify-between overflow-hidden ${getSeverityStyles()}`}
    >
      {/* Decorative pulse for active high severityalerts */}
      {alert.active && alert.severity === "HIGH" && (
        <span className="absolute top-3 right-3 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
        </span>
      )}

      <div>
        <div className="flex items-center gap-2 mb-2">
          {getCategoryIcon()}
          <span className="font-mono text-xs tracking-wider uppercase font-semibold">
            {getCategoryLabel(alert.type)}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ml-auto tracking-wide ${
              !alert.active
                ? "bg-slate-200 text-slate-700"
                : alert.severity === "HIGH"
                ? "bg-red-200 text-red-900 animate-pulse"
                : alert.severity === "MEDIUM"
                ? "bg-amber-200 text-amber-900"
                : "bg-sky-200 text-sky-900"
            }`}
          >
            {alert.severity}
          </span>
        </div>

        <p className="text-sm font-medium leading-relaxed tracking-tight py-2 border-t border-slate-200/50 mt-2">
          {alert.message}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200/50 mt-4 pt-3 gap-2">
        {/* Status Toggle Switch */}
        <button
          id={`toggle_active_${alert.id}`}
          onClick={() => onToggleActive(alert.id, alert.active)}
          disabled={isActionLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            alert.active
              ? "bg-slate-200 hover:bg-slate-300 text-slate-800"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          } disabled:opacity-50`}
        >
          {alert.active ? (
            <>
              <XCircle className="h-3.5 w-3.5" />
              <span>Desactivar</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Activar Alerta</span>
            </>
          )}
        </button>

        {/* Action Panel: Edit & Delete */}
        <div className="flex items-center gap-1">
          <button
            id={`edit_btn_${alert.id}`}
            onClick={() => onEdit(alert)}
            title="Editar Alerta"
            disabled={isActionLoading}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            id={`delete_btn_${alert.id}`}
            onClick={() => {
              if (window.confirm("¿Está seguro de eliminar físicamente esta alerta clínica? Esta acción no se puede deshacer.")) {
                onDelete(alert.id);
              }
            }}
            title="Eliminar Alerta"
            disabled={isActionLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
