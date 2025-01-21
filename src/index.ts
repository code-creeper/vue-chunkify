import type { App, Plugin } from 'vue';
import Chunkify from './components/Chunkify.vue';
import type { ChunkifyOptions } from './types';

const ChunkifyPlugin: Plugin = {
    install: (app: App, options: ChunkifyOptions = {}) => {
        app.provide('ChunkifyOptions', options);
        app.component('Chunkify', Chunkify);
    } 
};

export default ChunkifyPlugin
export { Chunkify };
export * from './types'; // can not delete
