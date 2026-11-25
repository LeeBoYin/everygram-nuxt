# Everygram 管理後台（Admin Dashboard）實作規格

> 狀態：已實作（P1–P3）。規格於 2026-11-26 確認。
> 實作時如果發現和本文件不一致，先停下來問，確認後程式和文件一起改。

## 目標

- 取代「直接進 Firebase console 看資料」：用一個後台看 Everygram 的使用狀況。
- 每月自動存一份 snapshot，之後可以回溯、看趨勢。
- 只有管理者能進入；owner 可以新增或移除其他管理者。
- 只做桌面版排版（寬度 ≥ 1200px），不做 RWD。
- 後台介面只用繁體中文，不走 i18n（不新增 locale key）。

## 已確認的決策

| #   | 決策                                                                | 理由                                                |
| --- | ------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | 放在同一個 Nuxt app 的 `/admin/**`，`ssr: false`                    | 共用 Firebase、登入和型別，不必另外部署             |
| 2   | 權限用 Firebase Auth custom claim `adminRole: 'owner' \| 'admin'`   | rules 和 Functions 能直接檢查 token，不用多讀資料庫 |
| 3   | 兩層權限：`owner` 能管理管理者，`admin` 只能看                      | 合作夥伴不會誤刪 owner 的權限                       |
| 4   | 後台可以顯示使用者的 email 和名字                                   | 產品方決定                                          |
| 5   | 規模約 300 位使用者、每人裝備 < 100 件 → 統計直接全掃計算，不做增量 | 一次全掃大約幾萬次讀取，成本和時間都可以接受        |
| 6   | 移除 `findCustomBrands` cron，改由新的 snapshot 計算自訂品牌排行    | 後台取代原本手動查看 `customBrands` 的用途          |
| 7   | 從 `created` 時間戳回補「每月新增」歷史                             | 上線當天就有趨勢圖                                  |

## 資料模型

### Custom claims

```ts
// request.auth.token.adminRole
type AdminRole = 'owner' | 'admin';
```

### `adminUsers/{uid}`（admin SDK 寫入，claims 的鏡像，用來列名單和留紀錄）

```ts
type AdminUser = {
    uid: string;
    email: string;
    displayName: string;
    role: AdminRole;
    addedBy: string; // uid，第一位 owner 由 script 建立時填 'bootstrap'
    added: Timestamp;
};
```

### `adminStats/latest`（目前的統計）與 `adminSnapshots/{YYYY-MM}`（每月 snapshot）

兩份共用同一個型別 `AdminStats`。snapshot 的 doc id 是**被統計的月份**：例如 12/1 00:00 跑的那次存成 `2026-11`，代表 11 月底的狀態。

```ts
type CountItem = { key: string; count: number };

type AdminStats = {
    computedAt: Timestamp;
    period?: string; // 'YYYY-MM'，只有 snapshot 才有
    users: {
        total: number;
        newThisMonth: number; // creationTime 落在 period 或當月
        dau: number; // lastRefreshTime 在 1 天內
        wau: number; // 7 天內
        mau: number; // 30 天內
        dormant90d: number; // 超過 90 天沒活躍
        withGear: number; // gearCount >= 1
        withTrip: number; // tripCount >= 1
        withPublicTrip: number; // tripShareCount >= 1
        byProvider: CountItem[]; // google.com / password / ...
        byLocale: CountItem[]; // en / zh-tw / ja / null→'unset'
        byCurrency: CountItem[];
    };
    gears: {
        total: number;
        active: number;
        archived: number;
        newThisMonth: number;
        perUserAvg: number; // 只算 userMeta 存在的使用者，含 0
        perUserMedian: number;
        perUserBuckets: CountItem[]; // '0' | '1-10' | '11-50' | '51-100' | '100+'
        byCategory: CountItem[];
        topBrands: CountItem[]; // Top 30，內建品牌用 key、自訂品牌用正規化名稱（加前綴 'custom:'）
        topCustomBrands: CountItem[]; // Top 50，候選加入內建品牌清單
        byArchiveReason: CountItem[];
        withPhoto: number;
        withPrice: number;
        bySource: CountItem[]; // csv / lp / manual
    };
    trips: {
        total: number;
        private: number;
        public: number;
        newThisMonth: number;
        perUserAvg: number;
        avgGearsPerTrip: number; // gears + wornGears 的種類數
        emptyTrips: number; // 0 件裝備
        byDateMode: CountItem[];
        withBanner: number;
        publicAvgBaseWeight: number; // 來自 tripShare.baseWeight（g）
    };
    publicTrips: {
        totalViews: number;
        topViewed: TopTrip[]; // Top 20，依累計 viewCount
        viewCounts: Record<string, number>; // 所有 tripId → viewCount，用來算月增量
        topCreators: TopCreator[]; // Top 10，依公開行程數
    };
};

type TopTrip = {
    tripId: string;
    title: string;
    ownerName: string;
    ownerEmail: string;
    viewCount: number;
    published?: Timestamp;
};

type TopCreator = {
    uid: string;
    displayName: string;
    email: string;
    count: number;
};
```

