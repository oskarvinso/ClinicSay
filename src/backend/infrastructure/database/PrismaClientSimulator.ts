import * as fs from 'fs';
import * as path from 'path';

export interface AlertSchema {
  id: string;
  patientId: string;
  type: string;
  severity: string;
  message: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Simulador de Prisma de alta fidelidad que representa persistencia de datos duradera.
 * Carga y escribe registros en un archivo JSON local para garantizar la preservación del estado.
 */
export class PrismaClientSimulator {
  private filePath: string;
  private memoryCache: AlertSchema[] = [];

  constructor() {
    // Resolver la ruta absoluta en el workspace de forma segura
    const databaseDir = path.resolve(process.cwd(), "src/backend/infrastructure/database");
    
    // Asegurar que las carpetas padre existan
    if (!fs.existsSync(databaseDir)) {
      fs.mkdirSync(databaseDir, { recursive: true });
    }

    this.filePath = path.join(databaseDir, "prisma-db.json");
    this.initializeDataAndLoad();
  }

  private initializeDataAndLoad(): void {
    if (!fs.existsSync(this.filePath)) {
      // Sembrar alertas clínicas iniciales de alta fidelidad para la paciente principal Sofía Alarcón Mendoza (PT-101)
      const starterAlerts: AlertSchema[] = [
        {
          id: "alert_001",
          patientId: "PT-101",
          type: "ALLERGY",
          severity: "HIGH",
          message: "Alergia anafiláctica confirmada a antibióticos betalactámicos (Penicilina).",
          active: true,
          createdAt: new Date(Date.now() - 360000000).toISOString(), // hace 4 días
          updatedAt: new Date(Date.now() - 360000000).toISOString()
        },
        {
          id: "alert_002",
          patientId: "PT-101",
          type: "MEDICAL_RISK",
          severity: "MEDIUM",
          message: "Paciente bajo tratamiento anticoagulante activo. Monitorear tiempos de coagulación constantemente.",
          active: true,
          createdAt: new Date(Date.now() - 180000000).toISOString(), // hace 2 días
          updatedAt: new Date(Date.now() - 180000000).toISOString()
        },
        {
          id: "alert_003",
          patientId: "PT-101",
          type: "SPECIAL_CONDITION",
          severity: "LOW",
          message: "Paciente ingresa con silla de ruedas para traslados ambulatorios.",
          active: false,
          createdAt: new Date(Date.now() - 50000000).toISOString(),
          updatedAt: new Date(Date.now() - 50000000).toISOString()
        },
        {
          id: "alert_004",
          patientId: "PT-101",
          type: "ADMINISTRATIVE",
          severity: "LOW",
          message: "Requiere facturación directa especial con seguro hospitalario pre-autorizado.",
          active: true,
          createdAt: new Date(Date.now() - 10000000).toISOString(),
          updatedAt: new Date(Date.now() - 10000000).toISOString()
        }
      ];

      fs.writeFileSync(this.filePath, JSON.stringify(starterAlerts, null, 2), "utf8");
      this.memoryCache = starterAlerts;
    } else {
      try {
        const raw = fs.readFileSync(this.filePath, "utf8");
        this.memoryCache = JSON.parse(raw);
      } catch (err) {
        console.error("Error reading database, creating a fallback empty file", err);
        this.memoryCache = [];
      }
    }
  }

  private saveChanges(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.memoryCache, null, 2), "utf8");
    } catch (err) {
      console.error("Failed to persist database file", err);
    }
  }

  // OPERACIONES SIMULADAS DE PRISMA

  public async findMany(whereArgs: { patientId?: string }): Promise<AlertSchema[]> {
    if (whereArgs.patientId) {
      return this.memoryCache.filter(itm => itm.patientId === whereArgs.patientId);
    }
    return [...this.memoryCache];
  }

  public async findFirst(whereArgs: { patientId: string; type: string; message: string; active: boolean }): Promise<AlertSchema | null> {
    const found = this.memoryCache.find(itm => 
      itm.patientId === whereArgs.patientId &&
      itm.type === whereArgs.type &&
      itm.message.toLowerCase().trim() === whereArgs.message.toLowerCase().trim() &&
      itm.active === whereArgs.active
    );
    return found || null;
  }

  public async findUnique(whereArgs: { id: string }): Promise<AlertSchema | null> {
    const found = this.memoryCache.find(itm => itm.id === whereArgs.id);
    return found || null;
  }

  public async create(data: Omit<AlertSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertSchema> {
    const record: AlertSchema = {
      ...data,
      id: "alert_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.memoryCache.push(record);
    this.saveChanges();
    return record;
  }

  public async update(id: string, data: Partial<Omit<AlertSchema, 'id'>>): Promise<AlertSchema> {
    const idx = this.memoryCache.findIndex(itm => itm.id === id);
    if (idx === -1) {
      throw new Error(`Record with ID ${id} not found.`);
    }

    const updatedRecord: AlertSchema = {
      ...this.memoryCache[idx],
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.memoryCache[idx] = updatedRecord;
    this.saveChanges();
    return updatedRecord;
  }

  public async delete(id: string): Promise<boolean> {
    const initialLen = this.memoryCache.length;
    this.memoryCache = this.memoryCache.filter(itm => itm.id !== id);
    if (this.memoryCache.length < initialLen) {
      this.saveChanges();
      return true;
    }
    return false;
  }

  /**
   * Método auxiliar para suites de prueba: limpiar caché / cargar estado personalizado
   */
  public overrideDatabase(customData: AlertSchema[]): void {
    this.memoryCache = customData;
    this.saveChanges();
  }
}

// Instancia única activa en toda la aplicación, simulando un bloque singleton de transacciones de base de datos
export const prismaInstance = new PrismaClientSimulator();
