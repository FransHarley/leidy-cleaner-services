export type StatusAprovacaoProfissional = 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REJEITADO';

export type DiaSemana = 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO' | 'DOMINGO';

export type StatusVerificacao = 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REJEITADO';

export type PerfilProfissional = {
  id: number;
  usuarioId: number;
  nomeExibicao: string;
  cpf: string;
  dataNascimento: string;
  descricao: string | null;
  fotoPerfilUrl: string | null;
  experienciaAnos: number;
  ativoParaReceberChamados: boolean;
  statusAprovacao: StatusAprovacaoProfissional;
  notaMedia: number;
  totalAvaliacoes: number;
  criadoEm: string;
  atualizadoEm: string;
};

export type AtualizarPerfilProfissionalRequest = {
  nomeExibicao?: string | null;
  descricao?: string | null;
  fotoPerfilUrl?: string | null;
  experienciaAnos?: number | null;
  ativoParaReceberChamados?: boolean | null;
};

export type TipoRegiaoAtendimento = 'BAIRRO' | 'CIDADE';

export type RegiaoAtendimento = {
  id: number;
  nome: string;
  tipo: TipoRegiaoAtendimento;
  ativo: boolean;
};

export type DefinirRegioesProfissionalRequest = {
  regiaoIds: number[];
};

export type DisponibilidadeProfissional = {
  id: number;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
  ativo: boolean;
};

export type DisponibilidadeProfissionalRequest = {
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
  ativo?: boolean | null;
};

export type DocumentoVerificacao = {
  id: number;
  usuarioId: number;
  tipoDocumento: string;
  numeroDocumento: string;
  documentoFrenteUrl: string | null;
  documentoVersoUrl: string | null;
  selfieUrl: string | null;
  comprovanteResidenciaUrl: string | null;
  statusVerificacao: StatusVerificacao;
  observacaoAnalise: string | null;
  analisadoPorUsuarioId: number | null;
  analisadoEm: string | null;
  criadoEm: string;
};

export type DocumentoVerificacaoRequest = {
  tipoDocumento: string;
  numeroDocumento: string;
  documentoFrenteUrl?: string | null;
  documentoVersoUrl?: string | null;
  selfieUrl?: string | null;
  comprovanteResidenciaUrl?: string | null;
};
