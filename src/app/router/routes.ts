import type { RouteRecordRaw } from 'vue-router'

const NotMigrated = () => import('@/app/views/NotMigrated.vue')

/** Atalho: rota ainda não portada aponta para o placeholder. Troque `view` ao migrar. */
const page = (path: string, title: string, view: RouteRecordRaw['component'] = NotMigrated, meta = {}): RouteRecordRaw => ({
  path,
  component: view!,
  meta: { title, ...meta },
})

// ── Psicóloga ────────────────────────────────────────────────────────────────
const psychologist: RouteRecordRaw[] = [
  page('/dashboard', 'Visão Geral', () => import('@/features/dashboard/views/DashboardView.vue')),
  page('/dashboard/profile', 'Meu perfil', () => import('@/features/profile/views/ProfileView.vue')),
  page('/dashboard/schedule', 'Agenda', () => import('@/features/schedule/views/ScheduleView.vue')),
  page('/dashboard/birthdays', 'Aniversariantes', () => import('@/features/birthdays/views/BirthdaysView.vue')),

  page('/dashboard/patients', 'Pacientes', () => import('@/features/patients/views/PatientsListView.vue')),
  page('/dashboard/patients/create', 'Novo paciente', () => import('@/features/patients/views/PatientCreateView.vue')),
  page('/dashboard/patients/:id', 'Paciente', () => import('@/features/patients/views/PatientDetailView.vue')),
  page('/dashboard/patients/:id/edit', 'Editar paciente', () => import('@/features/patients/views/PatientEditView.vue')),
  page('/dashboard/patients/:id/notes/new', 'Nova anotação', () => import('@/features/notes/views/PatientNoteFormView.vue')),
  page('/dashboard/patients/:id/notes/:noteId', 'Anotação', () => import('@/features/notes/views/PatientNoteView.vue')),
  page('/dashboard/patients/:id/notes/:noteId/edit', 'Editar anotação', () => import('@/features/notes/views/PatientNoteFormView.vue')),
  page('/dashboard/patients/:id/sessions/:sessionId/report', 'Relatório da sessão', () => import('@/features/sessions/views/SessionReportView.vue')),

  page('/dashboard/contracts', 'Contratos', () => import('@/features/contracts/views/ContractsListView.vue')),
  page('/dashboard/contracts/create', 'Novo contrato', () => import('@/features/contracts/views/ContractCreateView.vue')),
  page('/dashboard/contracts/:id', 'Contrato', () => import('@/features/contracts/views/ContractDetailView.vue')),

  page('/dashboard/diary', 'Diários', () => import('@/features/diary/views/DiaryListView.vue')),
  page('/dashboard/diary/:id', 'Diário', () => import('@/features/diary/views/DiaryDetailView.vue')),

  page('/dashboard/quizzes', 'Quizzes', () => import('@/features/quizzes/views/QuizzesListView.vue')),
  page('/dashboard/quizzes/create', 'Novo quiz', () => import('@/features/quizzes/views/QuizFormView.vue')),
  page('/dashboard/quizzes/:id', 'Quiz', () => import('@/features/quizzes/views/QuizDetailView.vue')),
  page('/dashboard/quizzes/:id/edit', 'Editar quiz', () => import('@/features/quizzes/views/QuizFormView.vue')),
  page('/dashboard/quizzes/:id/responses/:patientId', 'Respostas', () => import('@/features/quizzes/views/QuizResponsesView.vue')),

  page('/dashboard/exercises', 'Exercícios', () => import('@/features/exercises/views/ExercisesListView.vue')),
  page('/dashboard/exercises/create', 'Novo exercício', () => import('@/features/exercises/views/ExerciseFormView.vue')),
  page('/dashboard/exercises/:id/edit', 'Editar exercício', () => import('@/features/exercises/views/ExerciseFormView.vue')),

  page('/dashboard/resources', 'Recursos', () => import('@/features/resources/views/ResourcesListView.vue')),
  page('/dashboard/resources/create', 'Novo recurso', () => import('@/features/resources/views/ResourceFormView.vue')),
  page('/dashboard/resources/:id', 'Recurso', () => import('@/features/resources/views/ResourceDetailView.vue')),
  page('/dashboard/resources/:id/edit', 'Editar recurso', () => import('@/features/resources/views/ResourceFormView.vue')),

  page('/dashboard/payments', 'Pagamentos', () => import('@/features/payments/views/PaymentsListView.vue')),
  page('/dashboard/payments/create', 'Novo pagamento', () => import('@/features/payments/views/PaymentCreateView.vue')),
  page('/dashboard/payments/:id', 'Pagamento', () => import('@/features/payments/views/PaymentDetailView.vue')),
  page('/dashboard/payments/:id/edit', 'Editar pagamento', () => import('@/features/payments/views/PaymentEditView.vue')),

  page('/dashboard/receipts', 'Recibos saúde', () => import('@/features/receipts/views/ReceiptsListView.vue')),
  page('/dashboard/receipts/:id', 'Recibo', () => import('@/features/receipts/views/ReceiptDetailView.vue')),

  page('/dashboard/costs', 'Custos', () => import('@/features/costs/views/ExpensesListView.vue')),
  page('/dashboard/costs/create', 'Novo custo', () => import('@/features/costs/views/ExpenseCreateView.vue')),
  page('/dashboard/costs/:id/edit', 'Editar custo', () => import('@/features/costs/views/ExpenseEditView.vue')),

  page('/dashboard/financial', 'Financeiro', () => import('@/features/financial/views/FinancialReportView.vue')),

  page('/medical-records', 'Prontuários', () => import('@/features/records/views/RecordsListView.vue')),
  page('/medical-records/new', 'Novo prontuário', () => import('@/features/records/views/RecordFormView.vue')),
  page('/medical-records/:id/edit', 'Editar prontuário', () => import('@/features/records/views/RecordFormView.vue')),

  page('/communications', 'Comunicações', () => import('@/features/communications/views/CommunicationsView.vue')),

  page('/settings', 'Configurações', () => import('@/features/settings/views/SettingsHomeView.vue')),
  page('/settings/colors', 'Cores', () => import('@/features/settings/views/ColorsView.vue')),
  page('/settings/integrations', 'Integrações', () => import('@/features/settings/views/IntegrationsView.vue')),
  { path: '/settings/notifications', redirect: '/communications?tab=settings' },
  page('/settings/signature', 'Assinatura', () => import('@/features/settings/views/SignatureView.vue')),
]

