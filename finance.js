/** Поток: money is stored exclusively as integer kopecks. No network or storage. */
const MAX = Number.MAX_SAFE_INTEGER;
const clone = value => structuredClone(value);
const fail = message => { throw new Error(message); };
const check = (condition, message) => { if (!condition) fail(message); };
const integer = (value, name, positive = false) => check(Number.isSafeInteger(value) && (positive ? value > 0 : value >= 0), `${name}: укажите корректную сумму в копейках`);
const str = (value, name, nonempty = false) => check(typeof value === 'string' && value.length <= 10000 && (!nonempty || value.trim().length > 0), `${name}: требуется текст`);
const sumSafe = (a, b) => { const result = a + b; check(Number.isSafeInteger(result), 'Сумма превышает допустимый размер'); return result; };
const enumValue = (value, values, name) => check(values.includes(value), `${name}: недопустимое значение`);
export function uid() { return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`; }
function formatDate(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function today() { return formatDate(new Date()); }
function dateParts(value) {
  check(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), 'Дата должна иметь формат ГГГГ-ММ-ДД');
  const [y,m,d] = value.split('-').map(Number);
  check(y >= 1900 && y <= 9999 && m >= 1 && m <= 12 && d >= 1 && d <= new Date(y,m,0).getDate(), 'Указана несуществующая дата');
  return [y,m,d];
}
function shiftDate(value, days) { const [y,m,d] = dateParts(value); return formatDate(new Date(y,m-1,d+days,12)); }
function monthStart(value) { return `${value.slice(0,7)}-01`; }
function dayNumber(value) { const [y,m,d] = dateParts(value); return Date.UTC(y,m-1,d)/86400000; }
function dueDate(y,m,day) { return `${y}-${String(m).padStart(2,'0')}-${String(Math.min(day,new Date(y,m,0).getDate())).padStart(2,'0')}`; }
export function money(kopecks) {
  check(Number.isSafeInteger(kopecks), 'Некорректная сумма');
  return new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',minimumFractionDigits:0,maximumFractionDigits:2}).format(kopecks/100);
}

/** Exact rational arithmetic, deliberately not eval/Function. Rounds half away from zero. */
export function parseAmount(expression) {
  check(typeof expression === 'string' || typeof expression === 'number', 'Введите сумму или выражение');
  const source = String(expression).trim();
  check(source.length > 0 && source.length <= 256, 'Введите выражение длиной до 256 символов');
  const tokens = source.match(/(?:\d+(?:[.,]\d*)?|[.,]\d+)|[()+\-*/]/g) ?? [];
  check(tokens.join('') === source.replace(/\s/g,''), 'В выражении есть недопустимые символы');
  let index = 0;
  const gcd = (a,b) => { a = a < 0n ? -a : a; while(b) [a,b] = [b,a%b]; return a; };
  function rational(n,d = 1n) {
    check(d !== 0n, 'Деление на ноль');
    if(d < 0n) { n = -n; d = -d; }
    const g = gcd(n,d); n /= g; d /= g;
    check(n.toString().length <= 512 && d.toString().length <= 512, 'Выражение слишком сложное');
    return [n,d];
  }
  function atom() {
    const token = tokens[index++];
    if(token === '+' || token === '-') { const [n,d] = atom(); return [token === '-' ? -n : n,d]; }
    if(token === '(') { const result = expr(); check(tokens[index++] === ')', 'Не закрыта скобка'); return result; }
    check(token !== undefined && /^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(token), 'Некорректное выражение');
    const [whole, decimal = ''] = token.replace(',','.').split('.');
    return rational(BigInt((whole || '0') + decimal),10n**BigInt(decimal.length));
  }
  function product() {
    let [n,d] = atom();
    while(tokens[index] === '*' || tokens[index] === '/') {
      const op = tokens[index++], [b,c] = atom();
      [n,d] = op === '*' ? rational(n*b,d*c) : rational(n*c,d*b);
    }
    return [n,d];
  }
  function expr() {
    let [n,d] = product();
    while(tokens[index] === '+' || tokens[index] === '-') {
      const op = tokens[index++], [b,c] = product();
      [n,d] = rational(n*c+(op === '+' ? b : -b)*d,d*c);
    }
    return [n,d];
  }
  const [n,d] = expr(); check(index === tokens.length, 'Некорректное выражение');
  const absolute = (n < 0n ? -n : n)*100n;
  const rounded = (absolute/d + (absolute%d*2n >= d ? 1n : 0n))*(n < 0n ? -1n : 1n);
  check(rounded <= BigInt(MAX) && rounded >= -BigInt(MAX), 'Сумма слишком велика');
  return Number(rounded);
}

const BASE_CATEGORIES = [
 ['food','Еда и продукты','expense','utensils','#f59e0b'],['transport','Транспорт','expense','car','#3b82f6'],
 ['shopping','Покупки','expense','shopping-bag','#a78bfa'],['work-expense','Работа и бизнес','expense','briefcase-business','#64748b'],
 ['subscriptions','Подписки','expense','repeat','#ec4899'],['health','Здоровье','expense','heart-pulse','#ef4444'],
 ['home','Дом и счета','expense','house','#14b8a6'],['leisure','Отдых','expense','coffee','#f97316'],
 ['other-expense','Другое','expense','ellipsis','#94a3b8'],['salary','Зарплата','income','banknote','#22c55e'],
 ['freelance','Фриланс','income','laptop','#2dd4bf'],['other-income','Другой доход','income','circle-plus','#84cc16']
];
export function createState({demo = false} = {}) {
  const state = {
    schemaVersion:2,
    wallets:[{id:'card',name:'Основная карта',initialBalance:0,kind:'personal',color:'#b6f36a'},
      {id:'cash',name:'Наличные',initialBalance:0,kind:'personal',color:'#f6c875'},
      {id:'savings',name:'Накопления',initialBalance:0,kind:'personal',color:'#a78bfa'},
      {id:'business',name:'Бизнес-счёт',initialBalance:0,kind:'business',color:'#69c9e8'}],
    categories:BASE_CATEGORIES.map(([id,name,type,icon,color])=>({id,name,type,icon,color})),
    transactions:[],subscriptions:[],recurringRuns:[],goals:[],debts:[],settings:{monthlyLimit:0,currency:'RUB'},tags:[]
  };
  if(!demo) return state;
  state.wallets.forEach((w,i)=>w.initialBalance=[18500000,780000,24500000,19800000][i]);
  state.settings.monthlyLimit=11000000;
  state.tags=['важное','дом','работа','регулярное'];
  const now = today(), [year,month] = dateParts(now);
  for(let offset=5;offset>=0;offset--) {
    const base=new Date(year,month-1-offset,1,12), y=base.getFullYear(), m=base.getMonth()+1;
    const add=(day,type,amount,categoryId,note,walletId='card',scope='personal')=>{
      const date=dueDate(y,m,day); if(date>now) return;
      state.transactions.push({id:uid(),type,amount,date,walletId,categoryId,scope,note,tags:[]});
    };
    add(5,'income',16500000,'salary','Зарплата за месяц');
    add(12,'income',5800000+offset*250000,'freelance','Дизайн и консультации','business','business');
    add(2,'expense',3800000,'home','Аренда квартиры');
    add(7,'expense',786000+offset*21000,'food','Продукты на неделю');
    add(10,'expense',219000,'transport','Такси и проезд');
    add(14,'expense',349000,'shopping','Покупки для дома');
    add(17,'expense',650000,'work-expense','Сервисы для работы','business','business');
    add(20,'expense',325000,'health','Здоровье и спорт');
    add(23,'expense',485000,'leisure','Ужин с друзьями');
    add(25,'expense',649000,'food','Продукты');
  }
  for(let offset=0;offset<7;offset++) state.transactions.push({id:uid(),type:'expense',amount:[48500,128000,34900,215000,67000,89000,152000][offset],date:shiftDate(now,-offset),walletId:offset===3?'cash':'card',categoryId:offset%3===0?'transport':'food',scope:'personal',note:['Такси домой','Продукты в супермаркете','Кофе и завтрак','Проезд и поездки','Обед','Покупки к ужину','Продукты на выходные'][offset],tags:offset===1?['дом']:[]});
  state.subscriptions=[{id:'sub-music',name:'Яндекс Плюс',amount:39900,day:28,walletId:'card',scope:'personal'},
    {id:'sub-cloud',name:'Облачное хранилище',amount:24900,day:15,walletId:'card',scope:'personal'},
    {id:'sub-design',name:'Дизайн-сервисы',amount:240000,day:30,walletId:'business',scope:'business'}];
  state.subscriptions=state.subscriptions.map(sub=>({...sub,type:'expense',categoryId:'subscriptions',auto:false,startDate:monthStart(now)}));
  state.goals=[{id:'goal-trip',name:'Путешествие',target:30000000,saved:10500000,color:'#b6f36a'},
    {id:'goal-buffer',name:'Финансовая подушка',target:60000000,saved:24000000,color:'#a78bfa'},
    {id:'goal-laptop',name:'Новый ноутбук',target:22000000,saved:6500000,color:'#69c9e8'}];
  state.debts=[{id:'debt-friend',name:'Алексей · вернёт за билеты',amount:650000,dueDate:shiftDate(now,5),direction:'receivable',walletId:'card',scope:'personal',settled:false},
    {id:'debt-project',name:'Оплата подрядчику',amount:1800000,dueDate:shiftDate(now,9),direction:'payable',walletId:'business',scope:'business',settled:false}];
  state.transactions.push({id:uid(),type:'goal',amount:500000,date:shiftDate(now,-2),walletId:'card',scope:'personal',note:'На путешествие',tags:[],goalId:'goal-trip'});
  // The saved total includes this contribution; baseline savings live outside spendable wallets.
  return validateState(state);
}

export function validateState(input) {
  check(input && typeof input==='object' && !Array.isArray(input), 'Файл должен содержать объект данных');
  check(input.schemaVersion===1||input.schemaVersion===2, 'Неподдерживаемая версия файла');
  let s; try { s=clone(input); } catch { fail('Файл содержит неподдерживаемые данные'); }
  const legacy=s.schemaVersion===1;
  for(const name of ['wallets','categories','transactions','subscriptions','goals','debts','tags']) check(Array.isArray(s[name]), `Отсутствует список: ${name}`);
  if(legacy) {
    s.schemaVersion=2;
    s.recurringRuns=[];
    for(const sub of s.subscriptions) {
      check(sub && typeof sub==='object','Некорректный регулярный платёж');
      sub.type??='expense';sub.auto??=false;sub.startDate??=monthStart(today());
      sub.categoryId??=s.categories.find(c=>c.id==='subscriptions'&&c.type===sub.type)?.id??s.categories.find(c=>c.type===sub.type)?.id;
    }
    for(const t of s.transactions) {
      check(t && typeof t==='object','Некорректная операция');
      if(t.subscriptionId!==undefined) {
        const sub=s.subscriptions.find(sub=>sub.id===t.subscriptionId);
        check(sub&&t.type===sub.type,'Некорректная подписка операции');
        dateParts(t.date);t.recurrenceMonth??=t.date.slice(0,7);
        if(!s.recurringRuns.some(r=>r.subscriptionId===t.subscriptionId&&r.month===t.recurrenceMonth))s.recurringRuns.push({subscriptionId:t.subscriptionId,month:t.recurrenceMonth});
      }
    }
    for(const d of s.debts) {
      check(d && typeof d==='object','Некорректный долг');
      d.settled=s.transactions.filter(t=>t.debtId===d.id).reduce((n,t)=>sumSafe(n,t.amount),0)===d.amount;
    }
  }
  check(Array.isArray(s.recurringRuns),'Отсутствует список: recurringRuns');
  check(s.settings && typeof s.settings==='object' && !Array.isArray(s.settings), 'Отсутствуют настройки');
  integer(s.settings.monthlyLimit,'Месячный лимит'); check(s.settings.currency==='RUB','Поддерживается только валюта RUB');
  check(s.wallets.length > 0, 'Добавьте хотя бы один счёт');
  for(const type of ['income','expense']) check(s.categories.some(c=>c && typeof c==='object' && c.type===type), 'Нужна хотя бы одна категория доходов и расходов');
  const allIds=new Set();
  function records(list,label) { for(const item of list) {
    check(item && typeof item==='object' && !Array.isArray(item),`${label}: некорректная запись`);
    str(item.id,`${label}: ID`,true); check(!allIds.has(item.id),'Идентификаторы записей должны быть уникальными'); allIds.add(item.id);
  } }
  for(const key of ['wallets','categories','transactions','subscriptions','goals','debts']) records(s[key],key);
  const wallets=new Map(s.wallets.map(x=>[x.id,x])), categories=new Map(s.categories.map(x=>[x.id,x])), goals=new Map(s.goals.map(x=>[x.id,x])), debts=new Map(s.debts.map(x=>[x.id,x])), subs=new Map(s.subscriptions.map(x=>[x.id,x]));
  const scope=v=>enumValue(v,['personal','business'],'Область учёта');
  const wallet=(id)=>check(wallets.has(id),'Указан неизвестный счёт');
  const color=value=>{str(value,'Цвет');check(/^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(value),'Некорректный цвет');};
  for(const w of s.wallets) { str(w.name,'Название счёта',true); check(Number.isSafeInteger(w.initialBalance),'Некорректный начальный баланс'); scope(w.kind); color(w.color); }
  for(const c of s.categories) { str(c.name,'Название категории',true);enumValue(c.type,['expense','income'],'Тип категории');str(c.icon,'Значок',true);check(/^[a-z][a-z0-9-]*$/.test(c.icon),'Некорректное имя значка');color(c.color); }
  for(const g of s.goals) {str(g.name,'Название цели',true);integer(g.target,'Сумма цели',true);integer(g.saved,'Накоплено');color(g.color);}
  for(const sub of s.subscriptions) {str(sub.name,'Название подписки',true);integer(sub.amount,'Сумма подписки',true);check(Number.isInteger(sub.day)&&sub.day>=1&&sub.day<=31,'День подписки должен быть от 1 до 31');wallet(sub.walletId);scope(sub.scope);enumValue(sub.type,['expense','income'],'Тип регулярного платежа');check(categories.has(sub.categoryId)&&categories.get(sub.categoryId).type===sub.type,'Категория не соответствует типу регулярного платежа');check(typeof sub.auto==='boolean','Некорректный автоматический режим');dateParts(sub.startDate);}
  for(const d of s.debts) {str(d.name,'Название долга',true);integer(d.amount,'Сумма долга',true);dateParts(d.dueDate);enumValue(d.direction,['receivable','payable'],'Тип долга');wallet(d.walletId);scope(d.scope);check(typeof d.settled==='boolean','Некорректный статус долга');}
  const runKeys=new Set();
  for(const run of s.recurringRuns) {
    check(run&&typeof run==='object'&&!Array.isArray(run)&&subs.has(run.subscriptionId),'Некорректная запись регулярного платежа');
    validMonth(run.month);const key=runKey(run.subscriptionId,run.month);check(!runKeys.has(key),'Регулярный платёж за этот месяц уже записан');runKeys.add(key);
  }
  const goalContributions=new Map(), settlements=new Map();
  for(const t of s.transactions) {
    enumValue(t.type,['expense','income','transfer','goal'],'Тип операции');integer(t.amount,'Сумма операции',true);dateParts(t.date);wallet(t.walletId);scope(t.scope);str(t.note,'Заметка');check(Array.isArray(t.tags),'Теги операции должны быть списком'); t.tags.forEach(tag=>str(tag,'Тег',true));
    if(t.type==='transfer') {wallet(t.toWalletId);check(t.toWalletId!==t.walletId,'Счета перевода должны отличаться');}
    else check(t.toWalletId===undefined,'Получатель допустим только для перевода');
    if(t.type==='income'||t.type==='expense') {check(categories.has(t.categoryId)&&categories.get(t.categoryId).type===t.type,'Категория не соответствует типу операции');}
    else check(t.categoryId===undefined,'Категория недопустима для этой операции');
    if(t.type==='goal') {check(goals.has(t.goalId),'Указана неизвестная цель');goalContributions.set(t.goalId,sumSafe(goalContributions.get(t.goalId)||0,t.amount));}
    else check(t.goalId===undefined,'Цель допустима только для накопления');
    if(t.subscriptionId!==undefined) {check(['expense','income'].includes(t.type)&&subs.has(t.subscriptionId),'Некорректная подписка операции');t.recurrenceMonth??=t.date.slice(0,7);validMonth(t.recurrenceMonth);const key=runKey(t.subscriptionId,t.recurrenceMonth);if(!runKeys.has(key)) {s.recurringRuns.push({subscriptionId:t.subscriptionId,month:t.recurrenceMonth});runKeys.add(key);}}
    else check(t.recurrenceMonth===undefined,'Месяц регулярного платежа требует связи с шаблоном');
    check(t.subscriptionId===undefined||t.debtId===undefined,'Операция не может одновременно относиться к долгу и регулярному платежу');
    if(t.debtId!==undefined) {const d=debts.get(t.debtId);check(d,'Некорректный долг операции');check(t.type===(d.direction==='receivable'?'income':'expense'),'Операция не соответствует направлению долга');settlements.set(d.id,sumSafe(settlements.get(d.id)||0,t.amount));}
  }
  for(const g of s.goals) check((goalContributions.get(g.id)||0)<=g.saved,'Накоплено по цели меньше суммы её операций');
  for(const d of s.debts) {const paid=settlements.get(d.id)||0;check(paid<=d.amount,'Платежи превышают сумму долга');check(d.settled===(paid===d.amount),'Статус долга не соответствует сумме платежей');}
  s.tags.forEach(tag=>str(tag,'Тег',true));
  // Check all aggregate arithmetic as well as individual amounts.
  let absolute=0;
  for(const w of s.wallets) absolute=sumSafe(absolute,Math.abs(w.initialBalance));
  for(const t of s.transactions) absolute=sumSafe(absolute,t.amount);
  for(const list of [s.goals,s.debts,s.subscriptions]) {let total=0;for(const r of list)total=sumSafe(total,r.amount??r.saved);}
  s.goals.reduce((total,g)=>sumSafe(total,g.target),0);
  for(const w of s.wallets) walletBalance(s,w.id);
  totalBalance(s);
  return s;
}

export function walletBalance(state,id,now=today()) {
  dateParts(now);
  const wallet=state.wallets.find(w=>w.id===id);check(wallet,'Счёт не найден');
  return state.transactions.reduce((balance,t)=> {
    if(t.date>now) return balance;
    if(t.walletId===id) balance=sumSafe(balance,t.type==='income'?t.amount:-t.amount);
    if(t.type==='transfer'&&t.toWalletId===id) balance=sumSafe(balance,t.amount);
    return balance;
  },wallet.initialBalance);
}
export function totalBalance(state,scope='all',now=today()) {
  dateParts(now);
  return state.wallets.filter(w=>scope==='all'||w.kind===scope).reduce((n,w)=>sumSafe(n,walletBalance(state,w.id,now)),0);
}
export function periodTransactions(state,period='month',scope='all',now=today()) {
  dateParts(now);enumValue(period,['week','month','all'],'Период');
  const from=period==='month'?monthStart(now):period==='week'?shiftDate(now,-6):'0000-01-01';
  return state.transactions.filter(t=>t.date>=from&&t.date<=now&&(scope==='all'||t.scope===scope)).sort((a,b)=>b.date.localeCompare(a.date));
}
export function summary(state,{period='month',scope='all',now=today()}={}) {
  let income=0,expense=0;
  for(const t of periodTransactions(state,period,scope,now)) {if(t.type==='income')income=sumSafe(income,t.amount);if(t.type==='expense')expense=sumSafe(expense,t.amount);}
  return {income,expense,savingsRate:income>0?(income-expense)/income*100:0};
}
function validMonth(month) {check(typeof month==='string'&&/^\d{4}-\d{2}$/.test(month),'Месяц должен иметь формат ГГГГ-ММ');dateParts(`${month}-01`);return month;}
function runKey(id,month) {return JSON.stringify([id,month]);}
function nextMonth(month) {validMonth(month);const [y,m]=month.split('-').map(Number);check(y<9999||m<12,'Месяц выходит за допустимый диапазон');return m===12?`${y+1}-01`:`${y}-${String(m+1).padStart(2,'0')}`;}
function monthDue(month,day) {validMonth(month);const [y,m]=month.split('-').map(Number);return dueDate(y,m,day);}
function hasRun(state,id,month) {return (state.recurringRuns||[]).some(r=>r.subscriptionId===id&&r.month===month)||state.transactions.some(t=>t.subscriptionId===id&&(t.recurrenceMonth??t.date.slice(0,7))===month);}
export function recurringStatus(state,id,now=today()) {
  dateParts(now);const sub=state.subscriptions.find(s=>s.id===id);check(sub,'Регулярный платёж не найден');
  const month=now.slice(0,7), due=monthDue(month,sub.day), startDate=sub.startDate??'1900-01-01';
  const transaction=state.transactions.find(t=>t.subscriptionId===id&&(t.recurrenceMonth??t.date.slice(0,7))===month);
  return {month,dueDate:due,recorded:hasRun(state,id,month),...(transaction?{transaction}:{}),startDate,active:due>=startDate};
}
export function upcomingSubscriptions(state,now=today()) {
  dateParts(now);
  return state.subscriptions.map(sub=>{
    let month=now.slice(0,7), nextDate=monthDue(month,sub.day);
    if(nextDate<now||hasRun(state,sub.id,month)) {month=nextMonth(month);nextDate=monthDue(month,sub.day);}
    if(sub.startDate&&nextDate<sub.startDate) {month=sub.startDate.slice(0,7);nextDate=monthDue(month,sub.day);if(nextDate<sub.startDate)nextDate=monthDue(nextMonth(month),sub.day);}
    return {...sub,nextDate,daysUntil:dayNumber(nextDate)-dayNumber(now)};
  }).sort((a,b)=>a.nextDate.localeCompare(b.nextDate)||a.name.localeCompare(b.name,'ru'));
}
export function safeBudget(state,{scope='all',now=today()}={}) {
  const [y,m,d]=dateParts(now), daysLeft=new Date(y,m,0).getDate()-d+1;
  const transactions=periodTransactions(state,'month',scope,now);
  const monthlyExpense=transactions.filter(t=>t.type==='expense').reduce((a,t)=>sumSafe(a,t.amount),0);
  const todayExpense=transactions.filter(t=>t.type==='expense'&&t.date===now).reduce((a,t)=>sumSafe(a,t.amount),0);
  let reserved=0;
  for(const sub of state.subscriptions.filter(s=>scope==='all'||s.scope===scope)) {
    const status=recurringStatus(state,sub.id,now);
    if((sub.type??'expense')==='expense'&&status.active&&!status.recorded) reserved=sumSafe(reserved,sub.amount);
  }
  const remainingLimit=scope==='all'&&state.settings.monthlyLimit>0?Math.max(0,state.settings.monthlyLimit-monthlyExpense):null;
  let free=Math.max(0,totalBalance(state,scope,now)-reserved);
  if(remainingLimit!==null) free=Math.min(free,Math.max(0,remainingLimit-reserved));
  return {daily:Math.floor(free/daysLeft),free,reserved,daysLeft,remainingLimit,todayExpense,monthlyExpense};
}

function normalizeTx(tx) {return {id:uid(),date:today(),scope:'personal',note:'',tags:[],...clone(tx)};}
function commit(state,next) {const validated=validateState(next);Object.keys(state).forEach(key=>delete state[key]);Object.assign(state,validated);return state;}
function adjustGoal(next,t,sign) {if(t.type==='goal') {const goal=next.goals.find(g=>g.id===t.goalId);check(goal,'Цель не найдена');goal.saved=sumSafe(goal.saved,sign*t.amount);check(goal.saved>=0,'Недостаточно накоплений по цели');}}
export function addTransaction(state,tx) {
  const next=clone(state), record=normalizeTx(tx);check(record.debtId===undefined,'Для погашения долга используйте действие «Погасить»');
  if(record.subscriptionId!==undefined) {
    const month=record.recurrenceMonth??record.date.slice(0,7);validMonth(month);check(month<=today().slice(0,7)&&record.date<=today(),'Нельзя записать регулярный платёж будущим числом');check(!hasRun(next,record.subscriptionId,month),'Регулярный платёж за этот месяц уже записан');
    record.recurrenceMonth=month;next.recurringRuns??=[];next.recurringRuns.push({subscriptionId:record.subscriptionId,month});
  }
  next.transactions.push(record);adjustGoal(next,record,1);commit(state,next);return state.transactions.find(t=>t.id===record.id);
}
export function updateTransaction(state,id,tx) {
  const next=clone(state), index=next.transactions.findIndex(t=>t.id===id);check(index>=0,'Операция не найдена');
  const old=next.transactions[index];
  if(old.debtId) {
    check(tx.type===undefined||tx.type===old.type,'Нельзя изменить тип операции погашения долга');
    check(!Object.hasOwn(tx,'debtId')||tx.debtId===old.debtId,'Нельзя изменить связь операции с долгом');
    const record=normalizeTx({...old,...tx,id,type:old.type,debtId:old.debtId});
    const debt=next.debts.find(d=>d.id===old.debtId);check(debt,'Долг не найден');
    next.transactions[index]=record;refreshDebt(next,debt.id);commit(state,next);return state.transactions.find(t=>t.id===id);
  }
  const record=normalizeTx({...old,...tx,id});
  if(record.type!=='transfer') delete record.toWalletId;
  if(record.type!=='goal') delete record.goalId;
  if(record.type==='transfer'||record.type==='goal') delete record.categoryId;
  if(old.subscriptionId!==undefined) {
    check(!Object.hasOwn(tx,'subscriptionId')||tx.subscriptionId===old.subscriptionId,'Нельзя изменить связь регулярного платежа');
    check(!Object.hasOwn(tx,'recurrenceMonth')||tx.recurrenceMonth===old.recurrenceMonth,'Нельзя изменить месяц регулярного платежа');
    check(record.type===old.type,'Нельзя изменить тип записанного регулярного платежа');
  } else check(record.subscriptionId===undefined&&record.recurrenceMonth===undefined,'Для регулярного платежа используйте действие «Записать»');
  check(!record.debtId,'Нельзя присвоить операции погашение долга');adjustGoal(next,old,-1);adjustGoal(next,record,1);next.transactions[index]=record;commit(state,next);return state.transactions.find(t=>t.id===id);
}
export function deleteTransaction(state,id) {
  const next=clone(state), index=next.transactions.findIndex(t=>t.id===id);check(index>=0,'Операция не найдена');
  const [record]=next.transactions.splice(index,1);adjustGoal(next,record,-1);
  if(record.debtId) {const debt=next.debts.find(d=>d.id===record.debtId);if(debt)refreshDebt(next,debt.id);}
  commit(state,next);return record;
}
export function fundGoal(state,goalId,walletId,amount,date=today()) {
  const wallet=state.wallets.find(w=>w.id===walletId);check(wallet,'Счёт не найден');
  const goal=state.goals.find(g=>g.id===goalId);check(goal,'Цель не найдена');
  return addTransaction(state,{type:'goal',goalId,walletId,amount,date,scope:wallet.kind,note:`На цель «${goal.name}»`,tags:[]});
}
export function debtProgress(state,id) {
  const debt=state.debts.find(d=>d.id===id);check(debt,'Долг не найден');
  const payments=state.transactions.filter(t=>t.debtId===id).sort((a,b)=>b.date.localeCompare(a.date));
  const paid=payments.reduce((n,t)=>sumSafe(n,t.amount),0);
  return {total:debt.amount,paid,remaining:debt.amount-paid,payments};
}
function refreshDebt(state,id) {const debt=state.debts.find(d=>d.id===id);check(debt,'Долг не найден');const progress=debtProgress(state,id);check(progress.remaining>=0,'Платёж превышает остаток долга');debt.settled=progress.remaining===0;}
export function payDebt(state,id,amount,{date=today(),walletId,note}={}) {
  const next=clone(state), debt=next.debts.find(d=>d.id===id);check(debt,'Долг не найден');integer(amount,'Сумма платежа',true);
  check(amount<=debtProgress(next,id).remaining,'Платёж превышает остаток долга');
  const type=debt.direction==='receivable'?'income':'expense';
  const category=next.categories.find(c=>c.id===`other-${type}`&&c.type===type)||next.categories.find(c=>c.type===type);check(category,'Категория не найдена');
  const wallet=next.wallets.find(w=>w.id===(walletId??debt.walletId));check(wallet,'Счёт не найден');
  const tx=normalizeTx({type,amount,date,walletId:wallet.id,scope:walletId!==undefined?wallet.kind:debt.scope,categoryId:category.id,debtId:id,note:note??`Погашение: ${debt.name}`});
  next.transactions.push(tx);refreshDebt(next,id);commit(state,next);return state.transactions.find(t=>t.id===tx.id);
}
export function settleDebt(state,id,date=today()) {return payDebt(state,id,debtProgress(state,id).remaining,{date});}
export function updateDebt(state,id,patch) {
  const next=clone(state), index=next.debts.findIndex(d=>d.id===id);check(index>=0,'Долг не найден');
  const old=next.debts[index], paid=debtProgress(next,id).paid;
  check(!Object.hasOwn(patch,'id')||patch.id===id,'Нельзя изменить ID долга');
  check(!paid||patch.direction===undefined||patch.direction===old.direction,'Нельзя изменить направление долга с платежами');
  const record={...old,...clone(patch),id};integer(record.amount,'Сумма долга',true);check(record.amount>=paid,'Сумма долга меньше уже внесённых платежей');
  next.debts[index]=record;refreshDebt(next,id);commit(state,next);return state.debts.find(d=>d.id===id);
}
function appendRecurring(next,id,month,{date,amount,walletId}={},now=today()) {
  validMonth(month);dateParts(now);check(now<=today(),'Нельзя обрабатывать будущую дату');check(month<=now.slice(0,7),'Нельзя записать будущий месяц');
  const sub=next.subscriptions.find(s=>s.id===id);check(sub,'Регулярный платёж не найден');const due=monthDue(month,sub.day);
  check(due>=sub.startDate,'Шаблон ещё не действовал в выбранном месяце');
  check(!hasRun(next,id,month),'Регулярный платёж за этот месяц уже записан');
  const paymentDate=date??due;dateParts(paymentDate);check(paymentDate<=now,'Нельзя записать регулярный платёж будущим числом');
  const tx=normalizeTx({type:sub.type,amount:amount??sub.amount,date:paymentDate,walletId:walletId??sub.walletId,categoryId:sub.categoryId,scope:sub.scope,note:sub.name,subscriptionId:id,recurrenceMonth:month});
  next.transactions.push(tx);next.recurringRuns.push({subscriptionId:id,month});return tx;
}
export function recordRecurring(state,id,month=today().slice(0,7),options={}) {
  const next=clone(state), tx=appendRecurring(next,id,month,options);commit(state,next);return state.transactions.find(t=>t.id===tx.id);
}
export function processRecurring(state,now=today()) {
  dateParts(now);check(now<=today(),'Нельзя обрабатывать будущую дату');const next=clone(state), created=[];
  for(const sub of next.subscriptions.filter(s=>s.auto===true)) {
    dateParts(sub.startDate);let month=sub.startDate.slice(0,7), last=now.slice(0,7);
    while(month<=last) {
      const due=monthDue(month,sub.day);
      if(due>=sub.startDate&&due<=now&&!hasRun(next,sub.id,month)) {
        check(created.length<10000,'За один раз можно создать не более 10 000 регулярных операций. Уточните дату начала шаблонов.');
        created.push(appendRecurring(next,sub.id,month,{},now));
      }
      if(month===last)break;month=nextMonth(month);
    }
  }
  if(created.length)commit(state,next);return created.map(tx=>state.transactions.find(t=>t.id===tx.id));
}
export function deleteRecurring(state,id) {
  const next=clone(state), index=next.subscriptions.findIndex(s=>s.id===id);check(index>=0,'Регулярный платёж не найден');
  const [removed]=next.subscriptions.splice(index,1);next.recurringRuns=next.recurringRuns.filter(r=>r.subscriptionId!==id);
  for(const tx of next.transactions)if(tx.subscriptionId===id) {delete tx.subscriptionId;delete tx.recurrenceMonth;}
  commit(state,next);return removed;
}
export function csvExport(transactions,state) {
  const cell=value=> {let s=String(value??'');if(/^[\s\u0000-\u001f]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const names=new Map(state.wallets.map(w=>[w.id,w.name])), categories=new Map(state.categories.map(c=>[c.id,c.name]));
  const types={income:'Доход',expense:'Расход',transfer:'Перевод',goal:'Накопление'};
  const rows=[['Дата','Тип','Сумма, ₽','Счёт','На счёт','Категория','Контур','Заметка','Теги'],...transactions.map(t=>[t.date,types[t.type],(t.amount/100).toFixed(2).replace('.',','),names.get(t.walletId),names.get(t.toWalletId),categories.get(t.categoryId),t.scope==='business'?'Бизнес':'Личное',t.note,t.tags.join(', ')])];
  return '\ufeff'+rows.map(row=>row.map(cell).join(';')).join('\r\n');
}
