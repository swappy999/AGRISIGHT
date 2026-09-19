import { AnalysisDetailClient } from "./AnalysisDetailClient";

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function AnalysisDetailPage() {
  return <AnalysisDetailClient />;
}
