import { useNavigate } from "@tanstack/react-router";

import { HomeCharacter, HomeStatus } from "@/features/home";
import { MenuTabs } from "@/features/menu";
import MenuLayout from "@/shared/ui/MenuLayout";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <MenuLayout
      header={<HomeStatus />}
      footer={
        <MenuTabs
          current="home"
          onSelect={() => {
            void navigate({ to: "/home" });
          }}
        />
      }
    >
      <HomeCharacter />
    </MenuLayout>
  );
};

export default HomePage;
