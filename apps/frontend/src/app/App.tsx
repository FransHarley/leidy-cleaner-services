import { Navigate, Route, Routes } from 'react-router-dom';

import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { AdminDashboardPage } from '../pages/app/AdminDashboardPage';
import { ClienteDashboardPage } from '../pages/app/ClienteDashboardPage';
import { ClienteEnderecosPage } from '../pages/app/ClienteEnderecosPage';
import { ClientePagamentoPage } from '../pages/app/ClientePagamentoPage';
import { ClientePagamentoRetornoPage } from '../pages/app/ClientePagamentoRetornoPage';
import { ClientePagamentosPage } from '../pages/app/ClientePagamentosPage';
import { ClienteSelecionarProfissionaisPage } from '../pages/app/ClienteSelecionarProfissionaisPage';
import { ClienteSolicitacoesPage } from '../pages/app/ClienteSolicitacoesPage';
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
      <Route path="entrar" element={<LoginPage />} />
      <Route path="cadastro">
        <Route path="cliente" element={<ClientRegistrationPage />} />
        <Route path="profissional" element={<ProfessionalRegistrationPage />} />
        <Route index element={<Navigate to="/cadastro/cliente" replace />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="app" element={<AuthenticatedLayout />}>
          <Route index element={<AppHomeRedirect />} />
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
            </Route>
          </Route>
          <Route element={<RequireProfile profile="PROFISSIONAL" />}>
            <Route path="profissional">
              <Route index element={<ProfissionalDashboardPage />} />
              <Route path="perfil" element={<ProfissionalOnboardingPage />} />
              <Route path="convites" element={<ProfissionalConvitesPage />} />
              <Route path="convites/:id" element={<ProfissionalConviteDetalhePage />} />
            </Route>
          </Route>
          <Route element={<RequireProfile profile="ADMIN" />}>
            <Route path="admin" element={<AdminDashboardPage />} />
          </Route>
        </Route>
      </Route>
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
