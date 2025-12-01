# AI Use Cases cho LegoCity

Hướng dẫn này bao gồm các trường hợp sử dụng thực tế nơi AI có thể hỗ trợ trong việc xây dựng và quản lý bảng điều khiển thành phố thông minh, với các giới hạn và thực hành tốt nhất phù hợp.

!!! warning "AI là tùy chọn và hỗ trợ"
Tính năng AI là **trợ giúp**, không phải chức năng cốt lõi:

    - ✅ Tìm các trường hợp sử dụng nơi AI **tiết kiệm thời gian** mà không làm giảm chất lượng
    - ✅ Giữ con người **kiểm soát** các quyết định quan trọng
    - ❌ Không dựa vào AI cho **bảo mật**, **tính toàn vẹn dữ liệu** hoặc **logic hệ thống**---

## Các trường hợp sử dụng được khuyến nghị

### 1. Tạo nội dung cho Trang & Bài viết

**Trường hợp sử dụng**: Tạo bài viết blog, thông báo hoặc tài liệu về dịch vụ và dữ liệu thành phố.

**Khi nào sử dụng**

- ✅ Soạn thảo thông báo công khai
- ✅ Tạo nội dung hướng dẫn
- ✅ Viết câu trả lời FAQ
- ✅ Tạo các kịch bản ví dụ

**Triển khai**

```typescript
// Trong quản trị PayloadCMS
// Bật AI trên bộ sưu tập Posts

export const Posts: CollectionConfig = {
  slug: "posts",
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "content",
      type: "richText",
      admin: {
        ai: {
          enabled: true,
          prompts: {
            generate:
              "Write an engaging blog post about smart city initiatives",
          },
        },
      },
    },
  ],
};
```

**Quy trình ví dụ**

1. Biên tập viên tạo bài viết mới: "Chương trình chia sẻ xe đạp mới"
2. Nhấp "Tạo bằng AI"
3. AI tạo bản nháp dựa trên tiêu đề
4. Biên tập viên xem xét, chỉnh sửa và xuất bản

**Đầu ra AI**:

> "Chúng tôi vui mừng thông báo ra mắt chương trình chia sẻ xe đạp mới!
> Bắt đầu từ tháng sau, cư dân có thể sử dụng 500 xe đạp tại 50 trạm
> trên khắp thành phố..."

**Thực hành tốt nhất**

- ✅ Xem xét nội dung AI để kiểm tra độ chính xác
- ✅ Thêm chi tiết cụ thể về thành phố thủ công
- ✅ Xác minh ngày tháng, số liệu và sự thật
- ✅ Duy trì giọng điệu và phong cách nhất quán

---

### 2. Tự động hóa mô tả lớp

**Trường hợp sử dụng**: Tạo mô tả thân thiện với người dùng cho các lớp bản đồ dựa trên siêu dữ liệu kỹ thuật.

**Khi nào sử dụng**

- ✅ Tạo mô tả lớp nhanh chóng
- ✅ Duy trì tài liệu nhất quán
- ✅ Giải thích dữ liệu kỹ thuật cho người dân
- ✅ Mô tả đa ngôn ngữ

**Triển khai**

```typescript
// Trợ giúp AI tùy chỉnh cho các lớp
async function generateLayerDescription(layer: Layer) {
  const prompt = `Tạo mô tả thân thiện với người dùng cho lớp bản đồ thành phố thông minh này:

  Tên lớp: ${layer.name}
  Loại thực thể: ${layer.entityType}
  Thuộc tính: ${layer.attributes.join(", ")}
  Nguồn dữ liệu: ${layer.source}

  Viết mô tả 2-3 câu:
  - Giải thích người dân có thể học được gì từ dữ liệu này
  - Sử dụng ngôn ngữ đơn giản, không kỹ thuật
  - Đề cập tần suất cập nhật nếu có liên quan

  Giữ dưới 100 từ.`;

  return await ai.generateText(prompt);
}
```

