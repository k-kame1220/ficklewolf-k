import { createRootRoute, createRoute, createRouter, lazyRouteComponent } from "@tanstack/react-router";

import RootLayout from "./RootLayout";

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: lazyRouteComponent(() => import("@/pages/NotFoundPage"))
});

const titleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: lazyRouteComponent(() => import("@/pages/TitlePage"))
});

const routeTree = rootRoute.addChildren([titleRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- 宣言のマージには interface が必要
  interface Register {
    router: typeof router;
  }
}
