import {
  createBrowserHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect
} from "@tanstack/react-router";
import * as v from "valibot";

import { readAuthToken } from "@/api/core/authToken";
import { APP_VERSION } from "@/api/core/config";
import { masterQueryOptions, masterVersionQueryOptions } from "@/api/master/master.query";
import { isUpdateRequired } from "@/domain/version/version";

import RootLayout from "./RootLayout";

import type { QueryClient } from "@tanstack/react-query";
import type { RouterHistory } from "@tanstack/react-router";

const UPDATE_PATH = "/update";

const RegisterSearchSchema = v.object({
  reason: v.optional(v.picklist(["lost"]))
});

/** すべてのルートから使える値 */
type RouterContext = {
  readonly queryClient: QueryClient;
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context, location }) => {
    const version = await context.queryClient.query(masterVersionQueryOptions);
    const isOutdated = isUpdateRequired(APP_VERSION, version.minAppVersion);
    if (isOutdated && location.pathname !== UPDATE_PATH) throw redirect({ to: UPDATE_PATH });
    if (isOutdated) return;
    await context.queryClient.query(masterQueryOptions);
  },
  component: RootLayout,
  errorComponent: lazyRouteComponent(() => import("@/pages/StartupErrorPage")),
  notFoundComponent: lazyRouteComponent(() => import("@/pages/NotFoundPage"))
});

const updateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: UPDATE_PATH,
  component: lazyRouteComponent(() => import("@/pages/UpdatePage"))
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

const routeTree = rootRoute.addChildren([updateRoute, titleRoute, registerRoute, homeRoute]);

/**
 * アプリのルーターを作る。起動時（どのルートでも最初）に、アプリが古くないかを確かめてからマスタを読み込む。
 * 古ければ /update へ移り、マスタは読まない。通信に失敗したらリトライの画面を出す。
 */
export const createAppRouter = (queryClient: QueryClient, history: RouterHistory = createBrowserHistory()) =>
  createRouter({ routeTree, context: { queryClient }, history });

declare module "@tanstack/react-router" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- 宣言のマージには interface が必要
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
