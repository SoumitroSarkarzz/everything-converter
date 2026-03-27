/* ====== EVERYTHING CONVERTER — SCRIPT.JS (IMPROVED) ====== */

// ====== STORAGE HELPERS ======
const Store = {
    get(key, fallback = null) {
        try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
    },
    remove(key) { try { localStorage.removeItem(key); } catch {} }
};

// ====== INTRO ANIMATION ======
const introOverlay = document.getElementById('intro-overlay');
function startIntroAnimation() {
    if (sessionStorage.getItem('hasSeenIntro')) { introOverlay.style.display = 'none'; return; }
    introOverlay.style.display = 'flex';
    setTimeout(hideIntroAnimation, 3500);
}
function hideIntroAnimation() {
    if (introOverlay.classList.contains('exit')) return;
    introOverlay.classList.add('exit');
    sessionStorage.setItem('hasSeenIntro', '1');
    setTimeout(() => { introOverlay.style.display = 'none'; introOverlay.classList.remove('exit'); }, 700);
}
introOverlay.addEventListener('click', hideIntroAnimation);
document.addEventListener('keydown', e => {
    if (introOverlay.style.display === 'flex' && !introOverlay.classList.contains('exit')) hideIntroAnimation();
});

// ====== DOM REFS ======
const sidebar       = document.getElementById('sidebar');
const sidebarOverlay= document.getElementById('sidebar-overlay');
const mobileToggle  = document.getElementById('mobile-toggle');
const navBtns       = document.querySelectorAll('.nav-btn');
const views         = document.querySelectorAll('.view');
const searchInput   = document.getElementById('global-search');
const searchResults = document.getElementById('search-results');
const searchResultsList = document.getElementById('search-results-list');
const searchResultsFooter = document.getElementById('search-results-footer');
const recentSearchesEl  = document.getElementById('recent-searches');
const recentSearchesList= document.getElementById('recent-searches-list');
const clearRecentBtn    = document.getElementById('clear-recent-searches');
const toast         = document.getElementById('toast');
const historyBtn    = document.getElementById('history-btn');
const favoritesBtn  = document.getElementById('favorites-btn');
const historyListEl = document.getElementById('history-list');
const emptyHistoryEl= document.getElementById('empty-history');
const favoritesListEl   = document.getElementById('favorites-list');
const emptyFavoritesEl  = document.getElementById('empty-favorites');
const clearHistoryBtn   = document.getElementById('clear-history-btn');

// ====== TOAST ======
let toastTimer;
function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ====== CLIPBOARD HELPER ======
function copyText(text) {
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else { fallbackCopy(text); }
}
function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
}

// ====== SIDEBAR MOBILE ======
function openSidebar() {
    sidebar.classList.add('open');
    mobileToggle.classList.add('open');
    mobileToggle.setAttribute('aria-expanded', 'true');
    sidebarOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
}
function closeSidebar() {
    sidebar.classList.remove('open');
    mobileToggle.classList.remove('open');
    mobileToggle.setAttribute('aria-expanded', 'false');
    sidebarOverlay.classList.remove('visible');
    document.body.style.overflow = '';
}
mobileToggle.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
});
sidebarOverlay.addEventListener('click', closeSidebar);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });

// ====== NAVIGATION ======
function switchToView(viewName) {
    navBtns.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-target') === viewName));
    views.forEach(v => v.classList.toggle('active', v.id === `view-${viewName}`));
    if (viewName === 'history') loadHistory();
    if (viewName === 'favorites') loadFavorites();
    if (window.innerWidth <= 900) closeSidebar();
    searchInput.value = '';
    hideSearchDropdowns();
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchToView(btn.getAttribute('data-target')));
});
historyBtn.addEventListener('click', () => switchToView('history'));
favoritesBtn.addEventListener('click', () => switchToView('favorites'));

// ====== THEME ======
const themeButtons  = document.querySelectorAll('.theme-btn');
const htmlEl = document.documentElement;
const savedTheme = Store.get('selectedTheme') || 'cyber-neon';
htmlEl.setAttribute('data-theme', savedTheme);
document.querySelector(`[data-theme="${savedTheme}"]`)?.classList.add('active');

themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');
        themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        htmlEl.setAttribute('data-theme', theme);
        Store.set('selectedTheme', theme);
        showToast(`Theme: ${btn.getAttribute('title')}`);
    });
});

// ====== SEARCH INDEX ======
const searchIndex = [
    { title:'Length Converter', category:'Basic Math', keywords:['length','distance','meter','km','miles','feet','inches'], view:'basic', id:'length' },
    { title:'Weight Converter', category:'Basic Math', keywords:['weight','mass','kg','pounds','grams'], view:'basic', id:'weight' },
    { title:'Temperature Converter', category:'Basic Math', keywords:['temperature','celsius','fahrenheit','kelvin'], view:'basic', id:'temp' },
    { title:'Volume Converter', category:'Basic Math', keywords:['volume','liter','gallon','ml'], view:'basic', id:'volume' },
    { title:'Area Converter', category:'Basic Math', keywords:['area','square','meter','feet','acre'], view:'basic', id:'area' },
    { title:'Speed Converter', category:'Basic Math', keywords:['speed','velocity','kmh','mph','knots'], view:'basic', id:'speed' },
    { title:'Time Converter', category:'Basic Math', keywords:['time','seconds','minutes','hours','days'], view:'basic', id:'time' },
    { title:'Data Storage Converter', category:'Digital & Data', keywords:['data','storage','gb','mb','kb','bytes','tb'], view:'digital', id:'storage' },
    { title:'Data Transfer Speed', category:'Digital & Data', keywords:['transfer','speed','mbps','gbps','bandwidth'], view:'digital', id:'data_speed' },
    { title:'Password Generator', category:'Extra Tools', keywords:['password','generate','secure','random'], view:'extra', id:'password' },
    { title:'Color Converter', category:'Extra Tools', keywords:['color','hex','rgb','hsl'], view:'extra', id:'color-converter' },
    { title:'Base64 Encoder/Decoder', category:'Extra Tools', keywords:['base64','encode','decode'], view:'extra', id:'base64-encode' },
    { title:'Video Compressor', category:'Extra Tools', keywords:['video','compress','mp4','size'], view:'extra', id:'video-compression' },
    { title:'Image Converter', category:'Extra Tools', keywords:['image','convert','png','jpeg','webp'], view:'extra', id:'image-converter' },
    { title:'Multi-Convert Mode', category:'Extra Tools', keywords:['multi','convert','batch','multiple'], view:'extra', id:'multi-convert' },
    { title:'Currency Converter', category:'Currency', keywords:['currency','money','dollar','euro','usd','inr','eur'], view:'currency', id:'currency' },
    { title:'Percentage Calculator', category:'Student Tools', keywords:['percentage','percent','calc'], view:'student', id:'percentage' },
    { title:'Fraction Converter', category:'Student Tools', keywords:['fraction','decimal'], view:'student', id:'fraction' },
    { title:'CGPA to Percentage', category:'Student Tools', keywords:['cgpa','percentage','gpa'], view:'student', id:'cgpa' },
    { title:'Age Calculator', category:'Student Tools', keywords:['age','birthday','calculate'], view:'student', id:'age-calculator' },
    { title:'Tip Calculator', category:'Student Tools', keywords:['tip','calculator','bill','split'], view:'student', id:'tip-calculator' },
    { title:'Time Zone Converter', category:'Student Tools', keywords:['timezone','time','zone','world','clock'], view:'student', id:'timezone-converter' },
    { title:'Date Difference', category:'Student Tools', keywords:['date','difference','days','weeks'], view:'student', id:'date-difference' },
    { title:'Scientific Calculator', category:'Student Tools', keywords:['scientific','calculator','sin','cos','log'], view:'student', id:'scientific-calculator' },
    { title:'BMI Calculator', category:'Health', keywords:['bmi','body','mass','index','weight'], view:'health', id:'bmi-calculator' },
    { title:'Heart Rate Zones', category:'Health', keywords:['heart','rate','zones','fitness','cardio'], view:'health', id:'heart-rate-zones' },
    { title:'Daily Calorie Needs', category:'Health', keywords:['calorie','daily','needs','diet','bmr'], view:'health', id:'calorie-calculator' },
];

