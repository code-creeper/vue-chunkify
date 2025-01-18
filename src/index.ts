import type { App, Plugin } from 'vue';
import Chunkify from './components/Chunkify.vue';
import type { ChunkifyOptions } from './types.ts';

const ChunkifyPlugin: Plugin = {
    install: (app: App, options: ChunkifyOptions = {}) => {
        app.provide('ChunkifyOptions', options);
        app.component('Chunkify', Chunkify);
    } 
};

export default ChunkifyPlugin
export { Chunkify };
export * from './types.ts'; // can not delete
