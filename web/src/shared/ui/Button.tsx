import styles from "./Button.module.css";

import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  /** 枠の描き方。`bold` は太いペンの枠（決定など）、`pencil` は鉛筆の細い枠（ふつうのボタン） */
  variant: "bold" | "pencil";
  /** 省略すると `button` */
  type?: "button" | "submit";
  /** 押せないときは鉛筆で塗りつぶした見た目になる */
  isDisabled?: boolean;
  onClick?: () => void;
};

/** 旧作の手描きの枠のボタン */
const Button = (props: ButtonProps) => {
  const { children, variant, type = "button", isDisabled = false, onClick } = props;

  return (
    <button className={[styles.root, styles[variant]].join(" ")} type={type} disabled={isDisabled} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
