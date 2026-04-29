import { Navigate, Route, Routes } from 'react-router-dom';

import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { AdminAtendimentoDetalhePage } from '../pages/app/AdminAtendimentoDetalhePage';
import { AdminAtendimentosPage } from '../pages/app/AdminAtendimentosPage';
import { AdminDashboardPage } from '../pages/app/AdminDashboardPage';
import { AdminOcorrenciaDetalhePage } from '../pages/app/AdminOcorrenciaDetalhePage';
import { AdminOcorrenciasPage } from '../pages/app/AdminOcorrenciasPage';
import { AdminPagamentoDetalhePage } from '../pages/app/AdminPagamentoDetalhePage';
import { AdminPagamentosPage } from '../pages/app/AdminPagamentosPage';
import { AdminProfissionaisPage } from '../pages/app/AdminProfissionaisPage';
import { AdminSolicitacaoDetalhePage } from '../pages/app/AdminSolicitacaoDetalhePage';
import { AdminSolicitacoesPage } from '../pages/app/AdminSolicitacoesPage';
import { AdminUsuarioDetalhePage } from '../pages/app/AdminUsuarioDetalhePage';
import { AdminUsuariosPage } from '../pages/app/AdminUsuariosPage';
import { AdminVerificacaoDetalhePage } from '../pages/app/AdminVerificacaoDetalhePage';
import { AdminVerificacoesPage } from '../pages/app/AdminVerificacoesPage';
import { ClienteAtendimentoDetalhePage } from '../pages/app/ClienteAtendimentoDetalhePage';
import { ClienteAtendimentosPage } from '../pages/app/ClienteAtendimentosPage';
import { ClienteDashboardPage } from '../pages/app/ClienteDashboardPage';
import { ClienteEnderecosPage } from '../pages/app/ClienteEnderecosPage';
import { ClientePagamentoPage } from '../pages/app/ClientePagamentoPage';
import { ClientePagamentoRetornoPage } from '../pages/app/ClientePagamentoRetornoPage';
import { ClientePagamentosPage } from '../pages/app/ClientePagamentosPage';
import { ClienteSelecionarProfissionaisPage } from '../pages/app/ClienteSelecionarProfissionaisPage';
import { ClienteSolicitacoesPage } from '../pages/app/ClienteSolicitacoesPage';
import { NovaOcorrenciaPage } from '../pages/app/NovaOcorrenciaPage';
import { OcorrenciaDetalhePage } from '../pages/app/OcorrenciaDetalhePage';
import { OcorrenciasPage } from '../pages/app/OcorrenciasPage';
import { ProfissionalAtendimentoDetalhePage } from '../pages/app/ProfissionalAtendimentoDetalhePage';
import { ProfissionalAtendimentosPage } from '../pages/app/ProfissionalAtendimentosPage';
import { ProfissionalConviteDetalhePage } from '../pages/app/ProfissionalConviteDetalhePage';
import { ProfissionalConvitesPage } from '../pages/app/ProfissionalConvitesPage';
import { ProfissionalDashboardPage } from '../pages/app/ProfissionalDashboardPage';
import { ProfissionalOnboardingPage } from '../pages/app/ProfissionalOnboardingPage';
import { ClientRegistrationPage } from '../pages/public/ClientRegistrationPage';
import { HomePage } from '../pages/public/HomePage';
import { LoginPage } from '../pages/public/LoginPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';
import { ProfessionalRegistrationPage } from '../pages/public/ProfessionalRegistrationPage';
import { AppHomeRedirect } from '../routes/AppHomeRedirect';
import { RequireAuth } from '../routes/RequireAuth';
import { RequireProfile } from '../routes/RequireProfile';

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
      </Route>
      <Route path="login" element={<Navigate to="/entrar" replace />} />
      <Route path="entrar" element={<LoginPage />} />
      <Route path="cadastro">
        <Route path="cliente" element={<ClientRegistrationPage />} />
        <Route path="profissional" element={<ProfessionalRegistrationPage />} />
        <Route index element={<Navigate to="/cadastro/cliente" replace />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="app" element={<AuthenticatedLayout />}>
          <Route index element={<AppHomeRedirect />} />
          <Route path="ocorrencias" element={<OcorrenciasPage />} />
          <Route path="ocorrencias/nova" element={<NovaOcorrenciaPage />} />
          <Route path="ocorrencias/:id" element={<OcorrenciaDetalhePage />} />
          <Route element={<RequireProfile profile="CLIENTE" />}>
            <Route path="cliente">
              <Route index element={<ClienteDashboardPage />} />
              <Route path="enderecos" element={<ClienteEnderecosPage />} />
              <Route path="solicitacoes" element={<ClienteSolicitacoesPage />} />
              <Route path="solicitacoes/:id/profissionais" element={<ClienteSelecionarProfissionaisPage />} />
              <Route path="pagamentos" element={<ClientePagamentosPage />} />
              <Route path="pagamentos/retorno" element={<ClientePagamentoRetornoPage />} />
              <Route path="pagamentos/atendimento/:atendimentoId" element={<ClientePagamentoPage />} />
              <Route path="pagamentos/:pagamentoId" element={<ClientePagamentoPage />} />
              <Route path="atendimentos" element={<ClienteAtendimentosPage />} />
              <Route path="atendimentos/:id" element={<ClienteAtendimentoDetalhePage />} />
            </Route>
          </Route>
          <Route element={<RequireProfile profile="PROFISSIONAL" />}>
            <Route path="profissional">
              <Route index element={<ProfissionalDashboardPage />} />
              <Route path="perfil" element={<ProfissionalOnboardingPage />} />
              <Route path="convites" element={<ProfissionalConvitesPage />} />
              <Route path="convites/:id" element={<ProfissionalConviteDetalhePage />} />
              <Route path="atendimentos" element={<ProfissionalAtendimentosPage />} />
              <Route path="atendimentos/:id" element={<ProfissionalAtendimentoDetalhePage />} />
            </Route>
          </Route>
          <Route element={<RequireProfile profile="ADMIN" />}>
            <Route path="admin">
              <Route index element={<AdminDashboardPage />} />
              <Route path="verificacoes" element={<AdminVerificacoesPage />} />
              <Route path="verificacoes/:id" element={<AdminVerificacaoDetalhePage />} />
              <Route path="profissionais" element={<AdminProfissionaisPage />} />
              <Route path="ocorrencias" element={<AdminOcorrenciasPage />} />
              <Route path="ocorrencias/:id" element={<AdminOcorrenciaDetalhePage />} />
              <Route path="atendimentos" element={<AdminAtendimentosPage />} />
              <Route path="atendimentos/:id" element={<AdminAtendimentoDetalhePage />} />
              <Route path="pagamentos" element={<AdminPagamentosPage />} />
              <Route path="pagamentos/:id" element={<AdminPagamentoDetalhePage />} />
              <Route path="solicitacoes" element={<AdminSolicitacoesPage />} />
              <Route path="solicitacoes/:id" element={<AdminSolicitacaoDetalhePage />} />
              <Route path="usuarios" element={<AdminUsuariosPage />} />
              <Route path="usuarios/:id" element={<AdminUsuarioDetalhePage />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
