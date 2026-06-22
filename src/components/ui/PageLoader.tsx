export default function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite" aria-label="Đang tải trang">
      <div className="page-loader__brand" aria-hidden>
        <span className="page-loader__ring" />
        <span className="page-loader__dot" />
      </div>
      <p className="page-loader__label">Đang tải...</p>
      <div className="page-loader__skeleton" aria-hidden>
        <div className="page-loader__bar page-loader__bar--wide skeleton" />
        <div className="page-loader__bar skeleton" />
        <div className="page-loader__grid">
          <div className="page-loader__tile skeleton" />
          <div className="page-loader__tile skeleton" />
          <div className="page-loader__tile skeleton" />
        </div>
      </div>
    </div>
  );
}
