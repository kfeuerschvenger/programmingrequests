<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/brand/banner-dark.svg">
    <img src="docs/assets/brand/banner-light.png" alt="Code Quests: Post a quest. Let the hero code. A wooden quest board with parchments, wax seals and a hanging sign" width="100%">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/kfeuerschvenger/code-quests/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/kfeuerschvenger/code-quests/ci.yml?branch=main&style=flat-square&label=CI&logo=githubactions&logoColor=white" alt="CI status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/licence-MIT-9E2B25?style=flat-square" alt="MIT licence"></a>
  <img src="https://img.shields.io/badge/Java-25-ED8B00?style=flat-square&logo=openjdk&logoColor=white" alt="Java 25">
  <img src="https://img.shields.io/badge/Spring%20Boot-4.1-6DB33F?style=flat-square&logo=springboot&logoColor=white" alt="Spring Boot 4.1">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 6">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8">
  <img src="https://img.shields.io/badge/MySQL-8.4-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL 8.4">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker Compose">
</p>

<p align="center"><strong>English</strong> · <a href="README_es.md">Español</a></p>

<p align="center">
  <img src="docs/assets/screens/hero.gif" alt="At night, a new quest is posted on the board, pinned among the others, backed with a click, and the wax seal stamps its new score" width="100%">
</p>

**Code Quests is a quest board for programming ideas: post one, and let the realm back it or reject it.**

Every idea is a parchment pinned to a wooden board. Visitors back a quest or reject it, and the score is stamped in wax. There are no accounts and no sign-ups: a hashed, anonymous voter identity keeps it to one vote per person per quest.

By day the sun climbs over the board. By night a torch, a lantern and a candle take over, and their light flickers across every parchment.

