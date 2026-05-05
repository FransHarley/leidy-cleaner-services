# SPEC — Leidy Cleaner Services

## 1. Objetivo deste documento

Este documento transforma o PRD em uma especificação prática de execução do MVP da **Leidy Cleaner Services**.

Ele serve para:
- orientar desenvolvimento
- alinhar arquitetura e escopo
- definir critérios de pronto
- acompanhar progresso por **milestones**

---

## 2. Resumo do produto

Leidy Cleaner Services é uma plataforma web para intermediação de serviços de limpeza.

As categorias de serviço suportadas são:
- `FAXINA_RESIDENCIAL`
- `FAXINA_COMERCIAL`
- `FAXINA_CONDOMINIO`
- `FAXINA_EVENTO`

Fluxo central:
1. cliente cria conta
2. profissional cria conta
3. profissional envia documentação e define regiões/disponibilidade
4. cliente cria solicitação
5. cliente seleciona até 3 profissionais
6. sistema envia convites
7. o primeiro aceite válido gera o atendimento
8. cliente paga pela plataforma
9. backend confirma pagamento via webhook do Asaas
10. profissional executa o serviço
11. cliente avalia a profissional

---

## 3. Decisões técnicas fechadas

### Arquitetura
- **Monorepo**
- Estrutura principal:
  - `apps/frontend`
  - `apps/backend`
  - `docs`
  - `infra`

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod

### Backend
- Java 21
- Spring Boot 3
- Spring Security
- Spring Data JPA
- Bean Validation
- Flyway

### Banco de dados
- PostgreSQL

### Pagamento
- Asaas
- cobrança vinculada ao `AtendimentoFaxina`
- webhook como **fonte de verdade** para confirmação de pagamento

### Fora do escopo do MVP
- repasse dentro da plataforma
- split de pagamento
- avaliação bilateral
- chat
- app mobile
- múltiplos profissionais por atendimento

---

## 4. Escopo funcional do MVP

### Incluído
- autenticação
- cadastro de cliente
- cadastro de profissional
- verificação documental
- regiões atendidas
- disponibilidade do profissional
- criação de solicitação
- seleção de até 3 profissionais
- convites e aceite
- criação de atendimento
- pagamento via Asaas
- webhook de pagamento
- checkpoints de início e fim
- avaliação do cliente para a profissional
- ocorrências operacionais
- dashboard/admin básico

### Excluído
- pagamento para profissional
- carteira/saldo
- notificações complexas por WhatsApp
- ranking avançado
- recorrência
- assinatura

---

## 5. Domínio principal

### Entidades centrais
- `Usuario`
- `PerfilCliente`
- `PerfilProfissional`
- `Endereco`
- `RegiaoAtendimento`
- `ProfissionalRegiao`
- `DisponibilidadeProfissional`
- `DocumentoVerificacao`
- `SolicitacaoFaxina`
- `SolicitacaoProfissionalSelecionado`
- `ConviteProfissional`
- `AtendimentoFaxina`
- `Pagamento`
- `CheckpointServico`
- `AvaliacaoProfissional`
- `OcorrenciaAtendimento`

---

## 6. Regras de negócio críticas

### 6.1 Seleção de profissionais
- cliente pode selecionar **no máximo 3 profissionais**
- validação obrigatória no backend

### 6.2 Elegibilidade de profissional
Um profissional só pode aparecer como elegível se:
- conta ativa
- perfil aprovado
- documentos aprovados
- região compatível
- disponibilidade compatível
- sem conflito com atendimento ativo

### 6.3 Aceite do convite
- o primeiro aceite válido ganha o serviço
- essa operação deve ser **transacional**
- ao aceitar:
  - cria atendimento
  - marca convite como aceito
  - cancela os demais

