// GET /api/users?key=ADMIN_KEY            → tải file danh-sach-tai-khoan.txt
// GET /api/users?key=ADMIN_KEY&format=csv → tải file .csv (mở bằng Excel)
// GET /api/users?key=ADMIN_KEY&format=json → dữ liệu JSON (dùng cho trang Quản trị trong app)
const vn = d => d ? new Date(d).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false }) : '';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) return new Response('Sai mã quản trị.', { status: 401, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  if (!env.USERS) return new Response('Chưa gắn KV USERS.', { status: 500 });

  const users = [];
  let cursor;
  do {
    const page = await env.USERS.list({ cursor, limit: 1000 });
    for (const k of page.keys) users.push(k.metadata || { phone: k.name });
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  users.sort((a, b) => String(a.created || '').localeCompare(String(b.created || '')));
  users.forEach(u => { u.createdVN = vn(u.created); u.lastVN = vn(u.last); });

  const format = url.searchParams.get('format');
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === 'json') return new Response(JSON.stringify({ users }), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
  if (format === 'csv') {
    const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    const csv = '﻿' + ['STT,Họ tên,Số Zalo,Ngày đăng ký,Lần truy cập cuối,Số lượt'].concat(users.map((u, i) => [i + 1, q(u.name), q(u.phone), q(u.createdVN), q(u.lastVN), u.visits || 1].join(','))).join('\r\n');
    return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="danh-sach-tai-khoan-' + stamp + '.csv"', 'Cache-Control': 'no-store' } });
  }
  const lines = ['DANH SÁCH TÀI KHOẢN – DRABUFF PROMPT HUB', 'Xuất lúc: ' + vn(new Date().toISOString()) + ' · Tổng: ' + users.length + ' tài khoản', '='.repeat(72)]
    .concat(users.map((u, i) => (i + 1) + '. ' + (u.name || '') + ' | Zalo: ' + (u.phone || '') + ' | Đăng ký: ' + u.createdVN + ' | Lần cuối: ' + u.lastVN + ' | Lượt: ' + (u.visits || 1)));
  return new Response(lines.join('\r\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': 'attachment; filename="danh-sach-tai-khoan-' + stamp + '.txt"', 'Cache-Control': 'no-store' } });
}
