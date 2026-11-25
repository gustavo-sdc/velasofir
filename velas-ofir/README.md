# Ofir — loja, workshops e conteúdo

Aplicação Next.js com TypeScript, Tailwind CSS, Supabase Auth e Checkout Pro do Mercado Pago. Consulte [a plataforma](docs/PLATFORM.md) e [o checkout Mercado Pago](docs/MERCADO-PAGO.md).

## Desenvolvimento

Dentro de `velas-ofir/`, com Node.js 22.14 ou superior:

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

Copie `.env.example` para `.env.local`, preservando configurações existentes. Não versione credenciais.

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| `src/app/` | Rotas, APIs, layouts, estilos, favicon e metadados |
| `src/assets/brand/` | Identidade visual |
| `public/media/` | Imagens e vídeo locais da home |
| `src/platform/components/` | Componentes públicos e administrativos |
| `src/platform/domain/` | Regras de negócio e validações |
| `src/platform/server/` | Integrações e operações do servidor |
| `src/platform/content.ts` | Conteúdo estático |
| `src/platform/site.ts` | Identidade do site e utilitários |
| `src/proxy.ts` | Sessão nas requisições |
| `supabase/` | Migrações e verificações do banco |
| `tests/` | Testes de domínio, integrações e banco |
| `scripts/` | Ferramentas de verificação |
| `docs/` | Documentação operacional |

`.next/` e `node_modules/` são gerados e ignorados pelo Git. A versão Vite anterior foi removida e permanece no histórico do Git. `velas-ofir/` continua sendo o diretório base do deploy na Netlify.

## Imagens e vídeo da home

Adicione suas mídias em `public/media/images/` e `public/media/videos/`. Consulte [os nomes e posições](public/media/README.md). A seção Experiências Ofir usa `public/media/videos/workshop.mp4` como vídeo de fundo.
