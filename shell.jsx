// Top-level app + all pages. Single SPA with hash-less client routing via state.

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ─── Audio simulator ─────────────────────────────────────────
// We don't have real audio files. Instead we simulate a playhead advancing
// through track durations so the player UI feels live. Clicking another
// track transfers the head.
function useAudioPlayer() {
  const [state, setState] = useState({ recordId: null, trackIndex: null, playing: false, progress: 0 });
  const ref = useRef(state);
  ref.current = state;
  const rafRef = useRef(null);
  const lastTime = useRef(null);

  useEffect(() => {
    const tick = (t) => {
      if (lastTime.current == null) lastTime.current = t;
      const dt = (t - lastTime.current) / 1000;
      lastTime.current = t;
      if (ref.current.playing) {
        // simulated 30-sec preview
        const next = ref.current.progress + dt / 30;
        if (next >= 1) setState((s) => ({ ...s, playing: false, progress: 0 }));
        else setState((s) => ({ ...s, progress: next }));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const toggle = useCallback((recordId, trackIndex = 0) => {
    setState((s) => {
      if (s.recordId === recordId && s.trackIndex === trackIndex) {
        return { ...s, playing: !s.playing };
      }
      return { recordId, trackIndex, playing: true, progress: 0 };
    });
  }, []);

  const stop = useCallback(() => setState({ recordId: null, trackIndex: null, playing: false, progress: 0 }), []);

  return { audio: state, toggle, stop };
}

// ─── Cart + Wishlist state ───────────────────────────────────
function useStore() {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ice-cart') || '[]'); } catch { return []; }
  });
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ice-wish') || '[]'); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem('ice-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('ice-wish', JSON.stringify(wishlist)); }, [wishlist]);

  const addToCart = (id) => setCart((c) => c.find(x => x.id === id) ? c.map(x => x.id === id ? {...x, qty: x.qty + 1} : x) : [...c, { id, qty: 1 }]);
  const removeFromCart = (id) => setCart((c) => c.filter(x => x.id !== id));
  const setQty = (id, qty) => setCart((c) => c.map(x => x.id === id ? {...x, qty: Math.max(1, qty)} : x));
  const toggleWish = (id) => setWishlist((w) => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);
  const clearCart = () => setCart([]);

  return { cart, wishlist, addToCart, removeFromCart, setQty, toggleWish, clearCart };
}

// ─── Header ──────────────────────────────────────────────────
function Header({ route, go, cartCount, wishCount, search, setSearch }) {
  const [searching, setSearching] = useState(false);

  return (
    <header className="site-header">
      <div className="masthead">
        <button className="brand" onClick={() => go({ name: 'home' })} aria-label="Home">
          <div className="brand-mark">
            <svg viewBox="0 0 40 40" width="26" height="26">
              <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="20" cy="20" r="2" fill="currentColor" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">Factory Street</span>
            <span className="brand-sub">clothing &amp; records — est. 2019</span>
          </div>
        </button>
        <div className="masthead-meta">
          <span className="rule-label">Volume 07 · Issue 02</span>
          <span className="rule-label muted">Shipping worldwide · Tuesday dispatch</span>
        </div>
      </div>

      <nav className="primary-nav">
        <div className="nav-left">
          <button className={`nav-link ${route.name === 'home' ? 'active' : ''}`} onClick={() => go({ name: 'home' })}>
            <span className="nav-idx">01</span> Browse
          </button>
          <button className={`nav-link ${route.name === 'new' ? 'active' : ''}`} onClick={() => go({ name: 'new' })}>
            <span className="nav-idx">02</span> New Arrivals
          </button>
          <button className={`nav-link ${route.name === 'used' ? 'active' : ''}`} onClick={() => go({ name: 'used' })}>
            <span className="nav-idx">03</span> Used &amp; Rare
          </button>
          <button className={`nav-link ${route.name === 'journal' ? 'active' : ''}`} onClick={() => go({ name: 'journal' })}>
            <span className="nav-idx">04</span> Journal
          </button>
        </div>
        <div className="nav-right">
          {searching ? (
            <div className="search-inline">
              <Icon.Search size={14} />
              <input
                autoFocus
                placeholder="Artist, title, label, catalog…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => !search && setSearching(false)}
                onKeyDown={(e) => e.key === 'Escape' && (setSearch(''), setSearching(false))}
              />
              <button className="icon-btn" onClick={() => { setSearch(''); setSearching(false); }}>
                <Icon.Close size={12} />
              </button>
            </div>
          ) : (
            <button className="icon-btn" onClick={() => setSearching(true)} aria-label="Search">
              <Icon.Search size={14} />
              <span className="label">Search</span>
            </button>
          )}
          <button className="icon-btn" onClick={() => go({ name: 'wishlist' })}>
            <Icon.Heart size={14} filled={wishCount > 0} />
            <span className="label">Wishlist</span>
            {wishCount > 0 && <span className="count">{wishCount}</span>}
          </button>
          <button className="icon-btn" onClick={() => go({ name: 'cart' })}>
            <Icon.Cart size={14} />
            <span className="label">Cart</span>
            {cartCount > 0 && <span className="count">{cartCount}</span>}
          </button>
        </div>
      </nav>
    </header>
  );
}

