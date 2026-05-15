package br.com.leidycleaner.convites.controller;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.leidycleaner.convites.dto.AdminConviteMonitoramentoDto;
import br.com.leidycleaner.convites.entity.StatusConvite;
import br.com.leidycleaner.convites.service.ConviteProfissionalService;
import br.com.leidycleaner.core.ApiPaths;
import br.com.leidycleaner.core.dto.ApiResponse;

@RestController
@RequestMapping(ApiPaths.API_V1 + "/admin/convites")
@PreAuthorize("hasRole('ADMIN')")
public class AdminConviteMonitoramentoController {

    private final ConviteProfissionalService conviteProfissionalService;

    public AdminConviteMonitoramentoController(ConviteProfissionalService conviteProfissionalService) {
        this.conviteProfissionalService = conviteProfissionalService;
    }

    @GetMapping("/monitoramento")
    public ApiResponse<List<AdminConviteMonitoramentoDto>> listarMonitoramento(
            @RequestParam(required = false) StatusConvite status,
            @RequestParam(required = false) Long solicitacaoId,
            @RequestParam(required = false) Long profissionalId,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime expiraAntesDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime expiraDepoisDe,
            @RequestParam(required = false, defaultValue = "false") boolean somenteVencidos
    ) {
        return ApiResponse.success(conviteProfissionalService.listarAdminMonitoramento(
                status,
                solicitacaoId,
                profissionalId,
                clienteId,
                expiraAntesDe,
                expiraDepoisDe,
                somenteVencidos
        ));
    }
}
