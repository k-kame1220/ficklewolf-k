const VERSION_SEPARATOR = ".";

/**
 * アプリのバージョンが、必要な最低バージョンより古いか（`major.minor.patch` を数として左から比べる）。
 * 古ければアップデートを促す。
 */
export const isUpdateRequired = (appVersion: string, minAppVersion: string): boolean => {
  const app = appVersion.split(VERSION_SEPARATOR).map(Number);
  const min = minAppVersion.split(VERSION_SEPARATOR).map(Number);

  const firstDifference = min.reduce(
    (difference, part, index) => (difference !== 0 ? difference : part - (app[index] ?? 0)),
    0
  );
  return firstDifference > 0;
};
