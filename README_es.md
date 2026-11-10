<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/brand/banner-dark.svg">
    <img src="docs/assets/brand/banner-light.png" alt="Code Quests: Publica una misión. Deja que el héroe programe. Un tablón de misiones de madera con pergaminos, sellos de lacre y un cartel colgante" width="100%">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/kfeuerschvenger/programmingrequests/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/kfeuerschvenger/programmingrequests/ci.yml?branch=main&style=flat-square&label=CI&logo=githubactions&logoColor=white" alt="Estado de CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/licencia-MIT-9E2B25?style=flat-square" alt="Licencia MIT"></a>
  <img src="https://img.shields.io/badge/Java-25-ED8B00?style=flat-square&logo=openjdk&logoColor=white" alt="Java 25">
  <img src="https://img.shields.io/badge/Spring%20Boot-4.1-6DB33F?style=flat-square&logo=springboot&logoColor=white" alt="Spring Boot 4.1">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 6">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8">
  <img src="https://img.shields.io/badge/MySQL-8.4-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL 8.4">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker Compose">
</p>

<p align="center"><a href="README.md">English</a> · <strong>Español</strong></p>

<p align="center">
  <img src="docs/assets/screens/hero.gif" alt="De noche, se publica una misión nueva en el tablón, queda clavada entre las demás, se la respalda con un clic y el sello de lacre estampa su nuevo puntaje" width="100%">
</p>

**Code Quests es un tablón de misiones para ideas de programación: publica una y deja que el reino la respalde o la rechace.**

Cada idea es un pergamino clavado en un tablón de madera. Los visitantes respaldan una misión o la rechazan, y el puntaje se estampa en lacre. No hay cuentas ni registros: una identidad de votante anónima y con hash garantiza un solo voto por persona y por misión.

De día, el sol recorre el tablón. De noche, una antorcha, un farol y una vela toman el relevo, y su luz titila sobre cada pergamino.

