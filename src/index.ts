import type { App, Plugin } from 'vue';
import Chunkify from './components/Chunkify.vue';

const ChunkifyPlugin: Plugin = {
    install: (app: App) => {
        console.log('installing vue-chunkify');
        app.component('Chunkify', Chunkify);
    } 
};

export default ChunkifyPlugin
export { Chunkify };
