import type { Component } from 'vue'
import {
  BarChart3, BookOpen, Brain, Cake, Calendar, ClipboardList, DollarSign, FileCheck, FileText, Heart, Home,
  Library, LayoutDashboard, MessageSquare, NotebookPen, Receipt, Settings, User, Users, ListChecks, MessageCircle,
} from '@lucide/vue'

export interface NavItem {
  name: string
  to: string
  icon: Component
  /** Ativo só no match exato (ex.: /dashboard, /portal) */
  exact?: boolean
  hidden?: boolean
}

export interface NavGroup {
  /** Sem título = bloco de abertura, sem cabeçalho. */
  title?: string
  items: NavItem[]
}

/** Sidebar da psicóloga, separada por módulo. Itens com `hidden` ficam fora do menu (ocultos no app atual). */
export const psychologistNavGroups: NavGroup[] = [
  {
    items: [
      { name: 'Visão Geral', to: '/dashboard', icon: LayoutDashboard, exact: true },
      { name: 'Agenda', to: '/dashboard/schedule', icon: Calendar },
    ],
  },
  {
    title: 'Pacientes',
    items: [
      { name: 'Pacientes', to: '/dashboard/patients', icon: Users },
      { name: 'Aniversariantes', to: '/dashboard/birthdays', icon: Cake },
      { name: 'Contratos', to: '/dashboard/contracts', icon: FileText },
      { name: 'Prontuários', to: '/medical-records', icon: ClipboardList, hidden: true },
    ],
  },
  {
    title: 'Clínico',
    items: [
      { name: 'Diários', to: '/dashboard/diary', icon: BookOpen },
      { name: 'Quizzes', to: '/dashboard/quizzes', icon: Brain },
      { name: 'Exercícios', to: '/dashboard/exercises', icon: ListChecks },
      { name: 'Recursos', to: '/dashboard/resources', icon: Library, hidden: true },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { name: 'Pagamentos', to: '/dashboard/payments', icon: DollarSign },
      { name: 'Recibo Saúde', to: '/dashboard/receipts', icon: FileCheck },
      { name: 'Custos', to: '/dashboard/costs', icon: Receipt },
      { name: 'Financeiro', to: '/dashboard/financial', icon: BarChart3 },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { name: 'Comunicações', to: '/communications', icon: MessageSquare },
      { name: 'Configurações', to: '/settings', icon: Settings },
    ],
  },
]

/** Barra inferior do portal (mobile-first): 4 atalhos + "Mais". */
export const patientTabs: NavItem[] = [
  { name: 'Início', to: '/portal', icon: Home, exact: true },
  { name: 'Sessões', to: '/portal/sessions', icon: Calendar },
  { name: 'Diário', to: '/portal/diary', icon: Heart },
  { name: 'Quiz', to: '/portal/quiz', icon: Brain },
]

/** Itens do menu "Mais" do portal. */
export const patientMore: NavItem[] = [
  { name: 'Pós-terapia', to: '/portal/post-therapy', icon: NotebookPen },
  { name: 'Exercícios', to: '/portal/exercises', icon: ListChecks },
  { name: 'Recursos', to: '/portal/resources', icon: BookOpen, hidden: true },
  { name: 'Mensagens', to: '/portal/chat', icon: MessageCircle },
  { name: 'Meus Contratos', to: '/portal/contracts', icon: FileText },
  { name: 'Financeiro', to: '/portal/financial', icon: DollarSign },
  { name: 'Meu Perfil', to: '/portal/profile', icon: User },
  { name: 'Configurações', to: '/portal/settings', icon: Settings },
]

export function isNavActive(item: NavItem, path: string) {
  return item.exact ? path === item.to : path === item.to || path.startsWith(item.to + '/')
}
