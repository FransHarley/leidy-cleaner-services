# PRD — App Profissional Leidy Cleaner com Capacitor

## 1. Visão geral

O **App Profissional Leidy Cleaner** será um aplicativo Android e iOS voltado exclusivamente para profissionais de limpeza cadastradas na plataforma.

O app terá como objetivo permitir que a profissional:

- receba convites de faxina já pagos;
- aceite ou recuse convites;
- acompanhe atendimentos confirmados;
- marque início e fim do serviço;
- gerencie disponibilidade;
- acompanhe status de verificação;
- receba notificações operacionais;
- registre ocorrências quando necessário.

O app será construído com **Capacitor**, reaproveitando o frontend React/Vite existente, mas com uma experiência visual e de navegação própria para uso mobile.

---

## 2. Objetivo de negócio

Aumentar a velocidade e confiabilidade operacional da profissional no fluxo de atendimento.

O app deve reduzir dependência de WhatsApp/manualidade para ações críticas como:

- visualizar novo convite;
- responder rapidamente;
- acompanhar serviço;
- registrar início/fim;
- receber lembretes e notificações.

---

## 3. Decisão técnica

### Stack principal

- React
- TypeScript
- Vite
- Capacitor
- Android Studio
- Xcode para iOS
- Backend existente em Spring Boot
- API REST existente
- PostgreSQL existente

### Estrutura recomendada

A recomendação é manter o app dentro do frontend atual, pelo menos inicialmente:

```text
leidy-cleaner-services/
├── apps/
│   ├── backend/
│   └── frontend/
│       ├── src/
│       ├── android/
│       ├── ios/
│       └── capacitor.config.ts
├── docs/
└── infra/
```

Não criar outro backend.

Não duplicar regra de negócio.

Não criar microserviço novo.

O backend segue sendo a fonte de verdade para autorização, aceite transacional, pagamento, convite, atendimento, crédito de reposição e status.

---

## 4. Escopo do app

### 4.1 Incluído

- [ ] Login da profissional
- [ ] Sessão autenticada
- [ ] Dashboard mobile da profissional
- [ ] Ativar/desativar recebimento de chamados
- [ ] Visualizar perfil profissional
- [ ] Editar dados permitidos do perfil
- [ ] Visualizar status de aprovação
- [ ] Visualizar status de verificação documental
- [ ] Enviar/atualizar documentos, se o backend permitir
- [ ] Gerenciar regiões atendidas
- [ ] Gerenciar disponibilidade semanal
- [ ] Listar convites recebidos
- [ ] Ver detalhe do convite
- [ ] Aceitar convite
- [ ] Recusar convite
- [ ] Visualizar atendimentos confirmados
- [ ] Visualizar detalhe do atendimento
- [ ] Iniciar serviço
- [ ] Finalizar serviço
- [ ] Visualizar checkpoints
- [ ] Abrir ocorrência
- [ ] Listar ocorrências da profissional
- [ ] Receber notificações push
- [ ] Abrir convite/atendimento ao tocar na notificação
- [ ] Build Android
- [ ] Build iOS
- [ ] Publicação na Google Play
- [ ] Publicação na App Store

### 4.2 Fora do escopo

- [ ] App para cliente
- [ ] App para admin
- [ ] Chat interno
- [ ] Carteira da profissional
- [ ] Saque
- [ ] Repasse automático
- [ ] Split de pagamento
- [ ] Avaliação do cliente pela profissional
- [ ] Agenda avançada estilo Google Calendar
- [ ] Múltiplas profissionais no mesmo atendimento
- [ ] Ranking avançado
- [ ] Assinatura ou recorrência
- [ ] Pagamento dentro do app da profissional

Esses itens devem continuar fora. Colocar isso agora seria escopo inchado e tecnicamente perigoso.

---

## 5. Usuária principal

### Profissional de limpeza

Precisa usar o app no celular durante a rotina de trabalho.

### Necessidades

