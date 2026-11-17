import { RandomPicker } from "@/platform/components/random-picker";
export const metadata = {
  title: "Sorteador",
  robots: { index: false, follow: false },
};
export default function Draw() {
  return (
    <div className="container page-content">
      <RandomPicker />
    </div>
  );
}
