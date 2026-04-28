# Frontend — Milestones completos com checklist

## Objetivo
Este documento organiza a construção de **todo o frontend** do projeto **Leidy Cleaner Services**, com checklist para marcar cada entrega concluída.

---

## Princípios
- [x] manter o frontend separado do backend dentro do monorepo
- [x] usar o backend como fonte de verdade para regras críticas
- [x] não jogar lógica de negócio sensível no frontend
- [x] priorizar fluxos reais do produto antes de polimento visual
- [x] construir primeiro o que dá suporte ao fluxo operacional principal

Fluxo central do produto:
**solicitação → seleção → convites → aceite → atendimento → pagamento → execução → avaliação**

---

## Situação atual resumida
O projeto já possui base de frontend criada, mas ainda não tem o frontend operacional completo.

Checklist de contexto atual:
- [x] frontend base/scaffold revisado
- [x] estrutura atual auditada antes de novas telas
- [x] dependências principais confirmadas
- [x] build do frontend validado

---

# Milestones do frontend

## F0 — Fundação do frontend
### Objetivo
Deixar a base do frontend organizada para crescimento real, sem virar bagunça.

### Entregas
- [x] revisar estrutura de pastas do `apps/frontend/src`
- [x] definir layout público
- [x] definir layout autenticado
- [x] definir sistema básico de rotas
- [x] padronizar consumo da API
- [x] padronizar tratamento de autenticação JWT no frontend
- [x] definir estrutura de `app/`
- [x] definir estrutura de `components/`
- [x] definir estrutura de `layouts/`
- [x] definir estrutura de `pages/`
- [x] definir estrutura de `features/`
- [x] definir estrutura de `services/`
- [x] definir estrutura de `routes/`
- [ ] definir estrutura de `types/` — Pendente: tipos seguem locais por feature, sem `src/types`.
- [x] criar base de tema visual alinhada à identidade do projeto
- [ ] criar componente base de botão — Parcial: existe `PublicButton`, falta botão base compartilhado da área app.
- [x] criar componente base de input
- [ ] criar componente base de select — Pendente: selects ainda são implementados inline.
- [x] criar componente base de textarea
- [ ] criar componente base de card — Pendente: cards ainda são específicos por feature/página.
- [ ] criar componente base de badge/status — Parcial: badges existem por feature, falta base compartilhada.
- [ ] criar componente base de modal/drawer — Pendente.
- [ ] criar componente base de tabela/listagem — Pendente.
- [ ] criar componente base de loading skeleton/spinner — Pendente.
- [ ] criar componente base de empty state — Pendente: estados vazios ainda são locais por página.

### Critério de pronto
- [x] frontend sobe limpo
- [x] rotas base organizadas
- [x] consumo da API centralizado
- [x] autenticação pronta para integração real com login

---

## F1 — Home pública e páginas institucionais
### Objetivo
Transformar o mock visual em uma home pública real e criar a camada pública do produto.

### Entregas
- [x] implementar home pública baseada no mock visual aprovado
- [x] implementar header responsivo
- [x] implementar hero principal
- [x] implementar seções de benefícios/como funciona
- [x] implementar CTA para cadastro/login
- [x] implementar seção explicando o fluxo do serviço
- [x] implementar footer
- [x] implementar página de login visual
- [x] implementar página de cadastro de cliente visual
- [x] implementar página de cadastro de profissional visual
- [x] implementar página 404 básica

### Critério de pronto
- [x] layout responsivo desktop/mobile
- [x] identidade visual coerente
- [x] home utilizável como vitrine real do produto
- [x] navegação pública funcionando

---

## F2 — Autenticação e sessão
### Objetivo
Conectar o frontend ao que já existe no backend para login e sessão do usuário.

### Entregas
- [x] integrar formulário de login com `POST /api/v1/auth/login`
- [x] persistir token JWT no frontend
- [x] carregar contexto do usuário com `GET /api/v1/auth/me`
- [x] proteger rotas autenticadas
- [x] redirecionar por perfil
- [x] implementar logout
- [x] tratar sessão expirada/401
- [x] exibir mensagens de erro de autenticação

### Critério de pronto
- [x] usuário consegue logar
- [x] frontend sabe quem está autenticado
- [x] rotas privadas protegidas
- [x] sessão inválida é tratada sem quebrar a aplicação

---

## F3 — Fluxo de cadastro real
### Objetivo
Ligar os formulários públicos ao backend de cadastro já existente.

