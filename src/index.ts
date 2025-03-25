import type { App, Plugin } from "vue";
import Chunkify from '@/components/Chunkify.vue';
import defaultOptions from "@/default-optins";

const ChunkifyPlugin: Plugin = {
    install: (app: App, options = defaultOptions) => {
        console.log(options, 'plugin options');

        app.component('Chunkify', Chunkify)
    }
}

export default ChunkifyPlugin;
export { Chunkify };
export type { ChunkifyOptions, ChunkifyFile } from '@/types';