# Frontend Work Log 2026-07-08 - Document Upload S3

## Nội dung chính

Đã xử lý luồng upload chứng từ ở bước upload hồ sơ để file không chỉ hiển thị tạm trên frontend, mà được gửi về backend, upload lên S3 và lưu reference vào bảng `loan_application_document`.

Luồng sau khi hoàn thiện:

```text
1. Người dùng chọn chứng từ trên frontend.
2. Khi nhấn gửi phê duyệt, frontend upload chứng từ qua API multipart.
3. Backend upload file lên S3.
4. Backend lưu reference vào loan_application_document theo hồ sơ và document_type.
5. Frontend gọi complete step UPLOAD_COMPLETE.
6. Frontend gọi submit hồ sơ.
```

Điểm quan trọng: không gọi submit trước upload document, vì sau khi hồ sơ sang `APP_SUBMITTED` thì backend chặn upload thêm chứng từ.

## Frontend đã thực hiện

Repo frontend:

```text
/home/phuc/workspace/f88_project/FE-F88-CLO
```

Branch:

```text
phuc-fes3
```

Commit:

```text
dfcd288 Upload loan documents before submit
```

### 1. Thêm endpoint upload document

File:

```text
customer_loan_ob/src/constants/api-endpoints.ts
```

Đã bổ sung endpoint cho API upload chứng từ:

```text
POST /api/v1/loan-applications/onboarding/{applicationCode}/documents
```

Endpoint này dùng `multipart/form-data`.

### 2. Cập nhật API client onboarding

File:

```text
customer_loan_ob/src/features/loan-onboarding/api/loan-application-draft.api.ts
```

Đã thêm logic:

- Convert danh sách chứng từ frontend thành `FormData`.
- Append nhiều `documentTypeCodes`.
- Append nhiều `files`.
- Gửi `uploadedBy` nếu có.
- Gọi upload document trước khi complete step và submit.

Flow trong hàm submit hiện tại:

```text
submit(applicationCode, { documents })
  -> uploadDocuments(applicationCode, documents)
  -> complete step UPLOAD_COMPLETE
  -> submit application
```

### 3. Cập nhật màn upload chứng từ

File:

```text
customer_loan_ob/src/routes/loan/upload-documents.tsx
```

Đã chỉnh màn upload để khi người dùng nhấn gửi phê duyệt thì truyền danh sách chứng từ đã chọn xuống API client.

Trước đó file chỉ phục vụ hiển thị/preview ở frontend. Sau cập nhật, file được đưa vào luồng submit thật.

## Backend đã thực hiện để hỗ trợ frontend

Repo backend:

```text
/home/phuc/workspace/f88_project/customer-loan-onboarding
```

Branch:

```text
phuc-s3
```

Commit:

```text
888629c Add S3 document upload support
```

### 1. Thêm API upload chứng từ

File:

```text
backend/loan-onboarding/src/main/java/com/f88/loanonboarding/controller/LoanApplicationOnboardingController.java
```

API mới:

```http
POST /api/v1/loan-applications/onboarding/{applicationCode}/documents
Content-Type: multipart/form-data
```

Form data:

```text
documentTypeCodes=...
files=@...
uploadedBy=...
```

Lưu ý kỹ thuật đã sửa:

- `documentTypeCodes` dùng `@RequestParam`.
- `uploadedBy` dùng `@RequestParam`.
- `files` dùng `@RequestPart`.

Trước khi sửa, backend dùng `@RequestPart` cho text field nên request multipart bị lỗi:

```text
Content-Type 'application/octet-stream' is not supported
```

Lỗi này làm request fail trước khi service S3/DB được gọi.

### 2. Thêm S3 storage service

Các file mới:

```text
backend/loan-onboarding/src/main/java/com/f88/loanonboarding/config/S3StorageConfig.java
backend/loan-onboarding/src/main/java/com/f88/loanonboarding/config/S3StorageProperties.java
backend/loan-onboarding/src/main/java/com/f88/loanonboarding/service/DocumentStorageService.java
backend/loan-onboarding/src/main/java/com/f88/loanonboarding/service/StoredDocumentFile.java
backend/loan-onboarding/src/main/java/com/f88/loanonboarding/service/impl/S3DocumentStorageService.java
```

S3 object key được lưu theo format:

