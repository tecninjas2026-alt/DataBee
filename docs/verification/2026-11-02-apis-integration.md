# Catálogo com Apis e candidatas — 02/11/2026

## Diagnóstico e implementação

Prompt bee-v2 já pede até três candidatas; schema/validador limita a três e a interface percorre todas. Nenhum slice oculta as demais. O catálogo aprovado de 12 não incluía Apis mellifera; ausência confirmada no código. Isso explica por que a espécie não podia ser escolhida, mas não prova sozinho a causa de cada saída errada. Não foram lidos resultados pessoais ou inferidos logs do modelo.

Após aprovação explícita, catálogo v2 com 13 espécies, Apis mellifera / Abelha-do-mel. Snapshot v1 preservado e mapeado por versão tanto na tela quanto no cache servidor/SQL adapter. Novas persistências exigem catálogo atual; desconhecidos recusados. Schema 2.0/prompt bee-v2, piloto, quotas, preservação de observações e permissões mantidos. Tela informa até três candidatas ordenadas sem porcentagem e sinaliza resultados de versão anterior. Nenhuma reanálise automática de resultados antigos.

## Verificação

- 12/12 casos locais focados de catálogo, três candidatas, recusa de porcentagem/quarta/ID indevido, cache antigo sem carregar imagem/chamar modelo, recusa de versão desconhecida e escrita somente atual. JSON catalog-compatibility.
- 32/32 regressão local da orquestração; 38/38 do handler (33 controlados e 5 SDK remoto), sem geração de modelo. Relatórios de 02/11; não sobrescrevem evidência histórica.
- TypeScript do servidor e npm check aprovados, sem novos warnings. Sync Android aprovado.
- Prévia controlada com componente/template reais e dados artificiais: três nomes/evidências e limitações renderizados em 360 px, sem overflow. Modo histórico v1 preserva nome e aviso. Não é resposta real da IA nem teste biológico. Screenshot ignorado em .tmp/candidates-360-20261102.png.

Deploy da função e entrega APK 1.0.7-test/código 8 em preparação. Após implantação, consultar somente cache técnico existente para conferir compatibilidade; não enviar fotos pessoais. Teste físico e qualidade em fotos identificadas continuam pendentes.

Referência e autorização: [decisão](../decisions/2026-11-02-apis-catalog.md). Não há melhoria de acurácia comprovada nem probabilidade calibrada.
