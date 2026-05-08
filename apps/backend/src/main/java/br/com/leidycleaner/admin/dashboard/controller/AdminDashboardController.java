package br.com.leidycleaner.admin.dashboard.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.leidycleaner.admin.dashboard.dto.AdminDashboardIndicadoresDto;
import br.com.leidycleaner.admin.dashboard.service.AdminDashboardService;
import br.com.leidycleaner.core.ApiPaths;
import br.com.leidycleaner.core.dto.ApiResponse;

@RestController
@RequestMapping(ApiPaths.API_V1 + "/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping("/indicadores")
    public ApiResponse<AdminDashboardIndicadoresDto> buscarIndicadores() {
        return ApiResponse.success(adminDashboardService.buscarIndicadores());
    }
}
