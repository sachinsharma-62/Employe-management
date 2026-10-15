export default function DashboardSkeleton() {
  const cards = Array.from({ length: 8 });
  return (
    <div className="stack-lg dash-skeleton" aria-hidden="true">
      <div className="dash-skeleton__banner" />
      <div className="row g-3">
        {cards.map((_, i) => (
          <div className="col-6 col-lg-4 col-xxl-3" key={i}>
            <div className="dash-skeleton__stat" />
          </div>
        ))}
      </div>
      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <div className="dash-skeleton__chart" />
        </div>
        <div className="col-12 col-xl-4">
          <div className="dash-skeleton__chart" />
        </div>
      </div>
    </div>
  );
}
