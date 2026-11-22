# Fern Run — tài liệu bàn giao cho người phát triển và AI

Tài liệu này mô tả **trạng thái mã nguồn hiện tại**. Khi thay đổi hành vi game, hãy cập nhật tài liệu cùng thay đổi đó. Đọc `README.md` để chạy nhanh, sau đó đọc tài liệu này và các tệp được chỉ ra trước khi sửa.

## 1. Tổng quan và chạy dự án

Fern Run là game chạy vô tận: React 18 + TypeScript + Vite vẽ bằng Canvas 2D. Bảng xếp hạng dùng API Cloudflare Pages Functions và D1; lựa chọn nền và tên người chơi được lưu bằng `localStorage` trên từng trình duyệt.

Bảng xếp hạng dùng Pages Functions (`functions/api/leaderboard.js`) và Cloudflare D1 (`schema.sql`, `wrangler.jsonc`). Người chơi nhập tên trước ván đầu; tên lưu ở `fern-player-name` trên trình duyệt. Nút ở góc phải phía trên game mở bảng top 10 dạng hộp thoại; mở khi đang chạy sẽ tạm dừng game. API giữ điểm cao nhất theo tên và trả top 10. Tên không có tài khoản/mật khẩu, nên người khác có thể dùng cùng tên; điểm do client gửi nên có thể bị giả mạo. Không dùng bảng này cho giải thưởng hoặc phần thưởng có giá trị.

```sh
npm ci
npm run dev
```

