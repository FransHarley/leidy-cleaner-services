# Modelo de Domínio

## 1. Entidades centrais

### 1.1 `Usuario`
Conta base de qualquer perfil.

Campos principais:
- `id`
- `nomeCompleto`
- `email`
- `telefone`
- `senhaHash`
- `tipoUsuario`
- `statusConta`
- `emailVerificado`
- `telefoneVerificado`
- `ultimoLoginEm`
- `criadoEm`
- `atualizadoEm`

### 1.2 `PerfilCliente`
Complemento do usuário cliente.

Campos principais:
- `id`
- `usuarioId`
- `observacoesInternas`
- `criadoEm`
- `atualizadoEm`

### 1.3 `PerfilProfissional`
Complemento do usuário profissional.

Campos principais:
- `id`
- `usuarioId`
- `nomeExibicao`
- `cpf`
- `dataNascimento`
- `descricao`
- `fotoPerfilUrl`
- `experienciaAnos`
- `ativoParaReceberChamados`
- `statusAprovacao`
- `notaMedia`
- `totalAvaliacoes`
- `criadoEm`
- `atualizadoEm`

### 1.4 `Endereco`
Endereço do usuário, especialmente do cliente.

Campos principais:
- `id`
- `usuarioId`
- `cep`
- `logradouro`
- `numero`
- `complemento`
- `bairro`
- `cidade`
- `estado`
- `latitude`
- `longitude`
- `principal`
- `criadoEm`

### 1.5 `RegiaoAtendimento`
Região ou bairro onde a profissional atua.

Campos principais:
- `id`
- `nome`
- `tipo`
- `ativo`

### 1.6 `ProfissionalRegiao`
Relação entre profissional e regiões atendidas.

Campos principais:
- `id`
- `profissionalId`
- `regiaoId`

### 1.7 `DisponibilidadeProfissional`
Disponibilidade semanal da profissional.

Campos principais:
- `id`
- `profissionalId`
- `diaSemana`
- `horaInicio`
- `horaFim`
- `ativo`

### 1.8 `DocumentoVerificacao`
Documentos e status de verificação.

Campos principais:
- `id`
- `usuarioId`
- `tipoDocumento`
- `numeroDocumento`
- `documentoFrenteUrl`
- `documentoVersoUrl`
- `selfieUrl`
- `comprovanteResidenciaUrl`
- `statusVerificacao`
- `observacaoAnalise`
- `analisadoPorUsuarioId`
- `analisadoEm`
- `criadoEm`

### 1.9 `SolicitacaoFaxina`
Pedido criado pelo cliente.

Campos principais:
- `id`
- `clienteId`
- `enderecoId`
- `regiaoId`
- `dataHoraDesejada`
- `duracaoEstimadaHoras`
- `tipoServico`
- `observacoes`
- `valorServico`
- `percentualComissaoAgencia`
- `valorEstimadoProfissional`
- `status`
- `criadoEm`
- `atualizadoEm`

`TipoServico`:
- `FAXINA_RESIDENCIAL`
- `FAXINA_COMERCIAL`
- `FAXINA_CONDOMINIO`
- `FAXINA_EVENTO`

`StatusSolicitacaoFaxina` principais:
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

### 1.10 `SolicitacaoProfissionalSelecionado`
Profissional escolhida pelo cliente para a solicitação.

Campos principais:
- `id`
- `solicitacaoId`
- `profissionalId`
- `ordemEscolha`
- `criadoEm`

Observação:
- no fluxo atual, a solicitação deve ter exatamente 1 registro ativo de seleção
- o backend continua responsável por validar a unicidade operacional dessa escolha

### 1.11 `ConviteProfissional`
Convite operacional enviado para a profissional selecionada.

Campos principais:
- `id`
- `solicitacaoId`
- `profissionalId`
- `status`
- `enviadoEm`
- `visualizadoEm`
- `respondidoEm`
- `expiraEm`

Observação:
- no fluxo pré-pago deve existir exatamente 1 convite por solicitação paga

### 1.12 `AtendimentoFaxina`
Atendimento efetivo criado somente após aceite válido.