// ====== RECENT SEARCHES ======
function getRecentSearches() { return Store.get('recentSearches', []); }
function saveRecentSearch(query) {
    if (!query || query.length < 2) return;
    let recent = getRecentSearches();
    recent = [query, ...recent.filter(q => q.toLowerCase() !== query.toLowerCase())].slice(0, 8);
    Store.set('recentSearches', recent);
}
function renderRecentSearches() {
    const recent = getRecentSearches();
    if (!recent.length) { recentSearchesEl.style.display = 'none'; return; }
    recentSearchesList.innerHTML = recent.map(q => `
        <div class="recent-search-item" data-query="${encodeURIComponent(q)}">
            <svg class="search-result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <div class="search-result-content">
                <div class="search-result-title">${escapeHtml(q)}</div>
            </div>
        </div>`).join('');
    recentSearchesList.querySelectorAll('.recent-search-item').forEach(el => {
        el.addEventListener('click', () => {
            const q = decodeURIComponent(el.getAttribute('data-query'));
            searchInput.value = q;
            performSearch(q);
            hideDropdown(recentSearchesEl);
        });
    });
    recentSearchesEl.style.display = 'block';
}
clearRecentBtn?.addEventListener('click', () => { Store.remove('recentSearches'); recentSearchesEl.style.display = 'none'; });

function escapeHtml(str) { return str.replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }

// ====== INTELLIGENT SEARCH ======
let searchTimeout, selectedResultIndex = -1, searchResultsData = [];

function fuzzyScore(query, text) {
    query = query.toLowerCase(); text = text.toLowerCase();
    if (text.includes(query)) return query.length * 4;
    let s = 0, qi = 0;
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
        if (query[qi] === text[ti]) { s += 2; qi++; } else { s -= 0.5; }
    }
    return s;
}
function highlightText(text, query) {
    if (!query) return escapeHtml(text);
    const esc = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escapeHtml(text).replace(new RegExp(`(${esc})`, 'gi'), '<span class="search-highlight">$1</span>');
}

function performSearch(query) {
    query = query.trim();
    if (!query) { hideSearchDropdowns(); showRecentIfEmpty(); return; }
    const results = searchIndex.map(item => {
        let score = fuzzyScore(query, item.title) * 3;
        score += fuzzyScore(query, item.category);
        item.keywords.forEach(kw => score += fuzzyScore(query, kw) * 1.5);
        return { ...item, score };
    }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);
    searchResultsData = results;
    renderSearchResults(results, query);
}
function renderSearchResults(results, query) {
    if (!results.length) {
        searchResultsList.innerHTML = '';
        searchResultsFooter.style.display = 'block';
    } else {
        searchResultsFooter.style.display = 'none';
        searchResultsList.innerHTML = results.slice(0, 10).map((r, i) => `
            <div class="search-result-item" data-index="${i}" data-view="${r.view}" data-id="${r.id}">
                <svg class="search-result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <div class="search-result-content">
                    <div class="search-result-title">${highlightText(r.title, query)}</div>
                    <div class="search-result-category">${escapeHtml(r.category)}</div>
                </div>
            </div>`).join('');
        searchResultsList.querySelectorAll('.search-result-item').forEach(el => {
            el.addEventListener('click', () => {
                const view = el.getAttribute('data-view');
                const id   = el.getAttribute('data-id');
                saveRecentSearch(searchInput.value.trim());
                switchToView(view);
                hideSearchDropdowns();
                searchInput.value = '';
                setTimeout(() => scrollToConverter(id), 150);
            });
        });
    }
    hideDropdown(recentSearchesEl);
    showDropdown(searchResults);
    selectedResultIndex = -1;
}
function showDropdown(el) { el.style.display = 'block'; }
function hideDropdown(el) { el.style.display = 'none'; }
function hideSearchDropdowns() { hideDropdown(searchResults); hideDropdown(recentSearchesEl); selectedResultIndex = -1; }
function showRecentIfEmpty() {
    const recent = getRecentSearches();
    if (recent.length) { renderRecentSearches(); } else { hideDropdown(recentSearchesEl); }
}

searchInput.addEventListener('input', e => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const q = e.target.value.trim();
        if (q.length > 0) performSearch(q);
        else showRecentIfEmpty();
    }, 130);
});
searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) performSearch(searchInput.value.trim());
    else showRecentIfEmpty();
});
searchInput.addEventListener('keydown', e => {
    const items = searchResultsList.querySelectorAll('.search-result-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedResultIndex = Math.min(selectedResultIndex + 1, items.length - 1); updateSelectedResult(items); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selectedResultIndex = Math.max(selectedResultIndex - 1, -1); updateSelectedResult(items); }
    else if (e.key === 'Enter' && selectedResultIndex >= 0) { e.preventDefault(); items[selectedResultIndex].click(); }
    else if (e.key === 'Escape') { hideSearchDropdowns(); searchInput.blur(); }
});
function updateSelectedResult(items) {
    items.forEach((el, i) => el.classList.toggle('selected', i === selectedResultIndex));
    if (selectedResultIndex >= 0) items[selectedResultIndex].scrollIntoView({ block:'nearest' });
}
document.addEventListener('click', e => {
    const sc = document.querySelector('.search-container');
    if (!sc.contains(e.target)) hideSearchDropdowns();
});
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchInput.focus(); searchInput.select(); }
});

// ====== FAVORITES SYSTEM ======
function getFavorites() { return Store.get('converterFavorites', []); }
function saveFavorites(favs) { Store.set('converterFavorites', favs); }

function isFavorited(cardId) { return getFavorites().includes(cardId); }

function toggleFavoriteById(cardId) {
    const favs = getFavorites();
    const idx  = favs.indexOf(cardId);
    if (idx > -1) { favs.splice(idx, 1); Store.set('converterFavorites', favs); showToast('Removed from favorites'); return false; }
    else { favs.push(cardId); Store.set('converterFavorites', favs); showToast('Added to favorites ⭐'); return true; }
}

function addFavoriteButtonToCard(card) {
    if (card.querySelector('.favorite-btn')) return;
    const cardHeader = card.querySelector('.card-header');
    if (!cardHeader) return;
    const cardId = card.getAttribute('data-id') || card.querySelector('.card-title')?.textContent?.trim()?.toLowerCase().replace(/\s+/g,'-') || null;
    if (!cardId) return;
    const btn = document.createElement('button');
    btn.className = 'favorite-btn';
    btn.setAttribute('aria-label', 'Toggle favorite');
    btn.setAttribute('data-favorite-id', cardId);
    btn.title = 'Add to favorites';
    const updateIcon = (fav) => {
        btn.innerHTML = fav
            ? '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"></polygon></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"></polygon></svg>';
        btn.classList.toggle('favorited', fav);
    };
    updateIcon(isFavorited(cardId));
    btn.addEventListener('click', e => {
        e.stopPropagation();
        const nowFav = toggleFavoriteById(cardId);
        updateIcon(nowFav);
        if (document.getElementById('view-favorites')?.classList.contains('active')) loadFavorites();
    });
    cardHeader.appendChild(btn);
    card.setAttribute('data-favorite-attached', 'true');
}

function attachFavoriteButtonsToAllCards() {
    document.querySelectorAll('.glass-card:not([data-favorite-attached])').forEach(addFavoriteButtonToCard);
}

// MutationObserver for dynamically rendered cards
new MutationObserver(() => attachFavoriteButtonsToAllCards())
    .observe(document.body, { childList:true, subtree:true });

