# Mapa compartilhado e aba Aprender — 30/10/2026

## Autorizações e resultado

A professora aprovou expressamente a proposta de compartilhamento em áreas de cerca de 2 km e a aplicação/testes do banco: “sim. aprovo”. Também pediu separar os textos da análise e escolheu “Uma aba Aprender na navegação inferior”. São extensões pontuais de D06/D10/D25; nenhum gate ou Core pendente foi encerrado automaticamente.

- Início → Mapa da equipe: limites dos 29 municípios IBGE/AMEP, Curitiba/RMC, zoom/pan, células agregadas e lista acessível. Sem mapa de ruas, tiles remotos, rastreamento, foto ou GPS exato na consulta.
- Detalhe do próprio registro → Mapa da equipe: escolha desmarcada inicialmente, consentimento explícito para área de ~2 km; compartilhar/retirar e consulta do estado persistido. Não publica foto/observação completa. Requer GPS salvo do dispositivo, precisão suficiente e dentro da RMC; falha preserva registro.
- Nova aba Aprender: os mesmos quatro textos preliminares e fontes, em componente próprio. Retirados da análise; análise mantém sugestão/evidências/limitações. Sem texto científico novo ou revisão presumida.

## Banco aplicado e privacidade

Dry-run reconferido listou somente `20261030140000_imp066_approximate_team_map.sql`; aplicada após aprovação. Arquivo aplicado imutável. Tabela privada de compartilhamentos e três RPCs de dono/leitura agregada, helper geográfico inacessível a participantes, RLS ativo, autenticação/dono explícitos e search_path vazio. Alteração aprovada de D10: área aproximada opt-in visível a autenticados; GPS real segue em tabela privada, sem identidade/imagem/ID privado no mapa.

**21/21 verificações remotas** A/B/anônimo: default privado, grants/RPCs/dono, compartilhamento/concorrência sem duplicação, agregados, GPS e observação originais protegidos, recusa fora da RMC/sem GPS/baixa precisão/rascunho, paginação e retirada sem perda. `2026-10-30-map-remote.json` inclui hash da migration. Fixtures sintéticas de centros municipais públicos foram preservadas, compartilhamentos de teste inativados pelo próprio dono; nenhuma exclusão ou foto pessoal publicada.

**7/7 verificações do serviço Angular**, quatro com SDK real e três fronteiras controladas: opt-in/cache de estado, projeção agregada, outro dono, retirada, dados inválidos, cancelamento e troca de conta. `2026-10-30-map-angular.json`. Sem chamada VLM ou leitura de GPS pessoal para verificar.

## Interface e dependências

Leaflet **1.9.4** e tipos **1.9.22**, versões exatas, adicionados por serem a biblioteca prevista na IMP-066 e oferecerem pan/zoom/controles com a base local. Build ESM oficial escolhido para evitar CommonJS; sem provedor/chave/tiles externos. Apenas Leaflet/tipos/GeoJSON de tipos adicionados ao lockfile; sem upgrades indiscriminados ou pagamento. npm usou CAs do sistema sem desativar TLS; avisos de audit/install-scripts foram registrados e não foram resolvidos com force/aprovações em massa.

Navegador autenticado, 360 px: cinco abas cabem sem overflow; Aprender abre cartões/fontes e mantém avisos. Resultado não contém componente educativo. Mapa real desenha base e célula técnica controlada; clique mostra contagem/data sem identidade/GPS. Fixture retirada e estado vazio conferido. Opt-in real do detalhe começa desmarcado e botão Compartilhar desabilitado; o agente não marcou consentimento nem compartilhou registro pessoal. Sem imagens externas no mapa. O screenshot com célula é TEST DATA, não ocorrência científica.

Lint/build final sem novos warnings, sync Capacitor aprovados. APK **1.0.6-test/código 7**, fonte **4fe3d72**, entregue em GitHub Releases e Notion (9.218.579 bytes, 51 assets, assinatura preservada e download público conferido); teste físico de compartilhar/retirar e navegação Aprender pendente. Confirmação humana anterior de análise/salvar/reabrir permanece válida, sem repetir roteiro. Precisão científica e revisão dos quatro textos continuam pendentes.