Campos principais:
- `id`
- `solicitacaoId`
- `clienteId`
- `profissionalId`
- `status`
- `valorServico`
- `percentualComissaoAgencia`
- `valorEstimadoProfissional`
- `inicioPrevistoEm`
- `inicioRealEm`
- `fimRealEm`
- `criadoEm`
- `atualizadoEm`

Observação:
- o atendimento nasce com status `CONFIRMADO`

### 1.13 `Pagamento`
Cobrança da cliente para a empresa.

Campos principais:
- `id`
- `solicitacaoId`
- `atendimentoId`
- `gateway`
- `gatewayPaymentId`
- `externalReference`
- `metodoPagamento`
- `status`
- `valorBruto`
- `valorTaxaGateway`
- `valorLiquidoRecebido`
- `recebidoEm`
- `payloadResumo`
- `webhookProcessado`
- `criadoEm`
- `atualizadoEm`

Regras:
- `solicitacaoId` pode ser o vínculo inicial do pagamento
- `atendimentoId` permanece nulo até o aceite válido
- após aceite válido, o pagamento pago é associado ao atendimento criado

`GatewayPagamento` relevantes:
- `ASAAS`
- `INTERNO`

`MetodoPagamento` relevantes:
- `PIX`
- `CARTAO`
- `BOLETO`
- `CREDITO_SOLICITACAO`

### 1.14 `CreditoSolicitacao`
Crédito operacional de reposição para uma nova solicitação equivalente.

Campos principais:
- `id`
- `clienteId`
- `solicitacaoOrigemId`
- `pagamentoOrigemId`
- `solicitacaoUsoId`
- `tipoServico`
- `duracaoEstimadaHoras`
- `regiaoId`
- `enderecoOrigemId`
- `valorReferencia`
- `status`
- `criadoEm`
- `atualizadoEm`

`StatusCreditoSolicitacao`:
- `DISPONIVEL`
- `RESERVADO`
- `UTILIZADO`
- `CANCELADO`
- `EXPIRADO`

Observações:
- não é carteira
- não é saldo monetário
- não é desconto
- não é abatimento
- não é pagamento parcial
- não é banco de horas
- não é divisível

Equivalência para uso no MVP:
- mesmo `clienteId`
- mesmo `tipoServico`
- mesma `duracaoEstimadaHoras`
- mesmo `regiaoId`
- o mesmo endereço exato não é obrigatório no MVP

### 1.15 `CheckpointServico`
Registro de início e fim do atendimento.

Campos principais:
- `id`
- `atendimentoId`
- `tipo`
- `registradoPorUsuarioId`
- `latitude`
- `longitude`
- `fotoComprovacaoUrl`
- `observacao`
- `registradoEm`

### 1.16 `AvaliacaoProfissional`
Avaliação feita pelo cliente sobre a profissional.

Campos principais:
- `id`
- `atendimentoId`
- `clienteId`
- `profissionalId`
- `nota`
- `comentario`
- `criadoEm`
- `atualizadoEm`

### 1.17 `OcorrenciaAtendimento`
Problema operacional ou reclamação relacionada ao atendimento.

Campos principais:
- `id`
- `atendimentoId`
- `tipo`
- `descricao`
- `status`
- `criadoPorUsuarioId`
- `criadoEm`
- `atualizadoEm`

---

## 2. Regras de domínio críticas

### Seleção
- cliente deve selecionar exatamente 1 profissional elegível
- backend valida a regra, não apenas o frontend

### Pagamento
- pagamento externo pode nascer ligado à `SolicitacaoFaxina`
- webhook continua sendo a fonte de verdade para confirmação externa
- reconciliação manual segura deve reutilizar o mesmo fluxo interno de confirmação

### Convite
- convite só é criado após pagamento confirmado
- pagamento confirmado não cria atendimento

### Aceite
- aceite válido cria `AtendimentoFaxina` já `CONFIRMADO`
- o pagamento pago passa a apontar para o atendimento criado

### Recusa ou expiração
- não criam atendimento
- geram um `CreditoSolicitacao` exatamente uma vez

### Execução
- somente a profissional atribuída pode iniciar e finalizar

### Avaliação
- somente o cliente avalia
- somente após `AtendimentoFaxina` finalizado
