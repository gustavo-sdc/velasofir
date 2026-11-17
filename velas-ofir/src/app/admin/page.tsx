import Link from "next/link";
import { staffSession } from "@/platform/server/staff";
import {
  StaffLogin,
  StaffMfa,
  SignOut,
} from "@/platform/components/staff-login";
import { AdminDashboard } from "@/platform/components/admin-dashboard";
import { adminOperations } from "@/platform/server/admin-operations";
export default async function Admin() {
  const session = await staffSession();
  if (session.state === "unconfigured")
    return (
      <div className="container page-content">
        <div className="auth-card">
          <span className="eyebrow">Área da equipe</span>
          <h1>Conecte o Supabase da Ofir.</h1>
          <p>
            A conexão do painel ainda não está configurada neste ambiente.
            Solicite ao responsável a configuração do projeto Supabase da Ofir.
          </p>
          <ol className="setup-steps">
            <li>Confirme com o responsável a conexão do painel.</li>
            <li>
              Confira o projeto e conclua a configuração indicada na
              documentação.
            </li>
            <li>
              Depois, entre com sua conta autorizada e ative a verificação em
              duas etapas.
            </li>
          </ol>
          <p className="small">
            O painel só libera o acesso após confirmar sua autorização no banco.
          </p>
          <Link href="/" className="text-link">
            Voltar ao site ↗
          </Link>
        </div>
      </div>
    );
  if (session.state === "anonymous")
    return (
      <div className="container page-content">
        <StaffLogin />
      </div>
    );
  if (session.state === "forbidden")
    return (
      <div className="container page-content">
        <div className="auth-card">
          <h1>Acesso restrito.</h1>
          <p>
            Esta conta não tem autorização para administrar a Ofir. Solicite
            acesso ao responsável.
          </p>
          <SignOut />
        </div>
      </div>
    );
  if (session.state === "mfa")
    return (
      <div className="container page-content">
        <StaffMfa />
        <div style={{ textAlign: "center" }}>
          <SignOut />
        </div>
      </div>
    );
  const mayEdit = ["owner", "admin", "editor"].includes(session.role);
  const [products, workshops] = mayEdit
    ? await Promise.all([
        session.db
          .from("products")
          .select(
            "id,name,slug,description,collection,image,price,status,stock_quantity,accepts_orders,production_days,published",
          )
          .order("order"),
        session.db
          .from("workshops")
          .select(
            "id,slug,title,description,starts_at,location,price_cents,capacity,includes,program,image,images,youtube_videos,ticket_types,published",
          )
          .order("starts_at"),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ];
  const blog = mayEdit
    ? await session.db
        .from("blog_posts")
        .select("*")
        .order("updated_at", { ascending: false })
    : { data: [], error: null };
  const operations = ["owner", "admin"].includes(session.role)
    ? await adminOperations()
    : { available: false, rows: [] };
  return (
    <AdminDashboard
      blogPosts={blog.data ?? []}
      blogAvailable={!blog.error}
      products={products.data ?? []}
      workshops={workshops.data ?? []}
      unavailable={Boolean(products.error || workshops.error)}
      operations={operations}
      email={session.user.email ?? ""}
      role={session.role}
    />
  );
}
