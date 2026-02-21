import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Google Fonts loaded via @import style injection
const fontStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Cabinet+Grotesk:wght@400;500;700;800&family=Caveat:wght@400;600&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    background: #0d0d0d;
    color: #f0ece3;
    font-family: 'Cabinet Grotesk', sans-serif;
    overflow-x: hidden;
  }
  
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }

  .grain {
    position: fixed;
    inset: 0;
    z-index: 999;
    pointer-events: none;
    opacity: 0.035;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-size: 200px 200px;
  }

  .mesh-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    background: 
      radial-gradient(ellipse 60% 50% at 10% 0%, #1a0533 0%, transparent 60%),
      radial-gradient(ellipse 50% 60% at 90% 10%, #001a2e 0%, transparent 60%),
      radial-gradient(ellipse 40% 50% at 50% 100%, #0a1a00 0%, transparent 60%),
      #0d0d0d;
  }
  
  .serif { font-family: 'Instrument Serif', serif; }
  .handwrite { font-family: 'Caveat', cursive; }
  .sans { font-family: 'Cabinet Grotesk', sans-serif; }

  input, textarea {
    font-family: 'Cabinet Grotesk', sans-serif;
  }

  .link-card:hover .link-arrow { transform: translate(3px, -3px); }
  .link-arrow { transition: transform 0.2s ease; }

  .sticky-note {
    transform: rotate(var(--rot));
  }

  .page-card {
    background: linear-gradient(135deg, #faf8f4 0%, #f0ede6 100%);
    border-left: 4px solid var(--page-color);
    position: relative;
  }
  .page-card::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 20px 20px 0;
    border-color: transparent var(--page-fold) transparent transparent;
  }
`;

// ─── ICONS ───────────────────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M1 12l2.5-1 7-7L9 2.5 2 9.5 1 12zm8-9.5l1-1 1.5 1.5-1 1L9 2.5z" fill="currentColor"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="link-arrow">
    <path d="M3 11L11 3M5 3h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FAVICON_URL = (url) => {
  try {
    const domain = new URL(url.startsWith('http') ? url : 'https://' + url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch { return null; }
};

// ─── LINK ICONS ──────────────────────────────────────────────────────────────
const LINK_COLORS = [
  '#c084fc', '#67e8f9', '#86efac', '#fbbf24', '#f87171',
  '#a78bfa', '#34d399', '#fb923c', '#e879f9', '#60a5fa'
];

// ─── MODAL ───────────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, children, title }) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: '#141414',
            border: '1px solid #2a2a2a',
            borderRadius: '16px',
            padding: '28px',
            width: '360px',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          }}
        >
          <p className="serif" style={{ fontSize: '1.3rem', marginBottom: '20px', color: '#f0ece3' }}>{title}</p>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── INPUT STYLES ─────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  background: '#1e1e1e',
  border: '1px solid #2e2e2e',
  borderRadius: '10px',
  padding: '10px 14px',
  color: '#f0ece3',
  fontSize: '0.9rem',
  outline: 'none',
  marginBottom: '12px',
  transition: 'border-color 0.2s',
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '90px',
  fontFamily: 'Cabinet Grotesk, sans-serif',
};

const btnPrimary = {
  width: '100%',
  padding: '10px',
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '700',
  fontSize: '0.9rem',
  fontFamily: 'Cabinet Grotesk, sans-serif',
  background: 'linear-gradient(135deg, #c084fc, #67e8f9)',
  color: '#0d0d0d',
  marginTop: '4px',
};

// ─── PASTEL COLORS for sticky notes ──────────────────────────────────────────
const PASTEL = [
  { bg: '#fef3c7', accent: '#f59e0b', fold: '#fde68a' },
  { bg: '#fce7f3', accent: '#ec4899', fold: '#fbcfe8' },
  { bg: '#e0f2fe', accent: '#0ea5e9', fold: '#bae6fd' },
  { bg: '#dcfce7', accent: '#22c55e', fold: '#bbf7d0' },
  { bg: '#f3e8ff', accent: '#a855f7', fold: '#e9d5ff' },
  { bg: '#fff7ed', accent: '#f97316', fold: '#fed7aa' },
  { bg: '#ecfeff', accent: '#06b6d4', fold: '#a5f3fc' },
];

// ─── PAGE BOOK COLORS ────────────────────────────────────────────────────────
const BOOK_COLORS = [
  { color: '#c084fc', fold: '#e9d5ff' },
  { color: '#67e8f9', fold: '#a5f3fc' },
  { color: '#86efac', fold: '#bbf7d0' },
  { color: '#fbbf24', fold: '#fde68a' },
  { color: '#f87171', fold: '#fca5a5' },
];

const rotations = [-1.8, 1.2, -0.8, 2, -1.5, 0.9, -2.2, 1.6];

// ─── LINKS PAGE ──────────────────────────────────────────────────────────────
function LinksPage() {
  const [links, setLinks] = useState([
    { id: 1, name: 'LinkedIn', url: 'https://linkedin.com', color: '#60a5fa' },
    { id: 2, name: 'GitHub', url: 'https://github.com', color: '#c084fc' },
    { id: 3, name: 'Dribbble', url: 'https://dribbble.com', color: '#f87171' },
  ]);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const add = () => {
    if (!name.trim() || !url.trim()) return;
    const color = LINK_COLORS[links.length % LINK_COLORS.length];
    setLinks(l => [...l, { id: Date.now(), name, url: url.startsWith('http') ? url : 'https://' + url, color }]);
    setName(''); setUrl(''); setModal(false);
  };

  const remove = (id, e) => { e.preventDefault(); e.stopPropagation(); setLinks(l => l.filter(x => x.id !== id)); };

  return (
    <div style={{ padding: '40px 0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '40px' }}>
        <h2 className="serif" style={{ fontSize: '3rem', color: '#f0ece3' }}>My Links</h2>
        <span className="handwrite" style={{ fontSize: '1.1rem', color: '#888', marginTop: '8px' }}>quick access to everywhere</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        <AnimatePresence>
          {links.map((link, i) => (
            <motion.a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              style={{
                display: 'block',
                position: 'relative',
                background: '#141414',
                border: `1px solid ${link.color}33`,
                borderRadius: '16px',
                padding: '24px',
                textDecoration: 'none',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              whileHover={{ y: -4, borderColor: link.color + '88' }}
              whileTap={{ scale: 0.97 }}
            >
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.07,
                background: `radial-gradient(circle at 0% 0%, ${link.color}, transparent 70%)`,
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <img
                  src={FAVICON_URL(link.url)}
                  alt=""
                  style={{ width: 32, height: 32, borderRadius: '8px', background: '#1e1e1e', padding: '2px' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className="link-arrow" style={{ color: link.color, opacity: 0.8 }}><ArrowIcon /></span>
                  <button
                    onClick={e => remove(link.id, e)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: '0' }}
                  >
                    <XIcon />
                  </button>
                </div>
              </div>
              <p style={{ marginTop: '16px', fontWeight: '700', fontSize: '1rem', color: '#f0ece3' }}>{link.name}</p>
              <p style={{ fontSize: '0.72rem', color: '#555', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {link.url.replace('https://', '')}
              </p>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${link.color}, transparent)`,
              }} />
            </motion.a>
          ))}
        </AnimatePresence>

        <motion.button
          onClick={() => setModal(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: 'transparent',
            border: '2px dashed #2a2a2a',
            borderRadius: '16px',
            padding: '24px',
            cursor: 'pointer',
            color: '#444',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '120px',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onHoverStart={e => { e.target.style.borderColor = '#555'; e.target.style.color = '#888'; }}
          onHoverEnd={e => { e.target.style.borderColor = '#2a2a2a'; e.target.style.color = '#444'; }}
        >
          <PlusIcon />
          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Add Link</span>
        </motion.button>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add a new link ✦">
        <input
          style={inputStyle}
          placeholder="Name (e.g. LinkedIn)"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <input
          style={inputStyle}
          placeholder="URL (e.g. linkedin.com/in/you)"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <button style={btnPrimary} onClick={add}>Add Link</button>
      </Modal>
    </div>
  );
}

