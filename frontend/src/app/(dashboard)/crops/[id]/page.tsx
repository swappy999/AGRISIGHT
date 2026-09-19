import { CropDetailClient } from "./CropDetailClient";

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function CropDetailPage() {
  return <CropDetailClient />;
}
