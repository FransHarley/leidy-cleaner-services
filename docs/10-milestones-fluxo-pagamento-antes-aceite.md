# Milestones — Mudança de fluxo: pagamento antes do aceite da profissional

## Objetivo do documento

Este documento organiza a mudança de escopo do fluxo principal da Leidy Cleaner Services para que o Codex implemente em etapas pequenas, com checklist e critérios de aceite claros.

A mudança oficial de domínio é:

```text
Cliente cria solicitação
→ cliente visualiza profissionais elegíveis
→ cliente escolhe exatamente 1 profissional
→ cliente paga antes do convite
→ webhook do Asaas confirma o pagamento
→ backend envia convite apenas para a profissional escolhida
→ profissional aceita ou recusa
→ se aceitar: backend cria AtendimentoFaxina já CONFIRMADO
→ se recusar ou expirar: backend gera 1 crédito de reposição para uma nova solicitação equivalente
```

---

## Regras fixas da mudança

- [ ] Cliente escolhe exatamente **1 profissional** por solicitação.
- [ ] Não existe mais seleção de até 3 profissionais nesse fluxo.
- [ ] Não criar `AtendimentoFaxina` antes do aceite da profissional.
- [ ] `Pagamento` deve poder nascer vinculado à `SolicitacaoFaxina` antes de existir atendimento.
- [ ] `Pagamento.atendimentoId` pode ficar nulo até o aceite válido.
- [ ] Após aceite válido, o backend cria `AtendimentoFaxina` já com status `CONFIRMADO`.
- [ ] Após aceite válido, o backend vincula o `Pagamento` já pago ao `AtendimentoFaxina` criado.
- [ ] O frontend nunca confirma pagamento por conta própria.
- [ ] O webhook do Asaas continua sendo a fonte de verdade para confirmação de pagamento.
- [ ] O app/front da profissional não cria cobrança e não confirma pagamento.
- [ ] Se a profissional recusar ou o convite expirar, a solicitação é encerrada e o cliente recebe 1 crédito de reposição equivalente à solicitação paga original.
- [ ] Crédito do cliente não é carteira, não é saldo em dinheiro, não é desconto e não é banco de horas.
- [ ] O source of truth operacional do crédito deve ser um `CreditoSolicitacao` de uso único; ledger monetário, se existir, fica apenas como auditoria interna legada.
- [ ] Não implementar split payment.
- [ ] Não implementar repasse/payout dentro da plataforma.
- [ ] Não implementar saque de crédito.
- [ ] Não implementar carteira da profissional.
- [ ] Não implementar avaliação da profissional sobre o cliente.
- [ ] Não implementar chat como parte desta mudança.
- [ ] Não editar migrations antigas. Criar apenas novas migrations Flyway.
- [ ] Não inventar status sem documentar e testar.

---

## Política funcional do novo fluxo

### Seleção

- [ ] A solicitação pode ter somente uma profissional selecionada.
- [ ] A profissional selecionada precisa passar por todos os filtros de elegibilidade.
- [ ] O backend deve rejeitar payload com zero profissionais.
- [ ] O backend deve rejeitar payload com mais de uma profissional.
- [ ] O frontend deve impedir seleção múltipla, mas a regra final fica no backend.

### Pagamento

- [ ] O pagamento é criado depois da seleção de uma profissional.
- [ ] O pagamento é criado vinculado à solicitação.
- [ ] O atendimento ainda não existe nesse momento.
- [ ] O pagamento confirmado por webhook libera o envio do convite.
- [ ] O pagamento não pode ser confirmado pelo frontend.

### Convite

- [ ] O convite só é criado depois de pagamento confirmado.
- [ ] Deve existir somente um convite por solicitação no novo fluxo.
- [ ] O convite vai para a profissional escolhida pelo cliente.
- [ ] Aceite deve continuar transacional.
- [ ] Recusa deve encerrar a solicitação e gerar crédito.
- [ ] Expiração deve encerrar a solicitação e gerar crédito.

### Atendimento

