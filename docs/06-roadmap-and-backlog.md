# Roadmap e Backlog

## Convenções
- P0 = crítico
- P1 = importante
- P2 = melhoria ou polimento

---

## Fase 0 — Fundação do monorepo

### P0
- criar monorepo
- estruturar `apps/frontend`, `apps/backend`, `docs`, `infra`
- configurar README raiz
- configurar `.gitignore`
- configurar `docker-compose.yml` com PostgreSQL
- criar `.env.example`

---

## Fase 1 — Backend e frontend base

### P0
- criar projeto Spring Boot
- configurar segurança base
- configurar Flyway
- configurar conexão PostgreSQL
- criar projeto React + TS + Vite
- configurar Tailwind
- configurar rotas base
- criar layouts iniciais

---

## Fase 2 — Usuários e autenticação

### P0
- modelar `usuarios`
- modelar `perfis_cliente`
- modelar `perfis_profissional`
- criar endpoint de cadastro de cliente
- criar endpoint de cadastro de profissional
- criar endpoint de login
- criar endpoint `auth/me`
- aplicar JWT básico
- criar middleware de autorização

---

## Fase 3 — Onboarding profissional

### P0
- modelar `documentos_verificacao`
- criar upload ou registro de documentos
- criar consulta do status de verificação
- criar análise de verificação pelo admin

### P1
- modelar `regioes_atendimento`
- criar seed de bairros ou regiões iniciais
- modelar `profissional_regioes`
- modelar `disponibilidades_profissional`
- criar endpoints de regiões da profissional
- criar endpoints de disponibilidade

---

## Fase 4 — Solicitação e seleção única

### P0
- modelar `enderecos`
- criar CRUD de endereços
- modelar `solicitacoes_faxina`
- suportar tipos de serviço do MVP
- criar endpoint de criação de solicitação
- criar listagem de solicitações do cliente
- criar listagem de profissionais elegíveis
- criar endpoint para seleção de exatamente 1 profissional
- mover solicitação para `AGUARDANDO_PAGAMENTO` após seleção válida

---

## Fase 5 — Pagamento antes do convite

### P0
- modelar `pagamentos` com vínculo inicial à solicitação
- integrar Asaas por API
- criar endpoint de criação de pagamento
- salvar `gatewayPaymentId`
- persistir `externalReference` como `solicitacao-{id}` quando aplicável
- criar endpoint de consulta de pagamento por solicitação
- criar endpoint `POST /api/v1/pagamentos/{id}/consultar-status`
- criar webhook do Asaas em `POST /api/v1/webhooks/asaas`
- confirmar pagamento com idempotência
- mover solicitação para `PAGA_AGUARDANDO_ACEITE`
- criar exatamente 1 convite após confirmação

### Observação crítica
Pagamento confirmado nesse fluxo cria convite, não cria atendimento nem atualiza atendimento para `CONFIRMADO`.

---

## Fase 6 — Convite, aceite e atendimento

### P0
- modelar `convites_profissional`
- criar listagem de convites da profissional
- criar aceite transacional
- criar recusa de convite
- criar atendimento automaticamente após aceite válido
- vincular o pagamento pago ao atendimento criado
- listar atendimentos do usuário autenticado
- detalhar atendimento

### P1
- criar job ou scheduler para expiração de convite quando aplicável

### Observação crítica
Essa continua sendo uma das partes mais sensíveis do sistema.

---

## Fase 7 — Crédito de reposição

### P0
- modelar `creditos_solicitacao`
- gerar `CreditoSolicitacao` em recusa ou expiração de solicitação paga
- garantir idempotência da geração do crédito
- criar listagem de créditos do cliente
- validar equivalência de uso do crédito
- consumir crédito em nova solicitação equivalente
- criar `Pagamento` interno com `gateway = INTERNO`
- criar convite sem chamar Asaas quando o crédito for usado

### P1
- trilha de auditoria mais detalhada do uso do crédito

### Observação crítica
Não modelar esse crédito como carteira, saldo monetário ou desconto.

---

## Fase 8 — Execução do serviço

### P0
- criar checkpoint de início
- criar checkpoint de fim
- atualizar status do atendimento conforme execução
- impedir início ou fim duplicados

---

## Fase 9 — Avaliação

### P1
- modelar `avaliacoes_profissional`
- criar endpoint de avaliação
- restringir para cliente do atendimento
- restringir para atendimento finalizado
- impedir avaliação duplicada
- atualizar `notaMedia` e `totalAvaliacoes`

---

## Fase 10 — Ocorrências e admin

### P1
- modelar `ocorrencias_atendimento`
- criar abertura de ocorrência
- criar listagem do usuário
- criar listagem admin
- alterar status de ocorrência
- dashboard admin inicial
- listagens de profissionais, solicitações, créditos, atendimentos e pagamentos

---

## Fase 11 — Frontend operacional

### P1
- home pública
- login
- cadastro de cliente
- cadastro de profissional
- dashboard cliente
- dashboard profissional
- dashboard admin
- telas de solicitação
- telas de pagamento por solicitação
- telas de convites
- tela de atendimento ativo
- tela de créditos de reposição
- tela de histórico
- tela de avaliação

---

## Fase 12 — Polimento

### P2
- loading states
- empty states
- toasts
- confirmação visual de ações críticas
- responsividade melhorada
- refinamento visual da dashboard

---

## Ordem real de execução sugerida

1. Fundação do monorepo
2. Backend e frontend base
3. Auth e usuários
4. Onboarding profissional
5. Solicitação
6. Seleção única
7. Pagamento
8. Webhook e reconciliação
9. Convite
10. Aceite
11. Atendimento
12. Crédito de reposição
13. Execução
14. Avaliação
15. Admin e ocorrências
16. Polimento

---

## Pontos de maior risco técnico

### 1. Webhook do gateway
Precisa ser idempotente e manter o estado da solicitação consistente.

### 2. Aceite concorrente
Precisa ser transacional.

### 3. Equivalência de crédito
Não pode virar um pseudo-saldo flexível.

### 4. Estados
Não pode haver transições arbitrárias entre solicitação, pagamento, convite e atendimento.
