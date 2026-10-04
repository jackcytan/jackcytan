// Cloudflare Worker độc lập — dùng khi trang được upload kéo-thả (không chạy được Pages Functions).
// Cách dùng: dash.cloudflare.com > Workers & Pages > Create > Worker > dán code này > Deploy.
// Sau đó mở tin-tuc.html, đặt: var CUSTOM_PROXY = 'https://<ten-worker>.<tai-khoan>.workers.dev/?url=';

const ALLOWED_HOSTS = [
  'vnexpress.net', 'tuoitre.vn', 'thanhnien.vn', 'dantri.com.vn', 'vietnamnet.vn',
  'znews.vn', 'zingnews.vn', 'vtcnews.vn', 'nld.com.vn', 'laodong.vn', 'nhandan.vn',
  'vneconomy.vn', 'cafebiz.vn', 'cafef.vn', 'genk.vn', '24h.com.vn', 'tinhte.vn',
  'vietnamplus.vn', 'ictvietnam.vn', 'baodautu.vn', 'vov.vn', 'tienphong.vn'
];

export default {
  async fetch(request, env, ctx) {
    const reqUrl = new URL(request.url);
    let target;
    try { target = new URL(reqUrl.searchParams.get('url') || ''); } catch (e) {
      return new Response('Thiếu hoặc sai tham số url', { status: 400 });
    }
    const ok = ALLOWED_HOSTS.some(h => target.hostname === h || target.hostname.endsWith('.' + h));
    if (!ok) return new Response('Nguồn không được phép', { status: 403 });

    const cache = caches.default;
    const cacheKey = new Request(reqUrl.toString(), { method: 'GET' });
    const hit = await cache.match(cacheKey);
    if (hit) return hit;

    const upstream = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DBTechRadar/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
      },
      cf: { cacheTtl: 300, cacheEverything: true }
    });
    const res = new Response(await upstream.text(), {
      status: upstream.ok ? 200 : upstream.status,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=120, s-maxage=300',
        'Access-Control-Allow-Origin': '*'
      }
    });
    if (upstream.ok) ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  }
};
