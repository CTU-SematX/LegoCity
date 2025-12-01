# Triển khai AWS

Trang này mô tả cách thực tế để triển khai LegoCity trên **AWS** sử dụng các managed services.

Nó tập trung vào:

- ánh xạ các components của LegoCity tới AWS services,
- kiến trúc tối thiểu nhưng thực tế (dev + prod),
- các bước cụ thể để có một deployment hoạt động,
- maintenance cơ bản: updates, monitoring, backups.

Đây không phải là một template Terraform/CloudFormation đầy đủ, nhưng nó nên đủ chi tiết để một engineer quen thuộc với AWS basics có thể implement.

---

## Khi nào sử dụng AWS

Deployment dựa trên AWS phù hợp khi:

- tổ chức đã sử dụng AWS,
- yêu cầu uptime và scalability cao hơn "một VM với Docker",
- ưu tiên managed databases và monitoring hơn self-hosted.

Có thể là overkill khi:

- bạn chỉ cần một prototype ngắn hạn,
- bạn không có quyền truy cập AWS account hoặc AWS skills cơ bản.

---

## Ánh xạ Component → AWS service

Ánh xạ điển hình từ các components của LegoCity tới AWS như sau:

- **Context broker**

  - Chạy như một container trên:
    - AWS ECS (Fargate hoặc EC2 launch type), hoặc
    - EKS (Kubernetes) nếu bạn đã có.
  - Storage trên:
    - EBS volume hoặc
    - S3 (nếu broker hỗ trợ) hoặc
    - internal DB, tùy thuộc vào broker implementation.

- **PayloadCMS**

  - Chạy như một container trên ECS/EKS.
  - Database trên:
    - Amazon RDS (PostgreSQL hoặc MySQL) hoặc
    - Amazon DocumentDB / Mongo-compatible service.

- **Proxy / API layer**

  - Chạy như một container trên ECS/EKS.
  - Tùy chọn được fronted bởi:
    - Application Load Balancer (ALB) hoặc
    - API Gateway + Lambda nếu được rewrite.

- **Dashboard (Next.js + Mapbox)**  
  Options:

  - build như static assets và host trên:
    - S3 + CloudFront,  
      HOẶC
  - chạy như một container trên ECS/EKS phía sau ALB nếu cần server-side rendering.

- **Update servers**

  - Chạy như:
    - ECS services (long-running tasks), hoặc
    - ECS scheduled tasks (cron-like), hoặc
    - Lambda functions (nếu implemented serverless).

- **Networking & ingress**

  - VPC với public và private subnets,
  - ALB trong public subnets routing tới ECS services trong private subnets,
  - security groups controlling traffic.

- **Configuration & secrets**

  - AWS Systems Manager Parameter Store hoặc Secrets Manager cho:
    - broker write keys,
    - DB credentials,
    - external API keys.

- **Monitoring & logs**
  - CloudWatch Logs cho container logs,
  - CloudWatch metrics và alarms.

---

## Environments: dev và prod

Ở mức tối thiểu, bạn nên định nghĩa:

- một **development** environment:

  - ECS services nhỏ hơn,
  - RDS instance nhỏ hơn,
  - restricted access (chỉ internal users),
  - được sử dụng để test blocks mới, map views và update servers.

- một **production** environment:
  - scaled versions của cùng các components,
  - stricter access controls,
  - visible cho end users.

Bạn có thể implement điều này bằng:

- các AWS accounts riêng biệt (preferred trong các orgs lớn hơn), hoặc
- các VPCs và ECS clusters riêng biệt trong cùng một account, hoặc
- ít nhất các ECS services, RDS instances và Parameter Store paths riêng biệt với prefixes (ví dụ `/legocity/dev/...` vs `/legocity/prod/...`).

Tài liệu này giả định các **dev** và **prod** ECS services và RDS instances riêng biệt bên trong cùng một account, với configuration được phân tách bằng Parameter Store prefixes.

---

## Container images và registries

Tất cả các components của LegoCity chạy như containers cần images:

