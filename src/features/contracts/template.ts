import type { Contract, ContractPaymentType } from './types'

/**
 * Pré-visualização do texto que o backend gera (ContractController::generateContractText).
 * Só para a tela de criação — o texto oficial salvo no contrato vem sempre do servidor.
 */
export function buildContractPreview(paymentType: ContractPaymentType, price: number, forExistingPatient: boolean): string {
  const brl = price.toFixed(2).replace('.', ',')
  const payment =
    paymentType === 'por_sessao'
      ? 'deve ser realizado até 30 minutos antes do horário de cada sessão'
      : paymentType === 'quinzenal'
        ? 'deve ser realizado quinzenalmente nos dias 15 e 30 de cada mês'
        : 'deve ser feito mensalmente até o dia de cada mês que selecionar no formulário abaixo'
  const closing = forExistingPatient
    ? 'Confira seus dados abaixo e assine para formalizar a renovação/revisão deste contrato.'
    : 'Peço que preencha o formulário abaixo para o cadastro completo.'

  return `Contrato Terapêutico – Psicóloga Fernanda Costa (CRP-08/43119)

Bem-vinda(o) ao processo terapêutico!

Sou Fernanda Gabriela Bezerra da Costa, psicóloga, CRP-08/43119, e este documento tem o objetivo de garantir clareza, transparência e segurança no nosso trabalho conjunto. Abaixo os principais pontos sobre o funcionamento das sessões, pagamentos e aspectos éticos da terapia.

1. Pagamento
- O valor acordado para as sessões é de R$ ${brl}.
- O pagamento ${payment}.
- O pagamento é feito via Pix.
- O não pagamento até a data combinada poderá implicar na suspensão temporária dos atendimentos até a regularização.

2. Faltas e Cancelamentos
- O cancelamento ou reagendamento de sessão deverá ser informado com pelo menos 12 horas de antecedência.
- Caso o aviso não seja feito dentro desse prazo, será cobrado 50% do valor da sessão.
- Em casos de emergência, problemas de saúde ou imprevistos graves, a cobrança poderá ser isentada, mediante comunicação.
- Em caso de atraso, o tempo de sessão será reduzido proporcionalmente, sem extensão do horário.

3. Confidencialidade
- Todo o conteúdo abordado nas sessões é confidencial e protegido pelo Código de Ética Profissional do Psicólogo.
- A quebra de sigilo só poderá ocorrer em situações previstas na lei, como risco iminente à vida do(a) paciente ou de terceiros, ou mediante ordem judicial.

4. Compromisso Terapêutico
A terapia é um espaço de autoconhecimento, responsabilidade e crescimento emocional.
O comprometimento com presença, pontualidade e continuidade do processo é essencial para os resultados.

5. Reajuste de Valor
O valor das sessões poderá ser reajustado semestralmente, mediante aviso prévio e acordo entre ambas as partes.

6. Proteção de Dados – LGPD
Em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados), todos os dados pessoais e clínicos fornecidos pelo(a) paciente serão usados exclusivamente para fins relacionados à prática psicológica, respeitando os princípios de confidencialidade, sigilo e segurança da informação.
Todos os dados armazenados na plataforma são altamente criptografados e seguem rigorosamente as normas da LGPD e o Código de Ética Profissional da Psicologia. O acesso aos seus dados será mantido somente durante o período em que houver atendimento terapêutico ativo.

Estou à disposição para esclarecer qualquer dúvida que possa surgir.
${closing}`
}

/** Link público de assinatura. */
export const contractLink = (token: string) => `${window.location.origin}/contract/${token}`

/** Pendente com prazo vencido é tratado como expirado na interface. */
export const isPendingExpired = (c: { status: string; expires_at: string }) => c.status === 'pending' && new Date(c.expires_at).getTime() < Date.now()

/** O que cada contrato permite (mesmas regras no cartão e na lista). */
export function contractActions(c: Contract) {
  const expired = isPendingExpired(c)
  return {
    status: expired ? 'expired' : c.status,
    canShare: c.status === 'pending' && !expired,
    canDelete: c.status === 'expired' || c.status === 'pending',
    canInactivate: c.status === 'signed',
  }
}
