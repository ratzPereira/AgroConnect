<p align="center">
  <img src="docs/assets/logo.png" alt="AgroConnect" width="200" />
</p>

<h1 align="center">AgroConnect</h1>

<p align="center">
  <strong>Marketplace de Serviços Agrários com Backoffice Operacional</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-pronto%20para%20defesa-success" alt="Status" />
  <img src="https://img.shields.io/badge/spring%20boot-3.x-6DB33F?logo=springboot&logoColor=white" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/postgresql-16%20+%20PostGIS-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/docker-compose-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/testes-639%20unit%20%2B%20168%20IT%20%2B%201331%20FE-brightgreen" alt="Testes" />
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
- Pagamento com escrow (Stripe Connect em modo test + wallet interna), captura imediata e libertação só após confirmação do cliente
- Janela de auto-confirmação para evitar pedidos eternamente em "aguarda confirmação"
- Avaliação bidirecional (cliente ↔ prestador) com janela temporal

**Backoffice do Prestador — "OS de operações"**

- **Inventário event-sourced**: livro de movimentos imutável (INITIAL / PURCHASE / CONSUMPTION / ADJUSTMENT_IN / ADJUSTMENT_OUT) com Weighted Average Cost (WAC) recalculado a cada entrada, soft-delete protegido e locking pessimista contra corridas em concurrent purchases
- **Job Costing**: cada execução completa reporta custo de materiais + mão-de-obra, com *snapshot* do preço unitário e da tarifa horária no momento da conclusão (relatórios históricos imunes a alterações futuras de catálogo)
- **Vista detalhada de máquina**: P&L por máquina (receita, custos de manutenção, despesas, utilização, rentabilidade), gráfico de trabalhos mensais e separadores Trabalhos / Manutenções / Despesas
- **Vista detalhada de operador**: agregados por membro de equipa (trabalhos, receita gerada, lucro, top máquinas) com tarifa horária editável e respeitada pelo cálculo de custos
- **Dashboard financeiro com lucro real**: janela anual + decomposição (receita, payouts, materiais, mão-de-obra, despesas de máquina, lucro líquido, margem), comparação ano-a-ano com delta percentual e gráfico mensal dual-bar
- **Calendário de operações**, gestão de equipas (gestor / chefe / operador) e maquinaria

**Execução no Terreno**

- Check-in do operador com validação GPS
- Upload de fotos geolocalizadas como prova de execução
- Registo de materiais consumidos (ligado ao inventário, drena stock e captura custo)

**Administração**

- Dashboard de métricas globais
- Resolução de disputas
- Moderação de conteúdos e configuração da plataforma

---

## Stack Tecnológica

| Camada         | Tecnologia                                         |
| -------------- | -------------------------------------------------- |
| Backend        | Spring Boot 3 · Java 17 · Spring Security · JWT    |
| Frontend       | React 19 · TypeScript · Tailwind v4 · Vite 8 · React Query · Recharts |
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

# Aceder à aplicação (dev)
# App:         http://localhost:10080
# Swagger UI:  http://localhost:10080/swagger-ui.html
# API direto:  http://localhost:18080/api/actuator/health
# MinIO:       http://localhost:19001
# PostgreSQL:  localhost:15432
# Redis:       localhost:16379
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
│   ├── assets/           # Logo e recursos visuais
│   ├── dev-journal/      # Notas de engenharia por iteração
│   └── plans/            # Designs e planos de implementação
├── docker-compose.yml    # Produção
├── docker-compose.dev.yml # Desenvolvimento
├── CLAUDE.md             # Regras de desenvolvimento
├── ROADMAP.md            # Plano de trabalho detalhado
├── DESIGN_SYSTEM.md      # Sistema de design e UI
└── README.md
```

---

## Roadmap

| Fase     | Entrega                                                              | Estado         |
| -------- | -------------------------------------------------------------------- | -------------- |
| Sprint 0 | Infraestrutura: Docker, CI/CD, schema BD, seed data                  | ✅ Concluído   |
| Sprint 1 | Autenticação, perfis, RBAC, categorias                               | ✅ Concluído   |
| Sprint 2 | Pedidos, propostas, geolocalização, frontend wizard                  | ✅ Concluído   |
| Sprint 3 | Escrow (Stripe Connect), execução no terreno, avaliações             | ✅ Concluído   |
| Sprint 4 | Backoffice: equipas, máquinas, inventário event-sourced, finanças    | ✅ Concluído   |
| Sprint 5 | Admin, monitorização, chat                                           | ✅ Concluído   |
| Sprint 6 | Provider management overhaul (P&L por máquina/operador, job costing) | ✅ Concluído   |
| Final    | Relatório final + defesa                                             | 🔄 Em curso    |

---

## Licença

Este projeto foi desenvolvido no âmbito do Projeto Final de Curso da Licenciatura em Engenharia Informática da Universidade Aberta. Todos os direitos reservados.
