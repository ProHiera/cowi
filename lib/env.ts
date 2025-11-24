const requiredServerEnv = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

type RequiredServerEnv = typeof requiredServerEnv[number];

type EnvShape = Record<RequiredServerEnv, string>;

export function getEnv(): EnvShape {
  const entries = requiredServerEnv.map((key) => {
    const value = process.env[key];

    if (!value) {
      throw new Error(
        `[env] Missing required environment variable: ${key}. Please set it in .env.local.`
      );
    }

    return [key, value] as const;
  });

  return Object.fromEntries(entries) as EnvShape;
}
