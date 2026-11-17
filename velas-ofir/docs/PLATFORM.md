# Fundação da plataforma Ofir

Domínio oficial: https://velasofir.com.br. Next.js com renderização no servidor. Sem deploy nesta entrega. Supabase remoto sincronizado em 12/11/2026.

## Entregue

- Início, loja, páginas de produtos, workshops e LP por turma, portal de conteúdo e guias.
- Catálogo no servidor via Supabase; flags de pronta entrega, encomenda e esgotado e filtros acessíveis.
- Cadastro de produtos e turmas pela equipe após conectar o banco e aplicar o esquema. Datas de workshops em horário de Brasília.
- Administração com conta individual, autorização consultada no banco em cada operação e MFA obrigatório.
- Migração local com RLS, preservação dos produtos antigos e auditoria. Validada em PostgreSQL local com identidades simuladas; ainda exige revisão e advisors no Supabase correto.
- Metadados por página, canonical oficial, sitemap e robots dinâmicos. Redirect permanente de `/catalogo` para `/loja`.
- Adaptador ASAAS no servidor, sandbox por padrão e checkout desativado. Contratos de dados cobertos por testes locais, sem transações financeiras.
- Redis opcional e desativado. Navegação e administração não dependem dele.

Sem credenciais, o site apresenta estados de espera e contato. Não inventa produtos, preços, datas, depoimentos ou contagens de vagas. Fotos locais existentes foram reaproveitadas.

## Supabase

Projeto conectado: `velasofir_site` (`hzgxmamkxwlotyappiwm`). Em 12/11/2026, a migração `20261112195735_platform_foundation.sql` foi aplicada e registrada no histórico remoto. Os cinco produtos existentes foram preservados; RLS está ativo nas quatro tabelas geridas e oito políticas foram verificadas. A configuração local aponta para este projeto. Não criar banco substituto nem usar projetos de outros negócios.

O primeiro proprietário foi autorizado em `staff_members` após aprovação explícita, com papel `owner` ativo. O cadastro do autenticador MFA deve ser concluído pelo titular no `/admin`; nenhuma senha ou credencial padrão foi criada. Os advisors também apontam funções legadas SECURITY DEFINER expostas (`is_staff`, `protect_client_access_column`, `rls_auto_enable`) e proteção contra senhas vazadas desativada; essas pendências não foram alteradas nesta sincronização.

