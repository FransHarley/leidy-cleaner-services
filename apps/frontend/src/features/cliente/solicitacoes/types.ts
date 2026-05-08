import type { Endereco } from '../enderecos/types';

export type TipoServico = 'FAXINA_RESIDENCIAL' | 'FAXINA_COMERCIAL' | 'FAXINA_CONDOMINIO' | 'FAXINA_EVENTO';

export type StatusSolicitacao =
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

export type SolicitacaoFaxina = {
  id: number;
  clienteId: number;
  enderecoId: number;
  regiaoId: number;
  clienteNome?: string | null;
  enderecoResumo?: string | null;
  bairro?: string | null;
  regiaoNome?: string | null;
  dataHoraDesejada: string;
  duracaoEstimadaHoras: number;
  tipoServico: TipoServico;
  observacoes: string | null;
  valorServico: number;
  percentualComissaoAgencia: number;
  valorEstimadoProfissional: number;
  status: StatusSolicitacao;
  criadoEm: string;
  atualizadoEm: string;
};

export type SolicitacaoFaxinaRequest = {
  enderecoId: number;
  regiaoId: number;
  dataHoraDesejada: string;
  duracaoEstimadaHoras: number;
  tipoServico: TipoServico;
  observacoes?: string | null;
  valorServico?: number;
  percentualComissaoAgencia?: number;
  valorEstimadoProfissional?: number;
};

export type TipoRegiaoAtendimento = 'BAIRRO' | 'CIDADE';

export type RegiaoAtendimento = {
  id: number;
  nome: string;
  tipo: TipoRegiaoAtendimento;
  ativo: boolean;
};

export type SolicitacaoContexto = {
  endereco?: Endereco;
  regiao?: RegiaoAtendimento;
};
