export const PAYMENT_TYPES = [
  { value: "por_sessao", label: "Por Sessão" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
] as const;

export type PaymentType = (typeof PAYMENT_TYPES)[number]["value"];

export interface Patient {
  id: number;
  psychologist_id: number;
  user_id: number | null;
  name: string;
  birthdate: string | null;
  /** Data e hora da primeira sessão (ISO UTC); só editável pela edição do paciente depois de preenchida */
  first_session_at?: string | null;
  age: number | null;
  phone: string;
  cpf: string | null;
  email: string;
  emergency_contact: string | null;
  address: string | null;
  insurance: string | null;
  price_session: number | null;
  payment_type: PaymentType;
  /** dia do mês escolhido para pagar (mensal/quinzenal) */
  payment_day?: number | null;
  initial_notes: string | null;
  status: "active" | "inactive";
  last_session_date: string | null;
  next_session_date: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  /** Presente no perfil do próprio paciente (portal). */
  psychologist?: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    crp?: string | null;
  };
}

export interface CreatePatientData {
  first_session_at?: string | null;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  birthdate?: string;
  emergency_contact?: string;
  address?: string;
  insurance?: string;
  price_session?: number;
  payment_type?: PaymentType;
  payment_day?: number | null;
  initial_notes?: string;
  status?: "active" | "inactive";
}

export interface UpdatePatientData {
  first_session_at?: string | null;
  name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  birthdate?: string;
  emergency_contact?: string;
  address?: string;
  insurance?: string;
  price_session?: number;
  payment_type?: PaymentType;
  payment_day?: number | null;
  initial_notes?: string;
  status?: "active" | "inactive";
  last_session_date?: string;
  next_session_date?: string;
}

export interface PortalAccessCredentials {
  email: string;
  temporary_password: string;
  portal_url: string;
  message: string;
}

export interface UpcomingBirthday {
  patient_id: number;
  name: string;
  email: string;
  phone: string;
  birthdate: string;
  next_birthday: string;
  days_until: number;
  age_turning: number;
}

export interface UpcomingBirthdaysResponse {
  success: boolean;
  birthdays: UpcomingBirthday[];
}

export interface PatientsResponse {
  success: boolean;
  patients: {
    data: Patient[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface PatientResponse {
  success: boolean;
  patient: Patient;
  message?: string;
  removed_sessions_count?: number;
}

export interface GrantAccessResponse {
  success: boolean;
  message: string;
  patient: Patient;
  credentials: PortalAccessCredentials;
}

export interface UpdatePortalPasswordPayload {
  password: string;
  password_confirmation: string;
}
