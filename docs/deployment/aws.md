# AWS deployment

This page describes a practical way to deploy LegoCity on **AWS** using managed services.

It focuses on:

- mapping LegoCity components to AWS services,
- a minimal but realistic architecture (dev + prod),
- concrete steps to get a working deployment,
- basic maintenance: updates, monitoring, backups.

It is not a full Terraform/CloudFormation template, but it should be detailed enough for an engineer familiar with AWS basics to implement.

---

## When to use AWS

An AWS-based deployment is a good fit when:

- the organisation already uses AWS,
- uptime and scalability requirements are higher than “one VM with Docker”,
- managed databases and monitoring are preferred over self-hosted.

It may be overkill when:

- you only need a short-lived prototype,
- you do not have access to an AWS account or basic AWS skills.

---

## Component → AWS service mapping

A typical mapping from LegoCity components to AWS looks like this:

- **Context broker**  
  - Run as a container on:
    - AWS ECS (Fargate or EC2 launch type), or
    - EKS (Kubernetes) if you already have it.
  - Storage on:
    - EBS volume or
    - S3 (if the broker supports it) or
    - internal DB, depending on broker implementation.

- **PayloadCMS**  
  - Run as a container on ECS/EKS.
  - Database on:
    - Amazon RDS (PostgreSQL or MySQL) or
    - Amazon DocumentDB / Mongo-compatible service.

- **Proxy / API layer**  
  - Run as a container on ECS/EKS.
  - Optionally fronted by:
    - Application Load Balancer (ALB) or
    - API Gateway + Lambda if rewritten.

- **Dashboard (Next.js + Mapbox)**  
  Options:
  - build as static assets and host on:
    - S3 + CloudFront,  
    OR
  - run as a container on ECS/EKS behind ALB if you need server-side rendering.

- **Update servers**  
  - Run as:
    - ECS services (long-running tasks), or
    - ECS scheduled tasks (cron-like), or
    - Lambda functions (if implemented serverless).

- **Networking & ingress**
  - VPC with public and private subnets,
  - ALB in public subnets routing to ECS services in private subnets,
  - security groups controlling traffic.

- **Configuration & secrets**
  - AWS Systems Manager Parameter Store or Secrets Manager for:
    - broker write keys,
    - DB credentials,
    - external API keys.

- **Monitoring & logs**
  - CloudWatch Logs for container logs,
  - CloudWatch metrics and alarms.

---

## Environments: dev and prod

At a minimum, you should define:

- a **development** environment:
  - smaller ECS services,
  - smaller RDS instance,
  - restricted access (only internal users),
  - used to test new blocks, map views and update servers.

- a **production** environment:
  - scaled versions of the same components,
  - stricter access controls,
  - visible to end users.

You can implement this by:

- separate AWS accounts (preferred in larger orgs), or
- separate VPCs and ECS clusters within the same account, or
- at least separate ECS services, RDS instances and Parameter Store paths with prefixes (e.g. `/legocity/dev/...` vs `/legocity/prod/...`).

This documentation assumes separate **dev** and **prod** ECS services and RDS instances inside the same account, with configuration separated by Parameter Store prefixes.

---

## Container images and registries

All LegoCity components that run as containers need images:

- broker image (official or custom),
- PayloadCMS image,
- proxy image,
- dashboard image (if not purely static),
- update server images.

Workflow:

1. Build images locally or in CI.
2. Push images to **Amazon ECR** (Elastic Container Registry).
3. Configure ECS services to use these images by tag.

Recommended patterns:

- use separate ECR repositories per service:
  - `legocity-broker`,
  - `legocity-payload`,
  - `legocity-proxy`,
  - `legocity-dashboard`,
  - `legocity-update-env`, etc.
- use semantic tags or at least:
  - `dev-<short-sha>` for dev,
  - `prod-<short-sha>` for prod.

---

## Network and VPC layout

A common minimal network layout:

- one VPC with:
  - public subnets (for ALB),
  - private subnets (for ECS tasks and RDS).

Components:

- **ALB** in public subnets:
  - receives HTTPS traffic from the internet,
  - terminates TLS (ACM certificates),
  - forwards to ECS target groups.

- **ECS services** in private subnets:
  - broker (for internal access only),
  - proxy,
  - PayloadCMS,
  - Next.js (if SSR),
  - update servers.

- **RDS** in private subnets:
  - only accessible from ECS tasks via security groups.

Security groups:

- one SG for ALB (ingress 80/443 from internet),
- one SG for ECS tasks (ingress from ALB SG and from other internal SGs),
- one SG for RDS (ingress from ECS SG only),
- optional SGs for broker if you want to restrict which ECS services can call it.

---

## Minimal architecture pattern

For a minimal but structured setup:

- **ECS Cluster: `legocity-cluster`**
  - runs all services as ECS services with Fargate.

