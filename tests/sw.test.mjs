import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
test('PWA manifest paths, icon sizes and core offline files are valid', () => {
  const m=JSON.parse(fs.readFileSync(new URL('manifest.json',root)));
  assert.equal(m.display,'standalone'); assert.equal(m.scope,'./');
  for(const i of m.icons){const b=fs.readFileSync(new URL(i.src,root));assert.equal(b.readUInt32BE(16),Number(i.sizes.split('x')[0]));assert.equal(b.readUInt32BE(20),Number(i.sizes.split('x')[1]));}
  for(const file of ['index.html','app.js','finance.js','styles.css','sw.js'])assert.ok(fs.statSync(new URL(file,root)).size>0);
  assert.equal(m.start_url,'./#entry');
});
test('Service Worker installs offline shell despite CDN failure and serves offline navigation', async () => {
  const handlers={},entries=new Map(),deleted=[];
  const normalize=x=>new URL(typeof x==='string'?x:x.url,'https://example.test/repo/').href;
  const cache={
    async addAll(files){for(const file of files){let path=file==='./'?'index.html':file;const body=fs.readFileSync(new URL(path,root));entries.set(normalize(file),new Response(body));}},
    async put(url,response){entries.set(normalize(url),response);},
    async match(url){return entries.get(normalize(url))?.clone();}
  };
  let claimed=false,skipped=false;
  const context={URL,Response,AbortSignal,Promise,self:{location:{origin:'https://example.test'},registration:{scope:'https://example.test/repo/'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>skipped=true,clients:{claim:async()=>claimed=true}},caches:{open:async()=>cache,keys:async()=>['potok-static-old','other-app'],delete:async key=>deleted.push(key)},fetch:async()=>{throw Error('network unavailable');}};
  vm.runInNewContext(fs.readFileSync(new URL('sw.js',root),'utf8'),context);
  let waiting;
  handlers.install({waitUntil:p=>waiting=p});await waiting;assert.ok(skipped);assert.ok(entries.has('https://example.test/repo/app.js'));
  handlers.activate({waitUntil:p=>waiting=p});await waiting;assert.ok(claimed);assert.deepEqual(deleted,['potok-static-old']);
  let response;
  handlers.fetch({request:{method:'GET',url:'https://example.test/repo/',mode:'navigate'},respondWith:p=>response=p});
  assert.match(await (await response).text(),/Поток/);
  handlers.fetch({request:{method:'GET',url:'https://example.test/repo/app.js',mode:'cors'},respondWith:p=>response=p});
  assert.match(await (await response).text(),/import \* as F/);
  handlers.fetch({request:{method:'GET',url:'https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js',mode:'cors'},respondWith:p=>response=p});
  assert.equal(await (await response).text(),'');
  let intercepted=false;
  handlers.fetch({request:{method:'POST',url:'https://example.test/repo/',mode:'cors'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
});