// ── Paciente (portal) ───────────────────────────────────────────────────────
const patient: RouteRecordRaw[] = [
  page('/portal', 'Início', () => import('@/features/portal/views/PortalHomeView.vue')),
  page('/portal/sessions', 'Minhas sessões', () => import('@/features/portal/views/PortalSessionsView.vue')),
  page('/portal/diary', 'Diário', () => import('@/features/portal/views/PortalDiaryView.vue')),
  page('/portal/quiz', 'Quiz', () => import('@/features/portal/views/PortalQuizView.vue')),
  page('/portal/quiz/:id', 'Quiz', () => import('@/features/portal/views/PortalQuizTakeView.vue')),
  page('/portal/post-therapy', 'Pós-terapia', () => import('@/features/portal/views/PortalPostTherapyView.vue')),
  page('/portal/post-therapy/:id', 'Pós-terapia', () => import('@/features/portal/views/PortalPostTherapyDetailView.vue')),
  page('/portal/exercises', 'Exercícios', () => import('@/features/portal/views/PortalExercisesView.vue')),
  page('/portal/exercises/:id', 'Exercício', () => import('@/features/portal/views/PortalExerciseRunView.vue')),
  page('/portal/resources', 'Recursos', () => import('@/features/portal/views/PortalResourcesView.vue')),
  page('/portal/resources/:id', 'Recurso', () => import('@/features/portal/views/PortalResourceView.vue')),
  page('/portal/contracts', 'Meus contratos', () => import('@/features/portal/views/PortalContractsView.vue')),
  page('/portal/contracts/:id', 'Contrato', () => import('@/features/portal/views/PortalContractDetailView.vue')),
  page('/portal/financial', 'Financeiro', () => import('@/features/portal/views/PortalFinancialView.vue')),
  page('/portal/chat', 'Mensagens', () => import('@/features/portal/views/PortalMessagesView.vue')),
  page('/portal/profile', 'Meu perfil', () => import('@/features/portal/views/PortalProfileView.vue')),
  page('/portal/settings', 'Configurações', () => import('@/features/portal/views/PortalSettingsView.vue')),
]

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      { path: '', component: () => import('@/features/auth/views/LoginView.vue'), meta: { guestOnly: true, title: 'Entrar' } },
      page('/contract/success', 'Contrato assinado', () => import('@/features/contracts/views/ContractSuccessView.vue')),
      page('/contract/:token', 'Assinatura de contrato', () => import('@/features/contracts/views/ContractSignView.vue')),
      page('/pagamento/:token', 'Pagamento Pix', () => import('@/features/pix/views/PixPayView.vue')),
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/PsychologistLayout.vue'),
    meta: { requiresAuth: true, role: 'psychologist' },
    children: psychologist,
  },
  {
    path: '/',
    component: () => import('@/layouts/PatientLayout.vue'),
    meta: { requiresAuth: true, role: 'patient' },
    children: patient,
  },

  // Vitrine do design system (só em dev)
  ...(import.meta.env.DEV ? [{ path: '/_ui', component: () => import('@/app/views/UiKitView.vue'), meta: { title: 'Design system' } }] : []),

  // Rotas antigas (mock do v0) → equivalentes atuais
  { path: '/schedule', redirect: '/dashboard/schedule' },
  { path: '/financial', redirect: '/dashboard/financial' },
  { path: '/reports', redirect: '/dashboard/financial' },
  { path: '/quizzes', redirect: '/dashboard/quizzes' },
  { path: '/settings/colors-simple', redirect: '/settings/colors' },

  { path: '/:pathMatch(.*)*', component: () => import('@/app/views/NotFound.vue') },
]
