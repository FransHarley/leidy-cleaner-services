export type StatusConvite = 'ENVIADO' | 'VISUALIZADO' | 'ACEITO' | 'RECUSADO' | 'EXPIRADO' | 'CANCELADO';

export type TipoServico = 'FAXINA_RESIDENCIAL' | 'FAXINA_COMERCIAL' | 'FAXINA_CONDOMINIO' | 'FAXINA_EVENTO';

export type StatusSolicitacaoConvite =
  | 'CRIADA'
  | 'AGUARDANDO_SELECAO'
  | 'CONVITES_ENVIADOS'
  | 'AGUARDANDO_ACEITE'
  | 'ACEITA'
  | 'PAGA'
  | 'EM_EXECUCAO'
  | 'FINALIZADA'
  | 'CANCELADA'
  | 'EXPIRADA';

export type StatusAtendimentoConvite =
  | 'AGUARDANDO_PAGAMENTO'
  | 'CONFIRMADO'
  | 'EM_EXECUCAO'
  | 'FINALIZADO'
  | 'CANCELADO'
  | 'EM_ANALISE';

export type ConviteProfissional = {
  conviteId: number;
  solicitacaoId: number;
  status: StatusConvite;
  enviadoEm: string;
  expiraEm: string;
  dataHoraDesejada: string;
  duracaoEstimadaHoras: number;
  tipoServico: TipoServico;
  profissionalNome?: string | null;
  profissionalNotaMedia?: number | null;
  profissionalTotalAvaliacoes?: number | null;
  bairro: string;
  cidade: string;
  estado: string;
  valorEstimadoProfissional: number;
};

export type ConviteResposta = {
  conviteId: number;
  conviteStatus: StatusConvite;
  solicitacaoId: number;
  solicitacaoStatus: StatusSolicitacaoConvite;
  atendimentoId: number | null;
  atendimentoStatus: StatusAtendimentoConvite | null;
};
