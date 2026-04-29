package br.com.leidycleaner.usuarios.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.leidycleaner.core.ApiPaths;
import br.com.leidycleaner.core.dto.ApiResponse;
import br.com.leidycleaner.usuarios.dto.AdminUsuarioResponse;
import br.com.leidycleaner.usuarios.dto.AlterarStatusUsuarioRequest;
import br.com.leidycleaner.usuarios.dto.CadastroClienteRequest;
import br.com.leidycleaner.usuarios.dto.CadastroProfissionalRequest;
import br.com.leidycleaner.usuarios.dto.CadastroUsuarioResponse;
import br.com.leidycleaner.usuarios.dto.UsuarioResumoDto;
import br.com.leidycleaner.usuarios.entity.StatusConta;
import br.com.leidycleaner.usuarios.entity.TipoUsuario;
import br.com.leidycleaner.usuarios.service.CadastroUsuarioService;
import br.com.leidycleaner.usuarios.service.UsuarioService;
import jakarta.validation.Valid;

@RestController
@RequestMapping(ApiPaths.API_V1 + "/usuarios")
public class UsuarioController {

    private final CadastroUsuarioService cadastroUsuarioService;
    private final UsuarioService usuarioService;

    public UsuarioController(CadastroUsuarioService cadastroUsuarioService, UsuarioService usuarioService) {
        this.cadastroUsuarioService = cadastroUsuarioService;
        this.usuarioService = usuarioService;
    }

    @PostMapping("/clientes")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CadastroUsuarioResponse> cadastrarCliente(
            @Valid @RequestBody CadastroClienteRequest request
    ) {
        return ApiResponse.success(cadastroUsuarioService.cadastrarCliente(request));
    }

    @PostMapping("/profissionais")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CadastroUsuarioResponse> cadastrarProfissional(
            @Valid @RequestBody CadastroProfissionalRequest request
    ) {
        return ApiResponse.success(cadastroUsuarioService.cadastrarProfissional(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<AdminUsuarioResponse>> listarAdmin(
            @RequestParam(required = false) TipoUsuario tipoUsuario,
            @RequestParam(required = false) StatusConta statusConta,
            @RequestParam(required = false) String search
    ) {
        return ApiResponse.success(usuarioService.listarAdmin(tipoUsuario, statusConta, search));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AdminUsuarioResponse> buscarAdmin(@PathVariable Long id) {
        return ApiResponse.success(usuarioService.buscarAdmin(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UsuarioResumoDto> alterarStatus(
            @PathVariable Long id,
            @Valid @RequestBody AlterarStatusUsuarioRequest request
    ) {
        return ApiResponse.success(usuarioService.alterarStatus(id, request));
    }
}
