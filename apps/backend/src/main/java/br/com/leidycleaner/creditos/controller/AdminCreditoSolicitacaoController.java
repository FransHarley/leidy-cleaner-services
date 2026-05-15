package br.com.leidycleaner.creditos.controller;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.leidycleaner.core.ApiPaths;
import br.com.leidycleaner.core.dto.ApiResponse;
import br.com.leidycleaner.creditos.dto.AdminCreditoSolicitacaoDetalheDto;
import br.com.leidycleaner.creditos.dto.AdminCreditoSolicitacaoListItemDto;
import br.com.leidycleaner.creditos.entity.StatusCreditoSolicitacao;
import br.com.leidycleaner.creditos.service.CreditoSolicitacaoService;
import br.com.leidycleaner.solicitacoes.entity.TipoServico;

@RestController
@RequestMapping(ApiPaths.API_V1 + "/admin/creditos-solicitacao")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCreditoSolicitacaoController {

    private final CreditoSolicitacaoService creditoSolicitacaoService;

    public AdminCreditoSolicitacaoController(CreditoSolicitacaoService creditoSolicitacaoService) {
        this.creditoSolicitacaoService = creditoSolicitacaoService;
    }

    @GetMapping
    public ApiResponse<List<AdminCreditoSolicitacaoListItemDto>> listar(
            @RequestParam(required = false) StatusCreditoSolicitacao status,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long solicitacaoOrigemId,
            @RequestParam(required = false) Long solicitacaoUsoId,
            @RequestParam(required = false) Long pagamentoOrigemId,
            @RequestParam(required = false) TipoServico tipoServico,
            @RequestParam(required = false) Long regiaoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime criadoDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime criadoAte
    ) {
        return ApiResponse.success(creditoSolicitacaoService.listarAdmin(
                status,
                clienteId,
                solicitacaoOrigemId,
                solicitacaoUsoId,
                pagamentoOrigemId,
                tipoServico,
                regiaoId,
                criadoDe,
                criadoAte
        ));
    }

    @GetMapping("/{id}")
    public ApiResponse<AdminCreditoSolicitacaoDetalheDto> buscarPorId(@PathVariable Long id) {
        return ApiResponse.success(creditoSolicitacaoService.buscarAdminPorId(id));
    }
}
