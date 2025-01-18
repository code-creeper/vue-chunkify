export type ChunkifyOptions = {
    route?: string;
    method?: string;
    multiple?: boolean;
    parallel?: boolean;
    numberOfChunks?: number | string;
    chunkSize?: number | string;
};