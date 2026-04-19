// Root App — routes, Tweaks panel, persistent audio bar.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "homeLayout": "editorial",
  "accent": "amber",
  "density": "standard"
}/*EDITMODE-END*/;

function App() {
  const store = useStore();
  const { audio, toggle, stop } = useAudioPlayer();

  const [route, setRoute] = React.useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('ice-route') || '{}');
      if (saved && saved.name) return saved;
    } catch {}
    return { name: 'home' };
  });
  const [search, setSearch] = React.useState('');
  const [tweaks, setTweaks] = React.useState(TWEAK_DEFAULTS);
  const [tweakOpen, setTweakOpen] = React.useState(false);

  React.useEffect(() => {
    sessionStorage.setItem('ice-route', JSON.stringify(route));
    window.scrollTo(0, 0);
  }, [route]);

  const go = React.useCallback((r) => setRoute(r), []);

  // Tweak mode protocol — register first, announce second.
  React.useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setTweakOpen(true);
      if (d.type === '__deactivate_edit_mode') setTweakOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const setTweak = (k, v) => {
    setTweaks(t => {
      const next = { ...t, [k]: v };
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
      return next;
    });
  };

  // Apply accent as CSS variable
  React.useEffect(() => {
    const accents = {
      amber: 'oklch(0.74 0.11 75)',
      rust: 'oklch(0.58 0.14 40)',
      sage: 'oklch(0.72 0.08 140)',
      bone: 'oklch(0.92 0.02 75)',
    };
    document.documentElement.style.setProperty('--accent', accents[tweaks.accent] || accents.amber);
    document.documentElement.setAttribute('data-density', tweaks.density);
  }, [tweaks.accent, tweaks.density]);

  const records = CATALOG;
  const cartCount = store.cart.reduce((s, x) => s + x.qty, 0);
  const current = route.name === 'detail' ? records.find(r => r.id === route.id) : null;
  const currentAudioRecord = audio.recordId ? records.find(r => r.id === audio.recordId) : null;

  return (
    <div className="app">
      <Header
        route={route} go={go}
        cartCount={cartCount} wishCount={store.wishlist.length}
        search={search} setSearch={(s) => { setSearch(s); if (s && route.name !== 'home') go({ name: 'home' }); }}
      />

      <main>
        {route.name === 'home' && (
          <HomePage
            records={records}
            layout={tweaks.homeLayout}
            audio={audio} onPlay={toggle}
            onOpen={(id) => go({ name: 'detail', id })}
            onAdd={store.addToCart}
            wishlist={store.wishlist} onWish={store.toggleWish}
            go={go}
          />
        )}
        {route.name === 'new' && (
          <BrowseGrid
            records={records.filter(r => r.condition === 'M' || r.condition === 'NM')}
            audio={audio} onPlay={toggle}
            onOpen={(id) => go({ name: 'detail', id })}
            onAdd={store.addToCart}
            wishlist={store.wishlist} onWish={store.toggleWish}
            search={search} onClearSearch={() => setSearch('')}
            variant="crate"
          />
        )}
        {route.name === 'used' && (
          <BrowseGrid
            records={records.filter(r => r.condition === 'VG+' || r.condition === 'VG')}
            audio={audio} onPlay={toggle}
            onOpen={(id) => go({ name: 'detail', id })}
            onAdd={store.addToCart}
            wishlist={store.wishlist} onWish={store.toggleWish}
            search={search} onClearSearch={() => setSearch('')}
            variant="crate"
          />
        )}
        {route.name === 'journal' && (
          <JournalPage go={go} records={records} />
        )}
        {route.name === 'detail' && current && (
          <DetailPage
            record={current} records={records}
            audio={audio} onPlay={toggle}
            onAdd={store.addToCart}
            wished={store.wishlist.includes(current.id)} onWish={store.toggleWish}
            onBack={() => go({ name: 'home' })}
            onOpen={(id) => go({ name: 'detail', id })}
          />
        )}
        {route.name === 'cart' && (
          <CartPage cart={store.cart} records={records}
            setQty={store.setQty} removeFromCart={store.removeFromCart} go={go} />
        )}
        {route.name === 'checkout' && (
          <CheckoutPage cart={store.cart} records={records} clearCart={store.clearCart} go={go} />
        )}
        {route.name === 'wishlist' && (
          <WishlistPage wishlist={store.wishlist} records={records}
            audio={audio} onPlay={toggle}
            onOpen={(id) => go({ name: 'detail', id })}
            onAdd={store.addToCart} onWish={store.toggleWish} go={go} />
        )}
      </main>

      {currentAudioRecord && <NowPlayingBar record={currentAudioRecord} audio={audio} toggle={toggle} stop={stop} onOpen={(id) => go({ name: 'detail', id })} />}

      <Footer />

      {tweakOpen && <TweaksPanel tweaks={tweaks} setTweak={setTweak} close={() => setTweakOpen(false)} />}
    </div>
  );
}

