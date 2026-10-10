# Cách dùng:

npm start --- chạy app trỏ vào API local.
npm run start:prod --- chạy app trỏ vào server thật. Cờ --clear xóa cache, vì Expo nhúng giá trị biến lúc build.

Khi build bản phát hành bằng EAS, bạn khai báo "env": { "EXPO_PUBLIC_APP_ENV": "production" } trong profile production của eas.json.