- Saber quando recebeu convite
- Responder rápido
- Ver endereço, horário e detalhes do serviço
- Confirmar início e fim
- Saber quanto receberá estimadamente
- Informar indisponibilidade
- Abrir ocorrência se houver problema

### Riscos de uso

- Pouca familiaridade com tecnologia
- Celular simples
- Internet instável
- Notificações bloqueadas
- Esquecimento de marcar início/fim
- Confusão entre convite, atendimento e pagamento

Por isso, a interface precisa ser simples, com botões grandes e linguagem direta.

---

## 6. Fluxo principal do app

```text
1. Profissional instala o app
2. Faz login
3. Permite notificações
4. App registra token do dispositivo
5. Profissional deixa status ativo para receber chamados
6. Backend confirma o pagamento da solicitação
7. Sistema envia convite para a profissional selecionada
8. Profissional recebe notificação
9. Abre o detalhe do convite
10. Aceita ou recusa
11. Se aceitar validamente, backend cria atendimento já confirmado
12. Profissional acompanha atendimento confirmado
13. Profissional marca início
14. Profissional marca fim
15. Atendimento fica pronto para avaliação do cliente
```

O aceite do convite precisa continuar transacional no backend. A rota de aceite deve validar solicitação paga e aberta, convite ativo, criar atendimento já confirmado, vincular o pagamento já pago ao atendimento e rodar em transação.

---

## 7. Regras de negócio críticas

### 7.1 Profissional ativa para chamados

- [ ] Profissional aprovada deve vir ativa por padrão, se essa regra já estiver definida no backend
- [ ] Profissional pode desativar quando estiver de folga
- [ ] Profissional inativa não deve aparecer como elegível para novas solicitações
- [ ] App deve exibir claramente o status atual

### 7.2 Convites

- [ ] App apenas solicita aceite/recusa
- [ ] Convite só chega após pagamento confirmado
- [ ] Backend decide se aceite ainda é válido
- [ ] Backend impede duplo aceite
- [ ] Há exatamente um convite por solicitação paga nesse fluxo
- [ ] App deve tratar erro de convite expirado/cancelado
- [ ] App deve impedir clique duplo visualmente, mas sem depender disso como regra de segurança

### 7.3 Atendimentos

- [ ] Somente a profissional vinculada pode iniciar
- [ ] Somente a profissional vinculada pode finalizar
- [ ] Não pode finalizar sem iniciar
- [ ] Não pode iniciar duas vezes
- [ ] Não pode finalizar duas vezes
- [ ] App deve exibir status legível

### 7.4 Pagamento

- [ ] App da profissional não confirma pagamento
- [ ] App da profissional não cria cobrança
- [ ] App apenas exibe status operacional quando necessário
- [ ] Pagamento pode nascer na solicitação e só depois ser vinculado ao atendimento
- [ ] Webhook continua sendo fonte de verdade

### 7.5 Solicitação não aceita

- [ ] Recusa ou expiração não criam atendimento
- [ ] Backend pode gerar `CreditoSolicitacao` para o cliente
- [ ] O app apenas reflete o encerramento do convite, sem implementar carteira, saldo ou desconto

### 7.6 Ocorrências

- [ ] Profissional pode abrir ocorrência relacionada ao atendimento
- [ ] Ocorrência deve ter tipo, descrição e atendimento vinculado
- [ ] Admin continua responsável por tratar ocorrência

---

## 8. Telas previstas

### 8.1 Login

- [ ] Campo de e-mail
- [ ] Campo de senha
- [ ] Botão entrar
- [ ] Tratamento de erro de credenciais
- [ ] Tratamento de usuário sem perfil profissional
- [ ] Tratamento de conta suspensa/inativa

### 8.2 Home profissional

Cards principais:

- [ ] Status ativa/inativa
- [ ] Convites pendentes
- [ ] Próximo atendimento
- [ ] Atendimento em andamento
- [ ] Status da verificação
- [ ] Atalho para disponibilidade
- [ ] Atalho para ocorrências

