import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("migração preserva catálogo e aplica permissões reais no PostgreSQL", async (t) => {
  const db = new PGlite();
  const owner = "11111111-1111-4111-8111-111111111111";
  const customer = "22222222-2222-4222-8222-222222222222";
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $fn$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $fn$;
    create function auth.jwt() returns jsonb language sql stable as $fn$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $fn$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    create table public.products(id uuid primary key default gen_random_uuid(),name text not null,price numeric(12,2),status text default 'disponivel',kind text default 'produto',"order" integer default 0);
    alter table public.products enable row level security;
    create policy old_open_access on public.products for all to anon,authenticated using(true) with check(true);
    grant all on public.products to anon,authenticated;
    insert into public.products(name,price) values('Vela existente',35.90);
    insert into auth.users(id) values('${owner}'),('${customer}');
  `);
  try {
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20261112195735_platform_foundation.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.query(
      "insert into public.staff_members(user_id,role) values($1,$2)",
      [owner, "owner"],
    );
    await db.exec(`
      create schema storage;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id bigint generated always as identity,bucket_id text,name text);
      alter table storage.objects enable row level security;
      create function storage.foldername(text) returns text[] language sql immutable as $fn$ select (string_to_array($1,'/'))[1:1] $fn$;
      grant usage on schema storage to anon,authenticated;
      grant insert on storage.objects to anon,authenticated;
      grant usage on sequence storage.objects_id_seq to anon,authenticated;
      insert into public.workshops(slug,title,description,starts_at,location,price_cents,capacity,image)
      values('turma-existente','Turma existente','Descrição existente','2099-01-01','Guarulhos',20000,10,'https://example.com/photo.jpg');
    `);
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20261112205418_workshop_tickets_media.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20261112210149_workshop_youtube_videos.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await t.test(
      "vídeos opcionais preservam a turma e banco rejeita destinos não autorizados",
      async () => {
        assert.deepEqual(
          (await db.query("select youtube_videos from public.workshops"))
            .rows[0].youtube_videos,
          [],
        );
        await assert.rejects(() =>
          db.query(
            "update public.workshops set youtube_videos=array['https://evil.test/embed/video']",
          ),
        );
        await db.query(
          "update public.workshops set youtube_videos=array['https://www.youtube-nocookie.com/embed/M7lc1UVf-VE']",
        );
        assert.equal(
          (await db.query("select youtube_videos from public.workshops"))
            .rows[0].youtube_videos.length,
          1,
        );
      },
    );
    await db.exec(
      `insert into public.products(name,price,published) values('Rascunho',99,false)`,
    );
    async function asUser(role, user, aal, action) {
      await db.exec(`set role ${role}`);
      await db.query(
        "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",
        [user ?? "", JSON.stringify({ aal })],
      );
      try {
        return await action();
      } finally {
        await db.exec("reset role");
      }
    }
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20261112211555_product_image_upload.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20261112213316_blog_publishing.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await t.test(
      "blog mantém os guias existentes, protege rascunhos e exige MFA para publicar",
      async () => {
        const baseline = (
          await db.query(
            "select count(*)::int as total from public.blog_posts where published",
          )
        ).rows[0].total;
        assert.equal(baseline, 2);
        let articleId;
        await asUser("authenticated", owner, "aal2", async () => {
          articleId = (
            await db.query(
              "insert into public.blog_posts(slug,title) values('rascunho-local','Rascunho local') returning id",
            )
          ).rows[0].id;
          assert.equal(
            (
              await db.query("select * from public.blog_posts where id=$1", [
                articleId,
              ])
            ).rows.length,
            1,
          );
        });
        await asUser("anon", null, "aal1", async () => {
          assert.equal(
            (
              await db.query("select * from public.blog_posts where id=$1", [
                articleId,
              ])
            ).rows.length,
            0,
          );
          assert.equal(
            (await db.query("select * from public.blog_posts")).rows.length,
            baseline,
          );
          await assert.rejects(() =>
            db.query(
              "insert into public.blog_posts(slug,title) values('invasao','Invasão')",
            ),
          );
        });
        for (const [user, aal] of [
          [customer, "aal2"],
          [owner, "aal1"],
        ]) {
          await asUser("authenticated", user, aal, async () => {
            assert.equal(
              (
                await db.query("select * from public.blog_posts where id=$1", [
                  articleId,
                ])
              ).rows.length,
              0,
            );
            assert.equal(
              (
                await db.query(
                  "update public.blog_posts set title='Alteração indevida' returning id",
                )
              ).rows.length,
              0,
            );
            await assert.rejects(() =>
              db.query(
                "insert into public.blog_posts(slug,title) values('invasao-cliente','Invasão cliente')",
              ),
            );
          });
        }
        await asUser("authenticated", owner, "aal2", async () => {
          await assert.rejects(() =>
            db.query(
              "update public.blog_posts set published=true where id=$1",
              [articleId],
            ),
          );
          await db.query(
            "update public.blog_posts set excerpt=$1,content=$2,published=true,published_at='2000-01-01' where id=$3",
            [
              "Resumo editorial com mais de trinta caracteres.",
              "Conteúdo claro e original para o blog. ".repeat(5),
              articleId,
            ],
          );
          const row = (
            await db.query(
              "select published_at from public.blog_posts where id=$1",
              [articleId],
            )
          ).rows[0];
          assert.notEqual(new Date(row.published_at).getUTCFullYear(), 2000);
          await assert.rejects(() =>
            db.query(
              "update public.blog_posts set slug='outro-endereco' where id=$1",
              [articleId],
            ),
          );
        });
        await asUser("anon", null, "aal1", async () => {
          assert.equal(
            (
              await db.query("select * from public.blog_posts where id=$1", [
                articleId,
              ])
            ).rows.length,
            1,
          );
        });
        await asUser("authenticated", owner, "aal2", async () => {
          await db.query(
            "update public.blog_posts set published=false where id=$1",
            [articleId],
          );
          await db.query(
            "insert into storage.objects(bucket_id,name) values('blog-media',$1)",
            [`${owner}/cover.webp`],
          );
        });
        await asUser("anon", null, "aal1", async () => {
          assert.equal(
            (
              await db.query("select * from public.blog_posts where id=$1", [
                articleId,
              ])
            ).rows.length,
            0,
          );
        });
      },
    );
    await t.test(
      "fotos de produtos exigem equipe com MFA e pasta própria",
      async () => {
        await asUser("anon", null, "aal1", async () => {
          await assert.rejects(() =>
            db.query(
              "insert into storage.objects(bucket_id,name) values('product-media',$1)",
              [`${owner}/photo.webp`],
            ),
          );
        });
        for (const [user, aal] of [
          [customer, "aal2"],
          [owner, "aal1"],
        ]) {
          await asUser("authenticated", user, aal, async () => {
            await assert.rejects(() =>
              db.query(
                "insert into storage.objects(bucket_id,name) values('product-media',$1)",
                [`${user}/photo.webp`],
              ),
            );
          });
        }
        await asUser("authenticated", owner, "aal2", async () => {
          await assert.rejects(() =>
            db.query(
              "insert into storage.objects(bucket_id,name) values('product-media',$1)",
              [`${customer}/photo.webp`],
            ),
          );
          await db.query(
            "insert into storage.objects(bucket_id,name) values('product-media',$1)",
            [`${owner}/photo.webp`],
          );
        });
      },
    );
    await t.test(
      "migração preserva preço e vagas da turma existente",
      async () => {
        const { rows } = await db.query(
          "select price_cents,capacity,ticket_types,images from public.workshops",
        );
        assert.equal(rows[0].price_cents, 20000);
        assert.equal(rows[0].capacity, 10);
        assert.equal(rows[0].ticket_types[0].quantity, 10);
        assert.equal(rows[0].ticket_types[0].price_cents, 20000);
        assert.deepEqual(rows[0].images, ["https://example.com/photo.jpg"]);
      },
    );
    await t.test(
      "upload exige equipe ativa, MFA e pasta do usuário",
      async () => {
        for (const [user, aal] of [
          [customer, "aal2"],
          [owner, "aal1"],
        ]) {
          await asUser("authenticated", user, aal, async () => {
            await assert.rejects(() =>
              db.query(
                "insert into storage.objects(bucket_id,name) values('workshop-media',$1)",
                [`${user}/photo.webp`],
              ),
            );
          });
        }
        await asUser("authenticated", owner, "aal2", async () => {
          await assert.rejects(() =>
            db.query(
              "insert into storage.objects(bucket_id,name) values('workshop-media',$1)",
              [`${customer}/photo.webp`],
            ),
          );
          await db.query(
            "insert into storage.objects(bucket_id,name) values('workshop-media',$1)",
            [`${owner}/photo.webp`],
          );
        });
      },
    );
    await t.test("visitante só lê publicados e não escreve", async () => {
      await asUser("anon", null, "aal1", async () => {
        assert.deepEqual(
          (await db.query("select name,stock_quantity from public.products"))
            .rows,
          [{ name: "Vela existente", stock_quantity: null }],
        );
        await assert.rejects(() =>
          db.exec(
            "insert into public.products(name,price) values('Invasão',1)",
          ),
        );
        await assert.rejects(() =>
          db.query("select * from public.staff_members"),
        );
      });
    });
    await t.test(
      "cliente não vira administrador nem lê membros de outras contas",
      async () => {
        await asUser("authenticated", customer, "aal2", async () => {
          assert.equal(
            (await db.query("select * from public.staff_members")).rows.length,
            0,
          );
          assert.equal(
            (await db.query("update public.products set price=1 returning id"))
              .rows.length,
            0,
          );
          await assert.rejects(() =>
            db.query(
              "insert into public.staff_members(user_id,role) values($1,$2)",
              [customer, "owner"],
            ),
          );
        });
      },
    );
    await t.test(
      "administrador sem MFA não altera catálogo nem lê rascunhos",
      async () => {
        await asUser("authenticated", owner, "aal1", async () => {
          assert.equal(
            (await db.query("select * from public.staff_members")).rows.length,
            1,
          );
          assert.equal(
            (await db.query("update public.products set price=1 returning id"))
              .rows.length,
            0,
          );
          assert.equal(
            (await db.query("select * from public.products")).rows.length,
            1,
          );
        });
      },
    );
    await t.test(
      "administrador com MFA escreve e gera auditoria que não pode apagar",
      async () => {
        await asUser("authenticated", owner, "aal2", async () => {
          assert.equal(
            (await db.query("select * from public.products")).rows.length,
            2,
          );
          assert.equal(
            (
              await db.query(
                "update public.products set price=40 where name='Vela existente' returning id",
              )
            ).rows.length,
            1,
          );
          assert.deepEqual(
            (
              await db.query(
                "select actor_id,action from public.audit_log where entity='products' and action='UPDATE'",
              )
            ).rows,
            [{ actor_id: owner, action: "UPDATE" }],
          );
          await assert.rejects(() => db.exec("delete from public.audit_log"));
        });
      },
    );
    await t.test("revogação vale mesmo com a sessão anterior", async () => {
      await db.query(
        "update public.staff_members set active=false where user_id=$1",
        [owner],
      );
      await asUser("authenticated", owner, "aal2", async () => {
        assert.equal(
          (await db.query("update public.products set price=1 returning id"))
            .rows.length,
          0,
        );
        assert.equal(
          (await db.query("select * from public.audit_log")).rows.length,
          0,
        );
      });
    });
  } finally {
    await db.close();
  }
});
