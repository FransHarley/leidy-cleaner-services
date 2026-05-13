# SPEC — Leidy Cleaner Services

## 1. Objetivo deste documento

Este documento transforma o PRD em uma especificação prática de execução do MVP da **Leidy Cleaner Services**.

Ele serve para:
- orientar desenvolvimento
- alinhar arquitetura e escopo
- definir critérios de pronto
- acompanhar progresso por milestones

---

## 2. Resumo do produto

Leidy Cleaner Services é uma plataforma web para intermediação operacional de serviços de limpeza.

As categorias de serviço suportadas são:
- `FAXINA_RESIDENCIAL`
- `FAXINA_COMERCIAL`
- `FAXINA_CONDOMINIO`
- `FAXINA_EVENTO`

Fluxo central:
1. cliente cria conta
2. profissional cria conta
3. profissional envia documentação e define regiões ou disponibilidade
4. cliente cria solicitação
5. cliente seleciona exatamente 1 profissional elegível
6. solicitação vai para `AGUARDANDO_PAGAMENTO`
7. cliente paga via Asaas ou usa `CreditoSolicitacao`
8. backend confirma pagamento
9. backend cria exatamente 1 convite
10. profissional aceita ou recusa
11. aceite válido cria o atendimento
12. recusa ou expiração podem gerar crédito de reposição
13. profissional executa o serviço
14. cliente avalia a profissional

---

## 3. Decisões técnicas fechadas

### Arquitetura
- monorepo
- estrutura principal:
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
- Asaas para cobrança externa
- pagamento externo pode nascer vinculado à `SolicitacaoFaxina`
- `AtendimentoFaxina` só existe após aceite válido
- webhook como fonte de verdade para confirmação externa

### Crédito de reposição
- `CreditoSolicitacao` representa uma nova solicitação equivalente
- não é carteira
- não é saldo monetário
- não é desconto
- não é banco de horas

### Fora do escopo do MVP
- repasse dentro da plataforma
- split de pagamento
- avaliação bilateral
- chat
- app mobile de cliente
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
- seleção de exatamente 1 profissional
- pagamento antes do convite
- pagamento via Asaas
- webhook de pagamento
- reconciliação segura de pagamento
- criação de convite somente após pagamento confirmado
- criação de atendimento somente após aceite válido
- `CreditoSolicitacao` para solicitação paga não aceita
- checkpoints de início e fim
- avaliação do cliente para a profissional
- ocorrências operacionais
- dashboard admin básico

### Excluído
- pagamento para profissional
- carteira monetária
- desconto financeiro flexível
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
- `CreditoSolicitacao`
- `CheckpointServico`
- `AvaliacaoProfissional`
- `OcorrenciaAtendimento`

---

## 6. Regras de negócio críticas

### 6.1 Seleção de profissional
- cliente deve selecionar exatamente 1 profissional
- validação obrigatória no backend

### 6.2 Elegibilidade de profissional
Uma profissional só pode aparecer como elegível se:
- conta ativa
- perfil aprovado
- documentos aprovados
- região compatível
- disponibilidade compatível
- sem conflito com atendimento ativo

### 6.3 Convite
- convite só nasce depois do pagamento confirmado
- existe exatamente 1 convite por solicitação paga nesse fluxo
- aceite continua transacional

### 6.4 Pagamento
- pagamento externo pode começar na `SolicitacaoFaxina`
- frontend nunca confirma pagamento
- webhook do Asaas atualiza `Pagamento`
- reconciliação manual segura deve reaproveitar o mesmo fluxo interno de confirmação

### 6.5 Atendimento
- `AtendimentoFaxina` só é criado após aceite válido
- nasce `CONFIRMADO`
- pagamento pago é vinculado ao atendimento criado

### 6.6 Solicitação não aceita
- recusa ou expiração não criam atendimento
- geram `CreditoSolicitacao` exatamente uma vez
- o crédito não vira saldo monetário

---

## 7. Estados principais

### `SolicitacaoFaxina`
- `CRIADA`
- `AGUARDANDO_SELECAO`
- `AGUARDANDO_PAGAMENTO`
- `PAGA_AGUARDANDO_ACEITE`
- `ACEITA`
- `EM_EXECUCAO`
- `FINALIZADA`
- `NAO_ACEITA_CREDITO_GERADO`
- `CANCELADA`
- `EXPIRADA`

### `AtendimentoFaxina`
- `CONFIRMADO`
- `EM_EXECUCAO`
- `FINALIZADO`
- `CANCELADO`
- `EM_ANALISE`

### `Pagamento`
- `PENDENTE`
- `AGUARDANDO_CONFIRMACAO`
- `PAGO`
- `FALHOU`
- `CANCELADO`
- `ESTORNADO`

### `CreditoSolicitacao`
- `DISPONIVEL`
- `RESERVADO`
- `UTILIZADO`
- `CANCELADO`
- `EXPIRADO`

---

## 8. Critérios de pronto dos fluxos críticos

- seleção única validada no backend
- pagamento por solicitação confirmado via backend
- webhook e reconciliação sem duplicar convite
- aceite criando atendimento e vinculando pagamento pago
- recusa ou expiração gerando `CreditoSolicitacao`
- execução do serviço com checkpoints válidos
- avaliação unilateral após atendimento finalizado
