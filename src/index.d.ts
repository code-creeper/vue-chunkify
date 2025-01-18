declare module 'vue-chunkify' {
    import type { DefineComponent, Plugin } from 'vue';

    // Declare the Vue plugin (install function is required)
    const ChunkifyPlugin: Plugin;

    // Declare the component
    export const Chunkify: DefineComponent<{}, {}, any>;

    // Default export is the plugin
    export default ChunkifyPlugin;
}
