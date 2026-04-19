// Pages: HomePage (with layout variants), BrowseGrid, DetailPage, CartPage,
// CheckoutPage, WishlistPage. Each is self-contained; the App component in
// app.jsx wires them to routes and shared state.

const { useState: uS, useMemo: uM, useRef: uR, useEffect: uE } = React;

// ─── Home (3 layout variants via tweak) ──────────────────────
function HomePage({ records, layout, audio, onPlay, onOpen, onAdd, wishlist, onWish, go }) {
  const featured = records[0];
  const staff = records.slice(1, 4);
  const rest = records.slice(4);

  if (layout === 'editorial') {
    return (
      <div className="home">
        <section className="hero-editorial">
          <div className="hero-words">
            <div className="rule-label">This Week at Factory Street</div>
            <h1 className="hero-title">
              <span className="italic">Records held up</span><br/>
              to the light.
            </h1>
            <p className="hero-lede">
              A small shop of carefully chosen music. Reissues, rarities, the occasional new pressing.
              Every record is played before it is photographed and photographed before it is priced.
            </p>
            <div className="hero-meta">
              <span className="rule-label muted">128 titles in rotation</span>
              <button className="link-arrow" onClick={() => go({ name: 'home' })}>Enter the shop <Icon.Arrow size={14} /></button>
            </div>
          </div>
          <div className="hero-art" onClick={() => onOpen(featured.id)}>
            <Sleeve record={featured} size={600} />
            <div className="hero-caption">
              <div className="rule-label">No. 001 · Feature of the Week</div>
              <div className="hero-caption-artist">{featured.artist}</div>
              <div className="hero-caption-title">{featured.title}</div>
              <div className="rule-label muted">{featured.year} · {featured.label} · ${featured.price.toFixed(0)}</div>
            </div>
          </div>
        </section>

        <section className="staff-picks">
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-n">§ 02</span>
              <h2>Staff Picks</h2>
            </div>
            <span className="rule-label muted">Three recommendations from the counter, updated weekly.</span>
          </div>
          <div className="pick-grid">
            {staff.map((r, i) => (
              <article key={r.id} className="pick">
                <div className="pick-n">No. {String(i + 1).padStart(2, '0')}</div>
                <div className="pick-art" onClick={() => onOpen(r.id)}>
                  <Sleeve record={r} size={400} />
                  <button className="pick-play" onClick={(e) => { e.stopPropagation(); onPlay(r.id, 0); }}>
                    {audio.recordId === r.id && audio.playing ? <Icon.Pause /> : <Icon.Play />}
                  </button>
                </div>
                <div className="pick-meta">
                  <div className="pick-artist">{r.artist}</div>
                  <div className="pick-title">{r.title}</div>
                  <p className="pick-note">"{r.notes.split('.')[0]}."</p>
                  <div className="pick-cta">
                    <span>${r.price.toFixed(0)}</span>
                    <button onClick={() => onAdd(r.id)}>Add to bag →</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="all">
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-n">§ 03</span>
              <h2>The Crate</h2>
            </div>
            <span className="rule-label muted">Everything in rotation, newest first.</span>
          </div>
          <div className="crate">
            {rest.map(r => (
              <ProductTile key={r.id} record={r} audio={audio}
                onPlay={onPlay} onOpen={() => onOpen(r.id)}
                onAdd={onAdd} wished={wishlist.includes(r.id)} onWish={onWish} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (layout === 'shelf') {
    // Horizontal shelves, one per genre
    const byGenre = {};
    records.forEach(r => r.genre.forEach(g => { (byGenre[g] = byGenre[g] || []).push(r); }));
    const genres = Object.keys(byGenre).slice(0, 5);
    return (
      <div className="home home-shelf">
        <section className="shelf-hero">
          <div className="rule-label">Now at Factory Street</div>
          <h1 className="shelf-hero-title"><span className="italic">Listen</span> first. Then decide.</h1>
          <p>Every record ships with a short preview you can play right on the shelf. No sign-ups, no apps.</p>
        </section>
        {genres.map((g, gi) => (
          <section key={g} className="shelf-section">
            <div className="shelf-head">
              <div className="section-n">§ {String(gi + 1).padStart(2, '0')}</div>
              <h2>{g}</h2>
              <button className="link-arrow" onClick={() => go({ name: 'home', filter: { genre: g } })}>See all <Icon.Arrow size={14} /></button>
            </div>
            <div className="shelf-row">
              {byGenre[g].map(r => (
                <div key={r.id} className="shelf-tile">
                  <ProductTile record={r} audio={audio}
                    onPlay={onPlay} onOpen={() => onOpen(r.id)}
                    onAdd={onAdd} wished={wishlist.includes(r.id)} onWish={onWish} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  // default: 'crate' — listing-focused with a filter rail
  return <BrowseGrid records={records} audio={audio} onPlay={onPlay} onOpen={onOpen} onAdd={onAdd} wishlist={wishlist} onWish={onWish} variant="crate" />;
}

// ─── Browse grid with filters ────────────────────────────────
function BrowseGrid({ records: allRecords, audio, onPlay, onOpen, onAdd, wishlist, onWish, variant = 'full', search, onClearSearch }) {
  const [genre, setGenre] = uS('All');
  const [format, setFormat] = uS('All');
  const [cond, setCond] = uS('All');
  const [sort, setSort] = uS('Newest');
  const [priceMax, setPriceMax] = uS(100);

  const filtered = uM(() => {
    let r = allRecords;
    if (genre !== 'All') r = r.filter(x => x.genre.includes(genre));
    if (format !== 'All') r = r.filter(x => x.format === format);
    if (cond !== 'All') r = r.filter(x => x.condition === cond);
    r = r.filter(x => x.price <= priceMax);
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(x => x.artist.toLowerCase().includes(s) || x.title.toLowerCase().includes(s) || x.label.toLowerCase().includes(s) || x.cat.toLowerCase().includes(s));
    }
    const sorted = [...r];
    if (sort === 'Price ↑') sorted.sort((a, b) => a.price - b.price);
    if (sort === 'Price ↓') sorted.sort((a, b) => b.price - a.price);
    if (sort === 'Artist A→Z') sorted.sort((a, b) => a.artist.localeCompare(b.artist));
    if (sort === 'Year ↑') sorted.sort((a, b) => a.year - b.year);
    return sorted;
  }, [allRecords, genre, format, cond, sort, priceMax, search]);

  const crateHeadline = variant === 'crate'
    ? (<><span className="rule-label">The Crate</span><h1 className="crate-title"><span className="italic">{filtered.length}</span> records in rotation</h1></>)
    : null;

  return (
    <div className="browse">
      {crateHeadline && <header className="crate-header">{crateHeadline}</header>}
      <div className="browse-layout">
        <aside className="filters">
          <div className="filter-group">
            <div className="filter-head">Genre</div>
            <ul>
              {GENRES.map(g => (
                <li key={g}>
                  <button className={genre === g ? 'active' : ''} onClick={() => setGenre(g)}>
                    <span>{g}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="filter-group">
            <div className="filter-head">Format</div>
            <div className="chip-row">
              {FORMATS.map(f => (
                <button key={f} className={`chip ${format === f ? 'active' : ''}`} onClick={() => setFormat(f)}>{f}</button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <div className="filter-head">Condition</div>
            <div className="chip-row">
              {CONDITIONS.map(c => (
                <button key={c} className={`chip ${cond === c ? 'active' : ''}`} onClick={() => setCond(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <div className="filter-head">Price — up to ${priceMax}</div>
            <input type="range" min="20" max="100" step="5" value={priceMax} onChange={(e) => setPriceMax(+e.target.value)} />
          </div>
          <button className="filter-reset" onClick={() => { setGenre('All'); setFormat('All'); setCond('All'); setPriceMax(100); }}>Reset filters</button>
        </aside>

        <div className="results">
          <div className="results-head">
            <div className="results-count">
              <span className="rule-label">{filtered.length} {filtered.length === 1 ? 'record' : 'records'}</span>
              {search && <button className="search-tag" onClick={onClearSearch}>"{search}" <Icon.Close size={10} /></button>}
            </div>
            <div className="sort">
              <span className="rule-label muted">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid">
            {filtered.map(r => (
              <ProductTile key={r.id} record={r} audio={audio}
                onPlay={onPlay} onOpen={() => onOpen(r.id)}
                onAdd={onAdd} wished={wishlist.includes(r.id)} onWish={onWish} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="empty">
              <span className="rule-label">No records match that combination.</span>
              <p>Try widening the filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Detail ──────────────────────────────────────────────────
function DetailPage({ record, audio, onPlay, onAdd, wished, onWish, onBack, records, onOpen }) {
  if (!record) return null;
  const [qty, setQty] = uS(1);
  const [showAdded, setShowAdded] = uS(false);

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) onAdd(record.id);
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 1800);
  };

  const related = records.filter(r =>
    r.id !== record.id && r.genre.some(g => record.genre.includes(g))
  ).slice(0, 4);

  return (
    <div className="detail">
      <button className="back" onClick={onBack}><Icon.Back size={14} /> Back to browse</button>

      <div className="detail-main">
        <div className="detail-art-col">
          <div className="detail-art">
            <Sleeve record={record} size={700} />
          </div>
          <div className="detail-art-meta">
            <span className="rule-label">{record.cat}</span>
            <span className="rule-label muted">{record.country} · {record.year}</span>
          </div>
        </div>

        <div className="detail-info">
          <div className="rule-label">{record.genre.join(' · ')}</div>
          <h1 className="detail-artist">{record.artist}</h1>
          <h2 className="detail-title">{record.title}</h2>

          <dl className="spec-table">
            <div><dt>Label</dt><dd>{record.label}</dd></div>
            <div><dt>Format</dt><dd>{record.format} · {record.pressing}</dd></div>
            <div><dt>Released</dt><dd>{record.year}</dd></div>
            <div><dt>Country</dt><dd>{record.country}</dd></div>
            <div><dt>Condition</dt><dd><span className="condition-pill">{record.condition}</span> {record.conditionLabel}</dd></div>
            <div><dt>In stock</dt><dd>{record.stock} {record.stock === 1 ? 'copy' : 'copies'}</dd></div>
          </dl>

          <p className="detail-notes">{record.notes}</p>

          <div className="buy-row">
            <div className="price">${record.price.toFixed(2)}</div>
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}><Icon.Minus /></button>
              <span>{qty}</span>
              <button onClick={() => setQty(Math.min(record.stock, qty + 1))}><Icon.Plus /></button>
            </div>
            <button className="add-to-cart" onClick={handleAdd}>
              <Icon.Cart size={14} /> Add to bag
            </button>
            <button className={`wish-toggle ${wished ? 'on' : ''}`} onClick={() => onWish(record.id)} aria-label="Wishlist">
              <Icon.Heart size={16} filled={wished} />
            </button>
          </div>
          {showAdded && <div className="added-toast">Added to bag.</div>}

          <div className="shipping-note">
            <span className="rule-label">Ships Tuesday.</span>
            <span className="muted">Packed in sturdy cardboard mailers with corner protectors. Worldwide tracked.</span>
          </div>
        </div>
      </div>

      <section className="tracklist">
        <div className="section-head">
          <div className="section-head-left">
            <span className="section-n">§</span>
            <h2>Listen</h2>
          </div>
          <span className="rule-label muted">30-second previews · click a track</span>
        </div>
        <ol className="tracks">
          {record.tracks.map((t, i) => {
            const isCurrent = audio.recordId === record.id && audio.trackIndex === i;
            const isPlaying = isCurrent && audio.playing;
            return (
              <li key={i} className={`track ${isCurrent ? 'current' : ''}`}>
                <button className="track-play" onClick={() => onPlay(record.id, i)} aria-label={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? <Icon.Pause size={12} /> : <Icon.Play size={12} />}
                </button>
                <span className="track-n">{t.n}</span>
                <span className="track-title">{t.title}</span>
                <div className="track-wave">
                  <Waveform seed={`${record.id}-${i}`} type={t.wave} color="currentColor" progress={isCurrent ? audio.progress : 0} />
                </div>
                <span className="track-len">{t.len}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {related.length > 0 && (
        <section className="related">
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-n">§</span>
              <h2>If you liked this</h2>
            </div>
          </div>
          <div className="related-grid">
            {related.map(r => (
              <ProductTile key={r.id} record={r} audio={audio}
                onPlay={onPlay} onOpen={() => onOpen(r.id)}
                onAdd={() => {}} wished={false} onWish={() => {}} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Cart ────────────────────────────────────────────────────
function CartPage({ cart, records, setQty, removeFromCart, go }) {
  const lines = cart.map(ci => ({ ...ci, record: records.find(r => r.id === ci.id) })).filter(l => l.record);
  const subtotal = lines.reduce((s, l) => s + l.record.price * l.qty, 0);
  const shipping = subtotal > 0 ? (subtotal > 80 ? 0 : 12) : 0;
  const total = subtotal + shipping;

  if (lines.length === 0) {
    return (
      <div className="cart empty-cart">
        <span className="rule-label">Your bag</span>
        <h1>Nothing in the bag yet.</h1>
        <p>Add a record from the shelves and it will appear here.</p>
        <button className="btn-primary" onClick={() => go({ name: 'home' })}>Browse the shop →</button>
      </div>
    );
  }

  return (
    <div className="cart">
      <header className="cart-header">
        <span className="rule-label">Your bag</span>
        <h1><span className="italic">{lines.length}</span> {lines.length === 1 ? 'record' : 'records'} held.</h1>
      </header>
      <div className="cart-layout">
        <div className="cart-lines">
          <div className="cart-line-head">
            <span>Record</span>
            <span>Condition</span>
            <span>Qty</span>
            <span>Price</span>
          </div>
          {lines.map(l => (
            <div key={l.id} className="cart-line">
              <div className="line-record">
                <div className="line-art" onClick={() => go({ name: 'detail', id: l.id })}>
                  <Sleeve record={l.record} size={100} />
                </div>
                <div className="line-meta">
                  <div className="line-cat">{l.record.cat}</div>
                  <div className="line-artist">{l.record.artist}</div>
                  <div className="line-title">{l.record.title}</div>
                  <div className="line-label muted">{l.record.year} · {l.record.label}</div>
                </div>
              </div>
              <div className="line-cond">
                <span className="condition-pill">{l.record.condition}</span>
                <span className="muted">{l.record.conditionLabel}</span>
              </div>
              <div className="line-qty">
                <button onClick={() => setQty(l.id, l.qty - 1)}><Icon.Minus /></button>
                <span>{l.qty}</span>
                <button onClick={() => setQty(l.id, l.qty + 1)}><Icon.Plus /></button>
              </div>
              <div className="line-price">
                <span>${(l.record.price * l.qty).toFixed(2)}</span>
                <button className="remove" onClick={() => removeFromCart(l.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <aside className="cart-summary">
          <div className="summary-head">
            <span className="rule-label">Summary</span>
          </div>
          <dl>
            <div><dt>Subtotal</dt><dd>${subtotal.toFixed(2)}</dd></div>
            <div><dt>Shipping {subtotal > 80 && <span className="free">free</span>}</dt><dd>{shipping === 0 ? '—' : `$${shipping.toFixed(2)}`}</dd></div>
            <div className="summary-total"><dt>Total</dt><dd>${total.toFixed(2)}</dd></div>
          </dl>
          {subtotal < 80 && (
            <div className="ship-progress">
              <div className="rule-label muted">${(80 - subtotal).toFixed(2)} more for free shipping</div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(100, (subtotal / 80) * 100)}%` }} /></div>
            </div>
          )}
          <button className="btn-primary btn-full" onClick={() => go({ name: 'checkout' })}>
            Checkout <Icon.Arrow size={14} />
          </button>
          <button className="btn-ghost btn-full" onClick={() => go({ name: 'home' })}>Keep browsing</button>
          <div className="summary-note">
            <span className="rule-label">Packed with care.</span>
            <span className="muted">All orders leave the shop on Tuesday with tracking. We pack records in LP-specific corrugated mailers and bubble the corners.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Checkout ────────────────────────────────────────────────
function CheckoutPage({ cart, records, clearCart, go }) {
  const [step, setStep] = uS(1);
  const lines = cart.map(ci => ({ ...ci, record: records.find(r => r.id === ci.id) })).filter(l => l.record);
  const subtotal = lines.reduce((s, l) => s + l.record.price * l.qty, 0);
  const shipping = subtotal > 80 ? 0 : 12;
  const total = subtotal + shipping;

  const [form, setForm] = uS({ email: '', name: '', addr: '', city: '', zip: '', country: 'United States', ship: 'standard', card: '', exp: '', cvc: '' });
  const upd = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  if (step === 4) {
    return (
      <div className="checkout confirm">
        <div className="confirm-mark">
          <svg viewBox="0 0 60 60" width="80" height="80">
            <circle cx="30" cy="30" r="28" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M18 31 L27 40 L43 22" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <span className="rule-label">Order received</span>
        <h1>Thank you, {form.name.split(' ')[0] || 'friend'}.</h1>
        <p>Your records will be packed and shipped next Tuesday. A confirmation is on its way to {form.email || 'your inbox'}.</p>
        <div className="confirm-order">
          <div className="rule-label">Order FS–{Math.floor(Math.random() * 90000 + 10000)}</div>
          {lines.map(l => (
            <div key={l.id} className="confirm-line">
              <Sleeve record={l.record} size={60} />
              <div>
                <div>{l.record.artist} — <span className="italic">{l.record.title}</span></div>
                <div className="muted">{l.qty} × ${l.record.price.toFixed(2)}</div>
              </div>
            </div>
          ))}
          <div className="confirm-total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => { clearCart(); go({ name: 'home' }); }}>Back to the shop →</button>
      </div>
    );
  }

  return (
    <div className="checkout">
      <header className="checkout-header">
        <span className="rule-label">Checkout</span>
        <h1>Complete your order.</h1>
        <ol className="steps">
          {['Contact', 'Shipping', 'Payment'].map((s, i) => (
            <li key={s} className={step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}>
              <span className="step-n">0{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </header>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={(e) => { e.preventDefault(); setStep(step < 3 ? step + 1 : 4); }}>
          {step === 1 && (
            <fieldset>
              <legend className="rule-label">§ 01 — Contact</legend>
              <label><span>Email</span><input type="email" required value={form.email} onChange={upd('email')} placeholder="you@example.com" /></label>
              <label><span>Full name</span><input required value={form.name} onChange={upd('name')} placeholder="First Last" /></label>
            </fieldset>
          )}
          {step === 2 && (
            <fieldset>
              <legend className="rule-label">§ 02 — Shipping</legend>
              <label><span>Street address</span><input required value={form.addr} onChange={upd('addr')} /></label>
              <div className="row-2">
                <label><span>City</span><input required value={form.city} onChange={upd('city')} /></label>
                <label><span>Postal code</span><input required value={form.zip} onChange={upd('zip')} /></label>
              </div>
              <label><span>Country</span>
                <select value={form.country} onChange={upd('country')}>
                  <option>United States</option><option>Canada</option><option>United Kingdom</option>
                  <option>Japan</option><option>Germany</option><option>Other</option>
                </select>
              </label>
              <div className="ship-options">
                <label className={`ship-option ${form.ship === 'standard' ? 'active' : ''}`}>
                  <input type="radio" checked={form.ship === 'standard'} onChange={() => setForm(f => ({ ...f, ship: 'standard' }))} />
                  <div>
                    <div className="ship-opt-name">Standard · Tuesday dispatch</div>
                    <div className="muted">Tracked, 3–7 business days</div>
                  </div>
                  <div className="ship-opt-price">{shipping === 0 ? 'Free' : `$${shipping}`}</div>
                </label>
                <label className={`ship-option ${form.ship === 'express' ? 'active' : ''}`}>
                  <input type="radio" checked={form.ship === 'express'} onChange={() => setForm(f => ({ ...f, ship: 'express' }))} />
                  <div>
                    <div className="ship-opt-name">Express · Next-day dispatch</div>
                    <div className="muted">Priority, 1–3 business days</div>
                  </div>
                  <div className="ship-opt-price">$24</div>
                </label>
              </div>
            </fieldset>
          )}
          {step === 3 && (
            <fieldset>
              <legend className="rule-label">§ 03 — Payment</legend>
              <label><span>Card number</span><input required value={form.card} onChange={upd('card')} placeholder="0000 0000 0000 0000" /></label>
              <div className="row-2">
                <label><span>Expires</span><input required value={form.exp} onChange={upd('exp')} placeholder="MM/YY" /></label>
                <label><span>CVC</span><input required value={form.cvc} onChange={upd('cvc')} placeholder="123" /></label>
              </div>
              <div className="secure-note">
                <span className="rule-label muted">Payment is tokenized. We never see your card.</span>
              </div>
            </fieldset>
          )}
          <div className="checkout-actions">
            {step > 1 && <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)}><Icon.Back size={14} /> Back</button>}
            <button type="submit" className="btn-primary">
              {step === 3 ? 'Place order' : 'Continue'} <Icon.Arrow size={14} />
            </button>
          </div>
        </form>
        <aside className="checkout-summary">
          <div className="rule-label">Order · {lines.length} {lines.length === 1 ? 'record' : 'records'}</div>
          <ul className="mini-lines">
            {lines.map(l => (
              <li key={l.id}>
                <Sleeve record={l.record} size={52} />
                <div className="mini-line-meta">
                  <div>{l.record.artist}</div>
                  <div className="italic muted">{l.record.title}</div>
                  <div className="muted">Qty {l.qty}</div>
                </div>
                <div>${(l.record.price * l.qty).toFixed(2)}</div>
              </li>
            ))}
          </ul>
          <dl className="checkout-totals">
            <div><dt>Subtotal</dt><dd>${subtotal.toFixed(2)}</dd></div>
            <div><dt>Shipping</dt><dd>{form.ship === 'express' ? '$24.00' : (shipping === 0 ? '—' : `$${shipping.toFixed(2)}`)}</dd></div>
            <div className="grand"><dt>Total</dt><dd>${(subtotal + (form.ship === 'express' ? 24 : shipping)).toFixed(2)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

// ─── Wishlist ────────────────────────────────────────────────
function WishlistPage({ wishlist, records, audio, onPlay, onOpen, onAdd, onWish, go }) {
  const items = records.filter(r => wishlist.includes(r.id));

  if (items.length === 0) {
    return (
      <div className="wishlist empty-wish">
        <span className="rule-label">Your wishlist</span>
        <h1>Nothing saved yet.</h1>
        <p>Tap the heart on any record to keep it in mind.</p>
        <button className="btn-primary" onClick={() => go({ name: 'home' })}>Browse →</button>
      </div>
    );
  }

  return (
    <div className="wishlist">
      <header className="cart-header">
        <span className="rule-label">Your wishlist</span>
        <h1><span className="italic">{items.length}</span> {items.length === 1 ? 'record' : 'records'} saved.</h1>
      </header>
      <div className="grid wishlist-grid">
        {items.map(r => (
          <ProductTile key={r.id} record={r} audio={audio}
            onPlay={onPlay} onOpen={() => onOpen(r.id)}
            onAdd={onAdd} wished={true} onWish={onWish} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { HomePage, BrowseGrid, DetailPage, CartPage, CheckoutPage, WishlistPage });
