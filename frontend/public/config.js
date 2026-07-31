// Cấu hình API — sửa trên VPS sau khi deploy, KHÔNG cần npm run build lại
(function () {
  var host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return;

  // Khuyến nghị: Nginx proxy https://domain.com/api → backend
  window.__API_BASE__ = '/api';

  // Nếu chưa có Nginx, dùng IP + port (bỏ comment 2 dòng dưới, comment dòng trên):
  // window.__API_BASE__ = window.location.protocol + '//' + host + ':5161/api';

  // Hoặc subdomain API:
  // window.__API_BASE__ = 'https://api.' + host.replace(/^www\./, '') + '/api';
})();
