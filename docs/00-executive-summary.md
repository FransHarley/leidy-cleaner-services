# Resumo Executivo

## O produto

Leidy Cleaner Services é uma plataforma web para intermediação operacional de serviços de limpeza.

Ela conecta:
- clientes que precisam contratar faxina residencial, comercial, condominial ou para eventos
- profissionais de limpeza previamente verificadas
- equipe administrativa da empresa

## Problema que o produto resolve

Hoje, o serviço de faxina costuma depender de WhatsApp, indicação, disponibilidade mal controlada, pagamentos dispersos e baixa padronização operacional.

A plataforma resolve isso com:
- cadastro estruturado
- verificação documental
- regiões de atendimento
- seleção de profissional elegível
- pagamento centralizado antes do convite
- convite e resposta com rastreabilidade
- crédito de reposição para solicitação paga que não foi aceita
- rastreio de execução do serviço
- supervisão administrativa

## Decisões mais importantes

### 1. O sistema será monorepo
Porque o projeto tem frontend, backend e documentação fortemente acoplados.

### 2. O pagamento entra integralmente na conta da empresa
A plataforma não faz split nem repasse automático.

### 3. O gateway externo inicial é Asaas
A integração externa é feita por API e webhook.

### 4. O pagamento pode nascer na solicitação
No fluxo pré-pago, a cobrança externa pode ser criada primeiro para a `SolicitacaoFaxina`, com `AtendimentoFaxina` ainda inexistente. Após aceite válido, o pagamento já quitado é vinculado ao atendimento criado.

### 5. O webhook continua sendo a fonte de verdade
O frontend nunca confirma pagamento por conta própria. O backend reconcilia estados externos e internos.

### 6. Crédito de solicitação não é dinheiro
`CreditoSolicitacao` representa um direito único de reposição para uma nova solicitação equivalente. Não é carteira, não é saldo, não é desconto e não é banco de horas.

### 7. A avaliação continua unilateral
Somente o cliente avalia a profissional após o atendimento finalizado.

## Sequência operacional do produto

1. Cliente cria `SolicitacaoFaxina`.
2. Cliente visualiza profissionais elegíveis.
3. Cliente seleciona exatamente 1 profissional.
4. Solicitação vai para `AGUARDANDO_PAGAMENTO`.
5. Cliente paga via Asaas ou usa um `CreditoSolicitacao`.
6. Backend confirma o pagamento por webhook ou reconciliação segura e o `Pagamento` vira `PAGO`.
7. Solicitação vai para `PAGA_AGUARDANDO_ACEITE` e o backend cria exatamente 1 `ConviteProfissional`.
8. Profissional aceita ou recusa.
9. Se aceitar, o backend cria `AtendimentoFaxina` já `CONFIRMADO` e vincula o pagamento pago ao atendimento.
10. Se recusar ou expirar, o backend gera um `CreditoSolicitacao` para reposição equivalente.
11. Profissional executa o serviço.
12. Cliente avalia a profissional.

## Riscos centrais do projeto

### 1. Oferta e demanda
Sem profissionais suficientes, o fluxo não fecha. Sem clientes suficientes, as profissionais abandonam.

### 2. Aceite transacional
O aceite do convite precisa ser transacional no backend para evitar inconsistência operacional.

### 3. Pagamento inconsistente
Sem webhook bem tratado e reconciliação segura, solicitação paga pode ficar sem convite ou com status incorreto.

### 4. Escopo inchado
Chat, repasse automatizado, carteira monetária, ranking avançado e automações extras são riscos de atraso se entrarem cedo demais.

## Regra de ouro

O centro do produto é o fluxo:
**solicitação → seleção única → pagamento → convite → aceite → atendimento → execução → avaliação**
