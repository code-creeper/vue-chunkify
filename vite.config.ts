import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [vue()],
    build: {
        lib: {
            entry: "src/index.ts",
            name: "vue-chunkify",
            fileName: (format) =>
                format === "es" ? "vue-chunkify.es.js" :
                    "vue-chunkify.cjs",
            formats: ["es", "cjs"]
        },
        rollupOptions: {
            external: ["vue"],
            output: {
                globals: { vue: "Vue" },
                exports: "named"
            }
        },
        emptyOutDir: false
    }
});
