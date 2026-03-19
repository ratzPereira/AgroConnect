<p align="center">
  <img src="docs/assets/logo.png" alt="AgroConnect" width="200" />
</p>

<h1 align="center">AgroConnect</h1>

<p align="center">
  <strong>Marketplace de Serviços Agrários com Backoffice Operacional</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-yellow" alt="Status" />
  <img src="https://img.shields.io/badge/spring%20boot-3.x-6DB33F?logo=springboot&logoColor=white" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/react-18-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/postgresql-16%20+%20PostGIS-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/docker-compose-2496ED?logo=docker&logoColor=white" alt="Docker" />
</p>

---

## Sobre

O **AgroConnect** é uma plataforma web e mobile (PWA) que liga agricultores a prestadores de serviços agrários — lavoura, pulverização, colheita, jardinagem, transporte, entre outros.

O agricultor publica um pedido geolocalizado, prestadores da zona respondem com propostas e preços, o agricultor escolhe, o pagamento fica retido em escrow até confirmação do trabalho, e ambas as partes avaliam-se mutuamente. Do lado do prestador, existe um backoffice completo para gestão de equipas, maquinaria, inventários e faturação.

> **Projeto Final de Curso** — Licenciatura em Engenharia Informática, Universidade Aberta (2025/2026)
> Orientador: Professor Ricardo Baptista

---

## Funcionalidades Principais

**Marketplace**

- Pedidos geolocalizados com formulários dinâmicos por categoria de serviço
- Propostas com comparação de preço, rating e histórico do prestador
- Sistema de pagamento com escrow (Stripe Connect em modo test + wallet interna)
- Avaliação bidirecional (cliente ↔ prestador)

**Backoffice do Prestador**

- Gestão de equipas (gestor, chefe de equipa, operador de campo)
- Gestão de maquinaria com estados e alertas de manutenção
- Controlo de inventário com alertas de stock
- Calendário de operações e dashboard financeiro

**Execução no Terreno**

- Check-in do operador com validação GPS
- Upload de fotos geolocalizadas como prova de execução
- Registo de materiais consumidos

**Administração**

- Dashboard de métricas globais
- Resolução de disputas
- Moderação de conteúdos e configuração da plataforma

---

## Stack Tecnológica

| Camada         | Tecnologia                                         |
| -------------- | -------------------------------------------------- |
| Backend        | Spring Boot 3 · Java 17 · Spring Security · JWT    |
| Frontend       | React 18 · TypeScript · Tailwind CSS · React Query |
| Base de Dados  | PostgreSQL 16 · PostGIS · Flyway                   |
| Cache          | Redis 7                                            |
| Pagamentos     | Stripe Connect (test mode) · Wallet interna        |
| File Storage   | MinIO (S3-compatible)                              |
| Mapas          | Leaflet · OpenStreetMap · CartoDB Voyager          |
| Tempo Real     | Spring WebSocket (STOMP/SockJS)                    |
| Mobile         | PWA (Progressive Web App)                          |
| Infraestrutura | Docker Compose · Nginx · GitHub Actions            |
| Monitorização  | Prometheus · Grafana                               |
| Qualidade      | SonarQube · JUnit 5 · Mockito · Testcontainers     |
| API Docs       | springdoc-openapi (Swagger UI)                     |

---

## Arquitetura

```
                    ┌──────────────┐     ┌─────────────────┐
                    │   Cliente    │     │   Prestador     │
                    │  (Browser)   │     │  (PWA Mobile)   │
                    └──────┬───────┘     └────────┬────────┘
                           │                      │
                           ▼                      ▼
               ┌───────────────────────────────────────────┐
               │          Nginx (reverse proxy)            │
               │     serve static  ·  proxy /api/*         │
               └─────────┬─────────────────┬───────────────┘
                         │                 │
                         ▼                 ▼
              ┌──────────────┐    ┌─────────────────┐   ┌─────────┐
              │    React     │    │  Spring Boot 3  │──▶│ Stripe  │
              │  (static)    │    │   REST + WS     │   │ (test)  │
              └──────────────┘    └────┬───┬───┬────┘   └─────────┘
                                       │   │   │
                          ┌────────────┘   │   └────────────┐
                          ▼                ▼                ▼
                  ┌──────────────┐ ┌─────────────┐ ┌─────────────┐
                  │ PostgreSQL   │ │    Redis     │ │    MinIO    │
                  │  + PostGIS   │ │  Cache/PubSub│ │  (S3 files) │
                  └──────────────┘ └─────────────┘ └─────────────┘
```

---

## Quick Start

**Pré-requisitos:** Docker e Docker Compose instalados.

```bash
# Clonar o repositório
git clone https://github.com/[username]/agroconnect.git
cd agroconnect

# Copiar variáveis de ambiente
cp .env.example .env

# Levantar tudo
docker compose -f docker-compose.dev.yml up

# Aceder à aplicação
# App:         http://localhost
# Swagger UI:  http://localhost/swagger-ui.html
# MinIO:       http://localhost:9001
# Grafana:     http://localhost:3001
```

---

## Estrutura do Repositório

```
agroconnect/
├── backend/              # Spring Boot (Maven)
│   ├── src/main/java/    # Código-fonte
│   └── src/test/java/    # Testes (unit + integration)
├── frontend/             # React + TypeScript (Vite)
│   └── src/
├── docker/               # Dockerfiles e configs (Nginx, Prometheus, Grafana)
├── seed/                 # Scripts de dados de demonstração
├── docs/                 # Documentação e diagramas
│   └── assets/           # Logo e recursos visuais
├── docker-compose.yml    # Produção
├── docker-compose.dev.yml # Desenvolvimento
├── CLAUDE.md             # Regras de desenvolvimento
├── ROADMAP.md            # Plano de trabalho detalhado
├── DESIGN_SYSTEM.md      # Sistema de design e UI
└── README.md
```

---

## Roadmap

| Fase     | Entrega                                             | Estado      |
| -------- | --------------------------------------------------- | ----------- |
| Sprint 0 | Infraestrutura: Docker, CI/CD, schema BD, seed data | 🔄 Em curso |
| Sprint 1 | Autenticação, perfis, RBAC, categorias              | ⬜ Pendente |
| Sprint 2 | Pedidos, propostas, geolocalização, frontend wizard | ⬜ Pendente |
| Sprint 3 | Escrow, Stripe, execução no terreno, avaliações     | ⬜ Pendente |
| Sprint 4 | Backoffice: equipas, máquinas, inventário, finanças | ⬜ Pendente |
| Sprint 5 | Admin, monitorização, chat                          | ⬜ Pendente |
| Sprint 6 | Polish, load tests, documentação, demo              | ⬜ Pendente |

---

## Licença

Este projeto foi desenvolvido no âmbito do Projeto Final de Curso da Licenciatura em Engenharia Informática da Universidade Aberta. Todos os direitos reservados.
