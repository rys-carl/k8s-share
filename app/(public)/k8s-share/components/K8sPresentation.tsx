"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Layers, Server, Cpu, Activity, ShieldAlert, RefreshCw, Play, Pause, ChevronRight, ChevronLeft,
  Search, BookOpen, Terminal, Globe, Database, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Sparkles, FileCode2,
  Package, Network, Zap, type LucideIcon } from "lucide-react";

// ============================================================================
// DATA & CONTENT DEFINITIONS
// ============================================================================

export type SectionId =
  | "docker"
  | "hierarchy"
  | "simulator"
  | "flow"
  | "glossary";

export type LayerKey = "cluster" | "node" | "pod" | "container";

export type SingleHostScenario = "normal" | "spike" | "crash";

export interface ClusterNode {
  id: string;
  name: string;
  status: "healthy" | "offline" | string;
  az: string;
}

export interface ClusterPod {
  id: string;
  nodeId: string;
  status: "Running" | "Terminating" | "Lost" | string;
  version: string;
}

export interface LogEntry {
  id: number;
  time: string;
  type: "info" | "warning" | "error" | "success" | string;
  message: string;
}

const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: "docker", label: "1. Docker Foundation" },
  { id: "hierarchy", label: "2. K8s Hierarchy" },
  { id: "simulator", label: "3. Desired State & Self-Healing" },
  { id: "flow", label: "4. End-to-End Flow" },
  { id: "glossary", label: "5. Developer Cheat Sheet" },
];

const DOCKER_PIPELINE = [
  {
    id: "dockerfile",
    step: "01",
    title: "Dockerfile",
    subtitle: "The Blueprint / Recipe",
    icon: FileCode2,
    color: "blue",
    badge: "Source Code",
    description:
      "A simple text file listing step-by-step instructions on how to set up your application environment (e.g., install Node.js 18, copy frontend/backend code, install dependencies).",
    analogy:
      "Like a chef’s written recipe listing every ingredient and oven temperature.",
    codeSnippet: `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]`,
  },
  {
    id: "image",
    step: "02",
    title: "Docker Image",
    subtitle: "The Frozen Snapshot",
    icon: Box,
    color: "indigo",
    badge: "Build Artifact",
    description:
      "Docker reads the Dockerfile and builds an immutable, read-only package containing your code, libraries, and runtime settings. It cannot be edited directly once built.",
    analogy:
      "Like a sealed, frozen TV dinner—everything needed is packed inside, ready to heat up anywhere.",
    codeSnippet: `$ docker build -t my-web-app:1.5 .
[+] Building 4.2s (8/8) FINISHED
 => exporting to image
 => naming to docker.io/library/my-web-app:1.5`,
  },
  {
    id: "registry",
    step: "03",
    title: "Container Registry",
    subtitle: "The App Store / Vault",
    icon: Database,
    color: "sky",
    badge: "Distribution",
    description:
      "A central cloud storage library (like Docker Hub or AWS ECR) where developers push (upload) built Images so servers anywhere in the world can pull (download) them.",
    analogy:
      "Like the App Store or Google Drive for packaged software snapshots.",
    codeSnippet: `$ docker push my-org/my-web-app:1.5
The push refers to repository [docker.io/my-org/my-web-app]
1.5: digest: sha256:9f86d081884c7d659a2feaa0... size: 1574`,
  },
  {
    id: "container",
    step: "04",
    title: "Running Container",
    subtitle: "The Live Application",
    icon: Terminal,
    color: "emerald",
    badge: "Runtime Execution",
    description:
      'The live, running instance of a Docker Image on a computer. It runs isolated from other processes while sharing the host machine’s OS kernel—eliminating "it works on my machine!"',
    analogy:
      "The actual hot meal served on a plate, created from the frozen snapshot.",
    codeSnippet: `$ docker run -d -p 80:8080 my-org/my-web-app:1.5
Container ID: a8f92c1d4b0e
Status: Up 2 seconds (Healthy) -> Listening on :8080`,
  },
];

const HIERARCHY_LAYERS: Record<
  LayerKey,
  {
    id: LayerKey;
    title: string;
    tagline: string;
    badge: string;
    summary: string;
    relationOut: string;
    relationIn: string;
    frontendTakeaway: string;
  }
