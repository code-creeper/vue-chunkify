import type { App } from 'vue';
import Chunkify from './components/Chunkify.vue';


export default {
    install: (app: App): void => {
        app.component('Chunkify', Chunkify);
    }
}

export { Chunkify };
