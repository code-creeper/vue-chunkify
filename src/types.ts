export type ChunkifyOptions = {
    route?: string;
    method?: string;
    multiple?: boolean;
    parallel?: boolean;
    numberOfChunks?: number | string;
    chunkSize?: number | string;
    maxRetries?: number | string;
};

export type ChunkifyFile = {
  rawFile: File;
  uuid: string;
  file_name: string;
  file_size: number;
  file_type: string;
  url: string;
  progress?: number;
  abortController: AbortController;
  abort: () => void;
};

export type Chunk = {
  data: Blob;
  reference: string;
  total: number;
  index: number;
};

export type ChunkProgress = {
  reference: string;
  progress: number;
  index: number;
};

export type Status = 'pending' | 'uploading' | 'completed' | 'failed';