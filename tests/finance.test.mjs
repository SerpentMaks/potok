import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const path=new URL('../finance.js',import.meta.url);
const source=await readFile(path,'utf8');
const f=await import('data:text/javascript;base64,'+Buffer.from(source+'\n//# sourceURL=finance.js').toString('base64'));
const fresh=()=>f.createState();
const template=(extra={})=>({id:'sub',name:'Музыка',amount:10000,day:10,walletId:'card',scope:'personal',type:'expense',categoryId:'subscriptions',auto:false,startDate:'2026-01-01',...extra});
const debt=(extra={})=>({id:'d',name:'Клиент',amount:10000,dueDate:'2026-02-28',direction:'receivable',walletId:'card',scope:'personal',settled:false,...extra});
const expense=(extra={})=>({type:'expense',amount:10000,date:'2026-02-28',walletId:'card',categoryId:'food',scope:'personal',note:'Еда',tags:[],...extra});

test('clean and demo are fully valid independent states',()=>{
 const clean=fresh();assert.equal(clean.transactions.length,0);assert.equal(clean.wallets.length,4);assert.equal(f.totalBalance(clean),0);
 assert.deepEqual(f.validateState(clean),clean);const demo=f.createState({demo:true});assert.ok(demo.transactions.length>40);assert.ok(demo.goals.length>0);assert.deepEqual(f.validateState(demo),demo);
 const copied=f.validateState(clean);copied.wallets[0].name='Изменено';assert.notEqual(clean.wallets[0].name,copied.wallets[0].name);
});
test('safe arithmetic parser supports precedence, comma decimals, exact rounding and rejects code',()=>{
 for(const [expr,expected] of [['100 + 50 * 2',20000],['(100+50)/2',7500],['1,005',101],['0.1+0.2',30],['-1.005',-101],['2*-3',-600],['1/3*3',100],['.5',50]])assert.equal(f.parseAmount(expr),expected,expr);
 for(const expr of ['','1/0','1+','(2','2 3','Math.random()','1e3','1;alert(1)','9007199254740992','2(3)','NaN'])assert.throws(()=>f.parseAmount(expr),undefined,expr);
});
test('dates, references, duplicates and integer sums are checked',()=>{
 for(const change of [s=>s.transactions.push(expense({id:'bad',date:'2026-02-30'})),s=>s.transactions.push(expense({id:'bad',amount:1.2})),s=>s.transactions.push(expense({id:'bad',categoryId:'salary'})),s=>s.wallets[1].id=s.wallets[0].id,s=>s.wallets[0].initialBalance=Number.MAX_SAFE_INTEGER+1,s=>s.transactions.push(expense({id:'bad',walletId:'missing'}))]) {const s=fresh();change(s);assert.throws(()=>f.validateState(s));}
 const s=fresh();s.wallets[0].initialBalance=Number.MAX_SAFE_INTEGER;s.wallets[1].initialBalance=1;assert.throws(()=>f.validateState(s),/размер/);
});
test('transfers conserve totals and reflect wallet scopes',()=>{
 const s=fresh();s.wallets[0].initialBalance=100000;
 f.addTransaction(s,{type:'transfer',amount:20000,date:'2026-02-28',walletId:'card',toWalletId:'business',scope:'personal'});
 assert.equal(f.walletBalance(s,'card'),80000);assert.equal(f.walletBalance(s,'business'),20000);assert.equal(f.totalBalance(s),100000);assert.equal(f.totalBalance(s,'personal'),80000);
 assert.deepEqual(f.summary(s,{now:'2026-02-28'}),{income:0,expense:0,savingsRate:0});
});
test('goal funding, amount edit, target change and deletion reconcile exactly once',()=>{
 const s=fresh();s.wallets[0].initialBalance=100000;s.goals=[{id:'g',name:'Отпуск',saved:5000,target:200000,color:'#abcdef'},{id:'g2',name:'Резерв',saved:0,target:500000,color:'#123456'}];
 const tx=f.fundGoal(s,'g','card',20000,'2026-02-28');assert.equal(s.goals[0].saved,25000);assert.equal(f.totalBalance(s),80000);
 assert.equal(f.safeBudget(s,{now:'2026-02-28'}).free,80000);
 f.updateTransaction(s,tx.id,{amount:30000});assert.equal(s.goals[0].saved,35000);assert.equal(f.totalBalance(s),70000);
 f.updateTransaction(s,tx.id,{goalId:'g2'});assert.equal(s.goals[0].saved,5000);assert.equal(s.goals[1].saved,30000);
 f.deleteTransaction(s,tx.id);assert.equal(s.goals[1].saved,0);assert.equal(f.totalBalance(s),100000);
});
test('failed mutations are atomic',()=>{
 const s=fresh();const before=structuredClone(s);assert.throws(()=>f.addTransaction(s,expense({amount:-1})));assert.deepEqual(s,before);
 const tx=f.addTransaction(s,expense());const snapshot=structuredClone(s);assert.throws(()=>f.updateTransaction(s,tx.id,{walletId:'unknown'}));assert.deepEqual(s,snapshot);
});
test('debt settlement and undo preserve ledger integrity',()=>{
 for(const direction of ['receivable','payable']){
 const s=fresh();s.debts=[{id:'d',name:'Друг',amount:10000,dueDate:'2026-02-28',direction,walletId:'card',scope:'personal',settled:false}];
 const tx=f.settleDebt(s,'d','2026-02-28');assert.equal(s.debts[0].settled,true);assert.equal(tx.type,direction==='receivable'?'income':'expense');assert.equal(f.totalBalance(s),direction==='receivable'?10000:-10000);
 assert.throws(()=>f.settleDebt(s,'d'));assert.throws(()=>f.updateTransaction(s,tx.id,{type:'transfer'}));f.deleteTransaction(s,tx.id);assert.equal(s.debts[0].settled,false);assert.equal(f.totalBalance(s),0);
 }});
