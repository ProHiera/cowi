const requiredServerEnv = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;
const optionalServerEnv = ["COWI_FREE_MODEL_API_KEY", "COWI_FREE_MODEL_BASE_URL"] as const;

type RequiredServerEnv = (typeof requiredServerEnv)[number];
type OptionalServerEnv = (typeof optionalServerEnv)[number];

type EnvShape = Record<RequiredServerEnv, string> & Partial<Record<OptionalServerEnv, string>>;

export function getEnv(): EnvShape {
  const requiredEntries = requiredServerEnv.map((key) => {
    const value = process.env[key];

    if (!value) {
      throw new Error(
        `[env] Missing required environment variable: ${key}. Please set it in .env.local.`
      );
    }

    return [key, value] as const;
  });

  const optionalEntries = optionalServerEnv
    .map((key) => {
      const value = process.env[key];
      return value ? ([key, value] as const) : null;
    })
    .filter(Boolean) as Array<readonly [OptionalServerEnv, string]>;

  return Object.fromEntries([...requiredEntries, ...optionalEntries]) as EnvShape;
}
