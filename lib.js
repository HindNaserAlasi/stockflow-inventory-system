export function reorderPoint(avgDailySales, leadDays, safetyStock) {
  if (![avgDailySales,leadDays,safetyStock].every(x=>Number.isFinite(x)&&x>=0)) throw new Error('Invalid replenishment inputs');
  return Math.ceil(avgDailySales*leadDays+safetyStock);
}
export function validateQuantity(q) {return Number.isInteger(q) && q>0;}
export function createOrder(db, lines) {
  if (!Array.isArray(lines)||!lines.length) throw new Error('Add at least one item');
  const combined = new Map();
  for (const line of lines) {
    if (!Number.isInteger(line.productId)||!validateQuantity(line.quantity)) throw new Error('Invalid order item');
    combined.set(line.productId,(combined.get(line.productId)||0)+line.quantity);
  }
  let total=0; const items=[];
  for(const [productId,quantity] of combined){
    const product=db.products.find(p=>p.id===productId);
    if(!product) throw new Error('Product not found');
    if(product.stock<quantity) throw new Error(`Insufficient stock for ${product.name}: ${product.stock} available`);
    items.push({productId,sku:product.sku,name:product.name,quantity,price:product.price}); total+=product.price*quantity;
  }
  for (const item of items) db.products.find(p=>p.id===item.productId).stock-=item.quantity;
  const order={id:db.nextOrderId++,date:new Date().toISOString(),items,total:Number(total.toFixed(2)),status:'Completed'};
  db.orders.unshift(order); return order;
}