**Đầu ra ví dụ**

**Đầu vào**:

- Lớp: "Giám sát chất lượng không khí"
- Loại thực thể: `AirQualityObserved`
- Thuộc tính: `pm25`, `pm10`, `no2`, `co`

**AI tạo ra**:

> "Xem các phép đo chất lượng không khí thời gian thực từ các cảm biến trên khắp thành phố.
> Lớp này hiển thị mức PM2.5, PM10, nitơ dioxit và carbon monoxide,
> được cập nhật mỗi giờ. Sử dụng dữ liệu này để kiểm tra chất lượng không khí trong khu vực của bạn
> và lên kế hoạch cho các hoạt động ngoài trời phù hợp."

**Thực hành tốt nhất**

- ✅ Cung cấp lời nhắc rõ ràng, có cấu trúc
- ✅ Bao gồm ngữ cảnh kỹ thuật (loại thực thể, thuộc tính)
- ✅ Xem xét độ chính xác kỹ thuật
- ✅ Đảm bảo tính nhất quán giữa các lớp

---

### 3. Đề xuất cấu hình

**Trường hợp sử dụng**: Đề xuất cấu hình tối ưu dựa trên mẫu dữ liệu và các thực hành phổ biến.

**Khi nào sử dụng**

- ✅ Khuyến nghị bảng màu cho các lớp
- ✅ Đề xuất mức độ phóng to cho chế độ xem bản đồ
- ✅ Đề xuất cấu hình bộ lọc
- ✅ Tự động tạo nhãn chú giải

**Implementation**

```typescript
// Suggest color scheme cho pollution data
async function suggestColorScheme(layerConfig: LayerConfig) {
  const prompt = `Suggest an appropriate color scheme for this map layer:

  Data Type: ${layerConfig.dataType}
  Value Range: ${layerConfig.min} to ${layerConfig.max}
  Purpose: ${layerConfig.purpose}

  Cung cấp 5 màu ở định dạng hex từ giá trị thấp nhất đến cao nhất.
  Consider accessibility and common conventions (e.g., green=good, red=bad).`;

  const colors = await ai.generateText(prompt);
  return parseColors(colors);
}
```

**Các kịch bản ví dụ**

**Chỉ số chất lượng không khí**:

- AI đề xuất: `['#00E400', '#FFFF00', '#FF7E00', '#FF0000', '#8F3F97']`
- Lý do: Bảng màu AQI tiêu chuẩn

**Nhiệt độ**:

- AI đề xuất: `['#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000']`
- Lý do: Dải màu từ lạnh (xanh) đến nóng (đỏ)

**Giới hạn**

- ⚠️ Xác minh khả năng tiếp cận màu sắc (tuân thủ WCAG)
- ⚠️ Kiểm tra khả năng tương thích với mù màu
- ⚠️ Đảm bảo phù hợp về văn hóa
- ⚠️ Kiểm tra với dữ liệu thực tế

---

### 4. Trợ lý tài liệu

**Trường hợp sử dụng**: Tạo tài liệu kỹ thuật, ví dụ API và hướng dẫn cấu hình.

**Khi nào sử dụng**

- ✅ Tài liệu hóa các điểm cuối API
- ✅ Tạo ví dụ cấu hình
- ✅ Viết hướng dẫn tích hợp
- ✅ Tạo đoạn mã

**Implementation**

```typescript
// Generate API documentation
async function generateAPIDoc(endpoint: APIEndpoint) {
  const prompt = `Generate API documentation for this endpoint:

  Method: ${endpoint.method}
  Path: ${endpoint.path}
  Parameters: ${JSON.stringify(endpoint.params)}
  Response: ${JSON.stringify(endpoint.response)}

  Include:
  - Description
  - Request example (curl)
  - Response example
  - Common use cases`;

  return await ai.generateText(prompt);
}
```

