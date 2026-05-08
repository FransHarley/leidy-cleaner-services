export type StatusPagamento = 'PENDENTE' | 'AGUARDANDO_CONFIRMACAO' | 'PAGO' | 'FALHOU' | 'CANCELADO' | 'ESTORNADO';

export type MetodoPagamento = 'PIX' | 'BOLETO' | 'CARTAO_CREDITO';

export type GatewayPagamento = 'ASAAS';

export type StatusAtendimentoPagamento =
  | 'AGUARDANDO_PAGAMENTO'
  | 'CONFIRMADO'
  | 'EM_EXECUCAO'
  | 'FINALIZADO'
  | 'CANCELADO'
  | 'EM_ANALISE';

export type TipoServicoPagamento =
  | 'FAXINA_RESIDENCIAL'
  | 'FAXINA_COMERCIAL'
  | 'FAXINA_CONDOMINIO'
  | 'FAXINA_EVENTO';

export type AtendimentoPagamento = {
  id: number;
  solicitacaoId: number;
  clienteId: number;
  profissionalId: number;
  clienteNome?: string | null;
  profissionalNome?: string | null;
  enderecoResumo?: string | null;
  bairro?: string | null;
  regiaoNome?: string | null;
  status: StatusAtendimentoPagamento;
  tipoServico: TipoServicoPagamento;
  valorServico: number;
  valorEstimadoProfissional: number;
  inicioPrevistoEm: string;
  inicioRealEm: string | null;
  fimRealEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type CheckoutPagamentoRequest = {
  atendimentoId: number;
  metodoPagamento: MetodoPagamento;
};

export type CheckoutPagamento = {
  atendimentoId: number;
  checkoutUrl: string;
  paymentUrl?: string | null;
  valor: number;
  descricao: string;
  metodoPagamento: MetodoPagamento;
  status: StatusPagamento;
};

export type Pagamento = {
  id: number;
  atendimentoId: number;
  gateway: GatewayPagamento;
  gatewayPaymentId: string;
  metodoPagamento: MetodoPagamento;
  status: StatusPagamento;
  valorBruto: number;
  valorTaxaGateway: number | null;
  valorLiquidoRecebido: number | null;
  recebidoEm: string | null;
  urlPagamento: string | null;
  pixCopiaECola: string | null;
  webhookProcessado: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

export type PixQrCodePagamento = {
  encodedImage: string | null;
  payload: string | null;
  expirationDate: string | null;
};