- broker image (official hoặc custom),
- PayloadCMS image,
- proxy image,
- dashboard image (nếu không purely static),
- update server images.

Workflow:

1. Build images locally hoặc trong CI.
2. Push images tới **Amazon ECR** (Elastic Container Registry).
3. Configure ECS services để sử dụng các images này by tag.

Patterns được khuyến nghị:

- sử dụng ECR repositories riêng biệt per service:
  - `legocity-broker`,
  - `legocity-payload`,
  - `legocity-proxy`,
  - `legocity-dashboard`,
  - `legocity-update-env`, v.v.
- sử dụng semantic tags hoặc ít nhất:
  - `dev-<short-sha>` cho dev,
  - `prod-<short-sha>` cho prod.

---

## Network và VPC layout

Một minimal network layout phổ biến:

- một VPC với:
  - public subnets (cho ALB),
  - private subnets (cho ECS tasks và RDS).

Components:

- **ALB** trong public subnets:

  - nhận HTTPS traffic từ internet,
  - terminates TLS (ACM certificates),
  - forwards tới ECS target groups.

- **ECS services** trong private subnets:

  - broker (chỉ cho internal access),
  - proxy,
  - PayloadCMS,
  - Next.js (nếu SSR),
  - update servers.

- **RDS** trong private subnets:
  - chỉ accessible từ ECS tasks qua security groups.

Security groups:

- một SG cho ALB (ingress 80/443 từ internet),
- một SG cho ECS tasks (ingress từ ALB SG và từ internal SGs khác),
- một SG cho RDS (ingress từ ECS SG only),
- optional SGs cho broker nếu muốn restrict ECS services nào có thể call nó.

---

## Minimal architecture pattern

Cho một minimal nhưng structured setup:

- **ECS Cluster: `legocity-cluster`**

  - chạy tất cả services như ECS services với Fargate.

- **Services:**

  - `legocity-broker-service` (Fargate, private subnets, no public IP),
  - `legocity-payload-service` (Fargate, private, behind ALB),
  - `legocity-proxy-service` (Fargate, private, behind ALB),
  - `legocity-dashboard-service` (Fargate, private, behind ALB)  
    (skip nếu host dashboard trên S3+CloudFront),
  - `legocity-update-env-service` (Fargate, private, no ALB, long-running / scheduled).

- **RDS:**

  - `legocity-payload-db` – PostgreSQL hoặc MySQL,
  - security group chỉ allowing connections từ ECS tasks.

- **ALB:**

  - listeners trên 80/443, redirect 80 → 443,
  - target groups:
    - `/admin` → PayloadCMS,
    - `/api` → proxy,
    - `/` → dashboard.

- **S3 + CloudFront (optional nhưng recommended cho Next.js static build):**
  - S3 bucket cho static assets,
  - CloudFront distribution fronting bucket,
  - API requests được routed tới ALB.

---

## Configuration và secrets trên AWS

Sử dụng **SSM Parameter Store** hoặc **Secrets Manager** cho configuration, không phải hard-coded environment variables trong ECS task definitions.

Ví dụ về Parameter Store paths:

- `/legocity/dev/broker/url`
- `/legocity/dev/broker/write-key/env`
- `/legocity/dev/payload/db-url`
- `/legocity/dev/external/weather/api-key`

- `/legocity/prod/broker/url`
- `/legocity/prod/broker/write-key/env`
- `/legocity/prod/payload/db-url`
- `/legocity/prod/external/weather/api-key`

Mỗi ECS task:

- obtains config của nó at runtime qua environment variables,
- environment values có thể được pulled từ SSM parameters by name.

Basic pattern:

- TASK_DEF env:
  - `BROKER_URL` ← SSM `/legocity/prod/broker/url`
  - `BROKER_WRITE_KEY` ← SSM `/legocity/prod/broker/write-key/env`
  - `PAYLOAD_DB_URL` ← SSM `/legocity/prod/payload/db-url`
  - `WEATHER_API_KEY` ← SSM `/legocity/prod/external/weather/api-key`

Grant ECS task role permission để read các specific parameter paths cần thiết.

---

## Step-by-step skeleton: first production-like deployment

