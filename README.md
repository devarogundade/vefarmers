
# 🌾 VeFarmers

**Advancing UN SDG 2: End hunger, achieve food security, and promote sustainable agriculture through community-backed lending on VeChain.**

---

## 🚀 Overview

**VeFarmers** is a community-backed micro-lending platform that empowers local and small-scale farmers with fair and transparent access to loans. Built on **VeChain**, it enables community members to pledge **VET** in support of farmers, who can then access funds for seeds, labour, equipment, or land through integrated on/off ramps.

Pledgers earn **B3TR** token rewards based on the amount and duration of their VET pledge:

> **Reward = VET pledged × time elapsed ÷ reward rate**

The platform directly supports **UN SDG 2** by promoting food security, reducing reliance on centralized agribusiness, and strengthening local farming economies.

---

## 🧩 Tech Stack

* **Frontend:** React + Vite + TailwindCSS
* **Backend:** Node.js + Express
* **Smart Contracts:** Solidity + Hardhat (VeChain compatible)
* **Payments:** Paystack integration for fiat on/off ramp
* **Database:** Firebase
* **AI Layer:** FarmTrust Score engine (AI credit assessment and yield insights)

---

## ⚙️ Environment Setup

Create a `.env` file in the project root with the following variables:

```env
# Backend Configuration
PORT=
PAYSTACK_SK_KEY=
ADMIN_PRIVATE_KEY=
ADMIN_ADDRESS=

# Frontend Configuration
VITE_API_URL=
VITE_DELEGATOR_URL=
VITE_PAYSTACK_SK_KEY=
VITE_PAYSTACK_PK_KEY=

VITE_FB_API_KEY=
VITE_FB_AUTH_DOMAIN=
VITE_FB_PROJECT_ID=
VITE_FB_STORAGE_BUCKET=
VITE_FB_MESSAGING_SENDER_ID=
VITE_FB_APP_ID=
VITE_FB_MEASUREMENT_ID=

# WalletConnect Project ID
VITE_WALLET_CONNECT_PROJECT_ID=

# Deployment Configuration
VECHAIN_PRIVATE_KEY=

# VeBetterDAO Testnet Addresses (DO NOT MODIFY)
X2EARN_REWARDS_POOL=0x5F8f86B8D0Fa93cdaE20936d150175dF0205fB38
X2EARN_APPS=0xcB23Eb1bBD5c07553795b9538b1061D0f4ABA153
B3TR_TOKEN=0xbf64cf86894Ee0877C4e7d03936e35Ee8D8b864F
B3TR_FAUCET=0x5e9c1F0f52aC6b5004122059053b00017EAfB561

# Your VeBetterDAO App ID (obtain after registration)
VEBETTERDAO_APP_ID=
```

---

## 🛠️ Installation

Clone the repository and install dependencies:

```bash
npm install
# or
npm install --force
```

---

## 💻 Frontend

Start the development server:

```bash
npm run dev
```

Then visit:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🌐 Backend

Build and run the server:

```bash
npm run build:server
```

API will be available at:
👉 **[http://localhost:3001/api](http://localhost:3001/api)**

---

## 🔗 Smart Contracts

Build and deploy contracts to VeChain testnet:

```bash
npm run build:contract
npm run deploy:test
```

---

## 🧠 AI Features

* **FarmTrust Score:** AI-based farmer credit scoring using historical data, community reviews, and yield records.
* **AI Insights:** Recommends optimal planting seasons, resource allocation, and repayment plans.

---

## 🤝 Contribution

Pull requests and contributions are welcome.
Before contributing, please ensure all environment variables and test accounts are properly configured.

---

## 🪙 License

UnLicense © 2025 VeFarmers Project Team