test('month clamping and rollover keep subscription dates real',()=>{
 const s=fresh();s.subscriptions=[template({name:'Подписка',amount:1000,day:31})];
 assert.equal(f.upcomingSubscriptions(s,'2026-02-01')[0].nextDate,'2026-02-28');assert.equal(f.upcomingSubscriptions(s,'2028-02-01')[0].nextDate,'2028-02-29');
 assert.equal(f.upcomingSubscriptions(s,'2026-04-30')[0].daysUntil,0);assert.equal(f.upcomingSubscriptions(s,'2026-12-31')[0].nextDate,'2026-12-31');
 s.subscriptions[0].day=15;assert.equal(f.upcomingSubscriptions(s,'2026-12-31')[0].nextDate,'2027-01-15');
});
test('budget reserves unpaid current-month subscriptions and caps spending by remaining limit',()=>{
 const s=fresh();s.wallets[0].initialBalance=100000;s.settings.monthlyLimit=50000;
 s.subscriptions=[template()];
 let budget=f.safeBudget(s,{now:'2026-02-27'});assert.equal(budget.reserved,10000);assert.equal(budget.free,40000);assert.equal(budget.daily,20000);assert.equal(budget.daysLeft,2);
 f.addTransaction(s,expense({amount:10000,date:'2026-02-27',subscriptionId:'sub'}));budget=f.safeBudget(s,{now:'2026-02-27'});
 assert.equal(budget.reserved,0);assert.equal(budget.free,40000);assert.equal(budget.todayExpense,10000);assert.equal(budget.remainingLimit,40000);
});
test('periods include seven days, exclude future and respect scopes',()=>{
 const s=fresh();for(const [date,scope]of [['2026-02-21','personal'],['2026-02-22','personal'],['2026-02-28','business'],['2026-03-01','personal']])f.addTransaction(s,expense({date,scope}));
 assert.equal(f.periodTransactions(s,'week','all','2026-02-28').length,2);assert.equal(f.periodTransactions(s,'month','personal','2026-02-28').length,2);
 assert.deepEqual(f.summary(s,{period:'month',scope:'all',now:'2026-02-28'}),{income:0,expense:30000,savingsRate:0});
});
test('CSV quotes newlines, delimiters, double quotes and neutralizes spreadsheet formulas',()=>{
 const s=fresh();const tx=f.addTransaction(s,expense({note:'=HYPERLINK("evil");\ntext',tags:['@bad']}));const csv=f.csvExport([tx],s);
 assert.ok(csv.startsWith('\ufeff'));assert.ok(csv.includes('"\'=HYPERLINK(""evil"");\ntext"'));assert.ok(csv.includes('"\'@bad"'));
});

