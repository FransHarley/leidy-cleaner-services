export type TipoUsuario = 'ADMIN' | 'CLIENTE' | 'PROFISSIONAL';

export type StatusConta = 'ATIVA' | 'INATIVA' | 'BLOQUEADA' | 'PENDENTE_VERIFICACAO';

export type AdminUsuario = {
  usuarioId: number;
  perfilClienteId: number | null;
  perfilProfissionalId: number | null;
  nomeCompleto: string;
  email: string;
  telefone: string;
  tipoUsuario: TipoUsuario;
  statusConta: StatusConta;
  emailVerificado: boolean;
  telefoneVerificado: boolean;
  ultimoLoginEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type ListarUsuariosAdminParams = {
  tipoUsuario?: TipoUsuario;
  statusConta?: StatusConta;
  search?: string;
};
