/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a minimal .next/standalone server bundle (only the deps it
  // actually needs) so the Docker image doesn't have to ship node_modules.
  output: "standalone",
};

export default nextConfig;