// ─── REMINDERS PAGE ──────────────────────────────────────────────────────────
function RemindersPage() {
  const [notes, setNotes] = useState([
    { id: 1, title: 'Call Mom 📞', body: 'Sunday evening, don\'t forget!', palette: 0 },
    { id: 2, title: 'Drink water 💧', body: '8 glasses a day keeps the doctor away.', palette: 1 },
    { id: 3, title: 'Read 30 min', body: 'Before bed. No phone.', palette: 3 },
  ]);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const openAdd = () => { setEditId(null); setTitle(''); setBody(''); setModal(true); };
  const openEdit = (n) => { setEditId(n.id); setTitle(n.title); setBody(n.body); setModal(true); };

  const save = () => {
    if (!title.trim()) return;
    if (editId) {
      setNotes(n => n.map(x => x.id === editId ? { ...x, title, body } : x));
    } else {
      const palette = notes.length % PASTEL.length;
      setNotes(n => [...n, { id: Date.now(), title, body, palette }]);
    }
    setModal(false);
  };

  const remove = (id) => setNotes(n => n.filter(x => x.id !== id));

  return (
    <div style={{ padding: '40px 0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '40px' }}>
        <h2 className="serif" style={{ fontSize: '3rem', color: '#f0ece3' }}>Reminders</h2>
        <span className="handwrite" style={{ fontSize: '1.1rem', color: '#888' }}>little notes to self</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        <AnimatePresence>
          {notes.map((note, i) => {
            const p = PASTEL[note.palette ?? i % PASTEL.length];
            const rot = rotations[i % rotations.length];
            return (
              <motion.div
                key={note.id}
                className="sticky-note"
                initial={{ opacity: 0, scale: 0.8, rotate: rot }}
                animate={{ opacity: 1, scale: 1, rotate: rot }}
                exit={{ opacity: 0, scale: 0.7, rotate: rot * 2 }}
                whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  '--rot': `${rot}deg`,
                  background: p.bg,
                  borderRadius: '4px',
                  padding: '20px',
                  width: '200px',
                  minHeight: '160px',
                  boxShadow: '4px 6px 20px rgba(0,0,0,0.35)',
                  position: 'relative',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                onClick={() => openEdit(note)}
              >
                <div style={{
                  position: 'absolute',
                  top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: '50px', height: '12px',
                  background: p.fold,
                  borderRadius: '0 0 6px 6px',
                  opacity: 0.8,
                }} />
                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                  <button
                    onClick={e => { e.stopPropagation(); openEdit(note); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.accent, opacity: 0.7 }}
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); remove(note.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', opacity: 0.7 }}
                  >
                    <XIcon />
                  </button>
                </div>
                <p style={{
                  fontFamily: 'Caveat, cursive',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  marginTop: '12px',
                  marginBottom: '8px',
                  lineHeight: 1.3,
                }}>
                  {note.title}
                </p>
                <p style={{
                  fontFamily: 'Caveat, cursive',
                  fontSize: '0.95rem',
                  color: '#444',
                  lineHeight: 1.5,
                }}>
                  {note.body}
                </p>
                <div style={{ position: 'absolute', bottom: '10px', right: '12px', width: '8px', height: '8px', borderRadius: '50%', background: p.accent, opacity: 0.6 }} />
              </motion.div>
            );
          })}
        </AnimatePresence>

        <motion.button
          onClick={openAdd}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: '#1a1a1a',
            border: '2px dashed #2a2a2a',
            borderRadius: '4px',
            width: '200px', minHeight: '160px',
            cursor: 'pointer',
            color: '#444',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
            flexShrink: 0,
          }}
        >
          <PlusIcon />
          <span style={{ fontSize: '0.85rem', fontFamily: 'Caveat, cursive', fontSize: '1.1rem' }}>New note</span>
        </motion.button>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit note ✦' : 'New sticky note ✦'}>
        <input
          style={inputStyle}
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          style={textareaStyle}
          placeholder="What's on your mind?"
          value={body}
          onChange={e => setBody(e.target.value)}
        />
        <button style={btnPrimary} onClick={save}>{editId ? 'Save Changes' : 'Add Note'}</button>
      </Modal>
    </div>
  );
}

