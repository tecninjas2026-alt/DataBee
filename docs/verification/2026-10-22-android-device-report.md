# Primeiro teste no celular — 22/10/2026

**Aparelho informado:** Samsung Galaxy S24 Ultra. **Android:** 16.
**Versão de referência entregue neste chat:** APK de teste 08ab799, 22/10/2026. Identificação do arquivo instalado não inspecionada diretamente no aparelho.
**Fonte:** professora relatou instalação e funcionamento; sem observação direta do agente.

| Fluxo relatado | Resultado |
|---|---|
| Login | Funcionou — relato humano |
| Tirar foto | Funcionou — relato humano |
| Acesso à galeria | Funcionou — relato humano |
| GPS | Funcionou — relato humano |

Estado da versão: **Em teste**. Registro adicionado à página oficial de versões Android do Notion. Nenhuma aprovação completa ou Done atribuído.

## Segunda rodada — confirmada

A professora respondeu **“Tudo funcionando”** ao roteiro de quatro passos enviado após a primeira rodada. Registrar os seguintes resultados como Pass por relato humano, sem exigir repetição:

| Roteiro efetivamente solicitado | Resultado |
|---|---|
| Cancelar câmera, escolher/substituir imagem, sem GPS anterior | Pass — relato humano |
| GPS desligado, orientação sem travar; religar e tentar novamente | Pass — relato humano |
| Fechar completamente e reabrir, mantendo a sessão | Pass — relato humano |
| Sair, usar Voltar, exigir login e limpar foto após entrar novamente | Pass — relato humano |

Essa confirmação não comprova troca entre duas contas, todos os modos de permissão ou cadastro de uma nova conta. Pergunta sobre cadastro/confirmar e-mail enviada à professora, aguardando resposta.

### Roteiro de referência mais amplo

1. Cancelar câmera/galeria, trocar a foto e conferir limpeza da localização anterior.
2. Negar localização ou desligar GPS: mensagem segura, app utilizável, sem coordenadas inventadas. Reautorizar depois.
3. Fechar/reabrir e conferir restauração de sessão.
4. Sair e usar Voltar: login obrigatório, foto/localização temporárias limpas. Conferir isolamento ao entrar com outra conta de teste.

Esses quatro relatos não comprovam todos os 11 casos da IMP-021, a matriz completa de sessão da IMP-034, confirmação real de novo cadastro, remoção de EXIF ou ausência de GPS atual na galeria. Registrar os demais como pendentes, sem inferir Pass.

## Desenvolvimento seguinte

Próximo checkpoint: cadastro novo com recebimento e confirmação de e-mail (IMP-033), seguido das verificações restantes de IMP-034 e da matriz física. Não repetir os quatro passos da segunda rodada já confirmados. Depois seguir o plano de IMP-022 (upload privado) e IMP-035 (salvar/descarte), sem refazer foto/GPS ou enfraquecer RLS. Mudanças remotas continuam dependentes da revisão/autorização específica das tasks. Salvar segue desabilitado e IA não foi conectada.

## Encerramento da sessão — acesso após demora

A professora relatou timeout ao tentar conectar por e-mail no app. Esclareceu que a outra conta havia sido criada anteriormente no navegador. Depois informou: “Esperei o timeout e deu certo” e pediu confirmar o funcionamento e encerrar a sessão.

Resultado: **tentativa de acesso concluída com sucesso após espera, por relato humano**. A etapa exata (Entrar/Criar conta/link) não chegou a ser esclarecida; não converter esse relato em prova de cadastro novo, entrega ou confirmação de e-mail. Preservar os Pass anteriores.

Diagnóstico somente leitura no computador: Auth settings HTTP 200 em 525 ms e health HTTP 200 em 254 ms, CORS aceitando https://localhost. Banco: 5 contas, 3 confirmadas/2 pendentes; uma conta com entrada na última hora. Sem credenciais ou dados pessoais nos registros. Isso não explica o tempo de resposta no celular nem identifica qual conta corresponde ao relato.

Nenhuma correção de código, mudança remota ou repetição de tentativa executada. Não atribuir causa ao SMTP, à rede ou à falta de confirmação sem evidência. Demora permanece como observação para reteste, sem impedir o registro do sucesso relatado.

**Sessão encerrada a pedido da professora. Retomada:** conferir HANDOFF e critérios já recebidos de IMP-022/035, revisar dependências de cadastro/sessão e preparar a próxima implementação de upload/salvamento. Não solicitar novamente os textos das tasks e não repetir testes já confirmados. Mudanças remotas ainda dependem da revisão/autorização específica registrada nas tasks.