```text
loan-applications/{APPLICATION_CODE}/documents/{DOCUMENT_TYPE_CODE}/{UUID}-{FILENAME}
```

Ví dụ:

```text
loan-applications/APP-2026-6B07A687/documents/CITIZEN_ID_FRONT/46714774-aa6d-4ea2-ab4d-bbf77945beee-front.jpg
```

### 3. Thêm service lưu document reference

Các file mới/cập nhật:

```text
backend/loan-onboarding/src/main/java/com/f88/loanonboarding/service/LoanApplicationDocumentService.java
backend/loan-onboarding/src/main/java/com/f88/loanonboarding/service/impl/LoanApplicationDocumentServiceImpl.java
backend/loan-onboarding/src/main/java/com/f88/loanonboarding/dto/response/loan/LoanApplicationDocumentUploadResponse.java
backend/loan-onboarding/src/main/java/com/f88/loanonboarding/repository/LoanApplicationDocumentRepository.java
```

Service hiện làm:

- Validate hồ sơ tồn tại.
- Chặn upload khi hồ sơ đã `APP_SUBMITTED`, `APP_CANCELLED`, `APP_EXPIRED`, `APP_CLOSED`.
- Validate số lượng `documentTypeCodes` khớp số lượng `files`.
- Validate file rỗng, dung lượng và content type.
- Kiểm tra `document_type` tồn tại và active.
- Upload file lên S3.
- Lưu reference vào `loan_application_document`.

### 4. Cấu hình AWS S3

Các file đã cập nhật:

```text
.env.example
docker-compose.yml
backend/loan-onboarding/src/main/resources/application.properties
```

Các biến môi trường:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_S3_BUCKET
AWS_S3_ENDPOINT
AWS_S3_PUBLIC_URL_BASE
AWS_S3_PATH_STYLE_ACCESS_ENABLED
```

Không ghi giá trị thật của key/secret vào docs hoặc commit.

### 5. Thêm seed document type

File:

```text
backend/loan-onboarding/src/main/resources/db/seed/V18__seed_upload_document_types.sql
```

Thêm/cập nhật document type:

```text
CUSTOMER_SIGNED_CONTRACT
REFERENCE_VERIFICATION_FORM
```

Đồng thời cập nhật:

```text
backend/loan-onboarding/src/main/java/com/f88/loanonboarding/config/DatabaseMigrationConfig.java
```

để seed mới được chạy.

### 6. Cập nhật Docker backend

File:

```text
backend/loan-onboarding/Dockerfile
```

Đã chỉnh để Docker có thể build jar trong image, không phụ thuộc việc máy local đã build sẵn jar hay chưa.

Thêm:

```text
backend/loan-onboarding/.dockerignore
```

để giảm build context và tránh copy file không cần thiết.

## Docker frontend đã thực hiện

Các file mới trong frontend repo:

```text
customer_loan_ob/Dockerfile
customer_loan_ob/nginx.conf
customer_loan_ob/.dockerignore
```

Mục tiêu:

- Build frontend thành static assets.
- Serve bằng Nginx.
- Proxy API từ frontend container sang backend.
- Docker compose có thể chạy cả postgres, backend, frontend.

File compose đã cập nhật ở backend repo:

```text
docker-compose.yml
```

Service liên quan:

```text
postgres
backend
frontend
```

## Tài liệu đã viết

File:

```text
docs/api/02_DOCUMENT_UPLOAD_S3.md
```

Nội dung đã ghi:

- Cấu hình S3.
- Format S3 object key.
- Bảng `document_type`.
- Bảng `loan_application_document`.
- API upload document.
- Request multipart/form-data.
- Response success.
- Response lỗi thường gặp.
- API complete step `UPLOAD_COMPLETE`.
- API submit hồ sơ.
- Luồng tích hợp frontend.
- Câu lệnh kiểm tra DB sau upload.
- Giới hạn hiện tại về nhiều ảnh cùng một document type.

## Kiểm tra đã thực hiện

### 1. Test backend

Đã chạy trong:

```text
backend/loan-onboarding
```

Command:

```bash
sh mvnw test
```

Kết quả:

```text
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
```

Test mới:

```text
backend/loan-onboarding/src/test/java/com/f88/loanonboarding/controller/LoanApplicationOnboardingControllerTest.java
backend/loan-onboarding/src/test/java/com/f88/loanonboarding/service/impl/LoanApplicationDocumentServiceImplTest.java
```

### 2. Build/restart backend Docker

Đã chạy:

```bash
docker compose build backend
docker compose up -d backend
```

Backend khởi động lại thành công.

### 3. Test upload thật qua API

Đã tạo hồ sơ test:

```text
APP-2026-6B07A687
```

Đã gọi API upload:

```bash
curl -X POST "http://localhost:5173/api/v1/loan-applications/onboarding/APP-2026-6B07A687/documents" \
  -F "documentTypeCodes=CITIZEN_ID_FRONT" \
  -F "files=@/tmp/f88-doc-test.jpg;type=image/jpeg" \
  -F "uploadedBy=codex-test"