test('future income, expenses and transfers affect balances only on their actual date',()=>{
 const s=fresh();s.wallets[0].initialBalance=100000;
 f.addTransaction(s,{type:'income',amount:900000,date:'2099-12-31',walletId:'card',categoryId:'salary',scope:'personal'});
 f.addTransaction(s,expense({amount:20000,date:'2099-12-31'}));
 f.addTransaction(s,{type:'transfer',amount:30000,date:'2099-12-31',walletId:'card',toWalletId:'business',scope:'personal'});
 assert.equal(f.walletBalance(s,'card','2099-12-30'),100000);assert.equal(f.walletBalance(s,'business','2099-12-30'),0);
 assert.equal(f.totalBalance(s,'all','2099-12-30'),100000);assert.equal(f.safeBudget(s,{now:'2099-12-30'}).free,100000);
 assert.equal(f.walletBalance(s,'card','2099-12-31'),950000);assert.equal(f.walletBalance(s,'business','2099-12-31'),30000);assert.equal(f.totalBalance(s,'all','2099-12-31'),980000);
 assert.equal(f.totalBalance(s),100000);
});
test('monthly spending limit applies to combined scope; filtered scopes use their own balances',()=>{
 const s=fresh();s.wallets[0].initialBalance=100000;s.wallets[3].initialBalance=200000;s.settings.monthlyLimit=50000;
 f.addTransaction(s,expense({amount:10000,date:'2026-02-28'}));
 assert.equal(f.safeBudget(s,{scope:'all',now:'2026-02-28'}).free,40000);
 const personal=f.safeBudget(s,{scope:'personal',now:'2026-02-28'}), business=f.safeBudget(s,{scope:'business',now:'2026-02-28'});
 assert.equal(personal.remainingLimit,null);assert.equal(personal.free,90000);assert.equal(business.remainingLimit,null);assert.equal(business.free,200000);
});
test('imports require an account and categories for both transaction directions',()=>{
 for(const mutate of [s=>s.wallets=[],s=>s.categories=s.categories.filter(c=>c.type!=='income'),s=>s.categories=s.categories.filter(c=>c.type!=='expense')]){
 const s=fresh();mutate(s);assert.throws(()=>f.validateState(s));
 }
});


test('editing partial settlement leaves original debt defaults and total unchanged',()=>{
 const s=fresh();s.debts=[debt()];
 const tx=f.settleDebt(s,'d','2026-02-28');
 const edited=f.updateTransaction(s,tx.id,{amount:2500,date:'2026-03-01',walletId:'business',scope:'business',note:'Уточнённая оплата',tags:['работа'],categoryId:'freelance'});
 assert.equal(edited.type,'income');assert.equal(edited.debtId,'d');assert.equal(edited.categoryId,'freelance');assert.deepEqual(edited.tags,['работа']);
 assert.equal(s.debts[0].amount,10000);assert.equal(s.debts[0].walletId,'card');assert.equal(s.debts[0].scope,'personal');assert.equal(s.debts[0].settled,false);
 assert.equal(f.walletBalance(s,'card'),0);assert.equal(f.walletBalance(s,'business'),2500);assert.equal(f.debtProgress(s,'d').remaining,7500);
 const snapshot=structuredClone(s);for(const patch of [{type:'expense'},{debtId:'elsewhere'},{debtId:undefined},{amount:-1},{amount:10001},{categoryId:'food'}]) {assert.throws(()=>f.updateTransaction(s,tx.id,patch));assert.deepEqual(s,snapshot);}
 f.deleteTransaction(s,tx.id);assert.equal(s.debts[0].settled,false);assert.equal(s.debts[0].amount,10000);assert.equal(f.totalBalance(s),0);
});

