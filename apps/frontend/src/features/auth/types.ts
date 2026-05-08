export type TipoUsuario = 'ADMIN' | 'CLIENTE' | 'PROFISSIONAL';

export type StatusConta = 'ATIVA' | 'INATIVA' | 'BLOQUEADA' | 'PENDENTE_VERIFICACAO';

export type UsuarioAutenticado = {
  id: number;
  nomeCompleto: string;
  email: string;
  tipoUsuario: TipoUsuario;
  statusConta: StatusConta;
  roles: string[];
};

export type AuthLoginRequest = {
  email: string;
  senha: string;
};

export type AuthLoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  usuario: UsuarioAutenticado;
};

export type CadastroClienteRequest = {
  nomeCompleto: string;
  email: string;
  telefone: string;
  cpf: string;
  senha: string;
  observacoesInternas?: string;
  aceitarTermosUso: boolean;
  aceitarPoliticaPrivacidade: boolean;
  aceitarCodigoConduta: boolean;
};

export type CadastroProfissionalRequest = {
  nomeCompleto: string;
  email: string;
  telefone: string;
  senha: string;
  nomeExibicao: string;
  cpf: string;
  dataNascimento: string;
  descricao?: string;
  fotoPerfilUrl?: string;
  experienciaAnos?: number;
  aceitarTermosUso: boolean;
  aceitarPoliticaPrivacidade: boolean;
  aceitarCodigoConduta: boolean;
};

export type CadastroProfissionalCompletoRequest = CadastroProfissionalRequest & {
  documento: {
    tipoDocumento: string;
    numeroDocumento: string;
    documentoFrenteUrl?: string | null;
    documentoVersoUrl?: string | null;
    selfieUrl?: string | null;
    comprovanteResidenciaUrl?: string | null;
  };
  regiaoIds: number[];
  disponibilidades: Array<{
    diaSemana: string;
    horaInicio: string;
    horaFim: string;
    ativo?: boolean | null;
  }>;
};

export type CadastroUsuarioResponse = {
  usuario: UsuarioAutenticado;
  perfilId: number;
};
