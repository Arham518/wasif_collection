import { requireSupabase } from '../lib/supabase'

export const ORDER_STATUSES = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

export const STATUS_LABEL = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

/** DB row -> shape used by the order lists (same fields the old local orders had). */
export function orderFromRow(r) {
  return {
    id: r.id,
    orderNumber: r.order_number,
    userId: r.user_id,
    items: Array.isArray(r.items) ? r.items : [],
    customer: { name: r.customer_name, phone: r.phone, email: r.email, address: r.address, city: r.city, notes: r.notes },
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    status: r.status,
    subtotal: Number(r.subtotal) || 0,
    shippingFee: Number(r.shipping_fee) || 0,
    total: Number(r.total) || 0,
    createdAt: r.created_at,
  }
}

/** Customer places an order (RLS: only for themselves; prices/totals re-checked in the database). */
export async function placeOrder({ userId, items, customer, paymentMethod, subtotal, shippingFee }) {
  const sb = requireSupabase()
  const payload = {
    order_number: `PKF-${Date.now().toString(36).toUpperCase()}`,
    user_id: userId,
    customer_name: customer.name,
    phone: customer.phone,
    email: customer.email || null,
    address: customer.address,
    city: customer.city,
    notes: customer.notes || null,
    items: items.map((i) => ({
      productId: i.productId, name: i.name, brand: i.brand, price: i.price, qty: i.qty, size: i.size, color: i.color, image: i.image,
    })),
    subtotal,
    shipping_fee: shippingFee,
    total: subtotal + shippingFee,
    payment_method: paymentMethod,
    payment_status: paymentMethod === 'cod' ? 'pending_cod' : 'demo_paid',
    status: 'placed',
  }
  const { data, error } = await sb.from('orders').insert(payload).select('*').single()
  if (error) throw error
  return orderFromRow(data)
}

/** Orders of the logged-in customer (RLS returns only their rows). */
export async function fetchMyOrders(userId) {
  const sb = requireSupabase()
  const { data, error } = await sb.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(orderFromRow)
}

export function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  } catch {
    return String(iso)
  }
}