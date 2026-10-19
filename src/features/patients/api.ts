import apiClient from '@/shared/lib/api-client';
import type {
  Patient,
  CreatePatientData,
  UpdatePatientData,
  PatientsResponse,
  PatientResponse,
  GrantAccessResponse,
  UpcomingBirthdaysResponse,
  UpdatePortalPasswordPayload,
} from '@/features/patients/types';

/** Laravel serializa colunas decimal como string ("180.00"); o app trabalha com number. */
function normalizePatient(p: Patient): Patient {
  return { ...p, price_session: p.price_session == null ? null : Number(p.price_session) };
}

class PatientService {
  async getAll(params?: {
    search?: string;
    status?: "active" | "inactive" | "all";
    page?: number;
    per_page?: number;
  }): Promise<PatientsResponse> {
    const response = await apiClient.get<PatientsResponse>("/patients", {
      params,
    });
    response.patients.data = response.patients.data.map(normalizePatient);
    return response;
  }

  async getById(id: number): Promise<Patient> {
    const response = await apiClient.get<PatientResponse>(`/patients/${id}`);
    return normalizePatient(response.patient);
  }

  /** Aniversários dos pacientes nos próximos N dias (pacientes ativos com data de nascimento) */
  async getUpcomingBirthdays(days: number = 60): Promise<UpcomingBirthdaysResponse> {
    const response = await apiClient.get<UpcomingBirthdaysResponse>(
      "/patients/birthdays/upcoming",
      { params: { days } }
    );
    return response;
  }

  async create(data: CreatePatientData): Promise<Patient> {
    const response = await apiClient.post<PatientResponse>("/patients", data);
    return normalizePatient(response.patient);
  }

  async update(id: number, data: UpdatePatientData): Promise<PatientResponse> {
    const response = await apiClient.put<PatientResponse>(
      `/patients/${id}`,
      data
    );
    return response;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/patients/${id}`);
  }

  async grantPortalAccess(id: number): Promise<GrantAccessResponse> {
    const response = await apiClient.post<GrantAccessResponse>(
      `/patients/${id}/grant-access`
    );
    return response;
  }

  /** Psicólogo define nova senha do portal do paciente (sem senha atual do paciente) */
  async updatePortalPassword(
    id: number,
    data: UpdatePortalPasswordPayload
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.patch<{ success: boolean; message: string }>(
      `/patients/${id}/portal-password`,
      data
    );
  }

  // Portal do paciente (o próprio paciente acessa seus dados)
  async getMyProfile(): Promise<Patient> {
    const response = await apiClient.get<PatientResponse>("/patient/profile");
    return normalizePatient(response.patient);
  }

  async updateMyProfile(data: UpdatePatientData): Promise<Patient> {
    const response = await apiClient.put<PatientResponse>("/patient/profile", data);
    return normalizePatient(response.patient);
  }
}

export const patientService = new PatientService();
export default patientService;
