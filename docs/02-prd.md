# PRD — Leidy Cleaner Services

## 1. Visão do produto

Leidy Cleaner Services é uma plataforma web para intermediação operacional de serviços de limpeza.

A plataforma tem três perfis principais:
- Cliente
- Profissional
- Administrador

As categorias de serviço suportadas no MVP são:
- `FAXINA_RESIDENCIAL`
- `FAXINA_COMERCIAL`
- `FAXINA_CONDOMINIO`
- `FAXINA_EVENTO`

---

## 2. Objetivo de negócio

Construir um MVP que permita validar a operação da agência com:
- captação e ativação de profissionais
- contratação de serviços por clientes
- cobrança centralizada
- execução rastreável do serviço
- supervisão administrativa

---

## 3. Problemas que o produto resolve

### Para o cliente
- dificuldade em encontrar profissionais confiáveis
- pouca visibilidade do status da solicitação e do pagamento
- baixa previsibilidade quando uma profissional não aceita o serviço

### Para a empresa
- operação descentralizada
- controle fraco de cadastro e validação
- dificuldade de rastrear solicitações, pagamentos, convites e execução

### Para a profissional
- falta de organização de chamados
- ausência de fluxo claro de convite e resposta
- pouca previsibilidade operacional

---

## 4. Perfis de usuário

### 4.1 Cliente
Pode:
- criar conta
- cadastrar endereços
- criar solicitação de faxina
- visualizar profissionais elegíveis
- selecionar exatamente 1 profissional
- pagar pela plataforma ou usar um `CreditoSolicitacao`
- acompanhar solicitação, convite e atendimento
- avaliar a profissional após o serviço

### 4.2 Profissional
Pode:
- criar conta
- enviar documentos
- cadastrar regiões atendidas
- cadastrar disponibilidade
- receber convite somente após pagamento confirmado
- aceitar ou recusar convite pago
- iniciar e finalizar serviços atribuídos

### 4.3 Admin
Pode:
- aprovar profissionais
- revisar documentos
- visualizar clientes, profissionais, solicitações, convites, atendimentos e pagamentos
- acompanhar créditos operacionais de reposição
- tratar ocorrências

---

## 5. Escopo do MVP

### 5.1 Incluído
- autenticação
- cadastro de cliente
- cadastro de profissional
- verificação documental
- regiões de atendimento
- disponibilidade da profissional
- criação de solicitação
- listagem de profissionais elegíveis
- seleção de exatamente 1 profissional
- pagamento antes do envio do convite
- pagamento via Asaas
- reconciliação de pagamento com webhook como fonte de verdade
- uso de `CreditoSolicitacao` para reposição equivalente
- criação de convite somente após pagamento confirmado
- aceite ou recusa do convite
- criação de atendimento somente após aceite válido
- início e fim do serviço
- avaliação unilateral
- painel admin básico
- ocorrências operacionais

### 5.2 Fora do escopo
- split de pagamento
- payout na plataforma
- avaliação da profissional sobre o cliente
- chat interno
- múltiplas profissionais no mesmo atendimento
- ranking avançado
- app mobile de cliente
- carteira monetária
- banco de horas

---

## 6. Fluxo principal do produto

### 6.1 Fluxo do cliente
1. Cria conta
2. Cadastra endereço
3. Cria `SolicitacaoFaxina`
4. Vê profissionais elegíveis
5. Seleciona exatamente 1 profissional
6. Solicitação vai para `AGUARDANDO_PAGAMENTO`
7. Paga via Asaas ou usa um `CreditoSolicitacao`
8. Backend confirma o pagamento
9. Solicitação vai para `PAGA_AGUARDANDO_ACEITE`
10. Backend cria exatamente 1 `ConviteProfissional`
11. Aguarda resposta da profissional
12. Se houver aceite válido, acompanha o atendimento
13. Avalia a profissional após a conclusão

### 6.2 Fluxo da profissional
1. Cria conta
2. Envia documentos e selfie
3. Informa regiões
4. Informa disponibilidade
5. Aguarda aprovação
6. Recebe convite apenas quando a solicitação já está paga
7. Aceita ou recusa
8. Se aceitar, recebe `AtendimentoFaxina` já `CONFIRMADO`
9. Executa o serviço
10. Marca início e fim

