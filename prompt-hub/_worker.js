// Máy chủ Drabuff Prompt Hub (Cloudflare Pages – advanced mode).
// Cần: KV binding tên USERS và biến bí mật ADMIN_KEY (xem HUONG-DAN.txt).
//   POST /api/register             { name, phone } → lưu tài khoản
//   GET  /api/users?key=ADMIN_KEY  → tải danh-sach-tai-khoan.txt  (&format=csv | json)
//   GET  /api/ping                 → kiểm tra máy chủ đã hoạt động
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const vn = d => d ? new Date(d).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false }) : '';

async function register(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, error: 'Dữ liệu gửi lên không hợp lệ.' }, 400); }
  const name = String(body.name || '').normalize('NFC').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const phone = String(body.phone || '').replace(/[^\d+]/g, '').replace(/^\+?84/, '0');
  if (name.length < 2) return json({ ok: false, error: 'Vui lòng nhập họ và tên.' }, 400);
  if (!/^0\d{9}$/.test(phone)) return json({ ok: false, error: 'Số Zalo phải gồm 10 số và bắt đầu bằng 0.' }, 400);
  if (!env.USERS) return json({ ok: false, error: 'Máy chủ chưa gắn kho lưu trữ KV (USERS).' }, 500);
  const now = new Date().toISOString();
  const old = await env.USERS.getWithMetadata(phone);
  const prev = (old && old.metadata) || {};
  const meta = { name, phone, created: prev.created || now, last: now, visits: (prev.visits || 0) + 1, ua: String(body.ua || request.headers.get('User-Agent') || '').slice(0, 120) };
  await env.USERS.put(phone, JSON.stringify(meta), { metadata: meta });
  return json({ ok: true, user: { name, phone, created: meta.created }, returning: !!prev.created });
}

async function users(request, env) {
  const url = new URL(request.url);
  if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) return new Response('Sai mã quản trị.', { status: 401, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  if (!env.USERS) return new Response('Chưa gắn KV USERS.', { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  const list = [];
  let cursor;
  do {
    const page = await env.USERS.list({ cursor, limit: 1000 });
    for (const k of page.keys) list.push(k.metadata || { phone: k.name });
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  list.sort((a, b) => String(a.created || '').localeCompare(String(b.created || '')));
  list.forEach(u => { u.createdVN = vn(u.created); u.lastVN = vn(u.last); });
  const format = url.searchParams.get('format'), stamp = new Date().toISOString().slice(0, 10);
  if (format === 'json') return json({ users: list });
  if (format === 'csv') {
    const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    const csv = '﻿' + ['STT,Họ tên,Số Zalo,Ngày đăng ký,Lần truy cập cuối,Số lượt'].concat(list.map((u, i) => [i + 1, q(u.name), q(u.phone), q(u.createdVN), q(u.lastVN), u.visits || 1].join(','))).join('\r\n');
    return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="danh-sach-tai-khoan-' + stamp + '.csv"', 'Cache-Control': 'no-store' } });
  }
  const lines = ['DANH SÁCH TÀI KHOẢN – DRABUFF PROMPT HUB', 'Xuất lúc: ' + vn(new Date().toISOString()) + ' · Tổng: ' + list.length + ' tài khoản', '='.repeat(72)]
    .concat(list.map((u, i) => (i + 1) + '. ' + (u.name || '') + ' | Zalo: ' + (u.phone || '') + ' | Đăng ký: ' + u.createdVN + ' | Lần cuối: ' + u.lastVN + ' | Lượt: ' + (u.visits || 1)));
  return new Response(lines.join('\r\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': 'attachment; filename="danh-sach-tai-khoan-' + stamp + '.txt"', 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/api/register') return request.method === 'POST' ? await register(request, env) : json({ ok: false, error: 'Chỉ hỗ trợ phương thức POST.' }, 405);
      if (pathname === '/api/users') return await users(request, env);
      if (pathname === '/api/ping') return json({ ok: true, may_chu: 'đang hoạt động', kv_USERS: !!env.USERS, ADMIN_KEY: !!env.ADMIN_KEY });
    } catch (e) {
      return json({ ok: false, error: 'Lỗi máy chủ: ' + (e && e.message) }, 500);
    }
    return env.ASSETS.fetch(request);
  }
};