- 型別放在 `types/types.d.ts`（前端和 functions 共用）。
- 「本月瀏覽增加 Top 20」**不存**，由前端用 `latest` 和最新一份 snapshot（上個月底）的 `viewCounts` 相減算出來。
- 品牌正規化規則沿用舊的 `findCustomBrands`：`trim().toLowerCase().replace(/\s+/g, ' ')`。

### 統計口徑

- 每人裝備數／行程數和啟用漏斗用 `userMeta` 的計數，只算 Auth 裡還存在的帳號，讓漏斗和分桶一致。`userMeta` 由前端寫入，可能和實際筆數有落差。
- `gears.total` 包含封存和單次行程裝備（`isForOneTrip`）。
- 沒有 `lastRefreshTime` 的帳號不算 DAU/WAU/MAU；沉睡判斷退回登入時間、再退回註冊時間，避免剛註冊的人被算成沉睡。使用者列表的「最後活躍」也退回登入時間。
- 缺欄位：分佈圖算「未設定」；舊欄位 `imgUrl` 算有照片。
- `totalViews` 和 `viewCounts` 含所有 `tripMeta`；`topViewed` 只列目前公開、瀏覽 > 0 的行程（沒公開的行程連結打不開）。

### `adminSnapshots/backfill`（一次性回補，只存每月新增量）

```ts
type AdminBackfill = {
    computedAt: Timestamp;
    months: Record<
        string,
        { newUsers: number; newGears: number; newTrips: number }
    >; // key: 'YYYY-MM'
};
```

## Firestore rules（新增）

```
function adminRole() { return request.auth != null ? request.auth.token.adminRole : null; }
function isAdmin() { return adminRole() in ['owner', 'admin']; }

match /adminStats/{doc}     { allow read: if isAdmin(); allow write: if false; }
match /adminSnapshots/{doc} { allow read: if isAdmin(); allow write: if false; }
match /adminUsers/{uid}     { allow read: if isAdmin(); allow write: if false; }
```

既有的 `customBrands` 沒有 rule（預設拒絕），維持現狀即可。

## Cloud Functions（`functions/src/admin/`）

所有 callable 一開頭都要檢查 `request.auth?.token.adminRole`，也要檢查 `adminUsers` 目前的角色，不符合就丟 `permission-denied`（被移除的管理者，舊 token 最多還能用 1 小時）。區域沿用 `asia-northeast1`。

| 檔案                        | 類型                                             | 權限  | 做什麼                                                                                                                          |
| --------------------------- | ------------------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| `compute-stats.ts`          | 共用函式 `computeStats(now, period?)`            | —     | 讀 Auth `listUsers()`（每頁 1000 筆分頁）、`userMeta`、`gear`、`trip`、`tripShare`、`tripMeta` 全量，回傳 `AdminStats`          |
| `refresh-admin-stats.ts`    | callable `refreshAdminStats`                     | admin | 呼叫 `computeStats` → 寫入 `adminStats/latest`，`timeoutSeconds: 300`、`memory: '512MiB'`                                       |
| `monthly-admin-snapshot.ts` | schedule `0 0 1 * *` Asia/Taipei                 | —     | `computeStats` → 寫入 `adminSnapshots/{上個月}`，同時更新 `adminStats/latest`                                                   |
| `backfill-admin-history.ts` | callable `backfillAdminHistory`                  | owner | 用 Auth `creationTime`、`gear.created`、`trip.created` 依月份分組 → 寫入 `adminSnapshots/backfill`。可以重複執行（直接覆寫）    |
| `get-admin-users.ts`        | callable `getAdminUsers`                         | admin | 即時回傳全部使用者列表（見「使用者」頁）。**不存進 Firestore**，避免 PII 多一份副本                                             |
| `set-admin-role.ts`         | callable `setAdminRole({ email, role \| null })` | owner | `getUserByEmail` → `setCustomUserClaims`（保留其他 claims）→ 寫入或刪除 `adminUsers/{uid}`。不能改自己；不能讓 owner 數量變成 0 |

