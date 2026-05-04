# PRD — Melhorias Solicitadas pela Cliente

Projeto: **Leidy Cleaner Services**  
Documento: **PRD complementar de mudanças e milestones**  
Versão: `0.1`  
Status: **rascunho para revisão técnica e aprovação de escopo**

---

## 1. Objetivo

Este documento organiza as melhorias solicitadas pela cliente em um conjunto de entregas planejadas, com critérios de aceite, riscos e milestones.

As mudanças foram divididas em dois grupos:

1. **Melhorias compatíveis com o fluxo atual do MVP**
   - Exibição ordenada dos horários das profissionais.
   - Exibição para a profissional apenas do valor que ela recebe.
   - Simulação administrativa de valores para 4h, 6h e 8h.
   - Ordenação das profissionais por avaliação.
   - Exibição da média, total de avaliações e leitura das avaliações.
   - Análise e implementação controlada de imagens/selfie em base64.

2. **Mudança estrutural de fluxo financeiro**
   - Novo fluxo proposto: `solicita → paga → seleciona profissional → envia convite`.
   - Possibilidade de serviço pago virar crédito.
   - Esta mudança **não deve ser implementada diretamente sem redesenho financeiro**, pois altera regras centrais do produto.
   - Nota de análise: análise técnica concluída; esta mudança exige PRD separado e não pode ser tratada como simples ajuste de UI. Requer novo modelo de reserva/crédito, alteração do vínculo atual entre `Pagamento` e `AtendimentoFaxina`, e regras explícitas de expiração, utilização e refund.

---

## 2. Contexto do produto

A Leidy Cleaner Services é uma plataforma operacional de intermediação de serviços de limpeza, com três perfis principais:

- Cliente
- Profissional
- Administrador

O fluxo atual do MVP é:

```text
cliente cria solicitação
→ seleciona até 3 profissionais elegíveis
→ sistema envia convites
→ primeira profissional que aceita gera o atendimento
→ cliente paga
→ webhook confirma pagamento
→ profissional executa
→ cliente avalia
```

Esse fluxo deve continuar sendo considerado o fluxo principal até que exista uma decisão formal sobre pré-pagamento/crédito.

---

## 3. Pedido da cliente

A cliente solicitou:

1. Melhorar exibição dos horários das profissionais e colocar em ordem da semana.
2. Mostrar para a profissional apenas o preço que ela recebe.
3. Alterar fluxo para:
   ```text
   solicita → paga → seleciona profissional → depois convite é enviado
   ```
   com possibilidade de o serviço pago ficar como crédito.
4. Imagens serão subidas em base64, e não por URL, com possibilidade de tirar selfie.
5. No painel admin, mostrar valores simulados para 4h, 6h e 8h.
6. Mostrar profissionais por ordem de avaliações.
7. Quando a profissional aparecer, mostrar média de avaliações.
8. Se o usuário quiser, permitir ler as avaliações da profissional.

---

## 4. Decisões iniciais de escopo

| Item | Decisão | Motivo |
|---|---|---|
| Horários ordenados por semana | **Implementar agora** | Melhoria simples de UX, sem alterar regra de negócio. |
| Profissional ver apenas valor recebido | **Implementar agora** | Protege margem/comissão e melhora clareza para profissional. |
| Simulação admin 4h/6h/8h | **Implementar agora** | Útil para operação, desde que não gere cobrança real. |
| Ordenação por avaliações | **Implementar agora com cuidado** | Pode ser ranking simples por dados já existentes, sem virar “ranking avançado”. |
| Leitura de avaliações | **Implementar agora** | Compatível com avaliação unilateral cliente → profissional. |
| Base64 e selfie | **Implementar em milestone própria** | Envolve dados sensíveis, tamanho de payload, validação e armazenamento. |
| Pagar antes de selecionar profissional | **Não implementar direto** | Muda a regra central de pagamento vinculado ao atendimento. Exige redesign. |
| Crédito/saldo de serviço pago | **Fase futura / análise técnica** | Introduz comportamento de carteira/crédito, fora do escopo original do MVP. |

