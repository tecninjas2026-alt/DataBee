# Guia — Identificação assistida (VLM, BeeAnalysisV2, catálogo)

Fonte oficial: Notion → "Data Model e BeeAnalysisV2" e "Bee Identification AI Prompt". Tasks: IMP-070 (catálogo), 023 (contrato/validador), 024 (prompt), 025 (secrets — humano), 026 (tabela), 027 (stub), 028 (VLM real), 029 (persistência/cache), 030 (UI).

**D15 atualizada em 23/10:** iniciar sem custo, evolução paga só com novo orçamento autorizado. Provedor elegível ainda pendente: Gemini Developer API não ativado pela restrição de público menor de 18 anos nos termos oficiais. Não resolver apenas com conta adulta. Nenhum modelo/chave configurado, nenhuma foto transmitida. Ver `docs/decisions/2026-10-23-free-ai-prototype.md`. As referências OpenAI abaixo descrevem o plano anterior, não aprovação para despesa.

**Preparação já no código:** contrato/validador em `supabase/functions/_shared/bee-analysis.ts`; prompt oficial bee-v2 e projeção de campos permitidos em `bee-prompt.ts`. Contexto exige catálogo aprovado (não o draft IMP-070), versão, IDs/níveis/nomes e características revisadas quando disponíveis; região D10 opcional. Não é endpoint, não chama IA nem grava resultado. A futura function autenticada deverá carregar catálogo mantido no servidor, verificar a imagem e adaptar a chamada ao provedor aprovado.

**IMP-026 aplicada em 27/10:** tabela ai_identifications, modelo de leitura em `core/models/ai-identification.model.ts`. Apenas o dono lê; cliente sem INSERT/UPDATE/DELETE. O CHECK do banco protege o envelope básico, não substitui validação completa de candidatos/catálogo da IMP-023. Persistência real/atômica + status/attempt_id ainda são IMP-029. Evidência SDK real 42/42 em `docs/verification/2026-10-27-imp026-ai-storage.md`; fixture SIMULATED preservada sem análise de foto.

## 1. Fluxo
```
App (observação saved, idle) --POST {observation_id} + JWT--> Edge analyze-observation
  1. valida JWT, ownership, lifecycle=saved, foto existente, status != processing, quota
  2. cache: se já existe ai_identifications e não é reanálise explícita → devolve cache (sem VLM)
  3. marca processing + analysis_attempt_id (atômico)
  4. busca foto (Storage, server-side) + catálogo permitido versionado
  5. chama VLM (OPENAI_MODEL) com imagem + catálogo + região ampla aprovada (opcional)
  6. valida JSON (schema strict) + validação semântica
  7. grava resultado + status atomicamente (só se attempt_id ainda é o atual)
App lê o resultado salvo; reabrir NUNCA chama o VLM.
```
Catálogo ausente/incompleto ⇒ erro controlado de configuração (nunca prompt aberto sem lista). VLM indisponível ⇒ `failed`, observação e foto preservadas.

## 2. O que vai (e não vai) para o VLM
Vai: imagem saneada (JPEG sem EXIF), lista de `taxonId`/nível/nomes/características do catálogo, região ampla aprovada quando útil.
**Nunca:** GPS exato, nome/e-mail/ID do usuário, comentários, observação inteira, chaves.
Texto dentro da imagem é conteúdo, não instrução (o prompt diz isso).

## 3. Contrato BeeAnalysisV2 (schema_version `2.0`, prompt `bee-v2`)
Tipos no front: `src/app/core/models/bee-analysis.model.ts`. JSON Schema (Structured Outputs `strict: true`; todo objeto `additionalProperties: false` e todos os campos em `required`):
`status: possible_match | inconclusive | no_match` · `matches[]: { taxonId, rank, taxonomicLevel: family|genus|species, visualEvidence: string[] }` · `imageQuality: adequate | poor` · `limitations: string[]`.
`schema_version`, `prompt_version`, `catalog_version`, `provider`, `model`, `model_version` são metadados gravados **pelo backend**, não gerados pelo modelo.

## 4. Validação semântica obrigatória (backend — schema strict não basta)
- ≤ 3 matches; `taxonId` únicos e presentes no catálogo da versão usada; `rank` inteiro 1..n sequencial; `taxonomicLevel` igual ao nível real do táxon no catálogo.
- `possible_match` ⇒ ≥ 1 match com `visualEvidence` não vazia. `no_match` ⇒ `matches` vazio. `poor` com evidência insuficiente ⇒ `inconclusive`.
- Limites de tamanho de listas/textos checados no código (o subset de JSON Schema do provedor pode não impor).
- Recusa, `incomplete`, JSON inválido, ID inventado ⇒ erro técnico (502) e status `failed` — **nunca** gravar `completed` nem fabricar inconclusivo.
- Mapeamento de status: `possible_match`/`no_match` → `completed`; `inconclusive` → `inconclusive`; erro → `failed`.

## 5. Modelo e chamada
- Modelo definido **uma vez** em `OPENAI_MODEL` (secret) após aprovação D15 (adulto/instituição; conta, orçamento, quota). Não hardcode ID de modelo em código.
- Use a API oficial com entrada de imagem + Structured Outputs (Responses API `text.format` json_schema strict, ou equivalente documentado no momento). Confirme na doc atual antes de implementar — não copie exemplo antigo.
- Timeout explícito (ex.: 30–45 s) ⇒ 504; 429 do provedor ⇒ 429 para o app com mensagem de tentar mais tarde. Retry só manual e limitado.
- Timeout local não garante que o provedor não cobrou — não prometa "uma cobrança só".

## 6. UI do resultado (IMP-030)
- Rótulo sempre "Sugestão da IA" + status de curadoria "Sugerido" (D22). Nunca "identificado", "certeza", %.
- Mostrar nome popular + científico (do catálogo), nível taxonômico, ordem por rank, evidências visuais, limitações e orientação de nova foto quando `poor`/`inconclusive`.
- `failed` ≠ inconclusivo: erro técnico mostra "tentar novamente", não resultado científico.
- Cartão "Aprender" (D24) vem do catálogo curado (`educational_*` com fonte). Sem táxon aplicável → cartão geral "Sobre as abelhas". A IA não gera textos educativos.

## 7. Catálogo (IMP-070)
- Rascunho transcrito do Notion: `supabase/catalog/catalog-v1.draft.json` (12 espécies validadas pelo Prof. Rodrigo/UFPR em 07/10/2026). `family` e textos educativos estão `null` de propósito (conflito C05 + D24). Revisar, depois importar via migration/seed.
- IDs estáveis (`sp-genero-especie`); nunca renomear após uso. Leitura `authenticated`; escrita só mantenedor/backend.
- Catálogo é universo de referência, **não** treinamento nem dataset de avaliação. Dataset DEV/TEST (D11) fica separado; nunca ajustar prompt olhando o TEST.

## 8. Avaliação (IMP-048/049 — humano)
Métricas reais (Top-1, Top-3, gênero, inconclusivo correto, erro grave) por execução registrada em "AI Experiments" no Notion. Nenhuma métrica inventada; fixtures validam contrato, não biologia.