- `setAdminRole` 在 transaction 裡寫 `adminUsers`，同時檢查呼叫者仍是 owner，避免兩位 owner 同時互相移除；claims 寫入失敗會還原 `adminUsers`。它用 email 找帳號，不檢查 `emailVerified`（產品方決定維持現狀）。
- `monthlyAdminSnapshot` 只讀一次資料，snapshot 和 `latest` 分開彙總，讓 `latest` 的「本月新增」維持當月。`timeoutSeconds: 300`、`memory: '512MiB'`。
- `getAdminUsers`、`backfillAdminHistory` 用 `memory: '512MiB'`（backfill 另外 `timeoutSeconds: 300`）。
- `index.ts`：export 上面的 function，**移除** `findCustomBrands`，並刪除 `cron-jobs/find-custom-brands.ts`。
- `customBrands` collection 的舊資料**先不刪**，等 owner 確認後再手動到 console 刪除。
- `computeStats` 要容忍舊資料：缺欄位一律當 `undefined`，不能讓整個函式 throw。
- `gear.source` 沒有值時算成 `'manual'`。
- 時間判斷（新增、活躍）一律以 Asia/Taipei 的月份邊界為準。

### 初始化 script

`functions/scripts/set-admin-owner.mjs <email>`：用 `functions/src/everygram-firebase-adminsdk.json` 初始化，把該 email 設成 `owner` 並建立 `adminUsers` 文件（`addedBy: 'bootstrap'`）。`functions/package.json` 加上 `"admin:set-owner": "node scripts/set-admin-owner.mjs"`。

## 前端

### 路由與權限

- `nuxt.config.ts` 的 `routeRules` 加上 `'/admin/**': { ssr: false }`。
- `middleware/admin-guard.ts`：等 auth 狀態就緒 → `user.getIdTokenResult(true)` → 沒有 `adminRole` 就 `navigateTo('/')`。管理者頁額外檢查 `owner`。
- 這只是 UX 層的擋板，真正的安全防線是 rules 和 Functions。
- 一般使用者的 `UserMenu` 不顯示後台入口；管理者在 `UserMenu` 多一個「管理後台」連結。

### Layout：`layouts/admin.vue`

左側固定 sidebar（220px）放導覽，右側是內容區，最大寬度 1440px。頂部顯示「最後更新：{computedAt}」和「重新計算」按鈕（呼叫 `refreshAdminStats`，執行時顯示 loading）。

### 頁面