test('partial debt payments support both directions and different accounts then reopen',()=>{
 for(const direction of ['receivable','payable']) {
  const s=fresh();s.debts=[debt({direction})];const sign=direction==='receivable'?1:-1;
  const a=f.payDebt(s,'d',3000,{date:'2026-02-01'}), b=f.payDebt(s,'d',2000,{date:'2026-02-02',walletId:'business',note:'Часть'});
  assert.equal(b.scope,'business');assert.equal(f.walletBalance(s,'card'),sign*3000);assert.equal(f.walletBalance(s,'business'),sign*2000);
  let progress=f.debtProgress(s,'d');assert.deepEqual([progress.total,progress.paid,progress.remaining],[10000,5000,5000]);assert.deepEqual(progress.payments.map(p=>p.id),[b.id,a.id]);
  const snapshot=structuredClone(s);for(const amount of [5001,0,-1,1.1]) {assert.throws(()=>f.payDebt(s,'d',amount));assert.deepEqual(s,snapshot);}
  f.settleDebt(s,'d','2026-02-03');assert.equal(s.debts[0].settled,true);assert.equal(f.debtProgress(s,'d').paid,10000);
  f.deleteTransaction(s,a.id);assert.equal(s.debts[0].settled,false);assert.equal(f.debtProgress(s,'d').remaining,3000);
 }
});

test('debt updates preserve payments and require obligation to cover the paid total',()=>{
 const s=fresh();s.debts=[debt()];f.payDebt(s,'d',4000,{date:'2026-02-01'});const payments=structuredClone(s.transactions);
 f.updateDebt(s,'d',{amount:4000,name:'Новое имя',walletId:'business',scope:'business'});assert.equal(s.debts[0].settled,true);assert.deepEqual(s.transactions,payments);
 const before=structuredClone(s);for(const patch of [{amount:3999},{direction:'payable'}]){assert.throws(()=>f.updateDebt(s,'d',patch));assert.deepEqual(s,before);}
 f.updateDebt(s,'d',{amount:6000});assert.equal(s.debts[0].settled,false);const tx=f.settleDebt(s,'d','2026-02-03');assert.equal(tx.walletId,'business');assert.equal(tx.scope,'business');assert.equal(tx.amount,2000);
 const invalid=structuredClone(s);invalid.debts[0].settled=false;assert.throws(()=>f.validateState(invalid));
});

test('version one migration preserves all balances, record IDs and settled obligations',()=>{
 const s=fresh();s.schemaVersion=1;delete s.recurringRuns;s.subscriptions=[{id:'sub',name:'Музыка',amount:1000,day:31,walletId:'card',scope:'personal'}];
 s.debts=[debt({settled:true})];s.transactions=[expense({id:'old-sub',amount:1000,categoryId:'subscriptions',subscriptionId:'sub'}),{...expense({id:'old-debt',amount:10000,type:'income',categoryId:'other-income'}),debtId:'d'}];
 const original=structuredClone(s), before=f.totalBalance(s), migrated=f.validateState(s);
 assert.equal(migrated.schemaVersion,2);assert.deepEqual(s,original);assert.equal(f.totalBalance(migrated),before);assert.deepEqual(migrated.transactions.map(t=>t.id),['old-sub','old-debt']);
 assert.equal(migrated.transactions[0].recurrenceMonth,'2026-02');assert.deepEqual(migrated.recurringRuns,[{subscriptionId:'sub',month:'2026-02'}]);
 assert.equal(migrated.subscriptions[0].auto,false);assert.equal(migrated.subscriptions[0].type,'expense');assert.equal(migrated.subscriptions[0].categoryId,'subscriptions');assert.equal(migrated.subscriptions[0].startDate,f.today().slice(0,7)+'-01');
 assert.equal(migrated.debts[0].amount,10000);assert.equal(migrated.debts[0].settled,true);assert.equal(f.debtProgress(migrated,'d').paid,10000);assert.deepEqual(f.processRecurring(migrated),[]);
 assert.deepEqual(f.validateState(migrated),migrated);
});

