# Backend – App de Prescripciones Médicas

API backend para una aplicación de gestión de prescripciones médicas desarrollada como prueba técnica full-stack.  
El sistema implementa autenticación segura, control de acceso por roles y generación de PDFs.

---

## 🧩 Stack Tecnológico

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT (Access Token + Refresh Token)
- RBAC (Role Based Access Control)
- PDF generation (**pdfkit**)
- Jest + Supertest

---

## 🎯 Descripción General

Sistema de prescripciones médicas con tres roles principales:

### Roles

- **Admin**
  - Acceso total al sistema
  - Visualización de métricas
- **Doctor**
  - Creación de prescripciones para pacientes
  - Visualización de sus propias prescripciones
- **Patient**
  - Visualización de sus prescripciones
  - Marcado de prescripciones como consumidas
  - Descarga de prescripciones en PDF

### Estados

- Prescripción:
  - `pending`
  - `consumed`

---

## 📁 Estructura del Proyecto

src/
├── main.ts
├── app.module.ts
├── auth/
│ ├── auth.module.ts
│ ├── auth.controller.ts
│ ├── auth.service.ts
│ ├── jwt.strategy.ts
│ ├── refresh.strategy.ts
│ └── roles.guard.ts
├── users/
│ ├── users.module.ts
│ ├── users.controller.ts
│ └── users.service.ts
├── doctors/
├── patients/
├── prescriptions/
│ ├── prescriptions.module.ts
│ ├── prescriptions.controller.ts
│ ├── prescriptions.service.ts
│ └── dto/
├── common/
│ ├── guards/
│ ├── filters/
│ └── interceptors/
└── prisma/
├── prisma.module.ts
├── prisma.service.ts
└── schema.prisma


---

## 🗄️ Base de Datos

- PostgreSQL
- ORM: Prisma
- Migraciones con Prisma Migrate
- Seed con datos de prueba

Relaciones principales:
- Usuarios con rol (`admin`, `doctor`, `patient`)
- Prescripciones asociadas a médicos y pacientes
- Ítems digitados manualmente por prescripción

---

## ⚙️ Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/prescriptions_db?schema=public"
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_TTL=900s
JWT_REFRESH_TTL=7d
APP_ORIGIN=http://localhost:3000
```

## 🚀 Instalación y Ejecución Local

### 1. Instalar dependencias

Comando para instalar todas las dependencias del proyecto:

    npm install

---

### 2. Ejecutar migraciones de base de datos

Aplica las migraciones de Prisma y crea las tablas en la base de datos:

    npx prisma migrate dev

---

### 3. Ejecutar seed (datos de prueba)

Ejecuta el script de seed para poblar la base de datos con información inicial:

    npx prisma db seed

Esto crea automáticamente los siguientes usuarios de prueba:

| Rol     | Email              | Password  |
|---------|--------------------|-----------|
| Admin   | admin@test.com     | admin123  |
| Doctor  | dr@test.com        | dr123     |
| Patient | patient@test.com   | patient123 |

También se generan prescripciones de ejemplo en estado `pending` y `consumed`.

---

### 4. Levantar el servidor en desarrollo

Inicia el servidor en modo desarrollo:

    npm run start:dev

La API quedará disponible en la siguiente URL:

    http://localhost:3001

---

## 🔐 Autenticación y Autorización

El sistema utiliza autenticación basada en JWT (JSON Web Tokens).

La autenticación se implementa utilizando **JWT (JSON Web Tokens)** junto con **cookies HTTP-Only** para mejorar la seguridad y la experiencia de usuario.
 
Este esquema permite mantener sesiones sin estado en el backend, facilitando la escalabilidad y el despliegue en entornos distribuidos.

Se utilizan **Access Tokens** de corta duración para proteger las rutas y **Refresh Tokens** para renovar la sesión sin necesidad de que el usuario vuelva a autenticarse, reduciendo el riesgo ante una posible filtración de credenciales.

El uso de **cookies HTTP-Only** evita el acceso a los tokens desde JavaScript, mitigando ataques de tipo **XSS**, mientras que la validación del token se realiza automáticamente en cada request.

El control de acceso se refuerza mediante **Guards y Decorators** de NestJS, lo que permite:
- Proteger rutas de forma declarativa y centralizada.
- Aplicar **RBAC (Role Based Access Control)** de manera clara y mantenible.
- Garantizar que cada usuario solo acceda a los recursos permitidos según su rol (Admin, Doctor o Patient).

Este enfoque proporciona una arquitectura **segura, escalable y alineada con buenas prácticas**, adecuada para un **MVP** pero fácilmente extensible a un entorno de producción.


- Login mediante email y contraseña.
- Uso de Access Token para proteger rutas.
- Uso de Refresh Token para renovar la sesión.
- Control de acceso por roles (RBAC) mediante Guards y Decorators.

Restricciones por rol:

- Doctor: solo puede crear y ver sus propias prescripciones.
- Patient: solo puede ver, consumir y descargar sus propias prescripciones.
- Admin: acceso completo al sistema y a las métricas.

---

## 📌 Endpoints Principales

### Auth

    POST /auth/login
    POST /auth/refresh
    GET  /auth/profile

### Prescripciones – Doctor

    POST /prescriptions
    GET  /prescriptions?mine=true
    GET  /prescriptions/:id

### Prescripciones – Patient

    GET  /me/prescriptions
    PUT  /prescriptions/:id/consume
    GET  /prescriptions/:id/pdf

### Admin

    GET /admin/prescriptions
    GET /admin/metrics

---

## 📄 Generación de PDF

Endpoint para descargar una prescripción en PDF:

    GET /prescriptions/:id/pdf

El PDF incluye:

- Código único de la prescripción
- Nombre del paciente
- Nombre del médico
- Fecha de creación
- Lista de ítems - Medicamentos:
  - Nombre
  - Dosis
  - Cantidad
  - Instrucciones
  - Notas

**PDFKIT** fue elegido para la generación de PDFs debido a que es una herramienta **ligera, minimalista y de rápida integración**, ideal para un **MVP**, ya que permite generar documentos dinámicos directamente desde el backend sin requerir plantillas complejas ni dependencias pesadas.


---

## 🧪 Testing

El proyecto incluye pruebas unitarias y e2e básicas.

Comando para ejecutar los tests:

    npm run test

---

## 🛡️ Seguridad y Buenas Prácticas

- Validación de DTOs con class-validator.
- Serialización con class-transformer.
- Manejo centralizado de errores.
- Tokens JWT con expiración.
- Control de acceso por roles.
- Configuración básica de CORS y seguridad.

---

## 📜 Licencia

Proyecto desarrollado como prueba técnica full-stack.

