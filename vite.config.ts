import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
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
