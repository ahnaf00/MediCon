export interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string; // ISO 8601
  bloodGroup: string;
  heightCm?: number;
  weightKg?: number;
  allergies: string[];
  chronicConditions: string[];
}

export interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string;
  department: string;
  licenseNumber: string;
  consultationFee: number;
  isOnline: boolean;
  rating: number;
  reviewCount: number;
  about: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string; // ISO 8601
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  mode: 'IN_PERSON' | 'VIDEO';
  notes?: string;
}

/**
 * Prescription shape matching the backend PrescriptionResource.
 * Fields that existed only in the old frontend mock are marked optional
 * and suffixed with a comment so existing UI code doesn't break immediately.
 */
export interface Prescription {
  id: string | number;
  /** ISO 8601 timestamp — maps to backend's createdAt. */
  issuedAt: string;
  diagnosisSummary?: string;
  status?: 'active' | 'expired' | 'cancelled';
  /** Issuing doctor (from backend UserResource). */
  doctor?: { id: number; name: string; avatarUrl: string | null };
  /** Patient this prescription belongs to (from backend UserResource). */
  patient?: { id: number; name: string; avatarUrl: string | null };
  medicines: PrescriptionMedicine[];
  appointmentId?: number | null;
  // ── Legacy mock-only fields (kept for backward compat) ──
  patientId?: string;
  doctorId?: string;
  doctorName?: string;
  notes?: string;
  imageUrl?: string;
  source?: 'DOCTOR' | 'UPLOADED';
}

export interface PrescriptionMedicine {
  id: string | number;
  name: string;
  dosage: string;
  durationDays: number;
  /** Free-form schedule object from backend, e.g. { morning: "08:00" }. */
  dosageSchedule?: Record<string, string> | { morning?: string; noon?: string; night?: string };
  /** Human-readable schedule format from backend, e.g. "1+0+1". */
  scheduleFormat?: string | null;
  instructions?: string | null;
  // ── Legacy mock-only fields ──
  timesPerDay?: number;
  times?: string[];
  dosagePattern?: string;
  frequency?: string;
  explanation?: string;
  aiDemystifierSummary?: string;
}

export type AdherenceStatus = 'TAKEN' | 'PENDING' | 'MISSED';

export interface AdherenceRecord {
  id: string;
  prescriptionId: string;
  medicineId: string;
  date: string; // ISO 8601 (YYYY-MM-DD)
  status: AdherenceStatus;
  scheduledTime?: string; // HH:mm format
  takenTime?: string; // ISO 8601 if taken
}

export interface Biomarker {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  isFlagged: boolean;
  category?: string;
  testGroup?: string;
  subGroup?: string;
}

export interface Report {
  id: string;
  patientId: string;
  title: string;
  type: string; // e.g., 'BLOOD_TEST', 'XRAY'
  date: string; // ISO 8601
  laboratory?: string;
  imageUrl?: string;
  fileUri?: string; // For newly uploaded documents/PDFs
  fileType?: 'image' | 'multi_image' | 'pdf'; // Discriminates thumbnail rendering strategy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  thumbnails?: any[]; // Local require() image sources for the card thumbnail grid
  pageCount?: number; // Pages in an uploaded record; drives the "+N" badge
  biomarkers?: Biomarker[];
  aiSummary?: string;
}

export interface Medicine {
  id: string;
  genericName: string;
  brandName: string;
  therapeuticClass: string;
  forms: string[]; // e.g., 'Tablet', 'Syrup'
  sideEffects: string[];
  contraindications: string[];
}

export interface Question {
  id: string;
  /** Empty when the question is anonymous and the viewer is a doctor. */
  patientId: string;
  /** Null when hidden by anonymity. */
  patientName?: string | null;
  department: string;
  symptomId?: string;
  content: string;
  isAnonymous?: boolean;
  createdAt: string; // ISO 8601
  /** Replies so far (from the listing); `answers` holds the loaded ones. */
  answerCount: number;
  answers: QuestionAnswer[];
}

export interface QuestionAnswer {
  id: string;
  doctorId: string;
  doctorName?: string;
  content: string;
  createdAt: string; // ISO 8601
}

// ─── Conversation types (matching ConversationController / ConversationResource) ─

/**
 * A direct doctor↔patient conversation thread.
 * Replaces the old department-routed Question/Answer model in the backend.
 */
export interface Conversation {
  id: number;
  subject: string | null;
  status: string;
  patient: { id: number; name: string; avatarUrl: string | null };
  doctor: { id: number; name: string; avatarUrl: string | null };
  latestMessage: ConversationMessage | null;
  createdAt: string;
}

export interface ConversationMessage {
  id: number;
  /** Message text — backend field key is "body", NOT "content". */
  body: string;
  sender: { id: number; name: string; avatarUrl: string | null };
  readAt: string | null;
  createdAt: string;
}

// ─── Vital type (matching VitalResource from VitalController) ─────────────────

export interface ApiVital {
  id: string;
  bloodPressure: string | null; // "SYS/DIA" format, e.g. "120/80"
  pulseRate: number | null;
  glucoseLevel: number | null;
  oxygenSaturation: number | null;
  loggedAt: string; // ISO 8601
  createdAt: string;
}

// ─── AI Triage type (matching AiTriageResource) ───────────────────────────────

export interface AiTriageResult {
  id: string;
  symptomsSummary: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  recommendedAction: string;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  patientId: string;
  name: string;
  phoneNumber: string;
  relationship: string;
}

export interface VitalReading {
  id: string;
  patientId: string;
  type: 'BLOOD_PRESSURE' | 'HEART_RATE' | 'TEMPERATURE' | 'OXYGEN_LEVEL' | 'BLOOD_SUGAR';
  value: string; // Stored as string for flexibility (e.g. "120/80")
  unit: string;
  recordedAt: string; // ISO 8601
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contactNumber: string;
  emergencyNumber?: string;
  hasEmergencyRoom: boolean;
  distanceKm?: number;
  isOpen24x7: boolean;
  imageUrl?: string;
}

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'REMINDER' | 'CONFIRMATION' | 'QNA_ANSWER' | 'SYSTEM';
  isRead: boolean;
  createdAt: string; // ISO 8601
  actionUrl?: string;
}