- **Services:**
  - `legocity-broker-service` (Fargate, private subnets, no public IP),
  - `legocity-payload-service` (Fargate, private, behind ALB),
  - `legocity-proxy-service` (Fargate, private, behind ALB),
  - `legocity-dashboard-service` (Fargate, private, behind ALB)  
    (skip if you host dashboard on S3+CloudFront),
  - `legocity-update-env-service` (Fargate, private, no ALB, long-running / scheduled).

- **RDS:**
  - `legocity-payload-db` – PostgreSQL or MySQL,
  - security group only allowing connections from ECS tasks.

- **ALB:**
  - listeners on 80/443, redirect 80 → 443,
  - target groups:
    - `/admin` → PayloadCMS,
    - `/api` → proxy,
    - `/` → dashboard.

- **S3 + CloudFront (optional but recommended for Next.js static build):**
  - S3 bucket for static assets,
  - CloudFront distribution fronting the bucket,
  - API requests routed to ALB.

---

## Configuration and secrets on AWS

Use **SSM Parameter Store** or **Secrets Manager** for configuration, not hard-coded environment variables in the ECS task definitions.

Examples of Parameter Store paths:

- `/legocity/dev/broker/url`
- `/legocity/dev/broker/write-key/env`
- `/legocity/dev/payload/db-url`
- `/legocity/dev/external/weather/api-key`

- `/legocity/prod/broker/url`
- `/legocity/prod/broker/write-key/env`
- `/legocity/prod/payload/db-url`
- `/legocity/prod/external/weather/api-key`

Each ECS task:

- obtains its config at runtime via environment variables,
- environment values can be pulled from SSM parameters by name.

Basic pattern:

- TASK_DEF env:
  - `BROKER_URL` ← SSM `/legocity/prod/broker/url`
  - `BROKER_WRITE_KEY` ← SSM `/legocity/prod/broker/write-key/env`
  - `PAYLOAD_DB_URL` ← SSM `/legocity/prod/payload/db-url`
  - `WEATHER_API_KEY` ← SSM `/legocity/prod/external/weather/api-key`

Grant ECS task role permission to read the specific parameter paths required.

---

## Step-by-step skeleton: first production-like deployment

This is a **skeleton sequence** for setting up a first production-like environment. Details depend on your chosen tools (console vs IaC), nhưng thứ tự cần rõ ràng.

### 1. Prepare VPC and networking

- Create a VPC (or reuse an existing one) with:
  - at least two public subnets (in different AZs),
  - at least two private subnets (in different AZs),
  - an Internet Gateway,
  - NAT Gateway(s) for private subnets (so ECS tasks can fetch images, call external APIs).

- Create security groups:
  - `sg-alb`:
    - ingress: 80/443 from internet,
    - egress: to ECS SG.
  - `sg-ecs`:
    - ingress: from `sg-alb` on app ports,
    - ingress: from itself if services call each other,
    - egress: to `sg-rds`, internet via NAT.
  - `sg-rds`:
    - ingress: from `sg-ecs` on DB port (e.g. 5432).

### 2. Create RDS for PayloadCMS

- Choose engine: PostgreSQL or MySQL.
- Deploy `legocity-payload-db` into private subnets with `sg-rds`.
- Configure:
  - DB name, user, password,
  - backup retention, automated backups.
- Ensure ECS tasks can resolve and connect via DB endpoint.

### 3. Create ECR repositories and push images

For each component:

- create an ECR repo (e.g. `legocity-payload`),
- build image and push:
  - `dev` tag for dev,
  - `prod` tag for prod.

Do this for:

- broker,
- PayloadCMS,
- proxy,
- dashboard (if container-based),
- at least one update server.

### 4. Configure SSM parameters for configuration

Create parameters for prod environment:

- `/legocity/prod/broker/url`
- `/legocity/prod/broker/write-key/env`
- `/legocity/prod/payload/db-url`
- `/legocity/prod/external/weather/api-key`
- any others needed by proxy and update servers.

Store sensitive values as **SecureString**.

### 5. Create ECS cluster and task definitions

- Create `legocity-cluster`.
- For each service, define a task definition:
  - container image from ECR,
  - CPU/memory limits,
  - environment variables referencing SSM parameters,
  - logging to CloudWatch Logs,
  - port mappings.

Services:

- `broker-task` / `broker-service`:
  - desired count: 1 (to start),
  - private subnets, `sg-ecs`,
  - no public IP,
  - no ALB (internal only).

- `payload-task` / `payload-service`:
  - desired count: 1,
  - private subnets, `sg-ecs`,
  - ALB target group (HTTP port, e.g. 3000).

- `proxy-task` / `proxy-service`:
  - similar to payload, with ALB target group (HTTP port, e.g. 4000).

