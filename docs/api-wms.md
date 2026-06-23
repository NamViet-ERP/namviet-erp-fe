# WMS API Reference

Canonical vs legacy endpoints for warehouse integrations.

## Canonical (preferred)

| Resource | Method | Path | DTO |
|----------|--------|------|-----|
| Projects | GET | `/api/warehouse/projects` | `WarehouseProjectApiDto` (paged) |
| Project detail | GET | `/api/warehouse/projects/{code}` | `WarehouseProjectApiDto` |
| Project inventory | GET | `/api/warehouse/projects/{code}/inventory` | `WarehouseProjectInventoryApiDto[]` |
| Project ledger | GET | `/api/warehouse/projects/{code}/ledger` | `WarehouseProjectLedgerEntryApiDto[]` |
| Materials | GET | `/api/warehouse/materials` | `MaterialApiDto` (paged) |
| Suppliers | GET | `/api/warehouse/suppliers` | `SupplierApiDto` (paged) |
| Stock matrix | GET | `/api/stock/matrix` | `StockMatrixRowApiDto[]` |

## Transaction facade (legacy naming — `ProductId` = `MaterialCode`)

Used by import/export/transfer list pages today.

| Resource | Method | Path | Notes |
|----------|--------|------|-------|
| Imports | GET/POST | `/api/imports` | `ImportDto`, `CreateImportDto` |
| Import approve | POST | `/api/imports/{id}/approve` | Storekeeper |
| Import submit | POST | `/api/imports/{id}/submit` | PM draft → pending |
| Exports | GET/POST | `/api/exports` | `ExportDto` |
| Transfers | GET/POST | `/api/transfers` | `TransferDto` |

## Deprecated legacy

| Path | Replacement |
|------|-------------|
| `/api/projects` | `/api/warehouse/projects` |
| `WmsLegacyProjectDto` | `ProjectDto` in `WarehouseDtos` |

## Auth

All endpoints except `/api/auth/login` and `/api/auth/refresh` require `Authorization: Bearer {token}`.

## Errors

Structured validation and server errors use `application/problem+json` via global exception middleware. Some legacy actions still return plain `BadRequest(string)` — prefer ProblemDetails for new endpoints.
