# Decisões e Opções Avaliadas

## 1. Estrutura do repositório

### Opções avaliadas

#### Opção A — Repositórios separados
**Prós**
- deploys independentes
- isolamento mais forte entre frontend e backend

**Contras**
- maior atrito de versionamento
- mais trabalho de documentação
- mais chance de desalinhamento entre contratos e implementação

#### Opção B — Monorepo
**Prós**
- melhor visão do produto inteiro
- versionamento coordenado
- documentação centralizada
- menor atrito operacional no início

**Decisão final**
**Monorepo**

---

## 2. Arquitetura do backend

### Opções avaliadas

#### Opção A — Node/NestJS
Boa produtividade, mas pior alinhamento com as regras transacionais mais sensíveis do produto.

#### Opção B — Spring Boot
Mais forte para transações, segurança, separação em camadas e evolução organizada.

**Decisão final**
**Java 21 + Spring Boot 3.x**

---

## 3. Frontend

### Opções avaliadas

#### Opção A — Next.js
Bom para SSR e marketing, mas adiciona complexidade desnecessária ao app operacional do MVP.

#### Opção B — React + Vite
Mais simples, rápido e adequado para SPA autenticada com dashboard.

**Decisão final**
**React + TypeScript + Vite**

---

## 4. Banco de dados

### Opções avaliadas

#### Opção A — MongoDB
Ruim para integridade relacional, reconciliação de estados e fluxos transacionais.

#### Opção B — PostgreSQL
Melhor para integridade, histórico, auditoria e relacionamentos.

**Decisão final**
**PostgreSQL**

---

## 5. Migrações

### Opções avaliadas

#### Opção A — Hibernate ddl-auto
Útil para protótipo, ruim para rastreabilidade séria.

#### Opção B — Flyway
Mais controlado e seguro para evolução do banco.

**Decisão final**
**Flyway**

---

## 6. Pagamento

### Opções avaliadas

#### Opção A — Cobrança criada só depois do atendimento
Simplifica o modelo antigo, mas não atende o fluxo pré-pago já adotado, no qual o cliente paga antes do convite efetivo.

#### Opção B — Cobrança criada na solicitação paga
Permite que a `SolicitacaoFaxina` avance para pagamento antes do convite. O pagamento externo nasce ligado à solicitação, permanece com `atendimentoId` nulo e só é associado ao `AtendimentoFaxina` depois do aceite válido.

**Decisão final**
**Asaas por API + webhook no backend, com cobrança externa podendo nascer na `SolicitacaoFaxina`**

Regras decorrentes:
- `externalReference` externo usa `solicitacao-{id}` para pagamento prévio à criação do atendimento
- o webhook do Asaas continua sendo a fonte de verdade para confirmação externa
- `POST /pagamentos/{id}/consultar-status` pode reconciliar com o gateway, mas deve reutilizar o mesmo fluxo de confirmação do backend
- o frontend apenas cria a cobrança via backend, mostra status e aciona refresh quando necessário
- o frontend nunca confirma pagamento por conta própria

---

## 7. Modelo financeiro

### Opções avaliadas

#### Opção A — Split automático
Mais complexo, desnecessário para o MVP e incoerente com a operação desejada.

#### Opção B — Pagamento integral para a empresa
Mais simples para o MVP e coerente com o fluxo operacional.

**Decisão final**
**Pagamento integral para a empresa e repasse fora da plataforma**

---

## 8. Solicitação não aceita após pagamento

### Opções avaliadas

#### Opção A — Reembolso automático ou carteira monetária
Infla escopo, adiciona risco financeiro e cria um produto de saldo que não faz parte do MVP.

#### Opção B — Crédito operacional de reposição
Mantém a operação simples: uma solicitação paga e não aceita gera um direito único de criar uma nova solicitação equivalente.

**Decisão final**
**`CreditoSolicitacao` como crédito operacional de reposição**

Regras decorrentes:
- não é carteira
- não é saldo monetário
- não é desconto
- não é abatimento
- não é pagamento parcial
- não é banco de horas
- não é divisível

---

## 9. Avaliações

### Opções avaliadas

#### Opção A — Sem avaliação
Simplifica, mas perde um sinal importante de qualidade operacional.

#### Opção B — Avaliação bilateral
Mais complexa e fora do escopo atual.

#### Opção C — Avaliação unilateral
Entrega valor sem inflar o produto.

**Decisão final**
**Apenas o cliente avalia a profissional**

---

## 10. Conclusão de arquitetura

A combinação mais coerente para o MVP é:
- monorepo
- React + Vite no frontend
- Spring Boot no backend
- PostgreSQL + Flyway
- Asaas para cobrança externa
- webhook como fonte de verdade para pagamento externo
- `CreditoSolicitacao` como reposição operacional, sem carteira monetária
- avaliação unilateral
- repasse fora da plataforma
