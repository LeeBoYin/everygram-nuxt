# Cloud Functions 部署

## 自動部署

[deploy-functions.yml](../.github/workflows/deploy-functions.yml) 在 `master` 有以下變動時部署 functions（create / update）：

- `functions/**`
- `types/types.d.ts`
- `utils/constants/gear-brands.ts`、`utils/constants/gear-categories.ts`
- `firebase.json`
- workflow 檔本身

也可以手動執行：GitHub → Actions → Deploy functions → Run workflow（branch 選 `master`）。

PR 只跑 [check-functions.yml](../.github/workflows/check-functions.yml) 的 build，不碰 GCP。

repo variable `WIF_PROVIDER` 沒填時，部署 job 會直接略過（顯示 skipped，不是失敗）。

## 仍要手動做的事

| 情況                                   | 做法                                                                      | 原因                                                      |
| -------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------- |
| 刪除 function                          | `firebase functions:delete <name> --region asia-northeast1`，再讓 CI 部署 | CI 不加 `--force`，避免誤刪。程式裡拿掉但沒刪，部署會失敗 |
| Firestore / Storage rules              | `npm run deploy-rules`                                                    | 尚未自動化                                                |
| 新增 `defineSecret`                    | `firebase functions:secrets:set <NAME>`，第一次由 Owner 在本機部署        | 授權 runtime SA 讀 secret 需要 `setIamPolicy`，CI 沒有    |
| 第一次使用某種新觸發類型（例 Pub/Sub） | 第一次由 Owner 在本機部署                                                 | 可能要改 project IAM，CI 沒有權限                         |

本機部署指令仍是 `npm run deploy-functions`，不需要 service account JSON。

## 本機 emulator 憑證

雲端用 runtime service account（Application Default Credentials）。本機要自己指定。

1. Firebase console → Project settings → Service accounts 產生 JSON。
2. 存成 `functions/src/everygram-firebase-adminsdk.json`（已 git ignore，也不會被打包上傳）。
3. 在啟動 emulator 的 shell 裡 export（在 repo 根目錄執行）：

```bash
export GOOGLE_APPLICATION_CREDENTIALS="$PWD/functions/src/everygram-firebase-adminsdk.json"
```

4. 啟動：

```bash
npm run emulator
```

一定要用 shell `export`。只寫在 `functions/.env.local` 時，Firebase CLI 會用你 `firebase login` 的帳號憑證蓋掉它。

## GCP / GitHub 一次性設定

### 順序

1. 做完下面「GCP 設定」和「cleanup policy」。
2. Merge。此時 variables 還沒填，自動部署會略過。
3. 填 GitHub repo variables。
4. 手動執行一次 workflow，確認權限。
5. 做「首次部署後檢查」。之後才依賴自動部署。

**runtime SA 的權限一定要在第一次部署前確認。** 部署後程式從原本的 `firebase-adminsdk` SA 改用 runtime SA，少權限的話線上功能會出錯。本機部署也一樣。

### GCP 設定

Runtime SA 是 Compute Engine default SA：`<PROJECT_NUMBER>-compute@developer.gserviceaccount.com`（2nd gen 預設值，程式沒有指定 `serviceAccount`）。

| 項目                      | 填什麼                                                                    | 原因                                                  |
| ------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| Workload Identity Pool    | `github`（global）                                                        | GitHub 用短期 OIDC token 換 GCP 憑證，不存金鑰        |
| OIDC Provider             | `everygram-nuxt`，issuer `https://token.actions.githubusercontent.com`    | 信任 GitHub Actions 發的 token                        |
| Attribute mapping         | `google.subject`、`attribute.repository`、`attribute.ref`                 | 條件和授權要用到                                      |
| Attribute condition       | 限定 repo `LeeBoYin/everygram-nuxt` 且 ref `refs/heads/master`            | repo 是公開的；其他 repo、branch、PR 都換不到憑證     |
| 部署 SA                   | `github-deployer`                                                         | 部署權限和 runtime 權限分開                           |
| Pool → 部署 SA            | `roles/iam.workloadIdentityUser`                                          | 允許這個 repo 扮演部署 SA                             |
| 部署 SA：project          | `roles/cloudfunctions.admin`                                              | 部署函式。已含 `run.*`（公開 callable）、`eventarc.*` |
| 部署 SA：project          | `roles/cloudscheduler.admin`                                              | `findCustomBrands` 是 `onSchedule`                    |
| 部署 SA：project          | `roles/secretmanager.viewer`                                              | 檢查 `ANTHROPIC_API_KEY` 版本與授權，讀不到值         |
| 部署 SA：project          | `roles/firebase.viewer`                                                   | CLI 讀 project 設定、Firestore 位置、IAM policy       |
| 部署 SA：project          | `roles/serviceusage.serviceUsageConsumer`                                 | CLI 檢查 API 時以本 project 計 quota                  |
| 部署 SA：對 runtime SA    | `roles/iam.serviceAccountUser`                                            | 部署的函式以 runtime SA 執行（`actAs`）               |
| 部署 SA：對 App Engine SA | `roles/iam.serviceAccountUser`（`everygram@appspot.gserviceaccount.com`） | Firebase CLI 部署前固定檢查這個 SA，2nd gen 也一樣    |
| Runtime SA：project       | `roles/datastore.user`                                                    | 函式讀寫 Firestore                                    |
| Runtime SA：project       | `roles/firebaseauth.viewer`                                               | `publishTrip` 用 `getAuth().getUser`                  |
| Runtime SA：bucket        | `roles/storage.objectAdmin`（`everygram.appspot.com`）                    | 下載、上傳、刪除圖片，以及讀 download token           |