It began as a portfolio that was not one. Back then its author had none, so the site doubled as a pseudo-portfolio while visitors suggested the projects they wanted to see built. That portfolio now lives at [feuerschvenger.com](https://feuerschvenger.com/), and the board stays on for the quests still waiting for a hero.

## Take the tour

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/top-night.framed.webp" alt="The Code Quests page at night, with a hanging title sign, a torch, a lantern and the form for posting a quest">
      <p><strong>Candle-lit tavern.</strong> A torch, a lantern and a candle light the board by night, and the fire flickers on every parchment.</p>
    </td>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/top-day.framed.webp" alt="The Code Quests page by day, with sunlight from the top left, the hanging title sign and the form for posting a quest">
      <p><strong>Sunlight on the board.</strong> By day the light comes from the top left, and the same board looks like a different room.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/board-night.framed.webp" alt="The quest board at night with parchments pinned in a masonry layout, each with a wax seal showing its score">
      <p><strong>Every quest, pinned.</strong> Parchments of any length settle into a masonry layout, each with its score stamped in a wax seal.</p>
    </td>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/board-day.framed.webp" alt="The quest board by day with the first quests and their wax seals">
      <p><strong>Back it or reject it.</strong> One click backs a quest, another rejects it, and the seal changes at once, before the server has even answered.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/quest-expanded.framed.webp" alt="A long quest opened with Read more">
      <p><strong>Long tales welcome.</strong> A quest that runs long folds behind Read more, so one epic never hogs the board.</p>
    </td>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/post-quest-errors.framed.webp" alt="The post a quest form showing validation messages">
      <p><strong>Errors that explain themselves.</strong> The form says what is wrong with each field before anything is sent to the server.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/voting-rules.framed.webp" alt="The voting rules modal at night">
      <p><strong>Know the rules of the realm.</strong> One vote per quest, switch it or withdraw it whenever you like, all explained in the guild's own voice.</p>
    </td>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/mobile-day.framed.webp" alt="The board on a phone by day" width="46%">&nbsp;
      <img src="docs/assets/screens/mobile-night.framed.webp" alt="The board on a phone at night" width="46%">
      <p><strong>Pocket-sized adventures.</strong> The board fits a phone in sun or candlelight, and the fire slows down to save the battery.</p>
    </td>
  </tr>
</table>

### What makes it special

- **No accounts, still one voter, one vote.** The server hashes the visitor's address with a secret, stores only the hash, and never trusts a header the client can forge.
- **Transactional votes.** A row lock and a unique constraint keep every score equal to the sum of its votes, even under a crowd.
- **Rate limited.** Posting and voting have their own allowances, and a limited call says how long to wait.
- **Day and night, with live firelight.** The scene follows your colour scheme, and the fire stands still under reduced motion.
- **Accessible and tested.** A live region announces votes, the fire respects reduced motion, and both halves run behind coverage gates in CI.
- **Reproducible screenshots.** Every picture here is taken by a script against a seeded demo, so they can be retaken after every change.

A vote takes this road, and the database has the last word:

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Segoe UI, Helvetica, Arial, sans-serif','primaryColor':'#F3E6C8','primaryBorderColor':'#3B2A1E','primaryTextColor':'#2B2622','lineColor':'#8A6414','textColor':'#2B2622','edgeLabelBackground':'#FBF5E7'}}}%%
flowchart LR
  B["Browser<br/>optimistic click"] -->|"PUT /api/ideas/id/vote"| N["nginx<br/>states the real address"]
  N --> A["API<br/>rate limit, HMAC of the address"]
  A --> T["Transaction<br/>lock the idea row"]
  T --> M[("MySQL<br/>unique per voter and idea")]
  M -->|"new score and myVote"| B
  classDef parchment fill:#F3E6C8,stroke:#3B2A1E,color:#2B2622
  classDef brass fill:#F6E7BE,stroke:#8A6414,color:#5A410B
  classDef guild fill:#D9E8D5,stroke:#3F6B3A,color:#2A4727
  classDef wax fill:#F6DAD6,stroke:#9E2B25,color:#6B1D19
  class B parchment
  class N brass
  class A,T guild
  class M wax
```

## Under the hood

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/diagrams/architecture-dark.svg">
  <img src="docs/assets/diagrams/architecture.svg" alt="The browser reaches nginx, directly or through an optional edge proxy; nginx forwards only /api to the Spring Boot API, which stores data in MySQL, which is reachable only on the private db_net network" width="100%">
</picture>

A React single page app is served by nginx, which proxies only `/api` to a layered Spring Boot API: controller, handler, service, repository. MySQL holds the data under Flyway migrations, two private Docker networks plus an edge network keep the database out of reach, because it is attached only to `db_net`, and the trusted proxy chain decides whose word counts about the visitor's address.

<p align="center">
  <img src="https://skillicons.dev/icons?i=java" alt="Java" title="Java" width="48">&nbsp;
  <img src="https://skillicons.dev/icons?i=spring" alt="Spring" title="Spring" width="48">&nbsp;
  <img src="https://skillicons.dev/icons?i=react" alt="React" title="React" width="48">&nbsp;
  <img src="https://skillicons.dev/icons?i=ts" alt="TypeScript" title="TypeScript" width="48">&nbsp;
  <img src="https://skillicons.dev/icons?i=vite" alt="Vite" title="Vite" width="48">&nbsp;
  <img src="https://skillicons.dev/icons?i=mysql" alt="MySQL" title="MySQL" width="48">&nbsp;
  <img src="https://skillicons.dev/icons?i=docker" alt="Docker" title="Docker" width="48">&nbsp;
  <img src="https://skillicons.dev/icons?i=nginx" alt="nginx" title="nginx" width="48">&nbsp;
  <img src="https://skillicons.dev/icons?i=githubactions" alt="GitHub Actions" title="GitHub Actions" width="48">
</p>

## Quick start

All you need is Docker, running.

```bash
git clone https://github.com/kfeuerschvenger/code-quests.git && cd code-quests
cp .env.example .env
docker compose up -d --build
```

Fill in `.env` before the last command: the database names and passwords, and a `VOTER_HASH_SECRET` of at least 32 bytes.

> [!TIP]
> The production compose does not publish the web port. To open the board on your own machine, add a `docker-compose.override.yml` that maps `127.0.0.1:8081:80` on the `web` service, and visit http://localhost:8081. That file, every variable, the development flow and the demo stack are in [ENVIRONMENT.md](docs/ENVIRONMENT.md).

## Dive deeper

The README is the notice on the board. The deep docs are the guild's archives.

| Document | The hook |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | Backend layers, the voter identity chain, vote locking, the schema, the frontend and the scene |
| [Environment](docs/ENVIRONMENT.md) | Every variable, the compose services and networks, the proxy chain, and the dev and demo flows |
| [Testing](docs/TESTING.md) | Test levels, Testcontainers, the coverage gates and the pipeline that takes these screenshots |
| [CI](docs/CI.md) | The three jobs, Dependabot and the branch flow |
| [API](docs/API.md) | Every endpoint, error codes, rate limits and voter identity |
| [Roadmap](docs/ROADMAP.md) | The next quests, and what each one needs before it starts |
| [openapi.yaml](docs/openapi.yaml) | The full HTTP contract, exported from the running API |
| [Asset licences](docs/ASSETS-LICENSES.md) | Where every font, texture and generated image comes from |
| [Showcase guide](e2e/showcase/README.md) | How to retake the screenshots and the hero animation |

---

<p align="center">
  <strong>Forged in Argentina · where the quests outnumber the mate gourds</strong><br>
  Forged with care (and a few dragons slain) by <strong>Kevin Feuerschvenger</strong> · Software Engineer
</p>

<p align="center">
  <a href="https://github.com/kfeuerschvenger"><img src="https://img.shields.io/badge/GitHub-kfeuerschvenger-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
  <a href="https://www.linkedin.com/in/kevin-feuerschvenger/"><img src="https://img.shields.io/badge/LinkedIn-kevin--feuerschvenger-0A66C2?style=flat-square&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI%2BPHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0yMC40NSAyMC40NWgtMy41NnYtNS41N2MwLTEuMzMtLjAyLTMuMDQtMS44NS0zLjA0LTEuODUgMC0yLjE0IDEuNDUtMi4xNCAyLjk0djUuNjdIOS4zNVY5aDMuNDF2MS41NmguMDVjLjQ4LS45IDEuNjQtMS44NSAzLjM3LTEuODUgMy42IDAgNC4yNyAyLjM3IDQuMjcgNS40NnY2LjI4ek01LjM0IDcuNDNhMi4wNiAyLjA2IDAgMSAxIDAtNC4xMyAyLjA2IDIuMDYgMCAwIDEgMCA0LjEzek03LjEyIDIwLjQ1SDMuNTZWOWgzLjU2djExLjQ1eiIvPjwvc3ZnPg%3D%3D" alt="LinkedIn"></a>
  <a href="https://feuerschvenger.com/"><img src="https://img.shields.io/badge/Portfolio-feuerschvenger.com-9E2B25?style=flat-square&logo=googlechrome&logoColor=white" alt="Portfolio"></a>
</p>

<p align="center"><sub>Released under the <a href="LICENSE">MIT licence</a>.</sub></p>
