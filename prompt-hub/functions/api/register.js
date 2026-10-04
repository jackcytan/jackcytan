// POST /api/register  { name, phone }  → lưu tài khoản vào Cloudflare KV (binding: USERS)
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

export async function onRequestPost({ request, env }) {
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
  const meta = {
    name, phone,
    created: prev.created || now,
    last: now,
    visits: (prev.visits || 0) + 1,
    ua: String(body.ua || request.headers.get('User-Agent') || '').slice(0, 120)
  };
  await env.USERS.put(phone, JSON.stringify(meta), { metadata: meta });
  return json({ ok: true, user: { name, phone, created: meta.created }, returning: !!prev.created });
}

export async function onRequest() {
  return json({ ok: false, error: 'Chỉ hỗ trợ phương thức POST.' }, 405);
}
