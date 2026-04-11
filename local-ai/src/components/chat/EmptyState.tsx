export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <span className="text-2xl">Chat</span>
      </div>
      <h2 className="mb-2 text-xl font-semibold">ModernClaw is ready for a first conversation</h2>
      <p className="max-w-md text-muted-foreground">
        Send a message or drop in an image to start chatting with your local workspace. Saved conversations will
        reappear here automatically.
      </p>
    </div>
  );
}
