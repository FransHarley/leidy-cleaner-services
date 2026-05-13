CREATE TABLE creditos_solicitacao (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    solicitacao_origem_id BIGINT NOT NULL,
    pagamento_origem_id BIGINT NOT NULL,
    solicitacao_uso_id BIGINT,
    tipo_servico VARCHAR(80) NOT NULL,
    duracao_estimada_horas INTEGER NOT NULL,
    regiao_id BIGINT NOT NULL,
    endereco_origem_id BIGINT,
    valor_referencia NUMERIC(12, 2),
    status VARCHAR(40) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT now(),
    reservado_em TIMESTAMP,
    utilizado_em TIMESTAMP,
    cancelado_em TIMESTAMP,
    observacao TEXT,
    CONSTRAINT fk_creditos_solicitacao_cliente
        FOREIGN KEY (cliente_id) REFERENCES perfis_cliente (id),
    CONSTRAINT fk_creditos_solicitacao_solicitacao_origem
        FOREIGN KEY (solicitacao_origem_id) REFERENCES solicitacoes_faxina (id),
    CONSTRAINT fk_creditos_solicitacao_pagamento_origem
        FOREIGN KEY (pagamento_origem_id) REFERENCES pagamentos (id),
    CONSTRAINT fk_creditos_solicitacao_solicitacao_uso
        FOREIGN KEY (solicitacao_uso_id) REFERENCES solicitacoes_faxina (id),
    CONSTRAINT fk_creditos_solicitacao_regiao
        FOREIGN KEY (regiao_id) REFERENCES regioes_atendimento (id),
    CONSTRAINT fk_creditos_solicitacao_endereco_origem
        FOREIGN KEY (endereco_origem_id) REFERENCES enderecos (id),
    CONSTRAINT ck_creditos_solicitacao_status CHECK (
        status IN (
            'DISPONIVEL',
            'RESERVADO',
            'UTILIZADO',
            'CANCELADO',
            'EXPIRADO'
        )
    )
);

CREATE UNIQUE INDEX uk_creditos_solicitacao_pagamento_origem_id
    ON creditos_solicitacao (pagamento_origem_id);

CREATE INDEX idx_creditos_solicitacao_cliente_status
    ON creditos_solicitacao (cliente_id, status);

CREATE INDEX idx_creditos_solicitacao_solicitacao_origem_id
    ON creditos_solicitacao (solicitacao_origem_id);

CREATE INDEX idx_creditos_solicitacao_solicitacao_uso_id
    ON creditos_solicitacao (solicitacao_uso_id);

INSERT INTO creditos_solicitacao (
    cliente_id,
    solicitacao_origem_id,
    pagamento_origem_id,
    solicitacao_uso_id,
    tipo_servico,
    duracao_estimada_horas,
    regiao_id,
    endereco_origem_id,
    valor_referencia,
    status,
    criado_em,
    observacao
)
SELECT
    movimento.cliente_id,
    movimento.solicitacao_origem_id,
    movimento.pagamento_origem_id,
    movimento.solicitacao_uso_id,
    solicitacao.tipo_servico,
    solicitacao.duracao_estimada_horas,
    solicitacao.regiao_id,
    solicitacao.endereco_id,
    solicitacao.valor_servico,
    'DISPONIVEL',
    movimento.criado_em,
    movimento.observacao
FROM creditos_cliente_movimentos movimento
JOIN solicitacoes_faxina solicitacao
    ON solicitacao.id = movimento.solicitacao_origem_id
LEFT JOIN creditos_solicitacao credito_existente
    ON credito_existente.pagamento_origem_id = movimento.pagamento_origem_id
WHERE movimento.tipo_movimento = 'CREDITO_GERADO_SEM_ACEITE'
  AND movimento.pagamento_origem_id IS NOT NULL
  AND movimento.solicitacao_origem_id IS NOT NULL
  AND credito_existente.id IS NULL;
