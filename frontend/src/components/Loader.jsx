export default function Loader({ size = 56, full = false, padded = false }) {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    animation: 'ccs-fadein 0.3s ease both',
    ...(full   ? { minHeight: '60vh' } : {}),
    ...(padded ? { padding: '3rem' }   : {}),
  };

  const ringSize = size + 20;

  return (
    <div style={containerStyle}>
      {/* Static logo — only the ring spins */}
      <div style={{ position: 'relative', width: ringSize, height: ringSize }}>
        {/* Spinning ring — separate element so logo stays still */}
        <div className="ccs-loader-ring" style={{ width: ringSize, height: ringSize }} />
        {/* Logo centered, not rotating */}
        <img
          src="/ccs.png"
          alt="CCS"
          className="ccs-loader-img"
          style={{
            width: size,
            height: size,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
      {/* Bouncing dots */}
      <div className="ccs-loader-dots">
        <span /><span /><span />
      </div>
    </div>
  );
}
