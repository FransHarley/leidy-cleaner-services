package br.com.leidycleaner.admin.dashboard.dto;

public record AdminDashboardIndicadoresDto(
        long verificacoesPendentes,
        long profissionaisPendentes,
        long ocorrenciasAbertas,
        long ocorrenciasEmAnalise,
        long pagamentosPendentes,
        long pagamentosAguardandoConfirmacao,
        long pagamentosFalhos,
        long atendimentosEmAnalise,
        long solicitacoesAbertas,
        long usuariosTotal
) {
}
