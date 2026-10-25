import { redirect } from "next/navigation";

export default async function PractitionerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/practitioners/${id}/details`);
}
