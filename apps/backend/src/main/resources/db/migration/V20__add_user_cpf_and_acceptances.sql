ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS cpf VARCHAR(11);

UPDATE usuarios usuario
SET cpf = regexp_replace(perfil.cpf, '\D', '', 'g')
FROM perfis_profissional perfil
WHERE perfil.usuario_id = usuario.id
  AND usuario.cpf IS NULL;

ALTER TABLE usuarios
    ADD CONSTRAINT uk_usuarios_cpf UNIQUE (cpf);

ALTER TABLE usuarios
    ADD CONSTRAINT ck_usuarios_cpf_digits
    CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$');

CREATE TABLE usuario_aceites (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    tipo_documento VARCHAR(40) NOT NULL,
    versao VARCHAR(40) NOT NULL,
    aceito_em TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_origem VARCHAR(80),
    user_agent VARCHAR(500),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_aceites_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    CONSTRAINT uk_usuario_aceites_usuario_tipo_versao UNIQUE (usuario_id, tipo_documento, versao),
    CONSTRAINT ck_usuario_aceites_tipo_documento CHECK (tipo_documento IN ('TERMOS_USO', 'POLITICA_PRIVACIDADE', 'CODIGO_CONDUTA'))
);

CREATE INDEX idx_usuario_aceites_usuario_id ON usuario_aceites (usuario_id);
CREATE INDEX idx_usuario_aceites_tipo_documento ON usuario_aceites (tipo_documento);
