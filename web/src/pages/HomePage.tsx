import { HomeCharacter } from "@/features/home";

import MenuScreen from "./MenuScreen";

const HomePage = () => (
  <MenuScreen current="home">
    <HomeCharacter />
  </MenuScreen>
);

export default HomePage;
