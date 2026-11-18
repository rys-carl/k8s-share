# Docker & Kubernetes: A Developer's Mental Model

An interactive, minimalist web presentation designed to explain the high-level architecture and core mental models of **Docker** and **Kubernetes (K8s)** from a developer's perspective. 

Built as a visual aid for Knowledge Sharing sessions to bridge the gap between application development and cloud infrastructure.

---

## Interactive Modules

1. **The Docker Foundation**
   - Step-by-step interactive walkthrough of the container packaging pipeline (`Dockerfile` → `Image` → `Registry` → `Container`).
   - **Single-Server Wall Simulator:** Toggle between normal traffic, a 5x traffic spike, and a 2 AM server crash to visualize why single-host Docker setups hit a wall in production.
2. **Kubernetes Nesting Hierarchy**
   - Clickable Russian-nesting-doll architecture diagram (`Cluster` → `Worker Node` → `Pod` → `Container`) with plain-English explanations and everyday analogies.
3. **Desired State & 2 AM Self-Healing Playground**
   - Live `deployment.yaml` replica editor, **HPA (Horizontal Pod Autoscaler)** traffic load slider, and chaos triggers to simulate random Pod crashes or full Node outages while watching the Control Plane reconcile the cluster.
4. **End-to-End Request Flow**
   - Manual and auto-playing 5-stage pipeline tracing a deployment from `kubectl apply` through the Control Plane, Worker Nodes, and Kubernetes Service Load Balancer out to end users.
5. **Developer Cheat Sheet**
   - Searchable and category-filterable glossary translating core container and orchestration terms into plain English.
6. **Built-in Presenter Script**
   - Toggleable speaker talking points synced to each presentation tab for live demos and knowledge-sharing sessions.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Deployment:** [Vercel](https://vercel.com/)

---

## Getting Started Locally

### Prerequisites
- `npm`, `yarn`, `pnpm`, or `bun`

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd <your-project-folder>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open in your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the interactive guide.

---

## Deployment

This project is configured for zero-config deployment on **Vercel**:
1. Push your code to GitHub, GitLab, or Bitbucket.
2. Import the repository into your [Vercel Dashboard](https://vercel.com/new).
3. Vercel will automatically detect Next.js, build the project, and assign a live production URL.

---

## Purpose & Audience

Created specifically for frontend and application developers who want a clear, visual mental model of how containerized applications are packaged, deployed, scaled, and kept alive in production—without getting lost in heavy infrastructure jargon.