```

Kết quả:

```text
HTTP=200
uploadedCount=1
documentTypeCode=CITIZEN_ID_FRONT
```

Response có `fileUrl` S3.

### 4. Kiểm tra DB

Đã kiểm tra bảng `loan_application_document`, có record:

```text
loan_application_code = APP-2026-6B07A687
document_type_code = CITIZEN_ID_FRONT
file_name = f88-doc-test.jpg
uploaded_by = codex-test
```

## Cách test lại trên giao diện

1. Mở frontend:

```text
http://localhost:5173
```

2. Hard refresh browser:

```text
Ctrl + F5
```

3. Tạo hồ sơ mới.
4. Đi tới bước upload chứng từ.
5. Chọn file.
6. Nhấn gửi phê duyệt.
7. Kiểm tra network phải có request:

```text
POST /api/v1/loan-applications/onboarding/{applicationCode}/documents
```

8. Sau đó mới có:

```text
POST /api/v1/loan-applications/onboarding/{applicationCode}/steps/UPLOAD_COMPLETE/complete
POST /api/v1/loan-applications/onboarding/{applicationCode}/submit
```

Không nên test bằng hồ sơ cũ đã submitted, vì backend sẽ chặn upload document.

## Câu lệnh kiểm tra sau khi test UI

Kiểm tra logs:

```bash
docker compose logs -f frontend backend
```

Kiểm tra DB:

```bash
docker exec los-postgres psql -U postgres -d loan_onboarding -c "
select
  lad.id,
  la.loan_application_code,
  dt.code,
  lad.file_name,
  lad.file_url,
  lad.uploaded_by,
  lad.uploaded_at
from loan_application_document lad
join loan_application la on la.id = lad.loan_application_id
join document_type dt on dt.id = lad.document_type_id
order by lad.uploaded_at desc
limit 10;
"
```

## Giới hạn hiện tại

API hiện tại nhận được nhiều file trong một request.

Trường hợp nhiều file khác `documentTypeCode`:

```text
CITIZEN_ID_FRONT -> front.jpg
CITIZEN_ID_BACK -> back.jpg
CUSTOMER_SIGNED_CONTRACT -> contract.pdf
```

Hoạt động đúng.

Trường hợp nhiều file cùng một `documentTypeCode`:

```text
REFERENCE_VERIFICATION_FORM -> ref-1.jpg
REFERENCE_VERIFICATION_FORM -> ref-2.jpg
```

S3 vẫn có thể upload nhiều object, nhưng DB hiện chỉ giữ reference mới nhất cho cặp:

```text
loan_application + document_type
```

Nếu nghiệp vụ cần một danh mục ảnh có nhiều ảnh và DB lưu đủ từng ảnh, cần sửa service để mỗi file tạo một dòng `loan_application_document` mới thay vì update dòng cũ.

## Lưu ý cho người tiếp tục

- Không commit `.env` thật vì có AWS secret.
- Khi sửa frontend upload, cần đảm bảo thứ tự `documentTypeCodes` và `files` khớp nhau.
- Khi lỗi không thấy upload S3, kiểm tra browser Network trước xem có request `/documents` hay không.
- Nếu request `/documents` không xuất hiện, khả năng browser đang dùng bundle cũ hoặc frontend chưa rebuild.
- Nếu request `/documents` có xuất hiện nhưng lỗi 4xx/5xx, kiểm tra backend logs để biết lỗi validation, document type, state hồ sơ hoặc AWS permission.
