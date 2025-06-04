import CompletionReviewPage from "@/components/orders/CompletionReviewPage";

interface CompletionDetailPageProps {
  params: {
    id: string;
  };
}

export default function CompletionDetailPage({ params }: CompletionDetailPageProps) {
  return <CompletionReviewPage completionId={params.id} />;
}
