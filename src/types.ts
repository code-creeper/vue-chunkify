import { AxiosResponse } from "axios";

type ChunkifyOptions = {
  route?: string;
  method?: string;
  multiple?: boolean;
  parallel?: boolean;
  numberOfChunks?: number | string;
  chunkSize?: number | string;
  maxRetries?: number | string;
  onSuccess?: (response: AxiosResponse) => void
};

type ChunkifyFile = {
  rawFile: File;
  uuid: string;
  file_name: string;
  file_size: number;
  file_type: string;
  url: string;
  progress: number;
  uploadedBytes: number;
  abortController: AbortController;
};

type Chunk = {
  start: number;
  end: number;
  reference: string;
  extension?: string;
  total_count: number;
  index: number;
};

type Status = 'pending' | 'uploading' | 'completed' | 'failed';

export type {
  ChunkifyOptions,
  ChunkifyFile,
  Chunk,
  Status
}