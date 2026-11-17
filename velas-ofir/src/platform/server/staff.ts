import "server-only";
import { sessionDatabase } from "./supabase";
import { isStaffRole, type StaffRole } from "../domain/commerce";
export async function staffSession() {
  const db = await sessionDatabase();
  if (!db) return { state: "unconfigured" as const };
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) return { state: "anonymous" as const };
  // A permissão vem do banco e reflete revogações imediatamente, nunca de user_metadata.
  const member = await db
    .from("staff_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  if (member.error || !isStaffRole(member.data?.role))
    return { state: "forbidden" as const };
  const assurance = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance.error || assurance.data.currentLevel !== "aal2")
    return { state: "mfa" as const };
  return {
    state: "authorized" as const,
    db,
    user,
    role: member.data.role as StaffRole,
  };
}
export async function requireStaff(roles: StaffRole[]) {
  const session = await staffSession();
  if (session.state !== "authorized" || !roles.includes(session.role))
    throw new Error("Acesso não autorizado.");
  return session;
}