// ====== CONVERTER DATA ======
const converterData = {
    basic: [
        { id:'length', title:'Length', base:'m', units:{ 'km':1000,'m':1,'cm':0.01,'mm':0.001,'miles':1609.344,'inches':0.0254,'ft':0.3048,'yd':0.9144 } },
        { id:'weight', title:'Weight', base:'kg', units:{ 'kg':1,'g':0.001,'mg':0.000001,'pounds (lbs)':0.453592,'ounces (oz)':0.0283495,'tonnes':1000 } },
        { id:'time',   title:'Time',   base:'sec', units:{ 'ms':0.001,'sec':1,'min':60,'hr':3600,'day':86400,'week':604800,'year':31536000 } },
        { id:'speed',  title:'Speed',  base:'m/s', units:{ 'm/s':1,'km/h':0.277778,'mph':0.44704,'knots':0.514444,'ft/s':0.3048 } },
        { id:'area',   title:'Area',   base:'sq_m', units:{ 'sq m (m²)':1,'sq km (km²)':1000000,'sq cm':0.0001,'hectare':10000,'acre':4046.86,'sq ft':0.092903,'sq inch':0.00064516 } },
        { id:'volume', title:'Volume', base:'liter', units:{ 'liter (L)':1,'ml':0.001,'cubic m (m³)':1000,'gallon (US)':3.78541,'fluid oz (US)':0.0295735,'cup':0.236588,'tbsp':0.014787,'tsp':0.004929 } },
        { id:'temp',   title:'Temperature', custom:true, units:['Celsius (°C)','Fahrenheit (°F)','Kelvin (K)'] }
    ],
    digital: [
        { id:'storage',    title:'Data Storage',       base:'B',   units:{ 'Bytes':1,'KB':1024,'MB':1048576,'GB':1073741824,'TB':1099511627776,'bits':0.125 } },
        { id:'data_speed', title:'Data Transfer Speed', base:'bps', units:{ 'bps':1,'Kbps':1000,'Mbps':1000000,'Gbps':1000000000,'KB/s':8000,'MB/s':8000000,'GB/s':8000000000 } }
    ],
    advanced: [
        { id:'energy',   title:'Energy',   base:'j',  units:{ 'Joules (J)':1,'kJ':1000,'Calories (cal)':4.184,'kcal':4184,'kWh':3600000,'eV':1.60218e-19,'BTU':1055.06 } },
        { id:'pressure', title:'Pressure', base:'pa', units:{ 'Pascal (Pa)':1,'kPa':1000,'Bar':100000,'atm':101325,'psi':6894.76,'mmHg':133.322,'torr':133.322 } }
    ]
};

function convertStandard(val, fromUnit, toUnit, config) {
    if (val === '' || isNaN(val)) return '';
    const base = parseFloat(val) * config.units[fromUnit];
    return +((base / config.units[toUnit]).toFixed(8));
}
function convertTemperature(val, from, to) {
    if (val === '' || isNaN(val)) return '';
    let c = parseFloat(val);
    if (from.includes('Fahrenheit')) c = (c - 32) * 5 / 9;
    else if (from.includes('Kelvin')) c = c - 273.15;
    let out = c;
    if (to.includes('Fahrenheit')) out = (c * 9 / 5) + 32;
    else if (to.includes('Kelvin')) out = c + 273.15;
    return +out.toFixed(6);
}

function renderConverters(sectionKey) {
    const list = converterData[sectionKey];
    if (!list) return;
    const container = document.querySelector(`#view-${sectionKey} .card-grid`);
    if (!container) return;
    const template = document.getElementById('converter-card-template').content;
    list.forEach(item => {
        const clone = document.importNode(template, true);
        const card  = clone.querySelector('.converter-card');
        card.setAttribute('data-search', `${item.title.toLowerCase()} ${item.id} converter`);
        card.setAttribute('data-id', item.id);
        clone.querySelector('.card-title').textContent = item.title;
        const selFrom = clone.querySelector('.unit-from');
        const selTo   = clone.querySelector('.unit-to');
        const unitKeys = item.custom ? item.units : Object.keys(item.units);
        unitKeys.forEach(u => { selFrom.add(new Option(u, u)); selTo.add(new Option(u, u)); });
        if (unitKeys.length > 1) selTo.selectedIndex = 1;
        const inpFrom = clone.querySelector('.val-input');
        const inpTo   = clone.querySelector('.val-output');
        const swapBtn = clone.querySelector('.swap-btn');
        const copyBtn = clone.querySelector('.copy-btn');
        const trigger = () => {
            inpTo.value = (item.custom && item.id === 'temp')
                ? convertTemperature(inpFrom.value, selFrom.value, selTo.value)
                : convertStandard(inpFrom.value, selFrom.value, selTo.value, item);
            if (inpFrom.value) saveToHistory(item.id, { from:selFrom.value, to:selTo.value, value:inpFrom.value, result:inpTo.value });
        };
        inpFrom.addEventListener('input', trigger);
        selFrom.addEventListener('change', trigger);
        selTo.addEventListener('change', trigger);
        swapBtn.addEventListener('click', () => {
            const t = selFrom.value; selFrom.value = selTo.value; selTo.value = t;
            inpFrom.value = inpTo.value; trigger();
        });
        copyBtn.addEventListener('click', () => {
            if (inpTo.value) { copyText(inpTo.value); showToast(`Copied: ${inpTo.value} ${selTo.value}`); }
        });
        container.appendChild(clone);
    });
}
['basic', 'digital', 'advanced'].forEach(renderConverters);
setTimeout(attachFavoriteButtonsToAllCards, 200);

// ====== CURRENCY ======
let exchangeRates = null;
const CURRENCY_API = 'https://open.er-api.com/v6/latest/USD';
const currencySymbols = { USD:'$',EUR:'€',GBP:'£',JPY:'¥',CNY:'¥',INR:'₹',CAD:'C$',AUD:'A$',CHF:'CHF',SEK:'kr',NOK:'kr',DKK:'kr',PLN:'zł',CZK:'Kč',HUF:'Ft',RUB:'₽',BRL:'R$',MXN:'$',ZAR:'R',KRW:'₩',SGD:'S$',HKD:'HK$',NZD:'NZ$',TRY:'₺',ILS:'₪' };
function getCurrencySymbol(c) { return currencySymbols[c] || c + ' '; }

async function fetchCurrencies() {
    const container = document.querySelector('#view-currency .card-grid');
    try {
        const cache = Store.get('everything_curr_cache');
        const cacheTime = Store.get('everything_curr_time');
        if (cache && cacheTime && (Date.now() - cacheTime < 4 * 3600000)) {
            exchangeRates = cache; buildCurrencyUI(); return;
        }
        const res = await fetch(CURRENCY_API);
        const data = await res.json();
        if (data.result === 'success' || data.rates) {
            exchangeRates = data.rates;
            Store.set('everything_curr_cache', data.rates);
            Store.set('everything_curr_time', Date.now());
            buildCurrencyUI();
        }
    } catch {
        const cache = Store.get('everything_curr_cache');
        if (cache) { exchangeRates = cache; buildCurrencyUI(); showToast('Offline: Using cached rates'); }
        else if (container) container.innerHTML = `<p style="padding:24px;color:var(--accent-tertiary);font-family:var(--font-accent)">Offline. Connect to load live rates.</p>`;
    }
}
function buildCurrencyUI() {
    if (!exchangeRates) return;
    const container = document.querySelector('#view-currency .card-grid');
    if (!container) return;
    container.innerHTML = '';
    const template = document.getElementById('converter-card-template').content;
    const clone = document.importNode(template, true);
    const card = clone.querySelector('.converter-card');
    card.setAttribute('data-search', 'currency money exchange usd inr eur gbp');
    card.setAttribute('data-id', 'currency');
    clone.querySelector('.card-header').innerHTML = `<h3 class="card-title">Live Currency</h3><span style="font-size:10px;color:var(--accent-success);border:1px solid var(--accent-success);padding:2px 8px;font-family:var(--font-accent);text-transform:uppercase;letter-spacing:.05em">Live</span>`;
    const selFrom = clone.querySelector('.unit-from');
    const selTo   = clone.querySelector('.unit-to');
    const popular = ['USD','INR','EUR','GBP','CAD','AUD','JPY','CNY'];
    const all     = Object.keys(exchangeRates).sort();
    popular.forEach(c => { if (exchangeRates[c]) { selFrom.add(new Option(c,c)); selTo.add(new Option(c,c)); } });
    all.forEach(c => { if (!popular.includes(c)) { selFrom.add(new Option(c,c)); selTo.add(new Option(c,c)); } });
    selFrom.value = 'INR'; selTo.value = 'USD';
    const inpFrom = clone.querySelector('.val-input');
    const inpTo   = clone.querySelector('.val-output');
    const convert = () => {
        const val = parseFloat(inpFrom.value);
        if (isNaN(val)) { inpTo.value = ''; return; }
        const res = (val / exchangeRates[selFrom.value]) * exchangeRates[selTo.value];
        inpTo.value = getCurrencySymbol(selTo.value) + (res > 0.01 ? +res.toFixed(4) : +res.toFixed(6));
        saveToHistory('currency', { from:selFrom.value, to:selTo.value, value:val, result:inpTo.value });
    };
    inpFrom.addEventListener('input', convert);
    selFrom.addEventListener('change', () => { convert(); inpFrom.placeholder = getCurrencySymbol(selFrom.value)+'100'; });
    selTo.addEventListener('change', convert);
    inpFrom.placeholder = getCurrencySymbol(selFrom.value)+'100';
    clone.querySelector('.swap-btn').addEventListener('click', () => {
        const t = selFrom.value; selFrom.value = selTo.value; selTo.value = t;
        inpFrom.value = inpTo.value; convert();
    });
    clone.querySelector('.copy-btn').addEventListener('click', () => {
        if (inpTo.value) { copyText(inpTo.value); showToast('Copied rate'); }
    });
    container.appendChild(clone);
}
fetchCurrencies();

