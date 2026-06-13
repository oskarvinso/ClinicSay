import { useState } from "react";
import { PatientAlertsPanel } from "./components/PatientAlertsPanel";
import { 
  Activity, 
  User, 
  Calendar, 
  Fingerprint, 
  Heart, 
  Stethoscope, 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  Info,
  Layers,
  Sparkles,
  FileText,
  FileImage
} from "lucide-react";

export default function App() {
  const [stats, setStats] = useState({ total: 4, active: 3, critical: 1 });

    // Mock data for patient profile - in a real application, this would be fetched from an API or database
  const patient = {
    id: "PT-101",
    name: "Lopez Valeria Camila",
    birthDate: "12 de Diciembre, 1991",
    age: "34 años",
    nhc: "702419-CS",
    bloodGroup: "O Positivo (O+)",
    attendingPhysician: "Dra. Elena Santillán",
    medicalSpecialty: "Odontología especializada",
    room: "Piso 4 - Cama 402-B",
    admissionDate: "10 de Junio, 2026",
    diagnosis: "Carcinoma ductal infiltrante de mama (estadio IIA) en quimioterapia adyuvante.",
    study: {
      modality: "Panoramica dental 3D",
      viewerUrl: "https://medusa.ameliasoft.net/ohif/viewer?hangingprotocolId=mprAnd3DVolumeViewport&StudyInstanceUIDs=2.16.840.1.113669.632.10.20251119.171202455.0.80"
    }
  };

  const handleRefreshStats = (newStats: { total: number; active: number; critical: number }) => {
    setStats(newStats);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Barra de navegación superior de ClinicSay */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white px-6 py-4 shadow-md border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img 
            src="https://clinicsay.com/wp-content/uploads/2025/06/logo-clinicsay-blanca.png" 
            alt="ClinicSay Logo" 
            className="h-8 w-auto object-contain mr-2"
            referrerPolicy="no-referrer"
          />
          <div className="border-l border-slate-700 pl-3">
            <h1 className="text-sm font-bold tracking-tight">Intelligence Dossier</h1>
            <p className="text-[10px] text-slate-400 font-medium font-mono">Soporte a Decisiones Clínicas en Tiempo Real</p>
          </div>
        </div>

        {/* Etiquetas de cumplimiento DDD */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] bg-slate-800/80 text-emerald-400 px-2.5 py-1 rounded-full border border-slate-700 font-semibold">
            <Layers className="h-3 w-3" />
            DDD Estricto
          </span>
          <span className="flex items-center gap-1 text-[10px] bg-slate-800/80 text-indigo-400 px-2.5 py-1 rounded-full border border-slate-700 font-semibold">
            <Fingerprint className="h-3 w-3" />
            Restricción Invariante Activa
          </span>
          <span className="flex items-center gap-1 text-[10px] bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-full font-bold">
            <Sparkles className="h-3 w-3" />
            Vite + Express Full-Stack
          </span>
        </div>
      </header>

      {/* Contenido principal en grid */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna izquierda: Perfil del paciente y resumen estadístico */}
        <section id="patient_dossier_column" className="lg:col-span-4 space-y-6">
          {/* Tarjeta médica del paciente */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Decoración de cabecera */}
            <div className="h-2 bg-slate-900"></div>
            
            <div className="p-6 space-y-5">
              {/* Avatar y resumen de nombre */}
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center flex-shrink-0 relative">
                  <User className="h-8 w-8 text-slate-600" />
                  <span className="absolute bottom-0 right-0 h-4.5 w-4.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold" title="Paciente Hospitalizado">
                    H
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">{patient.name}</h2>
                  <p className="text-xs font-bold text-indigo-600 tracking-wide uppercase mt-0.5">{patient.nhc}</p>
                  <p className="text-xs text-slate-500 mt-1">{patient.age} / {patient.birthDate}</p>
                </div>
              </div>

              {/* Bloque de diagnóstico */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                  <FileText className="h-3 w-3" /> Diagnóstico Primario de Ingreso
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {patient.diagnosis}
                </p>
              </div>

              {/* Factores clínicos clave (clave:valor) */}
              <div className="space-y-3.5 pt-2 text-left">
                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <Heart className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-slate-400 font-medium">Grupo Sanguíneo:</span>{" "}
                    <span className="font-bold text-slate-900">{patient.bloodGroup}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <Stethoscope className="h-4.5 w-4.5 text-indigo-500 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-slate-400 font-medium">Médico de Cabecera:</span>{" "}
                    <span className="font-bold text-slate-900">{patient.attendingPhysician}</span>
                    <span className="block text-[10px] text-slate-500 leading-none">{patient.medicalSpecialty}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <Building2 className="h-4.5 w-4.5 text-sky-500 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-slate-400 font-medium">Habitación:</span>{" "}
                    <span className="font-bold text-slate-900">{patient.room}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <FileImage className="h-4.5 w-4.5 text-violet-500 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-slate-400 font-medium">Estudio:</span>{" "}
                    <span className="font-bold text-slate-900">{patient.study.modality}</span>

                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <Calendar className="h-4.5 w-4.5 text-slate-500 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-slate-400 font-medium">Fecha de Ingreso:</span>{" "}
                    <span className="font-bold text-slate-900">{patient.admissionDate}</span>
                  </div>
                </div>


                  <div className="flex items-center gap-3 text-xs text-slate-700"> 

                    <a
                      href={patient.study.viewerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full h-[55px] text-center inline-flex justify-center items-center gap-2 text-base font-semibold text-white bg-violet-600 px-4 rounded-lg border border-violet-700 hover:bg-violet-700 transition"
                    >
                      Ver imágenes diagnósticas
                    </a>


                  </div>


              </div>
            </div>
          </div>

          {/* Panel rápido de indicadores estadísticos en tiempo real */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-left">Monitoreo de Alertas</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                <span className="block text-xl font-extrabold text-slate-900">{stats.total}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">Registradas</span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl text-center border border-indigo-100">
                <span className="block text-xl font-extrabold text-indigo-700">{stats.active}</span>
                <span className="text-[9px] font-bold text-indigo-600 uppercase">Activas</span>
              </div>
              <div className="p-3 bg-red-50 rounded-xl text-center border border-red-100 relative">
                <span className="block text-xl font-extrabold text-red-600 animate-pulse">{stats.critical}</span>
                <span className="text-[9px] font-bold text-red-600 uppercase">Críticas</span>
                {stats.critical > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
                )}
              </div>
            </div>

            {/* Pautas rápidas de seguridad para el personal médico */}
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-100 text-left space-y-2 mt-4 text-[11px] leading-relaxed text-amber-900 font-medium">
              <span className="font-extrabold flex items-center gap-1 text-xs">
                ⚠️ Protocolo Clínico de Medicamentos
              </span>
              <p>
                Antes de suministrar quimioterápicos u analgésicos betalactámicos, verifique que no posea banderas activas en el panel de la derecha.
              </p>
            </div>
          </div>
        </section>

        {/* Columna derecha: Motor central de alertas clínicas del paciente */}
        <section id="patient_alerts_column" className="lg:col-span-8">
          <PatientAlertsPanel 
            patientId={patient.id} 
            onRefreshStats={handleRefreshStats}
          />
        </section>

      </main>

      {/* Pie de página decorativo con telemetría de restricciones DDD de ClinicSay */}
      <footer className="mt-8 border-t border-slate-200 bg-white py-6 px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 ClinicSay Inc. Todos los derechos reservados. Sistema certificado HIPAA / RGPD.</p>
          <div className="flex items-center gap-4 text-[10px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span> BASE DE DATOS PRISMA: OPERANDO
            </span>
            <span className="text-slate-400">|</span>
            <span>ID Expediente: PT-101-Mendoza</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