Empezó como un portfolio que no lo era. En ese momento su autor no tenía ninguno, así que el sitio hacía las veces de seudo-portfolio mientras los visitantes sugerían los proyectos que querían ver construidos. Ese portfolio hoy vive en [feuerschvenger.com](https://feuerschvenger.com/), y el tablón sigue en pie para las misiones que todavía esperan a su héroe.

## Recorrido

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/top-night.framed.webp" alt="La página de Code Quests de noche, con el cartel colgante del título, una antorcha, un farol y el formulario para publicar una misión">
      <p><strong>Taberna a la luz de las velas.</strong> Una antorcha, un farol y una vela iluminan el tablón de noche, y el fuego titila sobre cada pergamino.</p>
    </td>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/top-day.framed.webp" alt="La página de Code Quests de día, con luz solar desde la esquina superior izquierda, el cartel colgante del título y el formulario para publicar una misión">
      <p><strong>Sol sobre el tablón.</strong> De día la luz llega desde arriba a la izquierda, y el mismo tablón parece otra sala.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/board-night.framed.webp" alt="El tablón de misiones de noche con pergaminos clavados en una disposición tipo mosaico, cada uno con un sello de lacre que muestra su puntaje">
      <p><strong>Cada misión, clavada.</strong> Pergaminos de cualquier largo se acomodan en un mosaico, cada uno con su puntaje estampado en un sello de lacre.</p>
    </td>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/board-day.framed.webp" alt="El tablón de misiones de día con las primeras misiones y sus sellos de lacre">
      <p><strong>Respáldala o recházala.</strong> Un clic respalda una misión, otro la rechaza, y el sello cambia al instante, antes de que el servidor responda.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/quest-expanded.framed.webp" alt="Una misión larga abierta con Read more">
      <p><strong>Las historias largas son bienvenidas.</strong> Una misión extensa se pliega tras Read more, para que una sola epopeya no acapare el tablón.</p>
    </td>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/post-quest-errors.framed.webp" alt="El formulario para publicar una misión con mensajes de validación">
      <p><strong>Errores que se explican solos.</strong> El formulario indica qué falla en cada campo antes de enviar nada al servidor.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/voting-rules.framed.webp" alt="El cuadro con las reglas de votación, de noche">
      <p><strong>Conoce las reglas del reino.</strong> Un voto por misión, que puedes cambiar o retirar cuando quieras, todo explicado con la voz del gremio.</p>
    </td>
    <td width="50%" valign="top">
      <img src="docs/assets/screens/mobile-day.framed.webp" alt="El tablón en un teléfono, de día" width="46%">&nbsp;
      <img src="docs/assets/screens/mobile-night.framed.webp" alt="El tablón en un teléfono, de noche" width="46%">
      <p><strong>Aventuras de bolsillo.</strong> El tablón cabe en un teléfono con sol o con velas, y el fuego baja el ritmo para ahorrar batería.</p>
    </td>
  </tr>
</table>

### Qué lo hace especial

- **Sin cuentas, pero un votante, un voto.** El servidor calcula un hash de la dirección del visitante con un secreto, guarda solo el hash y nunca confía en un encabezado que el cliente pueda falsificar.
- **Votos transaccionales.** Un bloqueo de fila y una restricción de unicidad mantienen cada puntaje igual a la suma de sus votos, incluso con mucha gente.
- **Con límite de frecuencia.** Publicar y votar tienen cupos propios, y una llamada limitada indica cuánto esperar.
- **Día y noche, con fuego en vivo.** La escena sigue tu esquema de color, y el fuego se detiene si se pide reducir el movimiento.
- **Accesible y probado.** Una región en vivo anuncia los votos, el fuego respeta el movimiento reducido y ambas mitades corren con umbrales de cobertura en CI.
- **Capturas reproducibles.** Cada imagen de aquí la toma un script contra una demo con datos fijos, así que pueden repetirse tras cada cambio.

Un voto recorre este camino, y la base de datos tiene la última palabra:

```mermaid
%%{init: {'theme':'base','themeVariables':{'fontFamily':'Segoe UI, Helvetica, Arial, sans-serif','primaryColor':'#F3E6C8','primaryBorderColor':'#3B2A1E','primaryTextColor':'#2B2622','lineColor':'#8A6414','textColor':'#2B2622','edgeLabelBackground':'#FBF5E7'}}}%%
flowchart LR
  B["Navegador<br/>clic optimista"] -->|"PUT /api/ideas/id/vote"| N["nginx<br/>indica la dirección real"]
  N --> A["API<br/>límite de frecuencia, HMAC de la dirección"]
  A --> T["Transacción<br/>bloquea la fila de la idea"]
  T --> M[("MySQL<br/>único por votante e idea")]
  M -->|"nuevo puntaje y myVote"| B
  classDef parchment fill:#F3E6C8,stroke:#3B2A1E,color:#2B2622
  classDef brass fill:#F6E7BE,stroke:#8A6414,color:#5A410B
  classDef guild fill:#D9E8D5,stroke:#3F6B3A,color:#2A4727
  classDef wax fill:#F6DAD6,stroke:#9E2B25,color:#6B1D19
  class B parchment
  class N brass
  class A,T guild
  class M wax
```

## Bajo el capó

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/diagrams/architecture-dark.svg">
  <img src="docs/assets/diagrams/architecture.svg" alt="El navegador llega a nginx, directamente o a través de un proxy de borde opcional; nginx reenvía solo /api a la API de Spring Boot, que guarda los datos en MySQL sobre tres redes privadas de Docker" width="100%">
</picture>

Una aplicación de página única en React la sirve nginx, que reenvía solo `/api` a una API de Spring Boot en capas: controlador, handler, servicio y repositorio. MySQL guarda los datos con migraciones de Flyway, tres redes privadas de Docker mantienen la base de datos fuera de alcance y la cadena de proxies de confianza decide a quién se le cree la dirección del visitante.

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

## Inicio rápido

Solo necesitas Docker en ejecución.

```bash
git clone https://github.com/kfeuerschvenger/programmingrequests.git && cd programmingrequests
cp .env.example .env
docker compose up -d --build
```

Completa `.env` antes del último comando: los nombres y contraseñas de la base de datos, y un `VOTER_HASH_SECRET` de al menos 32 bytes.

> [!TIP]
> El compose de producción no publica el puerto del servicio web. Para abrir el tablón en tu equipo, agrega un `docker-compose.override.yml` que mapee `127.0.0.1:8081:80` en el servicio `web` y visita http://localhost:8081. Ese archivo, todas las variables, el flujo de desarrollo y el stack de demostración están en [ENVIRONMENT.md](docs/ENVIRONMENT.md).

## Profundiza

El README es el aviso en el tablón. Los documentos técnicos son los archivos del gremio. Están escritos en inglés.

| Documento | Qué encontrarás |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | Las capas del backend, la cadena de identidad del votante, el bloqueo de votos, el esquema, el frontend y la escena |
| [Environment](docs/ENVIRONMENT.md) | Todas las variables, los servicios y redes de compose, la cadena de proxies y los flujos de desarrollo y demostración |
| [Testing](docs/TESTING.md) | Niveles de prueba, Testcontainers, los umbrales de cobertura y el pipeline que toma estas capturas |
| [CI](docs/CI.md) | Los tres trabajos, Dependabot y el flujo de ramas |
| [API](docs/API.md) | Cada endpoint, códigos de error, límites de frecuencia e identidad del votante |
| [Roadmap](docs/ROADMAP.md) | Las próximas misiones y lo que necesita cada una para comenzar |
| [openapi.yaml](docs/openapi.yaml) | El contrato HTTP completo, exportado de la API en ejecución |
| [Asset licences](docs/ASSETS-LICENSES.md) | De dónde sale cada tipografía, textura e imagen generada |
| [Showcase guide](e2e/showcase/README.md) | Cómo repetir las capturas y la animación principal |

---

<p align="center">
  <strong>Forjado en Argentina · donde las misiones nunca se acaban</strong><br>
  Forjado con dedicación (y unos cuantos dragones vencidos) por <strong>Kevin Feuerschvenger</strong> · Software Engineer
</p>

<p align="center">
  <a href="https://github.com/kfeuerschvenger"><img src="https://img.shields.io/badge/GitHub-kfeuerschvenger-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"></a>
  <a href="https://www.linkedin.com/in/kevin-feuerschvenger/"><img src="https://img.shields.io/badge/LinkedIn-kevin--feuerschvenger-0A66C2?style=flat-square&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI%2BPHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0yMC40NSAyMC40NWgtMy41NnYtNS41N2MwLTEuMzMtLjAyLTMuMDQtMS44NS0zLjA0LTEuODUgMC0yLjE0IDEuNDUtMi4xNCAyLjk0djUuNjdIOS4zNVY5aDMuNDF2MS41NmguMDVjLjQ4LS45IDEuNjQtMS44NSAzLjM3LTEuODUgMy42IDAgNC4yNyAyLjM3IDQuMjcgNS40NnY2LjI4ek01LjM0IDcuNDNhMi4wNiAyLjA2IDAgMSAxIDAtNC4xMyAyLjA2IDIuMDYgMCAwIDEgMCA0LjEzek03LjEyIDIwLjQ1SDMuNTZWOWgzLjU2djExLjQ1eiIvPjwvc3ZnPg%3D%3D" alt="LinkedIn"></a>
  <a href="https://feuerschvenger.com/"><img src="https://img.shields.io/badge/Portfolio-feuerschvenger.com-9E2B25?style=flat-square&logo=googlechrome&logoColor=white" alt="Portfolio"></a>
</p>

<p align="center"><sub>Publicado bajo la <a href="LICENSE">licencia MIT</a>.</sub></p>
