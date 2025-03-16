# Programming Requests

Full-Stack Project with React, Vite, Spring Boot, and MySQL

## Technologies Used

| Frontend                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Backend                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Database                                                                                                                                                | DevOps                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/react.png" alt="React" title="React"/><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/typescript.png" alt="TypeScript" title="TypeScript"/><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/vite.png" alt="Vite" title="Vite"/><img width="50" src="https://avatars.githubusercontent.com/u/79146003?s=200&v=4" alt="Mantine" title="Mantine"/> | <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/java.png" alt="Java" title="Java"/><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/spring_boot.png" alt="Spring Boot" title="Spring Boot"/><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/lombok.png" alt="Lombok" title="Lombok"/> | <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/mysql.png" alt="MySQL" title="MySQL"/> | <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/docker.png" alt="Docker" title="Docker"/> |

## Motivation

I never really thought about making a portfolio... until I realized I didn’t have one. So I decided to build one by creating projects with the tech I know while experimenting with new stuff. But I didn’t want to make the usual stuff like calculators, shopping carts, or employee databases. That’s just boring.

So, I came up with a new project: a website where people submit project ideas. I make them, showcase them on another site, and boom! portfolio! There’s even a voting system, so the most popular ideas get priority. That way, I’m not just creating random projects, I’m letting the internet decide my fate. What could possibly go wrong?

## Project Structure

The repository is organized as follows:

```
programmingrequests/
├── gradle
│   └── wrapper
└── src
    ├── main
    │   ├── java
    │   │   └── com
    │   │       └── feuerschvenger
    │   │           └── pr
    │   │               ├── config
    │   │               ├── controller
    │   │               ├── model
    │   │               │   └── helper
    │   │               ├── repository
    │   │               └── service
    │   ├── react
    │   │   └── programmingrequests
    │   │       ├── public
    │   │       └── src
    │   │           ├── assets
    │   │           ├── components
    │   │           │   ├── Footer
    │   │           │   ├── IdeasList
    │   │           │   ├── Logo
    │   │           │   └── SubmitIdeaForm
    │   │           │       └── components
    │   │           │           └── CustomForm
    │   │           │               ├── components
    │   │           │               └── models
    │   │           ├── context
    │   │           ├── hooks
    │   │           ├── models
    │   │           ├── services
    │   │           └── utils
    │   └── resources
    └── test
        └── java
            └── com
                └── feuerschvenger
                    └── pr
```

- **backend** (src/main/java/com/feuerschvenger/pr): Contains the Spring Boot application.

- **frontend** (src/main/react/programmingrequests): Contains the React application built with Vite.

## Getting Started

To run the project locally using Docker Compose:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/kfeuerschvenger/programmingrequests.git
   cd programmingrequests
   ```

2. **Build and start the services**:

   ```bash
   docker compose up -d --build
   ```

   This command will:

   - Build the Docker images for both the backend and frontend.
   - Start the MySQL database service.
   - Launch the backend and frontend services, connecting them appropriately.

3. **Access the applications**:

   - **Frontend**: Navigate to `http://localhost` to view the React application.
   - **Backend**: The Spring Boot API is accessible at `http://localhost:8080`.