---

## 5. Princípios obrigatórios

Estas mudanças não podem quebrar:

- Pagamento confirmado apenas pelo backend via webhook.
- Frontend nunca confirma pagamento por conta própria.
- Seleção de no máximo 3 profissionais.
- Aceite transacional: primeira profissional que aceitar validamente ganha.
- Avaliação unilateral: apenas cliente avalia profissional.
- Sem split de pagamento.
- Sem repasse automático para profissional.
- Sem profissional avaliar cliente.
- Sem mover regra crítica para o frontend.
- Sem expor comissão, margem ou taxa da empresa para a profissional.

---

# 6. Requisitos funcionais

## RF01 — Ordenação e exibição dos horários das profissionais

### Descrição

As disponibilidades das profissionais devem ser exibidas em ordem natural da semana:

1. Segunda-feira
2. Terça-feira
3. Quarta-feira
4. Quinta-feira
5. Sexta-feira
6. Sábado
7. Domingo

### Comportamento esperado

Sempre que a disponibilidade da profissional aparecer, o sistema deve exibir os dias ordenados e com faixa de horário clara.

Exemplo:

```text
Segunda-feira — 08:00 às 12:00
Quarta-feira — 13:00 às 17:00
Sábado — 09:00 às 13:00
```

### Telas afetadas

- Perfil da profissional.
- Onboarding profissional.
- Tela de profissionais elegíveis.
- Detalhe da profissional, se existir.
- Painel admin, se mostrar disponibilidade.

### Critérios de aceite

- [x] Dias aparecem sempre na ordem correta da semana.
- [x] Horários aparecem no formato `HH:mm`.
- [x] Disponibilidades inativas não aparecem em tela pública/cliente.
- [x] Quando não houver horários, mostrar estado vazio claro.
- [x] Não alterar a regra backend de elegibilidade.

### Nota de implementação

2026-05-03: Implementado helper frontend centralizado para mapear `diaSemana`, ordenar disponibilidades de segunda a domingo e formatar faixas como `Segunda-feira, 08:00 às 12:00`. Aplicado nas telas profissionais que exibem disponibilidade; o backend não foi alterado.

---

## RF02 — Profissional vê apenas o valor que recebe

### Descrição

Nas telas do perfil profissional, convites e atendimentos, a profissional deve ver somente o valor estimado ou real que ela receberá pelo serviço.

Ela não deve ver:

- valor bruto pago pelo cliente;
- percentual de comissão da agência;
- taxa de gateway;
- margem da empresa;
- valor líquido da empresa.

### Campo preferencial

Usar o campo existente:

```text
valorEstimadoProfissional
```

Quando houver atendimento finalizado e o valor definitivo existir, usar o valor definitivo previsto para repasse, se já existir no domínio. Caso não exista, manter `valorEstimadoProfissional`.

### Telas afetadas

- Convites da profissional.
- Detalhe do convite.
- Meus atendimentos da profissional.
- Detalhe do atendimento da profissional.
- Histórico da profissional.

### Critérios de aceite

- [x] Profissional visualiza apenas o valor que ela recebe.
- [x] Admin continua podendo visualizar valores operacionais quando permitido.
- [x] Cliente continua vendo o preço do serviço quando aplicável.
- [x] Nenhuma tela profissional expõe comissão ou margem interna.
- [x] Testar com usuário `PROFISSIONAL`, `CLIENTE` e `ADMIN`.

### Nota de implementação

2026-05-03: Implementada visibilidade financeira por perfil para convites e atendimentos profissionais. O backend passou a retornar para profissionais apenas `valorEstimadoProfissional` nos DTOs de convites/atendimentos, ocultando `valorServico` e `percentualComissaoAgencia`; as telas profissionais exibem o valor com rótulos como "Você recebe" e "Valor para você". Fluxos de pagamento, webhook, split, repasse e payout não foram alterados.

---

## RF03 — Simulação de valores no painel admin para 4h, 6h e 8h

### Descrição

O painel admin deve exibir valores simulados/referenciais para serviços de:

