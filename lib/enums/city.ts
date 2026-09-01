/** Mirrors `QOR\App\Domain\Shared\Enum\City` (api/src/Domain/Shared/Enum/City.php). */
export const CITY_VALUES = [
  "vitoria",
  "vila_velha",
  "serra",
  "cariacica",
] as const;

export type City = (typeof CITY_VALUES)[number];

export const CITY_LABELS: Record<City, string> = {
  vitoria: "Vitória",
  vila_velha: "Vila Velha",
  serra: "Serra",
  cariacica: "Cariacica",
};
