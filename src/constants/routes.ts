export const Routes = {
  AUTH: {
    LOGIN: '/(auth)/login',
    REGISTER: '/(auth)/register',
    ONBOARDING: '/(auth)/onboarding',
  },
  TABS: {
    HOME: '/(app)/(tabs)',
    DOCTORS: '/(app)/(tabs)/doctors',
    HOSPITALS: '/(app)/(tabs)/hospitals',
    REPORTS: '/(app)/(tabs)/reports',
  },
  AI_CHAT: {
    HOME: '/(app)/ai-chat',
  },
  EMERGENCY: {
    HOME: '/(app)/emergency',
    PROTOCOL: '/(app)/emergency/protocol',
  },
  MEDICINE: {
    DETAIL: '/(app)/medicine/detail',
    COMPARATOR: '/(app)/medicine/comparator',
    INTERACTION: '/(app)/medicine/interaction',
  },
  SYMPTOM: {
    TRIAGE: '/(app)/symptom/triage',
    RESULTS: '/(app)/symptom/results',
  },
  PEDIATRIC: {
    HOME: '/(app)/pediatric',
  },
  VITALS: {
    HOME: '/(app)/vitals',
    HISTORY: '/(app)/vitals/history',
  },
  DOCTORS: {
    DIRECTORY: '/(app)/doctors',
    DETAIL: '/(app)/doctors/detail',
    BOOKING: '/(app)/doctors/booking',
  },
  PRESCRIPTIONS: {
    LIST: '/(app)/prescriptions',
    DETAIL: '/(app)/prescriptions/detail',
  },
  REPORT: {
    LIST: '/(app)/report',
    DETAIL: '/(app)/report/detail',
    UPLOAD: '/(app)/report/upload',
  },
  SETTINGS: {
    PROFILE: '/(app)/settings/profile',
    LANGUAGE: '/(app)/settings/language',
    THEME: '/(app)/settings/theme',
  },
  NOTIFICATIONS: '/(app)/notifications',
} as const;
