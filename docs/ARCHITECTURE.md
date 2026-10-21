# Arquitetura — DataBee MVP

Detalhes oficiais no Notion ("Architecture", "Data Flow", "Data Model e BeeAnalysisV2"). Este arquivo é o mapa do **código**.

## Visão geral
```
Ionic + Angular (Android via Capacitor)
  ├─ Camera / Geolocation (plugins nativos; fallback web no navegador)
  └─ supabase-js (URL + publishable key + JWT do usuário)
        ├─ Auth (e-mail/senha)
        ├─ Postgres + RLS  (profiles, observations, observation_private_locations,
        │                   observation_images, ai_identifications, comments, taxa)
        ├─ Storage privado (observation-photos)
        └─ Edge Functions  analyze-observation  → VLM (OpenAI, Structured Outputs)
                           get-observation-image → URL assinada 60 s
                           (+ publicação/cleanup definidos nas IMP-035/039)
```
Sem servidor próprio, sem Python, sem ML local.

## Ordem de construção (gates)
1. **Gate 1 (IMP-047)** fundação, login, catálogo mínimo, app no Android real.
2. **Gate 2 (IMP-038)** foto → localização → upload → salvar → reabrir, **sem IA**.
3. **Gate 3 (IMP-031)** VLM real, schema/IDs válidos, persistência/cache, inconclusivo/erro sem perda. Feed/comentários (Core) no checkpoint IMP-045.
4. **Gate 4 (IMP-063)** freeze 28/10, testes, segurança, APK, demo. Prazo final de teste 04/11/2026.

## Estados da observação
- `lifecycle`: `draft` (antes de confirmar) → `saved` (confirmação humana, antes da IA).
- `publication`: `private` (padrão) | `published` (ação voluntária; mostra só região ampla).
- `analysis_status`: `idle` (Não analisada) → `processing` → `completed` | `inconclusive` | `failed`.
- `curation_status` (D22): `suggested` → `in_review` → `validated` (só humano autorizado).

## Mapa das 8 telas (D25) → código
| # | Tela | Rota | Arquivo | Estado atual |
|---|---|---|---|---|
| 1 | Login | `/login` | `features/auth/login.page.*` | Funcional (requer publishable key) |
| 2 | Início | `/tabs/inicio` | `features/home/home.page.*` | UI pronta; contagem/conquistas TODO |
| 3 | Novo Registro — Foto | `/tabs/registrar` | `features/register/register-photo.page.*` | Funcional (câmera/galeria/preview/reencode) |
| 4 | Novo Registro — Dados | `/tabs/registrar/dados` | `features/register/register-details.page.*` | Consentimento + GPS funcionais; salvar = IMP-022/035 |
| 5 | Resultado + Aprender | `/observacao/:id/resultado` | `features/observations/analysis-result.page.ts` | Placeholder (IMP-030) |
| 6 | Minhas Observações | `/tabs/minhas` | `features/observations/my-observations.page.ts` | Estado vazio (IMP-036) |
| 7 | Detalhe | `/observacao/:id` | `features/observations/observation-detail.page.ts` | Placeholder (IMP-037) |
| 8 | Feed/Comunidade | `/tabs/feed` | `features/feed/feed.page.ts` | Estado vazio (IMP-041/044) |

## Peças centrais
| Arquivo | Responsabilidade |
|---|---|
| `core/config/app-config.ts` | Lê environment, valida chave (bloqueia secret), limites de foto |
| `core/supabase/supabase.service.ts` | Único `createClient`; `client` lança `config_missing` sem configuração |
| `core/auth/auth.service.ts` | Sessão e perfil em signals, `init()` no boot, login/saída, carga cancelável de perfil e `previewMode` |
| `core/profiles/profile.service.ts` | Lê/cria o próprio perfil sem sobrescrever apelido existente (IMP-032); fonte do nome exibido |
| `core/auth/auth.guards.ts` | `authGuard` (libera em pré-visualização) e `guestGuard` |
| `core/device/photo.service.ts` | takePhoto/chooseFromGallery + reencode JPEG sem EXIF ≤ 2048 px / 5 MB |
| `core/device/location.service.ts` | Permissão + leitura única de GPS com accuracy; erros mapeados |
| `core/errors/app-error.ts` | `AppError` (código + mensagem pt-BR) e `toUserMessage` |
| `core/models/*` | Tipos de domínio, BeeAnalysisV2, conquistas (D23) |
| `features/register/registration-draft.store.ts` | Foto/consentimento/GPS em memória entre telas 3 e 4 |
| `app.component.ts` | Ao perder sessão: limpa rascunho e volta ao login |

## Modo pré-visualização
Sem `publishableKey`, o app abre todas as telas com aviso amarelo; login e salvamento ficam desabilitados. Câmera, preview e GPS funcionam (são locais). Serve para desenvolver UI antes das chaves.
