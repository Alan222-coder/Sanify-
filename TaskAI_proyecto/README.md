# TaskAI

Aplicación web base para un asistente de tareas con:
- Inicio con calendario y progreso.
- Tareas con porcentaje de avance, prioridad, puntos y fecha.
- Asistente IA con chat.
- Reconocimiento de voz del navegador.
- Calendario de eventos.
- Zona de archivos (interfaz base).
- Puntuación.
- Personalización claro/oscuro/automático.
- Perfil.
- Registro e inicio de sesión con email + contraseña.
- SQLite para guardar usuarios, tareas y eventos.

## Requisitos

Instala Node.js LTS. No necesitas una extensión de servidor local para ejecutar el backend.

## Arrancar

1. Abre esta carpeta en VS Code.
2. Abre una terminal.
3. Ejecuta:

```bash
npm install
npm start
```

4. Entra a:

http://localhost:3000

Para desarrollo puedes usar:

```bash
npm run dev
```

## Importante sobre IA y archivos

El endpoint `/api/assistant` actualmente es una IA DEMO local: responde usando reglas sencillas y consulta tus tareas.

Para convertirlo en una IA real hay que conectar un proveedor de IA desde el servidor y guardar la API key en una variable de entorno. Nunca pongas una API key privada directamente en `app.js`.

La sección Archivos actualmente permite seleccionar archivos en el navegador, pero todavía no los sube a la base de datos. Lo recomendable es guardar archivos grandes en almacenamiento de objetos (por ejemplo S3/Cloudinary) y guardar en SQLite solamente sus metadatos.

## Seguridad para producción

Antes de publicar:
- cambia `JWT_SECRET`;
- usa HTTPS;
- añade rate limiting;
- valida entradas;
- usa variables de entorno;
- añade recuperación de contraseña;
- añade verificación de email;
- configura CORS según tu dominio;
- considera PostgreSQL en vez de SQLite si habrá muchos usuarios.
