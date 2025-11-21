import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './petstore-openapi.json',
  output: {
    path: './src/api/petstore',
    format: 'prettier',
    lint: 'biome',
  },
  client: '@hey-api/client-axios',
  plugins: [
    {
      name: '@hey-api/sdk',
      asClass: true,
    },
  ],
});