test('manual recurring records snapshot amounts and categories for expenses and income',()=>{
 const s=fresh();s.subscriptions=[template({day:31,startDate:'2024-01-01'}),template({id:'salary-repeat',type:'income',categoryId:'salary',amount:200000,day:15})];
 const a=f.recordRecurring(s,'sub','2024-02'),b=f.recordRecurring(s,'salary-repeat','2026-02',{date:'2026-02-20',amount:210000,walletId:'business'});
 assert.equal(a.date,'2024-02-29');assert.equal(a.recurrenceMonth,'2024-02');assert.equal(b.type,'income');assert.equal(b.amount,210000);assert.equal(b.categoryId,'salary');assert.equal(b.note,'Музыка');
 const before=structuredClone(s);assert.throws(()=>f.recordRecurring(s,'sub','2024-02'));assert.deepEqual(s,before);
 s.subscriptions[0].amount=25000;s.subscriptions[0].name='Новое имя';s.subscriptions[0].categoryId='food';s.subscriptions[0].day=10;
 f.recordRecurring(s,'sub','2026-03');assert.equal(s.transactions.find(t=>t.id===a.id).amount,10000);assert.equal(s.transactions.find(t=>t.id===a.id).note,'Музыка');assert.equal(s.transactions.at(-1).amount,25000);assert.equal(s.transactions.at(-1).categoryId,'food');
});

test('auto catchup clamps days, skips pre-start occurrences and stays idempotent after deletion',()=>{
 const s=fresh();s.subscriptions=[template({auto:true,day:31,startDate:'2024-01-31'}),template({id:'payroll',auto:true,type:'income',categoryId:'salary',day:15,startDate:'2024-01-20'})];
 const made=f.processRecurring(s,'2024-03-31');assert.equal(made.length,5);assert.deepEqual(made.filter(t=>t.subscriptionId==='sub').map(t=>t.date),['2024-01-31','2024-02-29','2024-03-31']);
 assert.deepEqual(f.processRecurring(s,'2024-03-31'),[]);f.deleteTransaction(s,made[1].id);assert.deepEqual(f.processRecurring(s,'2024-03-31'),[]);
 assert.equal(f.recurringStatus(s,'sub','2024-02-29').recorded,true);assert.equal(f.recurringStatus(s,'sub','2024-02-29').transaction,undefined);
 const before=structuredClone(s);assert.throws(()=>f.recordRecurring(s,'sub','2024-02'));assert.deepEqual(s,before);
 assert.equal(f.processRecurring(s,'2024-04-30').length,2);
});

test('manual payment dedupes automatic catchup and linkage month survives date edits',()=>{
 const s=fresh();s.subscriptions=[template({auto:true,startDate:'2026-01-01'})];
 const tx=f.recordRecurring(s,'sub','2026-01',{date:'2026-02-02'});assert.equal(f.processRecurring(s,'2026-02-28').length,1);
 f.updateTransaction(s,tx.id,{date:'2026-03-02',amount:12000,note:'Исправлено'});assert.equal(f.recurringStatus(s,'sub','2026-01-20').recorded,true);assert.equal(f.recurringStatus(s,'sub','2026-03-20').recorded,false);
 const before=structuredClone(s);for(const patch of [{subscriptionId:undefined},{recurrenceMonth:'2026-02'},{type:'income',categoryId:'salary'}]){assert.throws(()=>f.updateTransaction(s,tx.id,patch));assert.deepEqual(s,before);}
});