- [ ] O atendimento só nasce depois do aceite válido.
- [ ] O atendimento nasce com status `CONFIRMADO`.
- [ ] O pagamento já pago deve ser associado ao atendimento criado.
- [ ] Somente a profissional vinculada pode iniciar/finalizar.

### Crédito

- [ ] Crédito é do cliente, não da profissional.
- [ ] Crédito representa uma nova solicitação equivalente, não um saldo monetário.
- [ ] Crédito só pode ser usado para futuras solicitações equivalentes.
- [ ] Crédito não pode ser sacado pelo cliente nesta etapa.
- [ ] Crédito não é repasse, payout ou split.
- [ ] Crédito não é carteira, desconto, pagamento parcial ou banco de horas.
- [ ] O registro operacional do crédito deve ser append-only por `CreditoSolicitacao`.
- [ ] Geração de crédito precisa ser idempotente.
- [ ] Recusa + expiração não podem gerar crédito duplicado.

---

# Milestones de implementação

## M0 — Congelar decisão e atualizar documentação base

### Objetivo
Formalizar a mudança de domínio antes de mexer pesado no código.

### Checklist

- [ ] Criar este documento em `docs/10-milestones-fluxo-pagamento-antes-aceite.md`.
- [ ] Atualizar `docs/spec.md` com o novo fluxo.
- [ ] Atualizar `docs/02-prd.md` com o novo fluxo do cliente.
- [ ] Atualizar `docs/03-architecture.md` na seção de pagamento.
- [ ] Atualizar `docs/04-domain-model.md` para refletir pagamento vinculado inicialmente à solicitação.
- [ ] Atualizar `docs/05-api-scope.md` com os novos endpoints/contratos.
- [ ] Atualizar `docs/06-roadmap-and-backlog.md` removendo “até 3 profissionais”.
- [ ] Atualizar `docs/07-frontend-milestones.md` para seleção única e pagamento por solicitação.
- [ ] Atualizar `docs/09-prd-app-profissional-capacitor.md` para indicar que convite chega somente após pagamento confirmado.
- [ ] Atualizar `AGENTS.md` para registrar a decisão nova: exatamente 1 profissional e pagamento antes do convite.
- [ ] Rodar uma checagem final de sincronização documental para remover sobras do fluxo antigo dos documentos oficiais.

### Critérios de aceite

- [ ] Não sobra documento principal dizendo que o cliente seleciona até 3 profissionais.
- [ ] Não sobra documento principal dizendo que a cobrança nasce somente depois do atendimento.
- [ ] Todos os documentos deixam claro que o webhook continua sendo fonte de verdade.
- [ ] Todos os documentos deixam claro que crédito não é payout, split nem saque.

### Validação

```bash
grep -R "até 3\|up to 3\|máximo 3\|maximum 3" -n AGENTS.md docs || true
grep -R "pagamento sempre nasce de um atendimento\|cobrança vinculada ao atendimento" -n AGENTS.md docs || true
```

---

## M1 — Migration estrutural de pagamento e crédito

### Objetivo
Preparar o banco para o novo fluxo sem quebrar registros antigos.

### Checklist

- [x] Criar nova migration Flyway.
- [x] Adicionar `solicitacao_id` em `pagamentos`.
- [x] Permitir `pagamentos.atendimento_id` nulo.
- [x] Criar índice para `pagamentos.solicitacao_id`.
- [x] Criar índice para `pagamentos.atendimento_id` se ainda não existir.
- [x] Criar FK de `pagamentos.solicitacao_id` para `solicitacoes_faxina(id)`.
- [x] Manter compatibilidade com pagamentos antigos já vinculados a atendimento.
- [x] Criar tabela `creditos_cliente_movimentos`.
- [x] Criar índice por `cliente_id` em `creditos_cliente_movimentos`.
- [x] Criar índice por `solicitacao_origem_id`.
- [x] Criar índice por `pagamento_origem_id`.
- [x] Criar índice por `solicitacao_uso_id`.
- [x] Criar guarda de idempotência para impedir crédito duplicado por `pagamento_origem_id + tipo_movimento`.

### Estrutura esperada de `creditos_cliente_movimentos`