| 路由                    | 內容                                                                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin` 總覽           | KPI 卡：使用者總數、MAU、裝備總數、行程（私人／公開）、總瀏覽數，每張卡附「比上月 ±%」（和最新一份 snapshot 比）。下方放啟用漏斗（總數 → 有裝備 → 有行程 → 有公開行程）和語言分佈                  |
| `/admin/users` 使用者   | 上方：DAU/WAU/MAU、沉睡人數、登入方式、語言、幣別分佈。下方：`getAdminUsers` 的 DataTable，欄位有 email、名字、註冊日、最後活躍、裝備數、行程數、公開行程數、語言，可排序和搜尋                    |
| `/admin/gears` 裝備     | 平均和中位數、分桶長條圖、類別分佈、品牌 Top 30、自訂品牌 Top 50、封存原因、照片／價格比例、匯入來源                                                                                               |
| `/admin/trips` 行程     | 私人／公開、平均數、空行程、dateMode、banner 比例、公開行程平均 base weight；瀏覽數 Top 20（標題連到 `/trip-share/{id}`）、本月瀏覽增加 Top 20、發佈最多公開行程的使用者                           |
| `/admin/trends` 趨勢    | 用多選指標畫折線：每月新增（backfill ＋ snapshot）、使用者總數、MAU、裝備總數、行程總數、公開行程數                                                                                                |
| `/admin/snapshots` 歷史 | 月份下拉選單 → 用和總覽相同的元件顯示那個月的數據                                                                                                                                                  |
| `/admin/admins` 管理者  | 只有 owner 能進：名單（email、名字、角色、加入時間、由誰新增）、新增（email ＋ 角色）、改角色、移除。提示「對方要重新登入才會生效」。另外放一個「回補歷史資料」按鈕（呼叫 `backfillAdminHistory`） |

`getAdminUsers` 每列回傳的欄位：`uid, email, displayName, provider, created, lastActive, gearCount, tripCount, tripShareCount, locale`（後四個來自 `userMeta`）。

手機版選單不加後台入口。

### 趨勢頁

- 每個選到的指標各畫一張折線圖（一列兩張），用核取方塊多選，預設全選。理由：指標的量級差很多（例如裝備總數和每月新增行程），共用一個 Y 軸會看不出變化。
- 橫軸是連續的月份。
- 每月新增：同一個月 backfill 和 snapshot 都有值時，用 snapshot 的 `newThisMonth`（它在月底計算；backfill 只算執行當下還存在的資料，執行當月也不完整）。
- backfill 範圍內（第一個有資料的月份到執行月份）缺的月份算 0。其他沒有資料的月份顯示斷線。
- 回補執行當月還沒有 snapshot 時，頁面提示該月不完整。
- 總數類指標只用 snapshot。讀 `adminSnapshots` 用 `orderBy('period')`，自然排除 `backfill`。

### 歷史頁

- 下拉選單預設選最新的月份。
- 「比上月」只和**前一個月**的 snapshot 比；缺那個月就顯示「—」。

### 本月瀏覽增加 Top 20

- `latest` 的 `viewCounts` 減最新一份 snapshot 的 `viewCounts`；snapshot 裡沒有的行程當 0；只列增加 > 0 的。
- 標題、作者、發佈日由前端讀 `tripShare`；讀不到（已不公開）就跳過，往下遞補。
- 不顯示 email（`tripShare` 沒有，不為此多呼叫 callable）。
- 頁面標示比較的 snapshot 月份；沒有 snapshot 時顯示說明文字。

### 圖表

- 安裝 `chart.js`，使用 PrimeVue 3 的 `Chart` 元件，在 `plugins/primevue.ts` 註冊。
- 只在 admin 頁面用到，確認不會打包進一般頁面的 chunk。
- 長條圖用於分佈和排行，折線圖用於趨勢，不使用圓餅圖。

### 檔案清單（預計）

```
types/types.d.ts                          + AdminRole, AdminStats, AdminBackfill, AdminUser...
firestore.rules                           + admin rules
nuxt.config.ts                            + /admin/** routeRules
middleware/admin-guard.ts                 新增
layouts/admin.vue                         新增
pages/admin/{index,users,gears,trips,trends,snapshots,admins}.vue  新增
components/admin/*.vue                    KPI 卡、分佈長條圖、排行表、趨勢圖
utils/admin-format.ts、admin-trends.ts    格式化、趨勢合併與瀏覽增量計算
composables/use-admin-stats.ts            讀 latest / snapshots、呼叫 callable
components/UserMenu.vue（或對應檔）        + 管理後台入口
functions/src/admin/*.ts                  新增
functions/src/index.ts                    export 新 function、移除 findCustomBrands
functions/src/cron-jobs/find-custom-brands.ts  刪除
functions/scripts/set-admin-owner.mjs     新增
functions/package.json                    + admin:set-owner script
```

## 分階段與驗收

### P1：權限與骨架

- claims、初始化 script、rules、`admin-guard`、`admin` layout、管理者頁、`setAdminRole`。
- 驗收：
    - emulator 中用 script 設 owner 後可以進 `/admin`；一般帳號進 `/admin` 會被導回 `/`。
    - 一般帳號直接用 SDK 讀 `adminStats` 會被 rules 拒絕。
    - owner 能新增或移除 admin；admin 看不到管理者頁，呼叫 `setAdminRole` 會收到 `permission-denied`。
    - 移除最後一位 owner、修改自己的角色都會被拒絕。

### P2：統計計算

- `computeStats`、`refreshAdminStats`、每月 cron、`backfillAdminHistory`、`getAdminUsers`，移除 `findCustomBrands`。
- 總覽、使用者、裝備、行程四頁。
- 驗收：
    - emulator 塞測試資料後，數字和手算一致（至少驗：總數、中位數、分桶、品牌正規化、公開／私人數量）。
    - cron 用 `firebase functions:shell` 手動觸發後，產生正確 period 的 snapshot。
    - 缺欄位的舊資料不會讓函式 throw。

### P3：趨勢與歷史

- 趨勢頁、snapshot 歷史頁、本月瀏覽增加 Top 20。
- 驗收：用假的多月 snapshot 確認折線圖和月增量計算正確。

### 部署（owner 執行）

1. `firebase deploy --only firestore:rules,functions`（會提示刪除 `findCustomBrands`，選 Yes）。
2. `npm --prefix functions run admin:set-owner -- <你的 email>`。
3. 重新登入 → 到 `/admin/admins` 按「回補歷史資料」 → 到總覽按「重新計算」。

## 不在這次範圍

- 留存率 cohort 分析、GA4 事件數據串接、手機版排版、匯出 CSV。
