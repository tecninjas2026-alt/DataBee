# Olhar Atento — proposta para revisão

O participante abre uma observação salva, confere se a abelha aparece inteira, nítida e bem iluminada e confirma a foto. As fotos existentes podem ser conferidas no mesmo caminho. O Início mostra de zero a três fotos conferidas e libera o selo na terceira. A conferência é feita pela pessoa e independe da análise da IA.

A migration `20261109160000_observation_photo_reviews.sql` cria uma tabela privada com a referência à observação, a conta dona e a assinatura SHA-256 do arquivo. O app calcula a assinatura a partir dos bytes da foto já salva no DataBee. Cada observação e cada arquivo idêntico contam uma vez por conta. Uma imagem recortada ou recodificada pode ter outra assinatura. A assinatura enviada pelo cliente é uma proteção contra repetições acidentais no app, sem pretensão de certificar a foto.

A conta autenticada pode consultar a própria conferência e inserir uma para uma observação própria, salva e com foto. O vínculo com o dono é conferido também pelo banco. A leitura da assinatura, a edição, a remoção direta e o acesso anônimo ficam fora das permissões do cliente. O vínculo acompanha o ciclo de vida da observação. A atualização não preenche registros antigos de forma automática.

O `db push --dry-run` no projeto DataBee listou apenas `20261109160000_observation_photo_reviews.sql`, sem seeds ou roles. Após a aprovação, a aplicação remota confirmou somente essa migration. O `npm run check` passou.

Oito verificações no navegador a 360 px passaram com dados simulados. Foram conferidos o progresso de zero a três, a exigência das três marcações, a reabertura da foto confirmada, a cópia idêntica e o desbloqueio. O fluxo não chamou a IA. A simulação não substitui o teste de permissões no Supabase.

Passaram 24 verificações no Supabase com as contas técnicas A e B e acesso anônimo. Três fotos sintéticas distintas avançaram a contagem de zero a três. A repetição da observação e a cópia idêntica foram bloqueadas. Confirmamos isolamento entre contas, acesso à própria conferência e bloqueios para rascunho, observação sem foto, escrita por outra conta, acesso anônimo, leitura da assinatura e edição ou exclusão pelo cliente. Também conferimos o download assinado com a origem do Android e a assinatura do arquivo recebido. O teste no aparelho está pendente.