> = {
  cluster: {
    id: "cluster",
    title: "Kubernetes Cluster",
    tagline: "The Entire Fleet / Unified Data Center",
    badge: "Top-Level Boundary",
    summary:
      'A collection of multiple servers (Nodes) linked together and managed by a central Control Plane ("the brain") so they act as one giant, unified computer.',
    relationOut: "Outermost boundary managed by Kubernetes (e.g., AWS EKS).",
    relationIn:
      "Contains the Control Plane (brain) and multiple Worker Nodes (servers).",
    frontendTakeaway:
      "Instead of deploying our app to one specific server IP, we deploy to the Cluster and let Kubernetes figure out where it runs.",
  },
  node: {
    id: "node",
    title: "Worker Node",
    tagline: "The Physical or Cloud Server (VM)",
    badge: "Compute Hardware",
    summary:
      "An individual server machine (such as an AWS EC2 instance) inside the cluster that provides real CPU, RAM, and networking power to run workloads.",
    relationOut: "Lives inside the Kubernetes Cluster alongside other Nodes.",
    relationIn:
      'Hosts one or more Pods and runs a local agent called "kubelet" that takes orders from the Control Plane.',
    frontendTakeaway:
      "If one Node’s hardware dies at 2 AM, Kubernetes moves our app’s Pods onto another healthy Node automatically.",
  },
  pod: {
    id: "pod",
    title: "Pod",
    tagline: "The Kubernetes Wrapper Unit",
    badge: "Smallest K8s Unit",
    summary:
      "Kubernetes does not run raw Docker containers directly. Instead, it wraps a container inside a Pod—giving it its own unique internal IP address and lifecycle hooks.",
    relationOut: "Scheduled onto a Worker Node by the Control Plane.",
    relationIn:
      "Wraps your running Docker Container (usually 1 container per Pod).",
    frontendTakeaway:
      'When we scale up our web app to "3 replicas," Kubernetes is creating 3 identical Pods.',
  },
  container: {
    id: "container",
    title: "Container",
    tagline: "Your Actual Running App Code",
    badge: "Core Payload",
    summary:
      "The live instance of your Docker Image running your compiled React/Next.js frontend, Node.js API, or microservice inside the Pod.",
    relationOut: "Lives securely inside a Kubernetes Pod.",
    relationIn:
      "Contains your packaged application code, runtime, and dependencies.",
    frontendTakeaway:
      "This is the exact same Docker container we can test locally on our laptop!",
  },
};

const E2E_STEPS = [
  {
    id: 0,
    actor: "Developer / CI/CD",
    command: "kubectl apply -f deployment.yaml",
    title: "1. Declare Desired State",
    description:
      'You or your CI/CD pipeline send a YAML configuration file to Kubernetes stating: "Run 3 replicas of web-app:v1.5 and expose them on port 80."',
    highlight: "dev",
  },
  {
    id: 1,
    actor: "Control Plane (Brain)",
    command: "API Server -> etcd -> Scheduler",
    title: "2. Save State & Schedule",
    description:
      "The API Server validates your YAML, saves your Desired State into etcd (the cluster’s memory database), and the Scheduler picks which Worker Nodes have free CPU/RAM.",
    highlight: "control",
  },
  {
    id: 2,
    actor: "Worker Nodes & Kubelet",
    command: "Pull Image -> Spin up Pods",
    title: "3. Launch Containers in Pods",
    description:
      "The local Kubelet agent on each chosen Worker Node pulls the Docker Image from the Registry and starts your application Containers wrapped inside Pods.",
    highlight: "nodes",
  },
  {
    id: 3,
    actor: "K8s Service / Load Balancer",
    command: "Port 80 -> TargetPort 8080",
    title: "4. Open Stable Front Door",
    description:
      "Because Pods can die and change internal IPs anytime, a Kubernetes Service provides a permanent public Load Balancer address and routes traffic to healthy Pods.",
    highlight: "service",
  },
  {
    id: 4,
    actor: "End Users (Browser)",
    command: "HTTPS GET https://app.company.com",
    title: "5. Live Production Traffic",
    description:
      "Users visit your web app. The Load Balancer distributes requests evenly across all active Pods. Zero manual server configuration required!",
    highlight: "users",
  },
];

