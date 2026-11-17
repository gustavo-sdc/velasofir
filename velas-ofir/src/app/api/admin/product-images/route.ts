import { uploadImage } from "@/platform/server/image-upload";
export async function POST(request: Request) {
  return uploadImage(request, "product-media");
}
