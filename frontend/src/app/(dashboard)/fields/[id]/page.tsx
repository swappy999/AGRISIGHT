import { FieldDetailClient } from "./FieldDetailClient";

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function FieldDetailPage() {
  return <FieldDetailClient />;
}