const GLOSSARY_TERMS = [
  {
    term: "Docker Image",
    category: "Docker",
    plainEnglish:
      "A frozen, read-only snapshot containing your app code, runtime, and dependencies.",
    analogy: "A blueprint or frozen meal ready to be heated up anywhere.",
  },
  {
    term: "Container",
    category: "Docker",
    plainEnglish:
      "A live, running instance of a Docker Image isolated on a machine.",
    analogy: "The actual house built from the blueprint.",
  },
  {
    term: "Pod",
    category: "Kubernetes Core",
    plainEnglish:
      "The smallest deployable unit in Kubernetes; acts as a standardized wrapper around your container.",
    analogy:
      "A protective shipping capsule giving your container an IP address and health monitoring.",
  },
  {
    term: "Node",
    category: "Kubernetes Core",
    plainEnglish:
      "An individual physical or cloud virtual server (e.g., AWS EC2) that runs Pods.",
    analogy: "A cargo ship carrying multiple shipping containers.",
  },
  {
    term: "Cluster",
    category: "Kubernetes Core",
    plainEnglish:
      "A group of Worker Nodes managed together by a central Kubernetes Control Plane.",
    analogy:
      "The entire shipping fleet coordinated by a central command center.",
  },
  {
    term: "Desired State",
    category: "Concepts",
    plainEnglish:
      'Your YAML declaration of how the system should look (e.g., "Always keep 3 healthy Pods running").',
    analogy:
      "Setting a thermostat to 72°F—the system automatically heats or cools to match it.",
  },
  {
    term: "Deployment",
    category: "Workloads",
    plainEnglish:
      "A Kubernetes object that manages interchangeable Pods and handles zero-downtime rolling updates.",
    analogy:
      "An automated manager ensuring the exact number of web servers stay alive.",
  },
  {
    term: "Service",
    category: "Networking",
    plainEnglish:
      "A permanent front-door IP address and load balancer that routes traffic to shifting Pods.",
    analogy:
      "A restaurant host greeting guests at one front desk and seating them at open tables.",
  },
  {
    term: "Control Plane",
    category: "Architecture",
    plainEnglish:
      "The brain of Kubernetes (API Server, etcd, Scheduler) that watches the cluster and enforces Desired State.",
    analogy:
      "Air traffic control directing planes without flying them personally.",
  },
  {
    term: "HPA (Autoscaler)",
    category: "Scaling",
    plainEnglish:
      "Horizontal Pod Autoscaler—automatically adds or removes Pods based on CPU/traffic spikes.",
    analogy:
      "Opening extra grocery checkout lanes when a sudden crowd lines up.",
  },
];

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export function K8sPresentation() {
  const [activeSection, setActiveSection] = useState<SectionId>("docker");

  // Module 1: Docker Pipeline & Single Host Limit State
  const [selectedDockerStep, setSelectedDockerStep] = useState(0);
  const [singleHostScenario, setSingleHostScenario] =
    useState<SingleHostScenario>("normal"); // 'normal' | 'spike' | 'crash'

  // Module 2: Nesting Hierarchy State
  const [selectedLayer, setSelectedLayer] = useState<LayerKey>("pod");

  // Module 3: Desired State & Self-Healing Simulator State
  const [baseDesiredReplicas, setBaseDesiredReplicas] = useState(3);
  const [trafficMultiplier, setTrafficMultiplier] = useState(1); // 1x to 5x
  const [nodes, setNodes] = useState<ClusterNode[]>([
    { id: "node-1", name: "Node 1 (Server A)", status: "healthy", az: "AZ-1a" },
    { id: "node-2", name: "Node 2 (Server B)", status: "healthy", az: "AZ-1b" },
    { id: "node-3", name: "Node 3 (Server C)", status: "healthy", az: "AZ-1c" },
  ]);
  const [pods, setPods] = useState<ClusterPod[]>([
    { id: "pod-101", nodeId: "node-1", status: "Running", version: "v1.5" },
    { id: "pod-102", nodeId: "node-2", status: "Running", version: "v1.5" },
    { id: "pod-103", nodeId: "node-3", status: "Running", version: "v1.5" },
  ]);
  const [eventLog, setEventLog] = useState<LogEntry[]>([
    {
      id: 1,
      time: "Just now",
      type: "info",
      message: "Cluster reconciled: 3/3 Pods running across 3 healthy Nodes.",
    },
  ]);
  const [isReconciling, setIsReconciling] = useState(false);

  // Module 4: End-to-End Flow State
  const [e2eStep, setE2eStep] = useState(0);
  const [e2eAutoPlay, setE2eAutoPlay] = useState(false);

  // Module 5: Glossary State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Calculate effective desired replicas with HPA Traffic Multiplier
  const effectiveDesiredReplicas = useMemo(() => {
    if (trafficMultiplier === 1) return baseDesiredReplicas;
    if (trafficMultiplier === 2) return Math.min(9, baseDesiredReplicas + 1);
    if (trafficMultiplier === 3) return Math.min(9, baseDesiredReplicas + 2);
    if (trafficMultiplier === 4) return Math.min(9, baseDesiredReplicas + 4);
    return Math.min(9, baseDesiredReplicas + 5);
  }, [baseDesiredReplicas, trafficMultiplier]);

  const addLog = useCallback(
    (
      message: string,
      type: "info" | "warning" | "error" | "success" | string = "info",
    ) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setEventLog((prev) => [
        { id: Date.now() + Math.random(), time: timeStr, type, message },
        ...prev.slice(0, 5),
      ]);
    },
    [],
  );

  // Reconcile loop for Module 3 (Self-Healing & Scaling)
  useEffect(() => {
    const healthyNodes = nodes.filter((n) => n.status === "healthy");
    const runningPodsOnHealthyNodes = pods.filter(
      (p) =>
        p.status === "Running" && healthyNodes.some((n) => n.id === p.nodeId),
    );

    if (healthyNodes.length === 0) return;

    if (runningPodsOnHealthyNodes.length !== effectiveDesiredReplicas) {
      setIsReconciling(true);
      const timer = setTimeout(() => {
        setPods((currentPods) => {
          const validPods = currentPods.filter(
            (p) =>
              p.status === "Running" &&
              healthyNodes.some((n) => n.id === p.nodeId),
          );

          if (validPods.length < effectiveDesiredReplicas) {
            // Scale up / self-heal missing pods
            const needed = effectiveDesiredReplicas - validPods.length;
            const newPods = [...validPods];
            for (let i = 0; i < needed; i++) {
              // Round-robin across healthy nodes
              const targetNode =
                healthyNodes[(validPods.length + i) % healthyNodes.length];
              if (!targetNode) continue;
              const randomNum = Math.floor(200 + Math.random() * 799);
              newPods.push({
                id: `pod-${randomNum}`,
                nodeId: targetNode.id,
                status: "Running",
                version: "v1.5",
              });
            }
            addLog(
              `Control Plane scheduled ${needed} replacement/scaled Pod(s) onto healthy Nodes (${effectiveDesiredReplicas}/${effectiveDesiredReplicas} active).`,
              "success",
            );
            return newPods;
          } else if (validPods.length > effectiveDesiredReplicas) {
            // Scale down excess pods
            const trimmed = validPods.slice(0, effectiveDesiredReplicas);
            addLog(
              `HPA scaled down excess Pods to match Desired State (${effectiveDesiredReplicas}/${effectiveDesiredReplicas} active).`,
              "info",
            );
            return trimmed;
          }
          return validPods;
        });
        setIsReconciling(false);
      }, 1100);

      return () => clearTimeout(timer);
    }
  }, [pods, nodes, effectiveDesiredReplicas, addLog]);

  // Handlers for Module 3 Simulator
  const handleCrashSinglePod = () => {
    const runningPods = pods.filter((p) => p.status === "Running");
    if (runningPods.length === 0) return;
    const victim = runningPods[0];
    if (!victim) return;
    setPods((prev) =>
      prev.map((p) =>
        p.id === victim.id ? { ...p, status: "Terminating" } : p,
      ),
    );
    addLog(
      `Alert: ${victim.id} crashed unexpectedly! Drift detected (${runningPods.length - 1}/${effectiveDesiredReplicas} running).`,
      "warning",
    );
  };

  const handleToggleNode2 = () => {
    const node2 = nodes.find((n) => n.id === "node-2");
    const willCrash = node2?.status === "healthy";

    setNodes((prev) =>
      prev.map((n) =>
        n.id === "node-2"
          ? { ...n, status: willCrash ? "offline" : "healthy" }
          : n,
      ),
    );

    if (willCrash) {
      setPods((prev) =>
        prev.map((p) => (p.nodeId === "node-2" ? { ...p, status: "Lost" } : p)),
      );
      addLog(
        "2 AM Hardware Failure: Node 2 went OFFLINE! Control Plane evicting lost Pods and rescheduling on Node 1 & Node 3...",
        "error",
      );
    } else {
      addLog("Node 2 recovered and rejoined the cluster as Ready.", "success");
    }
  };

  const handleResetCluster = () => {
    setTrafficMultiplier(1);
    setBaseDesiredReplicas(3);
    setNodes([
      {
        id: "node-1",
        name: "Node 1 (Server A)",
        status: "healthy",
        az: "AZ-1a",
      },
      {
        id: "node-2",
        name: "Node 2 (Server B)",
        status: "healthy",
        az: "AZ-1b",
      },
      {
        id: "node-3",
        name: "Node 3 (Server C)",
        status: "healthy",
        az: "AZ-1c",
      },
    ]);
    setPods([
      { id: "pod-101", nodeId: "node-1", status: "Running", version: "v1.5" },
      { id: "pod-102", nodeId: "node-2", status: "Running", version: "v1.5" },
      { id: "pod-103", nodeId: "node-3", status: "Running", version: "v1.5" },
    ]);
    addLog(
      "Cluster reset to baseline Desired State (3 Replicas, 3 Healthy Nodes).",
      "info",
    );
  };

  // Auto-play effect for Module 4 E2E Flow
  useEffect(() => {
    if (!e2eAutoPlay) return;
    const interval = setInterval(() => {
      setE2eStep((prev) => (prev + 1) % E2E_STEPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [e2eAutoPlay]);

  // Filtered glossary terms
  const filteredGlossary = useMemo(() => {
    return GLOSSARY_TERMS.filter((item) => {
      const matchesCat =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesQuery =
        item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.plainEnglish.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* ====================================================================
          TOP MINIMALIST PRESENTATION HEADER
      ==================================================================== */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  Docker & Kubernetes: A Developer’s Mental Model
                </h1>
              </div>
              <p className="text-xs text-slate-500">
                High-level architecture & interactive visual guide for
                developers
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 overflow-x-auto">
          <nav
            className="flex items-center gap-1 -mb-px"
            aria-label="Presentation Modules"
          >
            {SECTIONS.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ====================================================================
          MAIN CONTENT AREA
      ==================================================================== */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ==================================================================
            MODULE 1: THE DOCKER FOUNDATION
        ================================================================== */}
        {activeSection === "docker" && (
          <div className="space-y-6">
            {/* Section Intro */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-3">
                  <Package className="w-3.5 h-3.5" />
                  Foundation: Containerization
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Step 1: Packaging Code with Docker
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Before Kubernetes can orchestrate anything, our application
                  needs to be packed into a standardized, portable box. Click
                  each stage below to trace how developer code becomes a live
                  container.
                </p>
              </div>

              {/* Interactive 4-Step Docker Pipeline */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {DOCKER_PIPELINE.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = selectedDockerStep === idx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedDockerStep(idx)}
                      className={`text-left p-4 rounded-xl border transition-all relative ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-md"
                          : "bg-slate-50/70 text-slate-900 border-slate-200 hover:bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            isSelected
                              ? "bg-white/15 text-white"
                              : "bg-white text-slate-500 border border-slate-200"
                          }`}
                        >
                          STEP {item.step}
                        </span>
                        <Icon
                          className={`w-5 h-5 ${isSelected ? "text-blue-400" : "text-slate-500"}`}
                        />
                      </div>
                      <h3 className="font-bold text-base">{item.title}</h3>
                      <p
                        className={`text-xs mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-500"}`}
                      >
                        {item.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Active Docker Step Detail Panel */}
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {DOCKER_PIPELINE[selectedDockerStep].badge}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900">
                      {DOCKER_PIPELINE[selectedDockerStep].title}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {DOCKER_PIPELINE[selectedDockerStep].description}
                  </p>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600">
                      <strong className="text-slate-900">
                        Everyday Analogy:
                      </strong>{" "}
                      {DOCKER_PIPELINE[selectedDockerStep].analogy}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="bg-slate-900 rounded-xl p-4 text-slate-100 font-mono text-xs overflow-x-auto shadow-inner">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
                      <span>terminal / example</span>
                      <span>docker-cli</span>
                    </div>
                    <pre className="leading-relaxed whitespace-pre-wrap">
                      {DOCKER_PIPELINE[selectedDockerStep].codeSnippet}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Single Server Limit Simulator */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Why Do We Still Need Kubernetes? (The Single-Server Wall)
                  </h3>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Docker runs multiple containers great on{" "}
                    <strong>one machine</strong>. Test what happens in
                    production when trouble hits:
                  </p>
                </div>

                {/* Scenario Toggle Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSingleHostScenario("normal")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      singleHostScenario === "normal"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Normal Day (1 Server)
                  </button>
                  <button
                    onClick={() => setSingleHostScenario("spike")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      singleHostScenario === "spike"
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Simulate 5x Traffic Spike
                  </button>
                  <button
                    onClick={() => setSingleHostScenario("crash")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      singleHostScenario === "crash"
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Simulate 2 AM Server Crash
                  </button>
                </div>
              </div>

              {/* Visual Single Host Box */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7">
                  <div
                    className={`rounded-xl border-2 p-5 transition-all ${
                      singleHostScenario === "normal"
                        ? "bg-slate-50 border-slate-300"
                        : singleHostScenario === "spike"
                          ? "bg-amber-50/60 border-amber-400"
                          : "bg-rose-50/70 border-rose-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Server
                          className={`w-5 h-5 ${
                            singleHostScenario === "crash"
                              ? "text-rose-600"
                              : "text-slate-700"
                          }`}
                        />
                        <span className="font-bold text-sm text-slate-900">
                          Single Cloud Server (1 Host Machine)
                        </span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          singleHostScenario === "normal"
                            ? "bg-emerald-100 text-emerald-800"
                            : singleHostScenario === "spike"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {singleHostScenario === "normal" &&
                          "CPU: 35% • Healthy"}
                        {singleHostScenario === "spike" &&
                          "CPU: 100% • Overloaded!"}
                        {singleHostScenario === "crash" &&
                          "OFFLINE • Hardware Dead"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {["Frontend Web App", "Backend API", "Redis Cache"].map(
                        (serviceName, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border bg-white transition-all ${
                              singleHostScenario === "crash"
                                ? "border-rose-200 opacity-50"
                                : singleHostScenario === "spike"
                                  ? "border-amber-300"
                                  : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Box className="w-4 h-4 text-blue-600" />
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  singleHostScenario === "crash"
                                    ? "bg-rose-500"
                                    : singleHostScenario === "spike"
                                      ? "bg-amber-500 animate-ping"
                                      : "bg-emerald-500"
                                }`}
                              />
                            </div>
                            <p className="text-xs font-bold text-slate-900">
                              {serviceName}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {singleHostScenario === "crash"
                                ? "Unreachable (Host Down)"
                                : singleHostScenario === "spike"
                                  ? "504 Gateway Timeout"
                                  : "Docker Container"}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {/* Explanation & Bridge to K8s */}
                <div className="lg:col-span-5 space-y-3">
                  {singleHostScenario === "normal" && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Docker Alone Works Fine Here
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        On a single machine with normal traffic, Docker easily
                        runs multiple containers side by side. Each container
                        has its own isolated dependencies.
                      </p>
                    </div>
                  )}

                  {singleHostScenario === "spike" && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                      <h4 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Bottleneck: Trapped on One Machine
                      </h4>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Docker only sees the single computer it is installed on.
                        It cannot automatically borrow CPU from other servers or
                        spin up extra copies across a fleet.
                      </p>
                    </div>
                  )}

                  {singleHostScenario === "crash" && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                      <h4 className="font-bold text-sm text-rose-900 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Single Point of Failure at 2 AM
                      </h4>
                      <p className="text-xs text-rose-800 leading-relaxed">
                        Even if you set{" "}
                        <code className="bg-rose-100 px-1 rounded">
                          --restart=always
                        </code>
                        , if the physical server dies, Docker dies with it.
                        Someone has to wake up and manually provision a new
                        server.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveSection("hierarchy")}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>See How Kubernetes Solves This</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            MODULE 2: THE KUBERNETES HIERARCHY (NESTING DOLLS)
        ================================================================== */}
        {activeSection === "hierarchy" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
                <Layers className="w-3.5 h-3.5" />
                Mental Model: Nesting Hierarchy
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Cluster → Node → Pod → Container
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Think of Kubernetes objects like Russian nesting dolls. Click
                any layer in the visual diagram below to inspect how each piece
                wraps the next.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Interactive Nested Boxes Diagram */}
              <div className="lg:col-span-7">
                {/* Layer 1: Cluster */}
                <div
                  onClick={() => setSelectedLayer("cluster")}
                  className={`cursor-pointer rounded-2xl border-2 p-4 sm:p-5 transition-all ${
                    selectedLayer === "cluster"
                      ? "bg-blue-50/60 border-blue-600 shadow-md"
                      : "bg-slate-50 border-slate-300 hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        1. Kubernetes Cluster (The Whole Fleet)
                      </span>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      Click to inspect
                    </span>
                  </div>

                  {/* Layer 2: Worker Nodes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Node 1 (Interactive Primary) */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLayer("node");
                      }}
                      className={`cursor-pointer rounded-xl border-2 p-3.5 transition-all ${
                        selectedLayer === "node"
                          ? "bg-indigo-50/80 border-indigo-600 shadow-sm"
                          : "bg-white border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Server className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-bold text-slate-900">
                            2. Worker Node 1
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Cloud VM
                        </span>
                      </div>

                      {/* Layer 3: Pod */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLayer("pod");
                        }}
                        className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                          selectedLayer === "pod"
                            ? "bg-sky-50 border-sky-600 shadow-sm"
                            : "bg-slate-50 border-slate-200 hover:border-sky-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-sky-900">
                            3. Pod (K8s Wrapper)
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            10.244.1.8
                          </span>
                        </div>

                        {/* Layer 4: Container */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLayer("container");
                          }}
                          className={`cursor-pointer rounded-md border-2 p-2.5 transition-all ${
                            selectedLayer === "container"
                              ? "bg-emerald-50 border-emerald-600 shadow-sm"
                              : "bg-white border-slate-200 hover:border-emerald-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Box className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                4. Docker Container
                              </p>
                              <p className="text-[11px] text-slate-500">
                                web-app:v1.5 (Running Code)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Node 2 (Secondary visual context) */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLayer("node");
                      }}
                      className={`cursor-pointer rounded-xl border-2 p-3.5 transition-all flex flex-col justify-between ${
                        selectedLayer === "node"
                          ? "bg-indigo-50/80 border-indigo-600 shadow-sm"
                          : "bg-white border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Server className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-bold text-slate-900">
                            2. Worker Node 2
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Cloud VM
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLayer("pod");
                          }}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 hover:border-sky-300"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-700">
                              Pod (Replica #2)
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              10.244.2.4
                            </span>
                          </div>
                          <div className="mt-1.5 rounded bg-white border border-slate-200 px-2 py-1 text-[11px] text-slate-600 flex items-center gap-1.5">
                            <Box className="w-3 h-3 text-emerald-600" />
                            <span>web-app:v1.5</span>
                          </div>
                        </div>

                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLayer("pod");
                          }}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 hover:border-sky-300"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-700">
                              Pod (Replica #3)
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              10.244.2.9
                            </span>
                          </div>
                          <div className="mt-1.5 rounded bg-white border border-slate-200 px-2 py-1 text-[11px] text-slate-600 flex items-center gap-1.5">
                            <Box className="w-3 h-3 text-emerald-600" />
                            <span>web-app:v1.5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Layer Explanation Card */}
              <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white">
                    {HIERARCHY_LAYERS[selectedLayer].badge}
                  </span>
                  <div className="flex gap-1">
                    {(["cluster", "node", "pod", "container"] as const).map((layerKey) => (
                      <button
                        key={layerKey}
                        onClick={() => setSelectedLayer(layerKey)}
                        className={`px-2 py-1 rounded text-[11px] font-medium capitalize ${
                          selectedLayer === layerKey
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {layerKey}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {HIERARCHY_LAYERS[selectedLayer].title}
                  </h3>
                  <p className="text-xs font-medium text-blue-600 mt-0.5">
                    {HIERARCHY_LAYERS[selectedLayer].tagline}
                  </p>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">
                  {HIERARCHY_LAYERS[selectedLayer].summary}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">
                      Outer Context:
                    </span>
                    <span className="text-slate-600">
                      {HIERARCHY_LAYERS[selectedLayer].relationOut}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">
                      Inner Contents:
                    </span>
                    <span className="text-slate-600">
                      {HIERARCHY_LAYERS[selectedLayer].relationIn}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                  <p className="text-xs text-blue-900 leading-relaxed">
                    <strong>Developer Takeaway:</strong>{" "}
                    {HIERARCHY_LAYERS[selectedLayer].frontendTakeaway}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            MODULE 3: DESIRED STATE & 2 AM SELF-HEALING SIMULATOR
        ================================================================== */}
        {activeSection === "simulator" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-2">
                    <Activity className="w-3.5 h-3.5" />
                    Interactive Cluster Playground
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Desired State, 2 AM Self-Healing & Auto-Scaling
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Modify the YAML Desired State, trigger a Pod or Node
                    failure, or drag the traffic slider to see Kubernetes
                    reconcile the cluster automatically.
                  </p>
                </div>

                <button
                  onClick={handleResetCluster}
                  className="self-start lg:self-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Cluster</span>
                </button>
              </div>

              {/* Controls & Live YAML Desired State */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: YAML Declarative Config & Failure Triggers */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Interactive YAML Card */}
                  <div className="bg-slate-900 rounded-xl p-4 text-slate-100 font-mono text-xs shadow-sm">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                      <span className="text-slate-400 font-sans font-semibold text-xs">
                        deployment.yaml (Desired State)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">
                        Declarative
                      </span>
                    </div>
                    <div className="space-y-1 leading-relaxed">
                      <div className="text-slate-400">apiVersion: apps/v1</div>
                      <div>
                        <span className="text-sky-400">kind:</span> Deployment
                      </div>
                      <div>
                        <span className="text-sky-400">metadata:</span>
                      </div>
                      <div className="pl-3">
                        <span className="text-sky-400">name:</span> web-frontend
                      </div>
                      <div>
                        <span className="text-sky-400">spec:</span>
                      </div>
                      <div className="pl-3 flex items-center justify-between bg-slate-800/90 px-2 py-1.5 rounded border border-slate-700 my-1">
                        <span>
                          <span className="text-amber-400">replicas:</span>{" "}
                          <strong className="text-white text-sm">
                            {effectiveDesiredReplicas}
                          </strong>
                        </span>
                        <div className="flex items-center gap-1">
                          {[2, 3, 4].map((num) => (
                            <button
                              key={num}
                              onClick={() => {
                                setTrafficMultiplier(1);
                                setBaseDesiredReplicas(num);
                                addLog(
                                  `Updated deployment.yaml replicas to ${num}.`,
                                  "info",
                                );
                              }}
                              className={`px-2 py-0.5 rounded text-[11px] font-sans font-bold transition-colors ${
                                baseDesiredReplicas === num &&
                                trafficMultiplier === 1
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="pl-3">
                        <span className="text-sky-400">image:</span>{" "}
                        my-org/web-app:v1.5
                      </div>
                    </div>
                  </div>

                  {/* HPA Traffic Load Slider */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Traffic Load (HPA Autoscaler)
                      </label>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {trafficMultiplier}x Traffic
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={trafficMultiplier}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTrafficMultiplier(val);
                        addLog(
                          `Incoming user traffic adjusted to ${val}x load.`,
                          "info",
                        );
                      }}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>1x (Normal)</span>
                      <span>3x (Busy)</span>
                      <span>5x (Flash Sale)</span>
                    </div>
                  </div>

                  {/* Chaos / Failure Simulation Buttons */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                    <span className="text-xs font-bold text-slate-900 block">
                      Simulate Production Failures:
                    </span>
                    <button
                      onClick={handleCrashSinglePod}
                      disabled={isReconciling}
                      className="w-full py-2 px-3 rounded-lg bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>Crash a Random Pod</span>
                    </button>
                    <button
                      onClick={handleToggleNode2}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-colors ${
                        nodes.find((n) => n.id === "node-2")?.status ===
                        "healthy"
                          ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                      }`}
                    >
                      <Server className="w-4 h-4" />
                      <span>
                        {nodes.find((n) => n.id === "node-2")?.status ===
                        "healthy"
                          ? "Crash Entire Node 2 (2 AM Failure)"
                          : "Restore Node 2 Hardware"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Right: Live Cluster Visualizer */}
                <div className="lg:col-span-8 space-y-4">
                  {/* Status Bar */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          isReconciling
                            ? "bg-amber-500 animate-ping"
                            : "bg-emerald-500"
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-900">
                        Control Plane Status:{" "}
                        <span
                          className={
                            isReconciling
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }
                        >
                          {isReconciling
                            ? "Drift Detected — Self-Healing & Rescheduling..."
                            : "Desired State Matched"}
                        </span>
                      </span>
                    </div>
                    <div className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-700">
                      Running Pods:{" "}
                      <strong>
                        {pods.filter((p) => p.status === "Running").length} /{" "}
                        {effectiveDesiredReplicas}
                      </strong>
                    </div>
                  </div>

                  {/* K8s Service Load Balancer Banner */}
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Network className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="text-xs font-bold text-blue-950">
                          Kubernetes Service (Load Balancer)
                        </span>
                        <span className="text-[11px] text-blue-700 block">
                          Routes incoming traffic only to healthy Running Pods
                          across active Nodes
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800">
                      Port 80 → :8080
                    </span>
                  </div>

                  {/* 3 Worker Nodes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {nodes.map((node) => {
                      const nodePods = pods.filter((p) => p.nodeId === node.id);
                      const isOffline = node.status === "offline";

                      return (
                        <div
                          key={node.id}
                          className={`rounded-xl border-2 p-3.5 transition-all min-h-52.5 flex flex-col justify-between ${
                            isOffline
                              ? "bg-rose-50/60 border-rose-300"
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <Server
                                  className={`w-4 h-4 ${
                                    isOffline
                                      ? "text-rose-600"
                                      : "text-slate-700"
                                  }`}
                                />
                                <span className="text-xs font-bold text-slate-900">
                                  {node.name}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isOffline
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {isOffline ? "OFFLINE" : node.az}
                              </span>
                            </div>

                            {isOffline ? (
                              <div className="py-8 text-center space-y-1">
                                <XCircle className="w-6 h-6 text-rose-500 mx-auto" />
                                <p className="text-xs font-bold text-rose-800">
                                  Server Unreachable
                                </p>
                                <p className="text-[11px] text-rose-600">
                                  Pods evacuated to healthy nodes
                                </p>
                              </div>
                            ) : nodePods.length === 0 ? (
                              <div className="py-8 text-center">
                                <p className="text-xs text-slate-400">
                                  No Pods scheduled here
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {nodePods.map((pod) => (
                                  <div
                                    key={pod.id}
                                    className={`p-2.5 rounded-lg border text-xs transition-all ${
                                      pod.status === "Running"
                                        ? "bg-slate-50 border-slate-200"
                                        : "bg-amber-50 border-amber-300 opacity-60"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono font-bold text-slate-800">
                                        {pod.id}
                                      </span>
                                      <span
                                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                          pod.status === "Running"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-amber-200 text-amber-900"
                                        }`}
                                      >
                                        {pod.status}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                                      <Box className="w-3 h-3 text-blue-600" />
                                      <span>Container ({pod.version})</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="pt-2 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span>kubelet agent</span>
                            <span>
                              {isOffline ? "No heartbeat" : "Heartbeat OK"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Live Control Plane Event Log */}
                  <div className="bg-slate-900 rounded-xl p-3.5 text-xs font-mono">
                    <div className="text-slate-400 text-[11px] pb-1.5 mb-2 border-b border-slate-800 flex items-center justify-between">
                      <span>Control Plane Reconciliation Events</span>
                      <span>live-watch</span>
                    </div>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                      {eventLog.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-2 text-[11px]"
                        >
                          <span className="text-slate-500 shrink-0">
                            [{log.time}]
                          </span>
                          <span
                            className={
                              log.type === "error"
                                ? "text-rose-400"
                                : log.type === "warning"
                                  ? "text-amber-300"
                                  : log.type === "success"
                                    ? "text-emerald-400"
                                    : "text-slate-200"
                            }
                          >
                            {log.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            MODULE 4: END-TO-END REQUEST FLOW (CODE TO USER TRAFFIC)
        ================================================================== */}
        {activeSection === "flow" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100 mb-2">
                  <Network className="w-3.5 h-3.5" />
                  End-to-End Architecture
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  From YAML Manifest to Live User Traffic
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Step through the 5 stages of how a Kubernetes deployment goes
                  live and serves real users.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setE2eAutoPlay((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    e2eAutoPlay
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {e2eAutoPlay ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {e2eAutoPlay ? "Pause Auto-Play" : "Auto-Play Flow"}
                  </span>
                </button>
              </div>
            </div>

            {/* 5-Stage Visual Pipeline Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                {
                  key: "dev",
                  label: "Developer / CI",
                  sub: "kubectl apply",
                  icon: Terminal,
                },
                {
                  key: "control",
                  label: "Control Plane",
                  sub: "API + etcd + Sched",
                  icon: Cpu,
                },
                {
                  key: "nodes",
                  label: "Worker Nodes",
                  sub: "Kubelet + Pods",
                  icon: Server,
                },
                {
                  key: "service",
                  label: "K8s Service",
                  sub: "Load Balancer",
                  icon: Network,
                },
                {
                  key: "users",
                  label: "End Users",
                  sub: "Browser Traffic",
                  icon: Globe,
                },
              ].map((stage, index) => {
                const Icon = stage.icon;
                const isCurrent = e2eStep === index;
                const isPast = e2eStep > index;

                return (
                  <button
                    key={stage.key}
                    onClick={() => {
                      setE2eAutoPlay(false);
                      setE2eStep(index);
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                      isCurrent
                        ? "bg-blue-50/70 border-blue-600 shadow-sm"
                        : isPast
                          ? "bg-slate-50 border-emerald-300"
                          : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`p-2 rounded-lg ${
                          isCurrent
                            ? "bg-blue-600 text-white"
                            : isPast
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {stage.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{stage.sub}</p>
                  </button>
                );
              })}
            </div>

            {/* Active Stage Spotlight Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                    {E2E_STEPS[e2eStep].actor}
                  </span>
                  <code className="text-xs font-mono bg-white px-2.5 py-0.5 rounded border border-slate-200 text-slate-700">
                    {E2E_STEPS[e2eStep].command}
                  </code>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {E2E_STEPS[e2eStep].title}
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {E2E_STEPS[e2eStep].description}
                </p>
              </div>

              {/* Prev / Next Navigation */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setE2eAutoPlay(false);
                    setE2eStep(
                      (prev) =>
                        (prev - 1 + E2E_STEPS.length) % E2E_STEPS.length,
                    );
                  }}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setE2eAutoPlay(false);
                    setE2eStep((prev) => (prev + 1) % E2E_STEPS.length);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            MODULE 5: DEVELOPER CHEAT SHEET / GLOSSARY
        ================================================================== */}
        {activeSection === "glossary" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  Quick Reference
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Beginner Developer Cheat Sheet
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Plain-English definitions and everyday analogies for core
                  Docker & Kubernetes terms.
                </p>
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Pod, Node, Service..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                "All",
                "Docker",
                "Kubernetes Core",
                "Concepts",
                "Workloads",
                "Networking",
                "Scaling",
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Glossary Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGlossary.map((item) => (
                <div
                  key={item.term}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900">
                      {item.term}
                    </h3>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {item.plainEnglish}
                  </p>
                  <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-500">
                    <strong className="text-slate-700">Analogy:</strong>{" "}
                    {item.analogy}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}