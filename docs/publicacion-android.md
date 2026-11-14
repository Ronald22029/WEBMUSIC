# WEBMUSIC — requisitos antes de Google Play

1. Confirmar por escrito que cada catálogo y cada audio usado tiene derechos y licencias apropiados para su exhibición y reproducción en la aplicación; tener especial cuidado con música comercial, carátulas y enlaces externos.
2. Validar las condiciones de uso y enlazado de cada proveedor de streaming. La inclusión de una URL pública no autoriza por sí sola retransmitir contenido.
3. Probar las URLs de audio desde Android real, con auriculares, bloqueo de pantalla, conectividad intermitente, llamadas entrantes, suspensión de batería y cambio de pista.
4. Crear iconos Android adaptativos y recursos de tienda, nombre único de paquete, política de privacidad pública verificable y declaración de tratamiento de datos.
5. Revisar requisitos actuales de Google Play y políticas sobre propiedad intelectual, WebView, datos de usuario, segmentación de edad y contenido; obtener asesoría si es necesario.
6. Hacer una APK/AAB con Android Studio y revisar estabilidad y funciones nativas. La versión actual es WEB/PWA local, **no** una aplicación nativa lista para Play Store.
7. El service worker actual muestra una página offline, pero no almacena música ajena ni habilita escucha sin conexión.
8. El administrador de WEBMUSIC es privado y no debe exponerse con credenciales de desarrollo ni accesible sin HTTPS en producción.