### 8.3 Convites

- [ ] Lista de convites
- [ ] Status do convite
- [ ] Data/hora do serviço
- [ ] Bairro/região
- [ ] Duração
- [ ] Valor estimado da profissional
- [ ] Botão ver detalhes

### 8.4 Detalhe do convite

- [ ] Tipo de serviço
- [ ] Data e horário
- [ ] Duração
- [ ] Endereço ou região, conforme regra de privacidade
- [ ] Observações
- [ ] Valor estimado da profissional
- [ ] Prazo de expiração
- [ ] Botão aceitar
- [ ] Botão recusar
- [ ] Feedback após resposta

### 8.5 Atendimentos

- [ ] Lista de atendimentos confirmados
- [ ] Lista de atendimentos em execução
- [ ] Lista de atendimentos finalizados
- [ ] Filtros simples por status
- [ ] Empty state quando não houver atendimento

### 8.6 Detalhe do atendimento

- [ ] Status do atendimento
- [ ] Cliente
- [ ] Endereço
- [ ] Data/hora
- [ ] Tipo de serviço
- [ ] Observações
- [ ] Valor estimado da profissional
- [ ] Checkpoint de início
- [ ] Checkpoint de fim
- [ ] Botão iniciar
- [ ] Botão finalizar
- [ ] Botão abrir ocorrência

### 8.7 Disponibilidade

- [ ] Lista de dias da semana
- [ ] Horário inicial
- [ ] Horário final
- [ ] Ativar/desativar faixa
- [ ] Criar disponibilidade
- [ ] Editar disponibilidade
- [ ] Remover disponibilidade

### 8.8 Regiões atendidas

- [ ] Listar regiões disponíveis
- [ ] Marcar regiões atendidas
- [ ] Salvar alterações
- [ ] Mostrar erro se nenhuma região for selecionada, se aplicável

### 8.9 Verificação documental

- [ ] Mostrar status atual
- [ ] Mostrar pendências
- [ ] Permitir envio de documentos quando necessário
- [ ] Exibir motivo de rejeição, se houver

### 8.10 Ocorrências

- [ ] Listar ocorrências
- [ ] Abrir nova ocorrência
- [ ] Selecionar atendimento
- [ ] Selecionar tipo
- [ ] Descrever problema
- [ ] Enviar ocorrência
- [ ] Acompanhar status

### 8.11 Perfil

- [ ] Nome de exibição
- [ ] Telefone
- [ ] Foto
- [ ] Experiência
- [ ] Descrição
- [ ] Dados bloqueados quando não puderem ser alterados

---

## 9. Endpoints usados pelo app

### Auth

- [ ] `POST /api/v1/auth/login`
- [ ] `GET /api/v1/auth/me`

### Profissional

- [ ] `GET /api/v1/profissionais/me`
- [ ] `PUT /api/v1/profissionais/me`
- [ ] `GET /api/v1/profissionais/me/regioes`
- [ ] `POST /api/v1/profissionais/me/regioes`
- [ ] `GET /api/v1/profissionais/me/disponibilidades`
- [ ] `POST /api/v1/profissionais/me/disponibilidades`
- [ ] `PUT /api/v1/profissionais/me/disponibilidades/{id}`
- [ ] `DELETE /api/v1/profissionais/me/disponibilidades/{id}`

### Verificação

- [ ] `GET /api/v1/verificacoes/minha`
- [ ] `POST /api/v1/verificacoes/documentos`

### Convites

- [ ] `GET /api/v1/convites/meus`
- [ ] `GET /api/v1/convites/{id}`
- [ ] `POST /api/v1/convites/{id}/aceitar`
- [ ] `POST /api/v1/convites/{id}/recusar`

### Atendimentos

