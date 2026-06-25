# BudgetWise (with AI Capabilities) 🤖💰

BudgetWise is an enterprise-grade financial management platform built on a distributed microservices architecture. It features a robust **Java Spring Boot** core for ledger and bill tracking, a responsive **React** user interface, and an advanced **Python FastAPI AI Service** that provides real-time financial insights through dynamic and static Retrieval-Augmented Generation (RAG).

---

## 🏗️ System Architecture & Layout

The repository is organized as a monorepo containing three primary layers: the Java Service Mesh, the Python AI Microservice, and the Frontend React Single Page Application (SPA).

```text
.
├── Backend/
│   └── Capstone-Project/
│       ├── GateWay/              # Spring Cloud Gateway (Port 8080) - Main routing proxy
│       ├── Secure/               # Authentication & User Management (Port 9099) [JWT Provider]
│       ├── Accounts/             # Financial Accounts management (Port 2001)
│       ├── TransactionHistory/   # Ledger & ledger entries tracking (Port 2002)
│       ├── Bills/                # Recurring bill obligations & trackers (Port 9007)
│       ├── Category/             # Transaction classification configurations (Port 2004)
│       └── AI-Service/           # FastAPI standalone AI Microservice (Port 8000)
│           ├── app/              # Application layer (routers, models, core dependencies)
│           │   ├── services/     # RAG engines, database client, tool execution logic
│           │   └── core/         # Shared configurations & JWT verification middleware
│           └── data/             # Persistent SQLite cache and local ChromaDB files
└── FrontEnd/                     # React User Interface (Port 3000)