### 6.4 Pagamento
- pagamento sempre vinculado ao atendimento
- caminho principal: `POST /api/v1/pagamentos/checkout`
- `POST /api/v1/pagamentos` fica como legado/deprecado para cobranca direta
- frontend nunca confirma pagamento por conta própria
- webhook do Asaas atualiza `Pagamento`
- o endpoint de webhook continua publico no JWT
- o webhook usa `payment.id`, `payment.checkoutSession` e, no checkout, `checkout.id` para localizar o `Pagamento`
- no caminho principal de Checkout, `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED` podem reconciliar pelo campo `payment.checkoutSession`; `CHECKOUT_PAID` continua suportado se o Asaas o emitir
- eventos suportados de sucesso: `CHECKOUT_PAID`, `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED_IN_CASH` quando o pagamento for localizado por `payment.id`, `payment.checkoutSession`, `checkout.id` ou `externalReference`
- `PAYMENT_CREATED` nao confirma pagamento
- `PAYMENT_OVERDUE` representa falha e nao confirma o atendimento
- o webhook exige o header `asaas-access-token`, comparado com `ASAAS_WEBHOOK_TOKEN` antes de qualquer processamento do payload
- chamadas sem token ou com token invalido retornam erro JSON e nao processam pagamento
- o processamento e idempotente
- eventos nao suportados sao ignorados com resposta 200
- após webhook válido:
  - `Pagamento = PAGO`
  - `Atendimento = CONFIRMADO`

### 6.5 Execução do serviço
- apenas a profissional do atendimento pode marcar início/fim
- não pode finalizar sem iniciar
- não pode iniciar duas vezes
- não pode finalizar duas vezes
- inicio grava checkpoint `INICIO` e muda `Atendimento = EM_EXECUCAO`
- fim grava checkpoint `FIM` e muda `Atendimento = FINALIZADO`
- cliente ve os proprios atendimentos; profissional ve atendimentos atribuidos a ela
- usuarios nao relacionados nao acessam detalhe nem checkpoints
- evidencias de foto sao persistidas apenas como URL/path neste marco, sem upload real

### 6.6 Avaliação
- somente o cliente avalia
- somente a profissional é avaliada
- apenas após atendimento finalizado
- uma avaliação por atendimento
- nota de 1 a 5

---

## 7. Estrutura do monorepo

```text
leidy-cleaner-services/
├── AGENTS.md
├── README.md
├── apps/
│   ├── frontend/
│   └── backend/
├── docs/
│   ├── prd.md
│   ├── spec.md
│   ├── domain-model.md
│   └── api-scope.md
├── infra/
│   ├── docker-compose.yml
│   └── env/
└── packages/
    └── shared/ (opcional)
```

### Observação
`packages/shared` só deve existir se realmente houver valor para compartilhar contratos, schemas, OpenAPI ou assets. Não criar isso por moda.

---

## 8. Organização do backend

```text
apps/backend/src/main/java/.../
├── auth/
├── usuarios/
├── clientes/
├── profissionais/
├── enderecos/
├── regioes/
├── verificacao/
├── solicitacoes/
├── convites/
├── atendimentos/
├── pagamentos/
├── avaliacoes/
├── ocorrencias/
├── notificacoes/
├── auditoria/
├── config/
└── core/
```

### Padrões obrigatórios
- controllers finos
- regras em services
- DTOs para entrada/saída
- entities não expostas diretamente
- migrations com Flyway
- enums Java + `VARCHAR` no banco

---

## 9. Organização do frontend

```text
apps/frontend/src/
├── app/
├── components/
├── layouts/
├── pages/
├── features/
│   ├── auth/
│   ├── cliente/
│   ├── profissional/
│   ├── admin/
│   ├── solicitacoes/
│   ├── atendimentos/
│   └── pagamentos/
├── hooks/
├── lib/
├── routes/
├── services/
├── types/
└── data/
```

### Padrões obrigatórios
- UI em português (pt-BR)
- React Query para estado de servidor
- React Hook Form + Zod para formulários
- layout responsivo
- lógica crítica fora dos componentes

---

## 10. Estados do sistema

