# Checkpoint — frontend mobile profissional antes do M7

## Objetivo
Consolidar o estado real do frontend mobile profissional antes de iniciar `M7 — Capacitor Android`, sem marcar validações manuais como concluídas quando ainda não foram executadas.

## Escopo auditado
- `AGENTS.md`
- `docs/05-api-scope.md`
- `docs/09-prd-app-profissional-capacitor.md`
- [App.tsx](/home/andre/projects/leidy-cleaner-services/apps/frontend/src/app/App.tsx)
- pasta `apps/frontend/src/pages/professional-mobile`
- componentes compartilhados:
  - [OcorrenciaForm.tsx](/home/andre/projects/leidy-cleaner-services/apps/frontend/src/features/ocorrencias/OcorrenciaForm.tsx)
  - [DisponibilidadeList.tsx](/home/andre/projects/leidy-cleaner-services/apps/frontend/src/features/profissional/disponibilidades/DisponibilidadeList.tsx)
  - [WhatsAppFloatingButton.tsx](/home/andre/projects/leidy-cleaner-services/apps/frontend/src/components/ui/WhatsAppFloatingButton.tsx)

## Implementado de M1 a M6

### M1 — shell mobile profissional
- layout mobile exclusivo
- navegação inferior
- header simples
- home mobile profissional
- cards/resumos operacionais
- toggle de ativa para chamados

Rotas/páginas principais:
- `/profissional/app`
- [ProfessionalMobileLayout.tsx](/home/andre/projects/leidy-cleaner-services/apps/frontend/src/layouts/ProfessionalMobileLayout.tsx)
- [ProfessionalMobileHomePage.tsx](/home/andre/projects/leidy-cleaner-services/apps/frontend/src/pages/professional-mobile/ProfessionalMobileHomePage.tsx)

### M2 — convites
- lista mobile de convites
- detalhe mobile do convite
- aceite
- recusa
- bloqueio visual contra clique duplo
- refresh do detalhe e da lista após ação

Rotas:
- `/profissional/app/convites`
- `/profissional/app/convites/:id`

### M3 — atendimentos
- lista mobile por status
- detalhe mobile do atendimento
- leitura de checkpoints
- ação de iniciar serviço
- ação de finalizar serviço
- tratamento de erros conhecidos de status/conflito

Rotas:
- `/profissional/app/atendimentos`
- `/profissional/app/atendimentos/:id`

### M4 — perfil, regiões e disponibilidade
- perfil profissional somente leitura
- edição de campos permitidos do perfil
- gestão de regiões atendidas
- gestão de disponibilidade semanal

Rotas:
- `/profissional/app/perfil`
- `/profissional/app/regioes`
- `/profissional/app/disponibilidade`

### M5 — verificação documental
- visualização do status da verificação
- visualização de observação/motivo de rejeição
- envio/reenvio de documentos conforme contrato atual
- validação de tipo/tamanho reaproveitada do fluxo web

Rota:
- `/profissional/app/verificacao`

### M6 — ocorrências
- lista mobile de ocorrências
- detalhe mobile de ocorrência
- abertura de nova ocorrência
- criação de ocorrência vinculada a atendimento
- seleção de tipo
- descrição
- envio usando o endpoint já existente

Rotas:
- `/profissional/app/ocorrencias`
- `/profissional/app/ocorrencias/nova`
- `/profissional/app/ocorrencias/:id`

## Rotas mobile profissionais atualmente presentes
- `/profissional/app`
- `/profissional/app/convites`
- `/profissional/app/convites/:id`
- `/profissional/app/atendimentos`
- `/profissional/app/atendimentos/:id`
- `/profissional/app/perfil`
- `/profissional/app/regioes`
- `/profissional/app/disponibilidade`
- `/profissional/app/verificacao`
- `/profissional/app/ocorrencias`
- `/profissional/app/ocorrencias/nova`
- `/profissional/app/ocorrencias/:id`

## O que ainda está pendente antes do M7

### Pendências de validação manual/operacional
- `M2`
  - validar convite expirado em fluxo real
  - validar convite já aceito por outra profissional
  - validar aceite concorrente manualmente
- `M3`
  - validar início de atendimento em fluxo real
  - validar finalização em fluxo real
  - validar persistência real dos checkpoints
- `M4`
  - validar impacto real de regiões/disponibilidade na elegibilidade calculada pelo backend
- `M5`
  - campo estruturado de `pendências` continua indisponível no DTO atual
- `M6`
  - validar criação de ocorrência em fluxo operacional real
  - validar erro de atendimento inválido/indisponível em cenário real

### Itens não implementados por decisão de escopo
- push notifications
- rotas/registro de dispositivo push
- qualquer configuração de Capacitor/Android/iOS
- app de cliente
- app admin
- chat
- payout
- split
- avaliação profissional → cliente

