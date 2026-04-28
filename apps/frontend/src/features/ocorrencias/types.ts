export const tipoOcorrenciaValues = ['ATRASO', 'AUSENCIA', 'CONDUTA', 'QUALIDADE_SERVICO', 'PAGAMENTO', 'OUTRO'] as const;

export const statusOcorrenciaValues = ['ABERTA', 'EM_ANALISE', 'RESOLVIDA', 'CANCELADA'] as const;

export type TipoOcorrencia = (typeof tipoOcorrenciaValues)[number];

export type StatusOcorrencia = (typeof statusOcorrenciaValues)[number];

export type OcorrenciaAtendimento = {
  id: number;
  atendimentoId: number;
  abertoPorUsuarioId: number;
  tipo: TipoOcorrencia;
  descricao: string;
  status: StatusOcorrencia;
  resolvidoEm: string | null;
  resolvidoPorUsuarioId: number | null;
  criadoEm: string;
};

export type CriarOcorrenciaRequest = {
  atendimentoId: number;
  tipo: TipoOcorrencia;
  descricao: string;
};

export type AtualizarStatusOcorrenciaRequest = {
  status: StatusOcorrencia;
};
