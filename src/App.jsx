import React, { useState, useEffect, useMemo, useRef } from 'react';
import qrcode from 'qrcode-generator';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import {
  insertLectureFeedback, insertFinalFeedback, insertProjectFeedback,
  fetchLectureFeedback, fetchFinalFeedback, fetchProjectFeedback,
} from './supabase.js';

const LECTURES = [
  // Day 1
  { id: 'd1-s1',  day: 1, title: '"So Why Are We All Here?" — Goals & Welcome',                  speaker: 'Yula Zack',             type: 'Talk' },
  { id: 'd1-s2',  day: 1, title: "Trends School: No, You Can't Skip This One",                   speaker: 'Rachel Blennerhassett', type: 'Talk' },
  { id: 'd1-s3',  day: 1, title: 'Spot the Trend',                                                speaker: 'Rachel Blennerhassett', type: 'Workshop' },
  { id: 'd1-s5',  day: 1, title: 'Steal Like a CM — Adapting Trends to Your Game',               speaker: 'Tamar Thein',           type: 'Talk' },
  { id: 'd1-s6',  day: 1, title: 'AI Workshop',                                                    speaker: 'Daniel Geron',          type: 'Workshop' },
  { id: 'd1-s11', day: 1, title: "Meet Your New Intern — It's an AI",                            speaker: 'Yula Zack',             type: 'Talk' },
  // Day 2
  { id: 'd2-s1',  day: 2, title: 'TikTok or Flop: Making Your Game Go Viral',                     speaker: 'Chris Castagnetto',     type: 'Talk' },
  { id: 'd2-s2',  day: 2, title: 'How the Pros Do It — Community Lessons from Supercell',         speaker: 'Ryan Lighton',          type: 'Talk' },
  { id: 'd2-s4',  day: 2, title: "Numbers Don't Lie — KPIs, Storytelling & Community Metrics",   speaker: 'Central analytics team',type: 'Talk' },
  { id: 'd2-project', day: 2, title: 'Project Session — Apply Everything You Learned',            speaker: 'All',                   type: 'Project' },
];

const ROLES = ['Community Manager','Marketing','Design / Art','Data / Analytics','Leadership','Other'];
const GAME_TYPES = ['Casino', 'Casual', 'Midcore', 'Other'];
const SENIORITY = ['Less than a year', '1–3 years', '3–7 years', '7+ years'];

const PROFILE_KEY = 'feedback:profile';
const ADMIN_PIN   = import.meta.env.VITE_ADMIN_PIN || '7777';

function loadProfileLocal() { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch { return null; } }
function saveProfileLocal(p) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {} }

