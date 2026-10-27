# D24 — conteúdo preliminar no protótipo

Em 27/10/2026, a professora perguntou se poderia lançar o protótipo sem revisão científica prévia. Foi proposta a publicação com aviso de conteúdo preliminar/revisão pendente, fontes por cartão e sem selo de especialista. A professora aprovou: “perfeito, acho melhor. Como temos a referência não terá problemas”, seguida de “ok” durante a implementação.

**Decisão de produto:** liberar para testes os quatro cartões gerais já preparados em `docs/educational-cards.draft.md`, mantendo a revisão científica como etapa posterior. Não significa que a referência garante a correção da adaptação; esse limite foi explicado no chat.

## Comportamento

- Resultado da análise → Sobre as abelhas, inclusive para observação Não analisada.
- Aviso visível: “Conteúdo educativo preliminar — revisão científica pendente”; lembrete em cada cartão aberto.
- Quatro temas expansíveis: polinização, conservação dos ninhos, abelhas sem ferrão e alimentação. Autores/ano e página/seção nas fontes; links institucionais abrem no navegador.
- Texto geral estático: não recebe foto, GPS, identidade ou resultado de IA; não realiza chamada externa ao abrir/expandir. A fonte só é acessada por toque explícito no link.
- Sem nomes/descrições específicos por espécie, selo do Prof. Rodrigo/UFPR/USP, importação taxonômica ou alteração no catálogo aprovado. As menções às instituições nas referências identificam publicações, não endosso do DataBee.

## Revisão e limites

A liberação é editorial, limitada a esse protótipo. Revisão científica continua pendente e será registrada com responsável/data/versão quando realizada. D24 não está integralmente concluída: revisão, conteúdo específico de espécie e orientação segura permanecem pendentes. A identificação automática ainda não está integrada; essa decisão não altera custo zero, privacidade, permissões ou critérios científicos de identificação.

Implementação: `src/app/features/observations/educational-content.component.ts` e inclusão em `analysis-result.page.*`. Próxima entrega Android: 1.0.3-test/código 4, mantendo assinatura e instalação por atualização. Não considerar entregue até publicar/conferir o APK e o Notion.