```text
id BIGSERIAL PRIMARY KEY
cliente_id BIGINT NOT NULL
solicitacao_origem_id BIGINT NULL
pagamento_origem_id BIGINT NULL
solicitacao_uso_id BIGINT NULL
tipo_movimento VARCHAR(60) NOT NULL
valor NUMERIC(12,2) NOT NULL
saldo_resultante NUMERIC(12,2) NOT NULL
observacao TEXT NULL
criado_em TIMESTAMP NOT NULL DEFAULT now()
```

Observação:
- `creditos_cliente_movimentos` permanece apenas como trilha de auditoria interna legada.
- O source of truth operacional para reposição de solicitação passa a ser `CreditoSolicitacao`.

### Tipos de movimento previstos

```text
CREDITO_GERADO_SEM_ACEITE
CREDITO_UTILIZADO_EM_SOLICITACAO
CREDITO_ESTORNADO
AJUSTE_ADMIN
```

### Critérios de aceite

- [x] Backend sobe com Flyway limpo.
- [x] Pagamentos antigos com `atendimento_id` continuam válidos.
- [x] É possível criar pagamento com `solicitacao_id` e `atendimento_id = null`.
- [x] Não é possível gerar dois créditos para o mesmo pagamento e mesmo tipo de movimento.

### Validação

```bash
cd apps/backend
./mvnw test
```

---

## M2 — Entidades, enums, repositories e contratos base

### Objetivo
Atualizar o domínio Java sem mudar ainda todo o fluxo operacional.

### Checklist

- [ ] Atualizar entidade `Pagamento` para ter `solicitacao` e `atendimento` opcional.
- [ ] Garantir que `atendimento` pode ser nulo no Java.
- [ ] Criar entidade `CreditoClienteMovimento`.
- [ ] Criar enum `TipoMovimentoCreditoCliente`.
- [ ] Criar repository de crédito.
- [ ] Criar service inicial de crédito com operações append-only.
- [ ] Não criar método de delete/update para movimento de crédito.
- [ ] Atualizar DTOs de pagamento para expor `solicitacaoId` quando existir.
- [ ] Atualizar mappers de pagamento.
- [ ] Atualizar repositories de pagamento para buscar por `solicitacaoId`.
- [ ] Preservar buscas antigas por `atendimentoId` enquanto telas antigas ainda existirem.

### Critérios de aceite

- [ ] Código compila.
- [ ] Testes existentes continuam passando ou são ajustados apenas por contrato estrutural.
- [ ] O domínio permite pagamento por solicitação sem atendimento.
- [ ] O domínio ainda aceita pagamento antigo por atendimento para compatibilidade.

### Validação

```bash
cd apps/backend
./mvnw test
```

---

## M3 — Seleção exatamente 1 profissional

### Objetivo
Trocar a regra de seleção de “1 a 3” para “exatamente 1”.

### Checklist

- [x] Atualizar DTO `SelecionarProfissionaisRequest` ou equivalente.
- [x] Rejeitar lista vazia.
- [x] Rejeitar lista com mais de 1 profissional.
- [x] Manter validação de elegibilidade da profissional.
- [x] Manter validação de ownership da solicitação.
- [x] Ajustar constraint/check antigo de `ordem_escolha BETWEEN 1 AND 3`, se necessário.
- [x] Criar constraint/índice para impedir mais de uma profissional selecionada por solicitação.
- [x] Parar envio imediato de convites após seleção.
- [x] Após seleção, mover solicitação para `AGUARDANDO_PAGAMENTO`.
- [x] Remover/corrigir lógica de ordem de escolha.

### Critérios de aceite

- [x] Selecionar uma profissional funciona.
- [x] Selecionar zero profissionais falha.
- [x] Selecionar duas ou mais profissionais falha.
- [x] Nenhum convite é criado no momento da seleção.
- [x] Solicitação fica aguardando pagamento após seleção.

### Testes obrigatórios

- [x] Backend rejeita payload com mais de uma profissional.
- [x] Backend rejeita profissional inelegível.
- [x] Backend não cria convite antes do pagamento.
- [x] Backend muda status para `AGUARDANDO_PAGAMENTO` após seleção válida.

