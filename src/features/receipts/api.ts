import apiClient from '@/shared/lib/api-client';
import type {
  HealthReceipt,
  HealthReceiptResponse,
  HealthReceiptsResponse,
  UpdateHealthReceiptData,
} from '@/features/receipts/types';

class HealthReceiptService {
  async getAll(params?: {
    status?: 'pending' | 'issued';
    patient_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<{ receipts: HealthReceipt[]; pending_count: number }> {
    const response = await apiClient.get<HealthReceiptsResponse>('/health-receipts', { params });
    return {
      receipts: response.receipts,
      pending_count: response.pending_count,
    };
  }

  async getById(id: number): Promise<HealthReceipt> {
    const response = await apiClient.get<HealthReceiptResponse>(`/health-receipts/${id}`);
    return response.receipt;
  }

  async update(id: number, data: UpdateHealthReceiptData): Promise<HealthReceipt> {
    const response = await apiClient.put<HealthReceiptResponse>(`/health-receipts/${id}`, data);
    return response.receipt;
  }

  async issue(id: number, proof: File): Promise<HealthReceipt> {
    const formData = new FormData();
    formData.append('proof', proof);
    try {
      const response = await apiClient.getAxiosInstance().post<HealthReceiptResponse>(
        `/health-receipts/${id}/issue`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.receipt;
    } catch (err: any) {
      // 422: junta os erros de validação numa mensagem legível
      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        const details = Object.values(validationErrors).flat().join(' | ');
        throw Object.assign(new Error(details), { response: { ...err.response, data: { message: details } } });
      }
      throw err;
    }
  }

  async exportPendingPdf(params?: {
    patient_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<void> {
    const response = await apiClient.getAxiosInstance().get('/health-receipts/export-pending', {
      params,
      responseType: 'blob',
    });

    const contentType = (response.headers['content-type'] as string) || 'application/pdf';
    const disposition = (response.headers['content-disposition'] as string) || '';
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    const serverFilename = match ? match[1].replace(/['"]/g, '').trim() : null;
    const filename =
      serverFilename || `recibos-saude-pendentes_${new Date().toISOString().slice(0, 10)}.pdf`;

    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async downloadProof(id: number): Promise<void> {
    const response = await apiClient.getAxiosInstance().get(`/health-receipts/${id}/proof`, {
      responseType: 'blob',
    });

    const contentType = (response.headers['content-type'] as string) || 'application/pdf';
    const ext = contentType.includes('png')
      ? 'png'
      : contentType.includes('jpeg') || contentType.includes('jpg')
      ? 'jpg'
      : 'pdf';

    // Tenta pegar nome do Content-Disposition (só funciona se CORS expõe o header)
    const disposition = (response.headers['content-disposition'] as string) || '';
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    const serverFilename = match ? match[1].replace(/['"]/g, '').trim() : null;

    const filename = serverFilename || `recibo_saude_${id}.${ext}`;

    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async downloadMyHealthReceipt(paymentId: number): Promise<void> {
    const response = await apiClient.getAxiosInstance().get(
      `/patient/payments/${paymentId}/health-receipt/download`,
      { responseType: 'blob' }
    );

    const contentType = (response.headers['content-type'] as string) || 'application/pdf';
    const ext = contentType.includes('png')
      ? 'png'
      : contentType.includes('jpeg') || contentType.includes('jpg')
      ? 'jpg'
      : 'pdf';

    const disposition = (response.headers['content-disposition'] as string) || '';
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    const serverFilename = match ? match[1].replace(/['"]/g, '').trim() : null;

    const filename = serverFilename || `recibo_saude_${paymentId}.${ext}`;

    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const healthReceiptService = new HealthReceiptService();
export default healthReceiptService;
