interface StatCardProps {
  title: string;
  value: string;
  description: string;
}

export function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div className="bg-card/60 group relative overflow-hidden rounded-xl border border-border/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-xl transition-all group-hover:from-primary/20" />
      <p className="relative text-sm font-medium text-muted-foreground">
        {title}
      </p>
      <p className="relative mt-2 bg-gradient-to-r from-white to-white/70 bg-clip-text text-2xl font-bold text-transparent">
        {value}
      </p>
      <p className="relative mt-1 text-xs text-muted-foreground/80">
        {description}
      </p>
    </div>
  );
}
