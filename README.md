# 💈 Peluquería Web - Frontend (Angular 17)

Aplicación Web de Single Page Application (SPA) para la plataforma de reserva de citas y gestión de peluquería/barbería. Desarrollada en **Angular 17** con arquitectura desacoplada, consumo de API REST securizada mediante JWT y diseño totalmente adaptativo.

---

## 🚀 Visión General y Arquitectura

El frontend actúa como la interfaz pública y administrativa de la plataforma, conectándose mediante peticiones HTTP asíncronas con el backend en Spring Boot.

### Aspectos Clave de la Arquitectura:
- **Single Page Application (SPA):** Navegación fluida sin recargas de página mediante el Angular Router.
- **Seguridad e Interceptores:** Uso de `HttpInterceptor` para inyectar automáticamente los tokens de autenticación JWT (`Bearer`) en cada solicitud protegida.
- **Protección de Rutas:** Aplicación de `CanActivate` guards (`authGuard`, `roleGuard`, `setupGuard`) para gestionar permisos según roles de usuario (`CLIENT`, `WORKER`, `ADMIN`).
- **Despliegue Contenerizado:** Servido mediante un servidor web **Nginx** optimizado dentro de un contenedor Docker.

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión / Detalle | Descripción |
| :--- | :--- | :--- |
| **Framework Base** | Angular 17.3.0 | Framework SPA modular con arquitectura basada en componentes. |
| **Lenguaje** | TypeScript 5.4.2 | Tipado estático y compilación robusta. |
| **Gestión Reactiva** | RxJS 7.8.0 | Manejo de flujos de datos asíncronos y peticiones HTTP. |
| **Pruebas** | Jasmine 5.1 & Karma 6.4 | Framework de testing unitario e integrador. |
| **Estilos** | CSS3 / Flexbox / Grid | Diseño moderno, responsivo y dinámico sin dependencias pesadas. |
| **Servidor Producción** | Nginx | Servidor web liviano para entrega de assets estáticos compilados. |

---

## ✨ Características Principales

1. **Portal Público:**
   - **Página de Inicio:** Presentación de la marca, enlaces rápidos a reservas y servicios destacados.
   - **Catálogo interactivo:** Visualización de servicios clasificados por categorías con precios y tiempos de atención.
   - **Blog Informativo:** Lectura de artículos y novedades con rutas amigables (`slugs`).
2. **Sistema de Citas y Reservas:**
   - Selección interactiva de profesional (trabajador), servicio deseado y fecha.
   - Cálculo en tiempo real de huecos horarios disponibles devueltos por el backend.
   - **Portal del Cliente ("Mis Citas"):** Consulta del historial de citas agendadas, estados y cancelación.
3. **Panel de Administración y Personal:**
   - Panel de control restringido para administradores y empleados.
   - Registro y gestión de trabajadores, asignación de turnos y descansos.
4. **Asistente de Inicialización (First-Time Setup):**
   - Redirección automática a la vista de `/setup` si la API backend indica que la plataforma no posee administradores configurados.

---

## 📁 Estructura del Proyecto

```text
peluqueria/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── admin/             # Vistas del Panel de Administración (Dashboard, Registro de Staff)
│   │   │   ├── client/            # Módulos de Reserva interactiva y "Mis Citas"
│   │   │   └── public/            # Home, Catálogo, Blog, Login, Registro y Setup Inicial
│   │   ├── core/                  # Interfaces y configuraciones globales
│   │   ├── guards/                # Router Guards (authGuard, roleGuard, setupGuard)
│   │   ├── interceptors/          # Interceptor HTTP para adjuntar Token JWT
│   │   ├── models/                # Interfaces de datos (User, Appointment, ServiceItem, Worker, etc.)
│   │   ├── services/              # Servicios de integración con los endpoints REST backend
│   │   ├── app.component.ts       # Componente raíz
│   │   └── app.routes.ts          # Definición del mapa de rutas y guardias de seguridad
│   ├── assets/                    # Recursos estáticos (imágenes, iconos, fuentes)
│   └── styles.css                 # Estilos globales de la aplicación
├── Dockerfile                     # Construcción Multi-stage (Node.js build + Nginx runtime)
├── nginx.conf                     # Configuración de Nginx para SPA (fallback a index.html)
└── package.json                   # Dependencias y scripts de ejecución
```

---

## 🚦 Puesta en Marcha Local

### Requisitos Previos
- **Node.js:** Versión 18.x o 20.x LTS.
- **npm:** Incluido con Node.js.
- **Angular CLI:** `npm install -g @angular/cli` (Opcional, se puede usar mediante `npm`).

### Opción A: Ejecución en Desarrollo (Local)

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar el servidor de desarrollo:**
   ```bash
   npm start
   # o bien: ng serve
   ```

3. Acceder en el navegador a `http://localhost:4200`.

---

### Opción B: Despliegue con Docker Compose (Recomendado junto al Backend)

El proyecto incluye soporte para Docker Compose orquestado conjuntamente con la base de datos MySQL y el Backend Spring Boot.

Desde la carpeta raíz donde se encuentre el archivo `docker-compose.yml` (ubicado en el repositorio backend):

```bash
docker-compose up -d --build
```

- **Frontend Angular (Nginx):** Accedible en `http://localhost:8082` (o `http://127.0.0.1:8082`).

---

## 🗺️ Vistas y Rutas Principales

| Ruta SPA | Descripción | Acceso / Permiso |
| :--- | :--- | :--- |
| `/` | Página principal de la peluquería. | Público |
| `/catalog` | Catálogo completo de servicios disponibles. | Público |
| `/blog` | Listado de artículos publicados. | Público |
| `/blog/:slug` | Detalle del artículo del blog. | Público |
| `/login` | Formulario de inicio de sesión. | Público |
| `/register` | Registro de nuevos clientes. | Público |
| `/reservar` | Wizard interactivo de reserva de cita. | Público / Cliente |
| `/mis-citas` | Consulta y gestión de citas del usuario. | Cliente autenticado |
| `/admin` | Panel de administración de citas y servicios. | `ROLE_ADMIN`, `ROLE_WORKER` |
| `/admin/workers/register` | Registro de nuevo personal técnico. | `ROLE_ADMIN` |
| `/setup` | Asistente de configuración inicial del primer administrador. | `setupGuard` (Solo si no hay Admin) |
