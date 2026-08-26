# Module chưa ship (FE)

Các màn dưới đây **không** có trong menu / route production cho đến khi có API thật.

| Module | Path cũ | Ghi chú |
|--------|---------|---------|
| CSKH | `/cskh/*` | **Ẩn** (`CSKH_MODULE_ENABLED = false`). Menu + URL redirect về route mặc định. Bật lại flag khi ship API. |
| Thiết lập mua hàng | `/purchasing/settings` | Redirect → `/purchasing/dashboard`. |
| Thiết lập kiểm kê | `/stocktake/settings` | Redirect → `/stocktake/list`. |

Khi ship lại: gắn menu trong `departments.ts` / `sidebarMenus.ts`, route trong `App.tsx`, lazy trong `lazyPages.ts`, và `routePermissions.ts`.
