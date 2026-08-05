import { Prescription, AdherenceRecord } from '../../types/medical.types';

// ─── Mock data: Doctor-issued prescriptions ───────────────────────────────────

const MOCK_DOCTOR_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-doc-1',
    patientId: 'pat-1',
    doctorId: 'doc-1',
    doctorName: 'Dr. Rahim Uddin',
    source: 'DOCTOR',
    issuedAt: '2026-06-15T08:30:00Z',
    imageUrl: 'https://placehold.co/800x1000/F4FAFC/40566d?text=Prescription+Rx-001',
    medicines: [
      {
        id: 'med-doc-1',
        name: 'Amoxicillin',
        dosage: '500mg',
        durationDays: 7,
        timesPerDay: 3,
        times: ['08:00', '14:00', '20:00'],
        dosageSchedule: { morning: '08:00', noon: '14:00', night: '20:00' },
        dosagePattern: '1+1+1',
        frequency: 'Three times daily',
        instructions: 'Take in the morning, noon and night after meals.',
        explanation:
          'Amoxicillin is an antibiotic that fights bacterial infections by stopping bacteria from forming cell walls. Take every 8 hours after eating to avoid stomach upset. Complete the full 7-day course even if you start feeling better — stopping early can allow bacteria to survive and develop resistance.',
        aiDemystifierSummary:
          'An antibiotic used to treat bacterial infections. It works by stopping the growth of bacteria. Finish the entire course even if you feel better.',
      },
      {
        id: 'med-doc-2',
        name: 'Ibuprofen',
        dosage: '400mg',
        durationDays: 3,
        timesPerDay: 2,
        times: ['08:00', '20:00'],
        dosageSchedule: { morning: '08:00', night: '20:00' },
        dosagePattern: '1+0+1',
        frequency: 'Twice daily, as needed',
        instructions: 'Take in the morning and night after meals.',
        explanation:
          'Ibuprofen is an anti-inflammatory painkiller (NSAID). It reduces fever and relieves pain by blocking chemicals in the body that cause inflammation. Take it with a meal or snack to prevent stomach irritation. Do not exceed the prescribed dose or take it for longer than 3 days without consulting your doctor.',
        aiDemystifierSummary:
          'A nonsteroidal anti-inflammatory drug (NSAID) used to reduce fever and treat pain or inflammation.',
      },
    ],
  },
  {
    id: 'rx-doc-2',
    patientId: 'pat-1',
    doctorId: 'doc-2',
    doctorName: 'Dr. Nasrin Begum',
    source: 'DOCTOR',
    issuedAt: '2026-07-01T10:00:00Z',
    imageUrl: 'https://placehold.co/800x1000/F4FAFC/40566d?text=Prescription+Rx-002',
    medicines: [
      {
        id: 'med-doc-3',
        name: 'Lisinopril',
        dosage: '10mg',
        durationDays: 30,
        timesPerDay: 1,
        times: ['08:00'],
        dosageSchedule: { morning: '08:00' },
        dosagePattern: '1+0+0',
        frequency: 'Once daily',
        instructions: 'Take in the morning after meals.',
        explanation:
          'Lisinopril is an ACE inhibitor prescribed to manage high blood pressure (hypertension). It works by relaxing blood vessels so your heart does not have to work as hard. Take it at the same time every morning. Do not stop taking it without consulting Dr. Begum — sudden discontinuation can cause blood pressure to spike.',
        aiDemystifierSummary:
          'An ACE inhibitor used to treat high blood pressure. It relaxes blood vessels so blood flows more smoothly.',
      },
      {
        id: 'med-doc-4',
        name: 'Amlodipine',
        dosage: '5mg',
        durationDays: 30,
        timesPerDay: 1,
        times: ['08:00'],
        dosageSchedule: { morning: '08:00' },
        dosagePattern: '1+0+0',
        frequency: 'Once daily',
        instructions: 'Take in the morning after meals.',
        explanation:
          'Amlodipine is a calcium channel blocker that helps lower blood pressure and reduce chest pain. It works by relaxing blood vessels so blood can flow more easily. It is safe to take with Lisinopril as prescribed — both medicines complement each other for blood pressure control.',
        aiDemystifierSummary:
          'A calcium channel blocker that lowers blood pressure by relaxing blood vessels.',
      },
    ],
  },
];

// ─── Mock data: User-uploaded prescriptions ───────────────────────────────────

const MOCK_UPLOADED_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-upload-1',
    patientId: 'pat-1',
    source: 'UPLOADED',
    issuedAt: '2026-05-20T09:00:00Z',
    imageUrl: 'https://placehold.co/800x1000/F4FAFC/40566d?text=Uploaded+Prescription',
    medicines: [
      {
        id: 'med-upload-1',
        name: 'Metformin',
        dosage: '500mg',
        durationDays: 90,
        timesPerDay: 2,
        times: ['07:30', '20:00'],
        dosageSchedule: { morning: '07:30', night: '20:00' },
        dosagePattern: '1+0+1',
        frequency: 'Twice daily',
        instructions: 'Take in the morning and night before meals.',
        explanation:
          'Metformin is a first-line medication for type 2 diabetes. It works by reducing the amount of glucose your liver releases into the blood and making your body more responsive to insulin. Always take it with food to minimise the risk of nausea or stomach upset.',
        aiDemystifierSummary: 'An oral diabetes medication that helps control blood sugar levels.',
      },
    ],
  },
];

// ─── Scheduled prescription state ─────────────────────────────────────────────
// In Phase 2 this will be driven by the backend. For now it is an in-memory
// mock that enforces the single-active-prescription invariant.

let _scheduledPrescriptionId: string | null = null;

