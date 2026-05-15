# 🚀 SmartCODE

> Plataforma de **vibe coding** com time autônomo de super agentes de IA.
> Fork do [SmartCODE](https://github.com/stackblitz-labs/SmartCODE) — MIT License.

---

## O que é o SmartCODE?

SmartCODE é uma plataforma onde você descreve o que quer construir em linguagem natural e um **time de agentes de IA especializados** gera, revisa e faz o deploy do código — tudo em tempo real, com preview ao vivo no browser via WebContainers.

Estilo Lovable / v0 / Bolt.new, mas com arquitetura multi-agente e totalmente open source.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Remix + Vite + UnoCSS |
| Editor | CodeMirror 6 |
| Preview | WebContainers (StackBlitz) |
| LLMs | Vercel AI SDK (Claude, GPT, Gemini, DeepSeek, Groq, Ollama...) |
| Agentes | LangGraph (roadmap) |
| Memória | pgvector (roadmap) |
| Deploy | Vercel / Netlify / Cloudflare Workers |

---

## Roadmap

### ✅ Fase 0 — Base (SmartCODE)
- Chat + editor + preview ao vivo
- Suporte a múltiplos LLMs
- Deploy one-click Vercel/Netlify
- Import de repos GitHub/GitLab

### 🔄 Fase 1 — MVP SmartCODE
- [ ] Customização de UI e branding
- [ ] Auth com NextAuth
- [ ] Persistência de projetos no banco
- [ ] Integração com Supabase

### 🤖 Fase 2 — Multi-agente
- [ ] Time de agentes com LangGraph (Arquiteto, Frontend Dev, Backend Dev, Reviewer, Deployer)
- [ ] Memória de projeto com pgvector
- [ ] Diff visual das mudanças
- [ ] Histórico de versões por prompt

### 🚀 Fase 3 — Produto
- [ ] Billing com Stripe
- [ ] Marketplace de templates
- [ ] Subdomínios dinâmicos por projeto
- [ ] Sandboxes isolados com E2B

---

## Setup local

```bash
# Clone o repo
git clone https://github.com/mmpavao/SmartCODE.git
cd SmartCODE

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas API keys (mínimo: ANTHROPIC_API_KEY ou OPENAI_API_KEY)

# Rode em desenvolvimento
pnpm run dev
```

Acesse: `http://localhost:5173`

---

## Variáveis de ambiente essenciais

```env
# Escolha pelo menos um LLM
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Para deploy automático (opcional)
VITE_VERCEL_ACCESS_TOKEN=...
VITE_GITHUB_ACCESS_TOKEN=...
```

---

## Contribuindo

Este projeto está em desenvolvimento ativo. Issues e PRs são bem-vindos.

---

**Desenvolvido por [Marcio Pavão](https://github.com/mmpavao)**
