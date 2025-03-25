import type { ChunkifyOptions } from "@/types.ts"
import { AxiosResponse } from "axios";

const defaultOptions: ChunkifyOptions = {
    route: '/chukify/upload',
    method: 'post',
    multiple: false,
    parallel: false,
    numberOfChunks: 4,
    chunkSize: 10,
    maxRetries: 3,
    onSuccess: (response: AxiosResponse) => {}
}

export default defaultOptions;