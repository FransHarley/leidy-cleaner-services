# PRD — Melhorias Solicitadas pela Cliente

Projeto: **Leidy Cleaner Services**
Documento: **PRD complementar de mudanças e milestones**
Versão: `0.2`
Status: **sincronizado com o fluxo pré-pago implementado**

---

## 1. Objetivo

Este documento consolida melhorias complementares pedidas pela cliente e registra que a mudança estrutural do fluxo financeiro já foi absorvida pela documentação oficial do projeto.

Ele existe para:
- agrupar melhorias de UX e operação
- registrar decisões complementares
- evitar que anotações antigas continuem descrevendo o fluxo errado

---

## 2. Situação atual

O fluxo oficial atual do MVP é:

```text
cliente cria solicitação
→ seleciona exatamente 1 profissional elegível
→ solicitação vai para AGUARDANDO_PAGAMENTO
→ cliente paga via Asaas ou usa CreditoSolicitacao
→ backend confirma pagamento
→ backend cria exatamente 1 convite
→ profissional aceita ou recusa
→ se aceitar: backend cria AtendimentoFaxina já CONFIRMADO
→ se recusar ou expirar: backend gera CreditoSolicitacao equivalente
→ profissional executa
→ cliente avalia
```

O fluxo antigo com seleção múltipla e pagamento depois do aceite não deve mais ser tratado como fluxo vigente.

---

## 3. Melhorias complementares ainda relevantes

### 3.1 Compatíveis com o fluxo atual
- exibição ordenada dos horários das profissionais
- exibição para a profissional apenas do valor que ela recebe
- simulação administrativa de valores para 4h, 6h e 8h
- ordenação das profissionais por avaliação
- exibição da média e total de avaliações
- leitura das avaliações da profissional
- análise controlada de imagens e selfie em base64, se mantida como decisão técnica válida

### 3.2 Mudança estrutural já absorvida
- pagamento antes do convite
- convite somente após pagamento confirmado
- crédito operacional de reposição para solicitação paga e não aceita

Essa mudança não é mais proposta futura neste documento. Ela já foi incorporada ao domínio oficial em `AGENTS.md`, `docs/spec.md`, `docs/02-prd.md`, `docs/03-architecture.md`, `docs/04-domain-model.md` e `docs/05-api-scope.md`.

---

## 4. Princípios obrigatórios

Estas melhorias não podem quebrar:
- pagamento confirmado apenas pelo backend via webhook ou reconciliação segura
- frontend nunca confirma pagamento por conta própria
- seleção de exatamente 1 profissional por solicitação
- aceite transacional no backend
- criação de atendimento apenas após aceite válido
- avaliação unilateral: apenas cliente avalia profissional
- sem split de pagamento
- sem repasse automático para profissional
- sem profissional avaliar cliente
- sem mover regra crítica para o frontend
- sem expor comissão, margem ou taxa da empresa para a profissional

---

## 5. Crédito de reposição

`CreditoSolicitacao`:
- não é carteira
- não é saldo monetário
- não é desconto
- não é abatimento
- não é banco de horas
- não é pagamento parcial

Ele representa apenas o direito de criar uma nova solicitação equivalente.

---

## 6. Itens fora deste documento

Este documento não substitui:
- o PRD principal
- a especificação técnica
- o modelo de domínio
- o escopo de API

Se houver nova mudança estrutural, ela deve ser atualizada primeiro nos documentos-base do produto.