### Solicitação
- `CRIADA`
- `AGUARDANDO_SELECAO`
- `CONVITES_ENVIADOS`
- `AGUARDANDO_ACEITE`
- `ACEITA`
- `PAGA`
- `EM_EXECUCAO`
- `FINALIZADA`
- `CANCELADA`
- `EXPIRADA`

### Convite
- `ENVIADO`
- `VISUALIZADO`
- `ACEITO`
- `RECUSADO`
- `EXPIRADO`
- `CANCELADO`

### Atendimento
- `AGUARDANDO_PAGAMENTO`
- `CONFIRMADO`
- `EM_EXECUCAO`
- `FINALIZADO`
- `CANCELADO`
- `EM_ANALISE`

### Pagamento
- `PENDENTE`
- `AGUARDANDO_CONFIRMACAO`
- `PAGO`
- `FALHOU`
- `CANCELADO`
- `ESTORNADO`

### Verificação
- `PENDENTE`
- `EM_ANALISE`
- `APROVADO`
- `REJEITADO`

---

## 11. Endpoints mínimos previstos

### Auth
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Usuários
- `POST /api/v1/usuarios/clientes`
- `POST /api/v1/usuarios/profissionais`
- `PATCH /api/v1/usuarios/{id}/status`
- `GET /api/v1/usuarios`
- `GET /api/v1/usuarios/{id}`

### Regiões / disponibilidade
- `GET /api/v1/regioes`
- `GET /api/v1/profissionais/me`
- `PUT /api/v1/profissionais/me`
- `POST /api/v1/profissionais/me/regioes`
- `GET /api/v1/profissionais/me/regioes`
- `POST /api/v1/profissionais/me/disponibilidades`
- `GET /api/v1/profissionais/me/disponibilidades`
- `PUT /api/v1/profissionais/me/disponibilidades/{id}`
- `DELETE /api/v1/profissionais/me/disponibilidades/{id}`

### Verificação / aprovação profissional
- `POST /api/v1/verificacoes/documentos`
- `GET /api/v1/verificacoes/minha`
- `GET /api/v1/verificacoes`
- `GET /api/v1/verificacoes/{id}`
- `PATCH /api/v1/verificacoes/{id}/analisar`
- `GET /api/v1/profissionais`
- `PATCH /api/v1/profissionais/{id}/aprovacao`

### Solicitações
- `POST /api/v1/solicitacoes`
- `GET /api/v1/solicitacoes/minhas`
- `GET /api/v1/solicitacoes`
- `GET /api/v1/solicitacoes/{id}`
- `GET /api/v1/solicitacoes/{id}/profissionais-disponiveis`
- `POST /api/v1/solicitacoes/{id}/selecionados`
- `PATCH /api/v1/solicitacoes/{id}/cancelar`

### Convites
- `GET /api/v1/convites/meus`
- `GET /api/v1/convites/{id}`
- `POST /api/v1/convites/{id}/aceitar`
- `POST /api/v1/convites/{id}/recusar`

### Atendimentos
- `GET /api/v1/atendimentos/meus`
- `GET /api/v1/atendimentos`
- `GET /api/v1/atendimentos/{id}`
- `GET /api/v1/atendimentos/{id}/checkpoints`
- `POST /api/v1/atendimentos/{id}/iniciar`
- `POST /api/v1/atendimentos/{id}/finalizar`

### Pagamentos
- `POST /api/v1/pagamentos/checkout`
- `POST /api/v1/pagamentos` (legado/deprecado para cobranca direta)
- `GET /api/v1/pagamentos`
- `GET /api/v1/pagamentos/{id}`
- `GET /api/v1/pagamentos/atendimento/{atendimentoId}`
- `POST /api/v1/pagamentos/{id}/consultar-status`
- `POST /api/v1/webhooks/asaas`

### Avaliações
- `POST /api/v1/avaliacoes`
- `GET /api/v1/profissionais/{id}/avaliacoes`