function parseHash() {
  const h = (window.location.hash || '').replace(/^#/, '');
  if (h.startsWith('l/'))  return { route: 'lecture', lectureId: decodeURIComponent(h.slice(2)) };
  if (h === 'final')       return { route: 'final' };
  if (h === 'admin')       return { route: 'admin' };
  return { route: 'home' };
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;700;900&family=Heebo:wght@300;400;500;700&family=Caveat:wght@400;700&display=swap');
  :root { --cream: #f4ede1; --cream-2: #ebe1cf; --ink: #1a1715; --ink-soft: #4a423c; --accent: #c8553d; --accent-2: #588157; --gold: #b08968; --scopely: #1e90ff; --scopely-dark: #0d6dd8; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--cream); color: var(--ink); font-family: 'Heebo', sans-serif; min-height: 100vh; }
  body::before { content: ''; position: fixed; inset: 0; pointer-events: none; opacity: 0.05; z-index: 0;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>"); }
  .page { min-height: 100vh; padding: 28px 20px 100px; max-width: 760px; margin: 0 auto; position: relative; z-index: 1; }
  .display { font-family: 'Frank Ruhl Libre', serif; font-weight: 900; line-height: 1.05; letter-spacing: -0.02em; }
  .serif   { font-family: 'Frank Ruhl Libre', serif; }
  .hand    { font-family: 'Caveat', cursive; }
  .eyebrow { font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--ink-soft); font-weight: 500; }
  .stamp   { display: inline-block; border: 1.5px solid var(--ink); padding: 4px 10px; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; transform: rotate(-1.5deg); font-weight: 700; background: var(--cream); }
  .card    { background: var(--cream); border: 1.5px solid var(--ink); padding: 24px; box-shadow: 6px 6px 0 var(--ink); position: relative; }
  .btn     { background: var(--ink); color: var(--cream); border: 1.5px solid var(--ink); padding: 13px 22px; font-family: 'Heebo', sans-serif; font-weight: 500; font-size: 15px; cursor: pointer; transition: transform 0.12s ease, box-shadow 0.12s ease; }
  .btn:hover { transform: translate(-2px,-2px); box-shadow: 4px 4px 0 var(--accent); }
  .btn:active{ transform: translate(0,0); box-shadow: none; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
  .btn-ghost { background: transparent; color: var(--ink); }
  .btn-ghost:hover { box-shadow: 4px 4px 0 var(--ink); }
  .input, .textarea, .select { width: 100%; background: transparent; border: none; border-bottom: 1.5px solid var(--ink); padding: 10px 4px; font-family: 'Heebo', sans-serif; font-size: 16px; color: var(--ink); }
  .input:focus, .textarea:focus, .select:focus { outline: none; border-bottom-color: var(--accent); }
  .textarea { resize: vertical; min-height: 90px; }
  .pill { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: 1.5px solid var(--ink); border-radius: 999px; font-size: 13px; cursor: pointer; background: var(--cream); transition: all 0.15s ease; font-weight: 500; user-select: none; }
  .pill:hover { background: var(--ink); color: var(--cream); }
  .pill.active { background: var(--ink); color: var(--cream); }
  .emoji-btn { flex: 1; min-width: 56px; height: 68px; border: 1.5px solid var(--ink); background: var(--cream); cursor: pointer; font-size: 30px; transition: all 0.18s ease; display: flex; align-items: center; justify-content: center; }
  .emoji-btn:hover { transform: translateY(-3px); box-shadow: 3px 3px 0 var(--accent); }
  .emoji-btn.active { background: var(--accent); transform: translateY(-3px); box-shadow: 3px 3px 0 var(--ink); }
  .scale-btn { flex: 1; min-width: 40px; height: 52px; border: 1.5px solid var(--ink); background: var(--cream); cursor: pointer; font-size: 17px; font-weight: 700; transition: all 0.12s ease; font-family: 'Frank Ruhl Libre', serif; }
  .scale-btn:hover { background: var(--ink); color: var(--cream); }
  .scale-btn.active { background: var(--ink); color: var(--cream); }
  .check-row { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1.5px solid var(--ink); margin-bottom: 8px; cursor: pointer; transition: all 0.12s ease; background: var(--cream); user-select: none; }
  .check-row:hover { background: var(--cream-2); }
  .check-row.active { background: var(--ink); color: var(--cream); }
  .qr-wrap { background: var(--cream); border: 1.5px solid var(--ink); padding: 18px; display: inline-block; box-shadow: 8px 8px 0 var(--scopely); }
  .stat { border: 1.5px solid var(--ink); padding: 16px; background: var(--cream); }
  .stat-num { font-family: 'Frank Ruhl Libre', serif; font-size: 44px; font-weight: 900; line-height: 1; }
  .bar-row { display: grid; grid-template-columns: 180px 1fr 60px; gap: 10px; align-items: center; margin-bottom: 8px; font-size: 14px; }
  .bar-track { height: 22px; background: var(--cream-2); border: 1.5px solid var(--ink); position: relative; overflow: hidden; }
  .bar-fill  { height: 100%; background: var(--ink); transition: width 0.4s ease; }
  .quote-card { border-left: 4px solid var(--accent); padding: 8px 14px; margin-bottom: 10px; background: var(--cream); }
  .insight-card { border: 1.5px solid var(--ink); padding: 14px 16px; background: var(--cream-2); margin-bottom: 10px; position: relative; }
  .insight-card::before { content: '💡'; position: absolute; top: -10px; left: 14px; background: var(--cream); padding: 0 6px; font-size: 16px; }
  .insight-card .label { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-soft); font-weight: 700; }
  .insight-card .text { font-size: 14px; margin-top: 4px; line-height: 1.5; }
  .chart-card { background: var(--cream); border: 1.5px solid var(--ink); padding: 16px 8px 8px; margin-bottom: 12px; }
  .chart-title { font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--ink-soft); font-weight: 500; padding: 0 8px 8px; }
  .heatmap-cell { border: 1px solid var(--ink); display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
  .legend-row { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; margin-top: 8px; }
  .legend-dot { display: inline-block; width: 10px; height: 10px; margin-inline-end: 6px; vertical-align: middle; }
  .toolbar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .lec-row { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; padding: 14px 0; border-bottom: 1.5px dashed var(--ink); }
  .lec-row:last-child { border-bottom: none; }
  .small { font-size: 13px; color: var(--ink-soft); }
  .tag { display: inline-block; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; border: 1px solid var(--ink); padding: 2px 6px; margin-inline-end: 6px; font-weight: 500; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .anim { animation: slideUp 0.4s ease both; }
  .anim:nth-child(2) { animation-delay: 0.05s; } .anim:nth-child(3) { animation-delay: 0.10s; }
  .anim:nth-child(4) { animation-delay: 0.15s; } .anim:nth-child(5) { animation-delay: 0.20s; }
  .brand-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px;
               border-bottom: 1.5px solid var(--ink); background: var(--cream); position: sticky; top: 0; z-index: 10;
               max-width: 760px; margin: 0 auto; }
  .brand-mark { display: flex; align-items: center; gap: 10px; }
  .brand-mark svg { display: block; }
  .brand-text { font-family: 'Heebo', sans-serif; font-weight: 900; font-size: 18px; letter-spacing: 0.18em; color: var(--ink); text-transform: uppercase; }
  .brand-context { font-family: 'Heebo', sans-serif; font-size: 11px; color: var(--ink-soft); letter-spacing: 0.15em; text-transform: uppercase; }
  .brand-footer { text-align: center; padding: 24px 20px 16px; max-width: 760px; margin: 32px auto 0;
                  border-top: 1.5px dashed var(--ink); }
  .brand-footer-text { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--ink-soft); font-weight: 700; }
  .brand-footer-tag { font-family: 'Caveat', cursive; font-size: 18px; color: var(--scopely); margin-top: 2px; }
  @media print { body::before { display: none; } .btn, .toolbar, .brand-bar { display: none !important; } .card { box-shadow: none; page-break-inside: avoid; } }
`;
function StyleInjector() {
  useEffect(() => {
    if (document.getElementById('feedback-styles')) return;
    const s = document.createElement('style'); s.id = 'feedback-styles'; s.textContent = STYLES;
    document.head.appendChild(s);
  }, []);
  return null;
}

// Scopely wordmark
function ScopelyLogo() {
  return (
    <div className="brand-mark" aria-label="Scopely">
      <span className="brand-text">Scopely</span>
    </div>
  );
}

function BrandBar({ context }) {
  return (
    <div className="brand-bar">
      <ScopelyLogo />
      {context && <span className="brand-context">{context}</span>}
    </div>
  );
}

function BrandFooter() {
  return (
    <div className="brand-footer">
      <p className="brand-footer-text">Scopely · Community Onsite</p>
      <p className="brand-footer-tag">Inspire play, every day</p>
    </div>
  );
}

function QRCanvas({ text, size = 240 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      const qr = qrcode(0, 'M'); qr.addData(text); qr.make();
      const n = qr.getModuleCount(); const canvas = ref.current;
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f4ede1'; ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#1a1715';
      const QUIET = 2; const totalModules = n + QUIET * 2; const cell = size / totalModules;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        if (qr.isDark(y, x)) ctx.fillRect(Math.floor((x + QUIET) * cell), Math.floor((y + QUIET) * cell), Math.ceil(cell), Math.ceil(cell));
      }
    } catch (e) { console.error('QR error', e); }
  }, [text, size]);
  return <canvas ref={ref} style={{ width: size, height: size, display: 'block' }} />;
}

export default function App() {
  const [hash, setHash] = useState(parseHash());
  useEffect(() => {
    const onHash = () => setHash(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  // For lecture route, decide whether it's a regular session or a project session
  const lectureForRoute = hash.route === 'lecture' ? LECTURES.find(l => l.id === hash.lectureId) : null;
  const isProject = lectureForRoute && lectureForRoute.type === 'Project';
  const contextLabel = {
    home: 'Host Console',
    lecture: 'Session feedback',
    final: 'Wrap-up survey',
    admin: 'Admin · Live results',
  }[hash.route];
  return (
    <>
      <StyleInjector />
      <BrandBar context={contextLabel} />
      <div className="page">
        {hash.route === 'home'    && <HomePage />}
        {hash.route === 'lecture' && !isProject && <LecturePage lectureId={hash.lectureId} />}
        {hash.route === 'lecture' &&  isProject && <ProjectPage lecture={lectureForRoute} />}
        {hash.route === 'final'   && <FinalPage />}
        {hash.route === 'admin'   && <AdminPage />}
      </div>
      <BrandFooter />
    </>
  );
}

function HomePage() {
  const [selected, setSelected] = useState(LECTURES[0].id);
  const baseUrl = useMemo(() => window.location.href.split('#')[0], []);
  const isFinal = selected === '__final__';
  const lecture = isFinal ? null : LECTURES.find(l => l.id === selected);
  const url = isFinal ? `${baseUrl}#final` : `${baseUrl}#l/${selected}`;
  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <>
      <div className="anim" style={{ marginBottom: 24 }}>
        <span className="eyebrow">Community Onsite · Host Console</span>
        <h1 className="display" style={{ fontSize: 56, marginTop: 8 }}>
          Live <span style={{ color: 'var(--accent)' }}>feedback</span> from the room
        </h1>
        <p className="serif" style={{ fontSize: 18, marginTop: 8, color: 'var(--ink-soft)' }}>
          Show the QR at the end of each session — attendees scan, fill in, done in under a minute.
        </p>
      </div>
      <div className="card anim" style={{ marginBottom: 20 }}>
        <span className="eyebrow">Pick a session to display its QR</span>
        <select className="select" style={{ marginTop: 12, marginBottom: 20 }} value={selected} onChange={e => setSelected(e.target.value)}>
          {[1,2].map(d => (
            <optgroup key={d} label={`Day ${d}`}>
              {LECTURES.filter(l => l.day === d).map(l => (
                <option key={l.id} value={l.id}>{l.title} — {l.speaker}</option>
              ))}
            </optgroup>
          ))}
          <optgroup label="End of onsite">
            <option value="__final__">⭐ Wrap-up survey (full survey)</option>
          </optgroup>
        </select>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="qr-wrap" style={isFinal ? { boxShadow: '8px 8px 0 var(--accent-2)' } : {}}>
            <QRCanvas text={url} size={260} />
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            {isFinal ? (
              <>
                <span className="tag">Wrap-up</span>
                <span className="tag">All sessions</span>
                <h2 className="serif" style={{ fontSize: 22, marginTop: 10, fontWeight: 700, lineHeight: 1.3 }}>
                  End of onsite — full survey
                </h2>
                <p className="hand" style={{ fontSize: 22, marginTop: 6, color: 'var(--accent-2)' }}>
                  ~3 minutes, broader questions
                </p>
              </>
            ) : (
              <>
                <span className="tag">{lecture.type}</span>
                <span className="tag">Day {lecture.day}</span>
                <h2 className="serif" style={{ fontSize: 22, marginTop: 10, fontWeight: 700, lineHeight: 1.3 }}>{lecture.title}</h2>
                <p className="hand" style={{ fontSize: 22, marginTop: 6, color: 'var(--accent)' }}>{lecture.speaker}</p>
              </>
            )}
            <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--cream-2)', border: '1.5px solid var(--ink)', wordBreak: 'break-all', fontSize: 13, fontFamily: 'monospace' }}>
              {url}
            </div>
            <button className="btn btn-ghost" style={{ marginTop: 10, fontSize: 13, padding: '8px 14px' }} onClick={copyLink}>
              {copied ? '✓ Copied!' : 'Copy link'}
            </button>
          </div>
        </div>
      </div>
      <div className="anim" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => window.location.hash = 'admin'}>Open analytics dashboard</button>
        <button className="btn btn-ghost" onClick={() => window.print()}>Print this page</button>
      </div>
    </>
  );
}

