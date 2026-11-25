import { CustomerAccess } from "@/platform/components/customer-access";
export const metadata = { title: "Acessar conta", robots: { index: false, follow: false } };
export default function CustomerAccessPage() {
  return <div className="container page-content"><CustomerAccess /></div>;
}