### Ocorrências
- `POST /api/v1/ocorrencias`
- `GET /api/v1/ocorrencias/meus`
- `GET /api/v1/ocorrencias/{id}`
- `GET /api/v1/ocorrencias`
- `PATCH /api/v1/ocorrencias/{id}/status`

---

## 12. Critérios de pronto por área

### Fundação
- monorepo criado
- frontend sobe localmente
- backend sobe localmente
- PostgreSQL sobe via Docker Compose
- README com instruções

### Dados base
- migrations iniciais funcionando
- entidades principais cadastradas
- autenticação básica funcional

### Onboarding profissional
- cadastro funcional
- regiões salvas
- disponibilidade salva
- verificação com estrutura pronta

### Solicitações e convites
- cliente cria solicitação
- lista de elegíveis disponível
- seleção de até 3 implementada
- convites disparados
- aceite transacional implementado

### Pagamentos
- cobrança criada no Asaas
- `gateway_payment_id` persistido
- webhook processado com idempotência mínima
- atendimento confirmado só após webhook

### Atendimento
- início e fim funcionando
- checkpoints persistidos

### Avaliação
- cliente avalia profissional
- uma avaliação por atendimento
- média do profissional atualizada

---

## 13. Riscos principais

### Risco 1 — Aceite concorrente
Se o aceite não for transacional, duas profissionais podem ficar com o mesmo atendimento.

### Risco 2 — Webhook mal tratado
Se o webhook falhar ou for processado de forma errada, pagamento e atendimento ficam inconsistentes.

### Risco 3 — Escopo inchado
Se tentar adicionar chat, repasse, app ou automações cedo demais, o MVP atrasa sem necessidade.

### Risco 4 — Oferta e demanda
Mesmo com sistema funcionando, o modelo quebra se não houver profissionais e clientes suficientes.

---

## 14. Milestones do projeto

Use esta seção como checklist viva de execução.

## M0 — Fundação
- [x] Criar monorepo (`apps/frontend`, `apps/backend`, `docs`, `infra`)
- [x] Configurar backend Spring Boot base
- [x] Configurar frontend React + Vite base
- [x] Configurar PostgreSQL com Docker Compose
- [x] Criar README com instruções locais
- [x] Criar `.env.example`

## M1 — Dados base e autenticação
- [x] Criar migration inicial de `usuarios`
- [x] Criar migration de `perfis_cliente`
- [x] Criar migration de `perfis_profissional`
- [x] Criar estrutura de roles/perfis
- [x] Implementar registro de cliente
- [x] Implementar registro de profissional
- [x] Implementar login com JWT
- [x] Implementar endpoint `auth/me`

## M2 — Regiões, endereços e onboarding profissional
- [x] Criar migration de `enderecos`
- [x] Criar migration de `regioes_atendimento`
- [x] Criar migration de `profissional_regioes`
- [x] Criar migration de `disponibilidades_profissional`
- [x] Seed inicial de bairros/regiões
- [x] Implementar CRUD básico de endereços
- [x] Implementar seleção de regiões da profissional
- [x] Implementar disponibilidade semanal
- [x] Implementar estrutura de documentos/verificação

## M3 — Frontend base
- [x] Criar layout público
- [x] Criar layout autenticado
- [x] Criar páginas de login
- [x] Criar cadastro de cliente
- [x] Criar cadastro de profissional
- [x] Criar dashboard cliente placeholder
- [x] Criar dashboard profissional placeholder
- [x] Criar dashboard admin placeholder

## M4 — Solicitações
- [x] Criar migration de `solicitacoes_faxina`
- [x] Implementar criação de solicitação
- [x] Implementar listagem das minhas solicitações
- [x] Implementar listagem de profissionais elegíveis
- [x] Implementar seleção de até 3 profissionais
- [x] Validar limite máximo no backend