Đây là một **skeleton sequence** cho việc set up một first production-like environment. Chi tiết phụ thuộc vào chosen tools của bạn (console vs IaC), nhưng thứ tự cần rõ ràng.

### 1. Prepare VPC và networking

- Create một VPC (hoặc reuse một VPC hiện có) với:

  - ít nhất hai public subnets (trong different AZs),
  - ít nhất hai private subnets (trong different AZs),
  - một Internet Gateway,
  - NAT Gateway(s) cho private subnets (để ECS tasks có thể fetch images, call external APIs).

- Create security groups:
  - `sg-alb`:
    - ingress: 80/443 từ internet,
    - egress: tới ECS SG.
  - `sg-ecs`:
    - ingress: từ `sg-alb` trên app ports,
    - ingress: từ chính nó nếu services call nhau,
    - egress: tới `sg-rds`, internet qua NAT.
  - `sg-rds`:
    - ingress: từ `sg-ecs` trên DB port (ví dụ 5432).

### 2. Create RDS cho PayloadCMS

- Choose engine: PostgreSQL hoặc MySQL.
- Deploy `legocity-payload-db` vào private subnets với `sg-rds`.
- Configure:
  - DB name, user, password,
  - backup retention, automated backups.
- Đảm bảo ECS tasks có thể resolve và connect qua DB endpoint.

### 3. Create ECR repositories và push images

Cho mỗi component:

- create một ECR repo (ví dụ `legocity-payload`),
- build image và push:
  - `dev` tag cho dev,
  - `prod` tag cho prod.

Làm điều này cho:

- broker,
- PayloadCMS,
- proxy,
- dashboard (nếu container-based),
- ít nhất một update server.

### 4. Configure SSM parameters cho configuration

Create parameters cho prod environment:

- `/legocity/prod/broker/url`
- `/legocity/prod/broker/write-key/env`
- `/legocity/prod/payload/db-url`
- `/legocity/prod/external/weather/api-key`
- bất kỳ others cần bởi proxy và update servers.

Store sensitive values như **SecureString**.

### 5. Create ECS cluster và task definitions

- Create `legocity-cluster`.
- Cho mỗi service, define một task definition:
  - container image từ ECR,
  - CPU/memory limits,
  - environment variables referencing SSM parameters,
  - logging tới CloudWatch Logs,
  - port mappings.

Services:

- `broker-task` / `broker-service`:

  - desired count: 1 (để start),
  - private subnets, `sg-ecs`,
  - no public IP,
  - no ALB (internal only).

- `payload-task` / `payload-service`:

  - desired count: 1,
  - private subnets, `sg-ecs`,
  - ALB target group (HTTP port, ví dụ 3000).

- `proxy-task` / `proxy-service`:

  - similar to payload, với ALB target group (HTTP port, ví dụ 4000).

- `dashboard-task` / `dashboard-service` (nếu container-based):

  - ALB target group (HTTP port, ví dụ 3001).

- `update-env-task` / `update-env-service`:
  - no ALB,
  - private subnets, `sg-ecs`,
  - `desiredCount = 1` (long-running) hoặc scheduled task.

### 6. Create và configure Application Load Balancer

- Create một ALB trong public subnets với `sg-alb`.
- Create target groups:

  - `tg-payload` → ECS tasks (payload),
  - `tg-proxy` → ECS tasks (proxy),
  - `tg-dashboard` → ECS tasks (dashboard) nếu applicable.

- Configure listeners:

  - HTTP (80) → redirect tới HTTPS (443),
  - HTTPS (443):
    - path `/admin*` → `tg-payload`,
    - path `/api*` → `tg-proxy`,
    - path `/` → `tg-dashboard` (hoặc CloudFront nếu sử dụng static hosting).

- Attach một ACM certificate cho domain(s) của bạn.

### 7. DNS và domains

Sử dụng Route 53 (hoặc DNS provider khác) để:

- point `city.example` hoặc `dashboard.city.example` tới ALB,
- point `admin.city.example` tới cùng ALB nếu muốn một host riêng cho PayloadCMS admin.

