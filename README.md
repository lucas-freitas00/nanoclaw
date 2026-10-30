<p align="center">
  <img src="assets/nanoclaw-logo.png" alt="NanoClaw" width="400">
</p>

<p align="center">
  An AI assistant that runs agents securely in their own containers. Lightweight, built to be easily understood and completely customized for your needs.
</p>

<p align="center">
  <a href="https://nanoclaw.dev">nanoclaw.dev</a>&nbsp; • &nbsp;
  <a href="README_zh.md">中文</a>&nbsp; • &nbsp;
  <a href="README_ja.md">日本語</a>&nbsp; • &nbsp;
  <a href="https://discord.gg/VDdww8qS42"><img src="https://img.shields.io/discord/1470188214710046894?label=Discord&logo=discord&v=2" alt="Discord" valign="middle"></a>&nbsp; • &nbsp;
  <a href="repo-tokens"><img src="repo-tokens/badge.svg" alt="34.9k tokens, 17% of context window" valign="middle"></a>
</p>

---

## Why I Built NanoClaw

[OpenClaw](https://github.com/openclaw/openclaw) is an impressive project, but I wouldn't have been able to sleep if I had given complex software I didn't understand full access to my life. OpenClaw has nearly half a million lines of code, 53 config files, and 70+ dependencies. Its security is at the application level (allowlists, pairing codes) rather than true OS-level isolation. Everything runs in one Node process with shared memory.

NanoClaw provides that same core functionality, but in a codebase small enough to understand: one process and a handful of files. Claude agents run in their own Linux containers with filesystem isolation, not merely behind permission checks.

## Quick Start

```bash
gh repo fork qwibitai/nanoclaw --clone
cd nanoclaw
claude
```

<details>
<summary>Without GitHub CLI</summary>

1. Fork [qwibitai/nanoclaw](https://github.com/qwibitai/nanoclaw) on GitHub (click the Fork button)
2. `git clone https://github.com/<your-username>/nanoclaw.git`
3. `cd nanoclaw`
4. `claude`

</details>

Then run `/setup`. Claude Code handles everything: dependencies, authentication, container setup and service configuration.

> **Note:** Commands prefixed with `/` (like `/setup`, `/add-whatsapp`) are [Claude Code skills](https://code.claude.com/docs/en/skills). Type them inside the `claude` CLI prompt, not in your regular terminal. If you don't have Claude Code installed, get it at [claude.com/product/claude-code](https://claude.com/product/claude-code).

## Philosophy

**Small enough to understand.** One process, a few source files and no microservices. If you want to understand the full NanoClaw codebase, just ask Claude Code to walk you through it.

**Secure by isolation.** Agents run in Linux containers (Apple Container on macOS, or Docker) and they can only see what's explicitly mounted. Bash access is safe because commands run inside the container, not on your host.

**Built for the individual user.** NanoClaw isn't a monolithic framework; it's software that fits each user's exact needs. Instead of becoming bloatware, NanoClaw is designed to be bespoke. You make your own fork and have Claude Code modify it to match your needs.

**Customization = code changes.** No configuration sprawl. Want different behavior? Modify the code. The codebase is small enough that it's safe to make changes.

**AI-native.**
- No installation wizard; Claude Code guides setup.
- No monitoring dashboard; ask Claude what's happening.
- No debugging tools; describe the problem and Claude fixes it.

**Skills over features.** Instead of adding features (e.g. support for Telegram) to the codebase, contributors submit [claude code skills](https://code.claude.com/docs/en/skills) like `/add-telegram` that transform your fork. You end up with clean code that does exactly what you need.

**Best harness, best model.** NanoClaw runs on the Claude Agent SDK, which means you're running Claude Code directly. Claude Code is highly capable and its coding and problem-solving capabilities allow it to modify and expand NanoClaw and tailor it to each user.

## What It Supports

- **Multi-channel messaging** - Talk to your assistant from WhatsApp, Telegram, Discord, Slack, or Gmail. Add channels with skills like `/add-whatsapp` or `/add-telegram`. Run one or many at the same time.
- **Isolated group context** - Each group has its own `CLAUDE.md` memory, isolated filesystem, and runs in its own container sandbox with only that filesystem mounted to it.
- **Main channel** - Your private channel (self-chat) for admin control; every group is completely isolated
- **Scheduled tasks** - Recurring jobs that run Claude and can message you back
- **Web access** - Search and fetch content from the Web
- **Container isolation** - Agents are sandboxed in Docker (macOS/Linux), [Docker Sandboxes](docs/docker-sandboxes.md) (micro VM isolation), or Apple Container (macOS)
- **Agent Swarms** - Spin up teams of specialized agents that collaborate on complex tasks
- **Optional integrations** - Add Gmail (`/add-gmail`) and more via skills

## Usage

Talk to your assistant with the trigger word (default: `@Andy`):

```
@Andy send an overview of the sales pipeline every weekday morning at 9am (has access to my Obsidian vault folder)
@Andy review the git history for the past week each Friday and update the README if there's drift
@Andy every Monday at 8am, compile news on AI developments from Hacker News and TechCrunch and message me a briefing
```

From the main channel (your self-chat), you can manage groups and tasks:
```
@Andy list all scheduled tasks across groups
@Andy pause the Monday briefing task
@Andy join the Family Chat group
```

## Customizing

NanoClaw doesn't use configuration files. To make changes, just tell Claude Code what you want:

- "Change the trigger word to @Bob"
- "Remember in the future to make responses shorter and more direct"
- "Add a custom greeting when I say good morning"
- "Store conversation summaries weekly"

Or run `/customize` for guided changes.

The codebase is small enough that Claude can safely modify it.

## Contributing

**Don't add features. Add skills.**

If you want to add Telegram support, don't create a PR that adds Telegram to the core codebase. Instead, fork NanoClaw, make the code changes on a branch, and open a PR. We'll create a `skill/telegram` branch from your PR that other users can merge into their fork.

Users then run `/add-telegram` on their fork and get clean code that does exactly what they need, not a bloated system trying to support every use case.

### RFS (Request for Skills)

Skills we'd like to see:

**Communication Channels**
- `/add-signal` - Add Signal as a channel

## Requirements

- macOS or Linux
- Node.js 20+
- [Claude Code](https://claude.ai/download)
- [Apple Container](https://github.com/apple/container) (macOS) or [Docker](https://docker.com/products/docker-desktop) (macOS/Linux)

## Architecture

```
Channels --> SQLite --> Polling loop --> Container (Claude Agent SDK) --> Response
```

Single Node.js process. Channels are added via skills and self-register at startup — the orchestrator connects whichever ones have credentials present. Agents execute in isolated Linux containers with filesystem isolation. Only mounted directories are accessible. Per-group message queue with concurrency control. IPC via filesystem.

For the full architecture details, see [docs/SPEC.md](docs/SPEC.md).

Key files:
- `src/index.ts` - Orchestrator: state, message loop, agent invocation
- `src/channels/registry.ts` - Channel registry (self-registration at startup)
- `src/ipc.ts` - IPC watcher and task processing
- `src/router.ts` - Message formatting and outbound routing
- `src/group-queue.ts` - Per-group queue with global concurrency limit
- `src/container-runner.ts` - Spawns streaming agent containers
- `src/task-scheduler.ts` - Runs scheduled tasks
- `src/db.ts` - SQLite operations (messages, groups, sessions, state)
- `groups/*/CLAUDE.md` - Per-group memory

## FAQ

**Why Docker?**

Docker provides cross-platform support (macOS, Linux and even Windows via WSL2) and a mature ecosystem. On macOS, you can optionally switch to Apple Container via `/convert-to-apple-container` for a lighter-weight native runtime. For additional isolation, [Docker Sandboxes](docs/docker-sandboxes.md) run each container inside a micro VM.

**Can I run this on Linux?**

Yes. Docker is the default runtime and works on both macOS and Linux. Just run `/setup`.

**Is this secure?**

Agents run in containers, not behind application-level permission checks. They can only access explicitly mounted directories. You should still review what you're running, but the codebase is small enough that you actually can. See [docs/SECURITY.md](docs/SECURITY.md) for the full security model.

**Why no configuration files?**

We don't want configuration sprawl. Every user should customize NanoClaw so that the code does exactly what they want, rather than configuring a generic system. If you prefer having config files, you can tell Claude to add them.

**Can I use third-party or open-source models?**

Yes. NanoClaw supports any Claude API-compatible model endpoint. Set these environment variables in your `.env` file:

```bash
ANTHROPIC_BASE_URL=https://your-api-endpoint.com
ANTHROPIC_AUTH_TOKEN=your-token-here
```

This allows you to use:
- Local models via [Ollama](https://ollama.ai) with an API proxy
- Open-source models hosted on [Together AI](https://together.ai), [Fireworks](https://fireworks.ai), etc.
- Custom model deployments with Anthropic-compatible APIs

Note: The model must support the Anthropic API format for best compatibility.

**How do I debug issues?**

Ask Claude Code. "Why isn't the scheduler running?" "What's in the recent logs?" "Why did this message not get a response?" That's the AI-native approach that underlies NanoClaw.

**Why isn't the setup working for me?**

If you have issues, during setup, Claude will try to dynamically fix them. If that doesn't work, run `claude`, then run `/debug`. If Claude finds an issue that is likely affecting other users, open a PR to modify the setup SKILL.md.

**What changes will be accepted into the codebase?**

Only security fixes, bug fixes, and clear improvements will be accepted to the base configuration. That's all.

Everything else (new capabilities, OS compatibility, hardware support, enhancements) should be contributed as skills.

This keeps the base system minimal and lets every user customize their installation without inheriting features they don't want.

## Community

Questions? Ideas? [Join the Discord](https://discord.gg/VDdww8qS42).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for breaking changes and migration notes.

## License

MIT

---

## Informações da migração (30/10/2026)

> O texto acima é o README original do upstream (`qwibitai/nanoclaw`), preservado sem alterações. Este repositório é o **fork do Lucas** (`lucas-freitas00/nanoclaw`, público no GitHub), feito sobre o upstream em março/2026.

### Status

**Parado.** O último commit da default `main` é de 2026-03-24 00:48 BRT: "feat: add Telegram voice transcription, photo vision, document support". São 440 commits desde 2026-01-31. Os 5 últimos (24/03, autor `root`) são do Lucas e trazem:

- os merges das skill branches `whatsapp/main`, `telegram/main` e `whatsapp/skill/voice-transcription`;
- a correção "root-as-host permission issues";
- transcrição de voz, visão de foto e documentos no Telegram.

O repo continua relevante: é a **base** dos dois forks vivos (o `nanoclaw-pod/` do `agent-hub-worker` e o `nanoclaw-host` do nó). A memória do Adjutor (29/10/2026) o descreve como "mirror congelado" e diz que o fork vivo fica no `agent-hub-worker/nanoclaw-pod/`.

### Stack

- Node.js ≥ 20 (`.nvmrc` = 22), TypeScript ^5.7 e ESM. É o `nanoclaw` 1.2.17.
- Canais: grammy ^1.41 (Telegram) e `@whiskeysockets/baileys` ^7.0.0-rc.9 (WhatsApp).
- Dependências: better-sqlite3 ^11.8, zod ^4.3, openai ^6.27 (transcrição), cron-parser, pino, yaml e qrcode.
- Ferramentas de dev: vitest ^4, prettier ^3.8, husky ^9, eslint e tsx.
- Container do agente (`container/Dockerfile`): `node:22-slim` com o `agent-runner`, que usa `@anthropic-ai/claude-agent-sdk` ^0.2.76.

### Estrutura do repositório

| Pasta | O que é |
|---|---|
| `src/` | Processo host: `index.ts`, `router.ts`, `db.ts`, `ipc.ts`, `group-queue.ts`, `task-scheduler.ts`, `container-runner.ts`/`container-runtime.ts`, `credential-proxy.ts`, `transcription.ts`, `sender-allowlist.ts`, `remote-control.ts`, mais os testes vitest |
| `src/channels/` | Canais `telegram.ts` e `whatsapp.ts`, e o `registry.ts` |
| `container/` | `Dockerfile`, `build.sh`, `agent-runner/` (o subprocess que roda o Claude Agent SDK) e `skills/` |
| `setup/` | Assistente de instalação (`npm run setup`): ambiente, container, grupos, mounts, serviço, verificação e auth do WhatsApp |
| `.claude/` | Skills do Claude Code do projeto (add-telegram, add-slack etc.) |
| `docs/` | SPEC, SECURITY, REQUIREMENTS, SDK_DEEP_DIVE, skills-as-branches, debug checklist |
| `groups/`, `config-examples/`, `launchd/`, `scripts/`, `repo-tokens/`, `assets/` | Templates de grupos, exemplos de config, unit launchd (macOS), scripts auxiliares, badge de contagem de tokens, imagens |
| `.github/workflows/` | `ci.yml`, `bump-version.yml`, `label-pr.yml`, `merge-forward-skills.yml`, `update-tokens.yml` e `fork-sync-skills.yml` (este desabilitado), todos vindos do upstream. No GitHub, a última execução foi em 2026-04-22 (failure, schedule). **Não rodam no GitLab** |

### Como rodar / desenvolver

```bash
npm ci
npm run build        # tsc → dist/
npm start            # node dist/index.js
npm run dev          # tsx src/index.ts
npm run setup        # assistente de instalação (tsx setup/index.ts)
npm run auth         # pareamento do WhatsApp
npm test             # vitest run
npm run typecheck && npm run format:check
./container/build.sh # imagem do agent-runner (modo container do upstream)
```

### Deploy / onde roda em produção

**Este repositório não é implantado diretamente em lugar nenhum** (inventário de 30/10/2026). O código derivado dele roda em três lugares:

| Derivado | Onde | Observação |
|---|---|---|
| `agent-hub-worker/nanoclaw-pod/` | Pods da frota (ns `agents` no k3s) e pod do Adjutor (`/app`, nanoclaw 1.2.17, imagem `nanoclaw-pod-ops:0.1.0`) | `FORK.md` registra a base `89e0e8f` (= HEAD desta `main`) e o diff in-pod (Docker → subprocess) |
| **`nanoclaw-host`** (bot de reserva `workerk8s_bot`) | `nó:/home/dev/nanoclaw-host` (nó k3s `agents-k3s-01`), unit **de usuário** systemd `nanoclaw-host.service` (`node dist/index.js`, `EnvironmentFile=.env`), ativa | **Cópia sem `.git`** com fork próprio. Segundo o inventário §2.2, 17 arquivos de `src/`/agent-runner (telegram, db, index, transcription, container-runner…) diferem desta `main` **e também** do `nanoclaw-pod`. Ela traz o mesmo `FORK.md` e os `Dockerfile.pod*`, ou seja, deriva do `nanoclaw-pod`. **O código existe só no nó** |
| Peer `workerlaravelagents_bot` (histórico) | Container `laravel_augustus-agents` na VPS | Aposentado em 10/09/2026, depois de perder o código num redeploy (memória `peer-retired-single-operator`) |

### Configuração

Nesta seção aparecem só os nomes das variáveis.

- `.env.example`: `ASSISTANT_HAS_OWN_NUMBER`, `OPENAI_API_KEY`.
- `src/config.ts`: `ASSISTANT_NAME`, `CONTAINER_IMAGE`, `CONTAINER_TIMEOUT`, `CONTAINER_MAX_OUTPUT_SIZE`, `CREDENTIAL_PROXY_PORT`, `IDLE_TIMEOUT`, `MAX_CONCURRENT_CONTAINERS`, `TZ`.
- Lidas do `.env` (`src/env.ts`, canais, credential-proxy): `TELEGRAM_BOT_TOKEN`, `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`, `CLAUDE_CODE_OAUTH_TOKEN`, `OPENAI_API_KEY`.

Onde ficam os segredos do `nanoclaw-host`: em `nó:/home/dev/nanoclaw-host/.env`, que tem também 4 cópias `.env.bak-*`, e em `runtime/…/sessions/*.key`. Nada disso pode ser versionado.

### Branches

Default: `main`. É a única branch, não há tags. Não há nada para normalizar.

### Relação com outros projetos

- **Upstream:** `qwibitai/nanoclaw`, do qual este repo é fork.
- **agent-hub-worker** (`plataforma/agent-hub-worker`): `nanoclaw-pod/` é o fork in-pod vivo, montado sobre o commit `89e0e8f` deste repo. Dele saem as imagens `nanoclaw-pod-*` que o worker provisiona.
- **nanoclaw-host** (código só no nó): o inventário sugere criar um projeto `plataforma/nanoclaw-host` (ou uma branch a partir deste repo), excluindo `runtime/`, `node_modules/`, `dist/`, `.env*` e `*.bak-*`.

### Origem

Importado do GitHub `lucas-freitas00/nanoclaw` em 30/10/2026 (projeto GitLab id 8, grupo `plataforma`). O GitHub passa a ser espelho somente-leitura: **push só no GitLab** (`https://gitlab.194-163-171-140.sslip.io/plataforma/nanoclaw`).