// Persistent bottom-left floating player (listening-bar vibe)
function NowPlayingBar({ record, audio, toggle, stop, onOpen }) {
  const track = record.tracks[audio.trackIndex] || record.tracks[0];
  return (
    <div className={`now-playing ${audio.playing ? 'active' : ''}`}>
      <button className="np-art" onClick={() => onOpen(record.id)}>
        <Sleeve record={record} size={72} />
        {audio.playing && <div className="np-pulse" />}
      </button>
      <div className="np-meta">
        <span className="rule-label">Now playing · {track.n}</span>
        <div className="np-title">{track.title}</div>
        <div className="np-artist">{record.artist}</div>
        <div className="np-wave">
          <Waveform seed={`${record.id}-${audio.trackIndex}`} type={track.wave} progress={audio.progress} color="currentColor" height={18} bars={60} />
        </div>
      </div>
      <div className="np-ctrls">
        <button className="np-btn" onClick={() => toggle(record.id, audio.trackIndex)}>
          {audio.playing ? <Icon.Pause size={16} /> : <Icon.Play size={16} />}
        </button>
        <button className="np-close" onClick={stop} aria-label="Close player"><Icon.Close size={12} /></button>
      </div>
    </div>
  );
}

// Simple journal page — rule of thumb, no filler
function JournalPage({ go, records }) {
  const entries = [
    { n: '07', date: 'Apr 15 · 2026', title: 'On listening rooms', lede: 'A note on why we turned the back of the shop into a pair of chairs and a Luxman.' },
    { n: '06', date: 'Mar 22 · 2026', title: 'Four records for the rainy season', lede: 'Ambient weather, in four sides.', featured: records[0] },
    { n: '05', date: 'Feb 28 · 2026', title: 'The Japanese pressings are back', lede: 'Why a domestic press often sounds better than the original — and how we source them.' },
    { n: '04', date: 'Jan 18 · 2026', title: 'Grading, demystified', lede: 'What VG+ really means at Factory Street, and what it doesn\'t.' },
  ];
  return (
    <div className="journal">
      <header className="journal-header">
        <span className="rule-label">The Factory Street Journal</span>
        <h1>Notes from the shop.</h1>
      </header>
      <div className="journal-entries">
        {entries.map(e => (
          <article key={e.n} className="entry">
            <div className="entry-n">{e.n}</div>
            <div className="entry-meta">
              <span className="rule-label muted">{e.date}</span>
              <h2>{e.title}</h2>
              <p>{e.lede}</p>
              <button className="link-arrow">Read entry <Icon.Arrow size={14} /></button>
            </div>
            {e.featured && (
              <div className="entry-featured" onClick={() => go({ name: 'detail', id: e.featured.id })}>
                <Sleeve record={e.featured} size={180} />
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function TweaksPanel({ tweaks, setTweak, close }) {
  return (
    <div className="tweaks-panel">
      <div className="tweaks-head">
        <span className="rule-label">Tweaks</span>
        <button onClick={close} className="icon-btn"><Icon.Close size={12} /></button>
      </div>
      <div className="tweak-row">
        <div className="tweak-label">Home layout</div>
        <div className="tweak-options">
          {[
            { k: 'editorial', n: 'Editorial', d: 'Hero + staff picks + crate' },
            { k: 'shelf', n: 'Shelves', d: 'Horizontal shelves by genre' },
            { k: 'crate', n: 'Crate', d: 'Filter rail + dense grid' },
          ].map(o => (
            <button key={o.k} className={`tweak-opt ${tweaks.homeLayout === o.k ? 'active' : ''}`} onClick={() => setTweak('homeLayout', o.k)}>
              <div className="tweak-opt-n">{o.n}</div>
              <div className="tweak-opt-d">{o.d}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <div className="tweak-label">Accent</div>
        <div className="tweak-swatches">
          {['amber', 'rust', 'sage', 'bone'].map(a => (
            <button key={a} className={`tweak-swatch ${a} ${tweaks.accent === a ? 'active' : ''}`}
              onClick={() => setTweak('accent', a)} aria-label={a} />
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <div className="tweak-label">Tile density</div>
        <div className="tweak-options">
          {['standard', 'dense'].map(d => (
            <button key={d} className={`tweak-opt ${tweaks.density === d ? 'active' : ''}`} onClick={() => setTweak('density', d)}>
              <div className="tweak-opt-n">{d[0].toUpperCase() + d.slice(1)}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
