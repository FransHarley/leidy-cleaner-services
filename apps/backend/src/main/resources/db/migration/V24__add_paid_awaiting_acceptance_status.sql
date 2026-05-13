ALTER TABLE solicitacoes_faxina
    DROP CONSTRAINT ck_solicitacoes_faxina_status;

ALTER TABLE solicitacoes_faxina
    ADD CONSTRAINT ck_solicitacoes_faxina_status CHECK (status IN (
        'CRIADA',
        'AGUARDANDO_SELECAO',
        'AGUARDANDO_PAGAMENTO',
        'PAGA_AGUARDANDO_ACEITE',
        'CONVITES_ENVIADOS',
        'AGUARDANDO_ACEITE',
        'ACEITA',
        'PAGA',
        'EM_EXECUCAO',
        'FINALIZADA',
        'CANCELADA',
        'EXPIRADA'
    ));
