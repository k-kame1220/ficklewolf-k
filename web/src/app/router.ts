import { createRootRoute, createRoute, createRouter, lazyRouteComponent, redirect } from "@tanstack/react-router";
import * as v from "valibot";

import { readAuthToken } from "@/api/core/authToken";

import RootLayout from "./RootLayout";

const RegisterSearchSchema = v.object({
  reason: v.optional(v.picklist(["lost"]))
});

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: lazyRouteComponent(() => import("@/pages/NotFoundPage"))
});

const titleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: lazyRouteComponent(() => import("@/pages/TitlePage"))
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  validateSearch: search => v.parse(RegisterSearchSchema, search),
  beforeLoad: () => {
    if (readAuthToken() !== null) throw redirect({ to: "/home" });
  },
  component: lazyRouteComponent(() => import("@/pages/RegisterPage"))
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  beforeLoad: () => {
    if (readAuthToken() === null) throw redirect({ to: "/register" });
  },
  component: lazyRouteComponent(() => import("@/pages/HomePage"))
});

const routeTree = rootRoute.addChildren([titleRoute, registerRoute, homeRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- 宣言のマージには interface が必要
  interface Register {
    router: typeof router;
  }
}