// ─── Footer ──────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="site-footer">
      <div className="foot-grid">
        <div>
          <div className="foot-head">Factory Street</div>
          <p>A record shop and listening space on the corner of Factory &amp; Vine. Opened 2019.</p>
        </div>
        <div>
          <div className="foot-head">Visit</div>
          <p>412 Factory Street<br/>Open Tuesday – Sunday<br/>11:00 — 19:00</p>
        </div>
        <div>
          <div className="foot-head">Post</div>
          <p>Worldwide shipping, packed on Tuesdays. Mailorder questions to <span className="underline">post@factorystreet.fm</span></p>
        </div>
        <div>
          <div className="foot-head">Letter</div>
          <p>A quiet monthly dispatch about the shop, the shelves, and what's on the turntable.</p>
          <form className="newsletter" onSubmit={(e) => e.preventDefault()}>
            <input placeholder="your@email" />
            <button>Subscribe →</button>
          </form>
        </div>
      </div>
      <div className="foot-bottom">
        <span>© 2026 Factory Street Clothing &amp; Records</span>
        <span>Set in Instrument Serif, Newsreader &amp; JetBrains Mono</span>
      </div>
    </footer>
  );
}

// ─── Product Tile ────────────────────────────────────────────
function ProductTile({ record, audio, onPlay, onOpen, onAdd, wished, onWish, size = 'md' }) {
  const isPlaying = audio.recordId === record.id && audio.playing;

  return (
    <article className={`tile tile-${size}`}>
      <div className="tile-art" onClick={onOpen}>
        <Sleeve record={record} size={500} />
        <button
          className={`tile-play ${isPlaying ? 'playing' : ''}`}
          onClick={(e) => { e.stopPropagation(); onPlay(record.id, 0); }}
          aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
        >
          {isPlaying ? <Icon.Pause size={18} /> : <Icon.Play size={18} />}
          <span>{isPlaying ? 'Playing A1' : 'Preview A1'}</span>
        </button>
        <button
          className={`tile-wish ${wished ? 'wished' : ''}`}
          onClick={(e) => { e.stopPropagation(); onWish(record.id); }}
          aria-label="Wishlist"
        >
          <Icon.Heart size={14} filled={wished} />
        </button>
        <div className="tile-badges">
          <span className="badge condition">{record.condition}</span>
          <span className="badge format">{record.format}</span>
        </div>
      </div>
      <div className="tile-meta">
        <div className="tile-line-1">
          <span className="tile-cat">{record.cat}</span>
          <span className="tile-price">${record.price.toFixed(0)}</span>
        </div>
        <div className="tile-artist" onClick={onOpen}>{record.artist}</div>
        <div className="tile-title" onClick={onOpen}>{record.title}</div>
        <div className="tile-line-2">
          <span>{record.year} · {record.label}</span>
          <button className="tile-add" onClick={(e) => { e.stopPropagation(); onAdd(record.id); }}>
            <Icon.Plus size={10} /> Add
          </button>
        </div>
      </div>
    </article>
  );
}

window.useAudioPlayer = useAudioPlayer;
window.useStore = useStore;
window.Header = Header;
window.Footer = Footer;
window.ProductTile = ProductTile;
