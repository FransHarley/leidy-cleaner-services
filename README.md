# Leidy Cleaner Services

Monorepo da plataforma operacional de intermediacao de servicos de limpeza **Leidy Cleaner Services**.

O escopo de servicos contempla as categorias `FAXINA_RESIDENCIAL`, `FAXINA_COMERCIAL`, `FAXINA_CONDOMINIO` e `FAXINA_EVENTO`.

O produto segue as decisoes do `AGENTS.md` e de `docs/spec.md`: frontend React, backend Spring Boot, PostgreSQL, pagamento via Asaas com fluxo principal pre-pago na `SolicitacaoFaxina` e confirmacao por webhook ou reconciliacao backend idempotente.

## Estrutura

```text
.
├── apps/
│   ├── backend/
│   └── frontend/
├── docs/
├── infra/
├── docker-compose.yml
└── .env.example
```

## Requisitos locais

- Java 21
- Node.js 20+
- npm 10+
- Docker e Docker Compose

## Configuracao inicial

Crie seu arquivo local de ambiente a partir do exemplo:

```bash
cp .env.example .env
```

## Banco de dados

Suba o PostgreSQL local:

```bash
docker compose up -d postgres
```

Confira o status:

```bash
docker compose ps
```

Para parar:

```bash
docker compose down
```

## Backend

Execute a API Spring Boot:

```bash
cd apps/backend
./mvnw spring-boot:run
```

Por padrao, a API sobe em:

```text
http://localhost:8080
```

O prefixo previsto para os endpoints de negocio e:

```text
/api/v1
```

## Frontend

Instale dependencias e suba o Vite:

```bash
cd apps/frontend
npm install
npm run dev
```

Por padrao, o frontend sobe em:

```text
http://localhost:5173
```

## Pagamento Asaas

Fluxo principal vigente:

1. a cliente cria a `SolicitacaoFaxina`
2. seleciona exatamente 1 profissional elegivel
3. a solicitacao vai para `AGUARDANDO_PAGAMENTO`
4. o backend cria um `Pagamento` vinculado a `SolicitacaoFaxina`
5. webhook do Asaas ou `POST /api/v1/pagamentos/{id}/consultar-status` confirmam o pagamento
6. a confirmacao move a solicitacao para `PAGA_AGUARDANDO_ACEITE` e cria exatamente 1 `ConviteProfissional`
7. o `AtendimentoFaxina` so nasce quando a profissional aceita o convite
8. nesse aceite valido, o pagamento pago passa a ser vinculado ao atendimento criado

Endpoints principais:

```text
POST /api/v1/pagamentos
GET /api/v1/pagamentos/solicitacao/{solicitacaoId}
POST /api/v1/pagamentos/{id}/consultar-status
POST /api/v1/webhooks/asaas
```

O retorno do Asaas nao confirma pagamento por si so. A fonte de verdade continua sendo o backend, via webhook ou reconciliacao segura que reutiliza o mesmo fluxo interno de confirmacao.

O endpoint legado baseado em atendimento continua existindo apenas para compatibilidade com pagamentos antigos:

```text
GET /api/v1/pagamentos/atendimento/{atendimentoId}
```

Variaveis usadas pelo backend:

```text
JWT_SECRET
JWT_EXPIRATION_SECONDS
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
ASAAS_BASE_URL
ASAAS_API_KEY
ASAAS_WEBHOOK_TOKEN
ASAAS_DEFAULT_CUSTOMER_ID
ASAAS_PAYMENT_BILLING_TYPE
ASAAS_PAYMENT_AUTO_REDIRECT
ASAAS_PAYMENT_CALLBACK_ENABLED
ASAAS_CHECKOUT_BILLING_TYPES
ASAAS_CHECKOUT_SUCCESS_URL
ASAAS_CHECKOUT_CANCEL_URL
ASAAS_CHECKOUT_EXPIRED_URL
```

Configuracao local recomendada:

- `ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3`
- `ASAAS_PAYMENT_CALLBACK_ENABLED=false`
- `ASAAS_PAYMENT_AUTO_REDIRECT=true`
- `ASAAS_CHECKOUT_SUCCESS_URL=http://localhost:5173/pagamento/sucesso`
- `ASAAS_CHECKOUT_CANCEL_URL=http://localhost:5173/pagamento/cancelado`
- `ASAAS_CHECKOUT_EXPIRED_URL=http://localhost:5173/pagamento/expirado`

Configuracao esperada em producao:

- essas variaveis pertencem ao servico backend na Railway
- depois de alterar variaveis, o backend deve ser redeployado
- `ASAAS_BASE_URL=https://api.asaas.com/v3`
- `ASAAS_PAYMENT_CALLBACK_ENABLED=true`
- `ASAAS_PAYMENT_AUTO_REDIRECT=true`
- `ASAAS_CHECKOUT_SUCCESS_URL=https://www.cleanerleidy.com.br/pagamento/sucesso`
- `ASAAS_CHECKOUT_CANCEL_URL=https://www.cleanerleidy.com.br/pagamento/cancelado`
- `ASAAS_CHECKOUT_EXPIRED_URL=https://www.cleanerleidy.com.br/pagamento/expirado`

Observacoes operacionais:

- o webhook do Asaas deve apontar para `https://BACKEND_PUBLIC_URL/api/v1/webhooks/asaas`
- o token configurado no painel do Asaas deve ser igual a `ASAAS_WEBHOOK_TOKEN`
- a conta do Asaas precisa ter o dominio `https://www.cleanerleidy.com.br` cadastrado em Minha Conta
- nao misture `localhost`, `cleanerleidy.com.br` e `www.cleanerleidy.com.br` no mesmo teste de producao, porque a sessao JWT no navegador e especifica por origem

`ASAAS_CHECKOUT_BILLING_TYPES` permanece apenas como fallback de compatibilidade para ambientes locais antigos. Para o fluxo principal, configure `ASAAS_PAYMENT_BILLING_TYPE` com `CREDIT_CARD` ou `PIX`.

Seguranca do webhook:

- o endpoint continua publico no JWT para receber chamadas do Asaas
- toda chamada deve enviar o header `asaas-access-token`
- o backend compara esse header com `ASAAS_WEBHOOK_TOKEN` antes de processar o payload
- chamadas sem token ou com token invalido retornam erro JSON 401
- chamadas autenticadas mas sem permissao em endpoints privados retornam 403
- o backend valida a estrutura do payload e trata entregas duplicadas com idempotencia
- eventos nao suportados sao ignorados com resposta 200 para evitar retry desnecessario do gateway
- a confirmacao definitiva continua restrita ao backend

## Scripts uteis

Backend:

```bash
cd apps/backend
./mvnw test
```

Frontend:

```bash
cd apps/frontend
npm run build
```

## Estado atual

Este repositorio ja cobre o fluxo central do MVP pre-pago:

- monorepo preservado
- solicitacao, selecao unica e pagamento antes do convite implementados
- confirmacao de pagamento via webhook e reconciliacao manual backend implementadas
- convite unico apos pagamento confirmado implementado
- aceite da profissional criando `AtendimentoFaxina` `CONFIRMADO` implementado
- credito de reposicao operacional implementado para recusa ou expiracao
- monitoramento admin de pagamentos, convites e creditos de solicitacao implementado
- frontend React + Vite integrado ao fluxo principal do cliente e do admin
- PostgreSQL local via Docker Compose
- ambiente local e configuracao de producao documentados
