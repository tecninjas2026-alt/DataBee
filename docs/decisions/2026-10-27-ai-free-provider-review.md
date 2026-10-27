# IA sem custo — revisão de candidatos, sem ativação

Situação em 27/10/2026: **nenhum provedor escolhido ou ativado**. Teto autorizado continua zero. Nenhuma conta, chave, plano, aceite de termos, foto enviada ou chamada de modelo nesta pesquisa. Não alterar D15 para aprovado por este levantamento.

## Catálogo e conteúdo

A professora informou neste chat: “Temos apenas o documento dos nomes, mas textos educativos não.” A [IMP-070](https://app.notion.com/p/fc4d3425eae48246874a81ec056bdbe8) ainda registra revisão de família/gênero C05, textos educativos D24 e três referências de imagens a conferir. O rascunho mantém nomes/fontes/IDs e campos pendentes; a informação nova não aprova taxonomia ou textos inexistentes. Conteúdo educativo continua separado da resposta gerada pela IA.

## Levantamento em fontes oficiais

| Candidato | Evidência atual | Decisão desta etapa |
|---|---|---|
| Hugging Face Inference Providers | A tabela oficial agora mostra créditos mensais **None** para Free Users; uso requer créditos comprados ou assinatura. [Preços](https://huggingface.co/docs/inference-providers/pricing). | Não adotar como oferta gratuita neste projeto. Não usar referências antigas a US$ 0,10/mês. |
| Groq | Termos atuais exigem 18 anos para acesso/uso de Cloud Services. [Contrato do serviço](https://console.groq.com/docs/legal/services-agreement). | Público escolar/usuários finais não esclarecidos nesta pesquisa; não presumir elegibilidade nem ativar por conta adulta. |
| Cloudflare Workers AI | Oferta Free documenta 10.000 unidades de processamento por dia, com bloqueio ao exceder; alguns modelos requerem pagamento. [Preços e exceções](https://developers.cloudflare.com/workers-ai/platform/pricing/). | Candidato de custo, ainda sem decisão de uso/conta/modelo/termos para o projeto. Sem upgrade ou créditos. |

Cloudflare documenta não usar conteúdo do Workers AI para treinamento e retenção limitada ao processamento, com exceções operacionais/legais e de recursos com estado. Isso não equivale a ausência absoluta de retenção nem a aprovação de envio de fotos escolares. [Tratamento de dados](https://developers.cloudflare.com/workers-ai/platform/data-usage/).

O modelo Llama 3.2 11B Vision está documentado, mas exige aceite específico da licença Meta antes do uso. Nenhum pedido `agree` foi enviado. [Modelo/licença](https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/). A lista documentada de suporte ao JSON Mode não inclui esse modelo de visão; não assumir suporte ao schema exigido só porque há modelos de texto compatíveis. [JSON Mode e modelos](https://developers.cloudflare.com/workers-ai/features/json-mode/).

## Próximo critério de decisão

Confirmar um modelo que reúna imagem, saída estruturada compatível, uso do público escolar, conta disponível e bloqueio efetivo no plano gratuito. Revisar termos aplicáveis ao serviço/modelo com o responsável, sem aceitá-los automaticamente; documentação de preço isolada não resolve elegibilidade. Depois inserir segredo apenas no servidor e avaliar fotos DEV autorizadas. Nenhuma escolha científica nem promessa de qualidade deriva desta pesquisa.

## Complemento — candidato Mistral, preparação sem ativação

A professora confirmou que **a equipe ainda não tem conta**. A documentação descreve Free mode com API sem cartão, sujeito a limites; disponibilidade e limites de um modelo específico precisam ser conferidos na conta. [Ativação oficial](https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key).

Há documentação de entrada JPEG em base64 e saída por JSON Schema. Isso permite preparar um adaptador, mas não comprova combinação modelo/schema/quota nem qualidade com abelhas. Nenhum modelo foi definido para produção. [Visão](https://docs.mistral.ai/studio/conversations/vision), [saída estruturada](https://docs.mistral.ai/studio/conversations/structured-output/custom), [API](https://docs.mistral.ai/api).

Antes de qualquer foto, o responsável deve abrir o painel administrativo → Privacy → Anonymous improvement data e desabilitar a utilização dos dados da API para melhoria. A opção de Vibe é separada e não resolve a API. Não confundir opt-out de treinamento com ausência de qualquer retenção. [Procedimento oficial](https://help.mistral.ai/en/articles/455207-can-i-opt-out-of-my-input-or-output-data-being-used-for-training).

Os termos institucionais exigem autoridade do responsável e impõem condições sobre dados de crianças/adolescentes. Não considerar uma conta adulta como comprovação de elegibilidade do aplicativo escolar. Conferir público, dados e consentimentos aplicáveis antes da ativação. [Termos comerciais vigentes](https://legal.mistral.ai/terms/commercial-terms-of-service/).

Preparado `mistral-vision.ts`, sem ativação ou integração remota, com condições explícitas mantidas no servidor e modelo estável versionado, sem aliases/preview. Relatório local: `docs/verification/2026-10-27-mistral-adapter.md` (37/37 cenários sintéticos). Sem conta/chave real, aceite, chamada externa ou gasto. D15 continua parcial; catálogo e persistência atômica ainda pendentes.

### Atualização posterior — conta criada pela professora

Conta autenticada conferida. Assinatura Gratuito, cobrança adicional não ativada; treinamento da API desativado com autorização expressa e persistência conferida após reload. Modelos Labs desligados. Studio pede upgrade; chave criada com autorização na interface Admin regular (30 dias, somente conectores compartilhados), sem upgrade/pagamento. Uso efetivo da API ainda não comprovado. Após login humano, MISTRAL_API_KEY cadastrado com autorização no cofre Supabase, digest igual e persistência após reload conferidos; nenhuma foto/chamada/custo. Cadastro não ativa o adaptador ou comprova acesso ao modelo. Ver `docs/verification/2026-10-27-mistral-account.md`. O relato anterior de ausência de conta é histórico, superado por esta confirmação.