[Firebase 文件](https://firebase.google.com/docs/projects/iam/permissions)只寫了 Cloud Functions Admin + Service Account User。其他角色是依 Firebase CLI 15.37.0 的行為推得，**第一次手動執行才算驗證**。

刻意不給的角色：

| 角色                                         | 為什麼不需要                                     |
| -------------------------------------------- | ------------------------------------------------ |
| Cloud Run Admin、Eventarc Admin              | Cloud Functions Admin 已含 `run.*`、`eventarc.*` |
| Artifact Registry Writer、Cloud Build Editor | image 由 build 服務建置和推送，部署者只需要讀    |
| Firebase Admin                               | 太大。唯讀的 Firebase Viewer 應該足夠            |
| Service Account Token Creator                | 圖片網址改用 download token，不需要簽章          |

如果第一次部署出現 permission 錯誤，依訊息裡的 permission 補角色。

### gcloud 指令

在同一個 shell 依序執行（可以用 [Cloud Shell](https://shell.cloud.google.com/)）。

```bash
PROJECT_ID=everygram
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
APPENGINE_SA="${PROJECT_ID}@appspot.gserviceaccount.com"
DEPLOY_SA="github-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
```

啟用 API：

```bash
gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com cloudresourcemanager.googleapis.com serviceusage.googleapis.com firebasestorage.googleapis.com --project "$PROJECT_ID"
```

Pool 與 Provider：

```bash
gcloud iam workload-identity-pools create github \
    --project "$PROJECT_ID" --location global --display-name "GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc everygram-nuxt \
    --project "$PROJECT_ID" --location global --workload-identity-pool github \
    --issuer-uri "https://token.actions.githubusercontent.com" \
    --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
    --attribute-condition "assertion.repository == 'LeeBoYin/everygram-nuxt' && assertion.ref == 'refs/heads/master'"
```

部署 SA 與授權：

```bash
gcloud iam service-accounts create github-deployer \
    --project "$PROJECT_ID" --display-name "GitHub Actions deployer"

gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA" \
    --project "$PROJECT_ID" --role roles/iam.workloadIdentityUser \
    --member "principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/attribute.repository/LeeBoYin/everygram-nuxt"

for ROLE in cloudfunctions.admin cloudscheduler.admin secretmanager.viewer firebase.viewer serviceusage.serviceUsageConsumer; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member "serviceAccount:${DEPLOY_SA}" --role "roles/${ROLE}" --condition None
done

for SA in "$RUNTIME_SA" "$APPENGINE_SA"; do
    gcloud iam service-accounts add-iam-policy-binding "$SA" \
        --project "$PROJECT_ID" --role roles/iam.serviceAccountUser \
        --member "serviceAccount:${DEPLOY_SA}"
done
```

Runtime SA 權限（先看現有角色，再補齊；重複授權沒有副作用）：

```bash
gcloud projects get-iam-policy "$PROJECT_ID" \
    --flatten "bindings[].members" --filter "bindings.members:${RUNTIME_SA}" \
    --format "value(bindings.role)"
```

```bash
for ROLE in datastore.user firebaseauth.viewer; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member "serviceAccount:${RUNTIME_SA}" --role "roles/${ROLE}" --condition None
done

gcloud storage buckets add-iam-policy-binding "gs://${PROJECT_ID}.appspot.com" \
    --member "serviceAccount:${RUNTIME_SA}" --role roles/storage.objectAdmin
```

### Artifact Registry cleanup policy

沒有 policy 時，`--non-interactive` 部署會在最後報錯。用 Owner 帳號先設一次（預設刪除舊 build image）：

```bash
npx firebase-tools@15.37.0 functions:artifacts:setpolicy --location asia-northeast1 --project everygram
```

### GitHub repo variables

GitHub → Settings → Secrets and variables → Actions → **Variables** 分頁（不是 Secrets）。這兩個值只是識別名稱，不是金鑰。

| Variable          | 填什麼                                                                                             | 原因                   |
| ----------------- | -------------------------------------------------------------------------------------------------- | ---------------------- |
| `WIF_PROVIDER`    | `projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github/providers/everygram-nuxt` | auth action 用它換憑證 |
| `DEPLOY_SA_EMAIL` | `github-deployer@everygram.iam.gserviceaccount.com`                                                | 要扮演的部署 SA        |

或用指令：

```bash
gh variable set WIF_PROVIDER --repo LeeBoYin/everygram-nuxt --body "projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/providers/everygram-nuxt"
```

```bash
gh variable set DEPLOY_SA_EMAIL --repo LeeBoYin/everygram-nuxt --body "$DEPLOY_SA"
```

### 首次執行

```bash
gh workflow run deploy-functions.yml --repo LeeBoYin/everygram-nuxt --ref master
```

### 首次部署後檢查

| 操作                     | 驗證的權限              |
| ------------------------ | ----------------------- |
| 換一張裝備照片，縮圖出現 | Firestore、Storage      |
| 發佈一個行程，分享頁正常 | Auth、Firestore         |
| 分享頁的 OG image 更新   | Storage、download token |
| Lighterpack 匯入         | Secret、公開 callable   |

同時看 `npm --prefix functions run logs` 有沒有 `PERMISSION_DENIED` 或 403。

要退回舊版：checkout 改版前的 commit，放回 JSON，本機部署。

## 圖片網址與舊金鑰

- 新產生的縮圖與 OG image 使用 Firebase download token 網址，不會過期。拿到網址的人都能讀（和以前相同）。
- Firestore 裡**舊的簽名網址**是用 `firebase-adminsdk` 金鑰簽的。**不要刪那把金鑰**，刪了舊圖片網址就失效。
- 如果之後要刪，先回填舊資料（`gear`、`userGears`、`trip`、`tripShare`、`tripMeta` 裡的網址）。
