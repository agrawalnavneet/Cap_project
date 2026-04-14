# Coca-Cola B2B Supply Platform

An enterprise-grade B2B wholesale distribution platform built for Coca-Cola India's dealer and logistics network.

## Architecture

```
┌─────────────────────────────────────────────────┐
│          Angular 21 Frontend (Cococola.ui)       │
│          Coca-Cola Red (#F40009) + Gold (#D4A017)│
└────────────────────┬────────────────────────────┘
                     │ HTTPS / WebSockets
┌────────────────────▼────────────────────────────┐
│            API Gateway (Ocelot)                  │
│            JWT Bearer Authentication             │
└──┬──────────┬──────────┬──────────┬─────────────┘
   │          │          │          │
┌──▼──┐  ┌───▼──┐  ┌────▼──┐  ┌───▼────────┐
│Identity│ │Catalog│ │Order  │ │Notification│
│Service │ │Service│ │Service│ │  Service   │
└──────┘  └──────┘  └───────┘  └────────────┘
   │          │          │
┌──▼──────────▼──────────▼──┐  ┌────────────┐
│        SQL Server          │  │  RabbitMQ  │
│  CocaCola_Auth             │  │  Redis     │
│  CocaCola_CatalogDb        │  └────────────┘
│  CocaCola_LogisticsDb      │
│  CocaCola_PaymentDb        │
│  CocaCola_NotificationDb   │
└────────────────────────────┘
```

## Portals

| Portal | Path | Role |
|--------|------|------|
| **Dealer Portal** | `/dealer/*` | Licensed retail distributors |
| **Admin Portal** | `/admin/*` | Coca-Cola regional admins |
| **Logistics Portal** | `/logistics/*` | Fleet & dispatch managers |
| **Agent Portal** | `/agent/*` | Delivery agents |
| **Super Admin** | `/super-admin/*` | Global platform managers |

## Features

- 🛒 **Smart Cart** — Quantity management, GST calculation, Razorpay checkout
- 📦 **Order Lifecycle** — Placed → Processing → In-Transit → Delivered
- 🚛 **Live Tracking** — Real-time shipment tracking via SignalR
- 📊 **Admin Dashboard** — Sales analytics, dealer approvals, inventory alerts
- 📧 **Branded Emails** — Coca-Cola themed transactional emails
- 🔐 **Role-Based Auth** — JWT + refresh tokens, OTP verification
- 📄 **GST Invoices** — Auto-generated PDF invoices

## Running Locally

### Backend (Docker)
```bash
cd " Backend/EnterpriseB2BSupplyChain"
docker-compose up --build
```

### Frontend
```bash
cd "Frontend/Cococola.ui"
npm install
npm run dev
```

## Tech Stack

**Frontend:** Angular 21, NgRx, SCSS, Lucide Icons  
**Backend:** .NET 10, ASP.NET Core, EF Core, SignalR  
**Database:** SQL Server 2022  
**Messaging:** RabbitMQ, Redis  
**Payments:** Razorpay  
**Auth:** JWT + Cookie refresh tokens  

---

*Coca-Cola B2B Supply Platform — Enterprise Distribution Network*
