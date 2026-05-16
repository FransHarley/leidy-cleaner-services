# Validacao manual — Android Studio e emulador para o app profissional

## Objetivo
Este roteiro cobre a primeira validacao manual do app profissional Android apos `M7-A` e `M7-B`.

Escopo deste guia:
- abrir o projeto Android do Capacitor no Android Studio
- rodar o Gradle sync
- escolher emulador ou aparelho fisico
- instalar e abrir o app
- validar a navegacao publica e a area `/profissional/app`

Fora deste guia:
- iOS
- push notifications
- build release
- Play Store
- icone/splash finais

## Configuracao atual confirmada
- `appId`: `br.com.leidycleaner.profissional`
- `appName`: `Leidy Cleaner Profissional`
- `webDir`: `dist`
- projeto Android gerado em `apps/frontend/android`

Arquivos de referencia:
- [capacitor.config.ts](/home/andre/projects/leidy-cleaner-services/apps/frontend/capacitor.config.ts)
- [app/build.gradle](/home/andre/projects/leidy-cleaner-services/apps/frontend/android/app/build.gradle)
- [strings.xml](/home/andre/projects/leidy-cleaner-services/apps/frontend/android/app/src/main/res/values/strings.xml)

## Pre-requisitos manuais
- Android Studio instalado
- Android SDK instalado pelo Android Studio
- ao menos um dispositivo disponivel:
  - emulador Android configurado, ou
  - aparelho Android com modo desenvolvedor e depuracao USB
- backend local acessivel pelo app durante o teste
- frontend atualizado com build web recente

## Passo 1 — atualizar o bundle web antes de abrir o Android Studio
Executar na raiz de `apps/frontend`:

```bash
npm run build
node node_modules/@capacitor/cli/bin/capacitor sync android
```

Resultado esperado:
- `dist/` atualizado
- assets copiados para `android/app/src/main/assets/public`
- sync do Capacitor sem erro

Observacao:
- este passo deve ser repetido sempre que houver mudanca no frontend antes de um novo teste no Android.

## Passo 2 — abrir o projeto Android no Android Studio
Abrir o Android Studio e escolher:

1. `Open`
2. selecionar a pasta `apps/frontend/android`
3. aguardar o carregamento inicial do projeto

Resultado esperado:
- o Android Studio reconhece um projeto Gradle Android
- o modulo `app` aparece na lateral
- a `MainActivity` fica em `br.com.leidycleaner.profissional`

## Passo 3 — rodar o Gradle sync
Depois de abrir o projeto:

1. aceitar o uso do `Gradle Wrapper` do proprio projeto, se solicitado
2. clicar em `Sync Project with Gradle Files` se o sync nao rodar automaticamente
3. aguardar o fim do sync

Resultado esperado:
- sem erro de `applicationId`
- sem erro de namespace
- sem erro de dependencias do Capacitor
- modulo `app` pronto para execucao

Validacoes visuais rapidas:
- `applicationId`: `br.com.leidycleaner.profissional`
- nome do app em recursos: `Leidy Cleaner Profissional`

## Passo 4 — escolher emulador ou aparelho fisico

### Opcao A — emulador
1. abrir `Device Manager`
2. criar ou iniciar um emulador Android
3. preferir um perfil de telefone comum, como Pixel, com Android recente

### Opcao B — aparelho fisico
1. ativar `Developer Options`
2. ativar `USB debugging`
3. conectar por USB
4. aceitar a chave RSA no aparelho, se solicitado

Resultado esperado:
- o dispositivo aparece no seletor de execucao do Android Studio

## Passo 5 — rodar o app
No Android Studio:

1. selecionar o modulo `app`
2. selecionar o dispositivo
3. clicar em `Run`

Resultado esperado:
- instalacao do app no dispositivo
- app abre com o nome `Leidy Cleaner Profissional`
- a WebView carrega o frontend empacotado sem tela branca permanente

## Passo 6 — validar rota publica antes do login
Na primeira abertura do app:

1. confirmar abertura da home publica
2. verificar se a navegacao inicial carrega normalmente
3. verificar o botao flutuante do WhatsApp na area publica

Resultado esperado:
- a home publica abre sem erro
- o botao flutuante do WhatsApp aparece na area publica
- nenhum elemento fica cortado de forma critica

## Passo 7 — validar login da profissional
Na tela publica:

1. abrir `Entrar`
2. usar uma conta profissional valida
3. concluir o login

Resultado esperado:
- login concluido sem loop
- redirecionamento para `/profissional/app`
- sessao autenticada mantida

## Passo 8 — validar a shell mobile profissional
Na area `/profissional/app`:

1. confirmar abertura da home mobile profissional
2. validar header mobile
3. validar navegacao inferior
4. navegar pelos atalhos principais

Rotas para testar:
- `/profissional/app`
- `/profissional/app/convites`
- `/profissional/app/atendimentos`
- `/profissional/app/perfil`
- `/profissional/app/disponibilidade`

Resultado esperado:
- layout com cara de app mobile
- header sem sobreposicao critica
- navegacao inferior sempre visivel e clicavel
- transicao entre rotas sem quebrar a sessao

## Passo 9 — validar a navegacao inferior
Testar os cinco itens fixos:
- `Inicio`
- `Convites`
- `Atend.`
- `Perfil`
- `Agenda`

Resultado esperado:
- cada item abre a rota correta
- o item ativo fica destacado
- nao ha clique perdido
- a area segura inferior nao corta os botoes

## Passo 10 — confirmar que o WhatsApp nao aparece na area profissional
Com a sessao profissional aberta:

1. navegar por qualquer rota que comece com `/profissional/app`
2. observar canto inferior direito

Resultado esperado:
- o botao flutuante do WhatsApp nao aparece dentro da area profissional
- a navegacao inferior permanece livre de sobreposicao

## Passo 11 — validacao minima de fluxo apos login
Sem avancar escopo novo, fazer uma passada minima em:
- convites
- atendimentos
- perfil
- disponibilidade
- ocorrencias

Resultado esperado:
- as telas carregam
- a navegacao mobile continua funcionando
- nao ha crash de WebView ao trocar de tela

## Checklist manual

### Preparacao
- [ ] `npm run build` executado manualmente
- [ ] `node node_modules/@capacitor/cli/bin/capacitor sync android` executado manualmente
- [ ] Android Studio aberto com `apps/frontend/android`
- [ ] Gradle sync concluido

### Dispositivo
- [ ] emulador iniciado
- [ ] ou aparelho fisico conectado
- [ ] dispositivo visivel no seletor de execucao

### Execucao do app
- [ ] app instalado
- [ ] app abriu sem tela branca permanente
- [ ] home publica carregou
- [ ] WhatsApp apareceu na area publica

### Login e shell profissional
- [ ] login da profissional funcionou
- [ ] `/profissional/app` abriu
- [ ] header mobile carregou
- [ ] navegacao inferior carregou
- [ ] `Inicio` funciona
- [ ] `Convites` funciona
- [ ] `Atend.` funciona
- [ ] `Perfil` funciona
- [ ] `Agenda` funciona
- [ ] WhatsApp nao aparece em `/profissional/app`

## O que continua pendente apos este guia
Mesmo que este roteiro passe, os itens abaixo continuam pendentes ate validacao propria:
- configurar icone final
- configurar splash final
- teste em aparelho real, se so houver emulador
- correcoes de viewport/teclado/safe area, se surgirem
- build release

## Evidencias recomendadas
Salvar pelo menos:
- print da home publica no Android
- print da tela de login
- print da home `/profissional/app`
- print mostrando a navegacao inferior
- print provando ausencia do botao de WhatsApp na area profissional

