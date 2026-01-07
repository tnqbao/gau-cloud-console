API Specification - Object Storage Features
1. Download Object Stream
   Endpoint
   GET /api/v1/cloud/buckets/:id/objects/:object_id/download
   Description
   Stream download một object trực tiếp từ MinIO về client mà không buffer vào RAM. Sử dụng io.Copy() để stream hiệu quả.

Authentication
Required - JWT token trong header

Path Parameters
Parameter	Type	Required	Description
id	UUID	Yes	Bucket ID
object_id	UUID	Yes	Object ID cần download
Response Headers
Content-Type: <object_content_type>
Content-Disposition: attachment; filename="<original_filename>"
Content-Length: <file_size_bytes>
Success Response (200 OK)
Binary stream của file

Error Responses
401 Unauthorized

{
"error": "Unauthorized: user_id not found"
}
403 Forbidden

{
"error": "Forbidden: you don't have permission to access this bucket"
}
404 Not Found

{
"error": "Bucket not found"
}
hoặc

{
"error": "Object not found"
}
500 Internal Server Error

{
"error": "Failed to retrieve object"
}
Example Usage
cURL:

curl -X GET \
-H "Authorization: Bearer <token>" \
"http://localhost:8080/api/v1/cloud/buckets/123e4567-e89b-12d3-a456-426614174000/objects/987fcdeb-51a2-43d7-8901-234567890abc/download" \
--output downloaded_file.pdf
JavaScript (Fetch):

const response = await fetch(
${API_URL}/buckets/${bucketId}/objects/${objectId}/download,
{
headers: {
'Authorization': Bearer ${token}
}
}
);
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'filename.ext';
a.click();
2. Delete Objects by Path
   Endpoint
   DELETE /api/v1/cloud/buckets/:id/objects/path/*path
   Description
   Xóa tất cả objects trong một path/folder cụ thể. API xóa records trong database ngay lập tức và gửi message qua RabbitMQ để consumer xóa files trong MinIO storage.

Authentication
Required - JWT token trong header

Path Parameters
Parameter	Type	Required	Description
id	UUID	Yes	Bucket ID
path	String	Yes	Path/folder cần xóa (wildcard)
Path Format
folder1 - Xóa tất cả objects trong folder1 và subfolders
folder1/subfolder - Xóa tất cả objects trong subfolder
Empty path - Xóa tất cả objects trong bucket
Success Response (200 OK)
{
"message": "Objects deleted successfully",
"path": "folder1/subfolder",
"deleted_count": 15
}
Error Responses
400 Bad Request

{
"error": "bucket_id is required"
}
401 Unauthorized

{
"error": "Unauthorized: user_id not found"
}
403 Forbidden

{
"error": "Forbidden: you don't have permission to delete objects in this bucket"
}
404 Not Found

{
"error": "Bucket not found"
}
500 Internal Server Error

{
"error": "Failed to delete objects"
}
Example Usage
cURL:

# Xóa folder "documents/2024"
curl -X DELETE \
-H "Authorization: Bearer <token>" \
"http://localhost:8080/api/v1/cloud/buckets/123e4567-e89b-12d3-a456-426614174000/objects/path/documents/2024"
JavaScript (Fetch):

const deletePath = async (bucketId, path) => {
const response = await fetch(
${API_URL}/buckets/${bucketId}/objects/path/${path},
{
method: 'DELETE',
headers: {
'Authorization': Bearer ${token}
}
}
);

const result = await response.json();
console.log(Deleted ${result.deleted_count} objects from ${result.path});
};
// Usage
await deletePath('123e4567-e89b-12d3-a456-426614174000', 'documents/2024');
Python (requests):

import requests
def delete_path(bucket_id: str, path: str, token: str):
url = f"{API_URL}/buckets/{bucket_id}/objects/path/{path}"
headers = {"Authorization": f"Bearer {token}"}

    response = requests.delete(url, headers=headers)
    result = response.json()
    
    print(f"Deleted {result['deleted_count']} objects from {result['path']}")
# Usage
delete_path(
bucket_id="123e4567-e89b-12d3-a456-426614174000",
path="documents/2024",
token="your_jwt_token"
)
3. Delete Object (Modified)
   Endpoint
   DELETE /api/v1/cloud/buckets/:id/objects/:object_id
   Description
   Xóa một object cụ thể. API đã được sửa để gửi message qua RabbitMQ sau khi xóa record trong database. Consumer sẽ xóa file trong MinIO storage.

Changes from Previous Version
✅ Thêm publish message
DeleteObjectMessage
tới RabbitMQ
✅ Consumer xử lý việc xóa file trong MinIO
✅ API response ngay sau khi xóa DB record (không đợi MinIO deletion)
Authentication
Required - JWT token trong header

Path Parameters
Parameter	Type	Required	Description
id	UUID	Yes	Bucket ID
object_id	UUID	Yes	Object ID cần xóa
Success Response (200 OK)
{
"message": "Object deleted successfully",
"object_id": "987fcdeb-51a2-43d7-8901-234567890abc"
}
Error Responses
400 Bad Request

{
"error": "Invalid bucket_id format"
}
401 Unauthorized

{
"error": "Unauthorized: user_id not found"
}
403 Forbidden

{
"error": "Forbidden: you don't have permission to delete objects in this bucket"
}
404 Not Found

{
"error": "Object not found"
}
hoặc

{
"error": "Object not found in this bucket"
}
500 Internal Server Error

{
"error": "Failed to delete object"
}
Example Usage
cURL:

curl -X DELETE \
-H "Authorization: Bearer <token>" \
"http://localhost:8080/api/v1/cloud/buckets/123e4567-e89b-12d3-a456-426614174000/objects/987fcdeb-51a2-43d7-8901-234567890abc"
JavaScript (Fetch):

const deleteObject = async (bucketId, objectId) => {
const response = await fetch(
${API_URL}/buckets/${bucketId}/objects/${objectId},
{
method: 'DELETE',
headers: {
'Authorization': Bearer ${token}
}
}
);

const result = await response.json();
console.log(result.message); // "Object deleted successfully"
};
Architecture Notes
Async Processing Flow
API Request → Delete DB Record → Publish Message → Return 200 OK
↓
RabbitMQ Queue
↓
Consumer
↓
Delete from MinIO
Message Queue Details
Queue Names:

object.delete - Single object deletion
object.delete_path - Path/folder deletion
Exchange: upload.exchange (topic)

Retry Policy:

Max retries: 3
Backoff: 2s, 4s, 6s
Failed messages requeued after max retries
Performance Characteristics
Feature	Memory Usage	Network	Latency
Stream Download	O(1) - constant	Streaming	Low
Delete Object	O(1)	Async	Very Low
Delete Path	O(n) where n = objects	Async	Low
Security Considerations
Authorization: All endpoints verify bucket ownership
Path Traversal: Path validation prevents .. attacks
Rate Limiting: Consider implementing for delete operations
Audit Logging: All deletions logged with user_id and timestamp