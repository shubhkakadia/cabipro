# Codebase Map - cabipro (Detailed)

## Quick facts
- Next.js 16 app-router project, React 19, TypeScript.
- Prisma (MariaDB adapter) with generated client in `generated/prisma`.
- Redux Toolkit for client state; Tailwind CSS for styling.
- Uses AOS, TipTap editor, react-toastify, Chart.js, xlsx, and other UI/util libs.

## Top-level layout
- `app/`: Next.js app-router pages and API route handlers.
- `components/`: shared UI components, layout pieces, and providers.
- `hooks/`: custom React hooks.
- `lib/`: server and client utilities (auth, db, store, helpers).
- `prisma/`: Prisma schema and migrations.
- `generated/`: Prisma client output.
- `public/`: static assets and uploaded media (images, PDFs).
- `mediauploads/`: additional uploaded media assets.
- `config/versions.json`: app version metadata used in sidebar.
- `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `prisma.config.ts`: framework/tooling config.
- `.next/`, `node_modules/`: build output and dependencies (generated/vendor).

## Global app shell
- `app/layout.tsx`: root layout, fonts (Inter/Manrope), providers, and Google Analytics.
- `app/globals.css`: global styles.
- `components/ConditionalLayout.tsx`: hides public header/footer on `/app` and `/admin` routes.

## Public site routes (UI)
- `/` -> `app/page.tsx`
- `/features` -> `app/features/page.tsx`
- `/features/quoting-software` -> `app/features/quoting-software/page.tsx`
- `/features/project-management` -> `app/features/project-management/page.tsx`
- `/features/inventory-management` -> `app/features/inventory-management/page.tsx`
- `/features/invoicing` -> `app/features/invoicing/page.tsx`
- `/industries/cabinet-makers` -> `app/industries/cabinet-makers/page.tsx`
- `/industries/joinery` -> `app/industries/joinery/page.tsx`
- `/blog` -> `app/blog/page.tsx`
- `/blog/how-cabinet-makers-manage-materials-cut-waste` -> `app/blog/how-cabinet-makers-manage-materials-cut-waste/page.tsx`
- `/blog/cabinet-maker-software-vs-spreadsheets` -> `app/blog/cabinet-maker-software-vs-spreadsheets/page.tsx`
- `/blog/cloud-software-security-for-cabinet-makers` -> `app/blog/cloud-software-security-for-cabinet-makers/page.tsx`
- `/pricing` -> `app/pricing/page.tsx`
- `/contact` -> `app/contact/page.tsx`
- `/waitlist` -> `app/waitlist/page.tsx`
- `/privacy` -> `app/privacy/page.tsx`
- `/terms` -> `app/terms/page.tsx`

## Auth routes and layouts
- `/login` -> `app/login/page.tsx`, layout redirect guard in `app/login/layout.tsx`.
- `/signup` -> `app/signup/page.tsx`, layout redirect guard in `app/signup/layout.tsx`.
- `/forgot-password` -> `app/forgot-password/page.tsx`.

## Admin routes
- `/admin` -> `app/admin/page.tsx`.
- `app/admin/layout.tsx`: admin-only guard; redirects clients to `/app` and unauthenticated users to `/login`.

## Product app routes (authenticated)
- `app/app/layout.tsx`: client auth guard; redirects admins to `/admin`.
- `/app` -> `app/app/page.tsx`.
- `/app/clients` -> `app/app/clients/page.tsx`.
- `/app/clients/addclient` -> `app/app/clients/addclient/page.tsx`.
- `/app/clients/[id]` -> `app/app/clients/[id]/page.tsx`.
- `/app/projects` -> `app/app/projects/page.tsx`.
- `/app/projects/addproject` -> `app/app/projects/addproject/page.tsx`.
- `/app/projects/[id]` -> `app/app/projects/[id]/page.tsx`.
- `/app/projects/lotatglance` -> `app/app/projects/lotatglance/page.tsx`.
- `/app/inventory` -> `app/app/inventory/page.tsx`.
- `/app/inventory/additem` -> `app/app/inventory/additem/page.tsx`.
- `/app/inventory/[id]` -> `app/app/inventory/[id]/page.tsx`.
- `/app/inventory/usedmaterial` -> `app/app/inventory/usedmaterial/page.tsx`.
- `/app/suppliers` -> `app/app/suppliers/page.tsx`.
- `/app/suppliers/addsupplier` -> `app/app/suppliers/addsupplier/page.tsx`.
- `/app/suppliers/[id]` -> `app/app/suppliers/[id]/page.tsx`.
- `/app/suppliers/materialstoorder` -> `app/app/suppliers/materialstoorder/page.tsx`.
- `/app/suppliers/purchaseorder` -> `app/app/suppliers/purchaseorder/page.tsx`.
- `/app/suppliers/statements` -> `app/app/suppliers/statements/page.tsx`.
- `/app/employees` -> `app/app/employees/page.tsx`.
- `/app/employees/addemployee` -> `app/app/employees/addemployee/page.tsx`.
- `/app/employees/[id]` -> `app/app/employees/[id]/page.tsx`.
- `/app/logs` -> `app/app/logs/page.tsx`.
- `/app/settings` -> `app/app/settings/page.tsx`.
- `/app/site_photos` -> `app/app/site_photos/page.tsx`.
- `/app/config` -> `app/app/config/page.tsx`.
- `/app/deletefiles` -> `app/app/deletefiles/page.tsx`.

### Product app components under `app/app`
- Inventory: `app/app/inventory/components/MultiSelectDropdown.tsx`.
- Projects: `app/app/projects/components/StageTable.tsx`, `app/app/projects/components/SiteMeasurement.tsx`, `app/app/projects/components/MaterialsToOrder.tsx`, `app/app/projects/components/MaterialSelectionConstants.tsx`, `app/app/projects/components/MaterialSelection.tsx`, `app/app/projects/components/FileUploadSection.tsx`.
- Suppliers: `app/app/suppliers/components/Statement.tsx`, `app/app/suppliers/components/PurchaseOrderForm.tsx`, `app/app/suppliers/components/PurchaseOrder.tsx`, `app/app/suppliers/components/MaterialsToOrder.tsx`.
- Suppliers purchase order modals: `app/app/suppliers/purchaseorder/components/CreatePurchaseOrderModal.tsx`, `app/app/suppliers/purchaseorder/components/AddItemModal.tsx`.
- Suppliers materials-to-order modal: `app/app/suppliers/materialstoorder/components/CreateMaterialsToOrderModal.tsx`.

## Special routes
- `app/not-found.tsx`: 404 UI.
- `app/robots.ts`: robots rules and sitemap URL.
- `app/sitemap.ts`: static sitemap entries.
- `app/favicon.ico`: site icon.

## API routes (`app/api`)
Methods are derived from exported route handlers.

### Auth and session
- `app/api/login/route.ts`: POST
- `app/api/logout/route.ts`: POST
- `app/api/signup/route.ts`: POST
- `app/api/admin-signup/route.ts`: POST
- `app/api/me/route.ts`: GET
- `app/api/user/[id]/route.ts`: GET, PATCH, DELETE

### Marketing and misc
- `app/api/contact/create/route.ts`: POST
- `app/api/contact/all/route.ts`: GET
- `app/api/contact/[id]/route.ts`: GET, PATCH, DELETE
- `app/api/contactcabipro/route.ts`: POST
- `app/api/waitlist/route.ts`: POST
- `app/api/subscribe/route.ts`: POST
- `app/api/search/route.ts`: POST
- `app/api/dashboard/route.ts`: POST

### Core domain CRUD
- Clients:
  - `app/api/client/all/route.ts`: GET
  - `app/api/client/allnames/route.ts`: GET
  - `app/api/client/create/route.ts`: POST
  - `app/api/client/[id]/route.ts`: GET, PATCH, DELETE
- Projects:
  - `app/api/project/all/route.ts`: GET
  - `app/api/project/create/route.ts`: POST
  - `app/api/project/[id]/route.ts`: GET, PATCH, DELETE
- Lots and stages:
  - `app/api/lot/active/route.ts`: GET
  - `app/api/lot/create/route.ts`: POST
  - `app/api/lot/[id]/route.ts`: GET, PATCH, DELETE
  - `app/api/stage/create/route.ts`: POST
  - `app/api/stage/[id]/route.ts`: PATCH, DELETE
  - `app/api/lot_file/[id]/route.ts`: PATCH
  - `app/api/lot_tab_notes/create/route.ts`: POST
  - `app/api/lot_tab_notes/[id]/route.ts`: GET, PATCH
  - `app/api/maintenance_checklist/upsert/route.ts`: POST
- Employees:
  - `app/api/employee/all/route.ts`: GET
  - `app/api/employee/all_inactive/route.ts`: GET
  - `app/api/employee/create/route.ts`: POST
  - `app/api/employee/[id]/route.ts`: GET, PATCH, DELETE
- Suppliers:
  - `app/api/supplier/all/route.ts`: GET
  - `app/api/supplier/create/route.ts`: POST
  - `app/api/supplier/[id]/route.ts`: GET, PATCH, DELETE
  - `app/api/supplier/statements/route.ts`: GET
  - `app/api/supplier/[id]/statements/route.ts`: GET, POST
  - `app/api/supplier/[id]/statements/[statementId]/route.ts`: PATCH, DELETE
- Items:
  - `app/api/item/all/[category]/route.ts`: GET
  - `app/api/item/by-supplier/[id]/route.ts`: GET
  - `app/api/item/create/route.ts`: POST
  - `app/api/item/[id]/route.ts`: GET, PATCH, DELETE
- Materials to order:
  - `app/api/materials_to_order/all/route.ts`: GET
  - `app/api/materials_to_order/create/route.ts`: POST
  - `app/api/materials_to_order/by-supplier/[id]/route.ts`: GET
  - `app/api/materials_to_order/[id]/route.ts`: GET, PATCH, DELETE
  - `app/api/materials_to_order_item/[id]/route.ts`: PATCH
- Material selection:
  - `app/api/material_selection/create/route.ts`: POST
  - `app/api/material_selection/lot/[lot_id]/route.ts`: GET
  - `app/api/material_selection/version/[version_id]/route.ts`: GET
  - `app/api/material_selection/[id]/route.ts`: GET
- Purchase orders:
  - `app/api/purchase_order/all/route.ts`: GET
  - `app/api/purchase_order/create/route.ts`: POST
  - `app/api/purchase_order/by-supplier/[id]/route.ts`: GET
  - `app/api/purchase_order/[id]/route.ts`: GET, PATCH, DELETE
- Stock:
  - `app/api/stock_transaction/create/route.ts`: POST
  - `app/api/stock_transaction/by-item/[id]/route.ts`: GET
  - `app/api/stock_tally/route.ts`: POST
- Config and access:
  - `app/api/config/create/route.ts`: POST
  - `app/api/config/read_all_by_category/route.ts`: POST
  - `app/api/config/[id]/route.ts`: GET, PATCH, DELETE
  - `app/api/module_access/create/route.js`: POST
  - `app/api/module_access/[id]/route.js`: GET, PATCH
- Logs:
  - `app/api/logs/route.ts`: GET
- Deleted media/records:
  - `app/api/deletedmedia/all/route.ts`: GET, DELETE
  - `app/api/deletedmedia/[filename]/route.ts`: DELETE
  - `app/api/deletedrecords/all/route.ts`: GET
  - `app/api/deletedrecords/recover/route.ts`: PATCH
- Uploads:
  - `app/api/uploads/lots/[...path]/route.ts`: GET, POST, DELETE
  - `app/api/uploads/material-selection/[id]/route.ts`: POST, DELETE
  - `app/api/uploads/materials-to-order/[id]/route.ts`: POST, DELETE

## Components
- `components/AOSProvider.tsx`: initializes AOS animations on client.
- `components/ReduxProvider.tsx`: wraps app with Redux store provider.
- `components/ToastProvider.tsx`: react-toastify container.
- `components/ConditionalLayout.tsx`: conditional header/footer for public vs app routes.
- `components/AppHeader.tsx`: authenticated header with user dropdown and logout.
- `components/Header.tsx`: public marketing header with mobile menu.
- `components/Footer.tsx`: public footer with links and contact info.
- `components/FeatureCarousel.tsx`: carousel with swipe support for feature cards.
- `components/AnimatedCounter.tsx`: animated number counter using Motion.
- `components/ContactSection.tsx`: contacts list, CRUD modals, validation.
- `components/DeleteConfirmation.tsx`: delete confirmation modal with optional name input and related data warning.
- `components/PaginationFooter.tsx`: paginated list controls.
- `components/sidebar.tsx`: main product sidebar navigation + version display.
- `components/StockTally.tsx`: Excel-based stock tally flow (download, upload, preview, save).
- `components/UploadProgressBar.tsx`: progress UI for uploads.
- `components/ViewMedia.tsx`: preview modal for images, PDFs, and videos with navigation and zoom.
- `components/validators.ts`: phone validation and formatting (AU).
- `components/constants.tsx`: stages/tabs lists, role options, deletion warnings.
- `components/interfaces.tsx`: currently empty placeholder.
- `components/TextEditor/TextEditor.tsx`: TipTap editor with toolbar, colors, highlighting, autosave.

## Hooks
- `hooks/useUploadProgress.tsx`: toast-driven upload progress controller for axios.
- `hooks/useExcelExport.ts`: reusable Excel export hook (xlsx).

## Server and shared libs (`lib`)
- `lib/db.ts`: Prisma client setup with MariaDB adapter and DB URL parsing.
- `lib/prisma-middleware.ts`: AsyncLocalStorage org scoping for Prisma queries.
- `lib/tenant.ts`: tenant lookup and request context wiring.
- `lib/auth.ts`: user auth utilities (hash/verify, JWT, session creation).
- `lib/admin-auth.ts`: admin auth utilities (JWT, session creation).
- `lib/auth-middleware.ts`: request auth helpers and guards for user/admin.
- `lib/cookies.ts`: auth cookie helpers and session TTL logic.
- `lib/store.ts`: Redux store setup + user state persistence to localStorage.
- `lib/hooks.ts`: typed Redux hooks.
- `lib/slices/userSlice.ts`: user state slice and actions.
- `lib/useLogout.ts`: logout helper (API call + state cleanup).
- `lib/filehandler.ts`: file upload, WebP conversion, metadata, virus scan hook.
- `lib/scanFile.ts`: stubbed malware scan (always clean).
- `lib/slug-utils.ts`: generate URL-friendly slugs.
- `lib/unique-slug.ts`: generate unique org slugs via DB checks.
- `lib/withLogging.ts`: logs CRUD actions tied to authenticated user.

## Data model (Prisma)
Defined in `prisma/schema.prisma`.

### Models
- `organization`, `constants_config`
- `Admin`, `admin_sessions`
- `users`, `sessions`, `module_access`
- `employees`
- `client`, `contact`
- `project`, `lot`, `stage`, `stage_employee`, `lot_tab`, `lot_file`, `maintenance_checklist`
- `quote`, `material_selection`, `material_selection_versions`, `material_selection_version_area`, `material_selection_version_area_item`
- `item`, `sheet`, `handle`, `hardware`, `accessory`, `edging_tape`
- `supplier`, `supplier_statement`, `supplier_file`
- `materials_to_order`, `materials_to_order_item`
- `purchase_order`, `purchase_order_item`
- `stock_transaction`
- `media`
- `logs`

### Enums
- `Plan`, `Role`
- `LotStatus`, `StageStatus`, `TabKind`, `FileKind`, `SiteMeasurements`
- `Category`, `PaymentStatus`, `MTOStatus`, `PurchaseOrderStatus`, `StockTransactionType`, `LogAction`

## Assets
- `public/`: static images and uploaded files (includes large `public/uploads/*`).
- `mediauploads/`: additional uploaded assets.

## Tooling and config
- `package.json`: scripts (`dev`, `build`, `start`, `lint`) and dependencies.
- `next.config.ts`: image remote patterns for `cabipro.com`, `localhost`, `127.0.0.1`.
- `prisma.config.ts`: Prisma schema/migrations config.
- `eslint.config.mjs`, `postcss.config.mjs`, `tsconfig.json`: lint/build config.