// ─── Adherence records (unchanged from original) ──────────────────────────────

const MOCK_ADHERENCE: AdherenceRecord[] = [
  {
    id: 'adh-1',
    prescriptionId: 'rx-doc-1',
    medicineId: 'med-doc-1',
    date: new Date().toISOString().split('T')[0],
    status: 'TAKEN',
    scheduledTime: '08:00',
    takenTime: new Date(new Date().setHours(8, 15)).toISOString(),
  },
  {
    id: 'adh-2',
    prescriptionId: 'rx-doc-1',
    medicineId: 'med-doc-1',
    date: new Date().toISOString().split('T')[0],
    status: 'PENDING',
    scheduledTime: '14:00',
  },
  {
    id: 'adh-3',
    prescriptionId: 'rx-doc-2',
    medicineId: 'med-doc-3',
    date: new Date().toISOString().split('T')[0],
    status: 'MISSED',
    scheduledTime: '09:00',
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

export const prescriptionsService = {
  /** Returns all doctor-issued prescriptions. */
  getDoctorPrescriptions: async (): Promise<Prescription[]> =>
    new Promise((resolve) => setTimeout(() => resolve([...MOCK_DOCTOR_PRESCRIPTIONS]), 600)),

  /** Returns all user-uploaded prescriptions. */
  getUploadedPrescriptions: async (): Promise<Prescription[]> =>
    new Promise((resolve) => setTimeout(() => resolve([...MOCK_UPLOADED_PRESCRIPTIONS]), 600)),

  /** Returns all prescriptions merged (doctor-issued + uploaded). */
  getPrescriptions: async (): Promise<Prescription[]> =>
    new Promise((resolve) =>
      setTimeout(
        () => resolve([...MOCK_DOCTOR_PRESCRIPTIONS, ...MOCK_UPLOADED_PRESCRIPTIONS]),
        600,
      ),
    ),

  /** Returns details of a single prescription by ID. */
  getPrescriptionDetails: async (id: string): Promise<Prescription> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        const all = [...MOCK_DOCTOR_PRESCRIPTIONS, ...MOCK_UPLOADED_PRESCRIPTIONS];
        const rx = all.find((r) => r.id === id);
        if (rx) resolve(rx);
        else reject(new Error('Prescription not found'));
      }, 400);
    }),

  /** Returns the ID of the currently scheduled prescription (or null). */
  getScheduledPrescriptionId: (): string | null => _scheduledPrescriptionId,

  /**
   * Schedules a prescription for active use.
   * Enforces the global rule: only ONE prescription can be scheduled at a time.
   * Scheduling a new one automatically unschedules the previous one.
   */
  schedulePrescription: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        _scheduledPrescriptionId = id;
        resolve();
      }, 300);
    });
  },

  /** Unschedules the currently active prescription. */
  unschedulePrescription: async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        _scheduledPrescriptionId = null;
        resolve();
      }, 300);
    });
  },

  /** Returns the full Prescription object that is currently scheduled, or null. */
  getScheduledPrescription: async (): Promise<Prescription | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!_scheduledPrescriptionId) {
          resolve(null);
          return;
        }
        const all = [...MOCK_DOCTOR_PRESCRIPTIONS, ...MOCK_UPLOADED_PRESCRIPTIONS];
        const rx = all.find((r) => r.id === _scheduledPrescriptionId);
        resolve(rx ?? null);
      }, 400);
    });
  },

  getDailyAdherence: async (date: string): Promise<AdherenceRecord[]> =>
    new Promise((resolve) => {
      setTimeout(() => {
        const records = MOCK_ADHERENCE.filter((a) => a.date === date);
        resolve(records);
      }, 300);
    }),

  calculateAdherenceThreshold: (taken: number, total: number): 'GOOD' | 'FAIR' | 'POOR' => {
    if (total === 0) return 'GOOD';
    const percentage = (taken / total) * 100;
    if (percentage >= 80) return 'GOOD';
    if (percentage >= 50) return 'FAIR';
    return 'POOR';
  },

  /** Updates the medicine schedule (times and name) */
  updateMedicineSchedule: async (
    prescriptionId: string,
    medicineId: string,
    updates: {
      name?: string;
      dosageSchedule?: { morning?: string; noon?: string; night?: string };
    },
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const all = [...MOCK_DOCTOR_PRESCRIPTIONS, ...MOCK_UPLOADED_PRESCRIPTIONS];
        const rx = all.find((r) => r.id === prescriptionId);
        if (!rx) {
          reject(new Error('Prescription not found'));
          return;
        }
        const med = rx.medicines.find((m) => m.id === medicineId);
        if (!med) {
          reject(new Error('Medicine not found'));
          return;
        }

        if (updates.name !== undefined) {
          med.name = updates.name;
        }
        if (updates.dosageSchedule !== undefined) {
          med.dosageSchedule = updates.dosageSchedule;

          // Calculate new dosage pattern based on morning/noon/night
          const m = med.dosageSchedule.morning ? '1' : '0';
          const n = med.dosageSchedule.noon ? '1' : '0';
          const e = med.dosageSchedule.night ? '1' : '0';
          med.dosagePattern = `${m}+${n}+${e}`;

          // Keep times array in sync for backward compatibility
          const newTimes: string[] = [];
          if (med.dosageSchedule.morning) newTimes.push(med.dosageSchedule.morning);
          if (med.dosageSchedule.noon) newTimes.push(med.dosageSchedule.noon);
          if (med.dosageSchedule.night) newTimes.push(med.dosageSchedule.night);
          med.times = newTimes;
          med.timesPerDay = newTimes.length;
        }
        resolve();
      }, 300);
    });
  },
};
