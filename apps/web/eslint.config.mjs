import nextConfig from "eslint-config-next";

const baseConfig = Array.isArray(nextConfig) ? [...nextConfig] : [nextConfig];

const eslintConfig = [
    { ignores: ["debug_bf_us.js", "debug_bf_us1.js", "debug_*.js"] },
    ...baseConfig,
];

export default eslintConfig;
