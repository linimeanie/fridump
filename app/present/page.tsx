import PresenterView from "@/components/PresenterView";

export const dynamic = "force-dynamic";

export default function PresentPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return <PresenterViewLoader searchParamsPromise={searchParams} />;
}

// Thin async wrapper to unwrap the searchParams promise
async function PresenterViewLoader({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ token?: string }>;
}) {
  const { token } = await searchParamsPromise;
  return <PresenterView token={token ?? null} />;
}
