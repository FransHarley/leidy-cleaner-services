ALTER TABLE solicitacoes_faxina
    DROP CONSTRAINT ck_solicitacoes_faxina_status;

ALTER TABLE solicitacoes_faxina
    ADD CONSTRAINT ck_solicitacoes_faxina_status CHECK (status IN (
        'CRIADA',
        'AGUARDANDO_SELECAO',
        'AGUARDANDO_PAGAMENTO',
        'CONVITES_ENVIADOS',
        'AGUARDANDO_ACEITE',
        'ACEITA',
        'PAGA',
        'EM_EXECUCAO',
        'FINALIZADA',
        'CANCELADA',
        'EXPIRADA'
    ));

DELETE FROM solicitacao_profissionais_selecionados
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY solicitacao_id
                ORDER BY ordem_escolha ASC, criado_em ASC, id ASC
            ) AS rn
        FROM solicitacao_profissionais_selecionados
    ) ranked
    WHERE rn > 1
);

UPDATE solicitacao_profissionais_selecionados
SET ordem_escolha = 1
WHERE ordem_escolha <> 1;

ALTER TABLE solicitacao_profissionais_selecionados
    DROP CONSTRAINT ck_solicitacao_profissionais_selecionados_ordem;

ALTER TABLE solicitacao_profissionais_selecionados
    ADD CONSTRAINT ck_solicitacao_profissionais_selecionados_ordem CHECK (ordem_escolha = 1);

ALTER TABLE solicitacao_profissionais_selecionados
    ADD CONSTRAINT uk_solicitacao_profissionais_selecionados_solicitacao_unica UNIQUE (solicitacao_id);
