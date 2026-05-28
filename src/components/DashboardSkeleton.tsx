export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-36 rounded-2xl border bg-muted/40"
          />
        ))}
      </div>

      <div className="h-72 rounded-2xl border bg-muted/40" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 rounded-2xl border bg-muted/40" />
        <div className="h-96 rounded-2xl border bg-muted/40" />
      </div>
    </div>
  );
};