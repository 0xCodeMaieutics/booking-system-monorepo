import { Button, Wordmark } from "@tsami/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <Wordmark className="text-2xl" />
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">გვერდი ვერ მოიძებნა</h1>
        <p className="text-ink-soft">მისამართი არასწორია ან გვერდი წაშლილია.</p>
      </div>
      <Button asChild className="self-start">
        <Link href="/">მთავარ გვერდზე დაბრუნება</Link>
      </Button>
    </main>
  );
}