- 4 horas
- 6 horas
- 8 horas

Essa informação serve para orientação operacional, conferência e tomada de decisão interna.

### Importante

Esses valores são **simulados**. Eles não devem criar cobrança, atendimento, pagamento ou alteração de solicitação.

### Comportamento esperado

No painel admin, exibir um bloco ou card com:

| Duração | Valor cliente | Valor profissional | Comissão/margem estimada |
|---|---:|---:|---:|
| 4h | R$ X | R$ Y | R$ Z |
| 6h | R$ X | R$ Y | R$ Z |
| 8h | R$ X | R$ Y | R$ Z |

### Critérios de aceite

- [x] Admin visualiza simulação para 4h, 6h e 8h.
- [x] A tela deixa claro que são valores simulados.
- [x] Nenhum pagamento é criado.
- [x] Nenhum atendimento é criado.
- [x] Nenhum status de solicitação é alterado.
- [x] Fórmula de cálculo fica centralizada em helper/service claro.

> Nota: Implementado em 2026-05-04. Adicionado bloco de referência no painel admin de preços com simulação de 4h/6h/8h baseada na configuração de preço ativa; apenas visual, sem cobrança ou reserva.

---

## RF04 — Ordenar profissionais por avaliações

### Descrição

A listagem de profissionais elegíveis deve priorizar profissionais com melhor avaliação.

### Regra de ordenação proposta

Ordenar por:

1. `notaMedia` decrescente.
2. `totalAvaliacoes` decrescente.
3. `nomeExibicao` crescente.

Exemplo:

```text
1. Maria — 4.9 ⭐ — 42 avaliações
2. Ana — 4.9 ⭐ — 18 avaliações
3. Carla — 4.7 ⭐ — 25 avaliações
```

### Observação importante

Isso é uma ordenação simples por avaliação, não um sistema avançado de ranking. Não deve virar regra opaca ou algoritmo complexo neste momento.

### Critérios de aceite

- [ ] Lista de profissionais elegíveis aparece ordenada por média de avaliação.
- [ ] Empate por nota considera maior número de avaliações.
- [ ] Empate final considera nome.
- [ ] Profissionais sem avaliação aparecem abaixo das avaliadas.
- [ ] Backend continua validando elegibilidade.
- [ ] Frontend não inventa profissionais nem altera disponibilidade.

---

## RF05 — Card da profissional com média e total de avaliações

### Descrição

Quando a profissional aparecer para o cliente, o card deve mostrar informações de confiança.

### Dados exibidos

- Nome de exibição.
- Anos de experiência, se disponível.
- Média de avaliação.
- Total de avaliações.
- Indicação visual para profissional sem avaliações.

### Exemplo

```text
Maria Oliveira
4 anos de experiência
⭐ 4.8 (23 avaliações)
```

Para profissional sem avaliações:

```text
Maria Oliveira
4 anos de experiência
Ainda sem avaliações
```

### Critérios de aceite

- [ ] Card mostra `notaMedia` quando existir.
- [ ] Card mostra `totalAvaliacoes`.
- [ ] Card trata profissional sem avaliação sem quebrar layout.
- [ ] Dados vêm do backend ou DTO existente.
- [ ] Não criar avaliação falsa/mock.

---

## RF06 — Permitir leitura das avaliações da profissional

### Descrição

O cliente deve poder abrir a lista de avaliações de uma profissional antes de selecioná-la.

### Endpoint previsto

```http
GET /api/v1/profissionais/{id}/avaliacoes
```

### Comportamento esperado

No card da profissional, exibir link/botão:

```text
Ler avaliações
```

Ao clicar, abrir modal/drawer/página com:

- nota;
- comentário;
- data;
- nome do cliente de forma segura, se aplicável;
- ou nome anonimizado, se preferível.

### Critérios de aceite

- [ ] Botão aparece apenas se `totalAvaliacoes > 0`.
- [ ] Avaliações são carregadas sob demanda.
- [ ] Modal/drawer tem loading, erro e empty state.
- [ ] Comentários longos não quebram layout.
- [ ] Não expor dados sensíveis do cliente.
- [ ] Manter avaliação unilateral: cliente avalia profissional.