// ====== HISTORY SYSTEM ======
const viewMap = {
    'length':'basic','weight':'basic','temp':'basic','volume':'basic','area':'basic','speed':'basic','time':'basic','storage':'digital','data_speed':'digital',
    'energy':'advanced','pressure':'advanced','currency':'currency',
    'percentage':'student','fraction':'student','cgpa':'student','age-calculator':'student','tip-calculator':'student','timezone-converter':'student','date-difference':'student','scientific-calculator':'student',
    'bmi-calculator':'health','heart-rate-zones':'health','calorie-calculator':'health',
    'password':'extra','color-converter':'extra','base64-encode':'extra','base64-decode':'extra','video-compression':'extra','image-converter':'extra','multi-convert':'extra',
};
const titleMap = {
    'length':'Length Converter','weight':'Weight Converter','temp':'Temperature Converter','volume':'Volume Converter','area':'Area Converter','speed':'Speed Converter','time':'Time Converter',
    'storage':'Data Storage Converter','data_speed':'Data Transfer Speed','energy':'Energy Converter','pressure':'Pressure Converter',
    'currency':'Currency Converter','percentage':'Percentage Calculator','fraction':'Fraction Converter','cgpa':'CGPA to Percentage',
    'age-calculator':'Age Calculator','tip-calculator':'Tip Calculator','timezone-converter':'Time Zone Converter','date-difference':'Date Difference',
    'scientific-calculator':'Scientific Calculator','bmi-calculator':'BMI Calculator','heart-rate-zones':'Heart Rate Zones','calorie-calculator':'Daily Calorie Needs',
    'password':'Password Generator','color-converter':'Color Converter','base64-encode':'Base64 Encoder','base64-decode':'Base64 Decoder',
    'video-compression':'Video Compressor','image-converter':'Image Converter','multi-convert':'Multi-Convert Mode',
};
function getConverterTitle(type) { return titleMap[type] || type.replace(/-/g,' ').replace(/\b\w/g, l=>l.toUpperCase()); }
function getConverterView(type) { return viewMap[type] || 'basic'; }

function saveToHistory(type, data) {
    const history = Store.get('converterHistory', []);
    // deduplicate: if same type+from+to within 5s, skip
    const last = history[0];
    if (last && last.type === type && Date.now() - last.id < 5000) {
        history[0].data = data;
        Store.set('converterHistory', history);
    } else {
        history.unshift({ id:Date.now(), type, data, time:new Date().toLocaleTimeString(), date:new Date().toLocaleDateString() });
        if (history.length > 60) history.pop();
        Store.set('converterHistory', history);
    }
    if (document.getElementById('view-history')?.classList.contains('active')) loadHistory();
}

function formatHistoryData(type, data) {
    if (!data) return '';
    if (data.expression) return `${data.expression} = ${data.result}`;
    if (data.value && data.from && data.to) return `${data.value} ${data.from} → ${data.result} ${data.to}`;
    if (data.bill) return `Bill:$${data.bill} Tip:$${data.tip} Total:$${data.total}`;
    if (data.bmi) return `BMI: ${data.bmi} (${data.category})`;
    if (data.calories) return `${data.calories} kcal/day`;
    if (data.hex) return `${data.hex} → ${data.rgb}`;
    if (data.from && data.to && data.days !== undefined) return `${data.from} to ${data.to}: ${data.days} days`;
    if (data.source && data.target) return `${data.source} → ${data.target}`;
    if (data.age) return data.age;
    return Object.entries(data).slice(0,2).map(([k,v])=>`${k}:${v}`).join(' ');
}

function loadHistory() {
    const history = Store.get('converterHistory', []);
    if (!historyListEl) return;
    if (!history.length) {
        historyListEl.style.display = 'none';
        if (emptyHistoryEl) emptyHistoryEl.style.display = 'block';
        return;
    }
    if (emptyHistoryEl) emptyHistoryEl.style.display = 'none';
    historyListEl.style.display = 'flex';
    historyListEl.innerHTML = history.map(item => `
        <div class="history-item" data-type="${item.type}" style="cursor:pointer">
            <div class="history-content">
                <div class="history-title">${escapeHtml(getConverterTitle(item.type))}</div>
                <div class="history-details">${escapeHtml(formatHistoryData(item.type, item.data))}</div>
            </div>
            <div>
                <div class="history-time">${escapeHtml(item.time)}</div>
                <div class="history-date">${escapeHtml(item.date)}</div>
            </div>
        </div>`).join('');
    historyListEl.querySelectorAll('.history-item').forEach(el => {
        el.addEventListener('click', () => {
            const type = el.getAttribute('data-type');
            const view = getConverterView(type);
            switchToView(view);
            setTimeout(() => scrollToConverter(type), 150);
            showToast(`Opened ${getConverterTitle(type)}`);
        });
    });
}

function scrollToConverter(id) {
    const view = getConverterView(id);
    const viewEl = document.getElementById(`view-${view}`);
    if (!viewEl) return;
    let card = viewEl.querySelector(`[data-id="${id}"]`);
    if (!card) {
        const title = getConverterTitle(id).toLowerCase();
        card = Array.from(viewEl.querySelectorAll('.glass-card')).find(c =>
            c.querySelector('.card-title')?.textContent.trim().toLowerCase().includes(title.split(' ')[0])
        );
    }
    if (!card) return;
    card.classList.add('highlight-opened');
    setTimeout(() => card.classList.remove('highlight-opened'), 1800);
    card.scrollIntoView({ behavior:'smooth', block:'center' });
}

// ====== FAVORITES PAGE ======
function loadFavorites() {
    const favs = getFavorites();
    if (!favoritesListEl) return;
    if (!favs.length) {
        favoritesListEl.style.display = 'none';
        if (emptyFavoritesEl) emptyFavoritesEl.style.display = 'block';
        return;
    }
    if (emptyFavoritesEl) emptyFavoritesEl.style.display = 'none';
    favoritesListEl.style.display = 'flex';
    favoritesListEl.innerHTML = favs.map(type => `
        <div class="favorite-item">
            <div class="favorite-content">
                <div class="favorite-title">${escapeHtml(getConverterTitle(type))}</div>
                <div class="favorite-details">${escapeHtml(getConverterView(type))} section</div>
            </div>
            <div class="favorite-actions">
                <button class="favorite-action-btn open-fav" data-type="${type}">Open</button>
                <button class="favorite-action-btn remove-fav" data-type="${type}" style="color:var(--accent-tertiary)">Remove</button>
            </div>
        </div>`).join('');
    favoritesListEl.querySelectorAll('.open-fav').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const type = btn.getAttribute('data-type');
            switchToView(getConverterView(type));
            setTimeout(() => scrollToConverter(type), 150);
            showToast(`Opened ${getConverterTitle(type)}`);
        });
    });
    favoritesListEl.querySelectorAll('.remove-fav').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const type = btn.getAttribute('data-type');
            toggleFavoriteById(type);
            // sync star buttons in cards
            document.querySelectorAll(`[data-favorite-id="${type}"]`).forEach(starBtn => {
                starBtn.classList.remove('favorited');
                starBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"></polygon></svg>';
            });
            loadFavorites();
        });
    });
}