Dùng Node.js 24. Mở URL do Vite in ra (thường là `http://localhost:5173/`). Trước khi bàn giao thay đổi, chạy:

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
```

`dist/` là sản phẩm build. Các bài kiểm tra thuần logic nằm trong `tests/*.test.mjs`; Node 24 nhập trực tiếp các module `.ts` có thể loại bỏ kiểu.

Để thử API bảng xếp hạng local: `npx --yes wrangler@4 d1 execute dino-runner-leaderboard --local --file=./schema.sql`, rồi `npm run dev:full` và mở `http://localhost:8788/`. Lệnh `npm run dev` vẫn chạy Vite để sửa UI nhanh, nhưng riêng API D1 không có ở cổng Vite.

## 2. Bản đồ mã nguồn

| Tệp | Vai trò |
| --- | --- |
| `src/main.tsx` | Giao diện React, vòng lặp `requestAnimationFrame`, trạng thái game, sinh vật cản, điều khiển, phát hiện va chạm và thứ tự vẽ Canvas. Đây là điểm vào quan trọng nhất. |
| `src/style.css` | Bố cục trang, overlay, điều khiển, chế độ toàn màn hình và màn hình xoay ngang. |
| `src/jump.ts` | Điều kiện nhảy lần hai trên vật thể bay và xử lý chân đáp lên lưng khi rơi xuống. |
| `src/collision.ts` | Va chạm gốc cây dạng hộp và núi lửa dạng thân núi thuôn. |
| `src/swipe.ts` | Quy đổi cử chỉ vuốt khi màn hình bình thường hoặc bị xoay CSS. |
| `src/restart.ts` | Quy tắc 5 giây sau khi chết. |
| `src/background.ts` | Đọc lựa chọn nền đã lưu; mặc định `simple`. |
| `src/forest.ts`, `src/ground.ts` | Cây nhiều lớp và mặt đất cỏ, đất, hóa thạch. |
| `src/midground.ts` | Lớp sương sáng và chân núi xanh lam nhạt của nền Chi tiết; đường viền rộng, ít chi tiết, trôi chậm liên tục. |
| `src/dragon.ts` | Rồng xa trước mốc 2.001 điểm; MiG-31 thay rồng sau mốc đó. |
| `src/ufo.ts` | Quy tắc 20% UFO, phóng to UFO cao nhất và hoạt ảnh đĩa bay. |
| `public/` | Sprite T-rex, Pterosaur, rồng, MiG-31, UFO và các lớp nền. |
| `.github/workflows/ci.yml` | Kiểm tra và triển khai Cloudflare Pages khi push `main`. |

## 3. Tọa độ, vòng lặp và điểm

- Canvas logic: **1000 × 420**; mặt đất ở `y = 350`; trục y tăng xuống dưới. CSS co giãn Canvas, còn quy tắc va chạm dùng tọa độ logic.
- `distance` tăng theo `speed * dt`; `score = Math.floor(distance / 10)`; cấp hiển thị là `Math.floor(score / 500) + 1`.
- Tốc độ ban đầu **280**, tăng **40** mỗi **500 điểm**, tối đa **680**: `Math.min(680, 280 + Math.floor(distance / 5000) * 40)`.
- `dt` được giới hạn tối đa **0,035 giây** mỗi khung. Khi game không ở trạng thái `playing`, vòng vẽ vẫn chạy nhưng vật lý, điểm và vật cản không cập nhật.
- Độ cao nhảy là `y` (bằng 0 khi trên đất); vận tốc nhảy **650**, trọng lực **1750**. Chân nhân vật để xét va chạm ở `346 - y`.
- `mode` nội bộ và `phase` của React có bốn giá trị: `ready`, `playing`, `paused`, `over`. Trạng thái gameplay và danh sách vật cản nằm trong effect ở `main.tsx`; thay đổi giao diện phản ánh qua React state. Rời tab hoặc mất focus sẽ tạm dừng.
- Điểm cao trên máy được lưu theo tên dưới khóa `fern-best:<tên viết thường>`. Điểm cao chung được lưu trong D1. Chỉ có **một mạng**, không có tiếp tục sau va chạm.

## 4. Điều khiển và chơi lại

- Máy tính: `Space`, `↑` hoặc bấm vào vùng game để bắt đầu/nhảy; giữ `↓` để cúi, thả để đứng. Cúi chỉ thay đổi tư thế khi đang ở mặt đất.
- Cảm ứng: chạm vùng game để bắt đầu/nhảy; vuốt lên để nhảy; vuốt xuống và **giữ** để cúi, nhấc tay để đứng. `src/swipe.ts` yêu cầu quãng vuốt dọc ít nhất 24 px và lớn hơn chuyển động ngang 1,2 lần. Khi CSS xoay màn hình, vector vuốt được đổi trục.
- Điều khiển cảm ứng nằm ở `.stage`, dùng Pointer Events và pointer capture. Trình duyệt không hiện menu giữ lâu/chọn văn bản trong vùng game. Nút toàn màn hình và nút overlay dừng sự kiện để tránh phát nhảy ngoài ý muốn.
- Va chạm chuyển sang `over`, ghi thời điểm bằng `performance.now()`. Trong **5.000 ms** đầu, thao tác chung trong game bị bỏ qua; nút **Chơi lại** có thể bắt đầu ngay. Hết 5 giây, thao tác trong game được chơi lại. Nhấn chơi lại đặt lại điểm, độ cao, tốc độ, vật cản và quyền nhảy lần hai.
- Nút góc phải dưới vùng game bật/tắt toàn màn hình. Trên thiết bị cảm ứng dọc, game thử khóa hướng ngang; nếu trình duyệt không hỗ trợ, CSS xoay bố cục. Kiểm tra trên điện thoại thật khi sửa phần này.

## 5. Sinh vật cản và va chạm

- Vật cản sinh ở `x = 1000`, di chuyển sang trái theo tốc độ chạy và được bỏ khi `x < -80`. Khoảng chờ giữa hai lần sinh là **1,25–1,95 giây**.
- Hàng đợi `obstaclePair` chứa một vật bay và một vật dưới đất theo thứ tự tráo ngẫu nhiên. Vì ghép theo cặp, có thể có tối đa hai vật cùng nhóm sát nhau ở ranh giới cặp. Vật dưới đất luân phiên **núi lửa / gốc cây**.
- Vật bay chọn ngẫu nhiên một trong năm tâm độ cao: `[301, 286, 330, 145, 70]`. Hai mức cuối ở rất cao nhưng vẫn thuộc tiền cảnh và vẫn tính va chạm. Kích thước cơ sở của Pterosaur là `0.75` hoặc `1.1`.
- Khi **điểm > 2.000**, 20% lượt vật bay được thay bằng UFO (`shouldSpawnUfo`), không sinh thêm một vật cản ngoài lượt đó. UFO ở `flightMode === 4` (`flightY = 70`) nhân đôi `size`. Cùng biến `size` hiện được dùng cho cả vẽ và va chạm.
- T-rex dùng biên va chạm ngang **120..170**, đỉnh `350 - y - 65` khi đứng hoặc `350 - y - 29` khi cúi, chân `346 - y`. Sprite vẽ từ `x = 66` rộng 132 nên hộp va chạm cố ý nhỏ hơn hình.
- Vật bay dùng thân ngang `x + 29 ± 22 * size`, trên `flightY - 9 * size`, dưới `flightY + 7 * size`. Cả UFO cũng đi qua nhánh này. Khi đổi sprite hoặc kích thước, so hình vẽ với biên va chạm bằng mắt và cập nhật các quy tắc trong `jump.ts` tương ứng.
- Gốc cây có hộp va chạm thu nhỏ. Núi lửa dùng thân hình nón: nửa bề ngang tăng từ 9 ở đỉnh đến 28 ở chân để không chết khi đi qua khoảng trống bên sườn trên (`src/collision.ts`).
- `pterosaurLandingHeight` kiểm tra đường quét chân từ khung trước sang khung hiện tại khi đang rơi, rồi đặt chân ở trên lưng vật bay. `canPterosaurJump` cho phép cú nhảy thứ hai nếu chân đã ở trên lưng, khoảng cách dọc **0..34 px**, ngang gần phần thân và chưa dùng lượt nhảy thêm. Quyền này đặt lại khi đáp đất hoặc bắt đầu ván mới. Hàm hiện lọc theo `flying`, do đó UFO cũng hỗ trợ đáp/nhảy lần hai; tên hàm vẫn giữ từ lúc chỉ có Pterosaur.

## 6. Hiển thị và các lớp cảnh

Theo thứ tự vẽ ở `main.tsx`: (1) nền, (2) rồng/MiG-31 xa, (3) chân núi và trung cảnh nếu bật Chi tiết, (4) cây, (5) mặt đất, (6) vật cản, (7) T-rex. Khi thay thứ tự phải kiểm tra vật cản không bị che hoặc trông như nằm sai lớp.

- **Nền Đơn giản** là mặc định cho người mới: trời màu chuyển sắc, mặt trời và ba dải đồi hình sin. **Nền Chi tiết** vẽ `prehistoric-mountain-valley.png`, lớp chân núi trong suốt `prehistoric-mountain-pass.png` với độ mờ 0,58, rồi lớp sương và chân núi xanh lam dịu ở `midground.ts` trôi theo `distance * 0.055`. Trung cảnh cố ý ít chi tiết, không có đường viền sáng để nhân vật và vật cản dễ nhận ra khi chơi lâu. Sau đó cả hai chế độ dùng chung cây và mặt đất. Lựa chọn lưu ở `fern-background`; giá trị `detailed` giữ Chi tiết, còn thiếu/khác thì dùng Đơn giản. Người đã chọn trước vẫn giữ thiết lập.
- T-rex dùng `trex-motion.png` 4 cột × 2 hàng: hàng trên chạy, hàng dưới cúi. Cột chạy đổi theo `animationTime * 11`; vị trí sprite không phải hộp va chạm.
- Pterosaur dùng `pterosaur-orange-flight.png` 4 khung liên tiếp, tốc độ khung `animationTime * 4.5`. Các khung được căn theo mắt để thân/đầu không nảy quá nhiều; con lớn được giảm bão hòa và độ sáng.
- UFO dùng `ufo-detailed.png`: lơ lửng khoảng 1,2 px, nghiêng nhẹ, đèn viền và vùng sáng quét. Tránh làm hình lệch quá xa vùng va chạm.
- Rồng ở xa dùng `dragon-transparent-motion.png`: cánh đập, đuôi uốn theo các đoạn, hạ thấp và thỉnh thoảng phun lửa. Sau **2.000 điểm** MiG-31 thay toàn bộ rồng trong cùng vị trí xuất hiện; MiG có chuyển động và ánh động cơ. Hai nhân vật này chỉ là cảnh, **không va chạm**. Mốc thay là `score > 2000`, tức từ **2.001**.
- `forest.ts` tạo 12 cây chia hai lớp với tốc độ trôi khác nhau. `ground.ts` vẽ cỏ, mặt cắt đất và hóa thạch. Các ảnh `public/dragon-fire-sheet.png`, `public/dragon-flight-sheet.png` và `setup.sh` nếu thấy ở máy phát triển là tệp chưa được theo dõi và không thuộc bản chạy hiện tại.

## 7. CI, triển khai và quy tắc khi sửa tiếp

Workflow `.github/workflows/ci.yml` chạy `npm ci`, lint, test, TypeScript và build trên pull request/push. Push `main` thành công sẽ dùng artifact `dist` để deploy Cloudflare Pages dự án `dino-runner`. Secret cần có: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; repository variable: `CLOUDFLARE_PAGES_PROJECT`. Đường dẫn hiện tại: https://dino-runner-9t7.pages.dev/.

Khi thêm vật cản, giữ cân bằng lịch sinh, xác định độ cao/cách vượt qua, đồng bộ sprite với hộp va chạm và kiểm tra nhảy lần hai. Khi đổi điểm/tốc độ, nhớ rằng `distance`, `score` và cấp dùng ba thang đo khác nhau. Khi đổi cử chỉ hoặc toàn màn hình, thử cả máy tính và điện thoại ngang/dọc. Khi sửa hình nền, kiểm tra cả hai chế độ và khả năng nhìn rõ T-rex/vật cản. Thêm kiểm tra cho quy tắc logic mới, chạy các lệnh ở mục 1. Chỉ push/deploy khi chủ dự án yêu cầu.
