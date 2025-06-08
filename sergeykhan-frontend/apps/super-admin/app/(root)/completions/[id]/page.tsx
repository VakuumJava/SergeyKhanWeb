import CompletionReviewPage from "@/components/completions/CompletionReviewPage";

interface Props {
  params: {
    id: string;
  };
}

export default function CompletionDetailPage({ params }: Props) {
  return <CompletionReviewPage completionId={params.id} />;
}