1. Inspecionar tabelas, tipos, políticas, buckets e advisors no projeto correto. Fazer backup e validar restauração.
2. Revisar `supabase/migrations/20261112195735_platform_foundation.sql` conforme o esquema real. Ela substitui políticas de `products` para impedir que políticas permissivas antigas contornem a segurança. Não aplicar sem revisão.
3. Aplicar em homologação primeiro. Executar advisors e testes com visitante, cliente e equipe com/sem MFA.
4. Configurar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` da conta correta em `.env.local`. A configuração antiga tem somente a chave anterior; por isso `/admin` explica como conectar o banco até que as duas variáveis existam. `SUPABASE_SECRET_KEY` é exclusiva do servidor para operações futuras, nunca do navegador.
5. Criar o proprietário no Auth e inserir seu UUID em `staff_members` com papel `owner` usando acesso confiável. Não existe conta/senha padrão. Convites e revogações por interface ainda serão desenvolvidos.
6. Entrar em `/admin` e verificar/cadastrar o autenticador. Configurar URLs de Auth e políticas de sessão no projeto.

Estoque antigo permanece NULL até conferência. O painel inicial cadastra produtos/turmas; edição completa, upload e gestão de acessos são próximas etapas. Imagens nesta versão são URLs HTTPS. Políticas de Storage ainda precisam de auditoria antes de habilitar uploads.

## ASAAS: manter COMMERCE_ENABLED=false

Configurar sandbox e variáveis `ASAAS_ENVIRONMENT`, `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN`. Antes de ativar vendas, implementar e homologar:

- Pedidos com preços em centavos validados no banco e reservas transacionais de estoque/vagas.
- Expiração, pagamento tardio, persistência/reconciliação de checkout e recuperação de timeout sem cobrança duplicada.
- Frete, endereço e prazo antes do pagamento.
- Webhook autenticado, eventos duráveis, idempotência e transições de pedido em transações.
- Ingressos únicos, check-in, e-mails e área da cliente.
- Reembolsos, chargebacks e reconciliação financeira.
- CNPJ, conta de produção, políticas comerciais e de privacidade finais.

`createAsaasCheckout` não é exposto por rota pública e nunca deve receber preços do navegador. Não existe webhook público aceitando/descartando eventos nesta entrega. O parser descarta campos pessoais desnecessários. A página de retorno não marca pedidos como pagos. Parcelamento será configurado após fechar as condições de recebimento da conta; o adaptador inicial prevê Pix e cartão à vista.

## Redis: segundo momento

Manter `REDIS_ENABLED=false`. Quando o site estiver pronto, conectar uma conta gratuita exclusiva. Não usar `garagem-redis`. Credenciais só no servidor. Cache falha de volta ao banco. Limitador preparado falha de forma restritiva, mas não está ligado às rotas; login usa controles do Supabase Auth. Antes de ativar vendas, definir limites no perímetro/servidor mesmo que Redis continue adiado.

## Pendências comerciais

- Origem exata em Guarulhos, tarifa e agenda da entrega própria. Função local calcula raio de 40 km em linha reta, ainda sem geocodificação/cotação pública.
- Contrato ou intermediador dos Correios, peso e dimensões embalados.
- Prazos de produção por produto. Proposta para pedidos mistos: uma entrega após concluir produção.
- Dados, fotos, preço e programação do primeiro workshop.
- Política proposta: cancelamento de workshop até sete dias antes, preservando direitos legais. Textos públicos provisórios não liberam checkout.

## Publicação e legado

`netlify.toml` usa `.next` e remove o rewrite SPA. Conferir diretório base `velas-ofir` na Netlify. Variáveis de servidor precisam dos escopos de builds e functions; alterações exigem novo deploy. Nenhuma publicação automática foi acionada nesta entrega.

Código Vite anterior preservado fora da compilação nova (`src/App.tsx`, `src/legacy-pages`, etc.). A pasta foi renomeada para impedir que Next a interprete como Pages Router. Next usa `src/app` e `src/platform`. Scripts `legacy:dev` e `legacy:build` mantêm acesso ao legado. Robots/sitemap da raiz pertencem ao legado; Next usa rotas de metadados.

Não commitar `.env`/`.env.local`. O arquivo `.env` legado foi movido para `.env.local`, preservando a configuração local e retirando-o da próxima versão. O histórico ainda contém a antiga chave pública. Chaves publicáveis não são segredos e dependem de RLS correto; caso outros segredos reais sejam encontrados em auditoria do histórico, eles devem ser rotacionados.

## Verificação

`npm test` cobre regras comerciais, contratos ASAAS e políticas reais de PostgreSQL via PGlite. As identidades de teste simulam claims do Supabase; não substituem Auth/MFA/Storage reais. Rodar também `npm run typecheck` e `npm run build`. Homologação com serviços reais só após reconexão.

## Painel administrativo

O `/admin` usa interface própria com sidebar responsiva, visão geral, produtos, estoque, workshops/LPs, compras, inscrições e cancelamentos/reembolsos. MFA continua obrigatório. A equipe de edição acessa o catálogo; somente owner/admin consultam o histórico de compras, por uma leitura exclusiva do servidor com `SUPABASE_SECRET_KEY`. Sem essa configuração ou com falha na consulta, o painel mostra dados indisponíveis.

Os indicadores usam `buy_history`: compradores únicos de produtos pagos/entregues, quantidade de ingressos pagos/entregues e registros cancelados/reembolsados. Não representam solicitações de devolução física nem lista nominal de participantes por turma; esses fluxos precisam de modelagem e integração com pedidos. Nenhuma tabela antiga foi alterada.

Estoque e publicação de produtos/LPs podem ser atualizados com autorização e MFA revalidados na API e no RLS. O cadastro de workshop gera slug único no servidor; a landing page usa título, foto, descrição, programação, inclusões, local, data e preço cadastrados. Rascunhos permanecem privados. A inscrição continua via contato enquanto checkout estiver desativado.

## Workshops: imagens e tipos de ingresso

Migração `20261112205418_workshop_tickets_media.sql` aplicada em 12/11/2026. Adiciona `images` e `ticket_types` à turma e permite ingresso gratuito. O workshop existente preservou preço e capacidade, com um ingresso individual de compatibilidade. Não altera tabelas de clientes ou pagamentos.

No painel é possível cadastrar e editar workshops sem trocar o endereço da LP. Descrições preservam espaços e quebras de linha. A galeria recebe até oito JPG/PNG/WebP de até 5 MB; a primeira foto é a capa. O servidor valida a imagem, limita dimensões, remove metadados e converte para WebP. O bucket público `workshop-media` é exclusivo de divulgação e só aceita uploads de owner/admin/editor ativos com MFA, na pasta do próprio usuário. Retirar uma foto da seleção não apaga o arquivo do Storage; arquivos enviados e não utilizados precisam de limpeza posterior.

Cada tipo/lote tem nome, descrição, preço por pessoa (inclusive gratuito), quantidade de lugares, limites por pedido e início/fim de disponibilidade em Brasília. Soma das quantidades não pode exceder a capacidade. Datas não podem ultrapassar o início do evento. A LP apresenta os tipos e seus períodos; não implementa virada automática por esgotamento, reserva de vagas, pagamento ou emissão de ingressos. Checkout continua desativado.

## Vídeos na LP de workshops

Migração `20261112210149_workshop_youtube_videos.sql` aplicada em 12/11/2026: campo opcional `youtube_videos`, vazio por padrão, com até cinco URLs canônicas de incorporação. Cadastro e edição aceitam links HTTPS de vídeos normais, links curtos, Shorts, lives e embeds; normalizam para `youtube-nocookie.com/embed/VIDEO_ID`. Não aceitam HTML nem hosts externos. A restrição no banco também valida o domínio e formato.

A LP exibe capa, galeria com links para fotos em tamanho completo e players responsivos, carregados sob demanda pelo navegador, sem autoplay, com tela cheia e link alternativo para o YouTube. Vídeos privados ou com incorporação desativada pelo autor dependem das permissões do próprio YouTube.

## Edição de produtos

Em Produtos, o botão “Editar produto” abre o formulário preenchido com nome, descrição, coleção, preço, estoque, foto, encomendas, prazo e publicação. Salvar usa atualização por ID, com autorização/MFA/RLS existentes. O endereço público é preservado, inclusive nos produtos legados que antes usavam endereço derivado do nome e ID. Estoque não conferido pode continuar vazio (NULL). Campos fora do formulário são preservados.

## Upload de imagens no painel

Produtos e workshops usam o mesmo componente e processamento de upload. Produtos recebem uma foto com prévia e substituição direta; workshops mantêm galeria com capa. Campos de URL foram removidos dos cadastros atuais. Imagens legadas são preservadas e podem ser substituídas pelo envio de um arquivo. O upload aceita JPG/PNG/WebP de até 5 MB e bloqueia o salvamento enquanto estiver em andamento.

Migração `20261112211555_product_image_upload.sql` aplicada em 12/11/2026: bucket público `product-media`, com inserção restrita a owner/admin/editor ativos com MFA e pasta do próprio usuário. Não altera o bucket legado `products` nem as fotos existentes. Componentes de novas áreas de gestão de imagens devem reutilizar o fluxo de upload, sem pedir URLs.

## Identidade visual pública

Restilização baseada na referência do Instagram fornecida pelo responsável: logo original, branco/preto e dourado discreto, tipografia serifada, composição editorial e fotografias reais em destaque. A home usa imagens de produtos e de workshop cadastradas no Supabase; imagens locais existentes servem apenas como fallback. A camada `src/app/brand.css` é limitada à área pública (`.storefront`). Mantidos uploads no painel, fotos de produto centralizadas com cover e a LP com banner de até 60% da tela e cartões sobrepostos.

## Blog e publicação editorial

Migração `20261112213316_blog_publishing.sql` aplicada em 12/11/2026. A seção **Blog e conteúdos** no painel permite criar/editar artigos, salvar rascunhos, publicar, retirar do ar e pré-visualizar. Capa e imagens no texto são enviadas pelo sistema (bucket `blog-media`, mesmas validações e MFA dos demais uploads). Editor usa Markdown com botões para seções, negrito, listas e links. HTML bruto é ignorado; imagens devem receber descrição alternativa real.

Os dois guias fixos foram importados com os mesmos endereços. A data visível passa a representar sua publicação no CMS em 12/11/2026; não é uma estimativa da data histórica original. Slugs são permanentes após o primeiro salvamento. Publicação inicial e atualização são registradas pelo banco, sem aceitar datas forjadas do navegador. As permissões contemplam owner/admin/editor ativos com MFA. Visitantes só leem publicados. Rascunhos não aparecem em páginas públicas, home, sitemap ou metadados; prévia fica dentro do painel protegido. Retirar do ar retorna 404 ao público.

### SEO e descoberta por IA

- Conteúdo renderizado no servidor; título único, resumo visível, hierarquia de seções, autoria e datas verdadeiras.
- Canonical oficial, Open Graph e Twitter Cards; título/descrição SEO opcionais com fallback para o conteúdo editorial.
- `BlogPosting` e `BreadcrumbList` em JSON-LD refletem o artigo visível, sem avaliações ou credenciais inventadas.
- Sitemap inclui apenas publicados e usa `updated_at` como `lastModified`. A home/listagem consultam as publicações atuais. Robots preserva bloqueio de admin/API e permite páginas públicas.
- O editor orienta resposta direta, exemplos originais, fontes verificáveis e links internos relevantes. Tamanho do título/descrição é orientação, não garantia nem pontuação artificial.
- Não há promessa de ranking/citação em IA, schema especial para IA, keyword stuffing ou arquivo `llms.txt` apresentado como requisito. A qualidade e exatidão editorial continuam sob responsabilidade da equipe.

Referências: https://developers.google.com/search/docs/appearance/ai-features e https://developers.google.com/search/docs/appearance/structured-data/article . Após publicar o site, acompanhar indexação e sitemap no Search Console. Nenhum deploy foi realizado nesta etapa.

## Pedidos e ASAAS

Implementação de venda assistida no painel concluída: geração de link Pix/cartão, reservas transacionais, idempotência e webhooks com conferência de valor. Migração `20261112215550_asaas_order_flow.sql` aplicada. Sandbox isolado do estoque/vagas de produção; sem cobrança criada nesta etapa. Confira configuração, homologação e limites em [ASAAS.md](ASAAS.md). Produção, checkout público e Redis continuam desativados. Reembolsos, chargebacks e emissão de ingressos ainda exigem fluxos próprios.

## Largura das páginas

Containers públicos, header e footer compartilham a mesma largura (até 1440 px no desktop, margens responsivas no tablet/celular). Artigos, descrições e LPs usam a largura disponível, preservando a sobreposição do banner da LP.

## Páginas de relacionamento

`/boas-vindas` está pronta como destino após cadastro de clientes. O cadastro público de clientes ainda não existe; esta entrega não adiciona autenticação nem altera configurações de Auth. `/esta-indo-embora` é o novo destino de saída do checkout ASAAS; `/compra/cancelada` preserva compatibilidade. Essas páginas não alteram pedidos/pagamentos e não são indexáveis. Vídeos opcionais, a fornecer depois, são configurados por `WELCOME_YOUTUBE_URL` e `GOODBYE_YOUTUBE_URL`; somente links YouTube válidos são incorporados, sem player vazio ou vídeo inventado. Campos de configuração no painel não fazem parte desta entrega reduzida.