---

## RF07 — Imagens em base64 e selfie

### Descrição

A cliente solicitou que imagens sejam subidas em base64, e não via URL, com possibilidade de tirar selfie.

Isso afeta principalmente:

- foto de perfil;
- documentos de verificação;
- selfie de verificação;
- evidências/checkpoints, se futuramente houver foto.

### Decisão técnica inicial

Implementar em uma fase própria, com validações fortes.

### Regras mínimas

- Aceitar apenas tipos permitidos:
  - `image/jpeg`
  - `image/png`
  - `image/webp`, se suportado
- Limitar tamanho máximo por imagem.
- Exibir preview antes do envio.
- Permitir remover/substituir imagem.
- Para selfie:
  - usar câmera do dispositivo via navegador;
  - pedir permissão;
  - permitir capturar novamente;
  - permitir fallback por upload de arquivo.
- Backend deve validar o payload, não confiar no frontend.

### Risco

Base64 aumenta o tamanho do payload e pode sobrecarregar banco, API e navegador. É aceitável como solução provisória de MVP, mas não é a melhor solução definitiva.

### Critérios de aceite

- [x] Upload por arquivo converte imagem para base64 no frontend.
- [x] Selfie pode ser capturada pela câmera.
- [x] Usuário vê preview antes de enviar.
- [x] Backend valida tipo e tamanho.
- [x] Payload inválido retorna erro claro.
- [x] Dados sensíveis não são expostos em listagens públicas.

### Nota de implementação

2026-05-04: Implementado upload de imagens em Base64 com captura de selfie via câmera. Backend valida MIME types (JPEG, PNG, WebP), tamanho máximo 2MB após decodificação, e formato Base64. Frontend converte arquivos selecionados para data URLs Base64, permite captura de selfie com `capture="environment"`, exibe preview e permite remoção. Colunas de URL alteradas para TEXT via migração V16. Solução provisória para MVP; migração para S3 recomendada futuramente.
- [ ] Documentar que storage externo deve ser a solução futura.

---

## RF08 — Análise do fluxo de pré-pagamento e crédito

### Descrição

A cliente propôs o novo fluxo:

```text
cliente solicita
→ cliente paga
→ cliente seleciona profissional
→ sistema envia convite
→ se nenhuma aceitar, o serviço pago pode ficar como crédito
```

### Situação

Esta mudança **não deve entrar como simples ajuste de tela**. Ela muda o fluxo financeiro e operacional.

### Problemas que precisam ser resolvidos

- Como criar pagamento antes de existir `AtendimentoFaxina`.
- Como relacionar pagamento com uma solicitação ainda sem profissional.
- Como tratar caso nenhuma profissional aceite.
- Como tratar cancelamento pelo cliente.
- Como tratar expiração.
- Como tratar crédito.
- Como tratar reembolso.
- Como impedir cobrança duplicada.
- Como auditar saldo/crédito.
- Como mostrar isso para admin.
- Como manter webhook como fonte de verdade.

### Opções possíveis

#### Opção A — Manter fluxo atual

```text
solicitação → seleção → convite → aceite → atendimento → pagamento
```

Mais seguro para o MVP.

#### Opção B — Pré-autorização / intenção de pagamento

Cliente inicia pagamento, mas cobrança só é confirmada/capturada quando atendimento existir.

Depende de suporte do gateway e precisa ser validado tecnicamente.

#### Opção C — Crédito interno

Cliente paga e o valor vira crédito até ser usado em atendimento futuro.

Mais complexo. Exige novo módulo financeiro.

### Decisão recomendada

Para o MVP, manter fluxo atual.

Se a cliente insistir em pagamento antes da seleção, criar uma nova fase chamada:

```text
Fase futura — Pré-pagamento e crédito operacional
```

Essa fase exige PRD próprio, migrations, endpoints, testes e regras contábeis.

### Critérios de aceite para análise