// ─── ROADMAP PAGE ─────────────────────────────────────────────────────────────
function RoadmapPage() {
  const [pages, setPages] = useState([
    { id: 1, title: 'Learn React Advanced', body: 'Custom hooks, context patterns, performance optimization with memo and useMemo.', book: 0 },
    { id: 2, title: 'Build Portfolio', body: 'Design it. Ship it. Make it unforgettable.', book: 1 },
    { id: 3, title: 'Open Source Contribution', body: 'Pick one project. One PR. Just start.', book: 2 },
  ]);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const openAdd = () => { setEditId(null); setTitle(''); setBody(''); setModal(true); };
  const openEdit = (p) => { setEditId(p.id); setTitle(p.title); setBody(p.body); setModal(true); };

  const save = () => {
    if (!title.trim()) return;
    if (editId) {
      setPages(ps => ps.map(x => x.id === editId ? { ...x, title, body } : x));
    } else {
      const book = pages.length % BOOK_COLORS.length;
      setPages(ps => [...ps, { id: Date.now(), title, body, book }]);
    }
    setModal(false);
  };

  const remove = (id) => setPages(ps => ps.filter(x => x.id !== id));

  return (
    <div style={{ padding: '40px 0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '40px' }}>
        <h2 className="serif" style={{ fontSize: '3rem', color: '#f0ece3' }}>Roadmap</h2>
        <span className="handwrite" style={{ fontSize: '1.1rem', color: '#888' }}>chapters of growth</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
        <AnimatePresence>
          {pages.map((pg, i) => {
            const b = BOOK_COLORS[pg.book ?? i % BOOK_COLORS.length];
            return (
              <motion.div
                key={pg.id}
                className="page-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -6, boxShadow: '8px 12px 40px rgba(0,0,0,0.4)' }}
                style={{
                  '--page-color': b.color,
                  '--page-fold': b.fold,
                  background: 'linear-gradient(135deg, #faf8f4 0%, #f0ede6 100%)',
                  borderLeft: `5px solid ${b.color}`,
                  borderRadius: '0 12px 12px 0',
                  padding: '24px 24px 24px 20px',
                  position: 'relative',
                  cursor: 'pointer',
                  boxShadow: '4px 8px 24px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                }}
                onClick={() => openEdit(pg)}
              >
                {/* dog ear */}
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: 0, height: 0,
                  borderStyle: 'solid',
                  borderWidth: '0 24px 24px 0',
                  borderColor: `transparent ${b.fold} transparent transparent`,
                }} />
                
                {/* ruled lines */}
                {[60, 90, 120, 150, 180].map(t => (
                  <div key={t} style={{
                    position: 'absolute',
                    left: '20px', right: '16px',
                    top: `${t}px`,
                    height: '1px',
                    background: '#e8e2d8',
                  }} />
                ))}

                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '4px', zIndex: 1 }}>
                  <button
                    onClick={e => { e.stopPropagation(); openEdit(pg); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: b.color, opacity: 0.7 }}
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); remove(pg.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', opacity: 0.7 }}
                  >
                    <XIcon />
                  </button>
                </div>

                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: b.color,
                  marginBottom: '8px',
                  fontFamily: 'Cabinet Grotesk, sans-serif',
                }}>
                  Chapter {i + 1}
                </div>

                <h3 style={{
                  fontFamily: 'Instrument Serif, serif',
                  fontSize: '1.3rem',
                  color: '#1a1a1a',
                  marginBottom: '12px',
                  lineHeight: 1.3,
                  position: 'relative',
                  zIndex: 1,
                }}>
                  {pg.title}
                </h3>

                <p style={{
                  fontSize: '0.88rem',
                  color: '#555',
                  lineHeight: 1.65,
                  fontFamily: 'Cabinet Grotesk, sans-serif',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  {pg.body}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <motion.button
          onClick={openAdd}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: '#141414',
            border: '2px dashed #2a2a2a',
            borderRadius: '0 12px 12px 0',
            borderLeft: '5px dashed #2a2a2a',
            padding: '24px',
            cursor: 'pointer',
            color: '#444',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
            minHeight: '180px',
          }}
        >
          <PlusIcon />
          <span style={{ fontFamily: 'Instrument Serif, serif', fontSize: '1.1rem' }}>New chapter</span>
        </motion.button>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit chapter ✦' : 'New chapter ✦'}>
        <input
          style={inputStyle}
          placeholder="Chapter title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          style={textareaStyle}
          placeholder="What's this chapter about?"
          value={body}
          onChange={e => setBody(e.target.value)}
        />
        <button style={btnPrimary} onClick={save}>{editId ? 'Save Changes' : 'Add Chapter'}</button>
      </Modal>
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
const NAV_ITEMS = ['Links', 'Reminders', 'Roadmap'];

function Navbar({ active, setActive }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px',
      height: '64px',
      background: 'transparent',
    }}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <span className="serif" style={{ fontSize: '1.4rem', color: '#f0ece3', letterSpacing: '-0.02em' }}>
          ✦ <span style={{ background: 'linear-gradient(90deg, #c084fc, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>mine.</span>
        </span>
      </motion.div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {NAV_ITEMS.map((item, i) => (
          <motion.button
            key={item}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            onClick={() => setActive(item)}
            style={{
              background: active === item ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: active === item ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
              borderRadius: '24px',
              padding: '8px 20px',
              cursor: 'pointer',
              color: active === item ? '#f0ece3' : '#666',
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: '700',
              fontSize: '0.88rem',
              letterSpacing: '0.02em',
              transition: 'all 0.2s',
              backdropFilter: active === item ? 'blur(10px)' : 'none',
            }}
            whileHover={{ color: '#f0ece3' }}
            whileTap={{ scale: 0.96 }}
          >
            {item}
          </motion.button>
        ))}
      </div>
    </nav>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState('Links');

  const pages = { Links: <LinksPage />, Reminders: <RemindersPage />, Roadmap: <RoadmapPage /> };

  return (
    <>
      <style>{fontStyle}</style>
      <div className="grain" />
      <div className="mesh-bg" />

      <Navbar active={active} setActive={setActive} />

      <main style={{
        position: 'relative', zIndex: 1,
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '64px 48px 80px',
        minHeight: '100vh',
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {pages[active]}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}