### Entregas
- [x] integrar tela de cadastro de cliente
- [x] integrar tela de cadastro de profissional
- [x] implementar validação visual de formulário
- [x] exibir mensagens de erro vindas da API
- [ ] implementar redirecionamento pós-cadastro — Pendente: cadastro exibe sucesso, mas não redireciona automaticamente.
- [x] implementar feedback de sucesso

### Critério de pronto
- [x] cliente consegue criar conta pelo frontend
- [x] profissional consegue criar conta pelo frontend
- [x] erros de duplicidade/validação aparecem corretamente

---

## F4 — Dashboard base por perfil
### Objetivo
Criar a estrutura inicial das áreas logadas, sem ainda implementar todos os fluxos internos.

### Entregas
- [x] implementar layout autenticado
- [x] implementar sidebar/topbar
- [x] implementar menu por perfil
- [x] implementar dashboard inicial de cliente
- [x] implementar dashboard inicial de profissional
- [x] implementar dashboard inicial de admin
- [ ] implementar componente de status do usuário/perfil — Parcial: layout exibe nome/perfil, falta componente dedicado.
- [x] criar placeholders funcionais para áreas ainda não finalizadas

### Critério de pronto
- [x] cada perfil entra em sua área correta
- [x] navegação interna existe
- [x] estrutura suporta expansão dos módulos

---

## F5 — Área do cliente: endereços
### Objetivo
Entregar a primeira parte operacional da área do cliente.

### Entregas
- [x] implementar tela de listagem de endereços
- [x] implementar formulário de criação de endereço
- [x] implementar edição de endereço
- [x] implementar exclusão de endereço
- [x] implementar marcação visual de endereço principal
- [x] implementar tratamento de loading, erro e vazio
- [x] integrar com `POST /api/v1/enderecos`
- [x] integrar com `GET /api/v1/enderecos/meus`
- [x] integrar com `PUT /api/v1/enderecos/{id}`
- [x] integrar com `DELETE /api/v1/enderecos/{id}`

### Critério de pronto
- [x] cliente gerencia os próprios endereços pelo frontend
- [x] principal é exibido corretamente
- [x] UX mínima coerente

---

## F6 — Área do profissional: onboarding
### Objetivo
Entregar o fluxo de configuração da profissional no frontend.

### Entregas
- [x] implementar tela “meu perfil profissional”
- [x] implementar edição do perfil profissional
- [x] implementar seleção de regiões atendidas
- [x] implementar gestão de disponibilidades
- [x] implementar envio/cadastro de verificação documental
- [x] implementar consulta do status da própria verificação
- [x] exibir aprovação pendente/rejeitada/aprovada
- [x] integrar com `GET /api/v1/profissionais/me`
- [x] integrar com `PUT /api/v1/profissionais/me`
- [x] integrar com `POST /api/v1/profissionais/me/regioes`
- [x] integrar com `GET /api/v1/profissionais/me/regioes`
- [x] integrar com `POST /api/v1/profissionais/me/disponibilidades`
- [x] integrar com `GET /api/v1/profissionais/me/disponibilidades`
- [x] integrar com `PUT /api/v1/profissionais/me/disponibilidades/{id}`
- [x] integrar com `DELETE /api/v1/profissionais/me/disponibilidades/{id}`
- [x] integrar com `POST /api/v1/verificacoes/documentos`
- [x] integrar com `GET /api/v1/verificacoes/minha`
- [x] integrar com `GET /api/v1/regioes`

### Critério de pronto
- [x] profissional consegue completar seu onboarding pelo frontend
- [x] status da configuração fica visível
- [x] regiões/disponibilidades/documentos funcionam de ponta a ponta

---

## F7 — Área do cliente: solicitação de faxina
### Objetivo
Implementar o início do fluxo principal do produto no frontend.

### Entregas
- [x] implementar formulário de criação de solicitação
- [x] implementar escolha de endereço
- [x] implementar escolha de tipo de serviço
- [x] implementar data/hora desejada
- [x] implementar duração estimada
- [x] implementar observações
- [x] implementar listagem das solicitações do cliente
- [x] implementar tela de detalhe da solicitação
- [x] implementar cancelamento da solicitação quando permitido
- [x] integrar com `POST /api/v1/solicitacoes`
- [x] integrar com `GET /api/v1/solicitacoes/minhas`
- [x] integrar com `GET /api/v1/solicitacoes/{id}`
- [x] integrar com `PATCH /api/v1/solicitacoes/{id}/cancelar`

