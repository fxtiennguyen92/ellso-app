/**
 * Chọn môi trường qua EXPO_PUBLIC_APP_ENV (local / production).
 * `npm start` = local, `npm run start:prod` = production.
 * Hiện màn Home dùng data tạm (src/data/home.ts) nên chưa gọi API.
 */
const ENV = process.env.EXPO_PUBLIC_APP_ENV === 'production' ? 'production' : 'local';

const config = {
  local: {
    // Đổi thành IP LAN của máy chạy `php artisan serve --host=0.0.0.0 --port=8000`
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.10:8000/v1',
  },
  production: {
    apiUrl: 'https://api.ellso.edu.vn/v1',
  },
} as const;

export const env = { name: ENV, ...config[ENV] };