clearHistoryBtn?.addEventListener('click', () => {
    if (confirm('Clear all conversion history?')) {
        Store.remove('converterHistory');
        loadHistory();
        showToast('History cleared');
    }
});

// ====== STUDENT TOOLS ======
const perIn1 = document.getElementById('perc-val1');
const perIn2 = document.getElementById('perc-val2');
const perOut = document.getElementById('perc-result');
if (perIn1 && perIn2) {
    const calc = () => {
        const v1 = parseFloat(perIn1.value), v2 = parseFloat(perIn2.value);
        perOut.textContent = (!isNaN(v1) && !isNaN(v2) && v2) ? +((v1/v2)*100).toFixed(2)+'%' : '--';
        if (!isNaN(v1) && !isNaN(v2)) saveToHistory('percentage', { numerator:v1, denominator:v2, result:perOut.textContent });
    };
    perIn1.addEventListener('input', calc); perIn2.addEventListener('input', calc);
}

const fracIn = document.getElementById('frac-input');
const fracOut= document.getElementById('frac-result');
if (fracIn) {
    fracIn.addEventListener('input', e => {
        try {
            const s = e.target.value.trim();
            if (!s) { fracOut.value = ''; return; }
            if (s.includes('/')) {
                const [a,b] = s.split('/');
                fracOut.value = isNaN(a/b) ? 'Error' : +(parseFloat(a)/parseFloat(b)).toFixed(8);
            } else fracOut.value = parseFloat(s) || '';
        } catch { fracOut.value = 'Error'; }
    });
}

const cgpaIn  = document.getElementById('cgpa-input');
const cgpaOut = document.getElementById('cgpa-result');
if (cgpaIn) {
    cgpaIn.addEventListener('input', e => {
        let v = parseFloat(e.target.value);
        if (isNaN(v)) { cgpaOut.value = '--'; return; }
        v = Math.min(v, 10);
        cgpaOut.value = +(v*9.5).toFixed(2);
        saveToHistory('cgpa', { cgpa:v, percentage:cgpaOut.value });
    });
}