## Checklist manual recomendado antes do M7

### M2 — convites
- login como profissional
- abrir lista de convites
- abrir detalhe de convite ativo
- aceitar convite válido
- recusar convite válido
- tentar responder convite expirado
- tentar responder convite já aceito por outra profissional
- confirmar bloqueio contra clique duplo

### M3 — atendimentos
- abrir lista de atendimentos
- abrir detalhe de atendimento `CONFIRMADO`
- iniciar serviço
- tentar iniciar duas vezes
- finalizar serviço em atendimento `EM_EXECUCAO`
- tentar finalizar antes do início
- tentar finalizar duas vezes
- confirmar atualização dos checkpoints

### M4 — perfil, regiões e disponibilidade
- abrir perfil e salvar alteração válida
- tentar salvar alteração inválida
- listar regiões
- alterar regiões e salvar
- listar disponibilidades
- criar disponibilidade
- editar disponibilidade
- remover disponibilidade
- validar no backend se regiões/disponibilidade alteradas afetam elegibilidade como esperado

### M5 — verificação
- abrir status documental
- enviar documentos com payload válido
- reenviar documentos
- validar erro de tipo/tamanho de arquivo
- confirmar refetch do status após envio
- confirmar limitação atual: ausência de campo estruturado de `pendências`

### M6 — ocorrências
- abrir lista de ocorrências
- abrir detalhe de ocorrência
- criar nova ocorrência pela lista
- criar nova ocorrência a partir de um atendimento
- validar seleção de atendimento
- validar erro de atendimento inválido/sem acesso
- confirmar navegação ao detalhe após criação

## Componentes compartilhados alterados e riscos de regressão

### `OcorrenciaForm.tsx`
Mudanças observadas:
- passou a aceitar `initialAtendimentoId`
- passou a aceitar `submitLabel`

Riscos:
- o formulário web e o mobile agora compartilham mais comportamento
- se o tratamento de `defaultValues` mudar depois, pode afetar tanto o fluxo web quanto o mobile
- vale checar se o fluxo web continua com seleção inicial neutra quando não há `initialAtendimentoId`

### `DisponibilidadeList.tsx`
Mudanças observadas:
- suporte a `disableActions`
- bloqueio de edição/remoção enquanto mutações estão pendentes

Riscos:
- mudanças no estado de desabilitação podem afetar tanto o fluxo web quanto o mobile
- vale validar se edição/exclusão no web não ficou excessivamente bloqueada em cenários paralelos

### `WhatsAppFloatingButton.tsx`
Mudanças observadas:
- o botão flutuante fica oculto em qualquer rota `/profissional/app`

Riscos:
- é uma proteção boa para evitar sobreposição com a navegação mobile profissional
- vale validar visualmente que ele continua aparecendo nas áreas públicas e não some onde ainda é desejado

## Limitações conhecidas dos contratos DTO/API atuais
- verificação documental:
  - `GET /api/v1/verificacoes/minha` não expõe um campo estruturado de `pendências`
- atendimentos:
  - o DTO atual não expõe `observações` no detalhe mobile
- ocorrências:
  - a ocorrência atual expõe dados enxutos
  - no mobile, o atendimento relacionado fica resumido principalmente ao `atendimentoId`
  - não há anexos no contrato atual de ocorrência
- perfil:
  - o DTO atual não expõe todos os dados que poderiam ser úteis em uma tela de conta, como telefone

## Build e execução
- frontend build:
  - `cd apps/frontend && npm run build`
  - status: `PASS`
- backend:
  - nenhum teste backend foi executado neste checkpoint
  - motivo: a tarefa foi de auditoria/documentação, sem mudanças de backend

## Backend changes
- não houve mudança de backend neste checkpoint
- a auditoria confirma que o avanço mobile até M6 permaneceu focado no frontend

## Ready for M7?
**Recomendação: ainda não pronto para M7 como próxima etapa operacional sem uma rodada curta de validação manual.**

Motivos:
- M2 e M3 ainda têm pendências manuais explícitas em cenários críticos de concorrência/estado
- M4 ainda não tem confirmação operacional do impacto em elegibilidade
- M5 continua limitado pelo DTO de verificação
- M6 ainda carece de validação manual do fluxo real de criação de ocorrência

## Recomendação prática
Antes de iniciar `M7 — Capacitor Android`:
- executar a checklist manual acima no navegador mobile
- corrigir qualquer falha operacional encontrada
- só então congelar o fluxo web-mobile atual para empacotamento com Capacitor

Se a equipe optar por seguir mesmo assim:
- tratar `M7` como etapa técnica de empacotamento
- sem assumir que o fluxo operacional já está validado ponta a ponta
