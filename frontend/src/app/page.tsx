import CaptureView from "@/components/CaptureView";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-950 p-6 text-zinc-100">
      <h1 className="text-2xl font-semibold">Pi Camera</h1>
      <CaptureView />
    </main>
  );
}