### Validação

```bash
cd apps/backend
./mvnw test
```

---

## M4 — Pagamento por solicitação

### Objetivo
Permitir checkout/cobrança antes do atendimento existir.

### Checklist

- [x] Criar ou adaptar endpoint para criar pagamento por `solicitacaoId`.
- [x] Validar que a solicitação pertence ao cliente autenticado.
- [x] Validar que existe exatamente uma profissional selecionada.
- [x] Validar que a solicitação está em status compatível com pagamento.
- [x] Impedir mais de um pagamento ativo para a mesma solicitação.
- [x] Criar cobrança no Asaas com referência externa baseada em solicitação, por exemplo `solicitacao-{id}`.
- [x] Persistir `gateway_payment_id`.
- [x] Persistir `solicitacao_id` no pagamento.
- [x] Manter `atendimento_id = null` nesse momento.
- [x] Criar endpoint de consulta de pagamento por solicitação.
- [x] Manter consulta por atendimento para compatibilidade com telas antigas e admin.
- [x] Ajustar autorização de pagamento para cliente dono da solicitação e admin.

### Critérios de aceite

- [x] Cliente consegue gerar Pix/fatura antes de existir atendimento.
- [x] Pagamento fica vinculado à solicitação.
- [x] Atendimento não é criado nesta etapa.
- [x] Frontend continua sem poder confirmar pagamento.

### Testes obrigatórios

- [x] Criar pagamento por solicitação válida.
- [x] Bloquear pagamento por solicitação sem profissional selecionada.
- [x] Bloquear pagamento por solicitação de outro cliente.
- [x] Bloquear pagamento duplicado ativo para a mesma solicitação.

### Validação

```bash
cd apps/backend
./mvnw test
```

---

## M5 — Webhook confirma pagamento e dispara convite

### Objetivo
Após pagamento confirmado pelo Asaas, enviar o convite para a única profissional selecionada.

Status escolhido para a solicitação após confirmação do pagamento: `PAGA_AGUARDANDO_ACEITE`.

### Checklist

- [x] Atualizar reconciliação do webhook para localizar pagamento por `solicitacao-*`.
- [x] Manter compatibilidade com pagamentos antigos por `atendimento-*`, se ainda necessário.
- [x] Ao receber evento confirmado, marcar pagamento como `PAGO`.
- [x] Preencher `recebidoEm` quando aplicável.
- [x] Se pagamento tem `solicitacaoId` e não tem `atendimentoId`, buscar a profissional selecionada.
- [x] Criar exatamente um `ConviteProfissional`.
- [x] Garantir idempotência: webhook duplicado não pode criar dois convites.
- [x] Atualizar solicitação para `PAGA_AGUARDANDO_ACEITE` ou `CONVITE_ENVIADO`, conforme enum escolhido.
- [x] Não criar atendimento no webhook.
- [x] Não gerar crédito no webhook de pagamento.

### Critérios de aceite

- [x] Pagamento confirmado por webhook cria um único convite.
- [x] Webhook duplicado não duplica convite.
- [x] Solicitação fica aguardando resposta da profissional.
- [x] Atendimento ainda não existe.

### Testes obrigatórios

- [x] Webhook confirmado cria convite para a profissional selecionada.
- [x] Webhook duplicado não cria convite duplicado.
- [x] Webhook sem profissional selecionada não quebra silenciosamente; registra erro/status operacional.
- [x] Frontend não participa da confirmação.

### Validação

```bash
cd apps/backend
./mvnw test
```

---

## M6 — Aceite cria atendimento confirmado e vincula pagamento

### Objetivo
Adaptar aceite para o novo fluxo pago antes do convite.

### Checklist

- [x] No aceite, validar que o convite está ativo.
- [x] No aceite, validar que a solicitação está paga/aguardando aceite.
- [x] No aceite, localizar pagamento `PAGO` da solicitação.
- [x] Criar `AtendimentoFaxina` somente no aceite.
- [x] Criar atendimento com status `CONFIRMADO`.
- [x] Vincular pagamento existente ao atendimento criado.
- [x] Marcar convite como `ACEITO`.
- [x] Atualizar solicitação para `ACEITA`.
- [x] Impedir aceite duplicado.
- [ ] Impedir aceite se solicitação já virou crédito.
- [x] Impedir aceite se pagamento não estiver `PAGO`.

