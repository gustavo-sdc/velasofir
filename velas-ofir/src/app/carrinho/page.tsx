import { CustomerCart } from "@/platform/components/customer-cart";
export const metadata = {
  title: "carrinho",
  robots: { index: false, follow: false },
};
export default function CartPage() {
  return (
    <div className="container page-content">
      <CustomerCart />
    </div>
  );
}