- [ ] Mapear impacto no domínio.
- [ ] Definir se haverá entidade `CreditoCliente` ou equivalente.
- [ ] Definir estados do crédito.
- [ ] Definir relação entre `SolicitacaoFaxina`, `Pagamento` e `AtendimentoFaxina`.
- [ ] Definir regra de expiração.
- [ ] Definir regra de reembolso.
- [ ] Definir telas admin de controle.
- [ ] Definir testes obrigatórios.
- [ ] Obter aprovação explícita antes de implementar.

---

# 7. Requisitos não funcionais

## RNF01 — Segurança

- Não expor dados sensíveis.
- Não expor margem/comissão para profissional.
- Não confiar em base64 recebido sem validação.
- Não aceitar imagem gigante.
- Não permitir acesso a avaliações/dados fora da regra de autorização.
- Manter JWT e ownership checks.

## RNF02 — Performance

- Avaliações devem ser carregadas sob demanda.
- Imagens base64 devem ter limite de tamanho.
- Não carregar imagens/documentos sensíveis em listagens.
- Ordenação de profissionais deve evitar N+1.
- Listagens futuras devem considerar paginação.

## RNF03 — Manutenibilidade

- Não criar lógica financeira espalhada no frontend.
- Manter regras de negócio em services backend.
- Usar DTOs.
- Não expor entidades diretamente.
- Criar migrations apenas quando necessário.
- Não editar migrations antigas já aplicadas.

## RNF04 — UX

- Estados de loading, erro e vazio.
- Mensagens em pt-BR.
- Botões claros.
- Feedback após ações.
- Não deixar usuário preso sem saber o que aconteceu.

---

# 8. Milestones das mudanças

## C0 — Alinhamento e proteção de escopo

### Objetivo

Garantir que as melhorias sejam implementadas sem quebrar o fluxo principal do MVP.

### Entregas

- [ ] Atualizar documentação com esta PRD complementar.
- [ ] Confirmar quais mudanças entram agora.
- [ ] Separar pré-pagamento/crédito como análise futura.
- [ ] Confirmar campos atuais disponíveis nos DTOs.
- [ ] Confirmar endpoints existentes para avaliações.
- [ ] Confirmar telas onde disponibilidade aparece.
- [ ] Confirmar telas onde valores financeiros aparecem para profissional.

### Critério de pronto

- [ ] Escopo aprovado.
- [ ] Nenhuma regra crítica foi alterada sem decisão explícita.
- [ ] Lista de arquivos/módulos afetados está clara.

---

## C1 — Disponibilidade: ordenação e exibição dos horários

### Objetivo

Melhorar a leitura dos horários das profissionais.

### Backend

- [x] Confirmar enum/formato de `diaSemana`.
- [x] Garantir que endpoint retorna disponibilidade suficiente.
- [x] Não alterar regra de elegibilidade.

### Frontend

- [x] Criar helper de ordenação de dias.
- [x] Criar helper de formatação de horário.
- [x] Aplicar nos componentes existentes.
- [x] Criar empty state para sem disponibilidade.

### Testes

- [x] Testar dias fora de ordem vindos da API.
- [x] Testar profissional sem disponibilidade.
- [x] Testar horários no formato correto.

### Critério de pronto

- [x] Horários aparecem ordenados e legíveis em todas as telas relevantes.

---

## C2 — Visibilidade financeira por perfil

### Objetivo

Garantir que cada perfil veja apenas os valores apropriados.

### Backend

- [x] Revisar DTOs de convites e atendimentos para profissional.
- [x] Garantir que DTO profissional não retorne comissão/margem interna.
- [x] Garantir que DTO admin possa manter dados operacionais, se autorizado.

### Frontend

- [x] Ajustar cards/listagens da profissional.
- [x] Exibir somente `valorEstimadoProfissional` ou campo equivalente.
- [x] Remover qualquer exibição de valor bruto/comissão em telas da profissional.

### Testes

- [x] Login como profissional.
- [x] Login como admin.
- [x] Login como cliente.
- [x] Conferir valores visíveis por perfil.

