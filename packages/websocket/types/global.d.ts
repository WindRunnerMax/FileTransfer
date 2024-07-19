declare module "*.scss" {
  const content: Record<string, string>;
  export default content;
}

declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string;
    NODE_ENV: "development" | "production";
  }
}
