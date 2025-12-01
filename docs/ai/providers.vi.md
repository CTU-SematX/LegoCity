# Cấu hình AI Provider

LegoCity hỗ trợ nhiều AI providers thông qua Payload AI plugin. Hướng dẫn này bao gồm các nhà cung cấp được hỗ trợ chính thức và thiết lập nhà cung cấp tùy chỉnh.

!!! info "Hỗ trợ chính thức"
**Nhà cung cấp được hỗ trợ chính thức:**

    - ✅ **OpenAI** (GPT-4, GPT-3.5-turbo)
    - ✅ **Anthropic** (Claude 3.5, Claude 3)
    - ✅ **ElevenLabs** (Tổng hợp giọng nói)

    **Nhà cung cấp tùy chỉnh:**

    - 🔌 **OpenRouter** - Truy cập 100+ models (Gemini, Claude, GPT-4o, etc.)
    - 🔧 **Custom Providers** - Tự xây dựng integration

---

## Cấu hình OpenAI

### Thiết lập

1. **Lấy khóa API** từ [platform.openai.com](https://platform.openai.com/api-keys)

2. **Cấu hình môi trường**:

```env title=".env"
# Bật tính năng AI
ENABLE_AI=true
AI_PROVIDER=openai

# Thông tin xác thực OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_ORGANIZATION=org-...  # Optional
```

3. **Cấu hình Plugin Payload**:

```typescript title="src/payload.config.ts"
import { payloadAI } from "@payloadcms/plugin-ai";

export default buildConfig({
  plugins: [
    payloadAI({
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      enabled: process.env.ENABLE_AI === "true",
      collections: {
        pages: {
          fields: ["content", "description"],
        },
        posts: {
          fields: ["content", "excerpt"],
        },
      },
    }),
  ],
});
```

### Mô hình được khuyến nghị

| Model             | Tốt nhất cho                             | Cost | Speed     |
| ----------------- | ---------------------------------------- | ---- | --------- |
| **gpt-4o**        | Nội dung chất lượng cao, tác vụ phức tạp | $$$  | Fast      |
| **gpt-4o-mini**   | Sử dụng chung, hiệu quả chi phí          | $    | Very Fast |
| **gpt-4-turbo**   | Suy luận nâng cao                        | $$$  | Medium    |
| **gpt-3.5-turbo** | Tác vụ đơn giản, bản nháp                | $    | Very Fast |

!!! tip "Recommendation"
Bắt đầu với **gpt-4o-mini** cho hầu hết use cases - chất lượng tuyệt vời với chi phí thấp.

---

## Cấu hình Anthropic (Claude)

### Thiết lập

1. **Lấy khóa API** từ [console.anthropic.com](https://console.anthropic.com/)

2. **Cấu hình môi trường**:

```env title=".env"
# Bật tính năng AI
ENABLE_AI=true
AI_PROVIDER=anthropic

# Anthropic Credentials
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

3. **Cấu hình Plugin Payload**:

```typescript title="src/payload.config.ts"
import { payloadAI } from "@payloadcms/plugin-ai";

export default buildConfig({
  plugins: [
    payloadAI({
      provider: "anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL,
      enabled: process.env.ENABLE_AI === "true",
      collections: {
        pages: {
          fields: ["content", "description"],
        },
      },
    }),
  ],
});
```

### Mô hình được khuyến nghị

| Model                          | Tốt nhất cho                   | Context Window | Cost |
| ------------------------------ | ------------------------------ | -------------- | ---- |
| **claude-3-5-sonnet-20241022** | Chất lượng tốt nhất, lập trình | 200K           | $$   |
| **claude-3-5-haiku-20241022**  | Nhanh, hiệu quả chi phí        | 200K           | $    |
| **claude-3-opus**              | Khả năng cao nhất              | 200K           | $$$  |

!!! tip "Recommendation"
**Claude 3.5 Sonnet** cung cấp chất lượng tuyệt vời với context windows lớn - tuyệt vời cho long-form content.

---

## ElevenLabs (Tổng hợp giọng nói)

### Thiết lập

1. **Lấy khóa API** từ [elevenlabs.io](https://elevenlabs.io/)

2. **Cấu hình môi trường**:

```env title=".env"
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Giọng nói mặc định
```

3. **Trường hợp sử dụng**: Tạo audio descriptions cho accessibility

```typescript
// Ví dụ: Tạo audio cho page descriptions
const audioUrl = await generateAudio({
  text: page.description,
  voiceId: process.env.ELEVENLABS_VOICE_ID,
});
```

---

## OpenRouter (Custom Models)

OpenRouter cung cấp truy cập 100+ AI models thông qua unified API.

!!! success "Why OpenRouter?" - ✅ Truy cập **Gemini 2.0 Flash**, Claude, GPT-4o và nhiều hơn - ✅ **No rate limits** từ individual providers - ✅ **Cost-effective** - giá cạnh tranh - ✅ **Automatic fallbacks** - nếu một model fails, thử model khác - ✅ **Easy switching** - đổi models mà không cần đổi code

### Thiết lập

Xem hướng dẫn chi tiết: [OpenRouter Custom Provider](openrouter.md)

**Thiết lập nhanh**:

```env title=".env"
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```

---

## So sánh Provider

### Ma trận tính năng

| Feature               | OpenAI     | Anthropic  | OpenRouter                         |
| --------------------- | ---------- | ---------- | ---------------------------------- |
| **Quality**           | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ (tùy thuộc vào mô hình) |
| **Speed**             | Fast       | Fast       | Fast                               |
| **Cost**              | $$         | $$         | $ (varies by model)                |
| **Context Window**    | 128K       | 200K       | Varies (lên đến 2M)                |
| **Dễ dàng thiết lập** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐                           |
| **Đa dạng mô hình**   | Limited    | Limited    | 100+ models                        |
| **Rate Limits**       | Yes        | Yes        | Phụ thuộc nhà cung cấp             |

### So sánh chi phí (mỗi 1M token)

| Provider                        | Input | Output | Tốt nhất cho         |
| ------------------------------- | ----- | ------ | -------------------- |
| **OpenAI gpt-4o-mini**          | $0.15 | $0.60  | General use          |
| **Anthropic Claude 3.5 Haiku**  | $0.80 | $4.00  | Fast tasks           |
| **OpenRouter Gemini 2.0 Flash** | Free  | Free   | Phát triển, kiểm thử |

---

## Cấu hình theo môi trường

### Development

```env title=".env.development"
ENABLE_AI=true
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```

**Why**: Bậc miễn phí, lặp nhanh

### Staging

```env title=".env.staging"
ENABLE_AI=true
AI_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

**Why**: Test production setup với cost-effective model

### Production

```env title=".env.production"
ENABLE_AI=true
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

**Why**: Chất lượng tốt nhất cho end users

---

## Cấu hình nâng cao

### Multiple Providers (Fallback)

```typescript title="src/payload.config.ts"
export default buildConfig({
  plugins: [
    payloadAI({
      providers: [
        {
          name: "primary",
          provider: "openai",
          apiKey: process.env.OPENAI_API_KEY,
          model: "gpt-4o-mini",
        },
        {
          name: "fallback",
          provider: "openrouter",
          apiKey: process.env.OPENROUTER_API_KEY,
          model: "google/gemini-2.0-flash-exp:free",
        },
      ],
      fallbackStrategy: "sequential", // Thử primary trước, fallback nếu fails
    }),
  ],
});
```

### Giới hạn tốc độ

```typescript
payloadAI({
  provider: "openai",
  rateLimit: {
    requests: 100,
    period: "1h",
  },
});
```

### Lời nhắc tùy chỉnh

```typescript
payloadAI({
  prompts: {
    generateDescription: `Tạo mô tả ngắn gọn, thân thiện với người dùng for this smart city data layer. 
Tập trung vào những gì người dân có thể học được từ dữ liệu này.
Giữ dưới 100 từ.`,
  },
});
```

---

## Khắc phục sự cố

### Vấn đề khóa API

```bash
# Kiểm tra kết nối OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Kiểm tra kết nối Anthropic
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

### Lỗi thường gặp

| Error                   | Cause                    | Solution                       |
| ----------------------- | ------------------------ | ------------------------------ |
| `401 Unauthorized`      | Khóa API không hợp lệ    | Kiểm tra khóa, tạo lại nếu cần |
| `429 Too Many Requests` | Vượt quá giới hạn tốc độ | Thêm độ trễ, nâng cấp bậc      |
| `500 Server Error`      | Sự cố nhà cung cấp       | Sử dụng nhà cung cấp dự phòng  |
| `Tính năng AI bị tắt`   | `ENABLE_AI=false`        | Set to `true` in .env          |

---

## Thực hành tốt nhất

### 1. Security

- 🔐 Lưu API keys trong environment variables, không bao giờ trong code
- 🔒 Sử dụng keys khác nhau cho dev/staging/prod
- 🔄 Rotate keys thường xuyên
- 🚫 Không bao giờ commit `.env` files

### 2. Cost Management

- 💰 Bắt đầu với free/cheap models (Gemini 2.0 Flash, gpt-4o-mini)
- 📊 Monitor usage qua provider dashboards
- 🎯 Giới hạn AI features cho specific collections/fields
- ⚠️ Set rate limits và budgets

### 3. Performance

- ⚡ Sử dụng faster models cho real-time features
- 🔄 Cache AI responses khi có thể
- 📦 Batch requests khi thích hợp
- ⏱️ Đặt thời gian chờ hợp lý

---

## Các bước tiếp theo

- [Hướng dẫn thiết lập OpenRouter](openrouter.md) - Sử dụng custom models
- [AI Trường hợp sử dụngs](use-cases.md) - Các ví dụ thực tế
- [Tổng quan AI](overview.md) - Hiểu về AI trong LegoCity
