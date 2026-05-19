ALTER TABLE perfis_cliente
    ADD COLUMN asaas_customer_id VARCHAR(120);

CREATE UNIQUE INDEX uk_perfis_cliente_asaas_customer_id
    ON perfis_cliente (asaas_customer_id);
