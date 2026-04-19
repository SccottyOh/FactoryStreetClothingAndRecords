// Sleeve — generates a stylized album cover SVG from a record's palette + type.
// Each sleeve type is a different editorial composition so the browse grid
// reads like a curated shelf, not a pattern generator.

function Sleeve({ record, size = 400 }) {
  const [c1, c2, c3] = record.palette;
  const { sleeve, artist, title, cat } = record;

  const wrap = (content) => (
    <svg viewBox="0 0 400 400" width={size} height={size} style={{ display: 'block' }}>
      <defs>
        <filter id={`grain-${record.id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={record.id.charCodeAt(4)} />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <rect width="400" height="400" fill={c2} />
      {content}
      <rect width="400" height="400" filter={`url(#grain-${record.id})`} />
      <rect x="0.5" y="0.5" width="399" height="399" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
    </svg>
  );

  if (sleeve === 'grid') {
    return wrap(
      <>
        <g opacity="0.9">
          {Array.from({ length: 6 }).map((_, i) =>
            Array.from({ length: 6 }).map((_, j) => {
              const filled = (i * 7 + j * 3 + cat.charCodeAt(4)) % 3 === 0;
              return (
                <rect key={`${i}-${j}`} x={40 + i * 50} y={40 + j * 50} width="40" height="40"
                  fill={filled ? c1 : 'none'} stroke={c1} strokeWidth="1" opacity={filled ? 1 : 0.3} />
              );
            })
          )}
        </g>
        <text x="40" y="370" fill={c3} fontFamily="'JetBrains Mono', monospace" fontSize="9" letterSpacing="2">{cat}</text>
        <text x="360" y="370" fill={c3} fontFamily="'JetBrains Mono', monospace" fontSize="9" letterSpacing="2" textAnchor="end">{record.year}</text>
        <text x="200" y="395" fill={c3} fontFamily="'Instrument Serif', serif" fontStyle="italic" fontSize="14" textAnchor="middle">{title}</text>
      </>
    );
  }

  if (sleeve === 'arc') {
    return wrap(
      <>
        <circle cx="200" cy="260" r="180" fill={c1} />
        <circle cx="200" cy="260" r="140" fill="none" stroke={c2} strokeWidth="1" opacity="0.4" />
        <circle cx="200" cy="260" r="100" fill="none" stroke={c2} strokeWidth="1" opacity="0.3" />
        <circle cx="200" cy="260" r="60" fill="none" stroke={c2} strokeWidth="1" opacity="0.2" />
        <text x="30" y="50" fill={c3} fontFamily="'Instrument Serif', serif" fontSize="22">{artist}</text>
        <text x="30" y="80" fill={c3} fontFamily="'Instrument Serif', serif" fontStyle="italic" fontSize="16" opacity="0.8">{title}</text>
        <text x="30" y="390" fill={c3} fontFamily="'JetBrains Mono', monospace" fontSize="8" letterSpacing="2">{cat} · {record.label.toUpperCase()}</text>
      </>
    );
  }

  if (sleeve === 'sun') {
    return wrap(
      <>
        <circle cx="200" cy="200" r="130" fill={c1} />
        {Array.from({ length: 32 }).map((_, i) => {
          const a = (i / 32) * Math.PI * 2;
          const x1 = 200 + Math.cos(a) * 140;
          const y1 = 200 + Math.sin(a) * 140;
          const x2 = 200 + Math.cos(a) * (160 + (i % 3) * 8);
          const y2 = 200 + Math.sin(a) * (160 + (i % 3) * 8);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c1} strokeWidth="2" opacity="0.5" />;
        })}
        <text x="200" y="205" textAnchor="middle" fill={c3} fontFamily="'Instrument Serif', serif" fontSize="18" fontStyle="italic">{title.split(' ').slice(0, 2).join(' ')}</text>
        <text x="200" y="225" textAnchor="middle" fill={c3} fontFamily="'JetBrains Mono', monospace" fontSize="8" letterSpacing="3">{artist.toUpperCase()}</text>
      </>
    );
  }

  if (sleeve === 'wave') {
    return wrap(
      <>
        {Array.from({ length: 40 }).map((_, i) => (
          <path key={i} d={`M 0 ${100 + i * 6} Q 100 ${95 + i * 6 + Math.sin(i * 0.3) * 8} 200 ${100 + i * 6} T 400 ${100 + i * 6}`}
            fill="none" stroke={c1} strokeWidth="0.8" opacity={0.15 + (i / 40) * 0.4} />
        ))}
        <text x="30" y="60" fill={c3} fontFamily="'Instrument Serif', serif" fontSize="28">{artist.split(' ')[0]}</text>
        <text x="30" y="86" fill={c3} fontFamily="'Instrument Serif', serif" fontSize="28" opacity="0.7">{artist.split(' ').slice(1).join(' ')}</text>
        <text x="30" y="380" fill={c3} fontFamily="'Instrument Serif', serif" fontStyle="italic" fontSize="18">{title}</text>
      </>
    );
  }

  if (sleeve === 'concentric') {
    return wrap(
      <>
        {Array.from({ length: 14 }).map((_, i) => (
          <circle key={i} cx="200" cy="200" r={20 + i * 14} fill="none" stroke={c1} strokeWidth="1" opacity={0.2 + (i % 3) * 0.2} />
        ))}
        <circle cx="200" cy="200" r="14" fill={c3} />
        <text x="30" y="40" fill={c3} fontFamily="'JetBrains Mono', monospace" fontSize="9" letterSpacing="3">{cat}</text>
        <text x="370" y="40" fill={c3} fontFamily="'JetBrains Mono', monospace" fontSize="9" letterSpacing="3" textAnchor="end">{record.country} · {record.year}</text>
        <text x="200" y="380" textAnchor="middle" fill={c3} fontFamily="'Instrument Serif', serif" fontSize="20">{title}</text>
      </>
    );
  }

  if (sleeve === 'portrait') {
    return wrap(
      <>
        <rect x="80" y="60" width="240" height="260" fill={c1} opacity="0.9" />
        <rect x="80" y="60" width="240" height="260" fill="none" stroke={c3} strokeWidth="0.5" opacity="0.5" />
        {/* abstract portrait shapes */}
        <ellipse cx="200" cy="160" rx="60" ry="75" fill={c3} opacity="0.25" />
        <path d={`M 140 240 Q 200 210 260 240 L 260 320 L 140 320 Z`} fill={c3} opacity="0.2" />
        <text x="200" y="40" textAnchor="middle" fill={c3} fontFamily="'Instrument Serif', serif" fontStyle="italic" fontSize="16">{title}</text>
        <text x="200" y="360" textAnchor="middle" fill={c3} fontFamily="'JetBrains Mono', monospace" fontSize="10" letterSpacing="4">{artist.toUpperCase()}</text>
      </>
    );
  }

  return wrap(null);
}

// Tiny waveform — drawn once per track, deterministic.
function Waveform({ seed = 'x', type = 'mid', height = 28, bars = 48, color = 'currentColor', progress = 0 }) {
  // poor-man PRNG
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 0) / 0xffffffff; };

  const amps = Array.from({ length: bars }).map((_, i) => {
    const t = i / bars;
    const envelope = Math.sin(t * Math.PI) * 0.8 + 0.2;
    const noise = rnd();
    const base = type === 'hard' ? 0.6 + noise * 0.4
      : type === 'mid' ? 0.3 + noise * 0.5
      : 0.15 + noise * 0.35;
    return base * envelope;
  });

  return (
    <svg viewBox={`0 0 ${bars * 3} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block' }}>
      {amps.map((a, i) => {
        const h = Math.max(1, a * height);
        const played = (i / bars) < progress;
        return <rect key={i} x={i * 3} y={(height - h) / 2} width="2" height={h} fill={color} opacity={played ? 1 : 0.35} />;
      })}
    </svg>
  );
}

// Tiny inline icons
const Icon = {
  Play: (p) => <svg viewBox="0 0 16 16" width={p.size || 14} height={p.size || 14} fill="currentColor"><path d="M4 2 L13 8 L4 14 Z"/></svg>,
  Pause: (p) => <svg viewBox="0 0 16 16" width={p.size || 14} height={p.size || 14} fill="currentColor"><rect x="3" y="2" width="4" height="12"/><rect x="9" y="2" width="4" height="12"/></svg>,
  Cart: (p) => <svg viewBox="0 0 20 20" width={p.size || 16} height={p.size || 16} fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 3 h3 l2 11 h10 l2-8 h-13"/><circle cx="8" cy="17" r="1.2" fill="currentColor"/><circle cx="15" cy="17" r="1.2" fill="currentColor"/></svg>,
  Heart: (p) => <svg viewBox="0 0 20 20" width={p.size || 16} height={p.size || 16} fill={p.filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2"><path d="M10 17 C 3 12 2 7 5 4.5 C 7.5 2.5 10 5 10 6.5 C 10 5 12.5 2.5 15 4.5 C 18 7 17 12 10 17 Z"/></svg>,
  Search: (p) => <svg viewBox="0 0 20 20" width={p.size || 16} height={p.size || 16} fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="9" cy="9" r="5.5"/><path d="M13 13 L17 17"/></svg>,
  Close: (p) => <svg viewBox="0 0 16 16" width={p.size || 14} height={p.size || 14} fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 3 L13 13 M13 3 L3 13"/></svg>,
  Plus: (p) => <svg viewBox="0 0 16 16" width={p.size || 12} height={p.size || 12} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3 V13 M3 8 H13"/></svg>,
  Minus: (p) => <svg viewBox="0 0 16 16" width={p.size || 12} height={p.size || 12} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8 H13"/></svg>,
  Arrow: (p) => <svg viewBox="0 0 20 16" width={p.size || 16} height={p.size || 12} fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 8 H18 M12 2 L18 8 L12 14"/></svg>,
  Back: (p) => <svg viewBox="0 0 20 16" width={p.size || 16} height={p.size || 12} fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M18 8 H2 M8 2 L2 8 L8 14"/></svg>,
};

Object.assign(window, { Sleeve, Waveform, Icon });