function ProfileForm({ onDone }) {
  const [role, setRole] = useState(''); const [roleOther, setRoleOther] = useState('');
  const [seniority, setSeniority] = useState('');
  const [gameType, setGameType] = useState(''); const [gameTypeOther, setGameTypeOther] = useState('');
  // valid only if non-Other selected, OR Other selected with text filled in
  const roleValid = role && (role !== 'Other' || roleOther.trim());
  const gameValid = !gameType || (gameType !== 'Other') || gameTypeOther.trim();
  const canSave = roleValid && seniority && gameValid;
  const submit = () => {
    if (!canSave) return;
    const finalRole = role === 'Other' ? `Other: ${roleOther.trim()}` : role;
    const finalGame = !gameType ? '' : (gameType === 'Other' ? `Other: ${gameTypeOther.trim()}` : gameType);
    const profile = { role: finalRole, seniority, gameType: finalGame, ts: Date.now() };
    saveProfileLocal(profile); onDone(profile);
  };
  return (
    <div className="card">
      <span className="eyebrow">First time here · just a moment before we start</span>
      <h2 className="display" style={{ fontSize: 30, marginTop: 8, marginBottom: 6 }}>
        A few <span style={{ color: 'var(--accent)' }}>quick</span> things about you
      </h2>
      <p className="small" style={{ marginBottom: 20 }}>Fully anonymous — only used so we can analyze by role and experience. You'll only fill this once.</p>
      <div style={{ marginBottom: 20 }}>
        <span className="eyebrow">Role / discipline</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {ROLES.map(r => <button key={r} className={`pill ${role === r ? 'active' : ''}`} onClick={() => setRole(r)}>{r}</button>)}
        </div>
        {role === 'Other' && (
          <input className="input" style={{ marginTop: 10 }} placeholder="Tell us your role..." value={roleOther} onChange={e => setRoleOther(e.target.value)} autoFocus />
        )}
      </div>
      <div style={{ marginBottom: 20 }}>
        <span className="eyebrow">Years in the field</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {SENIORITY.map(s => <button key={s} className={`pill ${seniority === s ? 'active' : ''}`} onClick={() => setSeniority(s)}>{s}</button>)}
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <span className="eyebrow">Type of game you work on (optional)</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {GAME_TYPES.map(g => <button key={g} className={`pill ${gameType === g ? 'active' : ''}`} onClick={() => setGameType(gameType === g ? '' : g)}>{g}</button>)}
        </div>
        {gameType === 'Other' && (
          <input className="input" style={{ marginTop: 10 }} placeholder="Tell us the game type..." value={gameTypeOther} onChange={e => setGameTypeOther(e.target.value)} autoFocus />
        )}
      </div>
      <button className="btn" disabled={!canSave} onClick={submit}>Save & continue</button>
    </div>
  );
}

const EMOJI_OPTIONS = [
  { v: 1, e: '😴', label: 'Lost me' }, { v: 2, e: '😐', label: 'Okay' }, { v: 3, e: '🙂', label: 'Nice' },
  { v: 4, e: '🤩', label: 'Loved it' }, { v: 5, e: '🔥', label: 'Highlight of the day' },
];
const TAKEAWAY_OPTIONS = [
  "A new insight I didn't know",
  'Something I plan to apply',
  'A fresh perspective on something familiar',
  'Inspiration to think differently',
  'Mostly reinforced what I already knew',
  "Didn't take much away",
];

