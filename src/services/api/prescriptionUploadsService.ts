// Paper prescriptions a patient uploads (task 1.7, audit D1).
// Stored as the original pages only: nothing reads or extracts medicines from them.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';
import type { UploadRecordPage } from './reportsService';
import type { Prescription } from '../../types/medical.types';
import { fromLocalDateString } from '../../utils/localDate';

export interface PrescriptionUploadPage {
  id: number;
  order: number;
  isPdf: boolean;
  /** Signed URL, valid for 15 minutes. */
  fileUrl: string;
}

export interface PrescriptionUpload {
  id: number;
  title: string | null;
  doctorName: string | null;
  /** Calendar date YYYY-MM-DD, or null when the patient left it blank. */
  issuedOn: string | null;
  notes: string | null;
  createdAt: string;
  pageCount: number;
  pages: PrescriptionUploadPage[];
}

export interface UploadPrescriptionPayload {
  pages: UploadRecordPage[];
  title?: string;
  doctorName?: string;
  /** YYYY-MM-DD (build with toLocalDateString, not toISOString). */
  issuedOn?: string;
  notes?: string;
}

/** Shapes an upload for the shared prescriptions list (card + tabs). */
export const uploadToPrescription = (upload: PrescriptionUpload): Prescription => {
  const issued = upload.issuedOn ? fromLocalDateString(upload.issuedOn) : null;
  return {
    id: upload.id,
    source: 'UPLOADED',
    issuedAt: issued ? issued.toISOString() : upload.createdAt,
    diagnosisSummary: upload.title || 'Paper prescription',
    doctorName: upload.doctorName ?? undefined,
    notes: upload.notes ?? undefined,
    medicines: [],
    pageCount: upload.pageCount,
  };
};

export const prescriptionUploadsService = {
  getUploads: async (): Promise<PrescriptionUpload[]> => {
    const res = (await axiosClient.get('/prescription-uploads')) as any;
    return res?.uploads ?? [];
  },

  getUpload: async (id: number): Promise<PrescriptionUpload> => {
    const res = (await axiosClient.get(`/prescription-uploads/${id}`)) as any;
    return res?.upload ?? res;
  },

  upload: async ({
    pages,
    title,
    doctorName,
    issuedOn,
    notes,
  }: UploadPrescriptionPayload): Promise<PrescriptionUpload> => {
    const formData = new FormData();
    for (const page of pages) {
      formData.append('files[]', {
        uri: page.fileUri,
        type: page.mimeType,
        name: page.fileName,
      } as any);
    }
    if (title?.trim()) formData.append('title', title.trim());
    if (doctorName?.trim()) formData.append('doctor_name', doctorName.trim());
    if (issuedOn) formData.append('issued_on', issuedOn);
    if (notes?.trim()) formData.append('notes', notes.trim());

    const res = (await axiosClient.post('/prescription-uploads', formData, {
      timeout: 120000,
      // Let React Native set the multipart boundary (see reportsService.uploadRecord).
      transformRequest: (data, headers) => {
        delete headers['Content-Type'];
        return data;
      },
    })) as any;
    return res?.upload ?? res;
  },

  deleteUpload: async (id: number): Promise<void> => {
    await axiosClient.delete(`/prescription-uploads/${id}`);
  },
};

export const usePrescriptionUpload = (id: number) =>
  useQuery({
    queryKey: ['prescription-uploads', id],
    queryFn: () => prescriptionUploadsService.getUpload(id),
    enabled: !!id,
  });

export const useUploadPrescription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: prescriptionUploadsService.upload,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescription-uploads'] }),
  });
};

export const useDeletePrescriptionUpload = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: prescriptionUploadsService.deleteUpload,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescription-uploads'] }),
  });
};