### Critérios de aceite

- [x] Profissional aceita convite pago.
- [x] Atendimento nasce confirmado.
- [x] Pagamento fica com `solicitacao_id` e `atendimento_id` preenchidos.
- [x] Não existe atendimento antes do aceite.
- [x] Aceite duplicado falha sem duplicar atendimento.

### Testes obrigatórios

- [x] Aceite válido cria atendimento confirmado.
- [x] Aceite vincula pagamento ao atendimento.
- [x] Aceite sem pagamento confirmado falha.
- [x] Aceite duplicado não cria segundo atendimento.
- [x] Aceite de convite expirado/cancelado falha.

### Validação

```bash
cd apps/backend
./mvnw test
```

---

## M7 — Recusa, expiração e geração de crédito

### Objetivo
Encerrar a solicitação e gerar um `CreditoSolicitacao` disponível quando a profissional não aceitar.

### Checklist

- [x] Ao recusar convite, marcar convite como `RECUSADO`.
- [x] Ao recusar, validar que existe pagamento `PAGO` da solicitação.
- [x] Ao recusar, gerar um `CreditoSolicitacao` com status `DISPONIVEL`.
- [x] Ao recusar, atualizar solicitação para `NAO_ACEITA_CREDITO_GERADO` ou status equivalente.
- [x] Ao expirar convite, marcar convite como `EXPIRADO`.
- [x] Ao expirar, gerar um `CreditoSolicitacao` equivalente com status `DISPONIVEL`.
- [x] Criar serviço de expiração se ainda não existir caminho real de processamento.
- [x] Garantir idempotência entre recusa e expiração.
- [x] Garantir que crédito não pode ser gerado duas vezes para o mesmo pagamento.
- [x] Registrar logs operacionais sem expor dados sensíveis.
- [x] Refatorar o modelo operacional para crédito de reposição de solicitação, e não saldo/carteira.

### Critérios de aceite

- [x] Recusa gera exatamente um crédito.
- [x] Expiração gera exatamente um crédito.
- [x] Recusa + expiração não duplicam crédito.
- [x] Solicitação fica encerrada para aquela escolha.
- [x] Atendimento não é criado.

### Testes obrigatórios

- [x] Recusa gera crédito.
- [x] Expiração gera crédito.
- [x] Duplicidade de processamento não duplica crédito.
- [x] Tentativa de aceitar após crédito gerado falha.

### Validação

```bash
cd apps/backend
./mvnw test
```

---

## M8 — Uso de crédito em solicitação futura

### Objetivo
Permitir que o cliente use um `CreditoSolicitacao` em uma nova solicitação equivalente, sem semântica de saldo monetário.
O crédito continua não sendo carteira, saldo em dinheiro, desconto nem banco de horas.

### Checklist

- [ ] Criar método para localizar crédito disponível do cliente por equivalência.
- [x] Criar endpoint ou incluir no fluxo de solicitação o uso de `CreditoSolicitacao`.
- [ ] Marcar crédito como `RESERVADO` e depois `UTILIZADO` quando a nova solicitação equivalente for efetivamente usada.
- [x] Se o cliente usar crédito equivalente, não criar desconto parcial nem saldo restante.
- [x] Garantir que uso de crédito também seja idempotente.
- [x] Garantir que crédito não pode ser usado por outro cliente.
- [x] Não expor saldo de crédito ao cliente.
- [ ] Expor histórico/lista de créditos de solicitação para admin quando necessário.

### Critérios de aceite

- [x] Cliente com crédito consegue usar uma nova solicitação equivalente.
- [x] Uso do crédito não permite parcial, divisão nem desconto.
- [ ] Crédito não vira saque nem payout.
- [x] Convite só é enviado quando a nova solicitação estiver quitada por crédito equivalente ou por pagamento confirmado.

