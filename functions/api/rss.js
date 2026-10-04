// Cloudflare Pages Function: GET /api/rss?url=<RSS URL>
// Lấy RSS từ các báo trong danh sách cho phép, trả về kèm CORS và cache 5 phút.
// Dùng khi deploy bằng Git hoặc `npx wrangler pages deploy dist` chạy từ thư mục gốc repo.

const ALLOWED_HOSTS = [
  'vnexpress.net', 'tuoitre.vn', 'thanhnien.vn', 'dantri.com.vn', 'vietnamnet.vn',
  'znews.vn', 'zingnews.vn', 'vtcnews.vn', 'nld.com.vn', 'laodong.vn', 'nhandan.vn',
  'vneconomy.vn', 'cafebiz.vn', 'cafef.vn', 'genk.vn', '24h.com.vn', 'tinhte.vn',
  'vietnamplus.vn', 'ictvietnam.vn', 'baodautu.vn', 'vov.vn', 'tienphong.vn'
];

function isAllowed(u) {
  return (u.protocol === 'https:' || u.protocol === 'http:') &&
    ALLOWED_HOSTS.some(h => u.hostname === h || u.hostname.endsWith('.' + h));
}

export async function onRequestGet(context) {
  const reqUrl = new URL(context.request.url);
  let target;
  try { target = new URL(reqUrl.searchParams.get('url') || ''); } catch (e) {
    return new Response('Thiếu hoặc sai tham số url', { status: 400 });
  }
  if (!isAllowed(target)) return new Response('Nguồn không được phép', { status: 403 });

  const cache = caches.default;
  const cacheKey = new Request(reqUrl.toString(), { method: 'GET' });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const upstream = await fetch(target.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DBTechRadar/1.0; +https://pages.dev)',
      'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
    },
    cf: { cacheTtl: 300, cacheEverything: true }
  });
  const body = await upstream.text();
  const res = new Response(body, {
    status: upstream.ok ? 200 : upstream.status,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=120, s-maxage=300',
      'Access-Control-Allow-Origin': '*'
    }
  });
  if (upstream.ok) context.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}
