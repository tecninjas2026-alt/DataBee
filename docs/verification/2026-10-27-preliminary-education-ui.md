# Conteúdo educativo preliminar — interface e autorização

Decisão da professora em [D24 do protótipo](../decisions/2026-10-27-preliminary-education.md): quatro textos gerais podem ser testados antes da revisão científica, com aviso e fontes. Essa liberação não aprova taxonomia, precisão da IA ou identificação de espécie.

## Implementação

Componente `educational-content.component.ts`, incluído após o estado da análise em `analysis-result.page.html`. Quatro temas expansíveis, primeiro aberto ao entrar. Aviso geral e lembrete em cada conteúdo; fonte com autores/ano/seção ou página. Textos iguais aos rascunhos versionados; sem entrada de usuário, `innerHTML`, dados da observação ou chamadas a serviços.

Links institucionais externos com `target=_blank` e `rel=noopener noreferrer`; ação explícita para consultar fonte. Alvos e atributos conferidos no DOM. A abertura no navegador do aparelho ainda depende de teste físico. Cores de texto do tema e links sublinhados, sem dependência nova, plugin ou permissão.

## Conferido no navegador autenticado

- Observação própria existente: estado Não analisada preservado; seção Sobre as abelhas visível.
- Aviso “Conteúdo educativo preliminar — revisão científica pendente” e informação de que o texto geral não identifica a foto.
- Quatro temas abrem/fecham e mostram seus textos/fontes; troca fecha o anterior.
- Viewport 360 × 800: largura de conteúdo e documento 360 px, sem rolagem horizontal; texto e fontes quebram linhas. Cor dos links ajustada para usar a cor do texto do tema.
- Recarregamento completo: observação consultada novamente e cartões reaparecem; sem ação de análise.
- Lint/build de produção e sincronização Android aprovados; nenhum warning novo. Verificação física desta mudança não executada pelo agente.

Captura local `.tmp/education-ui-360-20261027.jpg`. Não foram criadas contas, fotos, observações, migrations ou resultados de IA. Esta verificação comprova interface/compilação, não revisão científica nem teste Android.

## Roteiro do novo APK

Atualizar a instalação existente → Minhas observações → abrir registro → Ver resultado da análise → Sobre as abelhas. Conferir aviso, abrir os quatro temas e tocar em uma fonte para conferir a abertura no navegador. Voltar ao DataBee e verificar que o registro continua disponível.