### Testes obrigatórios

- [x] Uso de crédito equivalente quita a solicitação sem pagamento parcial.
- [x] Solicitação não equivalente é rejeitada.
- [x] Cliente não usa crédito de outro cliente.
- [x] Reprocessamento não duplica uso do crédito.

### Validação

```bash
cd apps/backend
./mvnw test
```

---

## M9 — Frontend cliente: seleção única e pagamento por solicitação

### Objetivo
Adaptar o fluxo visual do cliente ao novo domínio.

### Checklist

- [x] Tela de profissionais elegíveis permite selecionar somente uma profissional.
- [x] Remover UI de ordem de escolha.
- [x] Remover texto “escolha até 3”.
- [x] Após selecionar profissional, redirecionar para pagamento da solicitação.
- [x] Tela de pagamento usa `solicitacaoId`, não `atendimentoId`.
- [x] Polling de pagamento continua funcionando.
- [x] QR Code/Pix aparece apenas enquanto pagamento está pendente.
- [x] Após pagamento confirmado, mostrar “Pagamento confirmado. Aguardando aceite da profissional”.
- [x] Solicitação detalhe mostra estados novos.
- [x] Mostrar mensagem clara antes do pagamento: se a profissional não aceitar, a cliente recebe 1 crédito de reposição para solicitação equivalente.
- [x] Mostrar estado de crédito gerado se a profissional recusar/expirar.
- [ ] Se atendimento for criado, exibir link para atendimento.

### Critérios de aceite

- [x] Cliente não consegue selecionar mais de uma profissional pela UI.
- [x] Cliente entende que está pagando antes do aceite.
- [x] Cliente entende que recusa/expiração vira crédito.
- [x] Pagamento atualiza automaticamente por polling.
- [x] Frontend não marca pagamento como pago localmente.

### Validação

```bash
cd apps/frontend
npm run build
```

---

## M10 — Frontend profissional/app: convites já pagos

### Objetivo
Adaptar a experiência da profissional para o novo fluxo.

### Checklist

- [ ] Convite deve deixar claro que o serviço já foi pago pelo cliente.
- [ ] Remover textos que indiquem “aguardando pagamento” antes do aceite.
- [ ] Ao aceitar, mostrar atendimento confirmado.
- [ ] Ao recusar, mostrar que a solicitação será encerrada para aquela profissional.
- [ ] Tratar erro se convite já expirou.
- [ ] Tratar erro se solicitação virou crédito.
- [ ] App/front profissional continua sem criar cobrança.
- [ ] App/front profissional continua sem confirmar pagamento.

### Critérios de aceite

- [ ] Profissional vê convite e aceita/recusa normalmente.
- [ ] Aceite mostra atendimento confirmado.
- [ ] Recusa remove convite da fila ativa.
- [ ] Nenhuma regra crítica fica no frontend.

### Validação

```bash
cd apps/frontend
npm run build
```

---

## M11 — Admin e observabilidade operacional

### Objetivo
Dar visibilidade para suporte e operação.

### Checklist

- [ ] Admin vê pagamento por solicitação mesmo sem atendimento.
- [ ] Admin vê pagamento já vinculado ao atendimento após aceite.
- [ ] Admin vê solicitações aguardando pagamento.
- [ ] Admin vê solicitações pagas aguardando aceite.
- [ ] Admin vê solicitações com crédito gerado.
- [ ] Admin vê ledger/histórico de crédito do cliente.
- [ ] Logs diferenciam pagamento por solicitação e pagamento por atendimento legado.
- [ ] Logs de webhook indicam external reference, pagamento localizado, solicitação localizada e convite criado.
- [ ] Logs de crédito indicam idempotência sem duplicar crédito.

### Critérios de aceite

- [ ] Operação consegue entender onde o fluxo parou.
- [ ] Suporte consegue explicar ao cliente se o valor virou crédito.
- [ ] Admin não precisa consultar banco para casos comuns.

### Validação

```bash
cd apps/backend
./mvnw test

cd ../frontend
npm run build
```

---

## M12 — Atualização completa dos testes de fluxo

