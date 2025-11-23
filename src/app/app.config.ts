import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

// NOTE: removed `provideClientHydration()` to avoid requesting client-side
// hydration when the server does not provide serialized state. If you add
// Angular Universal server rendering in the future and want hydration,
// re-introduce `provideClientHydration(withEventReplay())` on the server
// providers as documented in Angular Universal guides.
export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes)]
};