### Critério de pronto
- [x] cliente consegue criar e acompanhar sua solicitação
- [x] estados e erros ficam claros na UI

---

## F8 — Área do cliente: profissionais elegíveis e seleção
### Objetivo
Entregar a seleção de profissionais a partir da solicitação.

### Entregas
- [x] implementar tela com profissionais elegíveis
- [x] implementar cards/lista de profissionais
- [x] exibir experiência/nota/média
- [x] implementar seleção ordenada de até 3 profissionais
- [x] implementar feedback visual da ordem da escolha
- [x] persistir seleção
- [x] integrar com `GET /api/v1/solicitacoes/{id}/profissionais-disponiveis`
- [x] integrar com `POST /api/v1/solicitacoes/{id}/selecionados`

### Critério de pronto
- [x] cliente consegue escolher de 1 a 3 profissionais
- [x] frontend respeita a UX do limite
- [x] backend continua sendo a validação final

---

## F9 — Área da profissional: convites
### Objetivo
Entregar o módulo de convites da profissional.

### Entregas
- [x] implementar listagem de convites recebidos
- [x] implementar detalhe do convite
- [x] implementar ação de aceitar convite
- [x] implementar ação de recusar convite
- [x] implementar exibição de status do convite
- [x] implementar indicação de prazo/expiração quando aplicável
- [x] integrar com `GET /api/v1/convites/meus`
- [x] integrar com `GET /api/v1/convites/{id}`
- [x] integrar com `POST /api/v1/convites/{id}/aceitar`
- [x] integrar com `POST /api/v1/convites/{id}/recusar`

### Critério de pronto
- [x] profissional consegue visualizar e responder convites pelo frontend

---

## F10 — Área do cliente: pagamento
### Objetivo
Entregar a tela de pagamento alinhada ao backend e ao Asaas.

### Entregas
- [x] implementar tela de checkout/pagamento vinculada ao atendimento
- [x] exibir método de pagamento
- [x] exibir QR Code / Pix copia-e-cola / link / status
- [x] implementar polling ou refresh controlado de status quando necessário
- [x] implementar visual de “aguardando confirmação”
- [x] integrar com rota principal de checkout implementada no backend
- [x] integrar com `GET /api/v1/pagamentos/{id}`
- [x] integrar com `GET /api/v1/pagamentos/atendimento/{atendimentoId}`
- [x] integrar com `POST /api/v1/pagamentos/{id}/consultar-status`

### Critério de pronto
- [x] cliente consegue visualizar e acompanhar o pagamento
- [x] frontend não confirma pagamento por conta própria

---

## F11 — Área do cliente e profissional: atendimentos
### Objetivo
Entregar a experiência operacional de atendimento para ambos os lados.

### Entregas
- [x] implementar listagem “meus atendimentos”
- [x] implementar detalhe do atendimento
- [x] implementar exibição de checkpoints
- [x] implementar ação de iniciar atendimento (profissional)
- [x] implementar ação de finalizar atendimento (profissional)
- [x] implementar visualização do atendimento pelo cliente
- [x] integrar com `GET /api/v1/atendimentos/meus`
- [x] integrar com `GET /api/v1/atendimentos/{id}`
- [x] integrar com `GET /api/v1/atendimentos/{id}/checkpoints`
- [x] integrar com `POST /api/v1/atendimentos/{id}/iniciar`
- [x] integrar com `POST /api/v1/atendimentos/{id}/finalizar`

### Critério de pronto
- [x] execução do serviço pode ser acompanhada no frontend
- [x] profissional opera início/fim sem ambiguidade

---

## F12 — Área do cliente: avaliação
### Objetivo
Entregar o fechamento do fluxo principal com a avaliação da profissional.

### Entregas
- [x] implementar formulário de avaliação pós-atendimento finalizado
- [x] implementar nota de 1 a 5
- [x] implementar comentário opcional
- [x] implementar listagem de avaliações da profissional quando necessário
- [x] integrar com `POST /api/v1/avaliacoes`
- [x] integrar com `GET /api/v1/profissionais/{id}/avaliacoes`

### Critério de pronto
- [x] cliente consegue avaliar uma única vez após atendimento finalizado

---

## F13 — Área admin
### Objetivo
Entregar o básico do operacional administrativo no frontend.