- [ ] `GET /api/v1/atendimentos/meus`
- [ ] `GET /api/v1/atendimentos/{id}`
- [ ] `GET /api/v1/atendimentos/{id}/checkpoints`
- [ ] `POST /api/v1/atendimentos/{id}/iniciar`
- [ ] `POST /api/v1/atendimentos/{id}/finalizar`

### Ocorrências

- [ ] `GET /api/v1/ocorrencias/meus`
- [ ] `GET /api/v1/ocorrencias/{id}`
- [ ] `POST /api/v1/ocorrencias`

### Notificações — novos endpoints

- [ ] `POST /api/v1/notificacoes/dispositivos`
- [ ] `DELETE /api/v1/notificacoes/dispositivos/{id}`
- [ ] `POST /api/v1/notificacoes/teste`

---

## 10. Novas estruturas necessárias no backend

### 10.1 Dispositivo push

Criar entidade/tabela:

```text
DispositivoPush
- id
- usuarioId
- plataforma
- token
- ativo
- ultimoUsoEm
- criadoEm
- atualizadoEm
```

Checklist:

- [ ] Criar migration `dispositivos_push`
- [ ] Criar entity `DispositivoPush`
- [ ] Criar repository
- [ ] Criar DTO de registro de dispositivo
- [ ] Criar service de registro/desativação
- [ ] Criar controller
- [ ] Validar ownership
- [ ] Impedir token duplicado ativo para o mesmo usuário
- [ ] Permitir atualizar token existente

### 10.2 Serviço de notificação

- [ ] Criar `NotificacaoPushService`
- [ ] Criar abstração para provider
- [ ] Implementar envio via Firebase/FCM ou provider escolhido
- [ ] Adicionar logs sem expor token completo
- [ ] Tratar falha sem quebrar transação principal
- [ ] Desativar token inválido quando provider retornar erro definitivo

### 10.3 Eventos que disparam push

- [ ] Convite criado
- [ ] Convite próximo de expirar
- [ ] Atendimento criado
- [ ] Solicitação paga aguardando aceite
- [ ] Lembrete antes do atendimento
- [ ] Ocorrência atualizada

---

## 11. Notificações

### 11.1 Tipos de notificação

```text
CONVITE_RECEBIDO
CONVITE_EXPIRANDO
ATENDIMENTO_CRIADO
ATENDIMENTO_CONFIRMADO
LEMBRETE_ATENDIMENTO
OCORRENCIA_ATUALIZADA
```

### 11.2 Payload mínimo

```json
{
  "tipo": "CONVITE_RECEBIDO",
  "titulo": "Novo convite de faxina",
  "mensagem": "Você recebeu um novo convite para responder.",
  "conviteId": 123,
  "atendimentoId": null
}
```

### 11.3 Regras

- [ ] Notificação deve abrir a tela correta
- [ ] Notificação de convite deve abrir detalhe do convite
- [ ] Notificação de atendimento deve abrir detalhe do atendimento
- [ ] Notificação não substitui validação no backend
- [ ] Se o convite expirou, app deve mostrar estado atualizado
- [ ] Se push falhar, operação principal continua

---

## 12. Capacitor

### 12.1 Configuração base

- [ ] Instalar `@capacitor/core`
- [ ] Instalar `@capacitor/cli`
- [ ] Configurar `capacitor.config.ts`
- [ ] Definir appId
- [ ] Definir appName
- [ ] Definir webDir correto
- [ ] Adicionar Android
- [ ] Adicionar iOS
- [ ] Rodar build web
- [ ] Rodar sync

### 12.2 Android

- [ ] Gerar projeto Android
- [ ] Abrir no Android Studio
- [ ] Configurar package name
- [ ] Configurar ícone
- [ ] Configurar splash screen
- [ ] Configurar permissões
- [ ] Testar em emulador
- [ ] Testar em aparelho físico
- [ ] Gerar build debug
- [ ] Gerar build release
- [ ] Assinar build
- [ ] Gerar AAB para Play Store

### 12.3 iOS

