import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useSetupStatus } from '@/hooks/useSetupStatus';
import type { SetupChecklistItem } from '@/lib/setupStatus';
import { memoryApi } from '@/services/memory';

interface SetupStatusPanelProps {
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export function SetupStatusPanel({
  title = 'Setup Status',
  description = 'One place to confirm what is ready now, what still needs attention, and which voice features are optional.',
  className,
  compact = false,
}: SetupStatusPanelProps) {
  const { requiredItems, optionalItems, summary, isRefreshing, runRefresh, settings, memoryBasePath } = useSetupStatus();

  const summaryTone =
    summary.requiredReady === summary.requiredTotal ? 'border-green-500/20 bg-green-500/10' : 'border-amber-500/20 bg-amber-500/10';

  const handleOpenFolder = async () => {
    try {
      await memoryApi.openFolder();
    } catch {
      const fallbackPath = memoryBasePath ?? settings.memoryPath ?? 'Path unavailable';
      window.alert(`Unable to open the workspace folder.\n\n${fallbackPath}`);
    }
  };

  return (
    <section className={cn('rounded-[30px] border border-border bg-background/75 p-5 shadow-sm', className)}>
      <div className={cn('flex gap-4', compact ? 'flex-col' : 'flex-col lg:flex-row lg:items-start lg:justify-between')}>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void runRefresh()} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing...' : 'Refresh Checks'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void handleOpenFolder()} disabled={!memoryBasePath && !settings.memoryPath}>
            Open Workspace Folder
          </Button>
        </div>
      </div>

      <div className={cn('mt-5 rounded-[24px] border px-4 py-4', summaryTone)}>
        <p className="text-sm font-medium">
          {summary.requiredReady === summary.requiredTotal
            ? 'ModernClaw is ready for core use.'
            : 'ModernClaw still needs attention before setup is fully ready.'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Required setup: {summary.requiredReady}/{summary.requiredTotal} ready. Voice input and output stay optional and can be enabled later when you want them.
        </p>
      </div>

      <div className={cn('mt-5 grid gap-5', compact ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2')}>
        <ChecklistGroup
          title="Required Setup"
          description="These items need to be ready before normal chat use."
          items={requiredItems}
        />
        <ChecklistGroup
          title="Optional Features"
          description="These can be skipped for now and enabled later in Settings."
          items={optionalItems}
        />
      </div>
    </section>
  );
}

function ChecklistGroup({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: SetupChecklistItem[];
}) {
  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</p>
              </div>
              <StatusBadge state={item.state} />
            </div>

            {item.notes && item.notes.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs leading-5 text-muted-foreground">
                {item.notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ state }: { state: SetupChecklistItem['state'] }) {
  const label =
    state === 'ready'
      ? 'Ready'
      : state === 'attention'
        ? 'Needs Attention'
        : state === 'checking'
          ? 'Checking'
          : 'Optional';

  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
        state === 'ready'
          ? 'bg-green-500/12 text-green-700 dark:text-green-300'
          : state === 'attention'
            ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
            : state === 'checking'
              ? 'bg-secondary text-secondary-foreground'
              : 'bg-slate-500/12 text-slate-700 dark:text-slate-300'
      )}
    >
      {label}
    </span>
  );
}
