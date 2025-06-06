declare module "*.scss" {
  const content: Record<string, string>;
  export default content;
}

declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string;
    RANDOM_ID: string;
    PUBLIC_PATH: string;
    NODE_ENV: "development" | "production";
  }
}
