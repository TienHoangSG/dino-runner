# Fern Run
Game khủng long chạy vô tận với React, TypeScript và Canvas.

## Chạy trên máy
Dùng Node.js 24. Chạy npm ci rồi npm run dev và mở địa chỉ Vite hiển thị.

Để thử đầy đủ bảng xếp hạng, chạy một lần `npx --yes wrangler@4 d1 execute dino-runner-leaderboard --local --file=./schema.sql`, sau đó chạy `npm run dev:full` và mở `http://localhost:8788/`. Cổng Vite (`npm run dev`) chỉ phục vụ giao diện, không chạy API lưu điểm.

Nhấn Space, mũi tên lên hoặc chạm màn hình để bắt đầu và nhảy. Chạm lại để chơi lại khi va chạm. Chuyển tab sẽ tạm dừng game.

## Kiểm tra
Chạy npm test, npm run lint, npx tsc --noEmit và npm run build. Bản build nằm trong dist.

## Bảng xếp hạng

Người chơi nhập tên trước ván đầu. Tên được nhớ trên trình duyệt. Khi hết ván, game gửi điểm lên Cloudflare Pages Functions; Cloudflare D1 giữ điểm cao nhất theo tên và trả về 10 người dẫn đầu. Database dùng cấu trúc trong `schema.sql` và binding `DB` trong `wrangler.jsonc`.

Trước khi triển khai lần đầu, tạo D1 database tên `dino-runner-leaderboard`, điền `database_id` vào `wrangler.jsonc`, rồi chạy `npx --yes wrangler@4 d1 execute dino-runner-leaderboard --remote --file=./schema.sql`. Database của dự án này đã được tạo và khởi tạo. Push `main` sẽ triển khai giao diện và API qua GitHub Actions.

Bảng xếp hạng hiện dùng tên làm định danh, chưa có tài khoản. Người khác có thể dùng cùng tên; điểm được trình duyệt gửi lên nên có thể bị giả mạo. Không dùng kết quả cho giải thưởng có giá trị nếu chưa bổ sung xác thực và kiểm tra điểm trên server.
