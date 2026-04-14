# Part 3: Backend Microservices Deep Dive

## 1. Domain Organization

The backend system implements **Domain-Driven Design (DDD)**. Across all 6 microservices, project structures generally conform to a standard Clean Architecture / Onion Architecture paradigm comprising four primary layers:
1. **API / Presentation Layer:** Contains controllers filtering HTTP transit and MediatR configuration. 
2. **Application Layer:** Contains MediatR Commands/Queries, Validators (FluentValidation), ViewModels/DTOs, and application logic.
3. **Domain Layer:** Contains core business entities (Aggregates), Value Objects, Enums, and Repository abstractions.
4. **Infrastructure Layer:** Houses Entity Framework Core DbContexts, raw Data Access, RabbitMQ Consumers, external SMTP or Razorpay integrations.

## 2. Identity Service
**Port: 5002** | **Database:** `CocaCola_IdentityDb` 

**Responsibility:** The exclusive holder of user credentials, authentication logic, and dealer lifecycle. 
- **Roles Implemented:** SuperAdmin (platform owner), Dealer (business customer).
- **Core Feature:** Dealers register through a Magic Link/OTP workflow. New accounts start as `PendingApproval`. SuperAdmins use the `ApproveDealerCommand` to escalate them to an active state. 
- **Token Handling:** Implements JWT Bearer authentication issuing tokens containing User IDs and Roles, granting authorization downstream.

## 3. Catalog Service
**Port: 5004** | **Database:** `CocaCola_CatalogDb`

**Responsibility:** Manages all Coca-Cola product SKUs, pricing structures, and inventory details available for wholesale.
- **Data Caching:** Product retrieval requests (`GET /api/catalog/items`) aggressively utilize **Redis**. Catalog updates (e.g., changing the price of Diet Coke) emit cache-invalidation commands.
- **Inventory Check:** Exposes internal endpoints requested strictly by the Order service to validate if an intended cart quantity exceeds actual physical stock before locking in a purchase.

## 4. Order Service
**Port: 5006** | **Database:** `CocaCola_OrderDb`

**Responsibility:** Manages cart construction, order origination, and the central Order State Machine.
- **State Machine Transitions:** `Created` -> `AwaitingPayment` -> `Paid` -> `ReadyForDispatch` -> `Assigned` -> `InTransit` -> `Delivered`.
- **Saga Participation:** Upon order completion at checkout, an order is locked in as `Created` and immediately transitioned to `AwaitingPayment`. It stays here until RabbitMQ issues an event from the Payment Service confirming funding.

## 5. Payment Service
**Port: 5010** | **Database:** `CocaCola_PaymentDb`

**Responsibility:** Interfaces with external financial gateways (specifically Razorpay).
- **Flow:** When a dealer finishes checking out, the Payment service issues a Razorpay `Order_Id`. The frontend executes the payment. 
- **Webhook Subsystem:** Securely captures Razorpay webhooks (`payment.captured`). Validates HMAC signatures sequentially, and upon verification, emits the `PaymentCompletedIntegrationEvent` to the RabbitMQ bus. 
- **Resilience:** Integrates Polly retry policies (WaitAndRetry) in case the Order Service cannot be reached to acknowledge successful payments immediately.

## 6. Logistics Service
**Port: 5008** | **Database:** `CocaCola_LogisticsDb`

**Responsibility:** Manages delivery fleets, tracks location, handles geographical dispatch logistics, and updates the final order state to `Delivered`.
- **Event Hook:** Listens to `OrderReadyForDispatchEvent` (triggered after payment).
- **Agent Assignment:** Handles the pooling of delivery drivers. An internal mechanism connects available agents to pending shipments. 
- **Background Jobs:** Utilizes **Hangfire** dashboards linked to SQL Server storage to enqueue and retry unassigned logistic queues until an agent takes the dispatch ticket.

## 7. Notification Service
**Port: 5012** | **Database:** `CocaCola_NotificationDb`

**Responsibility:** Fully decoupled alert engine. 
- **Event Consuming:** Subscribes blindly to a myriad of events across the mesh: `DealerApprovedIntegrationEvent`, `OrderConfirmedIntegrationEvent`, `DeliveryDispatchedIntegrationEvent`.
- **Infrastructure:** Maps event payloads to rich HTML templates and drops them into a `SmtpClient` queue targeting Gmail. 

---

### Internal Communication (Gateway & Proxies)
Direct internal synchronous communication (where absolutely critical, e.g. Payment querying Order details) is routed via `IHttpClientFactory` typed clients resolving service names dictated by Docker Compose network bridges (e.g., `http://order-service:8080`). However, state mutations explicitly enforce pure asynchronous Pub/Sub communication to prevent cyclic HTTP timeouts.