### Critério de pronto

- [x] Profissional não vê valor bruto nem comissão.
- [x] Admin continua com visão operacional.

---

## C3 — Simulação admin de valores 4h, 6h e 8h

### Objetivo

Dar suporte operacional ao admin para visualizar valores simulados por duração.

### Backend

Opção preferencial:

- [ ] Criar endpoint de simulação se a regra de preço estiver no backend.

Exemplo:

```http
GET /api/v1/admin/precos/simulacao
```

Resposta sugerida:

```json
{
  "success": true,
  "data": [
    {
      "duracaoHoras": 4,
      "valorCliente": 0,
      "valorProfissional": 0,
      "comissaoAgencia": 0
    }
  ]
}
```

Opção alternativa:

- [ ] Implementar helper frontend temporário se ainda não houver regra oficial no backend.

### Frontend

- [ ] Criar card/tabela no painel admin.
- [ ] Exibir label “valores simulados”.
- [ ] Não criar pagamento real.

### Testes

- [ ] Verificar visual para 4h, 6h e 8h.
- [ ] Confirmar que nenhuma cobrança é criada.
- [ ] Confirmar que nenhum status muda.

### Critério de pronto

- [ ] Admin vê simulações sem efeito colateral operacional.

---

## C4 — Profissionais por avaliação e card enriquecido

### Objetivo

Melhorar a decisão do cliente ao escolher profissionais.

### Backend

- [ ] Confirmar se `notaMedia` e `totalAvaliacoes` já retornam no endpoint de elegíveis.
- [ ] Se não retornarem, adicionar ao DTO.
- [ ] Preferencialmente ordenar no backend por:
  - `notaMedia DESC`
  - `totalAvaliacoes DESC`
  - `nomeExibicao ASC`
- [ ] Evitar N+1 ao buscar avaliações/notas.

### Frontend

- [ ] Exibir média e total de avaliações no card.
- [ ] Exibir estado “ainda sem avaliações”.
- [ ] Manter seleção de 1 a 3 profissionais.
- [ ] Não alterar validação crítica no frontend.

### Testes

- [ ] Profissional com alta nota aparece antes.
- [ ] Empate por nota usa total de avaliações.
- [ ] Profissional sem avaliação aparece corretamente.
- [ ] Seleção de até 3 continua funcionando.

### Critério de pronto

- [ ] Cliente vê profissionais ordenadas e com indicadores de avaliação.

---

## C5 — Leitura das avaliações da profissional

### Objetivo

Permitir que o cliente leia avaliações antes de selecionar a profissional.

### Backend

- [ ] Confirmar endpoint:
  ```http
  GET /api/v1/profissionais/{id}/avaliacoes
  ```
- [ ] Garantir autorização adequada.
- [ ] Retornar DTO seguro.
- [ ] Não expor dados sensíveis do cliente.
- [ ] Considerar paginação se necessário.

### Frontend

- [ ] Adicionar botão “Ler avaliações”.
- [ ] Abrir modal/drawer/página.
- [ ] Carregar avaliações sob demanda.
- [ ] Exibir loading, erro e vazio.
- [ ] Permitir fechar modal sem travar tela.

### Testes

- [ ] Profissional com avaliações.
- [ ] Profissional sem avaliações.
- [ ] Erro de API.
- [ ] Layout com comentário longo.
- [ ] Mobile.

### Critério de pronto

- [ ] Cliente consegue ler avaliações sem sair do fluxo de seleção.

---

## C6 — Base64 e selfie

### Objetivo

Permitir captura/envio de imagens em base64 com segurança mínima.

### Subfase C6.1 — Análise técnica

- [ ] Mapear campos atuais de imagem/documento.
- [ ] Verificar se banco suporta payload base64 sem risco imediato.
- [ ] Definir limite máximo por imagem.
- [ ] Definir tipos aceitos.
- [ ] Definir se base64 será salvo no banco ou convertido para arquivo no backend.
- [ ] Definir impacto em DTOs.
- [ ] Definir impacto em migrations.

