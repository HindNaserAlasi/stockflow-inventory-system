import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOrder, reorderPoint, validateQuantity } from './lib.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const dbFile=path.join(root,'data','store.json');
const port=Number(process.env.PORT||3000);
const demoProducts=[
{id:1,sku:'ELEC-001',name:'Wireless Mechanical Keyboard',category:'Accessories',price:89.99,stock:45,avgDailySales:3,leadDays:7,safetyStock:12},
{id:2,sku:'ELEC-002',name:'Ergonomic Wireless Mouse',category:'Accessories',price:39.50,stock:18,avgDailySales:4,leadDays:5,safetyStock:10},
{id:3,sku:'ELEC-003',name:'27-inch 4K Monitor',category:'Displays',price:329,stock:11,avgDailySales:1,leadDays:12,safetyStock:4},
{id:4,sku:'ELEC-004',name:'USB-C Docking Station',category:'Accessories',price:125,stock:7,avgDailySales:2,leadDays:6,safetyStock:6},
{id:5,sku:'ELEC-005',name:'Noise Canceling Headphones',category:'Audio',price:149,stock:62,avgDailySales:2,leadDays:8,safetyStock:8},
{id:6,sku:'ELEC-006',name:'1080p Web Camera',category:'Video',price:58,stock:26,avgDailySales:3,leadDays:4,safetyStock:6},
{id:7,sku:'ELEC-007',name:'Portable SSD 1TB',category:'Storage',price:119,stock:9,avgDailySales:2,leadDays:7,safetyStock:5},
{id:8,sku:'ELEC-008',name:'Laptop Stand Aluminum',category:'Accessories',price:42,stock:80,avgDailySales:2,leadDays:5,safetyStock:8}
];
const init=()=>({products:structuredClone(demoProducts),orders:[{id:1001,date:new Date(Date.now()-86400000).toISOString(),items:[{productId:1,name:'Wireless Mechanical Keyboard',quantity:2,price:89.99}],total:179.98,status:'Completed'},{id:1002,date:new Date(Date.now()-172800000).toISOString(),items:[{productId:5,name:'Noise Canceling Headphones',quantity:3,price:149}],total:447,status:'Completed'}],nextProductId:9,nextOrderId:1003});
let db;
try{db=JSON.parse(await fs.readFile(dbFile,'utf8'));}catch{db=init(); await fs.writeFile(dbFile,JSON.stringify(db,null,2));}
let lock=Promise.resolve();
const mutation=fn=>{const next=lock.then(async()=>{const copy=structuredClone(db);const result=fn(copy);await fs.writeFile(dbFile+'.tmp',JSON.stringify(copy,null,2));await fs.rename(dbFile+'.tmp',dbFile);db=copy;return result;});lock=next.catch(()=>{});return next;};
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function enriched(product){const point=reorderPoint(product.avgDailySales,product.leadDays,product.safetyStock);return {...product,reorderPoint:point,needsReorder:product.stock<=point};}
function metrics(){const value=db.products.reduce((n,p)=>n+p.price*p.stock,0);return {totalProducts:db.products.length,inventoryValue:Number(value.toFixed(2)),lowStock:db.products.filter(p=>enriched(p).needsReorder).length,totalOrders:db.orders.length,revenue:Number(db.orders.reduce((n,o)=>n+o.total,0).toFixed(2))};}
async function body(req){let input='';for await (const chunk of req){input+=chunk;if(input.length>100000) throw Error('Payload too large');}try{return JSON.parse(input||'{}')}catch{throw Error('Invalid JSON');}}
const contentTypes={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');const route=url.pathname;
 if(route.startsWith('/api/')){
  if(req.method==='GET'&&route==='/api/products')return send(res,200,db.products.map(enriched));
  if(req.method==='GET'&&route==='/api/orders')return send(res,200,db.orders);
  if(req.method==='GET'&&route==='/api/metrics')return send(res,200,metrics());
  if(req.method==='POST'&&route==='/api/orders'){
    const payload=await body(req);return send(res,201,await mutation(d=>createOrder(d,payload.items)));
  }
  if(req.method==='POST'&&route==='/api/products'){
    const p=await body(req);
    if(typeof p.name!=='string'||!p.name.trim()||typeof p.sku!=='string'||!p.sku.trim()||typeof p.category!=='string'||!p.category.trim()||!Number.isFinite(p.price)||p.price<0||!Number.isInteger(p.stock)||p.stock<0||![p.avgDailySales,p.leadDays,p.safetyStock].every(x=>Number.isFinite(x)&&x>=0))throw Error('Invalid product details');
    return send(res,201,await mutation(d=>{if(d.products.some(x=>x.sku.toLowerCase()===p.sku.trim().toLowerCase()))throw Error('SKU already exists');const v={id:d.nextProductId++,name:p.name.trim().slice(0,100),sku:p.sku.trim().slice(0,40),category:p.category.trim().slice(0,60),price:p.price,stock:p.stock,avgDailySales:p.avgDailySales,leadDays:p.leadDays,safetyStock:p.safetyStock};d.products.push(v);return enriched(v);}));
  }
  const update=route.match(/^\/api\/products\/(\d+)\/stock$/);
  if(req.method==='PATCH'&&update){const id=Number(update[1]);const v=await body(req);if(!Number.isInteger(v.delta)||v.delta===0)throw Error('Enter a non-zero integer stock adjustment');return send(res,200,await mutation(d=>{const p=d.products.find(x=>x.id===id);if(!p)throw Error('Product not found');if(p.stock+v.delta<0)throw Error('Insufficient stock');p.stock+=v.delta;return enriched(p);}));}
  if(req.method==='POST'&&route==='/api/reset')return send(res,200,await mutation(d=>{Object.assign(d,init());return {ok:true};}));
  return send(res,404,{error:'API route not found'});
 }
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 let target=route==='/'?'/index.html':route;
 const filepath=path.resolve(root,'public','.'+target);
 if(!filepath.startsWith(path.resolve(root,'public')+path.sep))return send(res,403,{error:'Forbidden'});
 const content=await fs.readFile(filepath).catch(()=>null);if(!content){res.writeHead(404);return res.end('Not found');}
 res.writeHead(200,{'Content-Type':contentTypes[path.extname(filepath)]||'application/octet-stream'});res.end(content);
 }catch(err){const message=err.message||'Internal error';send(res,message==='Payload too large'?413:400,{error:message});}});
server.listen(port,()=>console.log(`StockFlow running at http://localhost:${port}`));