- [ ] Gerar projeto iOS
- [ ] Abrir no Xcode
- [ ] Configurar bundle identifier
- [ ] Configurar ícone
- [ ] Configurar splash screen
- [ ] Configurar permissões
- [ ] Configurar certificados
- [ ] Testar em simulador
- [ ] Testar em iPhone real
- [ ] Gerar build para TestFlight
- [ ] Enviar para App Store Connect

---

## 13. Milestones

### M0 — Decisão e preparação

Objetivo: formalizar o app como escopo novo, sem quebrar o MVP web.

- [ ] Criar documento `docs/08-prd-app-profissional-capacitor.md`
- [ ] Registrar decisão: app será exclusivo da profissional
- [ ] Registrar decisão: cliente/admin continuam na web
- [ ] Registrar decisão: app usa backend existente
- [ ] Registrar decisão: app não terá payout/split/chat
- [ ] Revisar endpoints existentes necessários
- [ ] Identificar endpoints faltantes
- [ ] Definir nome do app
- [ ] Definir bundle/package id
- [ ] Definir ícone e splash iniciais

Critério de pronto:

- [ ] Documento aprovado
- [ ] Escopo fechado
- [ ] Sem reabertura de regras proibidas

---

### M1 — Layout mobile profissional dentro do frontend

Objetivo: deixar a experiência da profissional com cara de app antes de empacotar.

- [x] Criar layout mobile exclusivo
- [x] Criar navegação inferior
- [x] Criar header simples
- [x] Criar home profissional mobile
- [x] Criar cards de resumo
- [x] Criar botão/toggle de ativa para chamados
- [x] Ajustar responsividade
- [x] Remover elementos com cara de dashboard desktop
- [x] Validar em largura de celular
- [x] Validar fluxo no navegador mobile

Critério de pronto:

- [x] Profissional consegue navegar bem pelo celular
- [x] Home mostra convites, atendimentos e status
- [x] Build do frontend passa

---

### M2 — Convites no app

Objetivo: entregar o fluxo mais importante do app.

- [x] Listar convites recebidos
- [x] Exibir detalhe do convite
- [x] Exibir prazo/status
- [x] Exibir valor estimado da profissional
- [ ] Aceitar convite
- [ ] Recusar convite
- [ ] Tratar convite expirado
- [ ] Tratar convite já aceito por outra profissional
- [ ] Tratar erro de permissão
- [ ] Bloquear clique duplo visualmente
- [ ] Atualizar lista após ação

Critério de pronto:

- [ ] Profissional aceita convite pelo mobile
- [ ] Profissional recusa convite pelo mobile
- [ ] Backend continua sendo a validação final
- [ ] Teste manual cobre aceite concorrente

---

### M3 — Atendimentos no app

Objetivo: permitir que a profissional opere o serviço.

- [ ] Listar atendimentos
- [ ] Separar por status
- [ ] Exibir detalhe do atendimento
- [ ] Exibir endereço e horário
- [ ] Exibir observações
- [ ] Exibir valor estimado
- [ ] Iniciar serviço
- [ ] Finalizar serviço
- [ ] Exibir checkpoints
- [ ] Tratar erro ao iniciar duas vezes
- [ ] Tratar erro ao finalizar sem início
- [ ] Tratar atendimento não confirmado

Critério de pronto:

- [ ] Profissional inicia serviço pelo app
- [ ] Profissional finaliza serviço pelo app
- [ ] Checkpoints são persistidos
- [ ] Regras críticas permanecem no backend

---

### M4 — Perfil, regiões e disponibilidade

Objetivo: permitir manutenção básica da profissional pelo app.

- [ ] Visualizar perfil
- [ ] Editar dados permitidos
- [ ] Visualizar status de aprovação
- [ ] Listar regiões disponíveis
- [ ] Salvar regiões atendidas
- [ ] Listar disponibilidades
- [ ] Criar disponibilidade
- [ ] Editar disponibilidade
- [ ] Remover disponibilidade
- [ ] Tratar estados vazios
- [ ] Tratar erros de validação

