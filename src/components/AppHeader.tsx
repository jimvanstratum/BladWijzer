interface Props {
  title: string;
  action?: React.ReactNode;
  subtitle?: string;
}

export function AppHeader({ title, subtitle, action }: Props) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-border bg-bg/95 px-4 py-4 backdrop-blur md:px-6">
      <div>
        <h1 className="font-serif text-2xl font-medium text-fg md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