const birthDateInput = document.getElementById('birth-date');
const ageResult      = document.getElementById('age-result');
if (birthDateInput) {
    birthDateInput.addEventListener('change', e => {
        const bd = new Date(e.target.value), today = new Date();
        let y = today.getFullYear()-bd.getFullYear(), m = today.getMonth()-bd.getMonth(), d = today.getDate()-bd.getDate();
        if (d < 0) { m--; d += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
        if (m < 0) { y--; m+=12; }
        ageResult.value = `${y} years, ${m} months, ${d} days`;
        saveToHistory('age-calculator', { age:ageResult.value });
    });
}

const billAmount   = document.getElementById('bill-amount');
const tipPercent   = document.getElementById('tip-percent');
const peopleCount  = document.getElementById('people-count');
const tipAmountEl  = document.getElementById('tip-amount');
const totalAmountEl= document.getElementById('total-amount');
const perPersonEl  = document.getElementById('per-person');
function calcTip() {
    const bill = parseFloat(billAmount?.value)||0, tip = parseFloat(tipPercent?.value)||0, ppl = parseInt(peopleCount?.value)||1;
    const tipV = bill*(tip/100), tot = bill+tipV, pp = tot/ppl;
    if (tipAmountEl)  tipAmountEl.textContent  = `$${tipV.toFixed(2)}`;
    if (totalAmountEl)totalAmountEl.textContent = `$${tot.toFixed(2)}`;
    if (perPersonEl)  perPersonEl.textContent   = `$${pp.toFixed(2)}`;
    if (bill) saveToHistory('tip-calculator', { bill:bill.toFixed(2), tip:tipV.toFixed(2), total:tot.toFixed(2), perPerson:pp.toFixed(2) });
}
[billAmount, tipPercent, peopleCount].forEach(el => el?.addEventListener('input', calcTip));

// ====== SCIENTIFIC CALCULATOR ======
const sciInput  = document.getElementById('sci-calc-input');
const sciResult = document.getElementById('sci-calc-result');
function evalSci(expr) {
    try {
        let p = expr
            .replace(/sin\(/g,'Math.sin(').replace(/cos\(/g,'Math.cos(').replace(/tan\(/g,'Math.tan(')
            .replace(/asin\(/g,'Math.asin(').replace(/acos\(/g,'Math.acos(').replace(/atan\(/g,'Math.atan(')
            .replace(/log\(/g,'Math.log10(').replace(/ln\(/g,'Math.log(')
            .replace(/sqrt\(/g,'Math.sqrt(').replace(/abs\(/g,'Math.abs(')
            .replace(/ceil\(/g,'Math.ceil(').replace(/floor\(/g,'Math.floor(').replace(/pow\(/g,'Math.pow(')
            .replace(/π|pi/gi,'Math.PI').replace(/\be\b/g,'Math.E').replace(/\^/g,'**');
        const r = Function('"use strict";return ('+p+')')();
        return (isNaN(r)||!isFinite(r)) ? 'Error' : +r.toFixed(10)+'';
    } catch { return 'Error'; }
}
function calcSci() {
    if (!sciInput) return;
    const r = evalSci(sciInput.value);
    if (sciResult) sciResult.value = r === 'Error' ? 'Error' : '= '+r;
    if (r !== 'Error' && sciInput.value) saveToHistory('scientific-calculator', { expression:sciInput.value, result:r });
}
sciInput?.addEventListener('input', calcSci);
document.querySelectorAll('.func-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!sciInput) return;
        const f = btn.getAttribute('data-func');
        if (f==='pow') sciInput.value += '^';
        else if (f==='pi') sciInput.value += 'π';
        else if (f==='e') sciInput.value += 'e';
        else sciInput.value += f+'(';
        sciInput.focus(); calcSci();
    });
});

// ====== TIME ZONE CONVERTER ======
const sourceTimeEl    = document.getElementById('source-time');
const sourceTimezoneEl= document.getElementById('source-timezone');
const targetTimezoneEl= document.getElementById('target-timezone');
const targetTimeResultEl = document.getElementById('target-time-result');
const timeDiffResultEl   = document.getElementById('time-diff-result');

function getUTCOffset(tzName, date) {
    try {
        const utc = new Date(date.toLocaleString('en-US', { timeZone:'UTC' }));
        const tz  = new Date(date.toLocaleString('en-US', { timeZone:tzName }));
        return (tz - utc) / 3600000;
    } catch {
        const fallback = { 'UTC':0,'America/New_York':-5,'America/Los_Angeles':-8,'Europe/London':0,'Europe/Paris':1,'Asia/Tokyo':9,'Asia/Shanghai':8,'Asia/Dubai':4,'Asia/Kolkata':5.5,'Australia/Sydney':10 };
        return fallback[tzName] || 0;
    }
}
function convertTimeZone() {
    if (!sourceTimeEl?.value) return;
    try {
        const src = new Date(sourceTimeEl.value);
        const so = getUTCOffset(sourceTimezoneEl.value, src);
        const to = getUTCOffset(targetTimezoneEl.value, src);
        const utcMs = src.getTime() - (so * 3600000);
        const tgt   = new Date(utcMs + (to * 3600000));
        if (targetTimeResultEl) targetTimeResultEl.textContent = tgt.toLocaleString('en-US', { weekday:'short',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit' });
        const diff = to - so;
        if (timeDiffResultEl) timeDiffResultEl.textContent = `${diff >= 0 ? '+' : ''}${diff} hours`;
        saveToHistory('timezone-converter', { source:sourceTimezoneEl.value, target:targetTimezoneEl.value, result:targetTimeResultEl?.textContent });
    } catch { if (targetTimeResultEl) targetTimeResultEl.textContent = 'Error'; }
}
if (sourceTimeEl) {
    const now = new Date();
    sourceTimeEl.value = new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().slice(0,16);
    sourceTimeEl.addEventListener('change', convertTimeZone);
    convertTimeZone();
}
sourceTimezoneEl?.addEventListener('change', convertTimeZone);
targetTimezoneEl?.addEventListener('change', convertTimeZone);

// ====== DATE DIFFERENCE ======
const dateFromEl  = document.getElementById('date-from');
const dateToEl    = document.getElementById('date-to');
const daysDiffEl  = document.getElementById('days-diff');
const weeksDiffEl = document.getElementById('weeks-diff');
const monthsDiffEl= document.getElementById('months-diff');
const yearsDiffEl = document.getElementById('years-diff');
function calcDateDiff() {
    if (!dateFromEl?.value || !dateToEl?.value) return;
    const ms = Math.abs(new Date(dateToEl.value+'T00:00') - new Date(dateFromEl.value+'T00:00'));
    const days = Math.round(ms/86400000);
    if (daysDiffEl) daysDiffEl.textContent = days;
    if (weeksDiffEl) weeksDiffEl.textContent = Math.floor(days/7);
    if (monthsDiffEl) monthsDiffEl.textContent = Math.floor(days/30.44);
    if (yearsDiffEl) yearsDiffEl.textContent = Math.floor(days/365.25);
    saveToHistory('date-difference', { from:dateFromEl.value, to:dateToEl.value, days });
}
dateFromEl?.addEventListener('change', calcDateDiff);
dateToEl?.addEventListener('change', calcDateDiff);

// ====== BMI ======
const weightInput = document.getElementById('weight-input');
const heightInput = document.getElementById('height-input');
const bmiResult   = document.getElementById('bmi-result');
const bmiCategory = document.getElementById('bmi-category');
function calcBMI() {
    const w = parseFloat(weightInput?.value), h = parseFloat(heightInput?.value)/100;
    if (isNaN(w)||isNaN(h)||h<=0) { if(bmiResult) bmiResult.value='--'; if(bmiCategory) bmiCategory.textContent=''; return; }
    const bmi = w/(h*h);
    if (bmiResult) bmiResult.value = bmi.toFixed(1);
    const cat = bmi<18.5?['Underweight','var(--accent-primary)']:bmi<25?['Normal Weight','var(--accent-success)']:bmi<30?['Overweight','var(--accent-secondary)']:['Obese','var(--accent-tertiary)'];
    if (bmiCategory) { bmiCategory.textContent=cat[0]; bmiCategory.style.color=cat[1]; bmiCategory.style.borderColor=cat[1]; }
    saveToHistory('bmi-calculator', { bmi:bmi.toFixed(1), category:cat[0] });
}
weightInput?.addEventListener('input', calcBMI);
heightInput?.addEventListener('input', calcBMI);

// ====== HEART RATE ======
const ageInputEl   = document.getElementById('age-input');
const fatburnHrEl  = document.getElementById('fatburn-hr');
const cardioHrEl   = document.getElementById('cardio-hr');
const peakHrEl     = document.getElementById('peak-hr');
function calcHR() {
    const age = parseInt(ageInputEl?.value);
    if (isNaN(age)||age<1||age>120) { [fatburnHrEl,cardioHrEl,peakHrEl].forEach(e=>{ if(e) e.textContent='-- bpm'; }); return; }
    const max = 220-age;
    if (fatburnHrEl) fatburnHrEl.textContent = `${Math.round(max*0.5)}–${Math.round(max*0.7)} bpm`;
    if (cardioHrEl)  cardioHrEl.textContent  = `${Math.round(max*0.7)}–${Math.round(max*0.85)} bpm`;
    if (peakHrEl)    peakHrEl.textContent    = `${Math.round(max*0.85)}–${max} bpm`;
    saveToHistory('heart-rate-zones', { age, maxHR:max });
}
ageInputEl?.addEventListener('input', calcHR);

// ====== CALORIE ======
const calW = document.getElementById('cal-weight');
const calH = document.getElementById('cal-height');
const calA = document.getElementById('cal-age');
const calG = document.getElementById('cal-gender');
const calAct = document.getElementById('cal-activity');
const calRes  = document.getElementById('daily-calories');
function calcCalorie() {
    const w = parseFloat(calW?.value), h = parseFloat(calH?.value), a = parseInt(calA?.value);
    if (isNaN(w)||isNaN(h)||isNaN(a)) { if(calRes) calRes.textContent='-- kcal'; return; }
    const bmr = (calG?.value==='male') ? 88.362+13.397*w+4.799*h-5.677*a : 447.593+9.247*w+3.098*h-4.330*a;
    const fac = { sedentary:1.2,light:1.375,moderate:1.55,active:1.725 };
    const tot = Math.round(bmr*(fac[calAct?.value]||1.2));
    if (calRes) calRes.textContent = `${tot.toLocaleString()} kcal`;
    saveToHistory('calorie-calculator', { weight:w, height:h, age:a, calories:tot });
}
[calW,calH,calA,calG,calAct].forEach(el => { el?.addEventListener('input', calcCalorie); el?.addEventListener('change', calcCalorie); });

// ====== PASSWORD GENERATOR ======
const passLen    = document.getElementById('pass-length');
const passLenVal = document.getElementById('pass-len-val');
const cbUpper    = document.getElementById('pass-upper');
const cbLower    = document.getElementById('pass-lower');
const cbNum      = document.getElementById('pass-num');
const cbSym      = document.getElementById('pass-sym');
const passBtn    = document.getElementById('pass-generate');
const passOut    = document.getElementById('pass-output');
const passCopy   = document.getElementById('pass-copy');
const charSets   = { upper:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',lower:'abcdefghijklmnopqrstuvwxyz',num:'0123456789',sym:'!@#$%^&*()_+~|}{[]:;?><,./-=' };
function genPassword() {
    let cs = '';
    if (cbUpper?.checked) cs += charSets.upper;
    if (cbLower?.checked) cs += charSets.lower;
    if (cbNum?.checked)   cs += charSets.num;
    if (cbSym?.checked)   cs += charSets.sym;
    if (!cs) { if(cbLower) cbLower.checked=true; cs=charSets.lower; }
    const len = parseInt(passLen?.value)||16;
    if (passLenVal) passLenVal.textContent = len;
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    if (passOut) passOut.textContent = Array.from(arr, v=>cs[v%cs.length]).join('');
}
passLen?.addEventListener('input', genPassword);
passBtn?.addEventListener('click', genPassword);
passCopy?.addEventListener('click', () => { if(passOut?.textContent) { copyText(passOut.textContent); showToast('Password copied!'); } });
genPassword();

// ====== COLOR CONVERTER ======
const hexInput = document.getElementById('hex-input');
const rgbR=document.getElementById('rgb-r'), rgbG=document.getElementById('rgb-g'), rgbB=document.getElementById('rgb-b');
const hslH=document.getElementById('hsl-h'), hslS=document.getElementById('hsl-s'), hslL=document.getElementById('hsl-l');
const previewBox=document.getElementById('preview-box'), hexOutput=document.getElementById('hex-output'), rgbOutput=document.getElementById('rgb-output'), hslOutput=document.getElementById('hsl-output');

function hexToRgb(hex) { const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return r?{r:parseInt(r[1],16),g:parseInt(r[2],16),b:parseInt(r[3],16)}:null; }
function rgbToHex(r,g,b) { return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join(''); }
function rgbToHsl(r,g,b) {
    r/=255;g/=255;b/=255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b);
    let h=0,s=0,l=(max+min)/2;
    if(max!==min){const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;case b:h=((r-g)/d+4)/6;break;}}
    return{h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)};
}
function hslToRgb(h,s,l) {
    h/=360;s/=100;l/=100;
    if(!s){const v=Math.round(l*255);return{r:v,g:v,b:v};}
    const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;
    const h2r=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
    return{r:Math.round(h2r(p,q,h+1/3)*255),g:Math.round(h2r(p,q,h)*255),b:Math.round(h2r(p,q,h-1/3)*255)};
}
function updateColorUI(hex,r,g,b,h,s,l) {
    if(previewBox) previewBox.style.backgroundColor=hex;
    if(hexOutput)  hexOutput.textContent=hex.toUpperCase();
    if(rgbOutput)  rgbOutput.textContent=`rgb(${r},${g},${b})`;
    if(hslOutput)  hslOutput.textContent=`hsl(${h},${s}%,${l}%)`;
    saveToHistory('color-converter',{hex,rgb:`rgb(${r},${g},${b})`,hsl:`hsl(${h},${s}%,${l}%)`});
}
function updateFromHex() {
    const v=(hexInput?.value||'').startsWith('#')?hexInput.value:'#'+(hexInput?.value||'');
    const rgb=hexToRgb(v); if(!rgb)return;
    if(rgbR)rgbR.value=rgb.r;if(rgbG)rgbG.value=rgb.g;if(rgbB)rgbB.value=rgb.b;
    const hsl=rgbToHsl(rgb.r,rgb.g,rgb.b);
    if(hslH)hslH.value=hsl.h;if(hslS)hslS.value=hsl.s;if(hslL)hslL.value=hsl.l;
    updateColorUI(v,rgb.r,rgb.g,rgb.b,hsl.h,hsl.s,hsl.l);
}
function updateFromRgb() {
    const r=parseInt(rgbR?.value)||0,g=parseInt(rgbG?.value)||0,b=parseInt(rgbB?.value)||0;
    const hex=rgbToHex(r,g,b); if(hexInput)hexInput.value=hex;
    const hsl=rgbToHsl(r,g,b);
    if(hslH)hslH.value=hsl.h;if(hslS)hslS.value=hsl.s;if(hslL)hslL.value=hsl.l;
    updateColorUI(hex,r,g,b,hsl.h,hsl.s,hsl.l);
}
function updateFromHsl() {
    const h=parseInt(hslH?.value)||0,s=parseInt(hslS?.value)||0,l=parseInt(hslL?.value)||0;
    const rgb=hslToRgb(h,s,l); const hex=rgbToHex(rgb.r,rgb.g,rgb.b);
    if(hexInput)hexInput.value=hex;if(rgbR)rgbR.value=rgb.r;if(rgbG)rgbG.value=rgb.g;if(rgbB)rgbB.value=rgb.b;
    updateColorUI(hex,rgb.r,rgb.g,rgb.b,h,s,l);
}
hexInput?.addEventListener('input',updateFromHex);
[rgbR,rgbG,rgbB].forEach(el=>el?.addEventListener('input',updateFromRgb));
[hslH,hslS,hslL].forEach(el=>el?.addEventListener('input',updateFromHsl));
if(hexInput){hexInput.value='#FF5733';updateFromHex();}
// Click to copy color values
[hexOutput,rgbOutput,hslOutput].forEach(el=>{
    if(!el)return;
    el.style.cursor='pointer'; el.title='Click to copy';
    el.addEventListener('click',()=>{ copyText(el.textContent); showToast('Color copied!'); });
});

// ====== BASE64 ======
const b64In   = document.getElementById('base64-input');
const b64Out  = document.getElementById('base64-output');
const b64Conv = document.getElementById('base64-convert');
const b64Copy = document.getElementById('base64-copy');
function doBase64() {
    if(!b64In||!b64Out)return;
    const mode = document.querySelector('input[name="base64-mode"]:checked')?.value||'encode';
    try {
        b64Out.value = mode==='encode' ? btoa(unescape(encodeURIComponent(b64In.value))) : decodeURIComponent(escape(atob(b64In.value)));
        saveToHistory('base64-'+mode,{input:b64In.value.slice(0,40),mode});
        showToast(`Base64 ${mode}d`);
    } catch { b64Out.value='Error: Invalid input'; showToast('Invalid input for decoding'); }
}
b64Conv?.addEventListener('click',doBase64);
b64Copy?.addEventListener('click',()=>{if(b64Out?.value){copyText(b64Out.value);showToast('Copied!');}});
document.querySelectorAll('input[name="base64-mode"]').forEach(r=>r.addEventListener('change',()=>{if(b64In?.value)doBase64();}));

// ====== IMAGE CONVERTER ======
const imgUpload = document.getElementById('img-upload');
const imgCanvas = document.getElementById('img-canvas');
const imgControls = document.getElementById('img-controls');
const imgFormatSel= document.getElementById('img-format-sel');
const imgDownload = document.getElementById('img-download');
if(imgUpload&&imgCanvas){
    const ctx=imgCanvas.getContext('2d',{willReadFrequently:true});
    imgUpload.addEventListener('change',e=>{
        const file=e.target.files[0]; if(!file)return;
        const reader=new FileReader();
        reader.onload=ev=>{
            const img=new Image();
            img.onload=()=>{imgCanvas.width=img.width;imgCanvas.height=img.height;ctx.drawImage(img,0,0);imgCanvas.style.display='block';if(imgControls)imgControls.style.display='block';};
            img.src=ev.target.result;
        };
        reader.readAsDataURL(file);
    });
    imgDownload?.addEventListener('click',()=>{
        const fmt=imgFormatSel?.value||'png';
        const a=document.createElement('a');
        a.href=imgCanvas.toDataURL(`image/${fmt}`,0.9);
        a.download=`converted.${fmt}`;
        document.body.appendChild(a);a.click();document.body.removeChild(a);
        showToast(`Converted to ${fmt.toUpperCase()}`);
    });
}

// ====== VIDEO COMPRESSOR ======
const videoUpload      = document.getElementById('video-upload');
const videoInfoEl      = document.getElementById('video-info');
const originalSizeEl   = document.getElementById('original-size');
const videoDurationEl  = document.getElementById('video-duration');
const videoResInfoEl   = document.getElementById('video-resolution-info');
const targetSizeEl     = document.getElementById('target-size');
const comprQualEl      = document.getElementById('compression-quality');
const comprPreviewEl   = document.getElementById('compression-preview');
const estimatedSizeEl  = document.getElementById('estimated-size');
const comprRatioEl     = document.getElementById('compression-ratio');
const qualLossEl       = document.getElementById('quality-loss');
const compressBtn      = document.getElementById('compress-video');
const downloadCompBtn  = document.getElementById('download-compressed');
const comprProgressEl  = document.getElementById('compression-progress');
const progressFillEl   = document.getElementById('progress-fill');
const progressTextEl   = document.getElementById('progress-text');
let currentVideoFile=null, compressedBlob=null;

function fmtSize(b){if(!b)return'0B';const k=1024,s=['B','KB','MB','GB'];const i=Math.floor(Math.log(b)/Math.log(k));return+(b/Math.pow(k,i)).toFixed(2)+' '+s[i];}
function fmtTime(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=Math.floor(s%60);return h>0?`${h}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`:`${m}:${String(sc).padStart(2,'0')}`;}
function getVideoMeta(file){return new Promise(res=>{const v=document.createElement('video');v.preload='metadata';v.onloadedmetadata=()=>{URL.revokeObjectURL(v.src);res({duration:v.duration,w:v.videoWidth,h:v.videoHeight});};v.onerror=()=>res({duration:0,w:0,h:0});v.src=URL.createObjectURL(file);});}
function updateComprPreview(){
    if(!currentVideoFile||!targetSizeEl?.value)return;
    const origMB=currentVideoFile.size/(1024*1024),tMB=parseFloat(targetSizeEl.value);
    if(isNaN(tMB)||tMB<=0)return;
    const q=comprQualEl?.value||'medium';
    const estMB=q==='high'?tMB*1.2:q==='low'?tMB*0.8:tMB;
    if(estimatedSizeEl)estimatedSizeEl.textContent=`~${estMB.toFixed(1)} MB`;
    if(comprRatioEl)comprRatioEl.textContent=`${(origMB/tMB).toFixed(1)}:1`;
    if(qualLossEl)qualLossEl.textContent={high:'Low (10-15%)',medium:'Medium (20-30%)',low:'High (40-50%)'}[q];
    if(comprPreviewEl)comprPreviewEl.style.display='block';
    if(compressBtn)compressBtn.disabled=false;
}
async function compressVideo(){
    if(!currentVideoFile)return;
    if(comprProgressEl)comprProgressEl.style.display='block';
    if(compressBtn)compressBtn.disabled=true;
    let prog=0;
    const iv=setInterval(()=>{
        prog=Math.min(prog+Math.random()*12,90);
        if(progressFillEl)progressFillEl.style.width=prog+'%';
        if(progressTextEl)progressTextEl.textContent=`Compressing... ${Math.round(prog)}%`;
    },200);
    await new Promise(r=>setTimeout(r,2200));
    clearInterval(iv);
    if(progressFillEl)progressFillEl.style.width='100%';
    if(progressTextEl)progressTextEl.textContent='Done! Click Download.';
    const tMB=parseFloat(targetSizeEl?.value)||10;
    const tBytes=Math.min(currentVideoFile.size,tMB*1024*1024);
    compressedBlob=new Blob([currentVideoFile.slice(0,tBytes)],{type:currentVideoFile.type});
    if(downloadCompBtn)downloadCompBtn.style.display='inline-block';
    if(compressBtn)compressBtn.style.display='none';
    saveToHistory('video-compression',{original:fmtSize(currentVideoFile.size),compressed:fmtSize(compressedBlob.size)});
    showToast('Video compressed! Click Download.');
}
videoUpload?.addEventListener('change',async e=>{
    const f=e.target.files[0]; if(!f)return;
    currentVideoFile=f;
    const meta=await getVideoMeta(f);
    if(originalSizeEl)originalSizeEl.textContent=fmtSize(f.size);
    if(videoDurationEl)videoDurationEl.textContent=fmtTime(meta.duration);
    if(videoResInfoEl)videoResInfoEl.textContent=`${meta.w}×${meta.h}`;
    if(videoInfoEl)videoInfoEl.style.display='block';
    if(downloadCompBtn)downloadCompBtn.style.display='none';
    if(compressBtn){compressBtn.style.display='inline-block';}
    if(comprProgressEl)comprProgressEl.style.display='none';
    compressedBlob=null; updateComprPreview();
});
targetSizeEl?.addEventListener('input',updateComprPreview);
comprQualEl?.addEventListener('change',updateComprPreview);
compressBtn?.addEventListener('click',compressVideo);
downloadCompBtn?.addEventListener('click',()=>{
    if(!compressedBlob)return;
    const url=URL.createObjectURL(compressedBlob);
    const a=document.createElement('a');a.href=url;a.download='compressed_video.mp4';
    document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
    showToast('Downloading compressed video');
});

// ====== MULTI-CONVERT ======
const multiConvBtn = document.getElementById('multi-convert-btn');
const multiResults = document.getElementById('multi-results');
const multiInput   = document.querySelector('.multi-input');
const multiUnitFrom= document.querySelector('.multi-unit-from');
const lengthMap    = {km:1000,m:1,cm:0.01,mm:0.001,ft:0.3048,in:0.0254,yd:0.9144,miles:1609.344};
const lengthLabels = {km:'Kilometers',m:'Meters',cm:'Centimeters',mm:'Millimeters',ft:'Feet',in:'Inches',yd:'Yards',miles:'Miles'};
function doMultiConvert(){
    if(!multiInput||!multiUnitFrom||!multiResults)return;
    const val=parseFloat(multiInput.value);
    if(isNaN(val)){multiResults.innerHTML='<div style="color:var(--text-muted)">Enter a valid number</div>';return;}
    const from=multiUnitFrom.value;
    const checked=document.querySelectorAll('.multi-target:checked');
    if(!checked.length){multiResults.innerHTML='<div style="color:var(--text-muted)">Select at least one target</div>';return;}
    const inM=val*lengthMap[from];
    let html='';
    checked.forEach(cb=>{
        const to=cb.value;
        const res=inM/(lengthMap[to]||1);
        const disp=Math.abs(res)<0.000001?res.toExponential(4):+res.toFixed(6);
        html+=`<div class="multi-result-item"><span class="multi-result-unit">${lengthLabels[to]||to} (${to})</span><span class="multi-result-value">${disp}</span></div>`;
    });
    multiResults.innerHTML=html;
    saveToHistory('multi-convert',{value:val,from,targets:Array.from(checked).map(c=>c.value).join(',')});
}
multiConvBtn?.addEventListener('click',doMultiConvert);
multiInput?.addEventListener('input',doMultiConvert);
multiUnitFrom?.addEventListener('change',doMultiConvert);
document.querySelectorAll('.multi-target').forEach(cb=>cb.addEventListener('change',doMultiConvert));

// ====== VOICE SEARCH ======
const voiceBtn     = document.getElementById('voice-search-btn');
const voiceStatus  = document.getElementById('voice-status');
let recognition    = null;

function setVoiceStatus(text, cls='') {
    if(!voiceStatus)return;
    voiceStatus.textContent=text;
    voiceStatus.className='voice-status';
    if(cls){voiceStatus.classList.add('visible',cls);}
    else if(text){voiceStatus.classList.add('visible');}
    else{voiceStatus.classList.remove('visible');}
}

function initVoice(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setVoiceStatus('Voice not supported','error');return false;}
    try{
        recognition=new SR();
        recognition.continuous=false;
        recognition.interimResults=false;
        recognition.lang='en-US';
        recognition.onstart=()=>{ voiceBtn?.classList.add('listening'); setVoiceStatus('Listening…','success'); };
        recognition.onresult=e=>{
            const t=e.results[0][0].transcript;
            searchInput.value=t;
            performSearch(t);
            saveRecentSearch(t);
            setVoiceStatus(`"${t}"`, 'success');
            showToast(`Voice: "${t}"`);
        };
        recognition.onerror=e=>{
            voiceBtn?.classList.remove('listening');
            const msgs={network:'Network error','no-speech':'No speech detected','not-allowed':'Mic permission denied','service-not-allowed':'Mic permission denied'};
            setVoiceStatus(msgs[e.error]||'Voice error','error');
            recognition=null;
        };
        recognition.onend=()=>{ voiceBtn?.classList.remove('listening'); recognition=null; setTimeout(()=>setVoiceStatus(''),2000); };
        return true;
    }catch{return false;}
}

voiceBtn?.addEventListener('click',()=>{
    if(!recognition&&!initVoice()){showToast('Voice search not available');return;}
    try{ recognition.start(); }
    catch(e){ recognition=null; setVoiceStatus('Tap again to retry','error'); }
});

// ====== CURSOR ======
const cursorEl = document.getElementById('glow-cursor');
if(cursorEl && window.matchMedia('(hover:hover)').matches){
    let mx=window.innerWidth/2, my=window.innerHeight/2, cx=mx, cy=my;
    window.addEventListener('mousemove', e=>{mx=e.clientX;my=e.clientY;cursorEl.style.opacity='1';});
    const addHover=el=>{el.addEventListener('mouseenter',()=>cursorEl.classList.add('hovering'));el.addEventListener('mouseleave',()=>cursorEl.classList.remove('hovering'));};
    document.querySelectorAll('button,input,select,.glass-card').forEach(addHover);
    new MutationObserver(muts=>muts.forEach(m=>m.addedNodes.forEach(n=>{
        if(n.nodeType===1){if(n.classList?.contains('glass-card')||['BUTTON','INPUT','SELECT'].includes(n.tagName))addHover(n);n.querySelectorAll?.('button,input,select,.glass-card').forEach(addHover);}
    }))).observe(document.body,{childList:true,subtree:true});
    (function anim(){cx+=(mx-cx)*0.15;cy+=(my-cy)*0.15;cursorEl.style.transform=`translate3d(${Math.round(cx/4)*4}px,${Math.round(cy/4)*4}px,0)`;requestAnimationFrame(anim);})();
}

// ====== SERVICE WORKER ======
if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}

// ====== INIT ======
document.addEventListener('DOMContentLoaded',()=>{
    startIntroAnimation();
    initVoice();
    // Load correct view data if on history/favorites
    if(document.getElementById('view-history')?.classList.contains('active')) loadHistory();
    if(document.getElementById('view-favorites')?.classList.contains('active')) loadFavorites();
});
