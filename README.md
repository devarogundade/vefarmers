
# 🌾 VeFarmers

**Advancing UN SDG 2: End hunger, achieve food security, and promote sustainable agriculture through community-backed lending on VeChain.**

---

## 🚀 Overview

**VeFarmers** is a community-backed micro-lending platform that empowers local and small-scale farmers with fair and transparent access to loans. Built on **VeChain**, it enables community members to pledge **VET** in support of farmers, who can then access funds for seeds, labour, equipment, or land through integrated on/off ramps.

Pledgers earn **B3TR** token rewards based on the amount and duration of their VET pledge:

> **Reward = VET pledged × time elapsed ÷ reward rate**

The platform directly supports **UN SDG 2** by promoting food security, reducing reliance on centralized agribusiness, and strengthening local farming economies.

---

Here’s a well-structured **README documentation** for your `LendingPoolInterface` contract functions — clear, professional, and formatted for GitHub or docs pages 👇

---

# 🧩 LendingPool

The `LendingPool` defines the core functionality for a **community-backed agricultural lending protocol**.
It enables **liquidity providers (LPs)** to supply and withdraw funds, while **farmers** can borrow and repay loans using a transparent, verifiable on-chain model.

This interface serves as the foundation for smart contracts that power community-driven micro-lending, designed for small-scale farmers.

---

## 📜 Events

### `Supplied(address indexed lp, uint256 amount, uint256 lpMinted)`

Emitted when a liquidity provider supplies funds to the pool.

| Parameter  | Description                                                    |
| ---------- | -------------------------------------------------------------- |
| `lp`       | Address of the liquidity provider.                             |
| `amount`   | Amount of tokens supplied.                                     |
| `lpMinted` | Amount of LP tokens minted to represent the user’s pool share. |

---

### `Withdrawn(address indexed lp, uint256 amount, uint256 lpBurned)`

Emitted when an LP withdraws their funds.

| Parameter  | Description                               |
| ---------- | ----------------------------------------- |
| `lp`       | Address of the withdrawing LP.            |
| `amount`   | Amount of tokens withdrawn.               |
| `lpBurned` | LP tokens burned from the user’s balance. |

---

### `Borrowed(address indexed farmer, uint256 amount, uint256 newPrincipal)`

Emitted when a farmer borrows from the pool.

| Parameter      | Description                              |
| -------------- | ---------------------------------------- |
| `farmer`       | Borrower address.                        |
| `amount`       | Amount borrowed.                         |
| `newPrincipal` | Updated total principal after borrowing. |

---

### `Repaid(address indexed farmer, uint256 amount, uint256 remainingPrincipal, uint256 interestPaid)`

Emitted when a farmer repays a loan.

| Parameter            | Description                               |
| -------------------- | ----------------------------------------- |
| `farmer`             | Address of the borrower.                  |
| `amount`             | Amount repaid.                            |
| `remainingPrincipal` | Outstanding debt after repayment.         |
| `interestPaid`       | Portion of repayment counted as interest. |

---

## ⚙️ Functions

### `supply(uint256 amount, address behalfOf)`

Supplies liquidity to the pool on behalf of an address.
Mints LP tokens representing ownership share.

**Parameters**

* `amount`: Amount of tokens to supply.
* `behalfOf`: Address that receives LP tokens.

---

### `withdraw(uint256 amount)`

Withdraws tokens from the pool and burns LP tokens.

**Parameters**

* `amount`: Amount to withdraw.

---

### `withdrawable(address account) → uint256`

Returns the maximum amount that can be withdrawn by an LP.

**Parameters**

* `account`: Address of the LP.

**Returns**

* Amount withdrawable.

---

### `outstanding(address farmer) → uint256`

Returns the total outstanding principal of a farmer’s loan.

**Parameters**

* `farmer`: Farmer address.

**Returns**

* Outstanding loan amount.

---

### `borrow(uint256 amount) → bool`

Allows a farmer to borrow from the pool.

**Parameters**

* `amount`: Amount requested.

**Returns**

* `true` if successful.

---

### `borrowWithPermit(uint256 amount, address farmer, uint256 deadline, uint8 v, bytes32 r, bytes32 s) → bool`

Borrows using an ERC-20 permit signature for gasless approval.

**Parameters**

* `amount`: Borrow amount.
* `farmer`: Borrower address.
* `deadline`: Signature validity deadline.
* `v, r, s`: Signature components.

**Returns**

* `true` if borrow succeeds.

---

### `borrowable(address farmer) → uint256`

Returns how much the farmer can currently borrow based on LTV ratio.

**Parameters**

* `farmer`: Farmer address.

**Returns**

* Maximum borrowable amount.

---

### `repay(uint256 amount, address behalfOf) → uint256`

Repays part or all of a farmer’s outstanding loan.

**Parameters**

* `amount`: Amount being repaid.
* `behalfOf`: Address whose debt is reduced.

**Returns**

* Amount of interest paid.

---

### `ltvBps(address farmer) → uint256`

Returns the **Loan-to-Value (LTV)** ratio for a given farmer, expressed in basis points.

**Parameters**

* `farmer`: Address of the borrower.

**Returns**

* LTV ratio in basis points.

---

### `liquidate(address farmer)`

Triggers liquidation when a farmer’s position exceeds safe LTV limits.

**Parameters**

* `farmer`: Address to liquidate.

---

### `activatePledge()`

Activates community pledge participation for the pool.

---

### `deactivatePledge()`

Deactivates community pledge participation for the pool.

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
