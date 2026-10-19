import apiClient from '@/shared/lib/api-client'
import type { MoodType } from '@/features/diary/types'
import type { Emotion } from './ui'

export interface MoodCheckin {
  date: string
  mood: MoodType
  emotions?: Emotion[] | null
  note: string | null
}

export interface MoodHistory {
  since: string
  checkins: MoodCheckin[]
  summary: {
    count: number
    /** 1 (muito triste) a 5 (ótimo) */
    average: number | null
    counts: Record<MoodType, number>
    /** média da 2ª metade menos a da 1ª (positivo = melhorando) */
    trend: number | null
    last_checkin: string | null
    /** emoção → nº de registros (mais frequente primeiro) */
    emotion_counts: Partial<Record<Emotion, number>>
    /** idem, só nos dias triste ou pior */
    emotion_low_days: Partial<Record<Emotion, number>>
    low_days: number
  }
}

export interface MoodAlert {
  patient_id: number
  name: string
  severity: 'high' | 'medium'
  reason: string
  last_mood: MoodType
  last_date: string
}

export interface MoodOverview {
  portal_patients: number
  answered_today: number
  week_average: number | null
  week_respondents: number
  week_emotions: Partial<Record<Emotion, number>>
  alerts: MoodAlert[]
}

export const moodApi = {
  today: () => apiClient.get<{ date: string; checkin: MoodCheckin | null }>('/patient/mood/today'),
  save: (data: { mood: MoodType; emotions?: Emotion[]; note?: string | null }) => apiClient.post<{ checkin: MoodCheckin }>('/patient/mood', data),
  mine: (days: number) => apiClient.get<{ since: string; checkins: MoodCheckin[] }>('/patient/mood', { params: { days } }),
  overview: () => apiClient.get<MoodOverview>('/mood/overview'),
  forPatient: (patientId: number, days: number) => apiClient.get<MoodHistory>(`/patients/${patientId}/mood`, { params: { days } }),
}
