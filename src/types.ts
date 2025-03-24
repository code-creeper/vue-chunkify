type ChunkifyOptions = {
    route?: string;
    method?: string;
    multiple?: boolean;
    parallel?: boolean;
    numberOfChunks?: number | string;
    chunkSize?: number | string;
    maxRetries?: number | string;
};

type ChunkifyFile = {
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

type Chunk = {
  data: Blob;
  reference: string;
  extension?: string;
  total_count: number;
  index: number;
};

type ChunkProgress = {
  reference: string;
  progress: number;
  index: number;
};

type Status = 'pending' | 'uploading' | 'completed' | 'failed';

export type {
    ChunkifyOptions,
    ChunkifyFile,
    Chunk,
    ChunkProgress,
    Status
}