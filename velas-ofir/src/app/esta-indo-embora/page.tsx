import { CustomerJourney } from "@/platform/components/customer-journey";
export const metadata = {
  title: "Já está indo embora?",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function Goodbye() {
  return <CustomerJourney kind="goodbye" />;
}
