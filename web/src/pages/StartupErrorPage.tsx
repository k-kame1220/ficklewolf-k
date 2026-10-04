import { useRouter } from "@tanstack/react-router";

import { StartupError } from "@/features/startup";
import ScreenFrame from "@/shared/ui/ScreenFrame";

const StartupErrorPage = () => {
  const router = useRouter();

  return (
    <ScreenFrame>
      <StartupError
        onRetry={() => {
          void router.invalidate();
        }}
      />
    </ScreenFrame>
  );
};

export default StartupErrorPage;