Critério de pronto:

- [ ] Profissional consegue ajustar sua disponibilidade
- [ ] Profissional consegue ajustar regiões
- [ ] Alterações refletem na elegibilidade

---

### M5 — Verificação documental

Objetivo: permitir acompanhamento e envio básico de documentos.

- [ ] Exibir status da verificação
- [ ] Exibir pendências
- [ ] Exibir motivo de rejeição
- [ ] Enviar documento frente
- [ ] Enviar documento verso, se aplicável
- [ ] Enviar selfie
- [ ] Enviar comprovante de residência
- [ ] Validar tamanho/formato
- [ ] Exibir progresso/feedback
- [ ] Recarregar status após envio

Critério de pronto:

- [ ] Profissional entende se está aprovada, pendente ou rejeitada
- [ ] Profissional consegue reenviar documentos quando necessário

---

### M6 — Ocorrências

Objetivo: permitir registro de problemas operacionais.

- [ ] Listar ocorrências da profissional
- [ ] Abrir ocorrência vinculada a atendimento
- [ ] Selecionar tipo de ocorrência
- [ ] Escrever descrição
- [ ] Enviar ocorrência
- [ ] Ver detalhe da ocorrência
- [ ] Ver status da ocorrência
- [ ] Tratar erro de atendimento inválido

Critério de pronto:

- [ ] Profissional consegue abrir ocorrência pelo app
- [ ] Admin consegue visualizar ocorrência na web/admin

---

### M7 — Capacitor Android

Objetivo: transformar a experiência mobile em app Android instalável.

- [ ] Instalar Capacitor
- [ ] Configurar `capacitor.config.ts`
- [ ] Adicionar Android
- [ ] Ajustar build output do Vite
- [ ] Rodar `npm run build`
- [ ] Rodar `npx cap sync android`
- [ ] Abrir no Android Studio
- [ ] Configurar nome do app
- [ ] Configurar ícone
- [ ] Configurar splash
- [ ] Testar em emulador
- [ ] Testar em aparelho real
- [ ] Corrigir problemas de viewport
- [ ] Corrigir problemas de teclado mobile
- [ ] Corrigir problemas de safe area
- [ ] Gerar build release

Critério de pronto:

- [ ] APK/AAB gerado
- [ ] App instala em Android real
- [ ] Login funciona
- [ ] Convites funcionam
- [ ] Atendimentos funcionam

---

### M8 — Capacitor iOS

Objetivo: gerar app iOS instalável.

- [ ] Adicionar iOS
- [ ] Rodar `npx cap sync ios`
- [ ] Abrir no Xcode
- [ ] Configurar bundle id
- [ ] Configurar ícone
- [ ] Configurar splash
- [ ] Configurar assinatura
- [ ] Testar em simulador
- [ ] Testar em iPhone real
- [ ] Corrigir safe area
- [ ] Corrigir teclado no iOS
- [ ] Corrigir permissões
- [ ] Gerar build TestFlight

Critério de pronto:

- [ ] App roda em iPhone real
- [ ] Login funciona
- [ ] Convites funcionam
- [ ] Atendimentos funcionam

---

### M9 — Push notifications

Objetivo: permitir que a profissional seja avisada de eventos operacionais.

- [ ] Escolher provider de push
- [ ] Criar migration `dispositivos_push`
- [ ] Criar endpoints de dispositivo
- [ ] Registrar token no login
- [ ] Atualizar token quando mudar
- [ ] Desativar token no logout, se aplicável
- [ ] Solicitar permissão no app
- [ ] Receber token no Android
- [ ] Receber token no iOS
- [ ] Enviar notificação de teste
- [ ] Enviar push ao criar convite
- [ ] Enviar push ao confirmar atendimento
- [ ] Abrir tela correta ao tocar na notificação
- [ ] Tratar push com app fechado
- [ ] Tratar push com app aberto
- [ ] Registrar falhas no backend

