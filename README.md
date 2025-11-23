# PromoGana — Ruleta de Sorteos

Una pequeña aplicación web para realizar sorteos tipo ruleta (wheel of fortune). Permite que usuarios se registren rápidamente, giren una ruleta visual y que sus participaciones se guarden en Firestore. También incluye un panel de administración donde se pueden ver los participantes y elegir un ganador aleatorio.

**Estado:** Proyecto en desarrollo — fixes recientes aplicados a la vista Admin, lógica de ganador y build.

**Contacto/Autor:** Juan (desarrollador del proyecto)

**Contenido del README**
- **Descripción**: qué hace el proyecto
- **Tecnologías**: stack y librerías usadas
- **Estructura**: archivos y carpetas relevantes
- **Instalación y ejecución**: comandos para desarrollo y build
- **Configuración de Firebase**: dónde colocar credenciales y notas de seguridad
- **Problemas conocidos / Troubleshooting**: advertencias y soluciones aplicadas
- **Notas de desarrollo**: decisiones clave y dónde mirar para cambios futuros

**Descripción**

PromoGana es una SPA en Angular que simula una ruleta de premios. El flujo básico:
- Un usuario introduce nombre y handle y accede a la vista de juego.
- Pulsa `GIRAR` y la ruleta anima un giro y selecciona un segmento ganador.
- El premio se muestra al usuario y (si está autenticado) la participación se persiste en Firestore.
- Un panel de administración permite ver todas las participaciones y elegir un ganador aleatorio manualmente.

**Tecnologías**

- Angular (Standalone components, ApplicationConfig)
- Angular Signals API y APIs modernas del framework
- SCSS para estilos
- Firebase (Auth y Firestore) — autenticación anónima usada por defecto para facilitar pruebas
- Herramientas: Node.js, npm, Angular CLI
- Scripts auxiliares: `scripts/roulette-verify.js` (simulador/verificador de mapeo grados→índice)

**Estructura relevante**

- `src/app/app.component.ts` — lógica principal de UI, autenticación, interacción con Firestore y lógica de giro.
- `src/app/app.component.html` — template principal (ruleta, controles, panel admin).
- `src/app/app.component.scss` — estilos del componente (se corrigieron problemas de visibilidad del panel admin).
- `src/app/roulette-utils.ts` — helper puro para calcular índice ganador a partir de grados (si existe).
- `scripts/roulette-verify.js` — script Node para probar el mapeo y distribución de ganadores.
- `angular.json` — configuración de build (presupuestos/budgets ajustados recientemente).
- `src/environments/environment.ts` — configurar aquí `firebaseConfig` para desarrollo.

**Instalación y ejecución local**

Requisitos:
- Node.js (>=16 recomendado)
- npm
- Angular CLI (opcional, `ng`)

Comandos básicos:

```bash
# instalar dependencias
npm install

# modo desarrollo (dev server)
npm start
# ó
ng serve

# build (development)
ng build --configuration development

# build (producción, default)
ng build

# ejecutar tests (si existe configuración)
npm test
```

**Configuración de Firebase**

- Edita `src/environments/environment.ts` con la configuración de tu proyecto Firebase.
- La app por defecto intenta autenticación anónima (`signInAnonymously`). Si tu proyecto no permite auth anónima verás un error `auth/admin-restricted-operation`. Puedes:
  - Habilitar Anonymous sign-in en Firebase Console → Authentication → Sign-in method, o
  - Implementar otro flujo de autenticación (OAuth, token) y ajustar `initAuth()` en `src/app/app.component.ts`.
- Firestore: la persistencia de participantes se escribe en la colección `artifacts/<appId>/public/data/game_leads` según la configuración actual.

**Problemas conocidos y soluciones aplicadas**

- NG0505 (Hydration): si ves en consola un mensaje como "Angular hydration was requested... no serialized information present", significa que el cliente pedía hidratación sin SSR. Se eliminó `provideClientHydration()` del `appConfig` cliente para evitar la advertencia cuando no hay SSR.
- Firebase 400 `auth/admin-restricted-operation`: ocurre si la auth anónima está deshabilitada. Se añadió manejo en `initAuth()` para loguear instrucciones claras.
- Sass: `darken()` estaba generando warnings deprecación; se reemplazó por `color.adjust()` añadiendo `@use "sass:color";` en `src/app/app.component.scss`.
- Budgets (build): el build de producción podía fallar por presupuestos (`budgets.anyComponentStyle` y `initial`). Ajusté temporalmente `angular.json` para evitar que la build falle; idealmente se debería reducir el CSS pesado moviendo estilos globales a `src/styles.css`.

**Notas de desarrollo / decisiones técnicas**

- Ganador determinista: la selección del segmento ganador se calcula de forma determinista a partir del ángulo total de rotación y un offset de puntero (270°). Se usa una función utilitaria para calcular el índice más cercano al puntero y aplicar una corrección mínima para que la animación sea suave.
- Labels/GO: las etiquetas de la ruleta se posicionan midiendo el tamaño del knob central (GO) en `ngAfterViewInit()` y usando una traducción en px para evitar solapamientos.
- Listeners Firebase: implementadas limpiezas (`unsubscribe`) en `ngOnDestroy()` para evitar fugas.

**Tips para mantenimiento**

- Si el `styles` del componente crece mucho, mover reglas a `src/styles.css` o dividir componentes para mantener `anyComponentStyle` bajo el presupuesto.
- Para producción, configura reglas de Firestore para asegurar quien puede escribir (ej.: bloquear escrituras públicas si no usas auth apropiada).
- Considerar añadir tests unitarios para `computeWinningIndex()` (función pura) para asegurar que el mapeo grados→índice se mantiene estable.

**Contribuciones**

Si querés colaborar:
- Forkea el repo, crea una rama con un nombre descriptivo y envía un PR.
- Mantener commits pequeños y descriptivos.


# PromoGana

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.15.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
