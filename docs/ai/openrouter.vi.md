# Nhà cung cấp tùy chỉnh OpenRouter

OpenRouter cung cấp truy cập 100+ mô hình AI thông qua một API duy nhất, giúp dễ dàng sử dụng các mô hình tùy chỉnh như Gemini 2.0 Flash, Claude, GPT-4o và nhiều hơn nữa mà không cần quản lý nhiều tích hợp nhà cung cấp.

!!! success "Tại sao chọn OpenRouter?" - 🆓 **Các mô hình miễn phí khả dụng** (Gemini 2.0 Flash, v.v.) - 🔌 **Hơn 100 mô hình** - Truy cập các mô hình mới nhất từ tất cả nhà cung cấp - 💰 **Hiệu quả về chi phí** - Giá cạnh tranh, trả theo mức sử dụng - 🚀 **Không giới hạn tốc độ** từ các nhà cung cấp riêng lẻ - 🔄 **Tự động dự phòng** - Logic thử lại tích hợp sẵn - 🎯 **API duy nhất** - Một tích hợp cho tất cả mô hình

---

## Bắt đầu nhanh

### 1. Lấy khóa API OpenRouter

1. Truy cập [openrouter.ai](https://openrouter.ai/)
2. Đăng ký hoặc đăng nhập
3. Đi tới [API Keys](https://openrouter.ai/keys)
4. Tạo khóa API mới

### 2. Cấu hình môi trường

```env title=".env"
# Bật tính năng AI
ENABLE_AI=true
AI_PROVIDER=openrouter

# Cấu hình OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_SITE_URL=https://legocity.example.com  # Tùy chọn
OPENROUTER_APP_NAME=LegoCity                      # Tùy chọn
```

### 3. Cấu hình nhà cung cấp tùy chỉnh

```typescript title="src/payload.config.ts"
import { buildConfig } from "payload/config";

export default buildConfig({
  plugins: [
    // Custom OpenRouter provider
    {
      name: "ai-openrouter",
      provider: async ({ apiKey, model }) => {
        return {
          generateText: async ({ prompt, max_tokens = 500 }) => {
            const response = await fetch(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                  "HTTP-Referer": process.env.OPENROUTER_SITE_URL,
                  "X-Title": process.env.OPENROUTER_APP_NAME,
                },
                body: JSON.stringify({
                  model: model,
                  messages: [{ role: "user", content: prompt }],
                  max_tokens,
                }),
              }
            );

            const data = await response.json();
            return data.choices[0].message.content;
          },
        };
      },
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL,
      enabled: process.env.ENABLE_AI === "true",
    },
  ],
});
```

---

## Các mô hình được khuyến nghị

### Các mô hình miễn phí (Hoàn hảo cho phát triển)

| Mô hình                                   | Nhà cung cấp | Tốc độ | Chất lượng | Ngữ cảnh  |
| ----------------------------------------- | ------------ | ------ | ---------- | --------- |
| **google/gemini-2.0-flash-exp:free**      | Google       | ⚡⚡⚡ | ⭐⭐⭐⭐   | 1M tokens |
| **google/gemini-flash-1.5:free**          | Google       | ⚡⚡⚡ | ⭐⭐⭐⭐   | 1M tokens |
| **meta-llama/llama-3.2-3b-instruct:free** | Meta         | ⚡⚡   | ⭐⭐⭐     | 128K      |
| **qwen/qwen-2-7b-instruct:free**          | Alibaba      | ⚡⚡   | ⭐⭐⭐     | 32K       |

!!! tip "Mô hình miễn phí tốt nhất"
**google/gemini-2.0-flash-exp:free** - Chất lượng tuyệt vời, rất nhanh, cửa sổ ngữ cảnh 1M token

### Các mô hình cao cấp (Sử dụng cho sản xuất)

| Mô hình                                  | Chi phí (mỗi 1M tokens) | Tốt nhất cho            |
| ---------------------------------------- | ----------------------- | ----------------------- |
| **google/gemini-2.0-flash-thinking-exp** | $0.10 / $0.40           | Lý luận nâng cao        |
| **anthropic/claude-3.5-sonnet**          | $3.00 / $15.00          | Nội dung chất lượng cao |
| **openai/gpt-4o-mini**                   | $0.15 / $0.60           | Sử dụng chung           |
| **openai/gpt-4o**                        | $2.50 / $10.00          | Nhiệm vụ phức tạp       |
| **meta-llama/llama-3.3-70b-instruct**    | $0.59 / $0.79           | Hiệu quả chi phí        |

### Các mô hình chuyên biệt

| Mô hình                                         | Mục đích           | Ngữ cảnh  |
| ----------------------------------------------- | ------------------ | --------- |
| **google/gemini-flash-1.5-8b**                  | Phản hồi cực nhanh | 1M tokens |
| **anthropic/claude-3-haiku**                    | Bản thảo nhanh     | 200K      |
| **perplexity/llama-3.1-sonar-huge-128k-online** | Tìm kiếm web + AI  | 128K      |

---

## Hướng dẫn lựa chọn mô hình

### Theo trường hợp sử dụng

**Tạo nội dung**  
**Khuyến nghị**: `google/gemini-2.0-flash-exp:free`

- Bài viết blog, mô tả
- Nội dung hướng đến người dùng
- Tài liệu

**Tạo mã nguồn**  
**Khuyến nghị**: `anthropic/claude-3.5-sonnet`

- Tệp cấu hình
- Ví dụ API
- Tài liệu kỹ thuật

**Bản thảo nhanh**  
**Khuyến nghị**: `google/gemini-flash-1.5-8b`

- Mô tả ngắn
- Nhãn, tiêu đề
- Tóm tắt nhanh

**Lý luận phức tạp**  
**Khuyến nghị**: `google/gemini-2.0-flash-thinking-exp`

- Phân tích dữ liệu
- Hỗ trợ quyết định
- Nhiệm vụ nhiều bước

### Theo ngân sách

**Miễn phí**

```typescript
// Lựa chọn miễn phí tốt nhất
model: "google/gemini-2.0-flash-exp:free";

// Các lựa chọn khác
// model: 'google/gemini-flash-1.5:free'
// model: 'meta-llama/llama-3.2-3b-instruct:free'
```

**Chi phí thấp ($)**

```typescript
// Giá trị tốt nhất
model: "openai/gpt-4o-mini"; // $0.15/$0.60 mỗi 1M

// Lựa chọn khác
// model: 'google/gemini-flash-1.5'  // $0.075/$0.30 mỗi 1M
```

**Chất lượng cao ($$)**

```typescript
// Chất lượng tốt nhất
model: "anthropic/claude-3.5-sonnet"; // $3/$15 mỗi 1M

// Lựa chọn khác
// model: 'openai/gpt-4o'  // $2.50/$10 mỗi 1M
```

---

## Cấu hình nâng cao

### Chuyển đổi mô hình

Đổi models dựa trên task:

```typescript title="src/lib/ai-helper.ts"
const AI_MODELS = {
  content: "google/gemini-2.0-flash-exp:free",
  code: "anthropic/claude-3.5-sonnet",
  quick: "google/gemini-flash-1.5-8b",
  reasoning: "google/gemini-2.0-flash-thinking-exp",
};

export async function generateWithAI(
  prompt: string,
  task: keyof typeof AI_MODELS
) {
  const model = AI_MODELS[task];

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
      }),
    }
  );

  return response.json();
}
```

### Chuỗi dự phòng

```typescript
const FALLBACK_MODELS = [
  "google/gemini-2.0-flash-exp:free", // Thử miễn phí trước
  "openai/gpt-4o-mini", // Dự phòng sang trả phí
  "anthropic/claude-3.5-haiku", // Phương án cuối cùng
];

async function generateWithFallback(prompt: string) {
  for (const model of FALLBACK_MODELS) {
    try {
      return await generateWithAI(prompt, model);
    } catch (error) {
      console.warn(`Mô hình ${model} thất bại, đang thử mô hình tiếp theo...`);
    }
  }
  throw new Error("Tất cả các mô hình AI đều thất bại");
}
```

### Tham số tùy chỉnh

```typescript
await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-2.0-flash-exp:free",
    messages: [{ role: "user", content: prompt }],

    // Tham số tùy chỉnh
    temperature: 0.7, // Độ sáng tạo (0-2)
    max_tokens: 1000, // Độ dài phản hồi
    top_p: 0.9, // Lấy mẫu hạt nhân
    frequency_penalty: 0.5, // Giảm lặp lại
    presence_penalty: 0.5, // Khuyến khích đa dạng

    // Dành riêng cho OpenRouter
    transforms: ["middle-out"], // Giảm độ trễ
    route: "fallback", // Tự động dự phòng khi lỗi
  }),
});
```

---

## Quản lý chi phí

### Giám sát mức sử dụng

OpenRouter cung cấp theo dõi mức sử dụng:

1. Truy cập [openrouter.ai/activity](https://openrouter.ai/activity)
2. Xem chi phí theo từng mô hình
3. Đặt cảnh báo ngân sách

### Chiến lược tiết kiệm chi phí

**Sử dụng mô hình miễn phí cho phát triển**

```env title=".env.development"
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```

**Giới hạn số lượng token**

```typescript
max_tokens: 300; // Giữ phản hồi ngắn gọn
```

**Lưu trữ phản hồi vào bộ nhớ đệm**

```typescript
// Lưu trữ phản hồi AI cho các lời nhắc giống hệt nhau
const cache = new Map();

async function cachedGenerate(prompt: string) {
  if (cache.has(prompt)) return cache.get(prompt);

  const result = await generateWithAI(prompt);
  cache.set(prompt, result);
  return result;
}
```

**Xử lý theo lô**

```typescript
// Tạo nhiều mục trong một yêu cầu
const prompt = `Tạo mô tả cho các lớp này:
1. Quan sát thời tiết
2. Vùng lũ lụt
3. Cơ sở đậu xe`;
```

---

## Khắc phục sự cố

### Các vấn đề thường gặp

**401 Không được ủy quyền**  
**Vấn đề**: Khóa API không hợp lệ

**Giải pháp**:

```bash
# Xác minh định dạng khóa
echo $OPENROUTER_API_KEY  # Phải bắt đầu bằng sk-or-v1-

# Kiểm tra khóa
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

**402 Yêu cầu thanh toán**  
**Vấn đề**: Không đủ tín dụng

**Giải pháp**:

- Sử dụng các mô hình miễn phí: `google/gemini-2.0-flash-exp:free`
- Thêm tín dụng: [openrouter.ai/credits](https://openrouter.ai/credits)

**429 Giới hạn tốc độ**  
**Vấn đề**: Quá nhiều yêu cầu

**Giải pháp**:

```typescript
// Thêm độ trễ giữa các yêu cầu
await new Promise((resolve) => setTimeout(resolve, 1000));
```

**Không tìm thấy mô hình**  
**Vấn đề**: Tên mô hình không hợp lệ

**Giải pháp**:

```bash
# Liệt kê các mô hình khả dụng
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

---

## Thực hành tốt nhất

### 1. Thiết lập phát triển

```env title=".env.development"
# Sử dụng các mô hình miễn phí cho phát triển
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_SITE_URL=http://localhost:3000
```

### 2. Thiết lập sản xuất

```env title=".env.production"
# Sử dụng các mô hình trả phí đáng tin cậy cho sản xuất
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_SITE_URL=https://legocity.example.com
```

### 3. Xử lý lỗi

```typescript
async function safeGenerate(prompt: string) {
  try {
    return await generateWithAI(prompt);
  } catch (error) {
    console.error("AI generation failed:", error);
    // Fallback sang manual content
    return null;
  }
}
```

### 4. Giới hạn tốc độ

```typescript
import pLimit from "p-limit";

// Giới hạn các yêu cầu AI đồng thời
const limit = pLimit(3);

const promises = prompts.map((prompt) => limit(() => generateWithAI(prompt)));

await Promise.all(promises);
```

---

## Tài nguyên

- **Tài liệu OpenRouter**: [openrouter.ai/docs](https://openrouter.ai/docs)
- **Danh sách mô hình**: [openrouter.ai/models](https://openrouter.ai/models)
- **Giá cả**: [openrouter.ai/docs#pricing](https://openrouter.ai/docs#pricing)
- **Tham chiếu API**: [openrouter.ai/docs/api-reference](https://openrouter.ai/docs/api-reference)

---

## Các bước tiếp theo

- [Cấu hình nhà cung cấp AI](providers.md) - So sánh tất cả nhà cung cấp
- [Các trường hợp sử dụng AI](use-cases.md) - Các ví dụ thực tế
- [Tổng quan về AI](overview.md) - Hiểu về AI trong LegoCity
