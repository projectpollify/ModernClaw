import { Button } from '@/components/ui/Button';

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-primary/12 text-primary shadow-inner">
        <span className="text-2xl font-semibold">MC</span>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight">Welcome to ModernClaw</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
        A private, local-first assistant that runs on your own machine. Your chats, memory files, and models stay
        under your control.
      </p>

      <div className="mx-auto mt-8 grid max-w-2xl gap-4 text-left md:grid-cols-2">
        <FeatureCard title="Private by default" description="Conversations and memory stay on your device." />
        <FeatureCard title="Works offline" description="Once models are installed, you can chat without the cloud." />
        <FeatureCard title="Custom memory" description="Shape the assistant with SOUL.md, USER.md, and local knowledge." />
        <FeatureCard title="Model control" description="Pick lightweight or capable models based on your hardware." />
      </div>

      <div className="mt-10">
        <Button onClick={onNext} className="rounded-xl px-6">
          Get Started
        </Button>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[24px] border border-border bg-secondary/35 p-4 shadow-sm">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}