### 6.3 Fluxo financeiro
1. Cliente seleciona 1 profissional elegível
2. Backend cria cobrança vinculada à solicitação ou usa crédito interno de reposição
3. Se for Asaas, o cliente paga e o gateway envia webhook
4. Backend confirma o pagamento e cria o convite
5. Se houver aceite válido, o backend cria `AtendimentoFaxina` e vincula o pagamento pago ao atendimento
6. Se houver recusa ou expiração, o backend gera `CreditoSolicitacao` equivalente

---

## 7. Regras de negócio

### 7.1 Seleção de profissional
- a solicitação deve ter exatamente 1 profissional selecionada
- a profissional precisa ser elegível
- a validação final fica no backend

### 7.2 Elegibilidade da profissional
A profissional precisa estar:
- ativa
- aprovada
- com verificação aprovada
- com região compatível
- disponível no horário
- sem atendimento conflitante

### 7.3 Convites
- convite só é criado depois do pagamento confirmado
- deve existir exatamente 1 convite por solicitação no fluxo pré-pago
- o convite vai apenas para a profissional selecionada
- aceite deve continuar transacional no backend

### 7.4 Pagamento
- o pagamento é da cliente para a empresa
- o webhook do Asaas é a fonte de verdade para confirmação externa
- o frontend nunca confirma pagamento
- o pagamento externo pode nascer vinculado à `SolicitacaoFaxina`
- `Pagamento.atendimentoId` pode ficar nulo até o aceite válido

### 7.5 Atendimento
- `AtendimentoFaxina` só é criado após aceite válido
- o atendimento nasce `CONFIRMADO`
- o pagamento pago é vinculado ao atendimento criado
- somente a profissional do atendimento pode iniciar e finalizar

### 7.6 Solicitação não aceita
- recusa ou expiração não criam atendimento
- a solicitação paga muda para `NAO_ACEITA_CREDITO_GERADO`
- o backend cria um `CreditoSolicitacao`
- esse crédito representa uma nova solicitação equivalente
- esse crédito não é carteira, não é saldo, não é desconto e não é banco de horas

### 7.7 Avaliação
- apenas o cliente avalia
- apenas a profissional é avaliada
- somente após atendimento finalizado
- uma avaliação por atendimento
- nota de 1 a 5

---

## 8. Estados principais

### 8.1 Solicitação
- `CRIADA`
- `AGUARDANDO_SELECAO`
- `AGUARDANDO_PAGAMENTO`
- `PAGA_AGUARDANDO_ACEITE`
- `ACEITA`
- `EM_EXECUCAO`
- `FINALIZADA`
- `NAO_ACEITA_CREDITO_GERADO`
- `CANCELADA`
- `EXPIRADA`

### 8.2 Atendimento
- `CONFIRMADO`
- `EM_EXECUCAO`
- `FINALIZADO`
- `CANCELADO`
- `EM_ANALISE`

### 8.3 Pagamento
- `PENDENTE`
- `AGUARDANDO_CONFIRMACAO`
- `PAGO`
- `FALHOU`
- `CANCELADO`
- `ESTORNADO`

### 8.4 Crédito de solicitação
- `DISPONIVEL`
- `RESERVADO`
- `UTILIZADO`
- `CANCELADO`
- `EXPIRADO`

---

## 9. Métricas de sucesso

- quantidade de profissionais aprovadas
- quantidade de solicitações criadas
- taxa de pagamento confirmado
- taxa de convite aceito
- taxa de geração e uso de `CreditoSolicitacao`
- taxa de atendimento finalizado
- média de avaliações por profissional

---

## 10. Riscos

- pouca oferta de profissionais
- falha ou atraso no webhook
- crédito de reposição usado fora da equivalência esperada
- gargalo na revisão documental
- escopo crescer antes da validação operacional

---

## 11. Critérios de sucesso do MVP

O MVP será considerado funcional quando:
- o cadastro completo de cliente e profissional estiver operando
- a profissional puder ser aprovada e configurada
- o cliente puder criar uma solicitação real
- a cliente puder selecionar exatamente 1 profissional elegível
- o pagamento puder ser criado na solicitação e confirmado pelo backend
- o convite só for criado após pagamento confirmado
- o atendimento só for criado após aceite válido
- a recusa ou expiração gerar `CreditoSolicitacao` equivalente
- a profissional puder iniciar e finalizar o atendimento
- o cliente puder avaliar a profissional
