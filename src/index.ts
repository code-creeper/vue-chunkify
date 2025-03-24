import type { App, Plugin } from "vue";
import Chunkify from './components/Chunkify.vue';
import type { ChunkifyOptions } from "./types.ts"

const defaultOptions: ChunkifyOptions = {
    route: 'string',
    method: 'string',
    multiple: true,
    parallel: false,
    numberOfChunks: 4,
    chunkSize: 4000,
    maxRetries: 3,
}

const ChunkifyPlugin: Plugin = {
    install: (app: App, options = defaultOptions) => {
        console.log(options);

        app.component('Chunkify', Chunkify)
    }
}

export default ChunkifyPlugin;
export { Chunkify };
export * from './types';