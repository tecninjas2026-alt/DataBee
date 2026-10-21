# Preparação Android durante a espera pelo GitHub — 20/10/2026

## O que foi verificado

- Equipe informou que enviou mensagem ao suporte do GitHub. Nenhuma nova tentativa de envio ou troca de credenciais foi feita nesta etapa.
- A base local inclui a IMP-013 aplicada e os 59 testes A/B/anon aprovados, commit `98d4482`.
- `npm.cmd run android:sync`: build de produção passou, sem warnings. A etapa Capacitor falhou na área restrita ao consultar informações do usuário do Windows (`uv_os_get_passwd`).
- Repetida somente a sincronização, fora dessa restrição, com `node node_modules/@capacitor/cli/bin/capacitor sync android`: passou; arquivos web copiados e seis plugins Android atualizados.
- Android Studio está instalado, mas o caminho configurado em `ANDROID_HOME` não existe. `platform-tools/adb.exe` não foi encontrado nesse caminho; `android/local.properties` não está presente. Os caminhos alternativos usuais conferidos também não foram encontrados. Não foi feita busca recursiva pelo computador.
- **APK novo não gerado.** O arquivo em `android/app/build/outputs/apk/debug/app-debug.apk` continua sendo o de **14/10/2026**, 9.085.777 bytes; não apresentar como build atual.
- Sem instalação em celular, sem testes reais de câmera/GPS e sem novo resultado declarado para IMP-017/019/020.

Branch local de documentação: `chore/android-test-preparation`, criada sobre a base local da IMP-013. É uma continuação local durante o bloqueio remoto; não foi possível partir de main remoto atualizado. Ao recuperar o acesso, finalizar a IMP-013 e ajustar a base desta documentação antes de abrir sua revisão.

## Caminho para retomar o APK

O responsável pode conferir no Android Studio o **SDK Manager** e informar apenas a pasta do Android SDK. SDK é a caixa de ferramentas usada para montar e instalar o app; não é uma senha. Não foram baixadas ferramentas nem aceitas licenças nesta etapa.

Se o SDK já estiver em outra pasta, o agente pode apontar o build para ela sem reinstalar. Se não estiver instalado, será preciso preparar SDK Platform 36, Build-Tools e Platform-Tools conforme `docs/SETUP.md`. Depois executar a montagem do APK e registrar caminho, data, commit e resultado reais. Não usar o APK antigo como evidência de uma mudança nova.

## Roteiro preparado — ainda não executado

Este roteiro vem do guia Android e dos controles atuais das telas. Não substitui os critérios completos das tasks no Notion. Preencher modelo do aparelho, versão Android, data e commit do APK antes de executá-lo. Registrar apenas Pass/Fail/Não executado e descrição sem dados pessoais. Não anexar coordenadas exatas ou fotos pessoais ao registro.

| Caso | Ação no app | Esperado no código atual | Resultado |
|---|---|---|---|
| Câmera | Registrar → Tirar foto → confirmar | Prévia da foto e botão Continuar | Não executado |
| Cancelar câmera | Tirar foto → cancelar | App continua utilizável; não trata cancelamento como falha técnica | Não executado |
| Galeria | Escolher da galeria → selecionar imagem de teste → Continuar | Foto e origem Galeria; data de captura indisponível quando não há fonte confiável | Não executado |
| Recusa no app | Dados → Não usar localização | Mensagem Localização dispensada; foto preservada | Não executado |
| GPS permitido | Dados → Permitir e obter localização → permitir no Android | Localização e precisão aparecem somente na prévia privada; não registrar seus valores no relatório | Não executado |
| GPS negado | Recusar a permissão no Android | Mensagem compreensível, Tentar novamente e opção Não usar localização | Não executado |
| GPS desligado | Desligar localização no aparelho e tentar obter | Erro tratado; foto e escolha sem GPS preservadas | Não executado |
| Nova tentativa | Após erro, usar Tentar novamente e atender à permissão | Recuperação ou mensagem compreensível; interface utilizável | Não executado |
| Voltar/girar/retornar | Botão Voltar do Android, girar tela e alternar para outro app/voltar | Conferir se fluxo continua utilizável e registrar o comportamento observado | Não executado |
| Sair | Encerrar sessão depois de selecionar foto | Volta ao login e limpa o rascunho local | Não executado |

**Limite atual:** Salvar observação continua desabilitado com ou sem GPS. A IMP-013 criou a estrutura do banco; a ligação das telas ao salvamento pertence às próximas tasks. Foto e GPS desta prévia ficam em memória. Nenhum caso deste roteiro deve declarar upload ou salvamento concluído.

## Próxima tarefa de desenvolvimento

O HANDOFF anterior indica **IMP-032 (profiles)** após a estrutura inicial de observações. Foi solicitado o texto completo da task, incluindo dependências e critérios de aceite, porque o Notion não está acessível. Não foram criados schema, regras de perfil ou telas com critérios presumidos. O trabalho pode continuar localmente quando esses critérios chegarem; publicação e merge continuam dependentes da recuperação do GitHub.
