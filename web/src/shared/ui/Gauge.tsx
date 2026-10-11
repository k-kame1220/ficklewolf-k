import styles from "./Gauge.module.css";

type GaugeProps = {
  /** 今の値（0 〜 max） */
  value: number;
  max: number;
  /** 読み上げ用の名前（「敵の HP」など） */
  label: string;
};

/** 鉛筆で塗った横長のゲージ（HP バー）。値が変わると、なめらかに伸び縮みする */
const Gauge = (props: GaugeProps) => {
  const { value, max, label } = props;
  const ratio = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));

  return (
    <div
      className={styles.root}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className={styles.fill} style={{ transform: `scaleX(${String(ratio)})` }} />
    </div>
  );
};

export default Gauge;
