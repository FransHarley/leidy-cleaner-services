# Escopo de API REST

## 1. Convenções

### Base
`/api/v1`

### Resposta padrão de sucesso
```json
{
  "success": true,
  "data": {}
}
```

### Resposta padrão de erro
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Mensagem legível",
  "errors": []
}
```

### Paginação
- `page`
- `size`
- `sort`

---

## 2. Auth

### POST `/auth/login`
Realiza login.

### GET `/auth/me`
Retorna dados do usuário autenticado.

---

## 3. Usuários

### POST `/usuarios/clientes`
Cria conta de cliente.

### POST `/usuarios/profissionais`
Cria conta de profissional.

### PATCH `/usuarios/{id}/status`
Admin altera status da conta.

### GET `/usuarios`
Admin lista usuários em modo somente leitura.

Parametros opcionais:
- `tipoUsuario`
- `statusConta`
- `search`

### GET `/usuarios/{id}`
Admin consulta detalhe seguro do usuário em modo somente leitura.

### GET `/clientes`
Não existe endpoint separado. Clientes são consultados pela visão admin de `/usuarios`, com `perfilClienteId` quando houver perfil vinculado.

---

## 4. Endereços

### POST `/enderecos`
Cria endereço do usuário autenticado.

### GET `/enderecos/meus`
Lista endereços do usuário autenticado.

### PUT `/enderecos/{id}`
Atualiza endereço.

### DELETE `/enderecos/{id}`
Remove endereço.

---

## 5. Regiões

### GET `/regioes`
Lista regiões ativas.

### POST `/regioes`
Admin cria região.

### PUT `/regioes/{id}`
Admin atualiza região.

### PATCH `/regioes/{id}/ativacao`
Admin ativa/inativa região.

---

## 6. Profissional

### GET `/profissionais/me`
Retorna o perfil da profissional logada.

### PUT `/profissionais/me`
Atualiza perfil da profissional.

### POST `/profissionais/me/regioes`
Define regiões atendidas.

### GET `/profissionais/me/regioes`
Lista regiões da profissional.

### POST `/profissionais/me/disponibilidades`
Cria disponibilidade semanal.

### GET `/profissionais/me/disponibilidades`
Lista disponibilidades.

### PUT `/profissionais/me/disponibilidades/{id}`
Atualiza disponibilidade.

### DELETE `/profissionais/me/disponibilidades/{id}`
Remove disponibilidade.

### GET `/profissionais`
Admin lista profissionais. Retorna `ApiResponse<List<AdminProfissionalResponse>>`.

Parâmetros opcionais:
- `statusAprovacao`: filtra por status de aprovação.
- `search`: busca simples por nome de exibição, nome completo ou e-mail.

Campos principais retornados: `id`, `usuarioId`, `nomeCompleto`, `email`, `telefone`, `nomeExibicao`, `cpf`, `dataNascimento`, `descricao`, `fotoPerfilUrl`, `experienciaAnos`, `ativoParaReceberChamados`, `statusAprovacao`, `notaMedia`, `totalAvaliacoes`, `criadoEm`, `atualizadoEm`, `statusConta` e `tipoUsuario`.

Não expõe senha/hash, documentos de verificação ou URLs sensíveis.

### PATCH `/profissionais/{id}/aprovacao`
Admin aprova/rejeita profissional.

---

## 7. Verificação documental

### POST `/verificacoes/documentos`
Faz upload/registro dos arquivos de verificação.

### GET `/verificacoes/minha`
Usuário vê o status da própria verificação.

### GET `/verificacoes`
Admin lista verificações.

### GET `/verificacoes/{id}`
Admin vê detalhes.

### PATCH `/verificacoes/{id}/analisar`
Admin aprova/rejeita análise.

---

## 8. Solicitações

### POST `/solicitacoes`
Cliente cria solicitação de faxina.

`tipoServico` deve usar um destes valores:
- `FAXINA_RESIDENCIAL`
- `FAXINA_COMERCIAL`
- `FAXINA_CONDOMINIO`
- `FAXINA_EVENTO`

### GET `/solicitacoes/minhas`
Cliente lista suas solicitações.

### GET `/solicitacoes`
Admin lista solicitações em modo somente leitura.

Parametros opcionais:
- `status`
- `clienteId`
- `regiaoId`
- `tipoServico`

### GET `/solicitacoes/{id}`
Detalhe da solicitação para a cliente dona. Admin tambem pode consultar qualquer solicitação em modo somente leitura.

### PATCH `/solicitacoes/{id}/cancelar`
Cancela solicitação.

### GET `/solicitacoes/{id}/profissionais-disponiveis`
Lista profissionais elegíveis.

### POST `/solicitacoes/{id}/selecionados`
Cliente seleciona até 3 profissionais.

---

## 9. Convites

### GET `/convites/meus`
Profissional lista convites.

### GET `/convites/{id}`
Detalhe do convite.

### POST `/convites/{id}/aceitar`
Profissional aceita convite.

### POST `/convites/{id}/recusar`
Profissional recusa convite.

---

## 10. Atendimentos

### GET `/atendimentos/meus`
Lista atendimentos do usuario autenticado:
- cliente ve atendimentos em que e dona
- profissional ve atendimentos em que esta atribuida

### GET `/atendimentos/{id}`
Detalha atendimento relacionado ao usuario autenticado. Admin também pode consultar qualquer atendimento em modo somente leitura.

### GET `/atendimentos`
Admin lista atendimentos em modo somente leitura.

Parâmetros opcionais:
- `status`
- `clienteId`
- `profissionalId`

### POST `/atendimentos/{id}/iniciar`
Profissional atribuida inicia o servico. Transicao: `CONFIRMADO -> EM_EXECUCAO`.

Payload:
```json
{
  "latitude": -30.1234567,
  "longitude": -51.1234567,
  "fotoComprovacaoUrl": "local/checkpoints/inicio.png",
  "observacao": "Inicio registrado"
}
```

### POST `/atendimentos/{id}/finalizar`
Profissional atribuida finaliza o servico. Transicao: `EM_EXECUCAO -> FINALIZADO`.

Payload igual ao de inicio. `fotoComprovacaoUrl` e apenas metadado; upload/armazenamento real ficam fora deste marco.

### GET `/atendimentos/{id}/checkpoints`
Lista checkpoints do atendimento para usuario relacionado. Admin também pode consultar checkpoints de qualquer atendimento.

---

## 11. Pagamentos

### POST `/pagamentos/checkout`
Cria checkout Asaas para um atendimento da cliente autenticada. Esse e o caminho principal do MVP. O pagamento nasce vinculado ao `AtendimentoFaxina`, fica pendente e retorna `checkoutUrl` para redirecionamento.

### POST `/pagamentos`
Cria cobranca direta do atendimento. Endpoint legado/deprecado; depende de `ASAAS_DEFAULT_CUSTOMER_ID` e nao e o caminho principal do checkout.

### GET `/pagamentos/{id}`
Consulta pagamento do cliente relacionado. Admin tambem pode consultar qualquer pagamento em modo somente leitura.

### GET `/pagamentos/atendimento/{atendimentoId}`
Consulta pagamento pelo atendimento para o cliente relacionado. Admin tambem pode consultar o pagamento de qualquer atendimento em modo somente leitura.

### GET `/pagamentos`
Admin lista pagamentos em modo somente leitura.

Parametros opcionais:
- `status`
- `metodoPagamento`
- `atendimentoId`

### POST `/pagamentos/{id}/consultar-status`
Cliente relacionado reconsulta o gateway, mas nao confirma pagamento de forma definitiva. Estados recebidos do gateway podem ir para `AGUARDANDO_CONFIRMACAO`; `PAGO` so vem do webhook. Admin nao usa essa rota para forcar transicao.

### POST `/webhooks/asaas`
Recebe webhook do Asaas em `POST /api/v1/webhooks/asaas`. O endpoint:
- aceita eventos sem JWT, mas exige o header `asaas-access-token`
- compara `asaas-access-token` com `ASAAS_WEBHOOK_TOKEN` antes de processar o payload
- rejeita chamadas sem token ou com token invalido com erro JSON 401
- usa `event`, `payment.id`, `payment.checkoutSession` e, para checkout, `checkout.id` como identificadores principais
- no caminho principal de Checkout, `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED` reconciliam o pagamento quando o payload traz `payment.checkoutSession`; `CHECKOUT_PAID` continua suportado se o Asaas o emitir
- confirma `Pagamento = PAGO` e `AtendimentoFaxina = CONFIRMADO` apenas em eventos de sucesso suportados
- e idempotente e ignora entregas duplicadas com resposta 2xx estavel
- ignora eventos desconhecidos ou nao suportados com resposta 200 para evitar retry desnecessario do gateway
- valida o payload estruturalmente depois da autenticacao por token do webhook

---

## 12. Avaliações

### POST `/avaliacoes`
Cliente cria avaliação da profissional.

### GET `/profissionais/{id}/avaliacoes`
Lista avaliações da profissional.

---

## 13. Ocorrências

### POST `/ocorrencias`
Abre ocorrência.

### GET `/ocorrencias/meus`
Usuário lista suas ocorrências.

### GET `/ocorrencias/{id}`
Detalha ocorrência.

### GET `/ocorrencias`
Admin lista ocorrências.

### PATCH `/ocorrencias/{id}/status`
Admin altera status.

---

## 14. Regras críticas de API

### 14.1 Aceite de convite
A rota de aceite deve:
- validar que a solicitação ainda está aberta
- validar que o convite ainda está ativo
- criar o atendimento
- cancelar os demais convites
- rodar em transação

### 14.2 Webhook de pagamento
A rota de webhook deve:
- validar `asaas-access-token` contra `ASAAS_WEBHOOK_TOKEN` antes de processar o payload
- localizar o pagamento correto
- ser idempotente
- processar `CHECKOUT_PAID` como sucesso definitivo para pagamentos criados via Asaas Checkout quando esse evento for recebido
- processar `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED_IN_CASH` como sucesso definitivo quando o pagamento puder ser localizado por `payment.id`, `payment.checkoutSession`, `checkout.id` ou `externalReference`
- manter `PAYMENT_CREATED` sem confirmacao de pagamento
- ignorar eventos nao suportados com 200
- mapear `PAYMENT_OVERDUE` para falha sem confirmar o atendimento
- atualizar `Pagamento` para `PAGO`
- atualizar `AtendimentoFaxina` para `CONFIRMADO`
- nao tratar `PAYMENT_OVERDUE` como confirmacao de pagamento

### 14.3 Avaliação
A rota de avaliação deve validar:
- se o usuário é o cliente daquele atendimento
- se o atendimento está finalizado
- se a avaliação ainda não existe
- se a nota está entre 1 e 5
