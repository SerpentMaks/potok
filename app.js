import * as F from './finance.js?v=1.1.0';
import { resetAppCache } from './pwa.js?v=1.1.0';

const KEY = 'potok.finance.v2';
const LEGACY_KEY = 'potok.finance.v1';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
  waves:'M2 6c3-4 5 4 8 0s5 4 8 0 4 0 4 0M2 12c3-4 5 4 8 0s5 4 8 0 4 0 4 0M2 18c3-4 5 4 8 0s5 4 8 0 4 0 4 0',
  'layout-dashboard':'M3 3h7v7H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 14h7v7H3z',
  'arrow-up-right':'M7 17 17 7M7 7h10v10','arrow-down-left':'M17 7 7 17M7 7v10h10',
  'arrow-left-right':'M3 7h18m-4-4 4 4-4 4M21 17H3m4-4-4 4 4 4',
  plus:'M12 5v14M5 12h14',x:'m6 6 12 12M18 6 6 18',check:'m5 12 4 4L19 6',
  wallet:'M3 5h16v15H3zM3 5V3h15M15 10h6v6h-6z',
  'credit-card':'M3 5h18v14H3zM3 10h18M6 15h3',
  banknote:'M2 5h20v14H2zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M5 9v6m14-6v6',
  'piggy-bank':'M5 7 3 3l6 2c9-2 12 4 11 9l-3 2v4h-3v-3h-4v3H7v-4l-4-2V9l2-2M14 8h1',
  briefcase:'M3 7h18v13H3zM8 7V3h8v4M3 12c6 3 12 3 18 0M12 11v4',
  chart:'M4 3v18h18M8 16v-5m5 5V7m5 9V4',
  'chart-no-axes-combined':'M4 3v18h18M7 14l4-5 4 2 6-7',
  'chart-pie':'M21 13a9 9 0 1 1-10-10v10zM15 3a8 8 0 0 1 6 6h-6z',
  target:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10M12 11v2',
  history:'M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2',
  settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
  shield:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6zM8 12l3 3 5-6',
  'shield-check':'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6zM8 12l3 3 5-6',
  'chevron-right':'m9 5 7 7-7 7','chevron-down':'m6 9 6 6 6-6',
  'arrow-right':'M4 12h16m-6-6 6 6-6 6',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  upload:'M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5',search:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6',
  calendar:'M3 5h18v16H3zM7 3v4m10-4v4M3 10h18',bell:'M6 8a6 6 0 0 1 12 0v8l3 2H3l3-2zM10 21h4',
  'circle-help':'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M9 9c0-4 7-4 6 0-1 2-3 1-3 5m0 3h.01',
  pencil:'m4 16 12-12 4 4L8 20H4zM14 6l4 4',trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  'utensils':'M4 3v7h6V3M7 3v18M19 3c-4 0-4 10 0 10v8M19 3v10',
  car:'m3 11 2-7h14l2 7v8h-3v-3H6v3H3zM3 11h18M6 13h2m8 0h2',
  'shopping-bag':'M4 7h16l1 14H3zM8 7V5a4 4 0 0 1 8 0v2',
  heart:'M12 21 3 12C-3 4 8-1 12 6c4-7 15-2 9 6z',
  coffee:'M3 3h14v12c0 6-14 6-14 0zM17 5h3c5 6-1 8-3 8M2 21h17',
  home:'m2 10 10-8 10 8M5 8v13h14V8M9 21v-8h6v8',
  smartphone:'M6 2h12v20H6zM10 18h4',repeat:'M3 7h17l-4-4m4 4-4 4M21 17H4l4 4m-4-4 4-4',
  laptop:'M4 3h16v13H4zM2 20l2-4h16l2 4z',sparkles:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z',
  'arrow-up':'M12 20V4m-7 7 7-7 7 7', 'arrow-down':'M12 4v16m-7-7 7 7 7-7',
  'log-out':'M9 3H3v18h6M8 12h13m-5-5 5 5-5 5', 'wifi-off':'m2 2 20 20M2 8c5-5 14-5 20 0M5 12c4-4 10-4 14 0M9 16c2-2 4-2 6 0M12 20h.01',
  circle:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'hard-drive':'m4 4 16 0 3 12v5H1v-5zM1 16h22M6 18h1m3 0h1',
};
function icon(name, cls='') {
  name = ({'briefcase-business':'briefcase','heart-pulse':'heart','house':'home','ellipsis':'circle','circle-plus':'plus'}[name] || name);
  return `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.circle}"/></svg>`;
}
let recoveryMessage = '';
function load() {
  for (const key of [KEY, KEY + '.backup', LEGACY_KEY, LEGACY_KEY + '.backup']) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = F.validateState(JSON.parse(raw));
        if(key.startsWith(LEGACY_KEY)){
          try{localStorage.setItem(KEY,JSON.stringify(parsed));}
          catch{recoveryMessage='Старая база прочитана, но перенос не сохранился. Скачайте JSON и освободите память браузера.';}
        }
        if (key.endsWith('.backup')) recoveryMessage = 'Основная копия повреждена. Восстановлена предыдущая резервная копия.';
        return parsed;
      }
    } catch { recoveryMessage = 'Не удалось прочитать сохраненную базу. Исходные данные сохранены в браузере; экспортируйте их в настройках.'; }
  }
  return F.createState();
}
let state = load();
let realState = null;
let demo = false;
let page = ['overview','history','analytics','plans','settings','entry'].includes(location.hash.slice(1)) ? location.hash.slice(1) : (matchMedia('(max-width: 650px)').matches ? 'entry' : 'overview');
let scope = 'all', period = 'month', query = '', typeFilter = 'all', categoryFilter = 'all';
let minAmount = '', maxAmount = '', dateFrom = '', dateTo = '';
let chartFrame = 0;
let charts = [], installPrompt = null, toastTimer;
let draft = newDraft();
function newDraft() { return {type:'expense',expression:'',walletId:state?.wallets[0]?.id || '',toWalletId:state?.wallets[1]?.id || '',categoryId:state?.categories.find(c=>c.type==='expense')?.id || '',scope:'personal',date:F.today(),note:'',tags:[]}; }
function notify(message, error=false) {
  const t = $('#toast'); t.textContent = message; t.className = `visible${error?' error':''}`;
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.className='',4500);
}
function commit(mutator, message) {
  const candidate = structuredClone(state);
  try {
    mutator(candidate);
    const checked = F.validateState(candidate);
    if (!demo) {
      const raw = JSON.stringify(checked), old = localStorage.getItem(KEY);
      if (old) localStorage.setItem(KEY+'.backup', old);
      localStorage.setItem(KEY, raw);
    }
    state=checked;
    render();
    if(message) notify(message + (demo ? ' · деморежим' : ''));
    return true;
  } catch(e) { notify(e.name==='QuotaExceededError' ? 'Память браузера заполнена. Экспортируйте резервную копию; изменение не сохранено.' : (e.message || 'Не удалось сохранить изменение'), true); return false; }
}
const navs = [['overview','layout-dashboard','Обзор'],['history','arrow-left-right','Операции'],['analytics','chart-no-axes-combined','Аналитика'],['plans','target','Планы и цели']];
const titles = {overview:['Все под контролем','Ваши деньги. Ясная картина.'],history:['История операций','Каждая операция на своем месте.'],analytics:['Аналитика','Замечайте привычки. Принимайте решения.'],plans:['Планы и цели','Для важного всегда есть место.'],settings:['Настройки','Ваше пространство, ваши правила.'],entry:['Новая операция','Запишите, пока не забыли.']};
function navigate(next) { page=next; location.hash=next; render(); window.scrollTo({top:0,behavior:'smooth'}); }
function render() {
  cancelAnimationFrame(chartFrame);
  charts.forEach(c=>c.destroy()); charts=[];
  const [title, sub]=titles[page] || titles.overview;
  $('#app').innerHTML = `<div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#overview" aria-label="Поток — главная"><span class="brand-symbol">${icon('waves')}</span><span>поток<span class="brand-dot">.</span></span></a>
      <div class="sidebar-caption">ЛИЧНЫЕ ФИНАНСЫ</div>
      <nav aria-label="Основная навигация">${navs.map(([id,i,label])=>`<button class="nav-link ${page===id?'active':''}" data-nav="${id}">${icon(i)}<span>${label}</span>${page===id?'<span class="nav-indicator"></span>':''}</button>`).join('')}</nav>
      <div class="sidebar-bottom"><div class="privacy-card">${icon('shield-check')}<strong>Только на вашем устройстве</strong><p>Ваши финансы остаются<br>только вашими.</p><span class="local-status"><i></i> Локальное хранение</span></div>
      <button class="nav-link ${page==='settings'?'active':''}" data-nav="settings">${icon('settings')}<span>Настройки</span></button><div class="sidebar-footer">Меньше тревоги. Больше ясности.<span>Поток · версия 1.1.0</span></div></div>
    </aside>
    <main class="main">
      <header class="topbar"><div><div class="eyebrow">${new Date().toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})}</div><h1 class="page-title">${title}<span class="title-dot">.</span></h1><p class="subtitle">${sub}</p></div>
      <div class="topbar-actions"><span class="badge offline-badge" ${navigator.onLine?'hidden':''}>${icon('wifi-off')} Офлайн</span><button class="button ghost demo-toggle" data-action="demo">${icon(demo?'log-out':'sparkles')}${demo?'Мои данные':'Демоданные'}</button><button class="icon-button settings-shortcut" data-nav="settings" aria-label="Настройки">${icon('settings')}</button><button class="button primary header-add" data-nav="entry">${icon('plus')} Добавить операцию</button></div></header>
      ${demo?'<div class="demo-banner">'+icon('sparkles')+'<span><strong>Деморежим.</strong> Все цифры вымышлены. Ваши данные сохранены отдельно.</span><button class="button ghost" data-action="demo">Выйти '+icon('arrow-right')+'</button></div>':''}
      ${recoveryMessage?`<div class="notice error">${esc(recoveryMessage)}</div>`:''}
      ${page!=='settings'&&page!=='entry'?`<div class="view-toolbar"><div class="scope-switch segmented" aria-label="Финансовый контур">${[['all','Все финансы'],['personal','Личное'],['business','Дело']].map(([v,t])=>`<button data-scope="${v}" class="${scope===v?'active':''}" aria-pressed="${scope===v}">${v==='business'?icon('briefcase'):''}${t}</button>`).join('')}</div><div class="period-select">${icon('calendar')}<select id="global-period" aria-label="Период"><option value="week" ${period==='week'?'selected':''}>За неделю</option><option value="month" ${period==='month'?'selected':''}>За месяц</option><option value="all" ${period==='all'?'selected':''}>За все время</option></select></div></div>`:''}
      ${page==='overview'?overview():page==='history'?historyPage():page==='analytics'?analyticsPage():page==='plans'?plansPage():page==='settings'?settingsPage():`<div class="entry-page">${entryPanel()}</div>`}
      <footer class="main-footer"><span>${icon('shield')} Данные сохраняются на этом устройстве</span><span>${demo?'Демонстрационная база':`${state.transactions.length} операций`}<span class="footer-divider">/</span> RUB ₽</span></footer>
    </main>
    <nav class="mobile-nav" aria-label="Навигация на телефоне">${[navs[0],navs[1],['entry','plus','Добавить'],navs[2],navs[3]].map(([id,i,t])=>`<button data-nav="${id}" aria-label="${t}" class="${page===id?'active':''} ${id==='entry'?'mobile-add':''}">${icon(i)}<span>${id==='plans'?'Планы':t}</span></button>`).join('')}</nav>
  </div>`;
  if (page==='overview'||page==='entry') updateAmount();
  if(page==='overview'||page==='analytics') chartFrame = requestAnimationFrame(drawCharts);
}
function statCards() {
  const s=F.summary(state,{period,scope}), b=F.totalBalance(state,scope);
  return `<div class="stats-grid">
    <div class="stat-card"><span class="stat-icon balance">${icon('wallet')}</span><div class="stat-label">Свободный баланс</div><div class="stat-value">${F.money(b)}</div><span class="stat-trend">${scope==='business'?'Рабочие счета':scope==='personal'?'Личные счета':'На всех счетах'} · без копилок</span></div>
    <div class="stat-card"><span class="stat-icon income">${icon('arrow-down-left')}</span><div class="stat-label">Доходы</div><div class="stat-value income">${F.money(s.income)}</div><span class="stat-trend">${periodLabel()} ${icon('arrow-down-left')}</span></div>
    <div class="stat-card"><span class="stat-icon expense">${icon('arrow-up-right')}</span><div class="stat-label">Расходы</div><div class="stat-value">${F.money(s.expense)}</div><span class="stat-trend">${periodLabel()} ${icon('arrow-up-right')}</span></div>
  </div>`;
}
function periodLabel(){ return period==='week'?'За последние 7 дней':period==='all'?'За все время':'В этом месяце'; }
function overview() {
  const b=F.safeBudget(state,{scope}), upcoming=F.upcomingSubscriptions(state).filter(s=>scope==='all'||s.scope===scope);
  const tx=filteredTransactions(false).slice(0,5);
  return `<div class="workspace"><div class="content-column">${statCards()}
    ${!state.transactions.length&&!demo?`<div class="welcome-strip"><span class="welcome-icon">${icon('sparkles')}</span><div><strong>Здесь начинается ваш спокойный бюджет</strong><p>Укажите остатки на счетах или посмотрите, как работает Поток.</p></div><button class="button secondary" data-action="wallets">Настроить счета ${icon('arrow-right')}</button></div>`:''}
    <div class="daily-card"><div class="daily-top"><span class="daily-label"><span class="pulse-dot"></span> МОЖНО ПОТРАТИТЬ СЕГОДНЯ</span><button class="icon-button" data-action="budget-info" aria-label="Как рассчитывается бюджет">${icon('circle-help')}</button></div><div class="daily-main"><div><div class="amount-large">${F.money(b.daily)}</div><p class="daily-description">Спокойно тратьте. Важное уже учтено.</p></div><div class="daily-emblem">${icon('waves')}</div></div><div class="budget-progress"><div class="progress-track"><div class="progress-fill" style="width:${b.free>0?Math.min(100,b.todayExpense/Math.max(b.daily+b.todayExpense,1)*100):0}%"></div></div><div class="budget-meta"><span>Сегодня потрачено <strong>${F.money(b.todayExpense)}</strong></span><span>До конца месяца <strong>${b.daysLeft} дн.</strong></span></div></div><div class="daily-bottom"><span>${icon('shield-check')} Зарезервировано на платежи</span><strong>${F.money(b.reserved)}</strong></div></div>
    <section class="wallets-section"><div class="section-heading"><h2>Мои счета <span class="count-badge">${state.wallets.length}</span></h2><button class="text-button" data-action="wallets">Управлять ${icon('chevron-right')}</button></div><div class="wallets-grid">${state.wallets.filter(w=>scope==='all'||w.kind===scope).map(w=>walletCard(w)).join('')}</div></section>
    <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Последние операции</h2><span class="panel-description">Маленькие записи — большая ясность</span></div><button class="text-button" data-nav="history">Все операции ${icon('arrow-right')}</button></div><div class="transaction-list">${tx.length?tx.map(transactionRow).join(''):empty('history','Пока без операций','Первая запись займет всего несколько секунд.')}</div></section>
    <div class="dashboard-grid"><section class="panel"><div class="panel-header"><h2 class="panel-title">Куда уходят деньги</h2><button class="icon-button" data-nav="analytics" aria-label="Открыть аналитику">${icon('arrow-up-right')}</button></div>${expenseChartMarkup(true)}</section><section class="panel"><div class="panel-header"><h2 class="panel-title">По расписанию</h2><span class="soft-icon violet">${icon('repeat')}</span></div>${upcoming.length?upcoming.slice(0,3).map(s=>`<div class="subscription-mini"><span class="transaction-icon violet">${icon('repeat')}</span><div><strong>${esc(s.name)}</strong><small>${dateLabel(s.nextDate)} · ${s.daysUntil===0?'сегодня':'через '+s.daysUntil+' дн.'}</small></div><b class="${s.type==='income'?'income':''}">${s.type==='income'?'+':''}${F.money(s.amount)}</b></div>`).join(''):empty('calendar','Впереди без сюрпризов','Добавьте подписки и регулярные платежи.')}<button class="text-button panel-bottom-link" data-nav="plans">Все планы ${icon('arrow-right')}</button></section></div>
    ${state.goals.length?`<section><div class="section-heading"><h2>Ближе к важному</h2><button class="text-button" data-nav="plans">Все цели ${icon('arrow-right')}</button></div><div class="card-grid goals-preview">${state.goals.slice(0,2).map(goalCard).join('')}</div></section>`:''}
    </div><aside class="entry-column">${entryPanel()}<div class="entry-tip">${icon('sparkles')}<p>Хорошая привычка начинается<br>с одной маленькой записи.</p></div></aside></div>`;
}
function walletCard(w){return `<button class="wallet-card" data-edit-wallet="${esc(w.id)}" style="--wallet-color:${esc(w.color)}"><div class="wallet-top"><span class="wallet-icon">${icon(w.name.toLowerCase().includes('нал')?'banknote':w.kind==='business'?'briefcase':'credit-card')}</span><span class="wallet-kind">${w.kind==='business'?'ДЕЛО':'ЛИЧНОЕ'}</span>${icon('chevron-right')}</div><div class="wallet-name">${esc(w.name)}</div><div class="wallet-balance">${F.money(F.walletBalance(state,w.id))}</div></button>`;}
function entryPanel(){
  const cats=state.categories.filter(c=>c.type===draft.type);
  if(!cats.some(c=>c.id===draft.categoryId)) draft.categoryId=cats[0]?.id||'';
  return `<section class="panel quick-entry"><div class="panel-header"><h2 class="panel-title">Быстрая запись</h2><span class="entry-key-hint">${icon('plus')}</span></div><div class="type-tabs segmented">${[['expense','Расход'],['income','Доход'],['transfer','Перевод']].map(([v,t])=>`<button data-draft-type="${v}" class="${draft.type===v?'active '+v:''}">${t}</button>`).join('')}</div>
    <div class="amount-display"><label for="expression" class="amount-label">СУММА, ₽</label><input id="expression" class="expression" inputmode="decimal" autocomplete="off" maxlength="80" placeholder="0" value="${esc(draft.expression)}" aria-label="Сумма или выражение"><div id="computed" class="computed">Можно считать: 350 + 120</div></div>
    <div class="entry-fields"><label class="field compact"><span>${draft.type==='transfer'?'Откуда':'Счет'}</span><select id="draft-wallet">${walletOptions(draft.walletId)}</select></label>${draft.type==='transfer'?`<label class="field compact"><span>Куда</span><select id="draft-to-wallet">${walletOptions(draft.toWalletId)}</select></label>`:`<div class="entry-section-label">КАТЕГОРИЯ <button class="text-button" data-action="categories" aria-label="Настроить категории">${icon('pencil')}</button></div><div class="category-grid">${cats.map(c=>`<button class="category-button ${draft.categoryId===c.id?'active':''}" data-category="${esc(c.id)}" style="--category-color:${esc(c.color)}">${icon(c.icon)}<span>${esc(c.name)}</span></button>`).join('')}</div>`}
    <details class="entry-details" ${matchMedia('(min-width:651px)').matches?'open':''}><summary>Дата, контур и заметка ${icon('chevron-down')}</summary><div class="field-row"><label class="field compact"><span>Контур</span><select id="draft-scope"><option value="personal" ${draft.scope==='personal'?'selected':''}>Личное</option><option value="business" ${draft.scope==='business'?'selected':''}>Дело / работа</option></select></label><label class="field compact"><span>Дата</span><input type="date" id="draft-date" value="${draft.date}" required max="9999-12-31"></label></div>
    <label class="field note-field"><span class="sr-only">Заметка</span><input id="draft-note" maxlength="200" placeholder="Заметка или #тег" value="${esc(draft.note)}"></label><div class="tag-list">${[...new Set([...state.tags,...draft.tags])].slice(0,6).map(t=>`<button class="chip ${draft.tags.includes(t)?'active':''}" data-tag="${esc(t)}">#${esc(t)}</button>`).join('')}<button class="chip add-chip" data-action="add-tag">${icon('plus')} тег</button></div></details></div>
    <div class="numpad" aria-label="Калькулятор">${['7','8','9','⌫','4','5','6','÷','1','2','3','×',',','0','+','−'].map(n=>`<button class="numpad-key ${['⌫','÷','×','+','−'].includes(n)?'operator':''}" data-key="${n}" aria-label="${n==='⌫'?'Удалить последнюю цифру':n}">${n}</button>`).join('')}</div><button class="button primary save-key" data-action="save-tx">${icon('check')} <span id="save-label">Записать расход</span><kbd>↵</kbd></button><div class="quick-save-note">${icon('shield-check')} Сохранится только на этом устройстве</div></section>`;
}
function walletOptions(selected){return state.wallets.map(w=>`<option value="${esc(w.id)}" ${selected===w.id?'selected':''}>${esc(w.name)} · ${F.money(F.walletBalance(state,w.id))}</option>`).join('');}
function updateAmount(){
  const el=$('#computed'); if(!el) return;
  try { const n=F.parseAmount(draft.expression); el.textContent=draft.expression&&/[+*/×÷−-]/.test(draft.expression)?'= '+F.money(n):'Можно считать: 350 + 120'; el.classList.remove('invalid'); } catch{el.textContent=draft.expression?'Допишите выражение':'Можно считать: 350 + 120';}
  const lbl=$('#save-label');if(lbl)lbl.textContent=draft.type==='income'?'Записать доход':draft.type==='transfer'?'Перевести деньги':'Записать расход';
}
function saveDraft(){
  try{
    const amount=F.parseAmount(draft.expression); if(amount<=0)throw Error('Введите сумму больше нуля');
    const tx={id:F.uid(),type:draft.type,amount,date:draft.date,walletId:draft.walletId,scope:draft.scope,note:draft.note.trim(),tags:[...new Set([...draft.tags,...(draft.note.match(/#[\p{L}\p{N}_-]+/gu)||[]).map(t=>t.slice(1))])]};
    if(draft.type==='transfer')tx.toWalletId=draft.toWalletId;else tx.categoryId=draft.categoryId;
    const success=commit(s=>{F.addTransaction(s,tx);s.tags=[...new Set([...tx.tags,...s.tags])].slice(0,30);},draft.type==='transfer'?'Перевод записан':'Операция записана');
    if(success){draft={...draft,expression:'',note:'',tags:[]};render();}
  }catch(e){notify(e.message,true);$('#expression')?.focus();}
}
function dateLabel(date){return new Date(date+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short'});}
function transactionRow(t){
  const cat=state.categories.find(c=>c.id===t.categoryId),w=state.wallets.find(w=>w.id===t.walletId),to=state.wallets.find(w=>w.id===t.toWalletId);
  const name=t.type==='transfer'?`${w?.name} → ${to?.name}`:t.type==='goal'?state.goals.find(g=>g.id===t.goalId)?.name||'Пополнение цели':cat?.name||'Операция';
  return `<button class="transaction-row" data-edit-tx="${esc(t.id)}" aria-label="Редактировать: ${esc(name)}, ${F.money(t.amount)}"><span class="transaction-icon ${t.type}" style="--tx-color:${esc(cat?.color||'#9b8afb')}">${icon(t.type==='transfer'?'arrow-left-right':t.type==='goal'?'target':cat?.icon||'wallet')}</span><span class="transaction-info"><span class="transaction-name">${esc(t.note||name)}</span><span class="transaction-meta">${esc(name)} <span>·</span> ${esc(w?.name)} ${t.scope==='business'?'<span class="tiny-badge">Дело</span>':''}${t.tags?.length?' <span>·</span> '+t.tags.map(x=>'#'+esc(x)).join(' '):''}</span></span><span class="transaction-date">${dateLabel(t.date)}</span><span class="transaction-amount ${t.type}">${t.type==='income'?'+':t.type==='expense'?'−':''}${F.money(t.amount)}</span><span class="transaction-edit">${icon('pencil')}</span></button>`;
}
function filteredTransactions(applySearch=true){
  return F.periodTransactions(state,period,scope).filter(t=>{
    if(!applySearch)return true;
    const cat=state.categories.find(c=>c.id===t.categoryId)?.name||'',w=state.wallets.find(w=>w.id===t.walletId)?.name||'';
    return (typeFilter==='all'||t.type===typeFilter)&&(categoryFilter==='all'||t.categoryId===categoryFilter)&&(!dateFrom||t.date>=dateFrom)&&(!dateTo||t.date<=dateTo)&&(!minAmount||t.amount>=Number(minAmount)*100)&&(!maxAmount||t.amount<=Number(maxAmount)*100)&&`${t.note} ${t.tags?.join(' ')} ${cat} ${w} ${t.amount/100}`.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru'));
  }).sort((a,b)=>b.date.localeCompare(a.date)||state.transactions.indexOf(b)-state.transactions.indexOf(a));
}
function historyPage(){const tx=filteredTransactions();return `${statCards()}<section class="panel history-panel"><div class="panel-header"><h2 class="panel-title">Все операции <span class="count-badge" id="history-count">${tx.length}</span></h2><button class="button secondary" data-action="csv">${icon('download')} CSV</button></div><div class="search-toolbar"><label class="search-field">${icon('search')}<input id="history-search" type="search" placeholder="Категория, заметка, #тег или сумма" value="${esc(query)}" aria-label="Поиск операций"></label><select id="type-filter" aria-label="Тип операции">${[['all','Все типы'],['expense','Расходы'],['income','Доходы'],['transfer','Переводы'],['goal','Копилки']].map(([v,t])=>`<option value="${v}" ${typeFilter===v?'selected':''}>${t}</option>`).join('')}</select><select id="category-filter" aria-label="Категория"><option value="all">Все категории</option>${state.categories.map(c=>`<option value="${esc(c.id)}" ${categoryFilter===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><details class="extra-filters" ${minAmount||maxAmount||dateFrom||dateTo?'open':''}><summary>Сумма и даты ${icon('chevron-down')}</summary><div class="field-row"><label class="field">От, ₽<input id="min-amount" type="number" min="0" step="0.01" value="${esc(minAmount)}"></label><label class="field">До, ₽<input id="max-amount" type="number" min="0" step="0.01" value="${esc(maxAmount)}"></label><label class="field">С даты<input id="date-from" type="date" value="${dateFrom}"></label><label class="field">По дату<input id="date-to" type="date" value="${dateTo}"></label></div></details><div class="history-head"><span>ОПЕРАЦИЯ / СЧЕТ</span><span>ДАТА</span><span>СУММА</span></div><div class="transaction-list" id="history-list">${tx.length?tx.map(transactionRow).join(''):empty('search','Ничего не найдено','Добавьте операцию или измените фильтры.')}</div><div class="history-total" id="history-total">${historyTotal(tx)}</div></section>`;}
function historyTotal(tx){return `Найдено ${tx.length} <span>Доходы: ${F.money(tx.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0))} <span class="footer-divider">/</span> Расходы: ${F.money(tx.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0))}</span>`;}
function refreshHistory(){const tx=filteredTransactions();$('#history-list').innerHTML=tx.length?tx.map(transactionRow).join(''):empty('search','Ничего не найдено','Попробуйте другой запрос.');$('#history-count').textContent=tx.length;$('#history-total').innerHTML=historyTotal(tx);}
function expenseGroups(){const tx=F.periodTransactions(state,period,scope).filter(t=>t.type==='expense');return state.categories.filter(c=>c.type==='expense').map(c=>({...c,amount:tx.filter(t=>t.categoryId===c.id).reduce((a,t)=>a+t.amount,0)})).filter(c=>c.amount).sort((a,b)=>b.amount-a.amount);}
function expenseChartMarkup(compact=false){const groups=expenseGroups(),total=groups.reduce((a,g)=>a+g.amount,0);if(!total)return empty('chart-pie','Чуть позже здесь будет картина','Категории появятся после первого расхода.');return `<div class="expense-chart ${compact?'compact':''}"><div class="donut-container"><canvas id="expense-chart" aria-label="Расходы по категориям" role="img"></canvas><div class="donut-center"><small>ВСЕГО РАСХОДОВ</small><strong>${F.money(total)}</strong></div></div><div class="chart-legend">${groups.slice(0,compact?4:20).map(g=>`<div class="legend-row"><span class="legend-dot" style="background:${esc(g.color)}"></span><span>${esc(g.name)}</span><strong>${compact?Math.round(g.amount/total*100)+'%':F.money(g.amount)}</strong></div>`).join('')}</div></div>`;}
function analyticsPage(){const s=F.summary(state,{period,scope});return `${statCards()}<div class="analytics-highlight"><div><span class="eyebrow">ДОЛЯ СОХРАНЕННЫХ ДЕНЕГ</span><strong class="savings-value ${s.savingsRate<0?'expense':''}">${s.income?Math.round(s.savingsRate)+'%':'—'}</strong></div><p>${s.income?'Из каждого заработанного рубля вы сохраняете '+Math.round(s.savingsRate)+' коп.':'Добавьте доход, чтобы увидеть долю сбережений.'}<br><small>(Доходы − расходы) / доходы · переводы и копилки не учитываются.</small></p>${icon('piggy-bank')}</div><div class="page-grid analytics-grid"><section class="panel"><div class="panel-header"><h2 class="panel-title">Расходы по категориям</h2><span class="badge">${periodLabel()}</span></div>${expenseChartMarkup()}</section><section class="panel"><div class="panel-header"><h2 class="panel-title">Доходы и расходы</h2><span class="badge">6 месяцев</span></div><div class="chart-wrap"><canvas id="monthly-chart" role="img" aria-label="Доходы и расходы за шесть месяцев"></canvas><div id="monthly-fallback" hidden></div></div><div class="inline-legend"><span><i style="background:#5be3ad"></i>Доходы</span><span><i style="background:#fa8b80"></i>Расходы</span></div></section></div>`;}
function drawCharts(){
  chartFrame = 0;
  const groups=expenseGroups(),canvas=$('#expense-chart');
  if(canvas&&groups.length){
    if(window.Chart){Chart.getChart(canvas)?.destroy();charts.push(new Chart(canvas,{type:'doughnut',data:{labels:groups.map(g=>g.name),datasets:[{data:groups.map(g=>g.amount/100),backgroundColor:groups.map(g=>g.color),borderWidth:0,borderRadius:3,spacing:3,hoverOffset:4}]},options:{animation:false,responsive:true,maintainAspectRatio:false,cutout:'80%',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+c.label+': '+F.money(Math.round(c.parsed*100))}}}}}));}
    else {let acc=0;const total=groups.reduce((a,g)=>a+g.amount,0);canvas.hidden=true;canvas.parentElement.style.background=`conic-gradient(${groups.map(g=>{const from=acc;acc+=g.amount/total*100;return `${g.color} ${from}% ${acc}%`;}).join(',')})`;canvas.parentElement.classList.add('fallback-donut');}
  }
  const bar=$('#monthly-chart');if(!bar)return;
  const now=new Date(),months=Array.from({length:6},(_,i)=>new Date(now.getFullYear(),now.getMonth()-5+i,1));
  const monthly=months.map(d=>{const prefix=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;return {label:d.toLocaleDateString('ru-RU',{month:'short'}),...['income','expense'].reduce((o,type)=>({...o,[type]:state.transactions.filter(t=>t.date.startsWith(prefix)&&t.type===type&&(scope==='all'||t.scope===scope)).reduce((a,t)=>a+t.amount/100,0)}),{})};});
  if(window.Chart)charts.push(new Chart(bar,{type:'bar',data:{labels:monthly.map(m=>m.label),datasets:[{label:'Доходы',data:monthly.map(m=>m.income),backgroundColor:'#5be3ad',borderRadius:5,maxBarThickness:20},{label:'Расходы',data:monthly.map(m=>m.expense),backgroundColor:'#fa8b80',borderRadius:5,maxBarThickness:20}]},options:{animation:false,responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${F.money(Math.round(c.parsed.y*100))}`}}},scales:{x:{grid:{display:false},ticks:{color:'#86918e'},border:{display:false}},y:{beginAtZero:true,grid:{color:'rgba(255,255,255,.04)'},border:{display:false},ticks:{color:'#86918e',callback:v=>v>=1000?(v/1000)+'к':v}}}}}));
  else {bar.hidden=true;const fallback=$('#monthly-fallback');fallback.hidden=false;fallback.innerHTML=monthly.map(m=>`<div class="fallback-bar-row"><b>${m.label}</b><span>Доходы ${F.money(m.income*100)}</span><span>Расходы ${F.money(m.expense*100)}</span></div>`).join('');}
}
function plansPage(){
  const all=F.upcomingSubscriptions(state).filter(x=>scope==='all'||x.scope===scope), expenses=all.filter(x=>x.type==='expense'), incomes=all.filter(x=>x.type==='income'), debts=state.debts.filter(d=>scope==='all'||d.scope===scope);
  return `<section class="plans-section"><div class="section-heading"><div><h2>Подписки и регулярные расходы</h2><p class="subtitle">Сохраните один раз — повторяйте каждый месяц</p></div><button class="button secondary" data-action="new-sub">${icon('plus')} Расход</button></div><p class="recurring-summary">${icon('repeat')} Автоматические шаблоны записывают наступившие платежи при открытии приложения. В ручном режиме нажмите «Записать». Удаление шаблона не удаляет историю.</p><div class="card-grid">${expenses.length?expenses.map(subCard).join(''):empty('repeat','Без забытых подписок','Добавьте связь, интернет, аренду или любой ежемесячный расход.')}</div></section>
  <section class="plans-section"><div class="section-heading"><div><h2>Постоянные доходы</h2><p class="subtitle">Стипендия, зарплата и другие регулярные поступления</p></div><button class="button secondary" data-action="new-income-sub">${icon('plus')} Доход</button></div><div class="card-grid">${incomes.length?incomes.map(subCard).join(''):empty('banknote','Доходы по расписанию','Укажите сумму и число месяца. Будущие поступления не увеличивают доступный бюджет заранее.')}</div></section>
  <section class="plans-section"><div class="section-heading"><div><h2>Копилки и цели</h2><p class="subtitle">Пополнение уменьшает свободный баланс, но не считается расходом</p></div><button class="button secondary" data-action="new-goal">${icon('plus')} Цель</button></div><div class="card-grid">${state.goals.length?state.goals.map(goalCard).join(''):empty('target','Дайте деньгам направление','Первая цель — покупка, мечта или финансовая подушка.')}</div></section>
  <section class="plans-section"><div class="section-heading"><div><h2>Книга долгов</h2><p class="subtitle">Вносите платежи частями — остаток пересчитается сам</p></div><button class="button secondary" data-action="new-debt">${icon('plus')} Запись</button></div><div class="card-grid">${debts.length?debts.map(debtCard).join(''):empty('wallet','Все друг другу вернули','Добавьте долг, затем записывайте платежи любой суммой.')}</div></section>`;
}
function subCard(s){
  const status=F.recurringStatus(state,s.id), isIncome=s.type==='income';
  return `<article class="panel subscription-card"><div class="card-top"><span class="soft-icon ${isIncome?'income':'violet'}">${icon(isIncome?'arrow-down-left':'repeat')}</span><span class="badge ${isIncome?'emerald':''}">${isIncome?'Доход':'Расход'}</span><button class="icon-button" data-edit-sub="${esc(s.id)}" aria-label="Редактировать шаблон ${esc(s.name)}">${icon('pencil')}</button></div><h3>${esc(s.name)}</h3><div class="card-value ${isIncome?'income':''}">${F.money(s.amount)}<small> / месяц</small></div><p class="muted">${s.day}-го числа · ${esc(state.wallets.find(w=>w.id===s.walletId)?.name)}</p><p class="recurring-mode">${s.auto?'Автозапись при открытии':'Ручное подтверждение'} · со ${dateLabel(s.startDate)}</p><div class="card-bottom"><span class="badge ${status.recorded?'emerald':!isIncome&&s.daysUntil<4?'coral':''}">${status.recorded?(status.transaction?'В этом месяце записано':'Этот месяц обработан'):!status.active?'Начало '+dateLabel(s.nextDate):'Ближайший: '+dateLabel(s.nextDate)}</span>${status.recorded?'':status.active?`<button class="text-button" data-pay-sub="${esc(s.id)}">Записать ${icon('arrow-right')}</button>`:''}</div></article>`;
}
function goalCard(g){const pct=Math.min(100,g.saved/g.target*100);return `<article class="panel goal-card" style="--goal-color:${esc(g.color)}"><div class="card-top"><span class="soft-icon">${icon('target')}</span><span class="badge">${Math.floor(pct)}%</span><button class="icon-button" data-edit-goal="${esc(g.id)}" aria-label="Редактировать цель">${icon('pencil')}</button></div><h3>${esc(g.name)}</h3><div class="goal-amount">${F.money(g.saved)} <small>из ${F.money(g.target)}</small></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${esc(g.color)}"></div></div><div class="card-bottom"><span class="muted">${pct>=100?'Цель достигнута!':'Осталось '+F.money(g.target-g.saved)}</span><button class="text-button" data-fund-goal="${esc(g.id)}">Пополнить ${icon('plus')}</button></div></article>`;}
function debtCard(d){
  const progress=F.debtProgress(state,d.id), pct=progress.paid/progress.total*100;
  return `<article class="panel debt-card ${d.settled?'settled':''}"><div class="card-top"><span class="soft-icon ${d.direction==='receivable'?'income':'expense'}">${icon(d.direction==='receivable'?'arrow-down-left':'arrow-up-right')}</span><span class="badge">${d.direction==='receivable'?'Мне должны':'Я должен'}</span><button class="icon-button" data-edit-debt="${esc(d.id)}" aria-label="Редактировать долг ${esc(d.name)}">${icon('pencil')}</button></div><h3>${esc(d.name)}</h3><small class="muted">Остаток долга</small><div class="card-value">${F.money(progress.remaining)}</div><div class="debt-progress"><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><p class="recurring-mode">Погашено ${F.money(progress.paid)} из ${F.money(progress.total)}</p></div><div class="card-bottom"><span class="muted">До ${dateLabel(d.dueDate)}</span>${d.settled?'<span class="badge emerald">'+icon('check')+' Погашено</span>':`<button class="text-button" data-pay-debt="${esc(d.id)}">Внести платеж ${icon('plus')}</button>`}</div><button class="text-button debt-history-button" data-debt-history="${esc(d.id)}">История платежей · ${progress.payments.length} ${icon('chevron-right')}</button></article>`;
}
function settingsPage(){return `<div class="settings-grid"><section class="panel"><div class="panel-header"><h2 class="panel-title">Бюджет на месяц</h2><span class="soft-icon">${icon('wallet')}</span></div><p class="settings-copy">Общий лимит расходов для контура «Все финансы». Дневной бюджет ограничен и доступными деньгами, и остатком лимита. Для личного и рабочего контуров он рассчитывается по их счетам. 0 — расчет только по балансу.</p><form id="budget-form"><label class="field">Лимит, ₽<input name="limit" type="number" min="0" max="1000000000" step="0.01" value="${state.settings.monthlyLimit/100}" required></label><button class="button primary" type="submit">Сохранить лимит</button></form></section><section class="panel"><div class="panel-header"><h2 class="panel-title">Резервная копия</h2><span class="soft-icon violet">${icon('hard-drive')}</span></div><p class="settings-copy">Все счета, операции, цели и настройки — в одном файле. Сохраняйте копию регулярно: очистка данных браузера удалит локальную базу.</p><div class="backup-actions"><button class="button secondary" data-action="export">${icon('download')} Скачать JSON</button><button class="button secondary" data-action="import">${icon('upload')} Импорт JSON</button></div><p class="helper-text">Импорт проверит файл и покажет состав базы перед заменой.</p>${recoveryMessage?'<button class="text-button" data-action="raw-export">Скачать исходную сохраненную базу</button>':''}</section><section class="panel"><div class="panel-header"><h2 class="panel-title">Счета и категории</h2></div><p class="settings-copy">Настройте начальные остатки, названия счетов и удобные категории.</p><div class="backup-actions"><button class="button secondary" data-action="wallets">${icon('wallet')} Мои счета</button><button class="button secondary" data-action="categories">${icon('pencil')} Категории</button></div></section><section class="panel"><div class="panel-header"><h2 class="panel-title">Всегда под рукой</h2><span class="soft-icon">${icon('smartphone')}</span></div><p class="settings-copy">Установите Поток на главный экран. После первого открытия онлайн приложение работает и без интернета.</p><button class="button secondary" data-action="install">${icon('download')} Установить приложение</button><p class="helper-text">iPhone: «Поделиться» → «На экран Домой». Android: меню браузера → «Установить приложение».</p></section><section class="panel"><div class="panel-header"><h2 class="panel-title">Обновление приложения</h2><span class="soft-icon">${icon('repeat')}</span></div><p class="settings-copy">Версия 1.1.0. Если интерфейс не обновился, сбросьте офлайн-кэш. Счета, операции, долги, цели и резервные копии в браузере сохранятся.</p><button class="button secondary" data-action="cache-reset">${icon('repeat')} Сбросить кэш</button><p class="helper-text">Нужно подключение к интернету. После сброса приложение перезагрузится.</p></section><section class="panel privacy-settings"><div class="panel-header"><h2 class="panel-title">Приватность по умолчанию</h2>${icon('shield-check')}</div><p class="settings-copy">Нет аккаунтов, рекламы и отправки ваших финансов на сервер. Данные привязаны к этому браузеру и адресу сайта. Для переноса используйте JSON. Хранение не зашифровано — защищайте само устройство.</p><div class="badge emerald">${icon('shield-check')} 100% локальный учет</div></section><section class="panel"><div class="panel-header"><h2 class="panel-title">Новое начало</h2></div><p class="settings-copy">Удалить все записи, счета и настройки. Перед удалением рекомендуется скачать резервную копию.</p><button class="button danger" data-action="reset">${icon('trash')} Очистить базу</button></section></div>`;}
function empty(i,title,body){return `<div class="empty-state"><span class="empty-icon">${icon(i)}</span><strong>${title}</strong><p>${body}</p></div>`;}

const modal=$('#modal');
function showModal(title,body,wide=false){$('#modal-content').innerHTML=`<div class="modal-header"><h2>${title}</h2><button class="icon-button" data-action="close-modal" aria-label="Закрыть">${icon('x')}</button></div>${body}`;modal.classList.toggle('wide',wide);if(!modal.open)modal.showModal();}
function closeModal(){modal.close();}
function formActions(label='Сохранить',deletion=''){return `<div class="modal-actions">${deletion}<button type="button" class="button ghost" data-action="close-modal">Отмена</button><button type="submit" class="button primary">${label}</button></div>`;}
function moneyInput(name,label,value=0){return `<label class="field">${label}<input name="${name}" type="number" step="0.01" min="0.01" max="1000000000" value="${value?value/100:''}" required inputmode="decimal"></label>`;}
function scopeField(value='personal'){return `<label class="field">Контур<select name="scope"><option value="personal" ${value==='personal'?'selected':''}>Личное</option><option value="business" ${value==='business'?'selected':''}>Дело / работа</option></select></label>`;}
function nameInput(value='',label='Название'){return `<label class="field">${label}<input name="name" maxlength="60" value="${esc(value)}" required></label>`;}
function colorInput(value='#5be3ad'){return `<label class="field color-field">Цвет<input type="color" name="color" value="${esc(value)}"></label>`;}
function txModal(id){
  const t=state.transactions.find(t=>t.id===id);if(!t)return;
  const isLinked=t.type==='goal'||t.debtId||t.subscriptionId;
  showModal('Редактировать операцию',`<form id="tx-form" data-id="${esc(id)}">${isLinked?'<p class="notice">Связанная операция. Тип и связь сохраняются; изменение платежа пересчитает остаток долга, сохранив его общую сумму. Удаленная регулярная операция автоматически не создается повторно.</p>':''}<div class="field-row">${moneyInput('amount','Сумма, ₽',t.amount)}<label class="field">Дата<input type="date" name="date" value="${t.date}" required></label></div><label class="field">Счет<select name="walletId">${walletOptions(t.walletId)}</select></label>${t.type==='transfer'?`<label class="field">Счет получателя<select name="toWalletId">${walletOptions(t.toWalletId)}</select></label>`:t.type!=='goal'?`<label class="field">Категория<select name="categoryId">${state.categories.filter(c=>c.type===t.type).map(c=>`<option value="${esc(c.id)}" ${c.id===t.categoryId?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>`:''}${scopeField(t.scope)}<label class="field">Заметка<input name="note" maxlength="200" value="${esc(t.note)}"></label><label class="field">Теги через запятую<input name="tags" maxlength="300" value="${esc(t.tags?.join(', '))}"></label>${formActions('Сохранить',`<button type="button" class="button danger" data-delete-tx="${esc(id)}">${icon('trash')} Удалить</button>`)}</form>`);
}
function walletsModal(){showModal('Мои счета',`<div class="modal-list">${state.wallets.map(w=>`<button class="list-edit-row" data-edit-wallet="${esc(w.id)}"><span class="soft-icon" style="color:${esc(w.color)}">${icon('wallet')}</span><span><strong>${esc(w.name)}</strong><small>${w.kind==='business'?'Дело':'Личное'}</small></span><b>${F.money(F.walletBalance(state,w.id))}</b>${icon('pencil')}</button>`).join('')}</div><button class="button primary full-width" data-action="new-wallet">${icon('plus')} Добавить счет</button><p class="helper-text">Баланс = начальный остаток + все операции. Пополнения целей списываются отдельно.</p>`);}
function walletModal(id){const w=state.wallets.find(w=>w.id===id);showModal(w?'Настроить счет':'Новый счет',`<form id="wallet-form" data-id="${esc(id||'')}">${nameInput(w?.name)}<div class="field-row"><label class="field">Начальный остаток, ₽<input name="balance" type="number" step="0.01" min="-1000000000" max="1000000000" value="${(w?.initialBalance||0)/100}" required></label>${colorInput(w?.color)}</div><label class="field">Контур счета<select name="kind"><option value="personal" ${w?.kind!=='business'?'selected':''}>Личное</option><option value="business" ${w?.kind==='business'?'selected':''}>Дело / работа</option></select></label><p class="helper-text">Начальный остаток — сумма до начала учета. Для новых поступлений используйте операцию «Доход».</p>${formActions('Сохранить',w?`<button type="button" class="button danger" data-delete-wallet="${esc(id)}">Удалить</button>`:'')}</form>`);}
function categoriesModal(){showModal('Категории',`<div class="modal-list">${state.categories.map(c=>`<button class="list-edit-row" data-edit-category="${esc(c.id)}"><span class="soft-icon" style="color:${esc(c.color)}">${icon(c.icon)}</span><span><strong>${esc(c.name)}</strong><small>${c.type==='income'?'Доход':'Расход'}</small></span>${icon('pencil')}</button>`).join('')}</div><button class="button primary full-width" data-action="new-category">${icon('plus')} Добавить категорию</button>`);}
function categoryModal(id){const c=state.categories.find(c=>c.id===id);showModal(c?'Изменить категорию':'Новая категория',`<form id="category-form" data-id="${esc(id||'')}">${nameInput(c?.name)}<label class="field">Тип<select name="type" ${c?'disabled':''}><option value="expense">Расход</option><option value="income" ${c?.type==='income'?'selected':''}>Доход</option></select></label><div class="field-row"><label class="field">Иконка<select name="icon">${[['utensils','Еда'],['car','Транспорт'],['shopping-bag','Покупки'],['briefcase','Работа'],['home','Дом'],['heart','Здоровье'],['coffee','Кофе'],['smartphone','Связь'],['laptop','Техника'],['repeat','Подписки'],['wallet','Кошелек'],['sparkles','Другое']].map(([v,t])=>`<option value="${v}" ${c?.icon===v?'selected':''}>${t}</option>`).join('')}</select></label>${colorInput(c?.color||'#9b8afb')}</div>${formActions('Сохранить',c?`<button type="button" class="button danger" data-delete-category="${esc(id)}">Удалить</button>`:'')}</form>`);}
function categoryOptions(type,selected){return state.categories.filter(c=>c.type===type).map(c=>`<option value="${esc(c.id)}" ${selected===c.id?'selected':''}>${esc(c.name)}</option>`).join('');}
function subscriptionModal(id,newType='expense'){
  const sub=state.subscriptions.find(x=>x.id===id), type=sub?.type||newType;
  showModal(sub?'Настроить ежемесячный шаблон':type==='income'?'Новый постоянный доход':'Новый ежемесячный расход',`<form id="sub-form" data-id="${esc(id||'')}">${nameInput(sub?.name,type==='income'?'Источник дохода':'Название платежа')}<label class="field">Тип<select name="type" ${sub?'disabled':''}><option value="expense" ${type==='expense'?'selected':''}>Расход / подписка</option><option value="income" ${type==='income'?'selected':''}>Постоянный доход</option></select></label><div class="field-row">${moneyInput('amount','Сумма, ₽',sub?.amount)}<label class="field">Число каждого месяца<input name="day" type="number" min="1" max="31" value="${sub?.day||Number(F.today().slice(-2))}" required></label></div><label class="field">Категория<select name="categoryId">${categoryOptions(type,sub?.categoryId||(type==='income'?'other-income':'subscriptions'))}</select></label><label class="field">Счет<select name="walletId">${walletOptions(sub?.walletId||draft.walletId)}</select></label>${scopeField(sub?.scope)}<label class="field">Учитывать начиная с<input name="startDate" type="date" value="${sub?.startDate||F.today()}" required></label><label class="check-field"><input type="checkbox" name="auto" ${(sub?sub.auto:true)?'checked':''}><span>Записывать автоматически каждый месяц</span></label><p class="helper-text">Операции появляются при открытии приложения по наступившим датам. Если дата начала в прошлом, добавятся пропущенные месяцы. При выключенной автозаписи используйте кнопку «Записать». Для 29–31 числа в коротком месяце выбирается последний день.</p><p class="notice">Изменение или удаление шаблона не меняет уже записанные расходы и доходы.</p>${formActions('Сохранить',sub?`<button type="button" class="button danger" data-delete-sub="${esc(id)}">Удалить шаблон</button>`:'')}</form>`);
}
function goalModal(id){const g=state.goals.find(x=>x.id===id);showModal(g?'Настроить цель':'Новая цель',`<form id="goal-form" data-id="${esc(id||'')}">${nameInput(g?.name)}<div class="field-row">${moneyInput('target','Цель, ₽',g?.target)}${colorInput(g?.color||'#9b8afb')}</div><p class="helper-text">${g?'Накоплено: '+F.money(g.saved)+'. ':''}Пополняйте цель с любого счета. Уже накопленные средства учитываются через журнал.</p>${formActions('Сохранить',g?`<button type="button" class="button danger" data-delete-goal="${esc(id)}">Удалить</button>`:'')}</form>`);}
function fundModal(id){const g=state.goals.find(x=>x.id===id);if(!g)return;showModal('Пополнить «'+esc(g.name)+'»',`<form id="fund-form" data-id="${esc(id)}">${moneyInput('amount','Сумма пополнения, ₽')}<label class="field">Со счета<select name="walletId">${walletOptions(draft.walletId)}</select></label><p class="helper-text">Сумма уйдет со свободного баланса в цель и появится в истории. Расходом она не считается.</p>${formActions('Пополнить')}</form>`);}
function debtModal(id){
  const d=state.debts.find(x=>x.id===id), progress=d?F.debtProgress(state,id):null;
  showModal(d?'Настроить долг':'Новый долг',`<form id="debt-form" data-id="${esc(id||'')}">${nameInput(d?.name,'Имя или описание')}<label class="field">Направление<select name="direction" ${progress?.paid?'disabled':''}><option value="receivable">Мне должны</option><option value="payable" ${d?.direction==='payable'?'selected':''}>Я должен</option></select></label><div class="field-row">${moneyInput('amount','Общая сумма долга, ₽',d?.amount)}<label class="field">Дата возврата<input name="dueDate" type="date" value="${d?.dueDate||F.today()}" required></label></div><label class="field">Счет по умолчанию<select name="walletId">${walletOptions(d?.walletId||draft.walletId)}</select></label>${scopeField(d?.scope)}<p class="helper-text">Создание долга не меняет баланс. Каждый платеж создаст ${d?.direction==='payable'?'расход':'доход или расход по направлению долга'} и уменьшит остаток. ${progress?.paid?'Уже погашено '+F.money(progress.paid)+'. Общую сумму нельзя уменьшить ниже этой величины.':''} Изменение счета не переносит прошлые платежи.</p>${formActions('Сохранить',d?`<button type="button" class="button danger" data-delete-debt="${esc(id)}">Удалить</button>`:'')}</form>`);
}
function debtPaymentModal(id){
  const debt=state.debts.find(d=>d.id===id);if(!debt)return;
  const progress=F.debtProgress(state,id);
  showModal('Внести платеж по долгу',`<p class="recurring-summary"><strong>${esc(debt.name)}</strong><br>Осталось ${F.money(progress.remaining)} из ${F.money(progress.total)}. ${debt.direction==='payable'?'Платеж будет записан как расход.':'Возврат будет записан как доход.'}</p><form id="debt-payment-form" data-id="${esc(id)}">${moneyInput('amount','Сумма платежа, ₽')}<button type="button" class="text-button" data-debt-full="${esc(id)}">Весь остаток — ${F.money(progress.remaining)}</button><div class="field-row"><label class="field">Дата платежа<input name="date" type="date" value="${F.today()}" max="${F.today()}" required></label><label class="field">Счет<select name="walletId">${walletOptions(debt.walletId)}</select></label></div><label class="field">Заметка<input name="note" maxlength="200" placeholder="Необязательно"></label>${formActions('Записать платеж')}</form>`);
  $('#debt-payment-form [name="amount"]').max=progress.remaining/100;
}
function debtHistoryModal(id){
  const debt=state.debts.find(d=>d.id===id), p=F.debtProgress(state,id);
  showModal('История платежей',`<p class="recurring-summary"><strong>${esc(debt.name)}</strong><br>Общая сумма ${F.money(p.total)} · погашено ${F.money(p.paid)}<br>Остаток ${F.money(p.remaining)}</p><div class="debt-payments">${p.payments.length?p.payments.map(t=>`<button class="payment-row full-width" data-edit-tx="${esc(t.id)}"><span>${dateLabel(t.date)} · ${esc(state.wallets.find(w=>w.id===t.walletId)?.name)}<small>${esc(t.note)}</small></span><strong>${F.money(t.amount)}</strong>${icon('pencil')}</button>`).join(''):'<p class="helper-text">Платежей пока нет. Нажмите «Внести платеж» на карточке долга.</p>'}</div>${p.remaining?`<button class="button primary full-width" data-pay-debt="${esc(id)}">Внести платеж</button>`:''}`);
}
function recurringPaymentModal(id){
  const sub=state.subscriptions.find(s=>s.id===id);if(!sub)return;
  const status=F.recurringStatus(state,id);
  if(status.recorded){notify('Операция за этот месяц уже обработана',true);return;}
  showModal(sub.type==='income'?'Записать постоянный доход':'Записать ежемесячный расход',`<p class="recurring-summary"><strong>${esc(sub.name)}</strong><br>За ${new Date(status.month+'-01T12:00:00').toLocaleDateString('ru-RU',{month:'long',year:'numeric'})}. В этом месяце будет только одна запись по шаблону.</p><form id="recurring-payment-form" data-id="${esc(id)}" data-month="${status.month}">${moneyInput('amount','Сумма, ₽',sub.amount)}<div class="field-row"><label class="field">Дата операции<input name="date" type="date" value="${F.today()}" max="${F.today()}" required></label><label class="field">Счет<select name="walletId">${walletOptions(sub.walletId)}</select></label></div>${formActions('Записать')}</form>`);
}
function syncScheduled(){
  if(modal.open||document.activeElement?.matches('input,select,textarea')||document.activeElement?.closest('form'))return;
  try{
    const next=structuredClone(state), created=F.processRecurring(next);
    if(created.length)commit(s=>Object.assign(s,next),`По расписанию записано операций: ${created.length}`);
  }catch(e){notify('Автозапись: '+e.message,true);}
}
function confirmModal(title,body,action,label='Подтвердить',danger=false){showModal(title,`<p class="confirm-copy">${body}</p><div class="modal-actions"><button class="button ghost" data-action="close-modal">Отмена</button><button class="button ${danger?'danger':'primary'}" id="confirm-action">${label}</button></div>`);$('#confirm-action').addEventListener('click',()=>{action();},{once:true});}
function download(content,filename,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function exportJSON(){download(JSON.stringify(state,null,2),`potok-${demo?'demo-':''}${F.today()}.json`,'application/json');notify('Резервная копия скачана');}
function importJSON(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{const file=input.files[0];if(!file)return;try{if(file.size>10*1024*1024)throw Error('Файл больше 10 МБ');const imported=F.validateState(JSON.parse(await file.text()));confirmModal('Заменить текущую базу?',`Файл «${esc(file.name)}»: ${imported.transactions.length} операций, ${imported.wallets.length} счетов, ${imported.goals.length} целей.<br><br>Текущая база будет заменена. Для надежности сначала скачайте свою резервную копию.`,()=>{if(commit(s=>{Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,imported);},'База успешно импортирована')){draft=newDraft();closeModal();render();syncScheduled();}},'Импортировать');}catch(e){notify('Импорт отменен: '+(e.message||'Некорректный JSON'),true);}};input.click();}

document.addEventListener('click',event=>{
  const b=event.target.closest('button,a');if(!b)return;
  if(b.dataset.nav){if(modal.open)closeModal();navigate(b.dataset.nav);return;}
  if(b.dataset.scope){scope=b.dataset.scope;render();return;}
  if(b.dataset.draftType){draft.type=b.dataset.draftType;render();return;}
  if(b.dataset.category){draft.categoryId=b.dataset.category;$$('[data-category]').forEach(x=>x.classList.toggle('active',x===b));return;}
  if(b.dataset.tag){const tag=b.dataset.tag;draft.tags=draft.tags.includes(tag)?draft.tags.filter(t=>t!==tag):[...draft.tags,tag];b.classList.toggle('active');return;}
  if(b.dataset.key){const key=b.dataset.key;if(key==='⌫')draft.expression=draft.expression.slice(0,-1);else if(draft.expression.length<80)draft.expression+=({'÷':'/','×':'*','−':'-'}[key]||key);$('#expression').value=draft.expression;updateAmount();return;}
  if(b.dataset.editTx){txModal(b.dataset.editTx);return;}
  if(b.dataset.editWallet){walletModal(b.dataset.editWallet);return;}
  if(b.dataset.editCategory){categoryModal(b.dataset.editCategory);return;}
  if(b.dataset.editSub){subscriptionModal(b.dataset.editSub);return;}
  if(b.dataset.editGoal){goalModal(b.dataset.editGoal);return;}
  if(b.dataset.fundGoal){fundModal(b.dataset.fundGoal);return;}
  if(b.dataset.editDebt){debtModal(b.dataset.editDebt);return;}
  if(b.dataset.deleteTx){const id=b.dataset.deleteTx;confirmModal('Удалить операцию?','Баланс счета и связанные цели или долги пересчитаются автоматически.',()=>{if(commit(s=>F.deleteTransaction(s,id),'Операция удалена'))closeModal();},'Удалить',true);return;}
  if(b.dataset.paySub){recurringPaymentModal(b.dataset.paySub);return;}
  if(b.dataset.payDebt){debtPaymentModal(b.dataset.payDebt);return;}
  if(b.dataset.debtHistory){debtHistoryModal(b.dataset.debtHistory);return;}
  if(b.dataset.debtFull){const p=F.debtProgress(state,b.dataset.debtFull);$('#debt-payment-form [name="amount"]').value=p.remaining/100;return;}
  for(const kind of ['wallet','category','sub','goal','debt']){
    const id=b.dataset['delete'+kind[0].toUpperCase()+kind.slice(1)];if(!id)continue;
    const prop={wallet:'wallets',category:'categories',sub:'subscriptions',goal:'goals',debt:'debts'}[kind];
    if(kind==='wallet'&&(state.wallets.length<=1||state.transactions.some(t=>t.walletId===id||t.toWalletId===id)||state.subscriptions.some(s=>s.walletId===id)||state.debts.some(d=>d.walletId===id))){notify('Счет используется в записях или является последним. Сначала перенесите связанные записи.',true);return;}
    if(kind==='category'&&(state.transactions.some(t=>t.categoryId===id)||state.subscriptions.some(t=>t.categoryId===id)||state.categories.filter(c=>c.type===state.categories.find(x=>x.id===id).type).length<=1)){notify('Категория используется в операциях или является последней для этого типа.',true);return;}
    if(kind==='goal'&&state.transactions.some(t=>t.goalId===id)){notify('Сначала удалите пополнения цели в истории — средства вернутся на счета.',true);return;}
    if(kind==='debt'&&state.transactions.some(t=>t.debtId===id)){notify('Сначала удалите связанную операцию погашения в истории.',true);return;}
    confirmModal(kind==='sub'?'Удалить ежемесячный шаблон?':'Удалить запись?',kind==='sub'?'Будущие повторения прекратятся. Все уже записанные доходы и расходы останутся в истории и сохранят свой баланс.':'Это действие удалит выбранную запись.',()=>{if(commit(s=>{if(kind==='sub')F.deleteRecurring(s,id);else s[prop]=s[prop].filter(x=>x.id!==id);},kind==='sub'?'Шаблон удален, история сохранена':'Запись удалена')){draft=newDraft();closeModal();render();}},'Удалить',true);return;
  }
  switch(b.dataset.action){
    case 'close-modal':closeModal();break;
    case 'save-tx':saveDraft();break;
    case 'wallets':walletsModal();break;
    case 'new-wallet':walletModal();break;
    case 'categories':categoriesModal();break;
    case 'new-category':categoryModal();break;
    case 'new-sub':subscriptionModal();break;
    case 'new-income-sub':subscriptionModal(undefined,'income');break;
    case 'cache-reset':confirmModal('Сбросить офлайн-кэш?','Приложение проверит соединение, удалит только файлы интерфейса и загрузит свежую версию. Финансовая база и резервная копия сохранятся.',async()=>{const button=$('#confirm-action');button.disabled=true;button.textContent='Проверяем обновление…';try{await resetAppCache();}catch(e){closeModal();notify(e.message,true);}},'Обновить приложение');break;
    case 'new-goal':goalModal();break;
    case 'new-debt':debtModal();break;
    case 'budget-info':{const b=F.safeBudget(state,{scope});showModal('Какой бюджет безопасен?',`<div class="budget-explanation"><p>Рассчитывается на текущий месяц, независимо от периода графиков.</p><div><span>Доступно на счетах</span><strong>${F.money(F.totalBalance(state,scope))}</strong></div><div><span>Резерв на предстоящие платежи</span><strong>− ${F.money(b.reserved)}</strong></div><div><span>Свободно после резерва</span><strong>${F.money(b.free)}</strong></div><div><span>Дней, включая сегодня</span><strong>${b.daysLeft}</strong></div><div><span>Можно потратить сегодня</span><strong>${F.money(b.daily)}</strong></div><p class="helper-text">${scope==='all'&&state.settings.monthlyLimit?'Учитывается также остаток месячного лимита: '+F.money(b.remainingLimit)+'. ':''}Уже пополненные копилки исключены из счетов. Баланс контура рассчитывается по принадлежности счетов; расходы — по контуру операции. Будущие доходы не учитываются. Если потратить больше, следующий день пересчитается по оставшимся деньгам. Ежемесячный расход без записи за текущий месяц резервируется до конца месяца, даже если его дата прошла.</p></div><button class="button secondary full-width" data-nav="settings" data-action="close-modal">Настроить лимит</button>`);break;}
    case 'add-tag':showModal('Быстрый тег',`<form id="tag-form"><label class="field">Название тега<input name="tag" maxlength="30" placeholder="Например, обед" required></label>${formActions('Добавить')}</form>`);break;
    case 'demo':if(demo){state=realState;realState=null;demo=false;}else{realState=state;state=F.createState({demo:true});demo=true;}draft=newDraft();render();notify(demo?'Включены демоданные. Ваши записи сохранены отдельно.':'Вы вернулись к своим данным');break;
    case 'csv':download(F.csvExport(filteredTransactions(),state),`potok-operations-${F.today()}.csv`,'text/csv;charset=utf-8');notify('CSV выгружен с текущими фильтрами');break;
    case 'export':exportJSON();break;
    case 'raw-export':download(localStorage.getItem(KEY)||localStorage.getItem(LEGACY_KEY)||'{}',`potok-recovery-${F.today()}.json`,'application/json');break;
    case 'import':importJSON();break;
    case 'install':if(installPrompt){installPrompt.prompt();installPrompt.userChoice.then(()=>{installPrompt=null;});}else showModal('Установить Поток',`<p class="confirm-copy">Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран».<br><br>На iPhone в Safari: кнопка «Поделиться» → «На экран Домой».<br><br>Установка доступна при открытии через HTTPS. Сначала откройте приложение онлайн, чтобы сохранить его для работы без интернета.</p><button class="button primary full-width" data-action="close-modal">Понятно</button>`);break;
    case 'reset':confirmModal('Начать с чистого листа?','Все данные этой базы будут удалены. Скачайте JSON, если хотите сохранить их.',()=>{if(commit(s=>{Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,F.createState());},'База очищена')){if(!demo){localStorage.removeItem(KEY+'.backup');localStorage.removeItem(LEGACY_KEY);localStorage.removeItem(LEGACY_KEY+'.backup');}draft=newDraft();closeModal();render();}},'Удалить все',true);break;
  }
});
document.addEventListener('input',e=>{
  if(e.target.id==='expression'){draft.expression=e.target.value;updateAmount();}
  if(e.target.id==='draft-note')draft.note=e.target.value;
  if(e.target.id==='history-search'){query=e.target.value;refreshHistory();}
  const map={'min-amount':v=>minAmount=v,'max-amount':v=>maxAmount=v,'date-from':v=>dateFrom=v,'date-to':v=>dateTo=v};
  if(map[e.target.id]){map[e.target.id](e.target.value);refreshHistory();}
});
document.addEventListener('change',e=>{
  const v=e.target.value;
  if(e.target.form?.id==='sub-form'&&e.target.name==='type'){$('#sub-form [name="categoryId"]').innerHTML=categoryOptions(v);return;}
  switch(e.target.id){case'global-period':period=v;render();break;case'draft-wallet':draft.walletId=v;break;case'draft-to-wallet':draft.toWalletId=v;break;case'draft-date':draft.date=v;break;case'draft-scope':draft.scope=v;break;case'type-filter':typeFilter=v;refreshHistory();break;case'category-filter':categoryFilter=v;refreshHistory();break;}
});
document.addEventListener('submit',e=>{
  e.preventDefault();const form=e.target,d=new FormData(form),id=form.dataset.id;
  const str=k=>String(d.get(k)||'').trim();const amount=k=>F.parseAmount(str(k));
  try{
    let success=false;
    switch(form.id){
      case 'budget-form':success=commit(s=>s.settings.monthlyLimit=amount('limit'),'Лимит сохранен');break;
      case 'tag-form':{const tag=str('tag').replace(/^#+/,'').replace(/\s+/g,'-');if(!tag)throw Error('Введите тег');draft.tags=[...new Set([...draft.tags,tag])];closeModal();render();return;}
      case 'wallet-form':success=commit(s=>{const value={id:id||F.uid(),name:str('name'),initialBalance:amount('balance'),kind:str('kind'),color:str('color')};if(id)s.wallets[s.wallets.findIndex(w=>w.id===id)]=value;else s.wallets.push(value);},'Счет сохранен');break;
      case 'category-form':success=commit(s=>{const old=s.categories.find(c=>c.id===id),value={id:id||F.uid(),name:str('name'),type:old?.type||str('type'),icon:str('icon'),color:str('color')};if(id)s.categories[s.categories.findIndex(c=>c.id===id)]=value;else s.categories.push(value);},'Категория сохранена');break;
      case 'tx-form':success=commit(s=>{const old=s.transactions.find(t=>t.id===id),value={...old,amount:amount('amount'),date:str('date'),walletId:str('walletId'),scope:str('scope'),note:str('note'),tags:str('tags').split(',').map(t=>t.trim().replace(/^#+/,'' )).filter(Boolean).slice(0,15)};if(old.type==='transfer')value.toWalletId=str('toWalletId');else if(old.type!=='goal')value.categoryId=str('categoryId');F.updateTransaction(s,id,value);s.tags=[...new Set([...value.tags,...s.tags])].slice(0,30);},'Операция обновлена');break;
      case 'sub-form':success=commit(s=>{const old=s.subscriptions.find(x=>x.id===id),value={id:id||F.uid(),name:str('name'),amount:amount('amount'),day:Number(str('day')),walletId:str('walletId'),scope:str('scope'),type:old?.type||str('type'),categoryId:str('categoryId'),startDate:str('startDate'),auto:d.has('auto')};if(id)s.subscriptions[s.subscriptions.findIndex(x=>x.id===id)]=value;else s.subscriptions.push(value);F.processRecurring(s);},'Ежемесячный шаблон сохранен');break;
      case 'debt-payment-form':success=commit(s=>{const debt=s.debts.find(x=>x.id===id);F.payDebt(s,id,amount('amount'),{date:str('date'),...(str('walletId')!==debt.walletId?{walletId:str('walletId')} : {}),...(str('note')?{note:str('note')}:{})});},'Платеж записан, остаток пересчитан');break;
      case 'recurring-payment-form':success=commit(s=>F.recordRecurring(s,id,form.dataset.month,{date:str('date'),amount:amount('amount'),walletId:str('walletId')}),'Ежемесячная операция записана');break;
      case 'goal-form':success=commit(s=>{const old=s.goals.find(g=>g.id===id),value={id:id||F.uid(),name:str('name'),target:amount('target'),saved:old?.saved||0,color:str('color')};if(id)s.goals[s.goals.findIndex(g=>g.id===id)]=value;else s.goals.push(value);},'Цель сохранена');break;
      case 'fund-form':success=commit(s=>F.fundGoal(s,id,str('walletId'),amount('amount')),'Копилка пополнена');break;
      case 'debt-form':success=commit(s=>{const old=s.debts.find(x=>x.id===id),value={id:id||F.uid(),name:str('name'),amount:amount('amount'),dueDate:str('dueDate'),direction:old&&F.debtProgress(s,id).paid?old.direction:str('direction'),walletId:str('walletId'),scope:str('scope'),settled:false};if(id)F.updateDebt(s,id,value);else s.debts.push(value);},'Долг сохранен');break;
    }
    if(success){closeModal();if(!state.wallets.some(w=>w.id===draft.walletId))draft=newDraft();render();}
  }catch(err){notify(err.message,true);}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&!modal.open&&['expression','draft-note'].includes(e.target.id)){e.preventDefault();saveDraft();}});
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(titles[next]&&next!==page){page=next;render();}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
window.addEventListener('storage',e=>{if(e.key===LEGACY_KEY&&localStorage.getItem(KEY)){notify('В другой вкладке открыта старая версия Потока. Обновите ее перед записью операций.',true);return;}if(e.key===KEY&&!demo){try{state=F.validateState(JSON.parse(e.newValue));draft=newDraft();render();notify('Данные обновлены в другой вкладке');}catch{notify('База изменена в другой вкладке. Перезагрузите приложение.',true);}}});
window.addEventListener('online',()=>{$$('.offline-badge').forEach(el=>el.hidden=true);notify('Подключение восстановлено');});
window.addEventListener('offline',()=>{$$('.offline-badge').forEach(el=>el.hidden=false);notify('Работаем офлайн. Записи сохраняются как обычно.');});
if('serviceWorker'in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>notify('Офлайн-кэш пока недоступен. Учет продолжает работать локально.',true));});
render();
syncScheduled();
window.addEventListener('focus',syncScheduled);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncScheduled();});
setInterval(()=>{if(document.visibilityState==='visible')syncScheduled();},60000);
