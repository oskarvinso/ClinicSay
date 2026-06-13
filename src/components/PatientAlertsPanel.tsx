import React, { useState, useEffect } from "react";
import { AlertCard, AlertData } from "./AlertCard";
import { AlertForm } from "./AlertForm";
import { PlusCircle, Search, SlidersHorizontal, RefreshCw } from "lucide-react";

interface PatientAlertsPanelProps {
  patientId: string;
  onRefreshStats?: (stats: { total: number; active: number; critical: number }) => void;
}

export const PatientAlertsPanel: React.FC<PatientAlertsPanelProps> = ({
  patientId,
  onRefreshStats
}) => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("CLINICAL_PRIME"); // CLINICAL_PRIME, NEWEST, OLDEST

  // Form modal controller
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingAlert, setEditingAlert] = useState<AlertData | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Fetch alerts from backend
  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/alerts`);
      if (!res.ok) {
        throw new Error("No se han podido recargar las alertas desde el servidor clínico.");
      }
      const data: AlertData[] = await res.json();
      setAlerts(data);

      // Trigger statistics callback for our parent dashboard
      if (onRefreshStats) {
        const total = data.length;
        const active = data.filter(a => a.active).length;
        const critical = data.filter(a => a.active && a.severity === "HIGH").length;
        onRefreshStats({ total, active, critical });
      }
    } catch (err: any) {
      setError(err.message || "Fallo de conexión crítico. Valide estado del backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [patientId]);

  // Create or Update Alert call
  const handleSaveAlert = async (formData: {
    type: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    message: string;
    active: boolean;
  }) => {
    setActionLoading(true);
    try {
      let url = `/api/patients/${patientId}/alerts`;
      let method = "POST";

      if (editingAlert) {
        url = `/api/patient-alerts/${editingAlert.id}`;
        method = "PATCH";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "La regla médica abortó el registro.");
      }

      // Success, reload entire medical dataset
      await fetchAlerts();
      setEditingAlert(null);
      setIsFormOpen(false);
    } catch (err: any) {
      throw err; // Propagate back to form to render validation banners
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle active/inactive state immediately
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/patient-alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentStatus })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "La regla médica impidió la reactivación de la alerta.");
      }

      await fetchAlerts();
    } catch (err: any) {
      console.warn("Operation aborted: ", err.message);
      setError(err.message);
      // Automatically dismiss the violation banner after 6 seconds
      setTimeout(() => setError(null), 6000);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete alert physical record
  const handleDeleteAlert = async (id: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/patient-alerts/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("No se ha podido retirar la alerta.");
      }

      await fetchAlerts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCreateForm = () => {
    setEditingAlert(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (alert: AlertData) => {
    setEditingAlert(alert);
    setIsFormOpen(true);
  };

  // Apply searching + client-side filter selectors dynamically
  const filteredAlerts = alerts
    .filter((alert) => {
      // 1. Text Search query matching messages or categories
      const normalizedQuery = searchTerm.toLowerCase().trim();
      const matchSearch =
        alert.message.toLowerCase().includes(normalizedQuery) ||
        alert.type.toLowerCase().includes(normalizedQuery);

      // 2. Severity check matches
      const matchSeverity = severityFilter === "ALL" || alert.severity === severityFilter;

      // 3. Active status check matches
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && alert.active) ||
        (statusFilter === "INACTIVE" && !alert.active);

      return matchSearch && matchSeverity && matchStatus;
    })
    .sort((a, b) => {
      // Sort strategy matches client selectors
      if (sortBy === "NEWEST") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "OLDEST") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      
      // Default: CLINICAL_PRIME (Active state first, then HIGH > MEDIUM > LOW scores, then newest)
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      const score: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const scoreA = score[a.severity] || 0;
      const scoreB = score[b.severity] || 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div id="patient_alerts_panel" className="w-full flex flex-col space-y-6">
      
      {/* Clinically Styled Alert error alert banners */}
      {error && (
        <div id="panel_global_error" className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-bold shadow-xs leading-relaxed flex items-center gap-3">
          <span className="text-base">⚠️</span>
          <div>
            <p className="font-extrabold uppercase tracking-wide">Invariante Médico Bloqueado</p>
            <p className="text-amber-800 font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-amber-500 hover:text-amber-900 cursor-pointer">✕</button>
        </div>
      )}

      {/* Controller Block: Search tools + trigger buttons */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Alertas de Riesgo Clínico</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">{alerts.length} totales</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
              Identificación obligatoria de contraindicaciones y alergias farmacéuticas.
            </p>
          </div>

          <button
            id="create_new_alert_btn"
            onClick={handleOpenCreateForm}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:scale-[1.01] cursor-pointer"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            <span>Agregar Entrada</span>
          </button>
        </div>

        {/* Search controls + selectors */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Text Input Search query matches */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              id="search_bar_input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por mensaje clínco, síntoma, categoría..."
              className="w-full bg-slate-50 border border-slate-300/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white"
            />
          </div>

          {/* Filtering active triggers */}
          <div>
            <select
              id="filter_select_status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300/80 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="ALL">🔍 Todos los Estados</option>
              <option value="ACTIVE">● Activas (Prioritarias)</option>
              <option value="INACTIVE">◌ Archivadas (Historial)</option>
            </select>
          </div>

          {/* Ordering metrics */}
          <div>
            <select
              id="sort_select_ordering"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300/80 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="CLINICAL_PRIME">🩺 Gravedad Prioritaria</option>
              <option value="NEWEST">⏳ Más Recientes Primero</option>
              <option value="OLDEST">⏳ Más Antiguas Primero</option>
            </select>
          </div>
        </div>

        {/* Extra Severity selectors badges */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-2 flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" /> Severidad:
          </span>
          {[
            { key: "ALL", label: "Todas" },
            { key: "HIGH", label: "● CRÍTICA (HIGH)" },
            { key: "MEDIUM", label: "● MODERADA (MEDIUM)" },
            { key: "LOW", label: "● BAJA (LOW)" }
          ].map((item) => (
            <button
              key={item.key}
              id={`filter_severity_${item.key}`}
              onClick={() => setSeverityFilter(item.key)}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-transform cursor-pointer hover:scale-101 ${
                severityFilter === item.key
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* Manual refresher */}
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="p-1 px-2.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors ml-auto flex items-center gap-1 text-[10px] font-bold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Main Alert List Rendering Container */}
      {loading ? (
        // High fidelity loading states
        <div id="panel_loading_container" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 border border-slate-200 rounded-xl p-5 space-y-3 animate-pulse h-[155px]">
              <div className="h-4 bg-slate-200 rounded-md w-1/3"></div>
              <div className="h-10 bg-slate-200 rounded-md"></div>
              <div className="h-6 bg-slate-200 rounded-md w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        // Beautiful, illustrative clinical empty state
        <div id="panel_empty_container" className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 font-bold text-xl">
            ✓
          </div>
          <h3 className="text-sm font-bold text-slate-900">Vía de Atención Segura</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto mt-1">
            {searchTerm || severityFilter !== "ALL" || statusFilter !== "ALL"
              ? "No se hallaron coincidencias basadas en los filtros clínicos de búsqueda seleccionados."
              : "Este expediente electrónico no registra alertas activas. Proceda de forma normal con la dosificación y diagnóstico."}
          </p>
          {(searchTerm || severityFilter !== "ALL" || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSeverityFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="mt-4 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      ) : (
        // Display Alertas
        <div id="panel_alerts_list" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onToggleActive={handleToggleActive}
              onEdit={handleOpenEditForm}
              onDelete={handleDeleteAlert}
              isActionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Creation and Modification alert form modal */}
      {isFormOpen && (
        <AlertForm
          patientId={patientId}
          onSave={handleSaveAlert}
          onClose={() => setIsFormOpen(false)}
          initialAlert={editingAlert}
        />
      )}
    </div>
  );
};
