package br.com.leidycleaner.usuarios.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import br.com.leidycleaner.profissionais.dto.DisponibilidadeProfissionalRequest;
import br.com.leidycleaner.verificacao.dto.DocumentoVerificacaoRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CadastroProfissionalCompletoRequest(
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

        @NotBlank(message = "senha e obrigatoria")
        @Size(min = 8, max = 120, message = "senha deve ter entre 8 e 120 caracteres")
        String senha,

        @NotBlank(message = "nomeExibicao e obrigatorio")
        @Size(max = 160, message = "nomeExibicao deve ter no maximo 160 caracteres")
        String nomeExibicao,

        @NotBlank(message = "cpf e obrigatorio")
        @Size(max = 14, message = "cpf deve ter no maximo 14 caracteres")
        String cpf,

        @NotNull(message = "dataNascimento e obrigatoria")
        @Past(message = "dataNascimento deve estar no passado")
        LocalDate dataNascimento,

        String descricao,

        @Size(max = 500, message = "fotoPerfilUrl deve ter no maximo 500 caracteres")
        String fotoPerfilUrl,

        @PositiveOrZero(message = "experienciaAnos deve ser maior ou igual a zero")
        Integer experienciaAnos,

        @NotNull(message = "documento e obrigatorio")
        @Valid
        DocumentoVerificacaoRequest documento,

        @NotEmpty(message = "regiaoIds deve conter ao menos uma regiao")
        Set<@NotNull(message = "regiaoIds nao pode conter valores nulos") Long> regiaoIds,

        @NotEmpty(message = "disponibilidades deve conter ao menos um horario")
        List<@Valid DisponibilidadeProfissionalRequest> disponibilidades,

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