function LecturePage({ lectureId }) {
  const lecture = LECTURES.find(l => l.id === lectureId);
  const [profile, setProfile] = useState(loadProfileLocal());
  const [rating, setRating] = useState(null); const [pace, setPace] = useState(null);
  const [takeaways, setTakeaways] = useState([]); const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState(null);

  if (!lecture) return (
    <div className="card">
      <h2 className="display" style={{ fontSize: 28, marginBottom: 10 }}>Session not found</h2>
      <p className="small">Check the link or return to the home page.</p>
      <button className="btn" style={{ marginTop: 16 }} onClick={() => window.location.hash = ''}>Go home</button>
    </div>
  );
  if (!profile) return <ProfileForm onDone={setProfile} />;

  const toggleTakeaway = (t) => setTakeaways(takeaways.includes(t) ? takeaways.filter(x => x !== t) : [...takeaways, t]);

  const submit = async () => {
    if (!rating) return;
    setSubmitting(true); setError(null);
    try {
      await insertLectureFeedback({
        lecture_id: lecture.id, day: lecture.day, title: lecture.title, speaker: lecture.speaker, type: lecture.type,
        rating, pace, takeaways, comment: comment.trim() || null,
        role: profile.role, seniority: profile.seniority, game_type: profile.gameType || null,
      });
      setSubmitted(true);
    } catch (e) { console.error(e); setError('Something went wrong. Please try again.'); }
    finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div className="card anim" style={{ textAlign: 'center', padding: 36 }}>
      <div style={{ fontSize: 64, marginBottom: 12 }}>🙏</div>
      <h2 className="display" style={{ fontSize: 36, marginBottom: 10 }}>Thank you!</h2>
      <p className="serif" style={{ fontSize: 18, color: 'var(--ink-soft)' }}>Your feedback is saved. See you in the next session.</p>
      <p className="hand" style={{ fontSize: 22, color: 'var(--accent)', marginTop: 16 }}>We get better because of you</p>
    </div>
  );

  return (
    <>
      <div className="anim" style={{ marginBottom: 20 }}>
        <span className="stamp">Feedback · Day {lecture.day}</span>
        <h1 className="display" style={{ fontSize: 32, marginTop: 14, lineHeight: 1.15 }}>{lecture.title}</h1>
        <p className="hand" style={{ fontSize: 24, color: 'var(--accent)', marginTop: 4 }}>{lecture.speaker}</p>
      </div>
      <div className="card anim" style={{ marginBottom: 16 }}>
        <span className="eyebrow">How was it?</span>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {EMOJI_OPTIONS.map(opt => (
            <button key={opt.v} className={`emoji-btn ${rating === opt.v ? 'active' : ''}`} onClick={() => setRating(opt.v)} title={opt.label}>{opt.e}</button>
          ))}
        </div>
        {rating && <p className="hand" style={{ fontSize: 20, marginTop: 10, color: 'var(--accent)' }}>{EMOJI_OPTIONS.find(o => o.v === rating).label}</p>}
      </div>
      <div className="card anim" style={{ marginBottom: 16 }}>
        <span className="eyebrow">What did you take with you? (pick any)</span>
        <div style={{ marginTop: 14 }}>
          {TAKEAWAY_OPTIONS.map(t => (
            <div key={t} className={`check-row ${takeaways.includes(t) ? 'active' : ''}`} onClick={() => toggleTakeaway(t)}>
              <input type="checkbox" checked={takeaways.includes(t)} readOnly style={{ pointerEvents: 'none' }} />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card anim" style={{ marginBottom: 16 }}>
        <span className="eyebrow">Pace</span>
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          {['Too slow', 'Just right', 'Too fast'].map((label, i) => (
            <button key={label} className={`pill ${pace === i ? 'active' : ''}`} onClick={() => setPace(i)} style={{ flex: 1, justifyContent: 'center', padding: '10px 8px' }}>{label}</button>
          ))}
        </div>
      </div>
      <div className="card anim" style={{ marginBottom: 20 }}>
        <span className="eyebrow">Anything to add? (optional)</span>
        <textarea className="textarea" style={{ marginTop: 10 }} placeholder="What worked, what didn't, ideas to improve..." value={comment} onChange={e => setComment(e.target.value)} />
      </div>
      {error && <p className="small" style={{ color: 'var(--accent)', marginBottom: 12 }}>{error}</p>}
      <button className="btn anim" disabled={!rating || submitting} onClick={submit}>{submitting ? 'Saving...' : 'Submit feedback'}</button>
    </>
  );
}

const PROJECT_EMOJI = [
  { v: 1, e: '😴', label: 'Frustrating' },
  { v: 2, e: '😐', label: 'Okay' },
  { v: 3, e: '🙂', label: 'Productive' },
  { v: 4, e: '🤩', label: 'Energizing' },
  { v: 5, e: '🔥', label: 'Best part of the onsite' },
];
const PROGRESS_OPTIONS = [
  "Got stuck early — didn't really start",
  "Picked a trend, but didn't get much further",
  'Made some progress on the creative/visual side',
  'Built something solid across most steps',
  'Have a complete piece ready to ship',
];
const PROJECT_STEPS = [
  { key: 'trend',     label: 'Finding a relevant trend' },
  { key: 'adapt',     label: "Adapting it to your game (creative/voice)" },
  { key: 'ai',        label: 'Generating art and copy with AI' },
  { key: 'kpi',       label: 'Defining KPIs to measure success' },
  { key: 'integrate', label: 'Putting it all together for upload' },
];
const HELPER_SESSIONS = [
  'Trends School (Rachel)',
  'Spot the Trend workshop (Rachel)',
  'Steal Like a CM (Tamar)',
  'AI Workshop (Daniel)',
  "Numbers Don't Lie / KPIs (Central analytics)",
  "Hosts' live help during the project",
  "Honestly, mostly figured it out on my own",
];
const STUCK_OPTIONS = [
  'Picking the right trend',
  "Translating the trend to my game's vibe",
  'Getting AI to produce what I wanted',
  'Defining meaningful KPIs',
  'Time pressure',
  'Group/collaboration dynamics',
  'Nothing — it flowed',
];

function ProjectPage({ lecture }) {
  const [profile, setProfile] = useState(loadProfileLocal());
  const [rating, setRating] = useState(null);
  const [progress, setProgress] = useState('');
  const [stepRatings, setStepRatings] = useState({}); // { trend: 4, adapt: 3, ... }
  const [helpers, setHelpers] = useState([]);
  const [stuck, setStuck] = useState([]);
  const [takeaway, setTakeaway] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!profile) return <ProfileForm onDone={setProfile} />;

  const setStep = (key, val) => setStepRatings({ ...stepRatings, [key]: val });
  const toggleArr = (arr, setter, item) => setter(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);

  const submit = async () => {
    if (!rating || !progress) return;
    setSubmitting(true); setError(null);
    try {
      await insertProjectFeedback({
        rating, progress,
        step_trend:     stepRatings.trend     || null,
        step_adapt:     stepRatings.adapt     || null,
        step_ai:        stepRatings.ai        || null,
        step_kpi:       stepRatings.kpi       || null,
        step_integrate: stepRatings.integrate || null,
        helpers, stuck, takeaway: takeaway.trim() || null,
        role: profile.role, seniority: profile.seniority, game_type: profile.gameType || null,
      });
      setSubmitted(true);
    } catch (e) { console.error(e); setError('Something went wrong. Please try again.'); }
    finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div className="card anim" style={{ textAlign: 'center', padding: 36 }}>
      <div style={{ fontSize: 64, marginBottom: 12 }}>🛠️</div>
      <h2 className="display" style={{ fontSize: 36, marginBottom: 10 }}>Thank you!</h2>
      <p className="serif" style={{ fontSize: 18, color: 'var(--ink-soft)' }}>This is exactly the kind of feedback we need to make the project session even better next time.</p>
    </div>
  );

  const StepScale = ({ stepKey }) => (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(v => (
        <button key={v}
                className={`scale-btn ${stepRatings[stepKey] === v ? 'active' : ''}`}
                style={{ minWidth: 36, height: 40, fontSize: 14 }}
                onClick={() => setStep(stepKey, v)}>{v}</button>
      ))}
    </div>
  );

  return (
    <>
      <div className="anim" style={{ marginBottom: 20 }}>
        <span className="stamp">Project Feedback · Day {lecture.day}</span>
        <h1 className="display" style={{ fontSize: 32, marginTop: 14, lineHeight: 1.15 }}>{lecture.title}</h1>
        <p className="hand" style={{ fontSize: 24, color: 'var(--accent)', marginTop: 4 }}>Apply everything you learned</p>
      </div>

      <div className="card anim" style={{ marginBottom: 16 }}>
        <span className="eyebrow">How was the project for you overall?</span>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {PROJECT_EMOJI.map(opt => (
            <button key={opt.v}
                    className={`emoji-btn ${rating === opt.v ? 'active' : ''}`}
                    onClick={() => setRating(opt.v)}
                    title={opt.label}>{opt.e}</button>
          ))}
        </div>
        {rating && <p className="hand" style={{ fontSize: 20, marginTop: 10, color: 'var(--accent)' }}>{PROJECT_EMOJI.find(o => o.v === rating).label}</p>}
      </div>

      <div className="card anim" style={{ marginBottom: 16 }}>
        <span className="eyebrow">How far did you get?</span>
        <div style={{ marginTop: 14 }}>
          {PROGRESS_OPTIONS.map(p => (
            <div key={p} className={`check-row ${progress === p ? 'active' : ''}`} onClick={() => setProgress(p)}>
              <input type="radio" checked={progress === p} readOnly style={{ pointerEvents: 'none' }} />
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card anim" style={{ marginBottom: 16 }}>
        <span className="eyebrow">For each step — did you feel equipped? (1–5)</span>
        <div style={{ marginTop: 14 }}>
          {PROJECT_STEPS.map(step => (
            <div key={step.key} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 14, marginBottom: 6 }}>{step.label}</p>
              <StepScale stepKey={step.key} />
            </div>
          ))}
        </div>
      </div>

      <div className="card anim" style={{ marginBottom: 16 }}>
        <span className="eyebrow">Which sessions actually helped you in the project? (pick any)</span>
        <div style={{ marginTop: 14 }}>
          {HELPER_SESSIONS.map(h => (
            <div key={h} className={`check-row ${helpers.includes(h) ? 'active' : ''}`} onClick={() => toggleArr(helpers, setHelpers, h)}>
              <input type="checkbox" checked={helpers.includes(h)} readOnly style={{ pointerEvents: 'none' }} />
              <span>{h}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card anim" style={{ marginBottom: 16 }}>
        <span className="eyebrow">Where did you get stuck (if anywhere)? (pick any)</span>
        <div style={{ marginTop: 14 }}>
          {STUCK_OPTIONS.map(s => (
            <div key={s} className={`check-row ${stuck.includes(s) ? 'active' : ''}`} onClick={() => toggleArr(stuck, setStuck, s)}>
              <input type="checkbox" checked={stuck.includes(s)} readOnly style={{ pointerEvents: 'none' }} />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card anim" style={{ marginBottom: 20 }}>
        <span className="eyebrow">One thing you'll take from this project back to work (optional)</span>
        <textarea className="textarea" style={{ marginTop: 10 }}
                  value={takeaway} onChange={e => setTakeaway(e.target.value)}
                  placeholder="Something I learned by doing..." />
      </div>

      {error && <p className="small" style={{ color: 'var(--accent)', marginBottom: 12 }}>{error}</p>}

      <button className="btn anim" disabled={!rating || !progress || submitting} onClick={submit}>
        {submitting ? 'Saving...' : 'Submit feedback'}
      </button>
    </>
  );
}

const IMPACT_AREAS = [
  'Understanding trends & market analysis', 'Using AI tools day-to-day', 'Metrics, KPIs and reporting',
  'Community building & game listening', 'Social/TikTok content creation', 'Professional connections with peers',
];

function FinalPage() {
  const [profile, setProfile] = useState(loadProfileLocal());
  const [overall, setOverall] = useState(null);
  const [bestSession, setBestSession] = useState(''); const [growth, setGrowth] = useState([]);
  const [networkValue, setNetworkValue] = useState(null); const [logistics, setLogistics] = useState(null);
  const [next, setNext] = useState(''); const [improve, setImprove] = useState('');
  const [submitted, setSubmitted] = useState(false); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState(null);

  if (!profile) return <ProfileForm onDone={setProfile} />;

  const toggleGrowth = (g) => setGrowth(growth.includes(g) ? growth.filter(x => x !== g) : [...growth, g]);

  const submit = async () => {
    if (!overall) return;
    setSubmitting(true); setError(null);
    try {
      await insertFinalFeedback({
        overall, best_session: bestSession || null, growth, network_value: networkValue, logistics,
        next_action: next.trim() || null, improve: improve.trim() || null,
        role: profile.role, seniority: profile.seniority, game_type: profile.gameType || null,
      });
      setSubmitted(true);
    } catch (e) { console.error(e); setError('Something went wrong. Please try again.'); }
    finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div className="card anim" style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 72, marginBottom: 12 }}>🎉</div>
      <h2 className="display" style={{ fontSize: 40, marginBottom: 10 }}>Thank you so much</h2>
      <p className="serif" style={{ fontSize: 18, color: 'var(--ink-soft)' }}>It was a joy to host you. This input is gold.</p>
    </div>
  );

  const ScaleRow = ({ value, onChange, n = 5 }) => (
    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
      {Array.from({ length: n }, (_, i) => i + 1).map(v => (
        <button key={v} className={`scale-btn ${value === v ? 'active' : ''}`} onClick={() => onChange(v)}>{v}</button>
      ))}
    </div>
  );

  return (
    <>
      <div className="anim" style={{ marginBottom: 20 }}>
        <span className="stamp">Wrap-up survey · Community Onsite</span>
        <h1 className="display" style={{ fontSize: 44, marginTop: 14, lineHeight: 1.05 }}>
          Your <span style={{ color: 'var(--accent)' }}>summary</span>,<br/>in your words
        </h1>
        <p className="serif" style={{ fontSize: 17, marginTop: 10, color: 'var(--ink-soft)' }}>
          About 3 minutes. Honest, yours, helps us build the next one even better.
        </p>
      </div>
      <div className="card anim" style={{ marginBottom: 16 }}>
        <span className="eyebrow">Overall onsite experience (1–5)</span>
        <ScaleRow value={overall} onChange={setOverall} />
      </div>
      <div className="card anim" style={{ marginBottom: 16 }}>
        <span className="eyebrow">Most meaningful session for you</span>
        <select className="select" style={{ marginTop: 12 }} value={bestSession} onChange={e => setBestSession(e.target.value)}>
          <option value="">— Pick a session —</option>
          {LECTURES.map(l => <option key={l.id} value={l.id}>{l.title} ({l.speaker})</option>)}
        </select>
      </div>
      <div className="card anim" style={{ marginBottom: 16 }}>
        <span className="eyebrow">Where do you feel you grew? (pick any)</span>
        <div style={{ marginTop: 14 }}>
          {IMPACT_AREAS.map(g => (
            <div key={g} className={`check-row ${growth.includes(g) ? 'active' : ''}`} onClick={() => toggleGrowth(g)}>
              <input type="checkbox" checked={growth.includes(g)} readOnly style={{ pointerEvents: 'none' }} />
              <span>{g}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card anim" style={{ marginBottom: 16 }}>
        <span className="eyebrow">Value of meeting new people? (1–5)</span>
        <ScaleRow value={networkValue} onChange={setNetworkValue} />
      </div>
      <div className="card anim" style={{ marginBottom: 16 }}>
        <span className="eyebrow">Logistics (schedule, food, venue)? (1–5)</span>
        <ScaleRow value={logistics} onChange={setLogistics} />
      </div>
      <div className="card anim" style={{ marginBottom: 16 }}>
        <span className="eyebrow">First thing you'll do back at work?</span>
        <textarea className="textarea" style={{ marginTop: 10 }} value={next} onChange={e => setNext(e.target.value)} placeholder="On Monday morning I'll..." />
      </div>
      <div className="card anim" style={{ marginBottom: 20 }}>
        <span className="eyebrow">One thing we should have done differently</span>
        <textarea className="textarea" style={{ marginTop: 10 }} value={improve} onChange={e => setImprove(e.target.value)} />
      </div>
      {error && <p className="small" style={{ color: 'var(--accent)', marginBottom: 12 }}>{error}</p>}
      <button className="btn anim" disabled={!overall || submitting} onClick={submit}>{submitting ? 'Submitting...' : 'Send wrap-up'}</button>
    </>
  );
}

// ============================================================
// ANALYTICS HELPERS
// ============================================================
const CHART_COLORS = ['#1a1715', '#c8553d', '#588157', '#1e90ff', '#b08968', '#4a423c'];
const RATING_COLORS = { 1: '#c8553d', 2: '#b08968', 3: '#4a423c', 4: '#588157', 5: '#1e90ff' };

// Custom tooltip in newsprint style
function NewsprintTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: '#f4ede1', border: '1.5px solid #1a1715', padding: '8px 12px', fontSize: 13 }}>
      {label && <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#1a1715' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed?.(2) || p.value : p.value}
        </div>
      ))}
    </div>
  );
}

// Compute analytics for a single lecture
function analyzeLecture(submissions, lectureId) {
  const subs = submissions.filter(s => s.lecture_id === lectureId);
  if (!subs.length) return null;

  // Emoji distribution
  const emojiDist = [1,2,3,4,5].map(v => ({
    rating: v,
    label: ['😴 Lost', '😐 Okay', '🙂 Nice', '🤩 Loved', '🔥 Highlight'][v-1],
    count: subs.filter(s => s.rating === v).length,
  }));

  // Average + std dev (consistency)
  const ratings = subs.map(s => s.rating);
  const avg = ratings.reduce((a,b) => a+b, 0) / ratings.length;
  const variance = ratings.reduce((a,r) => a + (r-avg)**2, 0) / ratings.length;
  const stdDev = Math.sqrt(variance);

  // By role
  const byRole = {};
  for (const s of subs) {
    const r = s.role || 'Unknown';
    if (!byRole[r]) byRole[r] = { count: 0, sum: 0, ratings: [] };
    byRole[r].count++; byRole[r].sum += s.rating; byRole[r].ratings.push(s.rating);
  }
  const roleChart = Object.entries(byRole).map(([role, v]) => ({
    role: role.length > 14 ? role.slice(0, 12) + '…' : role,
    avg: +(v.sum / v.count).toFixed(2),
    count: v.count,
  })).sort((a,b) => b.avg - a.avg);

  // By seniority
  const bySeniority = {};
  for (const s of subs) {
    const r = s.seniority || 'Unknown';
    if (!bySeniority[r]) bySeniority[r] = { count: 0, sum: 0 };
    bySeniority[r].count++; bySeniority[r].sum += s.rating;
  }
  const seniorityOrder = ['Less than a year', '1–3 years', '3–7 years', '7+ years', 'Unknown'];
  const seniorityChart = seniorityOrder
    .filter(s => bySeniority[s])
    .map(s => ({
      seniority: s === 'Less than a year' ? '<1y' : s.replace(' years', 'y'),
      avg: +(bySeniority[s].sum / bySeniority[s].count).toFixed(2),
      count: bySeniority[s].count,
    }));

  // Pace
  const paceCounts = [0, 0, 0];
  for (const s of subs) if (typeof s.pace === 'number') paceCounts[s.pace]++;
  const paceChart = ['Too slow', 'Just right', 'Too fast'].map((label, i) => ({
    label, count: paceCounts[i]
  }));

  // Takeaways with avg rating per takeaway
  const takeawayStats = {};
  for (const s of subs) {
    for (const t of (s.takeaways || [])) {
      if (!takeawayStats[t]) takeawayStats[t] = { count: 0, sum: 0 };
      takeawayStats[t].count++; takeawayStats[t].sum += s.rating;
    }
  }
  const takeawayChart = Object.entries(takeawayStats)
    .map(([t, v]) => ({ takeaway: t.length > 36 ? t.slice(0, 34) + '…' : t, count: v.count, avg: +(v.sum/v.count).toFixed(2) }))
    .sort((a,b) => b.count - a.count);

  // Comments
  const comments = subs.filter(s => s.comment).map(s => ({
    comment: s.comment, role: s.role, rating: s.rating, seniority: s.seniority,
  }));

  // Auto insights
  const insights = [];
  if (roleChart.length >= 2) {
    const best = roleChart[0], worst = roleChart[roleChart.length-1];
    if (best.avg - worst.avg >= 1) {
      insights.push({
        label: 'Role divide',
        text: `Loved by ${best.role} (⌀${best.avg}) but underperformed for ${worst.role} (⌀${worst.avg}).`
      });
    }
  }
  if (stdDev > 1.2) {
    insights.push({
      label: 'Polarizing',
      text: `High disagreement (σ=${stdDev.toFixed(2)}). Some loved it, some didn't — worth reading the comments.`
    });
  } else if (stdDev < 0.6 && avg >= 4) {
    insights.push({
      label: 'Universal hit',
      text: `Consistently high ratings across the room (σ=${stdDev.toFixed(2)}).`
    });
  }
  if (paceCounts[2] > paceCounts[1] && paceCounts[2] > 0) {
    insights.push({
      label: 'Pacing issue',
      text: `Most attendees felt it was too fast (${paceCounts[2]} of ${subs.length}).`
    });
  } else if (paceCounts[0] > paceCounts[1] && paceCounts[0] > 0) {
    insights.push({
      label: 'Pacing issue',
      text: `Most attendees felt it was too slow (${paceCounts[0]} of ${subs.length}).`
    });
  }
  if (takeawayChart.length && takeawayChart[0].takeaway.toLowerCase().includes("didn't take")) {
    insights.push({
      label: 'Limited transfer',
      text: `The most-picked takeaway was "didn't take much away" — consider revising the call-to-action.`
    });
  }
  const applyTakeaway = takeawayChart.find(t => t.takeaway.toLowerCase().includes('plan to apply'));
  if (applyTakeaway && applyTakeaway.count >= subs.length * 0.5) {
    insights.push({
      label: 'High intent',
      text: `${applyTakeaway.count} of ${subs.length} plan to apply something — strong actionability.`
    });
  }

  return {
    count: subs.length, avg: +avg.toFixed(2), stdDev: +stdDev.toFixed(2),
    emojiDist, roleChart, seniorityChart, paceChart, takeawayChart, comments, insights,
  };
}

// Onsite-wide analytics
function analyzeOnsite(submissions, lectures) {
  if (!submissions.length) return null;

  // League table with stdDev
  const byLec = {};
  for (const s of submissions) {
    if (!byLec[s.lecture_id]) byLec[s.lecture_id] = [];
    byLec[s.lecture_id].push(s.rating);
  }
  const league = Object.entries(byLec).map(([lid, ratings]) => {
    const lec = lectures.find(l => l.id === lid) || { title: lid, speaker: '', day: 0, type: '' };
    const avg = ratings.reduce((a,b) => a+b, 0) / ratings.length;
    const stdDev = Math.sqrt(ratings.reduce((a,r) => a + (r-avg)**2, 0) / ratings.length);
    return { id: lid, ...lec, avg: +avg.toFixed(2), stdDev: +stdDev.toFixed(2), count: ratings.length };
  }).sort((a,b) => b.avg - a.avg);

  // Heatmap: role × session
  const roles = [...new Set(submissions.map(s => s.role || 'Unknown'))].sort();
  const heatmap = league.map(lec => {
    const row = { id: lec.id, title: lec.title, day: lec.day };
    for (const role of roles) {
      const subs = submissions.filter(s => s.lecture_id === lec.id && (s.role || 'Unknown') === role);
      row[role] = subs.length ? +(subs.reduce((a,s) => a+s.rating, 0) / subs.length).toFixed(1) : null;
    }
    return row;
  });

  // Day-by-day arc (avg rating by chronological order within each day)
  const dayArcs = {};
  for (const lec of league.slice().sort((a,b) => a.day - b.day || a.title.localeCompare(b.title))) {
    if (!dayArcs[lec.day]) dayArcs[lec.day] = [];
    dayArcs[lec.day].push({ name: lec.title.length > 22 ? lec.title.slice(0, 20) + '…' : lec.title, avg: lec.avg });
  }

  return { league, heatmap, roles, dayArcs, totalSubmissions: submissions.length };
}

// Renders heatmap cell with color
function heatColor(value) {
  if (value === null || value === undefined) return '#ebe1cf';
  if (value >= 4.5) return '#1e90ff';
  if (value >= 4)   return '#588157';
  if (value >= 3.5) return '#b08968';
  if (value >= 3)   return '#c8553d';
  return '#1a1715';
}

function AdminPage() {
  const [authed, setAuthed] = useState(false); const [pin, setPin] = useState('');
  const [submissions, setSubmissions] = useState([]); const [finalSubs, setFinalSubs] = useState([]); const [projectSubs, setProjectSubs] = useState([]);
  const [loading, setLoading] = useState(false); const [filter, setFilter] = useState('all');

  const refresh = async () => {
    setLoading(true);
    try {
      const [subs, fins, projs] = await Promise.all([fetchLectureFeedback(), fetchFinalFeedback(), fetchProjectFeedback()]);
      setSubmissions(subs); setFinalSubs(fins); setProjectSubs(projs);
    } finally { setLoading(false); }
  };
  useEffect(() => { if (authed) refresh(); }, [authed]);

  const byLecture = useMemo(() => {
    const map = {};
    for (const s of submissions) {
      const lid = s.lecture_id;
      if (!map[lid]) {
        const l = LECTURES.find(x => x.id === lid) || { title: s.title, speaker: s.speaker, day: s.day, type: s.type };
        map[lid] = { id: lid, ...l, count: 0, sumRating: 0, paces: [0,0,0], takeaways: {}, comments: [], byRole: {} };
      }
      const e = map[lid];
      e.count++; e.sumRating += s.rating;
      if (typeof s.pace === 'number') e.paces[s.pace]++;
      for (const t of (s.takeaways || [])) e.takeaways[t] = (e.takeaways[t] || 0) + 1;
      if (s.comment) e.comments.push({ comment: s.comment, role: s.role, rating: s.rating });
      const role = s.role || 'Unknown';
      if (!e.byRole[role]) e.byRole[role] = { count: 0, sum: 0 };
      e.byRole[role].count++; e.byRole[role].sum += s.rating;
    }
    return Object.values(map).sort((a,b) => (a.day - b.day) || a.title.localeCompare(b.title));
  }, [submissions]);

  const overall = useMemo(() => {
    const total = submissions.length;
    const avg = total ? (submissions.reduce((a,s) => a + s.rating, 0) / total).toFixed(2) : '–';
    const totalFinal = finalSubs.length;
    const avgOverall = totalFinal ? (finalSubs.reduce((a,s) => a + s.overall, 0) / totalFinal).toFixed(2) : '–';
    return { total, avg, totalFinal, avgOverall };
  }, [submissions, finalSubs]);

  const roleBreakdown = useMemo(() => {
    const map = {};
    for (const s of submissions) {
      const r = s.role || 'Unknown';
      if (!map[r]) map[r] = { count: 0, sum: 0 };
      map[r].count++; map[r].sum += s.rating;
    }
    return Object.entries(map).map(([role, v]) => ({ role, count: v.count, avg: (v.sum / v.count).toFixed(2) }))
      .sort((a,b) => b.count - a.count);
  }, [submissions]);

  // Deep onsite-wide analytics
  const onsite = useMemo(() => analyzeOnsite(submissions, LECTURES), [submissions]);
  // Drill-down per session
  const drillDown = useMemo(() => filter === 'all' ? null : analyzeLecture(submissions, filter), [submissions, filter]);

  if (!authed) return (
    <div className="card" style={{ maxWidth: 380, margin: '60px auto' }}>
      <span className="eyebrow">Host login</span>
      <h2 className="display" style={{ fontSize: 28, marginTop: 8, marginBottom: 16 }}>Admin dashboard</h2>
      <input className="input" type="password" placeholder="PIN" value={pin}
             onChange={e => setPin(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && pin === ADMIN_PIN && setAuthed(true)} />
      <button className="btn" style={{ marginTop: 16 }} onClick={() => pin === ADMIN_PIN && setAuthed(true)}>Enter</button>
    </div>
  );

  const exportCSV = () => {
    const rows = [['lecture_id','day','title','speaker','type','rating','pace','takeaways','comment','role','seniority','game_type','timestamp']];
    for (const s of submissions) {
      rows.push([
        s.lecture_id, s.day, s.title, s.speaker, s.type, s.rating,
        ['Too slow','Just right','Too fast'][s.pace] ?? '', (s.takeaways||[]).join('|'),
        (s.comment||'').replace(/\n/g,' '), s.role || '', s.seniority || '',
        s.game_type || '', s.created_at,
      ]);
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `feedback-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  return (
    <>
      <div className="anim" style={{ marginBottom: 20 }}>
        <span className="eyebrow">Admin · Live results</span>
        <h1 className="display" style={{ fontSize: 44, marginTop: 8 }}>What the <span style={{ color: 'var(--accent)' }}>room</span> said</h1>
      </div>
      <div className="anim toolbar">
        <button className="btn btn-ghost" onClick={refresh}>{loading ? 'Loading...' : 'Refresh'}</button>
        <button className="btn btn-ghost" onClick={exportCSV} disabled={!submissions.length}>Download CSV</button>
        <button className="btn btn-ghost" onClick={() => window.location.hash = ''}>Back</button>
      </div>
      <div className="anim" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
        <div className="stat"><span className="eyebrow">Session feedback</span><div className="stat-num">{overall.total}</div></div>
        <div className="stat"><span className="eyebrow">Avg (1–5)</span><div className="stat-num">{overall.avg}</div></div>
        <div className="stat"><span className="eyebrow">Wrap-up surveys</span><div className="stat-num">{overall.totalFinal}</div></div>
      </div>
      {roleBreakdown.length > 0 && (
        <div className="card anim" style={{ marginBottom: 24 }}>
          <span className="eyebrow">By role</span>
          <h3 className="serif" style={{ fontSize: 20, marginTop: 6, marginBottom: 16, fontWeight: 700 }}>Audience breakdown</h3>
          {roleBreakdown.map(r => (
            <div key={r.role} className="bar-row">
              <span style={{ fontSize: 13 }}>{r.role}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(r.count / overall.total) * 100}%` }} /></div>
              <span className="small">{r.count} · ⌀{r.avg}</span>
            </div>
          ))}
        </div>
      )}
      {/* Rich league table with consistency */}
      {onsite && (
        <div className="card anim" style={{ marginBottom: 24 }}>
          <span className="eyebrow">Session ranking · sorted by average</span>
          <h3 className="serif" style={{ fontSize: 20, marginTop: 6, marginBottom: 16, fontWeight: 700 }}>League table</h3>
          <p className="small" style={{ marginBottom: 16 }}>
            Top 3 highlighted in blue · σ (consistency) — higher means more disagreement in the room.
          </p>
          {onsite.league.map((l, i) => {
            const isTop = i < 3;
            const isBottom = i >= onsite.league.length - 3 && onsite.league.length > 6;
            return (
              <div key={l.id} className="lec-row" style={{ background: isTop ? 'rgba(30,144,255,0.05)' : isBottom ? 'rgba(200,85,61,0.05)' : 'transparent', padding: '14px 8px' }}>
                <div>
                  <span className="tag">#{i+1}</span>
                  <span className="tag">Day {l.day}</span>
                  <span className="tag">{l.type}</span>
                  <span className="serif" style={{ fontSize: 16, fontWeight: 700 }}>{l.title}</span>
                  <p className="hand" style={{ fontSize: 18, color: 'var(--accent)' }}>{l.speaker}</p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div className="stat-num" style={{ fontSize: 28, color: isTop ? 'var(--scopely)' : isBottom ? 'var(--accent)' : 'var(--ink)' }}>{l.avg}</div>
                  <span className="small">{l.count} responses · σ {l.stdDev}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Day arc — how ratings flowed through each day */}
      {onsite && Object.keys(onsite.dayArcs).length > 0 && (
        <div className="card anim" style={{ marginBottom: 24 }}>
          <span className="eyebrow">Audience journey</span>
          <h3 className="serif" style={{ fontSize: 20, marginTop: 6, marginBottom: 16, fontWeight: 700 }}>How the room moved through each day</h3>
          {Object.entries(onsite.dayArcs).map(([day, sessions]) => (
            <div key={day} style={{ marginBottom: 16 }}>
              <p className="small" style={{ marginBottom: 8, fontWeight: 700 }}>Day {day}</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={sessions} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                  <CartesianGrid stroke="#1a1715" strokeOpacity={0.1} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#4a423c' }} angle={-25} textAnchor="end" interval={0} />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: '#4a423c' }} />
                  <Tooltip content={<NewsprintTooltip />} />
                  <Line type="monotone" dataKey="avg" stroke="#1e90ff" strokeWidth={2.5} dot={{ fill: '#1e90ff', r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap: role × session */}
      {onsite && onsite.heatmap.length > 0 && onsite.roles.length > 1 && (
        <div className="card anim" style={{ marginBottom: 24 }}>
          <span className="eyebrow">Cross-cut</span>
          <h3 className="serif" style={{ fontSize: 20, marginTop: 6, marginBottom: 16, fontWeight: 700 }}>Who liked what · session × role heatmap</h3>
          <p className="small" style={{ marginBottom: 12 }}>Each cell shows the average rating for that role on that session. Empty cells = no responses.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1.5px solid #1a1715', fontWeight: 700, position: 'sticky', left: 0, background: '#f4ede1', minWidth: 180 }}>Session</th>
                  {onsite.roles.map(role => (
                    <th key={role} style={{ padding: '8px 6px', borderBottom: '1.5px solid #1a1715', fontWeight: 700, minWidth: 60, fontSize: 10, letterSpacing: '0.1em' }}>
                      {role.length > 10 ? role.slice(0, 10) : role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {onsite.heatmap.map(row => (
                  <tr key={row.id}>
                    <td style={{ padding: '8px 6px', borderBottom: '1px dashed #1a1715', position: 'sticky', left: 0, background: '#f4ede1' }}>
                      <span className="tag" style={{ fontSize: 9 }}>D{row.day}</span>
                      <span style={{ fontSize: 11 }}>{row.title.length > 28 ? row.title.slice(0, 26) + '…' : row.title}</span>
                    </td>
                    {onsite.roles.map(role => {
                      const v = row[role];
                      return (
                        <td key={role} style={{ padding: 4, borderBottom: '1px dashed #1a1715', textAlign: 'center' }}>
                          {v !== null && v !== undefined ? (
                            <div style={{
                              background: heatColor(v),
                              color: v >= 3.5 ? '#f4ede1' : '#1a1715',
                              padding: '6px 4px',
                              fontWeight: 700,
                              fontSize: 12,
                            }}>{v}</div>
                          ) : (
                            <div style={{ color: '#aaa', fontSize: 11 }}>—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="legend-row" style={{ marginTop: 12 }}>
            <span><span className="legend-dot" style={{ background: '#1e90ff' }}></span>4.5+</span>
            <span><span className="legend-dot" style={{ background: '#588157' }}></span>4.0–4.5</span>
            <span><span className="legend-dot" style={{ background: '#b08968' }}></span>3.5–4.0</span>
            <span><span className="legend-dot" style={{ background: '#c8553d' }}></span>3.0–3.5</span>
            <span><span className="legend-dot" style={{ background: '#1a1715' }}></span>&lt;3.0</span>
          </div>
        </div>
      )}
      <div className="card anim" style={{ marginBottom: 24 }}>
        <span className="eyebrow">Drill into a session</span>
        <select className="select" style={{ marginTop: 12, marginBottom: 16 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All sessions</option>
          {LECTURES.map(l => <option key={l.id} value={l.id}>{l.title} — {l.speaker}</option>)}
        </select>
        {filter !== 'all' && !drillDown && <p className="small">No responses yet for this session.</p>}
        {filter !== 'all' && drillDown && (() => {
          const lec = LECTURES.find(l => l.id === filter);
          return (
            <>
              <h3 className="serif" style={{ fontSize: 22, marginBottom: 4, fontWeight: 700 }}>{lec.title}</h3>
              <p className="hand" style={{ fontSize: 20, color: 'var(--accent)', marginBottom: 16 }}>{lec.speaker}</p>

              {/* Headline stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 20 }}>
                <div className="stat"><span className="eyebrow">Average</span><div className="stat-num">{drillDown.avg}</div></div>
                <div className="stat"><span className="eyebrow">Responses</span><div className="stat-num">{drillDown.count}</div></div>
                <div className="stat"><span className="eyebrow">Consistency (σ)</span><div className="stat-num" style={{ color: drillDown.stdDev > 1.2 ? 'var(--accent)' : drillDown.stdDev < 0.6 ? 'var(--accent-2)' : 'var(--ink)' }}>{drillDown.stdDev}</div></div>
              </div>

              {/* Auto insights */}
              {drillDown.insights.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  {drillDown.insights.map((ins, i) => (
                    <div key={i} className="insight-card">
                      <div className="label">{ins.label}</div>
                      <div className="text">{ins.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Emoji distribution — bar chart */}
              <div className="chart-card">
                <div className="chart-title">Rating distribution</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={drillDown.emojiDist} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid stroke="#1a1715" strokeOpacity={0.1} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#4a423c' }} interval={0} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#4a423c' }} />
                    <Tooltip content={<NewsprintTooltip />} cursor={{ fill: '#ebe1cf' }} />
                    <Bar dataKey="count" radius={[3,3,0,0]}>
                      {drillDown.emojiDist.map((entry, i) => (
                        <Cell key={i} fill={RATING_COLORS[entry.rating]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Avg rating by role */}
              {drillDown.roleChart.length > 1 && (
                <div className="chart-card">
                  <div className="chart-title">Average rating by role</div>
                  <ResponsiveContainer width="100%" height={Math.max(160, drillDown.roleChart.length * 32)}>
                    <BarChart data={drillDown.roleChart} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                      <CartesianGrid stroke="#1a1715" strokeOpacity={0.1} horizontal={false} />
                      <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#4a423c' }} />
                      <YAxis dataKey="role" type="category" tick={{ fontSize: 11, fill: '#1a1715' }} width={100} />
                      <Tooltip content={<NewsprintTooltip />} cursor={{ fill: '#ebe1cf' }} />
                      <Bar dataKey="avg" fill="#1a1715" radius={[0,3,3,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Avg rating by seniority */}
              {drillDown.seniorityChart.length > 1 && (
                <div className="chart-card">
                  <div className="chart-title">Average rating by seniority</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={drillDown.seniorityChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid stroke="#1a1715" strokeOpacity={0.1} vertical={false} />
                      <XAxis dataKey="seniority" tick={{ fontSize: 11, fill: '#4a423c' }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#4a423c' }} />
                      <Tooltip content={<NewsprintTooltip />} cursor={{ fill: '#ebe1cf' }} />
                      <Bar dataKey="avg" fill="#588157" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Pace pie */}
              {drillDown.paceChart.some(p => p.count > 0) && (
                <div className="chart-card">
                  <div className="chart-title">Pace</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={drillDown.paceChart} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={70} label={({ label, count }) => count > 0 ? `${label}: ${count}` : ''}>
                        <Cell fill="#c8553d" />
                        <Cell fill="#588157" />
                        <Cell fill="#1e90ff" />
                      </Pie>
                      <Tooltip content={<NewsprintTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Takeaways with avg rating */}
              {drillDown.takeawayChart.length > 0 && (
                <div className="chart-card">
                  <div className="chart-title">Takeaways (count + avg rating of those who picked it)</div>
                  <ResponsiveContainer width="100%" height={Math.max(180, drillDown.takeawayChart.length * 40)}>
                    <BarChart data={drillDown.takeawayChart} layout="vertical" margin={{ top: 5, right: 30, left: 160, bottom: 5 }}>
                      <CartesianGrid stroke="#1a1715" strokeOpacity={0.1} horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#4a423c' }} />
                      <YAxis dataKey="takeaway" type="category" tick={{ fontSize: 10, fill: '#1a1715' }} width={160} />
                      <Tooltip content={<NewsprintTooltip />} cursor={{ fill: '#ebe1cf' }} />
                      <Bar dataKey="count" fill="#c8553d" radius={[0,3,3,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="legend-row" style={{ padding: '0 8px 8px' }}>
                    {drillDown.takeawayChart.slice(0, 4).map((t, i) => (
                      <span key={i} style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                        <strong>{t.takeaway}</strong>: ⌀{t.avg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {drillDown.comments.length > 0 && (
                <>
                  <span className="eyebrow">Open comments ({drillDown.comments.length})</span>
                  <div style={{ marginTop: 10 }}>
                    {drillDown.comments.map((c, i) => (
                      <div key={i} className="quote-card" style={{ borderLeftColor: RATING_COLORS[c.rating] }}>
                        <p style={{ fontSize: 15 }}>{c.comment}</p>
                        <p className="small" style={{ marginTop: 4 }}>· {c.role || 'Unknown'} · {c.seniority || ''} · rating {c.rating}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          );
        })()}
      </div>
      {finalSubs.length > 0 && (
        <div className="card anim" style={{ marginBottom: 24 }}>
          <span className="eyebrow">Wrap-up survey · selected quotes</span>
          <h3 className="serif" style={{ fontSize: 20, marginTop: 6, marginBottom: 16, fontWeight: 700 }}>The voice of the room</h3>
          <div style={{ marginBottom: 20 }}>
            <div className="stat"><span className="eyebrow">Overall</span><div className="stat-num">{overall.avgOverall}</div></div>
          </div>
          {finalSubs.filter(s => s.next_action).length > 0 && (
            <>
              <span className="eyebrow">What gets done Monday morning</span>
              <div style={{ marginTop: 10, marginBottom: 16 }}>
                {finalSubs.filter(s => s.next_action).map((s,i) => (
                  <div key={i} className="quote-card" style={{ borderLeftColor: 'var(--accent-2)' }}>
                    <p style={{ fontSize: 15 }}>{s.next_action}</p>
                    <p className="small">· {s.role || ''}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          {finalSubs.filter(s => s.improve).length > 0 && (
            <>
              <span className="eyebrow">What to improve next time</span>
              <div style={{ marginTop: 10 }}>
                {finalSubs.filter(s => s.improve).map((s,i) => (
                  <div key={i} className="quote-card" style={{ borderLeftColor: 'var(--gold)' }}>
                    <p style={{ fontSize: 15 }}>{s.improve}</p>
                    <p className="small">· {s.role || ''}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {projectSubs.length > 0 && (() => {
        const total = projectSubs.length;
        const avgRating = (projectSubs.reduce((a,s) => a + s.rating, 0) / total).toFixed(2);
        const stepKeys = ['step_trend', 'step_adapt', 'step_ai', 'step_kpi', 'step_integrate'];
        const stepLabels = ['Finding trend', 'Adapting to game', 'AI for art/copy', 'Defining KPIs', 'Integration'];
        const stepAvgs = stepKeys.map(k => {
          const vals = projectSubs.map(s => s[k]).filter(v => typeof v === 'number');
          return vals.length ? (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(2) : '–';
        });
        const progressCounts = {};
        for (const s of projectSubs) progressCounts[s.progress] = (progressCounts[s.progress] || 0) + 1;
        const helperCounts = {};
        for (const s of projectSubs) for (const h of (s.helpers || [])) helperCounts[h] = (helperCounts[h] || 0) + 1;
        const stuckCounts = {};
        for (const s of projectSubs) for (const h of (s.stuck || [])) stuckCounts[h] = (stuckCounts[h] || 0) + 1;
        const takeaways = projectSubs.filter(s => s.takeaway);

        return (
          <div className="card anim" style={{ marginBottom: 24 }}>
            <span className="eyebrow">Project session · deep dive</span>
            <h3 className="serif" style={{ fontSize: 20, marginTop: 6, marginBottom: 16, fontWeight: 700 }}>Did the lessons land?</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div className="stat"><span className="eyebrow">Responses</span><div className="stat-num">{total}</div></div>
              <div className="stat"><span className="eyebrow">Avg rating</span><div className="stat-num">{avgRating}</div></div>
            </div>

            <span className="eyebrow">Confidence per step (1–5)</span>
            <div style={{ marginTop: 10, marginBottom: 16 }}>
              {stepKeys.map((k, i) => {
                const avg = parseFloat(stepAvgs[i]);
                const pct = isNaN(avg) ? 0 : (avg / 5) * 100;
                const color = avg >= 4 ? 'var(--accent-2)' : avg >= 3 ? 'var(--ink)' : 'var(--accent)';
                return (
                  <div key={k} className="bar-row">
                    <span style={{ fontSize: 13 }}>{stepLabels[i]}</span>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
                    <span className="small">⌀{stepAvgs[i]}</span>
                  </div>
                );
              })}
            </div>

            <span className="eyebrow">How far people got</span>
            <div style={{ marginTop: 10, marginBottom: 16 }}>
              {Object.entries(progressCounts).sort((a,b) => b[1]-a[1]).map(([p, c]) => (
                <div key={p} className="bar-row">
                  <span style={{ fontSize: 12 }}>{p}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(c / total) * 100}%` }} /></div>
                  <span className="small">{c}</span>
                </div>
              ))}
            </div>

            <span className="eyebrow">Sessions that helped most</span>
            <div style={{ marginTop: 10, marginBottom: 16 }}>
              {Object.entries(helperCounts).sort((a,b) => b[1]-a[1]).map(([h, c]) => (
                <div key={h} className="bar-row">
                  <span style={{ fontSize: 12 }}>{h}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(c / total) * 100}%`, background: 'var(--accent-2)' }} /></div>
                  <span className="small">{c}</span>
                </div>
              ))}
            </div>

            {Object.keys(stuckCounts).length > 0 && (
              <>
                <span className="eyebrow">Where people got stuck</span>
                <div style={{ marginTop: 10, marginBottom: 16 }}>
                  {Object.entries(stuckCounts).sort((a,b) => b[1]-a[1]).map(([h, c]) => (
                    <div key={h} className="bar-row">
                      <span style={{ fontSize: 12 }}>{h}</span>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${(c / total) * 100}%`, background: 'var(--accent)' }} /></div>
                      <span className="small">{c}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {takeaways.length > 0 && (
              <>
                <span className="eyebrow">What people are taking back</span>
                <div style={{ marginTop: 10 }}>
                  {takeaways.map((s, i) => (
                    <div key={i} className="quote-card">
                      <p style={{ fontSize: 15 }}>{s.takeaway}</p>
                      <p className="small">· {s.role || 'Unknown'} · rating {s.rating}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })()}
    </>
  );
}
