import apiClient from '@/shared/lib/api-client'
import type { SessionReport } from './report.types'

/** Obs.: o api-client já devolve o corpo da resposta (a versão Next acessava `.data` de novo e quebrava). */
class SessionReportService {
  async exists(patientId: number, sessionId: number): Promise<{ exists: boolean; reportId?: number }> {
    const body = await apiClient.get<{ exists: boolean; report_id?: number | null }>(
      `/patients/${patientId}/sessions/${sessionId}/report/exists`,
    )
    return { exists: !!body.exists, reportId: body.report_id ?? undefined }
  }

  async get(patientId: number, sessionId: number): Promise<SessionReport> {
    return (await apiClient.get<{ data: SessionReport }>(`/patients/${patientId}/sessions/${sessionId}/report`)).data
  }

  async getAll(patientId: number): Promise<SessionReport[]> {
    return (await apiClient.get<{ data: SessionReport[] }>(`/patients/${patientId}/reports`)).data
  }

  async create(patientId: number, sessionId: number, data: { title?: string; content: string }): Promise<SessionReport> {
    return (await apiClient.post<{ data: SessionReport }>(`/patients/${patientId}/sessions/${sessionId}/report`, data)).data
  }

  async update(patientId: number, sessionId: number, data: { title?: string; content?: string }): Promise<SessionReport> {
    return (await apiClient.put<{ data: SessionReport }>(`/patients/${patientId}/sessions/${sessionId}/report`, data)).data
  }
}

export const sessionReportService = new SessionReportService()
export default sessionReportService