### Subfase C6.2 — Upload base64

- [ ] Criar componente de upload com preview.
- [ ] Converter imagem para base64.
- [ ] Validar tipo/tamanho no frontend.
- [ ] Validar tipo/tamanho no backend.
- [ ] Salvar de forma provisória.
- [ ] Exibir erro amigável.

### Subfase C6.3 — Selfie

- [ ] Criar componente de captura por câmera.
- [ ] Pedir permissão do navegador.
- [ ] Permitir capturar novamente.
- [ ] Permitir fallback para upload.
- [ ] Enviar base64 para backend.
- [ ] Validar payload.

### Testes

- [ ] Upload JPEG válido.
- [ ] Upload PNG válido.
- [ ] Arquivo inválido.
- [ ] Arquivo acima do tamanho.
- [ ] Permissão de câmera negada.
- [ ] Captura em mobile.
- [ ] Substituição de imagem.
- [ ] Remoção de imagem.

### Critério de pronto

- [ ] Imagens funcionam em base64 com validação.
- [ ] Selfie funciona ou tem fallback claro.
- [ ] Não há exposição indevida de dados sensíveis.

---

## C7 — Análise de pré-pagamento e crédito

### Objetivo

Avaliar com segurança a mudança de fluxo solicitada pela cliente.

### Entregas

- [ ] Documentar fluxo atual.
- [ ] Documentar fluxo proposto.
- [ ] Mapear conflitos com pagamento vinculado ao atendimento.
- [ ] Propor modelo de crédito, se aprovado.
- [ ] Definir estados novos.
- [ ] Definir novas entidades.
- [ ] Definir migrations.
- [ ] Definir endpoints.
- [ ] Definir telas admin.
- [ ] Definir regras de cancelamento, expiração e reembolso.
- [ ] Definir testes obrigatórios.
- [ ] Decidir: implementar agora, depois, ou rejeitar.

### Possíveis entidades futuras

Apenas se a fase for aprovada:

```text
CreditoCliente
TransacaoCredito
SolicitacaoPagamentoAntecipado
```

### Possíveis estados de crédito

```text
DISPONIVEL
RESERVADO
UTILIZADO
EXPIRADO
REEMBOLSADO
CANCELADO
```

### Critério de pronto

- [ ] Documento de decisão aprovado.
- [ ] Nenhum código de pré-pagamento/crédito implementado sem aprovação.
- [ ] Impacto financeiro entendido.

---

## C8 — QA, regressão e documentação

### Objetivo

Garantir que as mudanças não quebraram o fluxo operacional.

### Testes manuais obrigatórios

- [ ] Cliente cria solicitação.
- [ ] Cliente vê profissionais elegíveis.
- [ ] Profissionais aparecem por avaliação.
- [ ] Cliente lê avaliações.
- [ ] Cliente seleciona até 3 profissionais.
- [ ] Convites são enviados.
- [ ] Profissional vê convite com apenas valor recebido.
- [ ] Profissional aceita convite.
- [ ] Atendimento é criado.
- [ ] Pagamento continua vinculado ao atendimento.
- [ ] Webhook continua sendo fonte de verdade.
- [ ] Admin vê simulação 4h/6h/8h.
- [ ] Admin não cria cobrança ao visualizar simulação.
- [ ] Disponibilidades aparecem em ordem.
- [ ] Upload/selfie funciona, se C6 for implementado.

### Comandos esperados

Frontend:

```bash
cd apps/frontend
npm run build
```

Backend, se houver alteração:

```bash
cd apps/backend
./mvnw test
```

### Critério de pronto

- [ ] Build frontend passa.
- [ ] Testes backend passam quando backend for alterado.
- [ ] Fluxo principal continua funcionando.
- [ ] Documentação atualizada.
- [ ] Nenhuma regra crítica foi quebrada.

---

# 9. Ordem recomendada de implementação

## Implementar agora