Check:

- HTTP(S) routing,
- TLS configuration,
- rằng PayloadCMS và dashboard load correctly.

### 8. Verify data flow

Sau khi services đang chạy:

- confirm broker health:

  - từ một ECS task hoặc một bastion host, call broker's NGSI-LD endpoint.

- confirm PayloadCMS connects tới RDS:

  - complete bất kỳ initial admin setup,
  - log in tới admin UI.

- confirm update servers write entities:

  - check update server logs trong CloudWatch,
  - query broker cho `WeatherObserved` hoặc các entities khác.

- confirm proxy returns data:

  - call `/api/...` endpoints qua ALB,
  - check rằng responses reflect entities trong broker.

- confirm dashboard shows data:
  - open dashboard URL,
  - check map layers và widgets cho live entities.

---

## Monitoring và logging

Sử dụng **CloudWatch Logs** và **CloudWatch metrics**:

- send logs từ ECS tasks tới CloudWatch Log Groups:

  - một log group per service thường đủ.

- define CloudWatch alarms cho:
  - ECS service không reaching desired count,
  - high CPU/memory usage,
  - RDS storage hoặc CPU thresholds,
  - broker hoặc proxy health check failures.

Optional:

- integrate với email/Slack/other qua SNS cho alerts,
- sử dụng AWS X-Ray hoặc similar cho deeper request tracing nếu cần.

---

## Backups và restoration

Primary stateful components:

- **RDS (PayloadCMS DB)**:

  - configure automatic backups,
  - enable point-in-time recovery nếu cần,
  - create manual snapshots trước major changes.

- **Broker storage**:

  - nếu broker keeps state trên disk:
    - sử dụng EBS snapshots,
    - hoặc export entities periodically.

- **Configuration**:
  - SSM parameters và service definitions là một phần của infrastructure-as-code hoặc documented procedures.

Restoration drills:

- periodically restore RDS tới một test instance,
- verify PayloadCMS có thể connect và data nhất quán.

---

## Updating services

Để deploy versions mới của LegoCity components:

1. Build và push images mới tới ECR.
2. Update ECS task definitions để reference image tags mới.
3. Deploy task definitions mới tới corresponding services:
   - qua ECS rolling update,
   - hoặc sử dụng deployment pipelines.

Thứ tự updates:

- update non-critical components trước (dashboard),
- sau đó proxy và update servers,
- cuối cùng broker và PayloadCMS (trong một maintenance window nếu schema changes).

Đảm bảo:

- backward compatibility khi có thể,
- rằng configuration (SSM parameters) matches expected schema của versions mới.

---

## Cost và resource considerations

Rough cost drivers trên AWS:

- ECS tasks (CPU/memory) cho broker, PayloadCMS, proxy, dashboard và update servers,
- RDS instance size và storage,
- ALB và data transfer,
- S3 và CloudFront (nếu sử dụng),
- NAT gateway (có thể non-trivial cho low-traffic deployments).

Để control costs:

- start với small Fargate task sizes (ví dụ 0.25 vCPU / 0.5–1 GB RAM),
- choose một small RDS instance cho dev và một moderate one cho prod,
- scale task counts và sizes khi usage grows,
- consider turning off non-essential update servers trong dev khi không sử dụng.

---

## Tóm tắt

- Trên AWS, các components của LegoCity ánh xạ cleanly tới ECS/EKS, RDS, ALB, S3/CloudFront và các supporting services như SSM và CloudWatch.
- Một minimal architecture sử dụng một ECS cluster trong một VPC, RDS cho PayloadCMS, Fargate services cho broker, PayloadCMS, proxy, dashboard, và update servers, cộng một ALB cho ingress.
- Configuration và secrets nên được stored trong SSM Parameter Store hoặc Secrets Manager và injected vào ECS tasks at runtime.
- Một staged deployment (dev + prod) với các SSM prefixes và ECS services riêng biệt giúp control changes và risk.
- Maintenance requires regular monitoring (CloudWatch), backups (RDS snapshots, broker storage), và controlled rolling updates qua ECS.
