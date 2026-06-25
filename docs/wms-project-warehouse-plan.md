# WMS — Kho dự án làm trung tâm (Plan chốt)

> Cập nhật: 2026-06-19  
> Nguyên tắc: 1 dự án = 1 kho dự án (`Project` + `project_inventory`). Kho tổng = `wh-general`.

---

## 1. Menu (IA) — theo luồng nghiệp vụ

```
Kho hàng
├── Tổng quan
├── Kho dự án          ← CRUD dự án, Active/Closed, chi tiết tồn + lịch sử
├── Tồn kho            ← ma trận VT (kho tổng + phân bổ dự án)
├── Nhập kho           ← cấp VT vào kho dự án (kho tổng trước, thiếu → NCC)
├── Xuất kho           ← tiêu hao tại công trình
├── Chuyển kho         ← hoàn trả dư / đóng kho / (sau: chuyển DA→DA)
├── Danh mục vật tư
└── Thiết lập
```

**Đã bỏ:** Danh sách kho mock (KHO-HCM…). **Gộp:** Dự án → Kho dự án.

---

## 2. Công thức tồn kho (ma trận Tồn kho)

| Cột | Công thức | Dùng ngay? |
|-----|-----------|------------|
| **Kho tổng** | `warehouse_inventory` @ wh-general | Một phần |
| **Giữ kho** | Σ reservation `Holding` (phiếu nhập draft/pending) | Không |
| **Tồn dự án thực tế** | Σ (ActualImport − ActualExport) mọi dự án | Có |
| **Tồn dự án dự kiến** | Σ (PlannedImport − PlannedExport) | Không |
| **Khả dụng** | **(Kho tổng − Giữ kho) + Tồn dự án thực tế** | Có |

Dấu `+` trên dự kiến = sắp cộng khi chốt phiếu nhập.

---

## 3. Vòng đời phiếu (Nhập / Xuất / Chuyển)

```
Draft (PM soạn) → Pending (PM chốt) → Approved (Thủ kho duyệt) → cập nhật tồn thực tế
```

| Loại | Draft | Approved |
|------|-------|----------|
| **Nhập** | +PlannedImport, +Giữ kho (phần từ kho tổng) | +Tồn DA thực tế, −Kho tổng |
| **Xuất** | +PlannedExport | −Tồn DA thực tế (tiêu hao) |
| **Chuyển hoàn** | — | −Tồn DA, +Kho tổng |

**Thiếu VT đi mua** → Nhập kho lại (phiếu mới, có lịch sử).  
**Dư VT** → Chuyển kho hoàn về kho tổng (Phase 2: chọn VT+SL, optional ConstructionPhase).  
**Kết dự án** → Đóng kho (`ApplyProjectCloseTransferAsync` — đã có BE).

**Không làm:** PhaseLocked / khóa xuất theo milestone (hoãn).

---

## 4. Lộ trình triển khai

### Phase A — Menu + công thức ✅ (đang làm)
- [ ] Sidebar IA mới, đổi label
- [ ] Redirect `/warehouse/list` → `/warehouse/projects`
- [ ] Sửa Khả dụng = (Kho tổng − Giữ kho) + Tồn DA thực tế
- [ ] Đổi title trang Tồn kho, Kho dự án

### Phase B — Kho dự án (UI)
- [ ] Đổi title ProjectsPage → "Kho dự án"
- [ ] Nút "Tạo kho dự án" (nếu API create project có)
- [ ] Chi tiết: tab Tồn / Lịch sử (placeholder)

### Phase C — Nhập kho
- [ ] Form: chọn kho dự án trước
- [ ] Split dòng: kho tổng / NCC (thiếu)
- [ ] Badge trạng thái Dự kiến / Chờ duyệt / Thực tế
- [ ] CRUD draft + 2 bước chốt

### Phase D — Xuất kho
- [ ] BE: export gắn ProjectCode, planned/actual project_inventory
- [ ] FE: chọn kho dự án, validate ≤ tồn thực tế
- [ ] 2 bước chốt

### Phase E — Chuyển kho Phase 1
- [ ] Phiếu hoàn trả: kho dự án → kho tổng (VT + SL)
- [ ] Giữ nút Đóng kho ở chi tiết kho dự án

### Phase F — Lịch sử kho dự án
- [ ] `GET /api/projects/{code}/ledger`
- [ ] Tab lịch sử trong chi tiết kho dự án

### Phase G — Chuyển kho Phase 2
- [ ] Chọn VT + SL, optional ConstructionPhase (báo cáo)
- [ ] Không auto hoàn hết theo công đoạn

### Phase H — Chuyển kho Phase 3
- [ ] Chuyển kho dự án → kho dự án khác

---

## 5. Kiến trúc đã có (tận dụng)

- `project_inventory`, `inventory_reservations`, `InventoryDomainService`
- Import draft → reserve → fulfill
- `POST /projects/{code}/close`
- `GET /api/stock/matrix`

## 6. Cần bổ sung BE

- Export → `project_inventory` (planned/actual)
- Transfer return → `ReturnToGeneral`
- Project ledger API
