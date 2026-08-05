import { Report } from '../../types/medical.types';
import {
  reportSingleImage,
  reportMultiImage1,
  reportMultiImage2,
  reportMultiImage3,
} from '../../constants/images';

// Mock list of previously parsed reports
let MOCK_REPORTS: Report[] = [
  {
    id: 'rep-mock-complex-1',
    patientId: 'pat-1',
    title: 'Comprehensive Lab Report',
    type: 'LAB_REPORT',
    date: '2026-02-06T10:41:00Z',
    laboratory: 'LABAID LTD. (DIAGNOSTICS)',
    fileType: 'multi_image',
    thumbnails: [reportMultiImage1, reportMultiImage2, reportMultiImage3],
    aiSummary:
      'The comprehensive lab report indicates slightly elevated fasting blood glucose and lipid profile (Total Cholesterol and LDL). TSH is also marginally high. Liver function and CBC are mostly normal, with a slight elevation in MPV. Please consult your physician for clinical correlation.',
    biomarkers: [
      {
        id: 'b-comp-1',
        name: 'Haemoglobin',
        value: 13.1,
        unit: 'g/dL',
        referenceRange: 'Female 11.5-15.5, Male 13.5-18.0',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Red Blood Cells',
      },
      {
        id: 'b-comp-2',
        name: 'Total RBC',
        value: 4.6,
        unit: 'X 10^12/ L',
        referenceRange: 'Female 3.8-4.8, Male 4.5-5.5',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Red Blood Cells',
      },
      {
        id: 'b-comp-3',
        name: 'ESR',
        value: 23,
        unit: 'mm in1st.H',
        referenceRange: 'Female<38, Male<29',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Red Blood Cells',
      },
      {
        id: 'b-comp-4',
        name: 'PCV / Hct',
        value: 41.0,
        unit: '%',
        referenceRange: 'Female 36-46, Male 40-50',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Red Blood Cells',
      },
      {
        id: 'b-comp-5',
        name: 'MCV',
        value: 88.6,
        unit: 'fL',
        referenceRange: '82-100',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Red Blood Cells',
      },
      {
        id: 'b-comp-6',
        name: 'MCH',
        value: 28.2,
        unit: 'pg',
        referenceRange: '27-32',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Red Blood Cells',
      },
      {
        id: 'b-comp-7',
        name: 'MCHC',
        value: 31.8,
        unit: 'g/dL',
        referenceRange: '30-35',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Red Blood Cells',
      },
      {
        id: 'b-comp-8',
        name: 'RDW-SD',
        value: 43.9,
        unit: 'fL',
        referenceRange: '39.00 - 46.00',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Red Blood Cells',
      },
      {
        id: 'b-comp-9',
        name: 'RDW-CV',
        value: 13.8,
        unit: '%',
        referenceRange: '11.5-14.0',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Red Blood Cells',
      },
      {
        id: 'b-comp-10',
        name: 'Total WBC',
        value: 8.0,
        unit: 'X 10^9/L',
        referenceRange: '04.00 - 11.00',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'White Blood Cells',
      },
      {
        id: 'b-comp-11',
        name: 'Neutrophils',
        value: 54,
        unit: '%',
        referenceRange: '40-75',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Differential Counts',
      },
      {
        id: 'b-comp-12',
        name: 'Lymphocytes',
        value: 40,
        unit: '%',
        referenceRange: '20-40',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Differential Counts',
      },
      {
        id: 'b-comp-13',
        name: 'Monocytes',
        value: 4,
        unit: '%',
        referenceRange: '02-10',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Differential Counts',
      },
      {
        id: 'b-comp-14',
        name: 'Eosinophils',
        value: 2,
        unit: '%',
        referenceRange: '01-06',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Differential Counts',
      },
      {
        id: 'b-comp-15',
        name: 'Basophils',
        value: 0,
        unit: '%',
        referenceRange: '< 01',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Differential Counts',
      },
      {
        id: 'b-comp-16',
        name: 'Platelets Count',
        value: 258,
        unit: 'X 10^9/L',
        referenceRange: '150 - 450',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Platelets',
      },
      {
        id: 'b-comp-17',
        name: 'MPV',
        value: 12.7,
        unit: 'fL',
        referenceRange: '7.50-12',
        isFlagged: true,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Platelets',
      },
      {
        id: 'b-comp-18',
        name: 'PDW',
        value: 15.9,
        unit: 'fL',
        referenceRange: '10 - 16',
        isFlagged: false,
        category: 'HAEMATOLOGY',
        testGroup: 'CBC',
        subGroup: 'Platelets',
      },
      {
        id: 'b-comp-19',
        name: 'Total Cholesterol',
        value: 239.0,
        unit: 'mg/dL',
        referenceRange: 'Desirable: <200',
        isFlagged: true,
        category: 'BIOCHEMISTRY',
        testGroup: 'LIPID PROFILE SERUM (F)',
      },
      {
        id: 'b-comp-20',
        name: 'HDL Cholesterol',
        value: 53.0,
        unit: 'mg/dL',
        referenceRange: 'Low: <40, High: >=60',
        isFlagged: false,
        category: 'BIOCHEMISTRY',
        testGroup: 'LIPID PROFILE SERUM (F)',
      },
      {
        id: 'b-comp-21',
        name: 'LDL Cholesterol',
        value: 159.4,
        unit: 'mg/dL',
        referenceRange: 'Optimal: < 100',
        isFlagged: true,
        category: 'BIOCHEMISTRY',
        testGroup: 'LIPID PROFILE SERUM (F)',
      },
      {
        id: 'b-comp-22',
        name: 'Triglycerides',
        value: 138.2,
        unit: 'mg/dL',
        referenceRange: 'Normal: <150',
        isFlagged: false,
        category: 'BIOCHEMISTRY',
        testGroup: 'LIPID PROFILE SERUM (F)',
      },
      {
        id: 'b-comp-23',
        name: 'Plasma Glucose Fasting',
        value: 6.5,
        unit: 'mmol/L',
        referenceRange: '<6.1 (WHO)',
        isFlagged: true,
        category: 'BIOCHEMISTRY',
        testGroup: 'GLUCOSE FASTING PLASMA',
      },
      {
        id: 'b-comp-24',
        name: 'CUS Fasting',
        value: 'Nil',
        unit: '',
        referenceRange: '',
        isFlagged: false,
        category: 'BIOCHEMISTRY',
        testGroup: 'CUS FASTING',
      },
      {
        id: 'b-comp-25',
        name: '2 HRS AFTER 75GM GLUCOSE',
        value: 12.5,
        unit: 'mmol/L',
        referenceRange: '< 7.8',
        isFlagged: true,
        category: 'BIOCHEMISTRY',
        testGroup: 'GLUCOSE 2HR AFTER 75GM BLOOD',
      },
      {
        id: 'b-comp-26',
        name: 'CUS 2hrs After 75 gm Glucose',
        value: 'Present(+)',
        unit: '',
        referenceRange: '',
        isFlagged: true,
        category: 'BIOCHEMISTRY',
        testGroup: 'CUS 2HRS AFTER 75GM GLUCOSE',
      },
      {
        id: 'b-comp-27',
        name: 'TSH',
        value: 4.92,
        unit: 'uIU/ml',
        referenceRange: '0.3 - 4.5',
        isFlagged: true,
        category: 'IMMUNOLOGY',
        testGroup: 'TSH',
      },
      {
        id: 'b-comp-28',
        name: 'F-T4',
        value: 1.47,
        unit: 'pg/mL',
        referenceRange: '0.90 - 1.75',
        isFlagged: false,
        category: 'IMMUNOLOGY',
        testGroup: 'FREE-T4/F-T4',
      },
    ],
  },
  {
    id: 'rep-1',
    patientId: 'pat-1',
    title: 'Complete Blood Count',
    type: 'BLOOD_TEST',
    date: '2026-06-15T08:30:00Z',
    laboratory: 'Central Diagnostic Lab',
    fileType: 'image',
    thumbnails: [reportSingleImage],
    aiSummary:
      'Your CBC shows mildly elevated white blood cells, which could indicate a minor infection or inflammation. Hemoglobin and platelet counts are well within normal ranges. Please consult your physician if you are experiencing any symptoms like fever.',
    biomarkers: [
      {
        id: 'b-1',
        name: 'Hemoglobin',
        value: 14.2,
        unit: 'g/dL',
        referenceRange: '13.5 - 17.5',
        isFlagged: false,
      },
      {
        id: 'b-2',
        name: 'White Blood Cells (WBC)',
        value: 11.5,
        unit: 'x10^9/L',
        referenceRange: '4.5 - 11.0',
        isFlagged: true,
      },
      {
        id: 'b-3',
        name: 'Platelet Count',
        value: 250,
        unit: 'x10^9/L',
        referenceRange: '150 - 450',
        isFlagged: false,
      },
    ],
  },
  {
    id: 'rep-2',
    patientId: 'pat-1',
    title: 'Lipid Panel',
    type: 'BLOOD_TEST',
    date: '2025-11-10T09:00:00Z',
    laboratory: 'City Health Clinic',
    fileType: 'multi_image',
    thumbnails: [reportMultiImage1, reportMultiImage2, reportMultiImage3],
    aiSummary:
      'Your lipid panel shows elevated LDL (bad cholesterol) and borderline high total cholesterol. HDL (good cholesterol) is normal. Your doctor may recommend dietary changes or exercise to improve these numbers.',
    biomarkers: [
      {
        id: 'b-4',
        name: 'Total Cholesterol',
        value: 210,
        unit: 'mg/dL',
        referenceRange: '< 200',
        isFlagged: true,
      },
      {
        id: 'b-5',
        name: 'HDL Cholesterol',
        value: 45,
        unit: 'mg/dL',
        referenceRange: '> 40',
        isFlagged: false,
      },
      {
        id: 'b-6',
        name: 'LDL Cholesterol',
        value: 140,
        unit: 'mg/dL',
        referenceRange: '< 100',
        isFlagged: true,
      },
      {
        id: 'b-7',
        name: 'Triglycerides',
        value: 125,
        unit: 'mg/dL',
        referenceRange: '< 150',
        isFlagged: false,
      },
    ],
  },
  {
    id: 'rep-3',
    patientId: 'pat-1',
    title: 'Chest X-Ray Report',
    type: 'XRAY',
    date: '2026-01-22T11:00:00Z',
    laboratory: 'National Medical Center',
    fileType: 'pdf',
    thumbnails: [],
    aiSummary:
      'The chest X-ray report has been analyzed. No significant abnormalities detected in the lung fields. Heart size appears normal. Please consult your doctor for a full clinical interpretation.',
    biomarkers: [],
  },
];