1. **C1 — Disponibilidade ordenada**
2. **C2 — Profissional vê apenas valor recebido**
3. **C3 — Simulação admin 4h/6h/8h**
4. **C4 — Ordenação/card por avaliação**
5. **C5 — Leitura de avaliações**
6. **C8 — QA parcial**

## Implementar depois, com milestone própria

7. **C6 — Base64 e selfie**

## Apenas analisar antes de codar

8. **C7 — Pré-pagamento e crédito**

---

# 10. Riscos

## R1 — Base64 pesado

Base64 pode deixar a aplicação lenta, aumentar tráfego e causar payloads grandes demais.

Mitigação:

- limitar tamanho;
- comprimir imagem no frontend se necessário;
- não carregar base64 em listagens;
- migrar futuramente para storage externo.

## R2 — Exposição de dados financeiros

Profissional não deve ver margem da empresa.

Mitigação:

- DTO separado por perfil;
- testes por papel;
- revisão das telas.

## R3 — Ranking indevido

Ordenar por avaliação pode virar “ranking avançado” se começar a misturar critérios não definidos.

Mitigação:

- manter regra simples;
- documentar ordenação;
- não criar algoritmo opaco.

## R4 — Crédito vira carteira financeira

Pré-pagamento com crédito cria uma lógica financeira nova.

Mitigação:

- não implementar sem PRD próprio;
- definir entidade, estados, auditoria e reembolso;
- validar impacto contábil/operacional.

## R5 — Avaliações expondo dados de clientes

Comentários podem expor dados pessoais.

Mitigação:

- DTO seguro;
- ocultar dados sensíveis;
- considerar nome anonimizado.

---

# 11. Fora do escopo desta PRD complementar

- Split de pagamento.
- Repasse automático para profissional.
- Carteira financeira completa sem nova decisão.
- Avaliação da profissional sobre o cliente.
- Chat interno.
- App mobile.
- Ranking avançado com algoritmo complexo.
- Mudança do gateway Asaas.
- Confirmação de pagamento pelo frontend.

---

# 12. Definition of Done geral

Uma mudança só será considerada pronta quando:

- [ ] A regra de negócio principal continua correta.
- [ ] O backend continua sendo fonte de verdade.
- [ ] O frontend apenas guia a UX.
- [ ] Não há quebra de autorização.
- [ ] Não há exposição indevida de dados sensíveis.
- [ ] Build frontend passa.
- [ ] Testes backend passam se backend foi alterado.
- [ ] Migrations, se houver, são novas e seguras.
- [ ] API mantém formato de resposta padrão.
- [ ] Estados de loading, erro e vazio existem.
- [ ] Documentação foi atualizada.

---

# 13. Prompt base para Codex

```text
Implement the approved client-requested improvements from docs/08-prd-melhorias-cliente.md.

Do not implement prepayment/credit yet.
Do not change the core flow:
request -> select professionals -> invitations -> first valid acceptance -> attendance -> payment -> webhook confirmation.

Approved scope:
1. Sort and format professional availability by weekday order.
2. Show professionals only the amount they receive.
3. Show simulated admin prices for 4h, 6h, and 8h.
4. Order eligible professionals by rating.
5. Show rating average and total reviews on professional cards.
6. Allow users to read professional reviews.
7. Analyze image/base64/selfie support, but do not implement risky persistence without explicit decision.

Rules:
- Keep critical business rules in the backend.
- Do not expose agency commission or margins to professionals.
- Do not confirm payment in the frontend.
- Do not implement wallet, credit balance, split payment, payout, or professional-to-client rating.
- Keep API response shape unchanged.
- Use DTOs and layered architecture.
- Run frontend build.
- Run backend tests if backend files change.

Return:
- files changed
- behavior changed
- commands executed
- tests passed
- remaining risks
```

---

# 14. Observação final

As melhorias de exibição, avaliação e simulação administrativa são adequadas para o momento atual do produto.

A mudança de fluxo para pagamento antes da seleção e crédito acumulado não deve ser tratada como ajuste simples. Ela exige nova modelagem financeira e uma decisão formal, porque muda o relacionamento entre solicitação, pagamento, atendimento e webhook.
