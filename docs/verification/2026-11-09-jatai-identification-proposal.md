# Identificação informada na observação

A migration 20261109150000 adiciona um campo opcional à observação salva. A lista, o detalhe e a tela de resultado mostram o nome informado em separado da resposta da IA. A leitura segue a política de acesso do dono. A gravação desse campo é reservada ao servidor.

A simulação com `db push --dry-run` listou apenas a migration 20261109150000. A aplicação após aprovação confirmou a mesma migration, sem seeds ou roles. O preenchimento autorizado foi atômico e limitado aos seis registros conferidos. Uma leitura posterior confirmou os seis valores, os estados anteriores e a preservação dos resultados de IA e da curadoria. Os identificadores dos registros e as fotos ficam privados.

Quatro verificações com SDK e contas de teste passaram. A conta dona leu o campo, outra conta recebeu lista vazia, a leitura anônima foi negada e a escrita pelo cliente autenticado foi negada. A validação local com `npm run check` também passou.