Critério de pronto:

- [ ] Profissional recebe push de novo convite
- [ ] Toque na notificação abre o detalhe correto
- [ ] Falha de push não quebra criação de convite

---

### M10 — Segurança e sessão

Objetivo: garantir que o app não exponha dados sensíveis nem quebre autenticação.

- [ ] Revisar armazenamento do token
- [ ] Evitar exposição de token em logs
- [ ] Tratar 401
- [ ] Tratar 403
- [ ] Tratar sessão expirada
- [ ] Implementar logout
- [ ] Validar que cliente/admin não acessam app profissional indevidamente
- [ ] Revisar permissões nos endpoints usados
- [ ] Revisar upload de documentos
- [ ] Revisar dados sensíveis exibidos no app

Critério de pronto:

- [ ] Usuário sem perfil profissional não acessa app
- [ ] Token não aparece em log
- [ ] Erros de autorização são tratados corretamente

---

### M11 — Testes e validação operacional

Objetivo: validar que o app funciona no fluxo real.

- [ ] Testar login
- [ ] Testar profissional pendente
- [ ] Testar profissional aprovada
- [ ] Testar ativa/inativa para chamados
- [ ] Testar convite recebido
- [ ] Testar aceite válido
- [ ] Testar recusa
- [ ] Testar convite expirado
- [ ] Testar aceite concorrente
- [ ] Testar atendimento confirmado
- [ ] Testar iniciar serviço
- [ ] Testar finalizar serviço
- [ ] Testar ocorrência
- [ ] Testar push Android
- [ ] Testar push iOS
- [ ] Testar sem internet
- [ ] Testar internet lenta
- [ ] Testar logout
- [ ] Testar reinstalação do app

Critério de pronto:

- [ ] Fluxo convite → aceite → atendimento → início → fim funciona em aparelho real
- [ ] Falhas são tratadas sem travar app
- [ ] Build final validado

---

### M12 — Publicação Android

Objetivo: publicar na Google Play.

- [ ] Criar conta Google Play Console
- [ ] Criar app
- [ ] Preencher nome
- [ ] Preencher descrição curta
- [ ] Preencher descrição completa
- [ ] Enviar ícone
- [ ] Enviar screenshots
- [ ] Informar política de privacidade
- [ ] Preencher declaração de dados
- [ ] Preencher classificação indicativa
- [ ] Criar build AAB assinado
- [ ] Enviar para teste interno
- [ ] Testar instalação pela Play Store
- [ ] Corrigir apontamentos
- [ ] Publicar produção

Critério de pronto:

- [ ] App disponível para instalação via Play Store
- [ ] Login e push funcionando no app publicado

---

### M13 — Publicação iOS

Objetivo: publicar na App Store.

- [ ] Criar conta Apple Developer
- [ ] Criar app no App Store Connect
- [ ] Configurar bundle id
- [ ] Preencher nome
- [ ] Preencher descrição
- [ ] Enviar screenshots iPhone
- [ ] Informar política de privacidade
- [ ] Preencher dados coletados
- [ ] Criar usuário de teste para Apple
- [ ] Enviar build para TestFlight
- [ ] Testar via TestFlight
- [ ] Enviar para revisão
- [ ] Responder rejeições, se houver
- [ ] Publicar produção

Critério de pronto:

- [ ] App aprovado na App Store
- [ ] App instala em iPhone pela loja
- [ ] Login e push funcionando

---

### M14 — Pós-publicação e monitoramento

Objetivo: acompanhar uso real.

- [ ] Monitorar erros de login
- [ ] Monitorar falhas de push
- [ ] Monitorar aceite de convite
- [ ] Monitorar tempo até aceite
- [ ] Monitorar início/fim não registrados
- [ ] Monitorar ocorrências abertas
- [ ] Coletar feedback das profissionais
- [ ] Corrigir bugs críticos
- [ ] Planejar versão 1.1

