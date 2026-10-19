# Psi Fernanda Costa — frontend (Vue 3 + Vite)

SPA que substitui o frontend Next.js (`../frontend`). Mesmas URLs, mesma API Laravel, mesma paleta
(`#E8B8D9` rosa claro / `#543949` rosa escuro). Ambiente da psicóloga **desktop-first**, portal do paciente **mobile-first**.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3006
npm run typecheck  # vue-tsc
npm run build      # typecheck + vite build → dist/
```

`.env.local`: `VITE_API_URL` (ex.: `http://localhost:8010/api`) e `VITE_VAPID_PUBLIC_KEY` (push).
Deploy: Vercel com `vercel.json` (rewrite SPA para `/index.html`).

## Estrutura

```
src/
  app/            main.ts, App.vue, router (routes.ts + guards por role)
  assets/styles/  tokens.css (ÚNICA fonte da paleta), main.css, toast.css, rich-content.css
  layouts/        PsychologistLayout (sidebar), PatientLayout (AppBar + BottomNav), PublicLayout
  shared/
    ui/           shadcn-vue (gerado)
    components/   PageHeader, QueryState, DataView/DataTable/CardGrid/FilterBar, ResponsiveDialog, ConfirmDialog...
    composables/  useApiMutation, usePrivacyMode, useConfirm, useBreakpoint...
    lib/          api-client, format, datetime-br, toast, privacy-mask
  features/<x>/   api.ts · queries.ts (vue-query) · types.ts · components/ · views/
```

Convenções: cada bloco de dados tem sua própria query (`useXxx` em `queries.ts`); mutações usam `useApiMutation`
(toast + invalidação); toasts só em vermelho para erro; confirmações via `useConfirm()`; modo privacidade via `usePrivacyMode()`.

## Paridade com o app Next

Todas as 70 rotas de `../frontend/app` existem aqui (mesmos caminhos), mais `/portal/*` e `/contract/*` públicos.
Bugs do app antigo corrigidos na migração: ver "Correções" abaixo.

### Correções em relação ao app antigo
- Relatório de sessão: dupla desestruturação `.data` (sempre caía em "Relatório+").
- Diário: filtro de datas usava `start_date/end_date` (o backend espera `date_from/date_to`).
- Sessões de 50 min não salvavam (`step=15` na duração).
- Contrato do portal: detalhe dava 404 (não há endpoint; usa a lista `/patient/contracts/my`).
- Taxa de comparecimento diluída por sessões futuras.
- Quizzes: lista de pacientes atribuídos nunca carregava (bug no backend `getAssignments`, corrigido) e respostas de múltipla escolha mostravam só o valor.
- Assinatura da psicóloga: página não mostrava a assinatura já enviada (usava `response.url` em vez de `signature_url`).
- Configurações: removidos links mortos (perfil/segurança/backup) e "ações rápidas" sem função.

## Checklist de corte (fase 9)
- [ ] Rodar `npm run build` e testar `dist/` com `npm run preview` contra a API de produção.
- [ ] Criar projeto Vercel para `frontend-vue` (framework Vite, `VITE_API_URL` e `VITE_VAPID_PUBLIC_KEY` de produção).
- [ ] Conferir CORS/`FRONTEND_URL` no backend para o novo domínio (links de e-mail, OAuth do Google e push).
- [ ] Testar em celular real como PWA: login paciente, bottom nav, push, iOS safe-area.
- [ ] Trocar o domínio `app.psifernandacosta.com` para o novo projeto.
- [ ] Aposentar `../frontend` depois de alguns dias estável.
