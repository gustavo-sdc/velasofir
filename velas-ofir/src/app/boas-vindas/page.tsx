import { CustomerJourney } from "@/platform/components/customer-journey";
export const metadata = {
  title: "Boas-vindas à Ofir",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function Welcome() {
  return <CustomerJourney kind="welcome" />;
}
