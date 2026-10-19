import apiClient from '@/shared/lib/api-client'

export interface AttendanceSummary {
  completed: number
  no_show: number
  patient_reschedules: number
  psychologist_reschedules: number
  patient_cancellations: number
  psychologist_cancellations: number
  /** realizadas + faltas + remarcações e cancelamentos pedidos pelo paciente */
  total: number
  /** 0–100, ou null quando ainda não há base */
  rate: number | null
}

export interface PatientAttendance extends AttendanceSummary {
  patient_id: number
  name: string
}

export interface AttendanceResponse {
  summary: AttendanceSummary
  /** só na visão geral (sem patient_id), do menor para o maior índice */
  patients: PatientAttendance[] | null
}

export const attendanceApi = {
  async get(params: { patient_id?: number; days?: number | null }): Promise<AttendanceResponse> {
    return apiClient.get<AttendanceResponse>('/attendance/summary', { params })
  },
}
