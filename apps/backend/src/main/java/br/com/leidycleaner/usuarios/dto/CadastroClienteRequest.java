package br.com.leidycleaner.usuarios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CadastroClienteRequest(
        @NotBlank(message = "nomeCompleto e obrigatorio")
        @Size(max = 160, message = "nomeCompleto deve ter no maximo 160 caracteres")
        String nomeCompleto,

        @NotBlank(message = "email e obrigatorio")
        @Email(message = "email deve ser valido")
        @Size(max = 255, message = "email deve ter no maximo 255 caracteres")
        String email,

        @NotBlank(message = "telefone e obrigatorio")
        @Size(max = 30, message = "telefone deve ter no maximo 30 caracteres")
        String telefone,

        @NotBlank(message = "cpf e obrigatorio")
        @Size(max = 14, message = "cpf deve ter no maximo 14 caracteres")
        String cpf,

        @NotBlank(message = "senha e obrigatoria")
        @Size(min = 8, max = 120, message = "senha deve ter entre 8 e 120 caracteres")
        String senha,

        String observacoesInternas,

        @NotNull(message = "aceitarTermosUso e obrigatorio")
        @AssertTrue(message = "Termos de Uso devem ser aceitos")
        Boolean aceitarTermosUso,

        @NotNull(message = "aceitarPoliticaPrivacidade e obrigatorio")
        @AssertTrue(message = "Politica de Privacidade e Tratamento de Dados deve ser aceita")
        Boolean aceitarPoliticaPrivacidade,

        @NotNull(message = "aceitarCodigoConduta e obrigatorio")
        @AssertTrue(message = "Codigo de Conduta e Seguranca deve ser aceito")
        Boolean aceitarCodigoConduta
) {
}