export const reportsService = {
  getReports: async (): Promise<Report[]> => {
    // Simulate network delay
    return new Promise((resolve) => setTimeout(() => resolve([...MOCK_REPORTS]), 800));
  },

  getReportDetails: async (id: string): Promise<Report> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const report = MOCK_REPORTS.find((r) => r.id === id);
        if (report) {
          resolve(report);
        } else {
          reject(new Error('Report not found'));
        }
      }, 500);
    });
  },

  uploadReport: async (fileUri: string, type: string, fileName: string): Promise<Report> => {
    // Simulate a long OCR / AI parsing process
    return new Promise((resolve) => {
      setTimeout(() => {
        const newReport: Report = {
          id: `rep-mock-${Date.now()}`,
          patientId: 'pat-1',
          title: `Scanned ${fileName}`,
          type: type.includes('pdf') ? 'DOCUMENT' : 'IMAGE_SCAN',
          date: new Date().toISOString(),
          laboratory: 'Unknown',
          fileUri,
          aiSummary:
            'The uploaded document has been analyzed. We detected a standard metabolic panel. Glucose levels appear slightly above the fasting range, but other electrolytes are balanced. This is an AI generated summary; please consult a doctor.',
          biomarkers: [
            {
              id: 'b-new-1',
              name: 'Fasting Glucose',
              value: 105,
              unit: 'mg/dL',
              referenceRange: '70 - 99',
              isFlagged: true,
            },
            {
              id: 'b-new-2',
              name: 'Sodium',
              value: 140,
              unit: 'mEq/L',
              referenceRange: '135 - 145',
              isFlagged: false,
            },
            {
              id: 'b-new-3',
              name: 'Potassium',
              value: 4.2,
              unit: 'mEq/L',
              referenceRange: '3.6 - 5.2',
              isFlagged: false,
            },
          ],
        };
        MOCK_REPORTS.unshift(newReport); // Add to mock memory so it shows in list
        resolve(newReport);
      }, 2500); // 2.5 seconds delay to simulate real parsing
    });
  },

  updateReport: async (id: string, data: Partial<Report>): Promise<Report> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = MOCK_REPORTS.findIndex((r) => r.id === id);
        if (index > -1) {
          MOCK_REPORTS[index] = { ...MOCK_REPORTS[index], ...data };
          resolve(MOCK_REPORTS[index]);
        } else {
          reject(new Error('Report not found'));
        }
      }, 300);
    });
  },

  deleteReport: async (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const initialLength = MOCK_REPORTS.length;
        MOCK_REPORTS = MOCK_REPORTS.filter((r) => r.id !== id);
        if (MOCK_REPORTS.length < initialLength) {
          resolve();
        } else {
          reject(new Error('Report not found'));
        }
      }, 300);
    });
  },
};