test('removing either recurring type preserves historical balances and unlinks all records',()=>{
 for(const type of ['expense','income']) {
  const s=fresh();s.subscriptions=[template({type,categoryId:type==='income'?'salary':'subscriptions'})];
  f.recordRecurring(s,'sub','2026-01');f.recordRecurring(s,'sub','2026-02',{amount:15000});const before=structuredClone(s.transactions),balance=f.totalBalance(s);
  f.deleteRecurring(s,'sub');assert.equal(s.subscriptions.length,0);assert.equal(s.recurringRuns.length,0);assert.equal(f.totalBalance(s),balance);
  assert.deepEqual(s.transactions,before.map(({subscriptionId,recurrenceMonth,...tx})=>tx));assert.deepEqual(f.validateState(s),s);
 }
});

test('budget reserves only started unpaid expenses; income never increases available balance early',()=>{
 const s=fresh();s.wallets[0].initialBalance=100000;s.subscriptions=[template(),template({id:'inc',type:'income',categoryId:'salary',amount:1000000}),template({id:'future',startDate:'2026-03-01',amount:30000})];
 assert.equal(f.safeBudget(s,{now:'2026-02-01'}).reserved,10000);assert.equal(f.safeBudget(s,{now:'2026-02-01'}).free,90000);
 f.recordRecurring(s,'sub','2026-02',{date:'2026-02-01'});assert.equal(f.safeBudget(s,{now:'2026-02-01'}).reserved,0);
 assert.equal(f.upcomingSubscriptions(s,'2026-02-01').find(t=>t.id==='sub').nextDate,'2026-03-10');assert.equal(f.upcomingSubscriptions(s,'2026-02-01').find(t=>t.id==='future').nextDate,'2026-03-10');
 f.deleteTransaction(s,s.transactions[0].id);assert.equal(f.safeBudget(s,{now:'2026-02-01'}).reserved,0);
});

test('recurring validation rejects invalid categories, dates, references, duplicate markers and future processing atomically',()=>{
 const s=fresh();s.subscriptions=[template()];
 for(const mutate of [x=>x.subscriptions[0].categoryId='salary',x=>x.subscriptions[0].startDate='2026-02-30',x=>x.subscriptions[0].auto='yes',x=>x.recurringRuns=[{subscriptionId:'missing',month:'2026-02'}],x=>x.recurringRuns=[{subscriptionId:'sub',month:'2026-13'}],x=>x.recurringRuns=[{subscriptionId:'sub',month:'2026-02'},{subscriptionId:'sub',month:'2026-02'}]]) {
  const invalid=structuredClone(s);mutate(invalid);assert.throws(()=>f.validateState(invalid));
 }
 const before=structuredClone(s);for(const action of [()=>f.recordRecurring(s,'sub','2099-01'),()=>f.recordRecurring(s,'sub','2026-01',{date:'2099-01-01'}),()=>f.recordRecurring(s,'sub','2026-01',{amount:0}),()=>f.processRecurring(s,'2099-01-01')]) {assert.throws(action);assert.deepEqual(s,before);}
});

test('automatic generation limit aborts the entire catchup transaction',()=>{
 const s=fresh();s.subscriptions=Array.from({length:8},(_,i)=>template({id:'old-'+i,auto:true,startDate:'1900-01-01',day:1,amount:1}));const before=structuredClone(s);
 assert.throws(()=>f.processRecurring(s,'2026-02-28'),/10 000/);assert.deepEqual(s,before);
});


test('v2 old-style recurring linkage receives a persistent occurrence marker on import',()=>{
 const s=fresh();s.subscriptions=[template({auto:true})];s.transactions=[expense({id:'linked',subscriptionId:'sub'})];
 const normalized=f.validateState(s);assert.deepEqual(normalized.recurringRuns,[{subscriptionId:'sub',month:'2026-02'}]);assert.equal(normalized.transactions[0].recurrenceMonth,'2026-02');
 f.deleteTransaction(normalized,'linked');assert.equal(f.recurringStatus(normalized,'sub','2026-02-28').recorded,true);
 assert.equal(f.processRecurring(normalized,'2026-02-28').filter(t=>t.recurrenceMonth==='2026-02').length,0);
});
