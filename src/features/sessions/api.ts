import apiClient from '@/shared/lib/api-client';
import type {
  Session,
  SessionsResponse,
  SessionResponse,
  SessionMutationResponse,
  SessionSeriesInfo,
  CreateMultipleSessionsData,
  UpdateSessionData,
  SessionApplyTo,
} from '@/features/sessions/types';

class SessionService {
  /**
   * Get all sessions for the logged psychologist (for calendar)
   */
  async getAllSessions(params?: {
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Session[]> {
    const response = await apiClient.get<SessionsResponse>(
      '/sessions',
      { params }
    );
    return response.sessions;
  }

  /**
   * Get all sessions for a patient
   */
  async getPatientSessions(
    patientId: number,
    params?: {
      status?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<Session[]> {
    const response = await apiClient.get<SessionsResponse>(
      `/patients/${patientId}/sessions`,
      { params }
    );
    return response.sessions;
  }

  /**
   * Get a specific session
   */
  async getSession(patientId: number, sessionId: number): Promise<Session> {
    const response = await apiClient.get<SessionResponse>(
      `/patients/${patientId}/sessions/${sessionId}`
    );
    return response.session;
  }

  /**
   * Create multiple sessions at once
   */
  async createSessions(
    patientId: number,
    data: CreateMultipleSessionsData
  ): Promise<Session[]> {
    const response = await apiClient.post<SessionsResponse>(
      `/patients/${patientId}/sessions`,
      data
    );
    return response.sessions;
  }

  /**
   * Get series info for edit scope
   */
  async getSeriesInfo(patientId: number, sessionId: number): Promise<SessionSeriesInfo> {
    const response = await apiClient.get<{ success: boolean } & SessionSeriesInfo>(
      `/patients/${patientId}/sessions/${sessionId}/series-info`
    );
    return {
      has_series: response.has_series,
      future_count: response.future_count,
    };
  }

  /**
   * Update a session
   */
  async updateSession(
    patientId: number,
    sessionId: number,
    data: UpdateSessionData
  ): Promise<{ session: Session; updated_sessions_count: number }> {
    const response = await apiClient.put<SessionMutationResponse>(
      `/patients/${patientId}/sessions/${sessionId}`,
      data
    );
    return {
      session: response.session,
      updated_sessions_count: response.updated_sessions_count ?? 1,
    };
  }

  /**
   * Mark session as completed
   */
  async markAsCompleted(patientId: number, sessionId: number): Promise<Session> {
    const response = await apiClient.post<SessionResponse>(
      `/patients/${patientId}/sessions/${sessionId}/complete`
    );
    return response.session;
  }

  /**
   * Mark session as no show (falta)
   */
  async markAsNoShow(patientId: number, sessionId: number): Promise<Session> {
    const response = await apiClient.post<SessionResponse>(
      `/patients/${patientId}/sessions/${sessionId}/no-show`
    );
    return response.session;
  }

  /**
   * Reschedule a session
   */
  async reschedule(
    patientId: number,
    sessionId: number,
    data: {
      session_date: string;
      duration?: number | null;
      notes?: string | null;
      apply_to?: SessionApplyTo;
      initiated_by?: 'patient' | 'psychologist';
    }
  ): Promise<{ session: Session; updated_sessions_count: number }> {
    const response = await apiClient.post<SessionMutationResponse>(
      `/patients/${patientId}/sessions/${sessionId}/reschedule`,
      data
    );
    return {
      session: response.session,
      updated_sessions_count: response.updated_sessions_count ?? 1,
    };
  }

  /**
   * Delete a session
   */
  async deleteSession(
    patientId: number,
    sessionId: number,
    options?: { apply_to?: SessionApplyTo }
  ): Promise<{ deleted_sessions_count: number }> {
    const response = await apiClient.delete<{
      success: boolean;
      message?: string;
      deleted_sessions_count?: number;
    }>(`/patients/${patientId}/sessions/${sessionId}`, {
      params: options?.apply_to ? { apply_to: options.apply_to } : undefined,
    });
    return {
      deleted_sessions_count: response.deleted_sessions_count ?? 1,
    };
  }

  /**
   * Get patient's own sessions (for patient portal)
   */
  async getMySessions(params?: {
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Session[]> {
    const response = await apiClient.get<SessionsResponse>(
      '/patient/sessions',
      { params }
    );
    return response.sessions;
  }
}

export const sessionService = new SessionService();
export default sessionService;