Critério de pronto:

- [ ] Primeiras profissionais usando em operação real
- [ ] Métricas básicas acompanhadas
- [ ] Bugs críticos priorizados

---

## 14. Métricas de sucesso

- [ ] Percentual de profissionais com app instalado
- [ ] Percentual de profissionais com push habilitado
- [ ] Taxa de abertura de convites
- [ ] Taxa de aceite
- [ ] Tempo médio até resposta do convite
- [ ] Percentual de atendimentos iniciados corretamente
- [ ] Percentual de atendimentos finalizados corretamente
- [ ] Quantidade de ocorrências abertas pelo app
- [ ] Redução de dependência de WhatsApp/manualidade

---

## 15. Riscos

### Risco 1 — App virar só “site embrulhado”

Mitigação:

- [ ] Criar layout mobile específico
- [ ] Usar navegação inferior
- [ ] Usar notificações
- [ ] Remover cara de dashboard web
- [ ] Priorizar fluxo de convite e atendimento

### Risco 2 — Push falhar

Mitigação:

- [ ] Logar falhas
- [ ] Manter fallback operacional via WhatsApp/manual no começo
- [ ] Criar rotina de teste de notificação
- [ ] Exibir convites pendentes claramente na home

### Risco 3 — Profissional não usar

Mitigação:

- [ ] Onboarding simples
- [ ] Botões grandes
- [ ] Menos texto
- [ ] Treinamento inicial
- [ ] Primeiro Android, depois iOS

### Risco 4 — Escopo crescer

Mitigação:

- [ ] Não incluir cliente
- [ ] Não incluir admin
- [ ] Não incluir payout
- [ ] Não incluir chat
- [ ] Não incluir avaliação bilateral

### Risco 5 — Quebrar regra crítica no frontend

Mitigação:

- [ ] Backend continua decidindo aceite
- [ ] Backend continua decidindo início/fim
- [ ] Backend continua validando ownership
- [ ] Frontend apenas chama API e exibe estado

---

## 16. Critério de sucesso da versão 1.0

A versão 1.0 será considerada pronta quando:

- [ ] Profissional conseguir instalar o app Android
- [ ] Profissional conseguir instalar o app iOS
- [ ] Profissional conseguir fazer login
- [ ] Profissional conseguir receber notificação de convite
- [ ] Profissional conseguir abrir convite pelo app
- [ ] Profissional conseguir aceitar ou recusar convite
- [ ] Backend impedir duplo aceite
- [ ] Profissional conseguir visualizar atendimento confirmado
- [ ] Profissional conseguir iniciar atendimento
- [ ] Profissional conseguir finalizar atendimento
- [ ] Profissional conseguir abrir ocorrência
- [ ] App estiver publicado na Play Store
- [ ] App estiver publicado na App Store
- [ ] Fluxo real tiver sido testado em aparelho físico

---

## 17. Ordem recomendada de execução

```text
M0  — Decisão e preparação
M1  — Layout mobile profissional
M2  — Convites
M3  — Atendimentos
M4  — Perfil, regiões e disponibilidade
M5  — Verificação documental
M6  — Ocorrências
M7  — Capacitor Android
M9  — Push notifications Android
M8  — Capacitor iOS
M9  — Push notifications iOS
M10 — Segurança e sessão
M11 — Testes operacionais
M12 — Publicação Android
M13 — Publicação iOS
M14 — Pós-publicação
```

Observação: na prática, a execução recomendada é **Android primeiro**, push no Android, depois iOS. Tentar Android e iOS simultâneo agora aumenta atrito sem necessidade.

---

## 18. Definição final

O app deve ser tratado como:

> **Aplicativo operacional da profissional para receber convites, responder chamados, acompanhar atendimentos, registrar início/fim e receber notificações.**

Não deve ser tratado como:

> **Nova versão mobile de todo o sistema.**

Essa distinção evita um erro grande de escopo.
