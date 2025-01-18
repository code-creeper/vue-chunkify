<script setup lang="ts">
import { computed, inject, ref } from "vue";
import type { ChunkifyOptions } from "../types";
import axios, {
  type AxiosProgressEvent,
  type AxiosResponse,
  type Method,
} from "axios";

type ChunkifyFile = {
  rawFile: File;
  uuid: string;
  file_name: string;
  file_size: number;
  file_type: string;
  url: string;
  progress?: number;
  abortController: AbortController;
};

type Chunk = {
  data: Blob;
  reference: string;
  total: number;
  index: number;
};

type ChunkProgress = {
  reference: string;
  progress: number;
  index: number;
};

const props = defineProps<ChunkifyOptions>();

const files = ref<ChunkifyFile[]>([]);

const chunkProgress: ChunkProgress[] = [];

const handleChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files) return;

  files.value = Array.from(input.files).map((file: File) => ({
    rawFile: file,
    uuid: Math.random().toString(36).substring(2),
    file_name: file.name,
    file_size: file.size,
    file_type: file.type,
    url: URL.createObjectURL(file),
    progress: 0,
    abortController: new AbortController(),
  }));

  const method = props.method || "get";
  const route = props.route || "";
  const chunkSize = props.chunkSize || 1024 * 1024;
  const chunkQueue: Chunk[] = [];

  files.value.forEach((file) => {
    breakFilesIntoChunks(file);
  });

  await uploadQueue(chunkQueue);

  async function breakFilesIntoChunks(file: ChunkifyFile) {
    const totalChunks = Math.ceil(
      file.rawFile.size / parseInt(chunkSize as string)
    );

    for (let i = 0; i < totalChunks; i++) {
      const start = i * parseInt(chunkSize as string);
      const end = Math.min(
        file.rawFile.size,
        start + parseInt(chunkSize as string)
      );
      const chunkData = file.rawFile.slice(start, end);
      chunkQueue.push({
        data: chunkData,
        reference: file.uuid,
        total: totalChunks,
        index: i,
      });
    }
  }

  async function uploadQueue(queue: Chunk[]) {
    const tasks = queue
      .splice(0, parseInt(props.numberOfChunks as string) || 1)
      .map(uploadChunk);
    await Promise.all(tasks);

    if (queue.length) {
      await uploadQueue(queue);
    }
  }

  async function uploadChunk(chunk: Chunk) {
    const formData = new FormData();
    formData.append("file", chunk.data);
    formData.append("reference", chunk.reference);
    formData.append("index", chunk.index.toString());

    const response: AxiosResponse = await axios({
      method: method as Method,
      url: route,
      data: formData,
      onUploadProgress: (e: AxiosProgressEvent) => {
        const progress = Math.round((e.loaded * 100) / (e.total || 1));

        const chunkProgressIndex = chunkProgress.findIndex(
          (item) => item.reference === chunk.reference && item.index === chunk.index
        );

        if (chunkProgressIndex === -1) {
          chunkProgress.push({
            reference: chunk.reference,
            progress,
            index: chunk.index,
          });
        } else {
          chunkProgress[chunkProgressIndex].progress = progress;
        }
        

        const file = files.value.find((file) => file.uuid === chunk.reference);

        if (file) {


          file.progress = Math.round(
            chunkProgress.filter(
              (item: ChunkProgress) => item.reference === chunk.reference
            ).reduce(
              (acc, item) => acc + item.progress, 0
            ) / chunk.total
          );
        }
      },
      signal: files.value.find(file => file.uuid === chunk.reference)?.abortController.signal,
    });

    if (response.status >= 200 && response.status < 300) {
      console.log("Chunk uploaded successfully");
    }
  }
};
</script>

<template>
  <pre>{{ files }}</pre>
  <input type="file" :multiple="props.multiple" @change="handleChange" />
</template>