- `dashboard-task` / `dashboard-service` (if container-based):
  - ALB target group (HTTP port, e.g. 3001).

- `update-env-task` / `update-env-service`:
  - no ALB,
  - private subnets, `sg-ecs`,
  - `desiredCount = 1` (long-running) or scheduled task.

### 6. Create and configure Application Load Balancer

- Create an ALB in public subnets with `sg-alb`.
- Create target groups:
  - `tg-payload` → ECS tasks (payload),
  - `tg-proxy` → ECS tasks (proxy),
  - `tg-dashboard` → ECS tasks (dashboard) if applicable.

- Configure listeners:
  - HTTP (80) → redirect to HTTPS (443),
  - HTTPS (443):
    - path `/admin*` → `tg-payload`,
    - path `/api*` → `tg-proxy`,
    - path `/` → `tg-dashboard` (or CloudFront if using static hosting).

- Attach an ACM certificate for your domain(s).

### 7. DNS and domains

Use Route 53 (or another DNS provider) to:

- point `city.example` or `dashboard.city.example` to the ALB,
- point `admin.city.example` to the same ALB if you want a separate host for PayloadCMS admin.

Check:

- HTTP(S) routing,
- TLS configuration,
- that PayloadCMS and the dashboard load correctly.

### 8. Verify data flow

After services are running:

- confirm broker health:
  - from an ECS task or a bastion host, call the broker’s NGSI-LD endpoint.

- confirm PayloadCMS connects to RDS:
  - complete any initial admin setup,
  - log in to the admin UI.

- confirm update servers write entities:
  - check update server logs in CloudWatch,
  - query broker for `WeatherObserved` or other entities.

- confirm proxy returns data:
  - call `/api/...` endpoints through ALB,
  - check that the responses reflect entities in the broker.

- confirm dashboard shows data:
  - open the dashboard URL,
  - check map layers and widgets for live entities.

---

## Monitoring and logging

Use **CloudWatch Logs** and **CloudWatch metrics**:

- send logs from ECS tasks to CloudWatch Log Groups:
  - one log group per service is usually sufficient.

- define CloudWatch alarms for:
  - ECS service not reaching desired count,
  - high CPU/memory usage,
  - RDS storage or CPU thresholds,
  - broker or proxy health check failures.

Optional:

- integrate with email/Slack/other via SNS for alerts,
- use AWS X-Ray or similar for deeper request tracing if necessary.

---

## Backups and restoration

Primary stateful components:

- **RDS (PayloadCMS DB)**:
  - configure automatic backups,
  - enable point-in-time recovery if needed,
  - create manual snapshots before major changes.

- **Broker storage**:
  - if the broker keeps state on disk:
    - use EBS snapshots,
    - or export entities periodically.

- **Configuration**:
  - SSM parameters and service definitions are part of infrastructure-as-code or documented procedures.

Restoration drills:

- periodically restore RDS to a test instance,
- verify PayloadCMS can connect and data is consistent.

---

## Updating services

To deploy new versions of LegoCity components:

1. Build and push new images to ECR.
2. Update ECS task definitions to reference new image tags.
3. Deploy new task definitions to the corresponding services:
   - via ECS rolling update,
   - or using deployment pipelines.

Order of updates:

- update non-critical components first (dashboard),
- then proxy and update servers,
- finally broker and PayloadCMS (during a maintenance window if schema changes).

Ensure:

- backward compatibility where possible,
- that configuration (SSM parameters) matches the expected schema of new versions.

---

## Cost and resource considerations

Rough cost drivers on AWS:

- ECS tasks (CPU/memory) for broker, PayloadCMS, proxy, dashboard and update servers,
- RDS instance size and storage,
- ALB and data transfer,
- S3 and CloudFront (if used),
- NAT gateway (can be non-trivial for low-traffic deployments).

To control costs:

- start with small Fargate task sizes (for example 0.25 vCPU / 0.5–1 GB RAM),
- choose a small RDS instance for dev and a moderate one for prod,
- scale task counts and sizes when usage grows,
- consider turning off non-essential update servers in dev when not in use.

---

## Summary

- On AWS, LegoCity components map cleanly to ECS/EKS, RDS, ALB, S3/CloudFront and supporting services like SSM and CloudWatch.
- A minimal architecture uses an ECS cluster in a VPC, RDS for PayloadCMS, Fargate services for broker, PayloadCMS, proxy, dashboard, and update servers, plus an ALB for ingress.
- Configuration and secrets should be stored in SSM Parameter Store or Secrets Manager and injected into ECS tasks at runtime.
- A staged deployment (dev + prod) with separate SSM prefixes and ECS services helps control changes and risk.
- Maintenance requires regular monitoring (CloudWatch), backups (RDS snapshots, broker storage), and controlled rolling updates via ECS.