### Objetivo
Trocar os testes do fluxo antigo pelos testes do fluxo novo.

### Checklist backend

- [ ] Teste: seleção com mais de 1 profissional falha.
- [ ] Teste: seleção com exatamente 1 profissional passa.
- [ ] Teste: seleção não cria convite.
- [ ] Teste: pagamento por solicitação antes de atendimento.
- [ ] Teste: webhook confirma pagamento e cria convite único.
- [ ] Teste: webhook duplicado não cria convite duplicado.
- [ ] Teste: aceite cria atendimento confirmado.
- [ ] Teste: aceite vincula pagamento ao atendimento.
- [ ] Teste: aceite sem pagamento confirmado falha.
- [ ] Teste: recusa gera crédito.
- [ ] Teste: expiração gera crédito.
- [ ] Teste: crédito não duplica.
- [ ] Teste: crédito pode ser usado em solicitação futura.
- [ ] Teste: cliente não acessa crédito de outro cliente.
- [ ] Teste: início/fim de atendimento continuam respeitando ownership.

### Checklist frontend

- [ ] Build passa.
- [ ] Tela de seleção não mostra seleção múltipla.
- [ ] Tela de pagamento usa solicitação.
- [ ] Tela mostra aguardando aceite após pagamento.
- [ ] Tela mostra crédito gerado quando profissional recusa/expira.
- [ ] Tela de atendimento aparece após aceite.

### Validação

```bash
cd apps/backend
./mvnw test

cd ../frontend
npm run build
```

---

## M13 — Limpeza de legado e textos antigos

### Objetivo
Remover inconsistências depois do fluxo novo estar passando.

### Checklist

- [x] Remover textos “até 3 profissionais”.
- [x] Remover textos “aguarde aceite para pagar”.
- [x] Remover linguagem de saldo, desconto e banco de horas do crédito de reposição visível para cliente.
- [ ] Remover rotas de pagamento baseadas exclusivamente em atendimento se não forem mais usadas.
- [ ] Manter compatibilidade somente onde for necessário para registros antigos/admin.
- [ ] Remover UI de ordem de escolha.
- [ ] Remover código morto de cancelamento de convites concorrentes se não for mais usado.
- [ ] Revisar enums antigos que ficaram sem uso.
- [ ] Revisar seed/test fixtures antigas.
- [ ] Revisar docs finais.

### Critérios de aceite

- [ ] Código não mantém duas verdades de negócio conflitantes.
- [ ] Documentos e telas dizem a mesma coisa.
- [ ] Build frontend passa.
- [ ] Testes backend passam.

### Validação

```bash
grep -R "até 3\|up to 3\|ordem de escolha\|order of choice" -n apps docs AGENTS.md || true

cd apps/backend
./mvnw test

cd ../frontend
npm run build
```

---

## M14 — Teste manual de ponta a ponta

### Objetivo
Validar o fluxo real como cliente, profissional e admin.

### Checklist do fluxo feliz

- [ ] Cliente cria solicitação.
- [ ] Cliente vê profissionais elegíveis.
- [ ] Cliente escolhe exatamente 1 profissional.
- [ ] Cliente vê aviso claro sobre crédito se não houver aceite.
- [ ] Cliente paga via Pix/Asaas.
- [ ] Webhook confirma pagamento.
- [ ] Convite aparece para a profissional.
- [ ] Profissional aceita convite.
- [ ] Atendimento é criado como `CONFIRMADO`.
- [ ] Pagamento fica vinculado ao atendimento.
- [ ] Profissional inicia atendimento.
- [ ] Profissional finaliza atendimento.
- [ ] Cliente avalia profissional.

### Checklist de recusa

- [ ] Cliente cria solicitação.
- [ ] Cliente escolhe 1 profissional.
- [ ] Cliente paga.
- [ ] Webhook confirma e cria convite.
- [ ] Profissional recusa.
- [ ] Solicitação muda para status de crédito gerado.
- [ ] Crédito aparece como crédito de reposição disponível no histórico do cliente.
- [ ] Nenhum atendimento é criado.

### Checklist de expiração

