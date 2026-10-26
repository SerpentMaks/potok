import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../pwa.js',import.meta.url),'utf8').replace('export async function','async function')+'\nglobalThis.resetAppCache = resetAppCache;';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function fixture({offline=false,body=html,status=200,type='text/html',noCache=false}={}) {
  const deleted=[],removed=[],probes=[],replaced=[];
  const context={URL,Date,Math,AbortSignal,Response,crypto:{randomUUID:()=> 'unique'},location:{href:'https://example.test/nested/potok/?keep=1#debts',replace:url=>replaced.push(url)},fetch:async(url,options)=>{probes.push({url,options});if(offline)throw Error('offline');return new Response(body,{status,headers:{'Content-Type':type}});},navigator:{serviceWorker:{getRegistrations:async()=>[
    {scope:'https://example.test/nested/potok/',unregister:async()=>{removed.push('app');return true;}},
    {scope:'https://example.test/nested/',unregister:async()=>{removed.push('parent');return true;}},
    {scope:'https://example.test/nested/potok/child/',unregister:async()=>{removed.push('child');return true;}}
  ]}},caches:noCache?undefined:{keys:async()=>['potok-static-v1.0.5','potok-static-v1.1.0','another-app','potok-financial'],delete:async name=>{deleted.push(name);return true;}}};
  for(const name of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(context,name,{get(){throw Error('Financial storage touched');}});
  vm.createContext(context);vm.runInContext(source,context);
  return {context,deleted,removed,probes,replaced};
}
test('reset verifies real app over network, deletes only static caches and exact scope worker',async()=>{
  const f=fixture();const result=await f.context.resetAppCache({reload:false});
  assert.equal(result.clearedCaches,2);assert.equal(result.unregistered,1);
  assert.deepEqual(f.deleted,['potok-static-v1.0.5','potok-static-v1.1.0']);assert.deepEqual(f.removed,['app']);assert.deepEqual(f.replaced,[]);
  assert.equal(f.probes[0].options.cache,'no-store');const probe=new URL(f.probes[0].url);assert.equal(probe.pathname,'/nested/potok/index.html');assert.ok(probe.searchParams.get('_potok_check'));
});
test('reset navigation preserves query parameters and current hash',async()=>{
  const f=fixture();await f.context.resetAppCache();const url=new URL(f.replaced[0]);
  assert.equal(url.pathname,'/nested/potok/');assert.equal(url.searchParams.get('keep'),'1');assert.equal(url.hash,'#debts');assert.ok(url.searchParams.get('_potok_reload'));
});
for(const config of [{offline:true},{body:'<html>Captive portal</html>'},{status:503},{type:'application/json'},{body:html.replace('content="1.1.0"','content="1.0.5"')}])test(`unsafe network response keeps all cache and registrations: ${config.offline ? 'offline' : config.status ? 'HTTP error' : config.type ? 'wrong content type' : 'invalid app HTML'}`,async()=>{
  const f=fixture(config);await assert.rejects(f.context.resetAppCache(),/Подключитесь к интернету/);assert.deepEqual(f.deleted,[]);assert.deepEqual(f.removed,[]);assert.deepEqual(f.replaced,[]);
});
test('unsupported cache storage reports unavailable without success or reload',async()=>{
  const f=fixture({noCache:true});await assert.rejects(f.context.resetAppCache(),/недоступна/);assert.deepEqual(f.probes,[]);assert.deepEqual(f.removed,[]);assert.deepEqual(f.replaced,[]);
});

test('a future compatible application version can replace the current shell',async()=>{
 const f=fixture({body:html.replace('content="1.1.0"','content="1.2.0"')});
 await f.context.resetAppCache({reload:false});assert.equal(f.deleted.length,2);
});
