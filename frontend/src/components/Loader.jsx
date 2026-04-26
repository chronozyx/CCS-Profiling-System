export default function Loader({ size = 52, full = false, padded = false }) {
  return (
    <div className="ccs-loader-wrap" style={{
      ...(full   ? { minHeight: '60vh' } : {}),
      ...(padded ? { padding: '3rem' }   : {}),
    }}>
      {/* Static logo — only the ring spins */}
      <div className="ccs-loader-track" style={{ width: size + 24, height: size + 24 }}>
        <div className="ccs-loader-arc" style={{ width: size + 24, height: size + 24 }} />
        <img
          src="/ccs.png"
          alt=""
          className="ccs-loader-logo"
          style={{ width: size, height: size }}
        />
      </div>

      {/* Skeleton bar shimmer */}
      <div className="ccs-loader-bars">
        <div className="ccs-loader-bar" style={{ width: '120px' }} />
        <div className="ccs-loader-bar" style={{ width: '80px', animationDelay: '.15s' }} />
      </div>
    </div>
  );
}