## M5 — Convites
- [x] Criar migration de `convites_profissional`
- [x] Implementar disparo de convites
- [x] Implementar listagem de convites da profissional
- [x] Implementar recusa de convite
- [x] Implementar aceite de convite com transação
- [x] Cancelar automaticamente convites concorrentes

## M6 — Atendimento
- [x] Criar migration de `atendimentos_faxina`
- [x] Criar atendimento ao aceitar convite
- [x] Implementar detalhes do atendimento
- [x] Implementar endpoint de início do serviço
- [x] Implementar endpoint de finalização do serviço
- [x] Criar migration de `checkpoints_servico`
- [x] Persistir checkpoints de início e fim

## M7 — Pagamentos
- [x] Criar migration de `pagamentos`
- [x] Implementar integracao Asaas Checkout para iniciar pagamento
- [x] Persistir identificador externo do checkout/pagamento
- [x] Criar tela frontend de pagamento e retorno
- [x] Implementar webhook do Asaas em `POST /api/v1/webhooks/asaas`
- [x] Garantir idempotencia basica do webhook
- [x] Atualizar pagamento para `PAGO` via webhook
- [x] Atualizar atendimento para `CONFIRMADO` apenas via webhook

## M8 — Avaliações
- [x] Criar migration de `avaliacoes_profissional`
- [x] Implementar criação de avaliação
- [x] Validar 1 avaliação por atendimento
- [x] Validar avaliação só após finalização
- [x] Atualizar `notaMedia` e `totalAvaliacoes`
- [x] Exibir avaliações da profissional

## M9 — Ocorrências e admin
- [x] Criar migration de `ocorrencias_atendimento`
- [x] Implementar abertura de ocorrência
- [x] Implementar listagem/admin de ocorrências
- [x] Implementar dashboard admin básico
- [x] Implementar listagem de profissionais pendentes
- [x] Implementar fluxo de aprovação/rejeição
- [x] Implementar listagem admin de atendimentos
- [x] Implementar listagem admin de pagamentos
- [x] Implementar listagem admin de solicitações
- [x] Implementar listagem/detalhe admin de usuários/clientes

## M10 — Polimento
- [ ] Adicionar validações UX no frontend — Parcial: formulários principais usam Zod, falta revisão global.
- [x] Adicionar estados de loading — Padronizado no frontend com `PageState`/`StateBox`.
- [x] Adicionar empty states — Padronizado no frontend com `PageState`/`StateBox`.
- [x] Adicionar feedbacks/toasts — Implementado como feedback inline com `FormAlert`; sem sistema de toast global.
- [ ] Revisar permissões por perfil — Parcial: rotas protegidas foram conferidas no frontend, endpoints críticos seguem protegidos; falta auditoria final ampla.
- [ ] Revisar status e transições — Parcial: backend concentra regras, falta revisão final de consistência.
- [ ] Revisar segurança mínima dos endpoints — Parcial: há testes de segurança em fluxos críticos, falta auditoria final.
- [ ] Revisar documentação final

---

## 15. Ordem recomendada de execução

1. M0 — Fundação
2. M1 — Dados base e auth
3. M2 — Onboarding profissional
4. M3 — Frontend base
5. M4 — Solicitações
6. M5 — Convites
7. M6 — Atendimento
8. M7 — Pagamentos
9. M8 — Avaliações
10. M9 — Ocorrências/admin
11. M10 — Polimento

---

## 16. Definição de sucesso do MVP

O MVP será considerado funcional quando:
- cliente conseguir criar solicitação completa
- profissional conseguir receber e aceitar convite
- atendimento for criado corretamente
- pagamento for confirmado via webhook
- profissional conseguir marcar início e fim
- cliente conseguir avaliar a profissional
- admin conseguir operar aprovações e acompanhar o básico

---

## 17. Observação final

Os dois pontos mais críticos do projeto são:
1. **aceite transacional do convite**
2. **confirmação de pagamento via webhook**

Se esses dois blocos estiverem mal feitos, o produto quebra mesmo que o resto esteja bonito.