### F13-A — Verificações e aprovação profissional
- [x] implementar listagem de verificações documentais
- [x] implementar detalhe de verificação
- [x] implementar análise de verificação
- [x] implementar rota administrativa de profissionais
- [x] implementar aprovação/rejeição de profissional por `PATCH /api/v1/profissionais/{id}/aprovacao`
- [x] integrar com `GET /api/v1/verificacoes`
- [x] integrar com `GET /api/v1/verificacoes/{id}`
- [x] integrar com `PATCH /api/v1/verificacoes/{id}/analisar`
- [x] implementar listagem de profissionais por `GET /api/v1/profissionais`

### Critério de pronto F13-A
- [x] admin consegue operar verificações pelo frontend
- [x] admin consegue alterar aprovação profissional pelo frontend
- [x] admin consegue listar profissionais pelo frontend

### F13-B — Ocorrências
- [x] implementar listagem de minhas ocorrências
- [x] implementar criação de ocorrência vinculada a atendimento
- [x] implementar detalhe de ocorrência autenticada
- [x] implementar listagem admin de ocorrências
- [x] implementar detalhe admin de ocorrência
- [x] implementar atualização admin de status de ocorrência
- [x] integrar com `POST /api/v1/ocorrencias`
- [x] integrar com `GET /api/v1/ocorrencias/meus`
- [x] integrar com `GET /api/v1/ocorrencias/{id}`
- [x] integrar com `GET /api/v1/ocorrencias`
- [x] integrar com `PATCH /api/v1/ocorrencias/{id}/status`

### Critério de pronto F13-B
- [x] usuário autenticado consegue listar, abrir e consultar ocorrências
- [x] admin consegue listar, consultar e atualizar status de ocorrências

### Entregas futuras
- [ ] implementar listagens operacionais mínimas conforme backend existente — Parcial: verificações, profissionais e ocorrências estão integrados.
- [ ] integrar com endpoints admin disponíveis — Parcial: faltam áreas admin além de verificações/profissionais/ocorrências.

---

## F14 — Polimento e UX
### Objetivo
Transformar o frontend de funcional em utilizável de verdade.

### Entregas
- [ ] implementar loading states consistentes — Parcial: fluxos principais têm loading, falta padrão global.
- [ ] implementar empty states — Parcial: fluxos principais têm vazio, falta padrão global.
- [ ] implementar toasts/feedbacks — Parcial: `FormAlert` cobre telas, falta sistema de toast.
- [ ] implementar tratamento elegante de erro — Parcial: erros de API aparecem, falta revisão global.
- [ ] implementar estados de sucesso — Parcial: vários fluxos têm sucesso, falta padronização.
- [ ] refinar responsividade — Parcial: layout é responsivo, falta rodada final de polimento.
- [ ] revisar acessibilidade básica — Pendente como revisão final.
- [ ] revisar textos e consistência visual — Pendente como revisão final.
- [ ] revisar navegação e proteção de rotas — Parcial: rotas protegidas existem, falta revisão final.

### Critério de pronto
- [ ] frontend fica coerente, navegável e menos cru

---

# Ordem recomendada de execução
- [ ] F0 — Fundação do frontend
- [x] F1 — Home pública e páginas institucionais
- [x] F2 — Autenticação e sessão
- [ ] F3 — Cadastro real
- [ ] F4 — Dashboard base por perfil
- [x] F5 — Endereços do cliente
- [x] F6 — Onboarding profissional
- [x] F7 — Solicitação de faxina
- [x] F8 — Profissionais elegíveis e seleção
- [x] F9 — Convites
- [x] F10 — Pagamento
- [x] F11 — Atendimentos
- [x] F12 — Avaliação
- [ ] F13 — Admin
- [ ] F14 — Polimento

---

# Observações importantes
- [x] não construir primeiro telas bonitas de dashboard antes dos fluxos reais
- [x] não jogar validação crítica no frontend
- [x] frontend deve refletir o backend, não reinventar regra de negócio
- [x] cada milestone deve terminar com build funcionando
- [x] preferir avanço incremental com revisão visual constante

---

# Definição de pronto do frontend
- [x] a home pública está alinhada ao mock
- [x] login/cadastro estão conectados ao backend
- [x] cliente consegue percorrer o fluxo principal do produto
- [x] profissional consegue operar onboarding, convites e atendimento
- [x] pagamento pode ser acompanhado pelo frontend sem violar a regra do webhook
- [x] avaliação funciona ao final do serviço
- [x] admin tem pelo menos o básico operacional
