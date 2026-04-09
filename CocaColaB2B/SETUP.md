# CocaCola B2B — Setup & Run Guide

## Prerequisites
- Docker Desktop (for Docker run)
- .NET 10 SDK (for local run)
- Node.js 22+ (for local frontend)

---

## 1. Docker (Recommended)

```bash
cd CocaColaB2B/Backend

# Copy and fill in your environment variables
cp .env.example .env
# Edit .env with your Razorpay keys (optional — mock mode works without real keys)

# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

**Access:**
- Frontend: http://localhost:4200
- Gateway API: http://localhost:5010
- RabbitMQ Management: http://localhost:15672 (guest/guest)
- SQL Server: localhost:1433 (sa / Agarwal@15)

**Default login:** `admin@cocacola.com` / `admin123`

---

## 2. Local Run (Without Docker)

### Prerequisites
- SQL Server running locally (or use Docker just for infra)
- Redis running locally
- RabbitMQ running locally

### Start infrastructure only
```bash
cd CocaColaB2B/Backend
docker-compose up sqlserver rabbitmq redis -d
```

### Update connection strings
Edit each service's `appsettings.Development.json` to point to `localhost` instead of Docker hostnames.

### Run each service
```bash
# Terminal 1 — Auth Service
cd CocaColaB2B/Backend/Services/AuthService/AuthService.API
dotnet run

# Terminal 2 — Product Service
cd CocaColaB2B/Backend/Services/ProductService/ProductService.API
dotnet run

# Terminal 3 — Order Service
cd CocaColaB2B/Backend/Services/OrderService/OrderService.API
dotnet run

# Terminal 4 — Inventory Service
cd CocaColaB2B/Backend/Services/InventoryService/InventoryService.API
dotnet run

# Terminal 5 — Payment Service
cd CocaColaB2B/Backend/Services/PaymentService/PaymentService.API
dotnet run

# Terminal 6 — Notification Service
cd CocaColaB2B/Backend/Services/NotificationService/NotificationService.API
dotnet run

# Terminal 7 — Delivery Service
cd CocaColaB2B/Backend/Services/DeliveryService/DeliveryService.API
dotnet run

# Terminal 8 — Gateway
cd CocaColaB2B/Backend/Gateway
dotnet run

# Terminal 9 — Frontend
cd CocaColaB2B/Frontend/CocaColaB2B.UI
npm install
ng serve
```

---

## 3. Razorpay Configuration

### Test Mode (default)
No configuration needed. The app uses mock Razorpay orders that auto-verify.

### Real Razorpay Keys
1. Get keys from https://dashboard.razorpay.com
2. **Docker:** Set in `.env` file:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxx
   RAZORPAY_KEY_SECRET=your_secret
   ```
3. **Frontend:** Update `src/environments/environment.ts`:
   ```ts
   razorpayKeyId: 'rzp_test_xxxx'
   ```
4. **Production frontend:** Update `src/environments/environment.prod.ts`

---

## 4. Email (OTP) Configuration

Edit `AuthService.API/appsettings.json`:
```json
"EmailSettings": {
  "SmtpServer": "smtp.gmail.com",
  "Port": 587,
  "SenderEmail": "your-email@gmail.com",
  "SenderName": "CocaCola B2B",
  "AppPassword": "your-gmail-app-password"
}
```

To get a Gmail App Password: Google Account → Security → 2-Step Verification → App passwords

---

## 5. User Roles

| Role | Access |
|------|--------|
| Admin | Full access — products, orders, users, inventory |
| Wholesaler | Catalog, cart, orders, payment |
| WarehouseManager | Order management, inventory, driver management |
| Driver | Delivery assignments |

**Create users:** Admin can create WarehouseManager and Driver accounts from the Users panel.
**Wholesaler registration:** Self-service via the Register form (requires GSTIN + enterprise name).

---

## 6. Architecture

```
Frontend (Angular 21) → nginx → Gateway (Ocelot :5010)
                                    ↓
              ┌─────────────────────┼─────────────────────┐
         AuthService          ProductService         OrderService
           (:5301)              (:5302)               (:5303)
                                                          ↓ SignalR
         InventoryService    NotificationService    DeliveryService
           (:5304)              (:5305)               (:5306)
                                                    PaymentService
                                                      (:5307)
              └──────────── RabbitMQ ──────────────────┘
```
