# Arquitetura Técnica Recomendada

## 1. Visão geral

A arquitetura recomendada é de **monorepo com frontend e backend separados por aplicação**, compartilhando documentação, convenções e fluxos de produto.

O backend continua sendo a fonte de verdade para:
- elegibilidade da profissional
- seleção válida de profissional
- criação e confirmação de pagamento
- reconciliação com Asaas
- criação de convite
- aceite transacional
- criação de atendimento
- geração e uso de `CreditoSolicitacao`
- execução e avaliação

---

## 2. Estrutura de pastas

```text
leidy-cleaner-services/
├── AGENTS.md
├── README.md
├── docker-compose.yml
├── apps/
│   ├── frontend/
│   └── backend/
├── docs/
└── infra/
```

---

## 3. Camadas do backend

Arquitetura modular e em camadas:
- controllers finos
- services com regras de negócio
- repositories sem orquestração de fluxo
- DTOs para entrada e saída
- entidades sem exposição direta na API

Módulos centrais:
- `solicitacoes`
- `convites`
- `atendimentos`
- `pagamentos`
- `creditos`
- `profissionais`
- `clientes`
- `avaliacoes`
- `ocorrencias`

---

## 4. Fluxo técnico principal

### 4.1 Solicitação
1. Cliente cria `SolicitacaoFaxina`.
2. Backend valida endereço, região, data e tipo de serviço.
3. Cliente consulta profissionais elegíveis.
4. Cliente seleciona exatamente 1 profissional.
5. Backend persiste a seleção e move a solicitação para `AGUARDANDO_PAGAMENTO`.

### 4.2 Pagamento na solicitação
1. Backend cria um `Pagamento` para a solicitação.
2. Se o meio for externo, o pagamento nasce com `solicitacaoId` preenchido e `atendimentoId` nulo.
3. `externalReference` externo usa `solicitacao-{id}`.
4. Frontend apenas exibe checkout, status e refresh controlado.

### 4.3 Confirmação de pagamento
1. Asaas envia webhook para o backend.
2. O backend valida autenticidade e registra o evento.
3. O backend localiza o `Pagamento` por `gatewayPaymentId` e, se necessário, por `externalReference`.
4. O mesmo fluxo interno de confirmação deve ser reutilizado por reconciliação manual segura.
5. Ao confirmar:
   - `Pagamento` vira `PAGO`
   - `recebidoEm` é preenchido
   - `SolicitacaoFaxina` vai para `PAGA_AGUARDANDO_ACEITE`
   - o backend cria exatamente 1 `ConviteProfissional`
   - nenhum `AtendimentoFaxina` é criado nesse momento

### 4.4 Aceite da profissional
1. Profissional aceita ou recusa o convite.
2. No aceite válido, o backend roda transação para:
   - validar convite ativo
   - validar solicitação paga e aberta
   - criar `AtendimentoFaxina` já com status `CONFIRMADO`
   - vincular o pagamento pago ao atendimento criado
   - marcar o convite como aceito
   - atualizar a solicitação para `ACEITA`

### 4.5 Recusa ou expiração
Se a profissional recusar ou o convite expirar:
- não criar atendimento
- manter o pagamento como `PAGO`
- manter `atendimentoId` nulo
- mover a solicitação para `NAO_ACEITA_CREDITO_GERADO`
- criar exatamente um `CreditoSolicitacao`

### 4.6 Uso de crédito de reposição
1. Cliente cria uma nova solicitação equivalente.
2. Backend valida equivalência.
3. Backend consome um `CreditoSolicitacao`.
4. Backend cria um `Pagamento` interno com:
   - `gateway = INTERNO`
   - `metodoPagamento = CREDITO_SOLICITACAO`
   - `status = PAGO`
   - `atendimentoId = null`
5. Backend move a nova solicitação para `PAGA_AGUARDANDO_ACEITE` e cria exatamente 1 convite.

---

## 5. Arquitetura de pagamento

### Regras estruturais
- webhook é a fonte de verdade para confirmação externa
- frontend nunca marca pagamento como pago
- reconciliação manual consulta o gateway, mas reaproveita o mesmo fluxo interno de confirmação
- o pagamento pode começar na solicitação e terminar vinculado ao atendimento
- não existe criação de atendimento em webhook

### Estados relevantes
- `Pagamento`: `PENDENTE`, `AGUARDANDO_CONFIRMACAO`, `PAGO`, `FALHOU`, `CANCELADO`, `ESTORNADO`
- `SolicitacaoFaxina`: `AGUARDANDO_PAGAMENTO`, `PAGA_AGUARDANDO_ACEITE`, `ACEITA`, `NAO_ACEITA_CREDITO_GERADO`
- `AtendimentoFaxina`: `CONFIRMADO`, `EM_EXECUCAO`, `FINALIZADO`

---

## 6. Frontend

O frontend deve:
- criar solicitação
- listar elegíveis
- permitir seleção de exatamente 1 profissional
- iniciar o pagamento via backend
- exibir status do pagamento
- buscar periodicamente o estado persistido no backend
- ocultar UI de pagamento quando o backend marcar `PAGO`
- mostrar estado de aguardo de aceite após pagamento confirmado

O frontend não deve:
- validar regra crítica como definitiva
- confirmar pagamento
- criar convite
- criar atendimento
- decidir equivalência de crédito

---

## 7. Concorrência e idempotência

Fluxos que exigem cuidado:
- webhook duplicado não pode duplicar convite
- reconciliação duplicada não pode duplicar convite
- recusa e expiração não podem gerar crédito duplicado
- aceite concorrente deve continuar transacional
- vínculo do pagamento ao atendimento deve ocorrer uma única vez

---

## 8. Observações de evolução

O fluxo pré-pago muda a ordem do domínio, mas mantém os princípios arquiteturais do produto:
- backend como fonte de verdade
- Asaas como gateway externo
- dinheiro na conta da empresa
- sem split
- sem payout na plataforma
- sem chat
- sem múltiplas profissionais por atendimento
