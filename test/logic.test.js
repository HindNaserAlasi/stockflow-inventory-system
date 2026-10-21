import test from 'node:test';import assert from 'node:assert/strict';import {reorderPoint,createOrder} from '../lib.js';
test('reorder point includes lead time and safety stock',()=>assert.equal(reorderPoint(8,4,10),42));
test('invalid inputs rejected',()=>assert.throws(()=>reorderPoint(-1,3,2)));
test('sale decreases stock and records total',()=>{const d={products:[{id:1,sku:'A',name:'A',stock:10,price:4}],orders:[],nextOrderId:1};const o=createOrder(d,[{productId:1,quantity:3}]);assert.equal(o.total,12);assert.equal(d.products[0].stock,7)});
test('insufficient stock does not mutate inventory',()=>{const d={products:[{id:1,sku:'A',name:'A',stock:2,price:4}],orders:[],nextOrderId:1};assert.throws(()=>createOrder(d,[{productId:1,quantity:3}]));assert.equal(d.products[0].stock,2)});
test('duplicate product order lines cannot bypass stock validation',()=>{const d={products:[{id:1,sku:'A',name:'A',stock:5,price:4}],orders:[],nextOrderId:1};assert.throws(()=>createOrder(d,[{productId:1,quantity:3},{productId:1,quantity:3}]));assert.equal(d.products[0].stock,5)});
