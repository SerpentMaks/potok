import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const path=new URL('../finance.js',import.meta.url);
const source=await readFile(path,'utf8');
const f=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const fresh=()=>f.createState();
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
 const s=fresh();s.subscriptions=[{id:'sub',name:'Подписка',amount:1000,day:31,walletId:'card',scope:'personal'}];
 assert.equal(f.upcomingSubscriptions(s,'2026-02-01')[0].nextDate,'2026-02-28');assert.equal(f.upcomingSubscriptions(s,'2028-02-01')[0].nextDate,'2028-02-29');
 assert.equal(f.upcomingSubscriptions(s,'2026-04-30')[0].daysUntil,0);assert.equal(f.upcomingSubscriptions(s,'2026-12-31')[0].nextDate,'2026-12-31');
 s.subscriptions[0].day=15;assert.equal(f.upcomingSubscriptions(s,'2026-12-31')[0].nextDate,'2027-01-15');
});
test('budget reserves unpaid current-month subscriptions and caps spending by remaining limit',()=>{
 const s=fresh();s.wallets[0].initialBalance=100000;s.settings.monthlyLimit=50000;
 s.subscriptions=[{id:'sub',name:'Музыка',amount:10000,day:10,walletId:'card',scope:'personal'}];
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


test('editing a debt settlement synchronizes amount, wallet and scope and deletion reopens edited debt',()=>{
 const s=fresh();s.debts=[{id:'d',name:'Клиент',amount:10000,dueDate:'2026-02-28',direction:'receivable',walletId:'card',scope:'personal',settled:false}];
 const tx=f.settleDebt(s,'d','2026-02-28');
 const edited=f.updateTransaction(s,tx.id,{amount:25000,date:'2026-03-01',walletId:'business',scope:'business',note:'Уточнённая оплата',tags:['работа'],categoryId:'freelance'});
 assert.equal(edited.type,'income');assert.equal(edited.debtId,'d');assert.equal(edited.categoryId,'freelance');assert.deepEqual(edited.tags,['работа']);
 assert.equal(s.debts[0].amount,25000);assert.equal(s.debts[0].walletId,'business');assert.equal(s.debts[0].scope,'business');assert.equal(s.debts[0].direction,'receivable');assert.equal(s.debts[0].settled,true);
 assert.equal(f.walletBalance(s,'card'),0);assert.equal(f.walletBalance(s,'business'),25000);assert.equal(f.totalBalance(s),25000);
 const snapshot=structuredClone(s);for(const patch of [{type:'expense'},{debtId:'elsewhere'},{debtId:undefined},{amount:-1},{categoryId:'food'}]) {assert.throws(()=>f.updateTransaction(s,tx.id,patch));assert.deepEqual(s,snapshot);}
 f.deleteTransaction(s,tx.id);assert.equal(s.debts[0].settled,false);assert.equal(s.debts[0].amount,25000);assert.equal(f.totalBalance(s),0);
});
