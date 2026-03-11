# 💎 Jewellery Inventory & POS System

A high-performance, SaaS-grade Inventory Management and Billing System specifically designed for jewellery retail stores. Built with **barcode support**, **native printing integration**, and **real-time metal rate tracking**.

![Version](https://img.shields.io/badge/version-1.0.0-gold)
![Tech Stack](https://img.shields.io/badge/stack-Next.js%20|%20Node.js%20|%20Electron%20|%20Prisma-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🚀 Overview

This system provides a seamless bridge between a cloud-ready API and a native desktop experience. It handles the complete lifecycle of jewellery items—from stock entry and barcode generation to point-of-sale billing and returns.

### Core Architecture
- **Monorepo**: Managed with NPM Workspaces.
- **Backend**: Express.js API with Prisma ORM (SQLite/PostgreSQL).
- **Frontend**: Next.js Web App with a premium, jewellery-themed design system.
- **Desktop Shell**: Electron wrapper for hardware (printers/scanners) integration.

---

## ✨ Features

### 🛒 Point of Sale (POS)
- **Rapid Scanning**: Automatic input focus for zero-click barcode scanning.
- **Smart Cart**: Real-time tax calculation, multi-level discounts, and SKU validation.
- **Multi-Payment**: Support for Cash, Card, UPI, and Store Credit.
- **Instant Receipts**: Formatted for 80mm thermal printers with native Electron bypass.

### 📦 Inventory & Barcoding
- **Unique Tagging**: Automatic Code-128 barcode generation for every jewellery item.
- **Jewellery Specifics**: Track Metal Type (Gold/Silver/Platinum), Purity, Weight (grams), and Making Charges.
- **Tag Printing**: Specialized 50x25mm label templates for jewellery tags.
- **Low Stock Alerts**: Visual notifications for items below safety thresholds.

### ↪️ Returns & Refunds
- **Partial Returns**: Process returns for specific items within a bulk invoice.
- **Inventory Restoration**: Auto-adds returned items back to stock.
- **Refund Tracking**: Historical records of all refund transactions.

### 📈 Business Intelligence
- **Live Dashboards**: Today's revenue, order counts, and metal rate snapshots.
- **Comprehensive Reports**: Sales by category, profit margins, and inventory value audits.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (Frontend) & [Electron](https://www.electronjs.org/) (Desktop)
- **Server**: [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/)
- **Database**: [Prisma](https://www.prisma.io/) with [SQLite](https://www.sqlite.org/) (easily switchable to PostgreSQL)
- **Styling**: Vanilla CSS with a custom Design System
- **Generators**: [bwip-js](https://github.com/metafloor/bwip-js) for Barcode generation

---

## ⚙️ Setup & Installation

### 1. Clone & Install
```bash
git clone https://github.com/Zainn09/Inventory-Management-system.git
cd jewellery-pos
npm install
```

### 2. Database Initialization
```bash
# Push schema and generate Prisma client
npm run db:push

# Seed initial data (categories, products, and users)
npm run db:seed
```

### 3. Running Development Servers
You can run all components simultaneously:
```bash
# Start API & Web Frontend
npm run dev

# Start Electron Desktop App (while dev is running)
npm run dev:desktop
```

---

## 🔐 Default Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@jewellerypos.com` | `admin123` |
| **Manager** | `manager@jewellerypos.com` | `manager123` |
| **Cashier** | `cashier@jewellerypos.com` | `cashier123` |

---

## 📁 Project Structure

```text
├── apps/
│   ├── api/          # Express.js Server
│   ├── web/          # Next.js Application
│   └── desktop/      # Electron Shell
├── packages/
│   └── shared/       # Shared constants and permissions
└── prisma/           # Database schema and seed scripts
```

---

## 📜 License
This project is licensed under the MIT License.

Developed with ❤️ for Jewellery Retail Excellence.
