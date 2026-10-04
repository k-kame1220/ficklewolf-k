import { getRouteApi, useNavigate } from "@tanstack/react-router";

import { RegisterForm } from "@/features/auth";

import styles from "./RegisterPage.module.css";

const registerRoute = getRouteApi("/register");

const RegisterPage = () => {
  const { reason } = registerRoute.useSearch();
  const navigate = useNavigate();

  return (
    <div className={styles.root}>
      <RegisterForm
        isAccountLost={reason === "lost"}
        onRegistered={() => {
          void navigate({ to: "/home" });
        }}
      />
    </div>
  );
};

export default RegisterPage;
