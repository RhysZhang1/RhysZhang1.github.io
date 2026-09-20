<?php
/**
 * 安全头 — 在所有 PHP 页面顶部调用 sendSecurityHeaders()
 *
 * 这些头部保护站点免受常见 Web 攻击：
 *   - CSP 限制脚本/样式来源，防止 XSS
 *   - X-Frame-Options 防止点击劫持
 *   - X-Content-Type-Options 禁止 MIME 嗅探
 *   - HSTS 强制 HTTPS（仅生产环境）
 *   - Permissions-Policy 禁用不需要的浏览器 API
 */

// 阻止直接访问
if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
    http_response_code(403);
    exit('Direct access not permitted');
}

function sendSecurityHeaders(): void
{
    // 防止 MIME 类型嗅探
    header('X-Content-Type-Options: nosniff');

    // 防止点击劫持
    header('X-Frame-Options: SAMEORIGIN');

    // 关闭旧版 XSS 过滤器，依赖 CSP
    header('X-XSS-Protection: 0');

    // 控制 Referer 信息泄漏
    header('Referrer-Policy: strict-origin-when-cross-origin');

    // 禁用不需要的浏览器 API
    header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()');

    // HSTS：仅当站点运行在 HTTPS 时启用
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
    }

    // 内容安全策略
    // 字体：googleapis/gstatic 大陆不可达，页面用 fonts.loli.net 镜像，CSP 两者都保留以便回退
    $csp = implode('; ', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://giscus.app",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.loli.net",
        "font-src 'self' blob: https://fonts.gstatic.com https://gstatic.loli.net",
        // blob: 供 epub.js 渲染 iframe 与阅读器资源；frame-src 含 'self'（阅读页 PDF）
        "img-src 'self' data: blob: https:",
        "frame-src 'self' blob: https://giscus.app",
        "connect-src 'self' https://giscus.app",
        "media-src 'self' blob:",
        "worker-src 'self' blob: https://cdn.jsdelivr.net",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ]);
    header("Content-Security-Policy: $csp");
}
