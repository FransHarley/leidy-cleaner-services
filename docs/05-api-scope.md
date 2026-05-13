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
Admin ativa ou inativa região.

---

## 6. Profissionais

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
Admin lista profissionais.

### PATCH `/profissionais/{id}/aprovacao`
Admin aprova ou rejeita profissional.

---

## 7. Verificação documental

### POST `/verificacoes/documentos`
Faz upload ou registro de arquivos de verificação.

### GET `/verificacoes/minha`
Usuário vê o status da própria verificação.

### GET `/verificacoes`
Admin lista verificações.

### GET `/verificacoes/{id}`
Admin vê detalhes.

### PATCH `/verificacoes/{id}/analisar`
Admin aprova ou rejeita análise.

---

## 8. Solicitações

### POST `/solicitacoes`
Cliente cria `SolicitacaoFaxina`.

`tipoServico` deve usar um destes valores:
- `FAXINA_RESIDENCIAL`
- `FAXINA_COMERCIAL`
- `FAXINA_CONDOMINIO`
- `FAXINA_EVENTO`

### GET `/solicitacoes/minhas`
Cliente lista suas solicitações.

### GET `/solicitacoes`
Admin lista solicitações em modo somente leitura.

### GET `/solicitacoes/{id}`
Detalhe da solicitação para a cliente dona. Admin também pode consultar em modo somente leitura.

### PATCH `/solicitacoes/{id}/cancelar`
Cancela solicitação.

### GET `/solicitacoes/{id}/profissionais-disponiveis`
Lista profissionais elegíveis.

### POST `/solicitacoes/{id}/selecionados`
Cliente seleciona exatamente 1 profissional.

Observações:
- o contrato pode continuar aceitando `profissionalIds[]`
- o payload deve conter exatamente 1 id
- o backend rejeita zero ou mais de um profissional
- após a seleção válida, a solicitação vai para `AGUARDANDO_PAGAMENTO`

---

## 9. Convites

### GET `/convites/meus`
Profissional lista convites.

### GET `/convites/{id}`
Detalhe do convite.

### POST `/convites/{id}/aceitar`
Profissional aceita convite.

Efeitos esperados:
- cria `AtendimentoFaxina` com status `CONFIRMADO`
- vincula o pagamento pago ao atendimento criado
- marca a solicitação como `ACEITA`

### POST `/convites/{id}/recusar`
Profissional recusa convite.

Efeitos esperados:
- não cria atendimento
- mantém o pagamento como `PAGO`
- pode gerar `CreditoSolicitacao` se o fluxo da solicitação for encerrado por recusa

---

## 10. Atendimentos

### GET `/atendimentos/meus`
Lista atendimentos do usuário autenticado.

### GET `/atendimentos/{id}`
Detalha atendimento relacionado ao usuário autenticado.

### GET `/atendimentos`
Admin lista atendimentos em modo somente leitura.

### POST `/atendimentos/{id}/iniciar`
Profissional atribuída inicia o serviço.

### POST `/atendimentos/{id}/finalizar`
Profissional atribuída finaliza o serviço.

### GET `/atendimentos/{id}/checkpoints`
Lista checkpoints do atendimento.

---

## 11. Pagamentos

### POST `/pagamentos`
Cria um pagamento para a cliente autenticada.

Regras:
- deve receber exatamente um vínculo: `solicitacaoId` ou `atendimentoId`
- não pode receber os dois ao mesmo tempo
- no fluxo pré-pago principal, o pagamento nasce com `solicitacaoId`

### GET `/pagamentos/{id}`
Consulta detalhe do pagamento.

### GET `/pagamentos/atendimento/{atendimentoId}`
Consulta pagamento associado a um atendimento.

### GET `/pagamentos/solicitacao/{solicitacaoId}`
Consulta pagamento associado a uma solicitação.

### POST `/pagamentos/{id}/consultar-status`
Consulta o status no gateway quando aplicável.

Regras:
- pode reconciliar pagamento ligado à solicitação
- pode reconciliar pagamento ligado ao atendimento
- se o gateway informar pagamento confirmado para uma solicitação, deve reutilizar o mesmo fluxo de confirmação do webhook
- para solicitação paga, a reconciliação deve poder mover a solicitação para `PAGA_AGUARDANDO_ACEITE` e criar exatamente 1 convite

### POST `/webhooks/asaas`
Recebe eventos do Asaas.

Regras:
- validar autenticidade do webhook
- suportar confirmação por `payment.id`
- suportar fallback por `externalReference`
- `externalReference` de solicitação usa `solicitacao-{id}`
- `externalReference` legado de atendimento usa `atendimento-{id}`
- webhook confirmado de solicitação cria convite e não cria atendimento
- webhook confirmado de atendimento mantém compatibilidade com o comportamento legado

---

## 12. Créditos de solicitação

### GET `/creditos-solicitacao/meus`
Lista créditos de reposição do cliente autenticado.

### POST `/creditos-solicitacao/{creditoId}/usar-em-solicitacao/{solicitacaoId}`
Usa um `CreditoSolicitacao` em uma nova solicitação equivalente.

Efeitos esperados:
- valida equivalência da nova solicitação
- muda o crédito para `UTILIZADO`
- cria `Pagamento` interno com `gateway = INTERNO` e `metodoPagamento = CREDITO_SOLICITACAO`
- move a solicitação para `PAGA_AGUARDANDO_ACEITE`
- cria exatamente 1 convite
- não chama Asaas

---

## 13. Avaliações

### POST `/avaliacoes`
Cliente cria avaliação da profissional após atendimento finalizado.

### GET `/profissionais/{id}/avaliacoes`
Consulta avaliações públicas ou operacionais conforme escopo da API.

---

## 14. Regras transversais

- frontend nunca confirma pagamento
- backend é a fonte de verdade para elegibilidade, pagamento, convite, atendimento e crédito
- aceite deve continuar transacional
- webhook e reconciliação devem ser idempotentes