- [ ] Cliente cria solicitação.
- [ ] Cliente escolhe 1 profissional.
- [ ] Cliente paga.
- [ ] Webhook confirma e cria convite.
- [ ] Convite expira.
- [ ] Sistema gera crédito uma única vez.
- [ ] Nenhum atendimento é criado.

### Checklist de crédito futuro

- [ ] Cliente com crédito cria nova solicitação.
- [ ] Sistema aplica o crédito equivalente corretamente.
- [ ] Convite é enviado sem nova cobrança externa quando a nova solicitação é quitada por crédito equivalente.
- [ ] Não existe uso parcial nem diferença monetária a pagar a partir do crédito.
- [ ] Histórico de uso do `CreditoSolicitacao` fica correto.

---

# Sequência recomendada de commits

Use commits pequenos. Não juntar backend, frontend e docs finais em um único commit gigante.

```text
1. docs: document payment-before-acceptance flow
2. feat: add solicitation payment and customer credit schema
3. feat: support solicitation payments in backend domain
4. feat: enforce single professional selection
5. feat: create solicitation checkout flow
6. feat: send invitation after payment webhook
7. feat: create confirmed attendance on paid invitation acceptance
8. feat: generate customer credit on refusal or expiration
9. feat: apply customer credit to future solicitations
10. feat: update customer payment and selection UI
11. feat: update professional invitation UI for paid requests
12. feat: expose credit and payment states to admin
13. test: cover payment-before-acceptance flow
14. chore: remove legacy multi-selection assumptions
```

---

# Prompts curtos para o Codex por milestone

## Prompt padrão antes de cada milestone

```text
Read docs/10-milestones-fluxo-pagamento-antes-aceite.md.
Implement only milestone M{N}.
Do not implement later milestones.
Keep business rules in the backend.
Do not edit old Flyway migrations.
Run the required validation commands.
Report changed files, tests run, and any remaining risk.
```

## Prompt de revisão após cada milestone

```text
Review the implementation of milestone M{N} against docs/10-milestones-fluxo-pagamento-antes-aceite.md.
Check if the implementation accidentally changes later milestones.
Check if the frontend confirms payment anywhere.
Check if any business rule was moved to the frontend.
Check if old migrations were edited.
Check if tests/build were run.
Return blockers before commit.
```

---

# Riscos que o Codex deve sempre reportar

- [ ] Fluxo antigo e novo coexistindo com regras conflitantes.
- [ ] Pagamento sem `solicitacao_id` nem `atendimento_id`.
- [ ] Atendimento criado antes do aceite.
- [ ] Convite criado antes do webhook confirmar pagamento.
- [ ] Crédito duplicado por reprocessamento.
- [ ] Frontend marcando pagamento como pago.
- [ ] Seleção múltipla ainda possível no backend.
- [ ] Expiração de convite apenas visual, sem processamento backend.
- [ ] Rotas frontend ainda baseadas somente em `atendimentoId`.
- [ ] Admin sem visibilidade de pagamentos sem atendimento.
- [ ] Documentação contradizendo o fluxo novo.

---

# Definition of Done da mudança inteira

A mudança só pode ser considerada concluída quando:

- [ ] Cliente consegue criar solicitação e selecionar exatamente uma profissional.
- [ ] Cliente paga antes do convite ser enviado.
- [ ] Webhook confirma pagamento.
- [ ] Backend envia convite somente após pagamento confirmado.
- [ ] Profissional aceita convite.
- [ ] Atendimento nasce `CONFIRMADO`.
- [ ] Pagamento fica associado ao atendimento depois do aceite.
- [ ] Recusa gera crédito uma única vez.
- [ ] Expiração gera crédito uma única vez.
- [ ] Cliente consegue usar crédito em futura solicitação.
- [ ] Frontend nunca confirma pagamento por conta própria.
- [ ] App/front profissional não cria nem confirma cobrança.
- [ ] Admin consegue acompanhar pagamento, solicitação, convite, atendimento e crédito.
- [ ] Testes backend passam.
- [ ] Build frontend passa.
- [ ] Docs principais estão atualizados e sem conflito.
