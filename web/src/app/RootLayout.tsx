import { Outlet } from "@tanstack/react-router";

import ScreenFrame from "@/shared/ui/ScreenFrame";

const RootLayout = () => {
  return (
    <ScreenFrame>
      <Outlet />
    </ScreenFrame>
  );
};

export default RootLayout;
