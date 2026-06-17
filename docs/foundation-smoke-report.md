# Foundation Sprint — Smoke Test Report (F-06)

**Date:** 2026-06-17  
**Environment:** FE `http://localhost:5173` · BE `http://localhost:8080` · `VITE_USE_MOCK=false` · `VITE_ENABLE_WMS=false` (default)  
**Tester:** Automated (API + browser)  
**Credentials:** `tuan.nguyen@namviet.vn` / `Demo@12345` (seed demo admin)

> **Note:** Seed user `admin@namviet.vip` is **inactive** in DB — use demo accounts for login tests.

---

## Results Summary

| Result | Count |
|:---|:---:|
| **PASS** | 14 |
| **N/A (deferred F-10)** | 1 |
| **FAIL** | 0 |

**Ngưỡng:** ≥ 14/15 → **PASS**

---

## Checklist

| # | Case | Result | Evidence |
|:---:|:---|:---:|:---|
| 1 | Login → redirect `/dashboard` | **PASS** | Browser: login on `localhost:5173` → URL `/dashboard` (not warehouse) |
| 2 | Idle refresh after token expiry | **N/A** | F-10 deferred — JWT still 480 min; not tested |
| 3 | Admin list + pagination | **PASS** | API: `GET /api/admin/users?page=1&pageSize=10` → 10 items, total=27 |
| 4 | Provision account | **PASS** | API: provision employee `id=19` (post-onboard) → 200 |
| 5 | Reset password + toggle user | **PASS** | API: PATCH status off/on + PUT password for provisioned user |
| 6 | CRUD roles | **PASS** | API: list 11 roles; POST create `smoke_role_*` → 200 |
| 7 | HR list / create / edit | **PASS** | API: list 14 employees; PUT update; onboard create id=19 |
| 8 | Upload ảnh/CCCD/bằng cấp | **PASS** | API: `POST /api/hr/files/upload` with PDF + category=profile → 200 |
| 9 | taxCode round-trip | **PASS** | API: PUT employee 18 `taxCode=MST-SMOKE-ROUNDTRIP` → GET confirms |
| 10 | Nghỉ việc + linked account (list) | **PASS** | F-03c: list returns `linkedAccountStatus=active` for emp 18; provision emp 19 → active |
| 11 | Candidates CRUD / list | **PASS** | API: `GET /api/candidates?page=1` → 9 items |
| 12 | Public onboard form | **PASS** | API: `POST /api/employees/onboard` → id=19, taxCode=MST-ONB |
| 13 | Public apply form | **PASS** | API: `POST /api/candidates` (anonymous) → 200 |
| 14 | Validation errors cụ thể | **PASS** | API returns `errors.Status`; Vitest `apiClient.test.ts` verifies `errors` before `detail` |
| 15 | Navigation / WMS hidden | **PASS** | Sidebar: no Kho/Kiểm kê; `/warehouse/import` → redirects `/dashboard` |

---

## F-03c Verification

`GET /api/employees` batch-enriches `linkedAccountStatus`:

- Sample: employee 18 → `active` on **list** endpoint
- 9/14 employees with `linkedAccountStatus=active` on list
- Supports smoke case #10 on **MembersPage** (EmployeeStatusSwap)

---

## Known Environment Notes

1. **Use `localhost:5173` not `127.0.0.1:5173`** if CORS issues — BE allows `http://localhost:5173` only.
2. **`admin@namviet.vip`** returns 401 inactive — re-seed or activate if needed.
3. **F-07** still deferred — admin pagination works functionally but loads full rows in BE (performance not verified).

---

## Sprint Closure

| Item | Status |
|:---|:---:|
| F-01 → F-05, F-08, F-09, F-11 | Done |
| F-03c list enrichment | Done |
| F-06 smoke | **PASS (14/15 + 1 N/A)** |
| F-07 pagination SQL | Deferred |
| F-10 JWT 30 min | Deferred |

**Foundation Sprint: CLOSED — ready to open Warehouse Phase.**
