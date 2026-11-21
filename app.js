(() => {
  'use strict';

  // Login sederhana sisi-browser: cocok untuk formalitas akses, bukan keamanan tingkat tinggi.
  let QUESTIONS = [];
  let VISUALS = {};
  let ANSWER_DATA = { metadata: {}, answers: [] };
  let ANSWERS = {};
  let SECTION_META = [
    { code: 'TWK', name: 'Tes Wawasan Kebangsaan (TWK)', start: 1, end: 30, count: 30, maxScore: 150, passingGrade: 65 },
    { code: 'TIU', name: 'Tes Intelegensi Umum (TIU)', start: 31, end: 65, count: 35, maxScore: 175, passingGrade: 80 },
    { code: 'TKP', name: 'Tes Karakteristik Pribadi (TKP)', start: 66, end: 110, count: 45, maxScore: 225, passingGrade: 166 }
  ];
  let TOTAL_MAX_SCORE = 550;
  let protectedDataLoaded = false;
  const ALLOWED_EMAILS = new Set([
    'arthacyber@gmail.com',
    'ummulkhatimah66@gmail.com',
    'sricandy72@gmail.com',
    'saya.vendiprasetyo08@gmail.com',
    'citrarahmasari01@gmail.com',
    'shintyachristi1996@gmail.com',
    'naro40984@gmail.com',
    'its05876@gmail.com',
    'kerjaandian70@gmail.com',
    'nfadilahrhmn25@gmail.com',
    'delunastuffofficial@gmail.com',
    'fujaaslamiyah@gmail.com',
    'rizkayato@gmail.com',
    'febrirahmana6@gmail.com',
    'teresiasisca95@gmail.com',
    'triagapinem@gmail.com',
    'idewaayumahayani15@gmail.com',
    'morthen07@gmail.com',
    'yuliambarwati32@gmail.com',
    'shefiyanialdhaputri.19@gmail.com',
    'pelajarperjuangang@gmail.com',
    'aldifa.taufiqurrahman@gmail.com',
    'apriliaanggun124@gmail.com',
    'khainisa721@gmail.com',
    'bilaoliviana@gmail.com',
    'lala31973@gmail.com',
    'rizokaydude@gmail.com',
    'ravenclawboty@gmail.com',
    'mariskaenii@gmail.com',
    'sendyd33@gmail.com'
  ]);
  const ACCESS_PASSWORD = 'luluscpns27';
  const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
  const TOTAL_SECONDS = 100 * 60;
  const SESSION_KEY = 'patungan-skd-session-v1';
  const ATTEMPT_KEY = 'patungan-skd-attempt-v2';
  const LEGACY_ATTEMPT_KEY = 'patungan-skd-attempt-v1';
  const HISTORY_KEY = 'patungan-skd-history-v1';
  const app = document.getElementById('app');
  let timerHandle = null;
  let toastHandle = null;
  let reviewMode = false;
  let reviewFilter = 'all';

  const readStore = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  };
  const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const removeStore = (key) => localStorage.removeItem(key);
  let session = readStore(SESSION_KEY);
  let attempt = null;

  function normalizeParticipant(name = '') {
    return String(name).trim().toLocaleLowerCase('id-ID').replace(/\s+/g, ' ');
  }

  function participantKey(name = session?.name || 'peserta') {
    return encodeURIComponent(normalizeParticipant(name) || 'peserta');
  }

  function participantAttemptKey(name = session?.name || 'peserta') {
    return `${ATTEMPT_KEY}:${participantKey(name)}`;
  }

  function loadParticipantAttempt(name) {
    let saved = readStore(participantAttemptKey(name));
    if (!saved) {
      const legacy = readStore(LEGACY_ATTEMPT_KEY);
      if (legacy) {
        saved = legacy;
        writeStore(participantAttemptKey(name), legacy);
        removeStore(LEGACY_ATTEMPT_KEY);
      }
    }
    return saved;
  }

  function getParticipantHistory(name = session?.name || 'peserta') {
    const all = readStore(HISTORY_KEY) || {};
    const history = all[participantKey(name)];
    if (!Array.isArray(history)) return [];
    let changed = false;
    const upgraded = history.map(record => {
      if (record && record.answers && record.score == null && Object.keys(ANSWERS).length === QUESTIONS.length) {
        const scored = calculateScores(record.answers);
        changed = true;
        return { ...record, score: scored.totalScore, scoreBreakdown: scored, scoringStatus: 'scored' };
      }
      return record;
    });
    if (changed) { all[participantKey(name)] = upgraded; writeStore(HISTORY_KEY, all); }
    return upgraded;
  }

  function saveParticipantHistory(history, name = session?.name || 'peserta') {
    const all = readStore(HISTORY_KEY) || {};
    all[participantKey(name)] = history;
    writeStore(HISTORY_KEY, all);
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function fmtTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
  }

  function getRemaining() {
    if (!attempt || !attempt.deadline) return TOTAL_SECONDS;
    return Math.max(0, Math.ceil((attempt.deadline - Date.now()) / 1000));
  }

  function saveAttempt() {
    if (attempt && session?.name) writeStore(participantAttemptKey(), attempt);
  }

  function stopTimer() {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
  }

  function showToast(message) {
    document.querySelector('.toast')?.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    clearTimeout(toastHandle);
    toastHandle = setTimeout(() => el.remove(), 2400);
  }

  function loadProtectedScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${new URL(src, document.baseURI).href}?v=4.1.0&t=${Date.now()}`;
      script.async = true;
      script.dataset.protectedData = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Gagal memuat data tryout.'));
      document.head.appendChild(script);
    });
  }

  async function loadProtectedData() {
    if (protectedDataLoaded && QUESTIONS.length === 110 && Object.keys(ANSWERS).length === 110) return;
    await Promise.all([loadProtectedScript('./data.js'), loadProtectedScript('./answer-data.js')]);
    QUESTIONS = window.SKD_QUESTIONS || [];
    VISUALS = window.SKD_VISUALS || {};
    ANSWER_DATA = window.SKD_ANSWER_DATA || { metadata: {}, answers: [] };
    ANSWERS = Object.fromEntries((ANSWER_DATA.answers || []).map(item => [item.id, item]));
    SECTION_META = ANSWER_DATA.metadata?.sections || SECTION_META;
    TOTAL_MAX_SCORE = ANSWER_DATA.metadata?.maxScore || 550;
    protectedDataLoaded = true;
    if (QUESTIONS.length !== 110 || Object.keys(ANSWERS).length !== 110) {
      throw new Error('Data tryout tidak lengkap.');
    }
  }

  function clearProtectedData() {
    QUESTIONS = [];
    VISUALS = {};
    ANSWER_DATA = { metadata: {}, answers: [] };
    ANSWERS = {};
    SECTION_META = [
      { code: 'TWK', name: 'Tes Wawasan Kebangsaan (TWK)', start: 1, end: 30, count: 30, maxScore: 150, passingGrade: 65 },
      { code: 'TIU', name: 'Tes Intelegensi Umum (TIU)', start: 31, end: 65, count: 35, maxScore: 175, passingGrade: 80 },
      { code: 'TKP', name: 'Tes Karakteristik Pribadi (TKP)', start: 66, end: 110, count: 45, maxScore: 225, passingGrade: 166 }
    ];
    TOTAL_MAX_SCORE = 550;
    protectedDataLoaded = false;
    delete window.SKD_QUESTIONS;
    delete window.SKD_VISUALS;
    delete window.SKD_ANSWER_DATA;
    document.querySelectorAll('script[data-protected-data="true"]').forEach(node => node.remove());
  }

  async function logout() {
    stopTimer();
    removeStore(SESSION_KEY);
    session = null;
    attempt = null;
    reviewMode = false;
    clearProtectedData();
    renderLogin();
  }

  function isValidSavedSession(saved) {
    if (!saved?.email || !ALLOWED_EMAILS.has(String(saved.email).trim().toLowerCase())) return false;
    const loggedInAt = Number(saved.loggedInAt || 0);
    return Number.isFinite(loggedInAt) && loggedInAt > 0 && Date.now() - loggedInAt < SESSION_DURATION_MS;
  }

  function renderLogin(error = '') {
    stopTimer();
    app.innerHTML = `
      <main class="auth-shell">
        <div class="auth-glow"></div>
        <section class="auth-card" aria-label="Login Patungan Bimbel SKD">
          <div class="auth-brand">
            <div class="brand-top">
              <div class="brand-logo"><img src="assets/logo.png" alt="Logo Patungan Bimbel SKD"></div>
              <div class="brand-eyebrow"><span class="dot"></span> Bonus SKD CPNS 2026 Batch 1</div>
            </div>
            <div class="brand-copy">
              <h1>Persiapkan diri.<br><span>Uji kemampuan.</span><br>Raih peluang terbaik.</h1>
              <p>Ruang latihan SKD CPNS dengan pengalaman tryout yang fokus, nyaman, dan terukur.</p>
            </div>
            <div class="brand-foot">PATUNGAN BIMBEL SKD · 2026</div>
          </div>
          <div class="auth-form-wrap">
            <div class="mini-brand">
              <img src="assets/logo.png" alt="Logo Patungan Bimbel SKD">
              <div><strong>PATUNGAN BIMBEL SKD</strong><small>Bonus SKD CPNS 2026 Batch 1</small></div>
            </div>
            <div class="bonus-chip"><span class="dot"></span> BONUS SKD CPNS 2026 BATCH 1</div>
            <h2>Selamat datang</h2>
            <p class="subline">Masuk ke ruang tryout dan mulai ukur kesiapanmu.</p>
            <form id="login-form" autocomplete="on">
              <label class="field">
                <span>Email</span>
                <input id="participant-email" name="email" type="email" placeholder="Masukkan email" maxlength="254" required autocomplete="username" inputmode="email" autocapitalize="none" spellcheck="false">
              </label>
              <label class="field">
                <span>Password</span>
                <input id="participant-password" name="password" type="password" placeholder="Masukkan password" required autocomplete="current-password">
              </label>
              <div class="auth-error" id="auth-error" role="alert">${escapeHTML(error)}</div>
              <button class="primary-btn auth-submit" type="submit">Masuk ke Tryout <span aria-hidden="true">→</span></button>
            </form>
            <p class="auth-note">Patungan Bimbel SKD · Tryout CPNS 2026</p>
          </div>
        </section>
      </main>`;

    document.getElementById('login-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const emailInput = document.getElementById('participant-email');
      const passInput = document.getElementById('participant-password');
      const email = emailInput.value.trim().toLowerCase();
      const password = passInput.value;
      const button = event.currentTarget.querySelector('button[type="submit"]');
      const errorEl = document.getElementById('auth-error');
      if (!email || !password) return;
      button.disabled = true;
      button.textContent = 'Memeriksa...';
      errorEl.textContent = '';
      try {
        if (!ALLOWED_EMAILS.has(email) || password !== ACCESS_PASSWORD) {
          throw new Error('invalid');
        }
        session = { name: email, email, loggedInAt: Date.now() };
        writeStore(SESSION_KEY, session);
        await loadProtectedData();
        attempt = loadParticipantAttempt(session.name);
        reviewMode = false;
        if (attempt?.finished) {
          archiveFinishedAttempt();
          saveAttempt();
          renderResult();
        } else renderWelcome();
      } catch (error) {
        errorEl.textContent = error.message === 'invalid'
          ? 'Email atau password tidak sesuai.'
          : 'Tidak dapat memuat tryout. Silakan muat ulang halaman.';
        button.disabled = false;
        button.innerHTML = 'Masuk ke Tryout <span aria-hidden="true">→</span>';
        passInput.focus();
      }
    });
  }

  function formatDate(timestamp) {
    if (!timestamp) return 'Tanggal tidak tersedia';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(timestamp));
  }

  function completionPercent(record) {
    return Math.round(((record?.answered || 0) / QUESTIONS.length) * 100);
  }

  function calculateScores(answers = {}) {
    const categories = {};
    SECTION_META.forEach(meta => {
      categories[meta.code] = {
        code: meta.code, name: meta.code, score: 0, maxScore: meta.maxScore,
        passingGrade: meta.passingGrade, count: meta.count, answered: 0,
        correct: 0, wrong: 0, blank: 0,
        pointDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    });
    QUESTIONS.forEach(question => {
      const meta = ANSWERS[question.id];
      const selected = answers[question.id] || answers[String(question.id)] || '';
      const bucket = categories[question.section];
      if (!bucket || !meta) return;
      if (!selected) { bucket.blank++; return; }
      bucket.answered++;
      if (question.section === 'TKP') {
        const points = Number(meta.scores?.[selected] || 0);
        bucket.score += points;
        if (points >= 1 && points <= 5) bucket.pointDistribution[points]++;
      } else if (selected === meta.correct) {
        bucket.score += 5;
        bucket.correct++;
      } else {
        bucket.wrong++;
      }
    });
    Object.values(categories).forEach(bucket => {
      bucket.pass = bucket.score >= bucket.passingGrade;
      bucket.gap = Math.max(0, bucket.passingGrade - bucket.score);
      bucket.percent = Math.round(bucket.score / bucket.maxScore * 100);
    });
    const objective = ['TWK', 'TIU'].map(code => categories[code]);
    const objectiveAnswered = objective.reduce((sum, item) => sum + item.answered, 0);
    const objectiveCorrect = objective.reduce((sum, item) => sum + item.correct, 0);
    const totalScore = Object.values(categories).reduce((sum, item) => sum + item.score, 0);
    return {
      totalScore, maxScore: TOTAL_MAX_SCORE,
      passed: Object.values(categories).every(item => item.pass),
      objectiveAccuracy: objectiveAnswered ? Math.round(objectiveCorrect / objectiveAnswered * 100) : 0,
      objectiveAnswered, objectiveCorrect,
      categories
    };
  }

  function getQuestionPoints(questionId, selected) {
    if (!selected) return 0;
    const question = QUESTIONS[questionId - 1];
    const meta = ANSWERS[questionId];
    if (!question || !meta) return 0;
    if (question.section === 'TKP') return Number(meta.scores?.[selected] || 0);
    return selected === meta.correct ? 5 : 0;
  }

  function getReviewQuestionIds(filter = reviewFilter) {
    return QUESTIONS.filter(question => {
      const selected = attempt?.answers?.[question.id] || '';
      const meta = ANSWERS[question.id];
      if (filter === 'blank') return !selected;
      if (filter === 'flagged') return (attempt?.flags || []).includes(question.id);
      if (filter === 'needs-work') {
        if (!selected || !meta) return false;
        return question.section === 'TKP'
          ? Number(meta.scores?.[selected] || 0) < 5
          : selected !== meta.correct;
      }
      return true;
    }).map(question => question.id);
  }

  function renderHistoryChart(history) {
    if (!history.length) {
      return `<div class="chart-empty"><div class="chart-empty-icon">↗</div><strong>Grafik perkembangan akan muncul di sini</strong><span>Selesaikan tryout pertama untuk mulai membangun riwayat nilai dan melihat progresmu.</span></div>`;
    }
    const points = history.slice(-8);
    const width = 640, height = 190, left = 38, right = 18, top = 18, bottom = 34;
    const chartW = width - left - right, chartH = height - top - bottom;
    const slot = chartW / points.length;
    const barW = Math.min(42, slot * .54);
    const grid = [0, 25, 50, 75, 100].map(v => {
      const y = top + chartH - (v / 100) * chartH;
      return `<line x1="${left}" y1="${y}" x2="${width-right}" y2="${y}" class="chart-gridline"/><text x="${left-8}" y="${y+3}" text-anchor="end" class="chart-axis">${Math.round(TOTAL_MAX_SCORE*v/100)}</text>`;
    }).join('');
    const bars = points.map((record, i) => {
      const value = Math.max(0, Math.min(TOTAL_MAX_SCORE, Number(record.score ?? 0)));
      const h = Math.max(3, (value / TOTAL_MAX_SCORE) * chartH);
      const x = left + i * slot + (slot - barW) / 2;
      const y = top + chartH - h;
      return `<g class="chart-bar-group"><rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="7" class="chart-bar"/><text x="${x + barW/2}" y="${Math.max(12,y-7)}" text-anchor="middle" class="chart-value">${value}</text><text x="${x + barW/2}" y="${height-10}" text-anchor="middle" class="chart-label">#${i + Math.max(1, history.length - points.length) + 1}</text></g>`;
    }).join('');
    return `<svg class="history-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafik perkembangan nilai tryout dari 0 sampai ${TOTAL_MAX_SCORE}">${grid}${bars}</svg>`;
  }

  function renderRecentHistory(history, limit = 4) {
    if (!history.length) {
      return `<div class="history-empty"><div class="history-empty-mark">✦</div><div><strong>Belum ada riwayat tryout</strong><p>Setelah tryout diselesaikan, nilai dan ringkasan pengerjaan akan tersimpan otomatis di perangkat ini.</p></div></div>`;
    }
    return history.slice(-limit).reverse().map((record, index) => {
      const number = history.length - index;
      const passed = record.scoreBreakdown?.passed;
      const scoreText = record.score == null ? `${completionPercent(record)}% terisi` : `Nilai ${record.score}/${TOTAL_MAX_SCORE}`;
      return `<article class="history-item">
        <div class="history-index">${String(number).padStart(2,'0')}</div>
        <div class="history-main"><strong>Tryout #${number}</strong><small>${formatDate(record.finishedAt)}</small></div>
        <div class="history-progress"><strong>${scoreText}</strong><span>${record.answered || 0}/${QUESTIONS.length} soal dijawab</span></div>
        <div class="history-duration"><small>${record.score == null ? 'STATUS' : 'PASSING GRADE'}</small><strong class="history-status ${record.score == null ? '' : (passed ? 'passed' : 'failed')}">${record.score == null ? '—' : (passed ? 'LULUS' : 'BELUM LULUS')}</strong></div>
        <div class="history-duration"><small>WAKTU</small><strong>${fmtTime(record.timeUsedSeconds || 0)}</strong></div>
      </article>`;
    }).join('');
  }

  function renderWelcome() {
    stopTimer();
    const activeAttempt = attempt && !attempt.finished;
    const history = getParticipantHistory();
    const latest = history[history.length - 1];
    const averageScore = history.length
      ? Math.round(history.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / history.length)
      : 0;
    const bestScore = history.length ? Math.max(...history.map(item => Number(item.score) || 0)) : 0;
    const latestScore = latest?.score == null ? '—' : `${latest.score}/${TOTAL_MAX_SCORE}`;
    app.innerHTML = `
      <main class="welcome-shell dashboard-shell">
        <div class="dashboard-orb dashboard-orb-one"></div><div class="dashboard-orb dashboard-orb-two"></div>
        <section class="welcome-card dashboard-card">
          <header class="welcome-top">
            <div class="brand-inline">
              <img src="assets/logo.png" alt="Logo Patungan Bimbel SKD">
              <div><strong>PATUNGAN BIMBEL SKD</strong><small>Ruang Tryout Digital · 2026</small></div>
            </div>
            <div class="dashboard-top-actions">
              <button class="soft-btn" id="history-btn">◷ Riwayat saya</button>
              <button class="text-btn" id="logout-btn">Keluar ↗</button>
            </div>
          </header>
          <div class="dashboard-hero">
            <div class="dashboard-hero-copy">
              <div class="eyebrow"><span class="live-dot"></span> BONUS SKD CPNS 2026 · BATCH 1</div>
              <h1>Selamat datang,<br><span>${escapeHTML(session?.name || 'Peserta')}.</span></h1>
              <p>Bangun kesiapanmu selangkah demi selangkah. Setiap sesi latihan tersimpan agar perkembanganmu bisa dipantau.</p>
              <button class="primary-btn dashboard-start" id="start-btn">${activeAttempt ? 'Lanjutkan Tryout' : 'Mulai Tryout'} <span aria-hidden="true">→</span></button>
              ${activeAttempt ? '<div class="resume-hint">Ada sesi yang belum selesai. Lanjutkan dari soal terakhir.</div>' : ''}
            </div>
            <div class="hero-emblem" aria-hidden="true"><div class="emblem-ring"><div class="emblem-core"><span>SKD</span><small>CPNS 2026</small></div></div><div class="emblem-spark spark-a">✦</div><div class="emblem-spark spark-b">✧</div></div>
            <div class="hero-footnote"><span>110 SOAL</span><i></i><span>100 MENIT</span><i></i><span>TWK · TIU · TKP</span></div>
          </div>
          <div class="dashboard-metrics">
            <article class="dashboard-metric"><div class="metric-icon metric-blue">▤</div><div><small>Total percobaan</small><strong>${history.length}</strong><span>Sesi tersimpan</span></div></article>
            <article class="dashboard-metric"><div class="metric-icon metric-gold">↗</div><div><small>Rata-rata nilai</small><strong>${history.length ? averageScore : '—'}</strong><span>Dari ${TOTAL_MAX_SCORE} poin</span></div></article>
            <article class="dashboard-metric"><div class="metric-icon metric-green">★</div><div><small>Nilai tertinggi</small><strong>${history.length ? bestScore : '—'}</strong><span>Dari ${TOTAL_MAX_SCORE} poin</span></div></article>
            <article class="dashboard-metric"><div class="metric-icon metric-navy">◎</div><div><small>Nilai terakhir</small><strong>${latestScore}</strong><span>${latest?.score == null ? 'Belum ada sesi' : (latest.scoreBreakdown?.passed ? 'Passing grade terpenuhi' : 'Perlu peningkatan')}</span></div></article>
          </div>
          <section class="dashboard-lower-grid">
            <article class="dashboard-panel progress-panel">
              <div class="panel-heading"><div><span class="panel-kicker">PERKEMBANGAN</span><h2>Progres latihanmu</h2></div><span class="panel-tag">${history.length} sesi</span></div>
              <p class="panel-description">Grafik menunjukkan perkembangan nilai total setiap percobaan, maksimal ${TOTAL_MAX_SCORE} poin.</p>
              <div class="history-chart">${renderHistoryChart(history)}</div>
              <div class="chart-legend"><span><i></i> Nilai total per percobaan</span><small>Skor TWK, TIU, dan bobot parsial TKP dihitung otomatis.</small></div>
            </article>
            <article class="dashboard-panel quick-panel">
              <div class="panel-heading"><div><span class="panel-kicker">RINGKASAN TRYOUT</span><h2>Informasi ujian</h2></div><span class="status-pill">● Siap</span></div>
              <div class="quick-info-row"><span>Jumlah soal</span><strong>110 butir</strong></div>
              <div class="quick-info-row"><span>Durasi</span><strong>100 menit</strong></div>
              <div class="quick-info-row"><span>Materi</span><strong>TWK · TIU · TKP</strong></div>
              <div class="quick-info-row"><span>Passing grade</span><strong>65 · 80 · 166</strong></div>
              <div class="quick-info-row"><span>Penyimpanan</span><strong>Perangkat ini</strong></div>
              <div class="local-note"><span>▣</span><p>Riwayat disimpan di browser perangkat ini dan dipisahkan berdasarkan email peserta.</p></div>
            </article>
          </section>
          <section class="dashboard-panel recent-panel">
            <div class="panel-heading"><div><span class="panel-kicker">TRACKING PERSONAL</span><h2>Riwayat pengerjaan</h2></div><button class="text-link" id="history-btn-bottom">Lihat semua <span>→</span></button></div>
            <div class="history-list">${renderRecentHistory(history)}</div>
          </section>
          <footer class="dashboard-footer"><span>© 2026 Patungan Bimbel SKD</span><span>Data pribadi tersimpan secara lokal pada perangkat peserta</span></footer>
        </section>
      </main>`;

    document.getElementById('logout-btn').addEventListener('click', () => { void logout(); });
    document.getElementById('history-btn')?.addEventListener('click', renderHistory);
    document.getElementById('history-btn-bottom')?.addEventListener('click', renderHistory);
    document.getElementById('start-btn').addEventListener('click', () => {
      if (!attempt || attempt.finished) {
        attempt = {
          current: 1,
          answers: {},
          flags: [],
          startedAt: Date.now(),
          deadline: Date.now() + TOTAL_SECONDS * 1000,
          finished: false,
          fontScale: 1
        };
        saveAttempt();
      }
      if (getRemaining() <= 0) {
        finishAttempt(true);
        return;
      }
      reviewMode = false;
      renderTest();
    });
  }

  function exportParticipantHistory() {
    const payload = {
      application: 'Patungan Bimbel SKD — Tryout CPNS 2026 Batch 1',
      participant: session?.name || 'Peserta',
      exportedAt: new Date().toISOString(),
      note: 'Riwayat dan nilai tersimpan lokal pada perangkat peserta. File ini dapat diimpor kembali pada browser yang sama atau perangkat lain.',
      attempts: getParticipantHistory()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `riwayat-tryout-skd-${participantKey().replace(/%/g,'')}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    showToast('Riwayat berhasil diekspor.');
  }

  function importParticipantHistory(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result || '{}'));
        if (!Array.isArray(payload.attempts)) throw new Error('Format riwayat tidak dikenali.');
        const current = getParticipantHistory();
        const byId = new Map(current.map(item => [item.id, item]));
        payload.attempts.forEach(record => {
          if (!record || typeof record.answers !== 'object') return;
          const scored = calculateScores(record.answers);
          const id = record.id || `import-${record.finishedAt || Date.now()}-${byId.size + 1}`;
          byId.set(id, { ...record, id, participant: session?.name || record.participant || 'Peserta', score: scored.totalScore, scoreBreakdown: scored, scoringStatus: 'scored' });
        });
        saveParticipantHistory([...byId.values()].sort((a,b) => (a.finishedAt || 0) - (b.finishedAt || 0)).slice(-100));
        renderHistory();
        showToast('Riwayat berhasil dipulihkan.');
      } catch (error) {
        showToast(error.message || 'File riwayat tidak dapat dibaca.');
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  function renderHistory() {
    stopTimer();
    const history = getParticipantHistory();
    const avg = history.length ? Math.round(history.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / history.length) : 0;
    app.innerHTML = `
      <main class="history-shell">
        <section class="history-page-card">
          <header class="history-page-header">
            <div class="brand-inline"><img src="assets/logo.png" alt="Logo Patungan Bimbel SKD"><div><strong>PATUNGAN BIMBEL SKD</strong><small>Riwayat peserta</small></div></div>
            <button class="soft-btn" id="back-dashboard">← Dashboard</button>
          </header>
          <div class="history-page-hero"><span class="panel-kicker">PERSONAL PERFORMANCE LOG</span><h1>Riwayat tryout</h1><p>Halo, ${escapeHTML(session?.name || 'Peserta')}. Semua sesi yang kamu selesaikan tersimpan di browser perangkat ini.</p></div>
          <div class="history-summary-grid">
            <div><small>Total sesi</small><strong>${history.length}</strong></div>
            <div><small>Rata-rata nilai</small><strong>${history.length ? avg : '—'}</strong></div>
            <div><small>Nilai terakhir</small><strong>${history.length && history[history.length-1].score != null ? history[history.length-1].score + '/' + TOTAL_MAX_SCORE : '—'}</strong></div>
          </div>
          <div class="history-page-toolbar"><div><h2>Semua percobaan</h2><p>Urutan terbaru ditampilkan lebih dahulu.</p></div><div class="history-toolbar-actions"><button class="secondary-btn" id="export-history">↓ Ekspor data</button><button class="secondary-btn" id="import-history">↑ Pulihkan data</button><input type="file" id="import-history-file" accept="application/json,.json" hidden><button class="secondary-btn danger-outline" id="clear-history" ${history.length ? '' : 'disabled'}>Hapus riwayat</button></div></div>
          <div class="history-list history-list-full">${history.length ? renderRecentHistory(history, history.length) : '<div class="history-empty"><div class="history-empty-mark">◷</div><div><strong>Belum ada riwayat</strong><p>Riwayat akan muncul setelah kamu menyelesaikan tryout pertama.</p></div></div>'}</div>
          <div class="history-page-note"><strong>Catatan penyimpanan:</strong> Data hanya tersedia pada browser dan perangkat ini. Gunakan tombol Ekspor Data untuk membuat salinan cadangan. Menghapus data situs atau browser dapat menghilangkan riwayat lokal.</div>
        </section>
      </main>`;
    document.getElementById('back-dashboard').addEventListener('click', renderWelcome);
    document.getElementById('export-history').addEventListener('click', exportParticipantHistory);
    document.getElementById('import-history')?.addEventListener('click', () => document.getElementById('import-history-file')?.click());
    document.getElementById('import-history-file')?.addEventListener('change', importParticipantHistory);
    document.getElementById('clear-history')?.addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true"><div class="modal-icon">!</div><h3>Hapus semua riwayat?</h3><p>Riwayat tryout untuk email ini akan dihapus dari perangkat. Sebaiknya ekspor data terlebih dahulu jika ingin menyimpannya.</p><div class="modal-actions"><button class="secondary-btn" id="cancel-clear">Batal</button><button class="primary-btn" id="confirm-clear">Hapus riwayat</button></div></div>`;
      document.body.appendChild(modal);
      modal.querySelector('#cancel-clear').addEventListener('click', () => modal.remove());
      modal.querySelector('#confirm-clear').addEventListener('click', () => {
        modal.remove();
        saveParticipantHistory([]);
        renderHistory();
        showToast('Riwayat lokal dihapus.');
      });
    });
  }

  function renderTable(table) {
    if (!table) return '';
    const headers = (table.headers || []).map(h => `<th>${escapeHTML(h)}</th>`).join('');
    const rows = (table.rows || []).map(row => `<tr>${row.map(cell => `<td>${escapeHTML(cell)}</td>`).join('')}</tr>`).join('');
    return `<div class="question-table-wrap"><table class="question-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function countAnswered() {
    return Object.keys(attempt?.answers || {}).filter(key => attempt.answers[key]).length;
  }

  function getSectionLabel(section) {
    if (section === 'TWK') return 'Tes Wawasan Kebangsaan (TWK)';
    if (section === 'TIU') return 'Tes Intelegensi Umum (TIU)';
    return 'Tes Karakteristik Pribadi (TKP)';
  }

  function questionStatus(number) {
    const selected = attempt.answers[number];
    const flagged = (attempt.flags || []).includes(number);
    if (!reviewMode) {
      if (number === attempt.current) return 'current';
      if (flagged) return 'flagged';
      if (selected) return 'answered';
      return '';
    }
    const question = QUESTIONS[number - 1];
    const meta = ANSWERS[number];
    let status = !selected ? 'review-blank' : (question.section === 'TKP'
      ? (Number(meta?.scores?.[selected] || 0) === 5 ? 'review-correct' : 'review-partial')
      : (selected === meta?.correct ? 'review-correct' : 'review-wrong'));
    if (flagged) status += ' flagged';
    if (number === attempt.current) status += ' current';
    return status;
  }

  function renderReviewPanel(question, selected, meta) {
    if (!reviewMode || !meta) return '';
    const isTKP = question.section === 'TKP';
    const points = getQuestionPoints(question.id, selected);
    const statusText = !selected ? 'Belum dijawab' : (isTKP ? `${points} dari 5 poin` : (selected === meta.correct ? 'Jawaban benar · 5 poin' : 'Jawaban belum tepat · 0 poin'));
    const answerLabel = selected || 'Tidak dijawab';
    const keyLabel = isTKP ? meta.ranking.map((letter, index) => `${letter} (${5-index})`).join(' · ') : meta.correct;
    const explanation = String(meta.explanation || 'Pembahasan belum tersedia.').split(/\n{2,}/).map(part => `<p>${escapeHTML(part)}</p>`).join('');
    const topic = meta.topic || meta.skill || question.section;
    return `<section class="review-answer-panel">
      <div class="review-answer-summary">
        <div class="review-answer-stat"><small>JAWABAN KAMU</small><strong>${escapeHTML(answerLabel)}</strong></div>
        <div class="review-answer-stat"><small>${isTKP ? 'URUTAN BOBOT TKP' : 'KUNCI JAWABAN'}</small><strong>${escapeHTML(keyLabel)}</strong></div>
        <div class="review-answer-stat review-answer-points"><small>HASIL SOAL</small><strong>${escapeHTML(statusText)}</strong></div>
      </div>
      ${isTKP ? `<div class="tkp-score-guide"><strong>Bobot setiap opsi</strong><span>${meta.ranking.map((letter,index)=>`<i>${letter}<b>${5-index} poin</b></i>`).join('')}</span></div>` : ''}
      <div class="explanation-heading"><span>✦</span><div><small>PEMBAHASAN RESMI</small><strong>${escapeHTML(topic)}</strong></div></div>
      <div class="explanation-copy">${explanation}</div>
    </section>`;
  }

  function renderTest() {
    stopTimer();
    const q = QUESTIONS[(attempt.current || 1) - 1];
    const answered = countAnswered();
    const flagged = attempt.flags?.length || 0;
    const remaining = getRemaining();
    const timerText = reviewMode ? 'SELESAI' : fmtTime(remaining);
    const progress = Math.round((answered / QUESTIONS.length) * 100);
    const selected = attempt.answers[q.id] || '';
    const isFlagged = (attempt.flags || []).includes(q.id);
    const answerMeta = ANSWERS[q.id];
    const optionsHTML = Object.entries(q.options).map(([letter, text]) => {
      const optionPoints = q.section === 'TKP' ? Number(answerMeta?.scores?.[letter] || 0) : null;
      const isCorrectObjective = reviewMode && q.section !== 'TKP' && letter === answerMeta?.correct;
      const isWrongSelection = reviewMode && q.section !== 'TKP' && selected === letter && selected !== answerMeta?.correct;
      const isBestTKP = reviewMode && q.section === 'TKP' && optionPoints === 5;
      const classes = ['option-btn', selected === letter ? 'selected' : '', isCorrectObjective || isBestTKP ? 'review-correct' : '', isWrongSelection ? 'review-wrong' : '', reviewMode && q.section === 'TKP' && selected === letter ? 'review-selected' : ''].filter(Boolean).join(' ');
      return `<button class="${classes}" data-choice="${letter}" ${reviewMode ? 'disabled' : ''}>
        <span class="option-letter">${letter}</span>
        <span class="option-copy">${q.visual ? '' : escapeHTML(text)}</span>
        ${reviewMode && q.section === 'TKP' ? `<span class="option-points">${optionPoints} poin</span>` : ''}
        ${reviewMode && isCorrectObjective ? '<span class="review-mark">KUNCI</span>' : ''}
      </button>`;
    }).join('');
    const visualHTML = q.visual && VISUALS[q.visual] ? `<div class="figure-wrap">${VISUALS[q.visual]}</div>` : '';
    const visibleIds = reviewMode ? getReviewQuestionIds() : QUESTIONS.map(item => item.id);
    const numbersHTML = visibleIds.map(id => `
      <button class="question-number ${questionStatus(id)}" data-goto="${id}" aria-label="Buka soal ${id}" title="Soal ${id}">${id}</button>`).join('');
    const reviewFiltersHTML = reviewMode ? `<div class="review-filters">
      ${[{id:'all',label:'Semua'},{id:'needs-work',label:'Salah / belum maksimal'},{id:'blank',label:'Kosong'},{id:'flagged',label:'Ragu'}].map(item => `<button class="review-filter ${reviewFilter===item.id?'active':''}" data-review-filter="${item.id}">${item.label} <b>${getReviewQuestionIds(item.id).length}</b></button>`).join('')}
    </div>` : '';
    const reviewPanelHTML = renderReviewPanel(q, selected, answerMeta);
    const fontScale = attempt.fontScale || 1;

    app.innerHTML = `
      <main class="app-shell">
        <header class="topbar">
          <div class="topbar-brand">
            <img src="assets/logo.png" alt="Logo Patungan Bimbel SKD">
            <div><strong>PATUNGAN BIMBEL SKD</strong><small>BONUS SKD CPNS 2026 BATCH 1</small></div>
          </div>
          <div class="topbar-right">
            <span class="user-pill">◉ ${escapeHTML(session?.name || 'Peserta')}</span>
            <button class="logout-btn" id="logout-btn">Keluar</button>
          </div>
        </header>
        <div class="test-wrap">
          <section class="test-overview">
            <div class="overview-line">
              <div class="overview-title"><small>TRYOUT</small><h1>PRETEST SKD CPNS 2026 BATCH 1</h1></div>
              <div class="timer-pill ${!reviewMode && remaining <= 600 ? 'warning' : ''}" id="timer-pill">◷ <span id="timer-value">${timerText}</span></div>
            </div>
            <div class="progress-line"><span>Soal ${q.id} / ${QUESTIONS.length}</span><span>${answered} dijawab · ${QUESTIONS.length - answered} kosong</span></div>
            <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
          </section>
          <div class="test-layout">
            <section class="question-card">
              ${reviewMode ? `<div class="review-banner review-banner-v3"><div><strong>Mode pembahasan & belajar</strong><br><span>Kunci jawaban, bobot TKP, dan penjelasan ditampilkan setelah sesi selesai.</span></div><button class="secondary-btn" id="back-result">Kembali ke evaluasi</button>${reviewFiltersHTML}</div>` : ''}
              <div class="question-head">
                <span class="section-chip"><span class="section-dot"></span>${getSectionLabel(q.section)}</span>
                <div class="question-head-tools">
                  ${!reviewMode ? `<div class="font-tool"><button id="font-down" aria-label="Perkecil teks">A−</button><button id="font-reset" aria-label="Ukuran normal">M</button><button id="font-up" aria-label="Perbesar teks">A+</button></div>` : ''}
                  <span>Soal ${q.id}</span>
                </div>
              </div>
              <div class="question-content">
                <div class="question-label">Pertanyaan</div>
                <div class="question-stem" style="font-size:${14 * fontScale}px"><span class="qnum">${q.id}.</span>${escapeHTML(q.stem)}</div>
                ${renderTable(q.table)}
                ${visualHTML}
                <div class="options-list">${optionsHTML}</div>
              </div>
              ${reviewPanelHTML}
              <div class="question-actions">
                ${reviewMode ? '' : `
                  <button class="action-btn danger" id="clear-answer">× Kosongkan</button>
                  <button class="action-btn ${isFlagged ? 'flagged' : ''}" id="flag-answer">⚑ ${isFlagged ? 'Hapus ragu' : 'Ragu-ragu'}</button>
                `}
                <span class="action-spacer"></span>
                <button class="action-btn" id="prev-btn" ${reviewMode && reviewFilter !== 'all' ? (visibleIds.indexOf(q.id) <= 0 ? 'disabled' : '') : (q.id === 1 ? 'disabled' : '')}>← Sebelumnya</button>
                <button class="primary-btn" id="next-btn" style="min-height:38px;padding:0 18px;font-size:11px">${!reviewMode && q.id === QUESTIONS.length ? 'Ke evaluasi' : 'Selanjutnya'} →</button>
              </div>
            </section>
            <aside class="sidebar-card">
              <button class="mobile-grid-toggle" id="mobile-grid-toggle"><span>Daftar nomor soal</span><span>${answered}/110 terjawab⌄</span></button>
              <div class="sidebar-content" id="sidebar-content">
                <div class="sidebar-head"><strong>Nomor Soal</strong><small>${flagged} ragu-ragu</small></div>
                <div class="sidebar-nav"><button id="side-prev" ${q.id === 1 ? 'disabled' : ''}>← Prev</button><button id="side-next">Next →</button></div>
                <div class="question-grid">${numbersHTML}</div>
                <div class="legend">
                  <span><i class="l-current"></i>Sedang dibuka</span>
                  <span><i class="l-answered"></i>Sudah dijawab</span>
                  <span><i class="l-flagged"></i>Ragu-ragu</span>
                  <span><i></i>Belum dijawab</span>
                </div>
                ${reviewMode ? `<div class="review-sidebar-note">${visibleIds.length} soal pada filter ini</div>` : `<button class="finish-btn" id="finish-btn">✓ Selesaikan Tryout</button>`}
                <div class="sidebar-info">
                  <div><small>SOAL</small><strong>110</strong></div>
                  <div><small>DIJAWAB</small><strong>${answered}</strong></div>
                  <div><small>KOSONG</small><strong>${QUESTIONS.length - answered}</strong></div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>`;

    bindTestEvents();
    if (!reviewMode) startTimerTicker();
  }

  function bindTestEvents() {
    document.querySelectorAll('[data-choice]').forEach(button => {
      button.addEventListener('click', () => {
        if (reviewMode) return;
        const qid = attempt.current;
        attempt.answers[qid] = button.dataset.choice;
        saveAttempt();
        renderTest();
      });
    });
    document.querySelectorAll('[data-goto]').forEach(button => {
      button.addEventListener('click', () => goToQuestion(Number(button.dataset.goto)));
    });
    const stepQuestion = (delta) => {
      if (reviewMode && reviewFilter !== 'all') {
        const ids = getReviewQuestionIds();
        const index = ids.indexOf(attempt.current);
        const nextIndex = Math.max(0, Math.min(ids.length - 1, index + delta));
        if (ids.length) goToQuestion(ids[nextIndex]);
        return;
      }
      const next = attempt.current + delta;
      if (next < 1 || next > QUESTIONS.length) { if (!reviewMode && delta > 0) showFinishModal(); else showToast('Tidak ada soal berikutnya pada daftar ini.'); return; }
      goToQuestion(next);
    };
    document.getElementById('prev-btn')?.addEventListener('click', () => stepQuestion(-1));
    document.getElementById('next-btn')?.addEventListener('click', () => {
      if (attempt.current === QUESTIONS.length && !reviewMode) showFinishModal();
      else stepQuestion(1);
    });
    document.getElementById('side-prev')?.addEventListener('click', () => stepQuestion(-1));
    document.getElementById('side-next')?.addEventListener('click', () => stepQuestion(1));
    document.querySelectorAll('[data-review-filter]').forEach(button => button.addEventListener('click', () => {
      reviewFilter = button.dataset.reviewFilter;
      const ids = getReviewQuestionIds();
      if (ids.length && !ids.includes(attempt.current)) attempt.current = ids[0];
      renderTest();
    }));
    document.getElementById('clear-answer')?.addEventListener('click', () => {
      delete attempt.answers[attempt.current];
      saveAttempt();
      renderTest();
      showToast('Jawaban dikosongkan.');
    });
    document.getElementById('flag-answer')?.addEventListener('click', () => {
      const flags = new Set(attempt.flags || []);
      if (flags.has(attempt.current)) flags.delete(attempt.current);
      else flags.add(attempt.current);
      attempt.flags = [...flags].sort((a,b) => a-b);
      saveAttempt();
      renderTest();
    });
    document.getElementById('finish-btn')?.addEventListener('click', showFinishModal);
    document.getElementById('font-down')?.addEventListener('click', () => changeFont(-0.05));
    document.getElementById('font-up')?.addEventListener('click', () => changeFont(0.05));
    document.getElementById('font-reset')?.addEventListener('click', () => { attempt.fontScale = 1; saveAttempt(); renderTest(); });
    document.getElementById('logout-btn')?.addEventListener('click', () => { void logout(); });
    document.getElementById('mobile-grid-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar-content')?.classList.toggle('collapsed');
    });
    document.getElementById('back-result')?.addEventListener('click', () => { reviewMode = false; renderResult(); });
  }

  function changeFont(delta) {
    attempt.fontScale = Math.min(1.25, Math.max(.9, (attempt.fontScale || 1) + delta));
    saveAttempt();
    renderTest();
  }

  function goToQuestion(number) {
    attempt.current = Math.max(1, Math.min(QUESTIONS.length, number));
    saveAttempt();
    renderTest();
    if (window.innerWidth <= 700) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startTimerTicker() {
    const update = () => {
      const remaining = getRemaining();
      const timerValue = document.getElementById('timer-value');
      const timerPill = document.getElementById('timer-pill');
      if (timerValue) timerValue.textContent = fmtTime(remaining);
      if (timerPill) timerPill.classList.toggle('warning', remaining <= 600);
      if (remaining <= 0) {
        stopTimer();
        finishAttempt(true);
      }
    };
    update();
    timerHandle = setInterval(update, 1000);
  }

  function showFinishModal() {
    const unanswered = QUESTIONS.length - countAnswered();
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="finish-title">
        <div class="modal-icon">✓</div>
        <h3 id="finish-title">Selesaikan tryout?</h3>
        <p>${unanswered > 0 ? `Masih ada <strong>${unanswered} soal</strong> yang belum dijawab. ` : 'Semua soal sudah memiliki jawaban. '}Setelah dikumpulkan, sesi akan ditutup dan statistik pengerjaan akan ditampilkan.</p>
        <div class="modal-actions">
          <button class="secondary-btn" id="cancel-finish">Kembali</button>
          <button class="primary-btn" id="confirm-finish" style="min-height:43px">Ya, selesaikan</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#cancel-finish').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    modal.querySelector('#confirm-finish').addEventListener('click', () => { modal.remove(); finishAttempt(false); });
  }

  function archiveFinishedAttempt() {
    if (!attempt || attempt.historyId) return;
    const history = getParticipantHistory();
    const record = {
      id: `tryout-${attempt.finishedAt || Date.now()}-${history.length + 1}`,
      participant: session?.name || 'Peserta',
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt || Date.now(),
      timeUsedSeconds: attempt.timeUsedSeconds || 0,
      answered: countAnswered(),
      unanswered: QUESTIONS.length - countAnswered(),
      flagged: attempt.flags?.length || 0,
      autoSubmitted: !!attempt.autoSubmitted,
      answers: { ...(attempt.answers || {}) },
      sections: sectionStats().map(section => ({ code: section.code, total: section.total, answered: section.answered, blank: section.blank })),
      score: calculateScores(attempt.answers || {}).totalScore,
      scoreBreakdown: calculateScores(attempt.answers || {}),
      scoringStatus: 'scored'
    };
    history.push(record);
    saveParticipantHistory(history.slice(-100));
    attempt.historyId = record.id;
  }

  function finishAttempt(auto = false) {
    if (!attempt || attempt.finished) return;
    document.querySelector('.modal-backdrop')?.remove();
    stopTimer();
    attempt.finished = true;
    attempt.finishedAt = Date.now();
    attempt.timeUsedSeconds = Math.min(TOTAL_SECONDS, Math.max(0, Math.floor((attempt.finishedAt - attempt.startedAt) / 1000)));
    attempt.autoSubmitted = auto;
    archiveFinishedAttempt();
    saveAttempt();
    reviewMode = false;
    renderResult();
  }

  function sectionStats() {
    const sections = SECTION_META;
    return sections.map(section => {
      const total = section.count || (section.end - section.start + 1);
      let answered = 0;
      for (let n = section.start; n <= section.end; n++) if (attempt.answers[n]) answered++;
      return { ...section, total, answered, blank: total - answered };
    });
  }

  function renderSkillAnalysis(answers) {
    const groups = new Map();
    QUESTIONS.forEach(question => {
      const meta = ANSWERS[question.id] || {};
      const label = meta.skill || meta.topic || question.section;
      if (!groups.has(label)) groups.set(label, { label, section: question.section, score: 0, max: 0, total: 0, answered: 0 });
      const group = groups.get(label);
      group.total++;
      group.max += 5;
      const selected = answers[question.id] || '';
      if (selected) group.answered++;
      group.score += getQuestionPoints(question.id, selected);
    });
    return [...groups.values()].map(group => ({ ...group, percent: Math.round(group.score / group.max * 100) }))
      .sort((a,b) => a.percent - b.percent || a.label.localeCompare(b.label, 'id'));
  }

  function renderResult() {
    stopTimer();
    const answered = countAnswered();
    const unanswered = QUESTIONS.length - answered;
    const flagged = attempt.flags?.length || 0;
    const used = attempt.timeUsedSeconds ?? Math.min(TOTAL_SECONDS, Math.floor((Date.now() - attempt.startedAt) / 1000));
    const result = calculateScores(attempt.answers || {});
    const categories = SECTION_META.map(meta => result.categories[meta.code]);
    const categoryHTML = categories.map(category => {
      const status = category.pass ? 'LULUS' : 'BELUM LULUS';
      const gapText = category.pass ? `Melewati ambang ${category.score - category.passingGrade} poin` : `Kurang ${category.gap} poin ke passing grade`;
      const detail = category.code === 'TKP'
        ? `Bobot 5 poin: ${category.pointDistribution[5]} · 4 poin: ${category.pointDistribution[4]} · 3 poin: ${category.pointDistribution[3]} · 2 poin: ${category.pointDistribution[2]} · 1 poin: ${category.pointDistribution[1]} · Kosong: ${category.blank}`
        : `Benar ${category.correct} · Salah ${category.wrong} · Kosong ${category.blank}`;
      return `<article class="score-category-card ${category.pass ? 'is-passed' : 'is-failed'}">
        <div class="score-category-head"><div><small>${category.count} SOAL</small><h3>${category.code}</h3></div><span class="score-status">${status}</span></div>
        <div class="score-number"><strong>${category.score}</strong><span>/ ${category.maxScore}</span></div>
        <div class="score-track"><i style="width:${category.percent}%"></i></div>
        <div class="score-passline"><span>Passing grade ${category.passingGrade}</span><b>${gapText}</b></div>
        <p>${detail}</p>
      </article>`;
    }).join('');
    const skillRows = renderSkillAnalysis(attempt.answers || {}).slice(0, 6).map(group => `
      <div class="skill-row"><div class="skill-row-title"><strong>${escapeHTML(group.label)}</strong><span>${group.score}/${group.max} poin · ${group.total} soal</span></div><div class="skill-track"><i style="width:${group.percent}%"></i></div><b>${group.percent}%</b></div>`).join('');
    const failed = categories.filter(category => !category.pass);
    const recommendations = failed.length
      ? `<div class="result-insight warning"><strong>Prioritas peningkatan</strong><p>${failed.map(category => `${category.code} masih kurang ${category.gap} poin dari passing grade ${category.passingGrade}`).join('; ')}. Mulai dari kategori dengan selisih terbesar, lalu tinjau soal yang salah atau belum maksimal.</p></div>`
      : `<div class="result-insight success"><strong>Semua passing grade terpenuhi.</strong><p>Nilai TWK, TIU, dan TKP telah mencapai ambang masing-masing. Pertahankan konsistensi dan gunakan pembahasan untuk memperkuat konsep.</p></div>`;
    const accuracyLabel = result.objectiveAnswered ? `${result.objectiveAccuracy}%` : '—';
    app.innerHTML = `
      <main class="result-shell result-shell-v3">
        <section class="result-card result-card-v3">
          <div class="result-banner ${result.passed ? 'result-banner-passed' : 'result-banner-failed'}">
            <small>PATUNGAN BIMBEL SKD · BONUS BATCH 1</small>
            <div class="result-banner-row"><div><span class="result-verdict">${result.passed ? '✓ LULUS PASSING GRADE' : '! BELUM LULUS PASSING GRADE'}</span><h1>Tryout selesai.</h1><p>Terima kasih, ${escapeHTML(session?.name || 'Peserta')}. Berikut evaluasi PRETEST SKD CPNS 2026 BATCH 1.</p></div><div class="total-score-ring"><strong>${result.totalScore}</strong><span>DARI ${TOTAL_MAX_SCORE}</span></div></div>
          </div>
          <div class="result-body result-body-v3">
            <div class="result-metrics result-metrics-v3">
              <div class="result-metric"><small>TOTAL NILAI</small><strong>${result.totalScore}<span> / ${TOTAL_MAX_SCORE}</span></strong><em>${Math.round(result.totalScore / TOTAL_MAX_SCORE * 100)}% dari nilai maksimal</em></div>
              <div class="result-metric"><small>SOAL DIJAWAB</small><strong>${answered}<span> / 110</span></strong><em>${unanswered ? `${unanswered} soal belum dijawab` : 'Seluruh soal terjawab'}</em></div>
              <div class="result-metric"><small>AKURASI OBJEKTIF</small><strong>${accuracyLabel}</strong><em>${result.objectiveCorrect} benar dari ${result.objectiveAnswered} dijawab</em></div>
              <div class="result-metric"><small>WAKTU PENGERJAAN</small><strong>${fmtTime(used)}</strong><em>${attempt.autoSubmitted ? 'Dikirim otomatis saat waktu habis' : 'Sesi diselesaikan peserta'}</em></div>
            </div>
            ${recommendations}
            <section class="result-section score-section-v3"><div class="result-section-heading"><div><small>EVALUASI PER KATEGORI</small><h2>Capaian passing grade</h2></div><span>Skor maksimal 550</span></div><div class="score-category-grid">${categoryHTML}</div></section>
            <section class="result-section skill-analysis-section"><div class="result-section-heading"><div><small>ANALISIS KOMPETENSI</small><h2>Area yang perlu diperkuat</h2></div><span>Diurutkan dari capaian terendah</span></div><div class="skill-analysis-list">${skillRows}</div><p class="analysis-footnote">Analisis dihitung dari skor setiap kelompok materi pada paket ini. Untuk TKP, nilai parsial 1–5 poin tetap diperhitungkan.</p></section>
            <section class="result-section completion-section"><h2>Ringkasan pengerjaan</h2><div class="completion-stats"><span><i class="dot-correct"></i> Dijawab ${answered}</span><span><i class="dot-blank"></i> Kosong ${unanswered}</span><span><i class="dot-flagged"></i> Ditandai ragu ${flagged}</span></div></section>
            <div class="result-note"><strong>Riwayat tersimpan otomatis.</strong> Nilai, jawaban, waktu, dan analisis sesi ini tersimpan pada browser perangkat peserta. Gunakan fitur ekspor/pulihkan data untuk memindahkan riwayat ke perangkat lain.</div>
            <div class="result-actions result-actions-v3">
              <button class="primary-btn" id="review-btn">✦ Lihat kunci & pembahasan</button>
              <button class="secondary-btn" id="print-result-btn">Cetak / Simpan PDF</button>
              <button class="secondary-btn" id="history-result-btn">Riwayat nilai</button>
              <button class="secondary-btn" id="restart-btn">Ulangi tryout</button>
              <button class="secondary-btn" id="logout-btn">Keluar</button>
            </div>
          </div>
        </section>
      </main>`;
    document.getElementById('review-btn').addEventListener('click', () => {
      reviewMode = true;
      reviewFilter = 'all';
      attempt.current = 1;
      saveAttempt();
      renderTest();
    });
    document.getElementById('print-result-btn')?.addEventListener('click', () => window.print());
    document.getElementById('history-result-btn')?.addEventListener('click', renderHistory);
    document.getElementById('restart-btn').addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.innerHTML = `<div class="modal-card"><div class="modal-icon">↻</div><h3>Mulai ulang tryout?</h3><p>Jawaban dari sesi sebelumnya akan tetap tersimpan di riwayat. Sesi baru akan dimulai dari soal pertama.</p><div class="modal-actions"><button class="secondary-btn" id="cancel-restart">Batal</button><button class="primary-btn" id="confirm-restart" style="min-height:43px">Mulai ulang</button></div></div>`;
      document.body.appendChild(modal);
      modal.querySelector('#cancel-restart').addEventListener('click', () => modal.remove());
      modal.querySelector('#confirm-restart').addEventListener('click', () => {
        modal.remove(); attempt = null; removeStore(participantAttemptKey()); reviewMode = false; reviewFilter = 'all'; renderWelcome();
      });
    });
    document.getElementById('logout-btn').addEventListener('click', () => { void logout(); });
  }

  function init() {
    if (!Array.isArray(QUESTIONS) || QUESTIONS.length !== 110 || Object.keys(ANSWERS).length !== 110) {
      app.innerHTML = '<div style="padding:30px;font-family:sans-serif">Data tryout belum dapat dimuat. Silakan muat ulang halaman.</div>';
      return;
    }
    if (session?.name) attempt = loadParticipantAttempt(session.name);
    if (attempt && !attempt.finished && getRemaining() <= 0) {
      finishAttempt(true);
      return;
    }
    if (!session) renderLogin();
    else if (attempt?.finished) {
      archiveFinishedAttempt();
      saveAttempt();
      renderResult();
    } else renderWelcome();
  }

  async function boot() {
    const savedSession = readStore(SESSION_KEY);
    if (!isValidSavedSession(savedSession)) {
      removeStore(SESSION_KEY);
      session = null;
      renderLogin();
      return;
    }
    try {
      session = { name: savedSession.email, email: savedSession.email, loggedInAt: savedSession.loggedInAt };
      await loadProtectedData();
      init();
    } catch (_) {
      removeStore(SESSION_KEY);
      session = null;
      attempt = null;
      clearProtectedData();
      renderLogin('Data tryout belum dapat dimuat. Silakan muat ulang halaman.');
    }
  }

  window.addEventListener('pagehide', () => { if (attempt && !attempt.finished) saveAttempt(); });
  void boot();
})();