**Example Output**

**Endpoint**: `GET /api/entities/weather`

**AI Generated**:

````markdown
## Get Weather Entities

Lấy các entities quan sát thời tiết từ context broker.

### Request

```bash
curl https://api.city.example/api/entities/weather?limit=10
```
````

### Response

```json
{
  "entities": [
    {
      "id": "WeatherObserved:Station1",
      "temperature": 22.5,
      "humidity": 65
    }
  ]
}
```

### Use Cases

- Display current weather on dashboard
- Analyze temperature trends
- Monitor humidity levels

````

**Best Practices**
- ✅ Cung cấp đầy đủ các specification của endpoint
- ✅ Xác minh các ví dụ code hoạt động
- ✅ Cập nhật tài liệu khi APIs thay đổi
- ✅ Bao gồm các trường hợp lỗi

---

### 5. Tạo dữ liệu khởi tạo

**Trường hợp sử dụng**: Tạo dữ liệu kiểm thử thực tế cho phát triển và demo.

**Khi nào sử dụng**
- ✅ Tạo nội dung demo
- ✅ Điền vào cơ sở dữ liệu phát triển
- ✅ Kiểm thử giao diện với dữ liệu đa dạng
- ✅ Tạo nội dung giữ chỗ

**Implementation**

```typescript
// Generate sample weather data
async function generateSeedData(entityType: string, count: number) {
  const prompt = `Generate ${count} realistic sample records for this entity type:

  Entity Type: ${entityType}
  Schema: ${getEntitySchema(entityType)}

  Return as JSON array with realistic values for a smart city context.
  Bao gồm dữ liệu đa dạng (các thời điểm, địa điểm, giá trị khác nhau).`

  const data = await ai.generateText(prompt)
  return JSON.parse(data)
}
````

**Example Output**

**Request**: 3 weather observations

**AI Generated**:

```json
[
  {
    "id": "WeatherObserved:Station1",
    "location": { "coordinates": [10.762622, 106.660172] },
    "temperature": 32.5,
    "humidity": 75,
    "observedAt": "2025-12-01T14:00:00Z"
  },
  {
    "id": "WeatherObserved:Station2",
    "location": { "coordinates": [10.762733, 106.660283] },
    "temperature": 31.8,
    "humidity": 72,
    "observedAt": "2025-12-01T14:00:00Z"
  },
  {
    "id": "WeatherObserved:Station3",
    "location": { "coordinates": [10.762844, 106.660394] },
    "temperature": 33.2,
    "humidity": 78,
    "observedAt": "2025-12-01T14:00:00Z"
  }
]
```

**Giới hạn**

- ⚠️ Xác thực tuân thủ lược đồ dữ liệu
- ⚠️ Kiểm tra phạm vi giá trị thực tế
- ⚠️ Xác minh tọa độ địa lý
- ⚠️ Không phù hợp cho dữ liệu sản xuất

---

### 6. Cải thiện tìm kiếm thông minh

**Trường hợp sử dụng**: Cải thiện tìm kiếm với hiểu ngôn ngữ tự nhiên và khớp ngữ nghĩa.

**Khi nào sử dụng**

- ✅ Truy vấn ngôn ngữ tự nhiên
- ✅ Tìm kiếm ngữ nghĩa cho nội dung
- ✅ Mở rộng truy vấn và đề xuất
- ✅ Khớp mờ cho lỗi đánh máy

**Implementation**

```typescript
// Enhance search with AI
async function enhanceSearch(query: string) {
  // Generate search keywords
  const prompt = `Given this search query: "${query}"

  Generate:
  1. Normalized keywords
  2. Related terms
  3. Entity types that might match

  Return as JSON.`;

  const enhanced = await ai.generateText(prompt);
  const { keywords, related, entityTypes } = JSON.parse(enhanced);

  // Search with enhanced terms
  return searchEntities({ keywords, related, entityTypes });
}
```

**Ví dụ**

**Truy vấn người dùng**: "Cảm biến ô nhiễm không khí ở đâu?"

**Cải thiện AI**:

```json
{
  "keywords": ["air", "pollution", "sensors"],
  "related": ["air quality", "PM2.5", "PM10", "AQI", "monitoring stations"],
  "entityTypes": ["AirQualityObserved", "Device"]
}
```

**Kết quả**: Kết quả tìm kiếm tốt hơn bao gồm các thuật ngữ liên quan

**Thực hành tốt nhất**

- ✅ Lưu cache các truy vấn phổ biến
- ✅ Quay lại tìm kiếm thông thường nếu AI thất bại
- ✅ Theo dõi các chỉ số chất lượng tìm kiếm
- ✅ Tôn trọng quyền riêng tư người dùng

---

### 7. Chatbot cho người dân

**Trường hợp sử dụng**: Trả lời câu hỏi của người dân về dịch vụ và dữ liệu thành phố.

**Khi nào sử dụng**

- ✅ Các câu hỏi thường gặp (FAQ)
- ✅ Trợ giúp diễn giải dữ liệu
- ✅ Thông tin dịch vụ
- ✅ Hỗ trợ điều hướng

**Implementation**

```typescript
// Simple chatbot implementation
async function answerQuestion(question: string, context: CityContext) {
  const prompt = `You are a helpful assistant for a smart city dashboard.

  City Context:
  - Available data: ${context.availableData.join(", ")}
  - Services: ${context.services.join(", ")}

  Citizen Question: ${question}

  Cung cấp câu trả lời hữu ích, ngắn gọn (tối đa 150 từ).
  If you don't know, direct them to contact support.`;

  return await ai.generateText(prompt);
}
```

**Ví dụ cuộc trò chuyện**

**Hỏi**: "Làm thế nào để tìm chỗ đỗ xe gần Tòa thị chính?"

**AI**: "Bạn có thể sử dụng lớp cơ sở đỗ xe trên bản đồ để tìm chỗ
đỗ xe có sẵn gần Tòa thị chính. Nhấp vào biểu tượng đỗ xe để xem tình trạng có sẵn
và giá cả theo thời gian thực. Có 3 bãi đỗ xe công cộng trong vòng 500m từ Tòa thị chính với
tổng cộng 250 chỗ."

**Hỏi**: "Chất lượng không khí hôm nay thế nào?"

**AI**: "Dựa trên các số đo mới nhất từ cảm biến chất lượng không khí, Chỉ số
Chất lượng Không khí (AQI) là 65, thuộc phạm vi 'Trung bình'. Điều này có nghĩa là chất lượng
không khí chấp nhận được đối với hầu hết mọi người, mặc dù những cá nhân nhạy cảm bất thường
nên cân nhắc hạn chế vận động ngoài trời kéo dài."

**Xem xét về an toàn**

- ⚠️ Không cung cấp thông tin phản ứng khẩn cấp
- ⚠️ Không đưa ra quyết định chính sách
- ⚠️ Luôn trích dẫn nguồn dữ liệu
- ⚠️ Bao gồm tuyên bố miễn trừ trách nhiệm cho dự đoán
- ⚠️ Cung cấp tùy chọn liên hệ con người

---

## Các trường hợp sử dụng CẦN TRÁNH

### ❌ Bảo mật và Kiểm soát truy cập

**Không sử dụng AI cho**:

- Quyết định quyền người dùng
- Tạo chính sách bảo mật
- Xác thực thông tin đăng nhập
- Đưa ra quyết định xác thực

**Tại sao**: Bảo mật yêu cầu logic xác định, có thể kiểm toán, không phải AI xác suất.

### ❌ Xác thực dữ liệu và Tính toàn vẹn

**Không sử dụng AI cho**:

- Xác thực lược đồ thực thể
- Kiểm tra tính nhất quán dữ liệu
- Thực thi quy tắc kinh doanh
- Logic chuyển đổi dữ liệu

**Tại sao**: Tính toàn vẹn dữ liệu yêu cầu quy tắc xác thực chính xác, có thể kiểm thử.

### ❌ Hoạt động quan trọng

**Không sử dụng AI cho**:

- Quyết định triển khai
- Cấu hình hệ thống
- Di chuyển cơ sở dữ liệu
- Các hoạt động sao lưu/khôi phục

**Tại sao**: Các nhiệm vụ vận hành yêu cầu thủ tục xác định, đã kiểm thử.

### ❌ Cảnh báo thời gian thực

**Không sử dụng AI cho**:

- Thông báo khẩn cấp
- Cảnh báo dựa trên ngưỡng
- Cảnh báo hệ thống quan trọng
- Thông báo an toàn

**Tại sao**: Cảnh báo yêu cầu kích hoạt đáng tin cậy, tức thì, dựa trên quy tắc.

---

## Hướng dẫn triển khai

### 1. Yêu cầu xem xét của con người

```typescript
// Always require human approval for AI-generated content
async function generateWithApproval(prompt: string) {
  const draft = await ai.generateText(prompt);

  return {
    draft,
    status: "pending_review",
    requiresApproval: true,
    reviewer: null,
    approvedAt: null,
  };
}
```

### 2. Quay lại thủ công

```typescript
// Graceful fallback if AI unavailable
async function generateContent(prompt: string) {
  if (!process.env.ENABLE_AI) {
    return {
      content: "",
      mode: "manual",
      message: "AI features disabled. Please enter content manually.",
    };
  }

  try {
    const content = await ai.generateText(prompt);
    return { content, mode: "ai" };
  } catch (error) {
    return {
      content: "",
      mode: "manual",
      message: "AI generation failed. Please enter content manually.",
    };
  }
}
```

### 3. Dấu vết kiểm toán

```typescript
// Log all AI operations
async function generateWithAudit(prompt: string, userId: string) {
  const result = await ai.generateText(prompt);

  await logAIOperation({
    userId,
    prompt: prompt.substring(0, 100), // Truncate for privacy
    model: process.env.OPENROUTER_MODEL,
    timestamp: new Date(),
    approved: false,
  });

  return result;
}
```

### 4. Giám sát chi phí

```typescript
// Track AI usage and costs
async function generateWithCostTracking(prompt: string) {
  const startTime = Date.now();
  const result = await ai.generateText(prompt);
  const duration = Date.now() - startTime;

  await trackAICost({
    model: process.env.OPENROUTER_MODEL,
    promptTokens: estimateTokens(prompt),
    completionTokens: estimateTokens(result),
    duration,
    cost: calculateCost(prompt, result),
  });

  return result;
}
```

---

## Tóm tắt thực hành tốt nhất

### ✅ Nên

- Sử dụng AI cho bản nháp và đề xuất
- Giữ con người kiểm soát
- Xem xét tất cả đầu ra AI
- Cung cấp các lựa chọn thủ công
- Giám sát chi phí và việc sử dụng
- Ghi nhật ký các hoạt động AI
- Kiểm thử với các tình huống thực tế

### ❌ Không nên

- Dựa vào AI cho logic quan trọng
- Tự động xuất bản nội dung AI
- Sử dụng AI cho quyết định bảo mật
- Tạo dữ liệu sản xuất
- Bỏ qua xem xét của con người
- Bỏ qua giới hạn của AI
- Phụ thuộc quá mức vào AI

---

## Các bước tiếp theo

- [Cấu hình nhà cung cấp AI](providers.md) - Thiết lập nhà cung cấp AI
- [Hướng dẫn OpenRouter](openrouter.md) - Sử dụng mô hình tùy chỉnh
- [Tổng quan AI](overview.md) - Hiểu về AI trong LegoCity
