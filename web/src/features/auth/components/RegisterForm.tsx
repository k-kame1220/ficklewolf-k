import { useId, useState } from "react";

import { useCreateGuest } from "@/api/auth/auth.mutate";
import { ApiError } from "@/api/core/apiError";
import { normalizePlayerName } from "@/domain/player/name";

import { NAME_REJECT_MESSAGES, REGISTER_MESSAGES } from "../messages";

import styles from "./RegisterForm.module.css";

import type { SubmitEvent } from "react";

type RegisterFormProps = {
  /** 保存していたアカウントが見つからずに戻ってきたとき true（お知らせを出す） */
  isAccountLost: boolean;
  /** ゲストを作り終えたときに呼ぶ */
  onRegistered: () => void;
};

const RegisterForm = (props: RegisterFormProps) => {
  const { isAccountLost, onRegistered } = props;

  const inputId = useId();
  const [name, setName] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const createGuest = useCreateGuest();

  const errorMessage = (() => {
    if (inputError !== null) return inputError;
    if (createGuest.error === null) return null;
    if (createGuest.error instanceof ApiError && createGuest.error.code === "INVALID_NAME") {
      return REGISTER_MESSAGES.invalidName;
    }
    return REGISTER_MESSAGES.networkError;
  })();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = normalizePlayerName(name);
    if (!result.ok) {
      setInputError(NAME_REJECT_MESSAGES[result.reason]);
      return;
    }
    setInputError(null);
    createGuest.mutate({ name: result.name }, { onSuccess: onRegistered });
  };

  return (
    <form className={styles.root} onSubmit={handleSubmit} noValidate>
      {isAccountLost && <p className={styles.notice}>{REGISTER_MESSAGES.accountLost}</p>}
      <label className={styles.label} htmlFor={inputId}>
        {REGISTER_MESSAGES.label}
      </label>
      <input
        id={inputId}
        className={styles.input}
        type="text"
        autoComplete="nickname"
        value={name}
        onChange={event => {
          setName(event.target.value);
        }}
      />
      {errorMessage !== null && (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      )}
      <button className={styles.submit} type="submit" disabled={createGuest.isPending}>
        {REGISTER_MESSAGES.submit}
      </button>
    </form>
  );
};

export default RegisterForm;
