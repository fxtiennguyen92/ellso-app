Luôn dùng `npx expo install` thay vì `npm install` cho thư viện Expo — nó chọn đúng phiên bản khớp SDK.

## Chạy dự án

```powershell
npm install
npm start          # môi trường local
npm run start:prod # môi trường production (EXPO_PUBLIC_APP_ENV=production)
```

Trong terminal của Expo:
- Nhấn **w** → mở bản web (khung app rộng tối đa **440px**, căn giữa màn hình, giống iPhone Pro Max).
- Nhấn **a** → Android emulator, **i** → iOS simulator (chỉ trên macOS).
- Hoặc quét mã QR bằng app **Expo Go** trên điện thoại (cùng mạng LAN với máy tính).

Kiểm tra code: `npm run typecheck`. Build web tĩnh: `npm run build:web` (ra thư mục `dist/`).

## Sáng / tối

- Mặc định theo cài đặt hệ thống (cả mobile lẫn trình duyệt).
- Để test nhanh: **nhấn giữ avatar** "NT" trên header để đổi sáng ↔ tối.
- Token màu nằm ở `src/theme/tokens.ts` (đúng bảng trong `home-screen-spec.md`). Component chỉ lấy màu qua `useTheme()`.
- Splash video luôn nền trắng ở cả hai chế độ (đúng spec splash).