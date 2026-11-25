# Aplicação manual da fundação Ofir

A fundação foi aplicada ao projeto `velasofir_site` (`hzgxmamkxwlotyappiwm`) em 12/11/2026, com versão remota `20261112195735`. Cinco produtos preservados; RLS e oito políticas conferidos. As instruções abaixo servem para futuras alterações: apresentar o dry-run ao responsável antes de qualquer aplicação remota.

## Antes de aplicar

1. No Dashboard, abra o projeto cujo **Project Ref** pertence à Ofir. A integração conectada ao Codex ainda está usando a conta `Primary`, então confirme o projeto pelo próprio Dashboard.
2. No SQL Editor desse projeto, execute o conteúdo de [`preflight.sql`](./preflight.sql). Confira as colunas e as políticas existentes; guarde uma cópia/backup antes de mudar o esquema.
3. Se `supabase_migrations.schema_migrations` não existir (erro `42P01`), o projeto ainda não tem histórico registrado pela CLI. Isso não confirma se o SQL foi executado manualmente. Não crie essa tabela à mão: a CLI a inicializa ao aplicar a primeira migration.
4. Revise [`migrations/20261112195735_platform_foundation.sql`](./migrations/20261112195735_platform_foundation.sql). Ela aceita as tabelas da plataforma que já existem, preserva as linhas de `products` e cria apenas as que estiverem ausentes. Ela repõe as políticas RLS de `products`, `staff_members`, `workshops` e `audit_log` com as regras MFA da Ofir, e interrompe se encontrar slugs duplicados/inválidos ou valores fora das regras comerciais. Não altera pedidos, clientes, carrinhos, pagamentos, dados de Auth, Storage ou outros projetos; a tabela de equipe referencia `auth.users`.

Se a tabela `products` existente não tiver `id`, `name` e `price`, a migration aborta com erro antes das alterações. Não invente preços para contornar essa validação.

## Aplicar com histórico de migrations

No terminal, na raiz do projeto. A CLI está fixada na série 2 para evitar mudanças de comportamento da CLI 3 em operações remotas:

```powershell
npx --yes supabase@2.120.0 init
npx --yes supabase@2.120.0 login
npx --yes supabase@2.120.0 link --project-ref hzgxmamkxwlotyappiwm
npx --yes supabase@2.120.0 migration list
npx --yes supabase@2.120.0 db push --dry-run
npx --yes supabase@2.120.0 db push
```

Use apenas o Project Ref confirmado no Dashboard da Ofir. O `db push` aplica migrations locais pendentes; não use `db reset --linked`.

## Liberar seu acesso administrativo

A migration não escolhe um administrador nem cria uma conta de Auth. Primeiro crie/convide sua conta em **Authentication → Users**. Depois, em uma consulta SQL privada, insira o UUID dessa conta:

```sql
insert into public.staff_members (user_id, role, active)
values ('COLE_AQUI_O_UUID_DA_SUA_CONTA_AUTH'::uuid, 'owner', true)
on conflict (user_id)
do update set role = 'owner', active = true;
```

Não salve o UUID em arquivo versionado. Entre no `/admin` com essa conta e configure o autenticador MFA; o painel exige MFA.

## Após aplicar

Configure no ambiente local e no deploy `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` do mesmo projeto. Mantenha qualquer chave `secret` apenas no servidor. Ainda não ative checkout ASAAS nem Redis; pedidos e ingressos não fazem parte desta migration.

## Extensão de workshops aplicada

`20261112205418_workshop_tickets_media.sql` está registrada no Supabase da Ofir. Inclui galeria, tipos de ingresso e bucket exclusivo para divulgação com upload protegido por equipe ativa e MFA. O preço/capacidade do workshop existente foram preservados. Ver detalhes e limites em `docs/PLATFORM.md`.

## Blog aplicado

`20261112213316_blog_publishing.sql` cria artigos, RLS, datas/auditoria e bucket de capas. Importa os dois guias existentes sem mudar URLs. Testada em PostgreSQL local com rascunhos, visitante, cliente e equipe com/sem MFA. Não altera tabelas legadas de clientes, pedidos ou pagamentos.

## ASAAS aplicado

`20261112215550_asaas_order_flow.sql` cria pedidos assistidos e registro de eventos, com RLS e RPCs somente do servidor. Não cria cobranças ou pedidos, não altera dados do catálogo e não ativa produção. Homologação e limites em `docs/ASAAS.md`.

## Preferências de pagamento no catálogo

20261124211503_catalog_payment_preferences.sql adiciona o campo payment_preference em produtos e workshops. Aplicada no Supabase da Ofir. Opções do admin controlam limite de parcelas no cartão e exclusão de boleto no Checkout Pro; quando o carrinho mistura itens, prevalece a regra mais restritiva.

