<script setup lang="ts">
import { computed, inject, reactive, ref } from "vue";
import type {
  ChunkifyOptions,
  ChunkifyFile,
  ChunkProgress,
  Chunk,
} from "../types";
import axios, {
  type AxiosProgressEvent,
  type AxiosResponse,
  type Method,
} from "axios";

const emit = defineEmits(["change"]);

const props = defineProps<ChunkifyOptions>();

const chunkify = reactive({
  files: ref<ChunkifyFile[]>([]),
});
const chunkProgress: ChunkProgress[] = [];

const handleChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files) return;

  chunkify.files = Array.from(input.files).map((file: File) => ({
    rawFile: file,
    uuid: Math.random().toString(36).substring(2),
    file_name: file.name,
    file_size: file.size,
    file_type: file.type,
    url: URL.createObjectURL(file),
    progress: 0,
    abortController: new AbortController(),
  }));

  emit("change", chunkify);

  const method = props.method || "get";
  const route = props.route || "";
  const chunkSize = props.chunkSize || 1024 * 1024;
  const chunkQueue: Chunk[] = [];

  chunkify.files.forEach((file) => {
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
    const maxConcurrentUploads = parseInt(props.numberOfChunks as string) || 1; // Max concurrent uploads
    const activeUploads: Set<Promise<void>> = new Set();

    while (queue.length > 0 || activeUploads.size > 0) {
      // Start new uploads if slots are available
      while (activeUploads.size < maxConcurrentUploads && queue.length > 0) {
        const chunk = queue.shift();
        if (chunk) {
          const uploadTask = uploadChunk(chunk)
            .finally(() => {
              activeUploads.delete(uploadTask); // Remove from activeUploads when complete
            });
          activeUploads.add(uploadTask);
        }
      }

      // Wait for at least one upload to finish
      if (activeUploads.size >= maxConcurrentUploads || queue.length === 0) {
        await Promise.race(activeUploads);
      }
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
          (item) =>
            item.reference === chunk.reference && item.index === chunk.index
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

        const file = chunkify.files.find(
          (file) => file.uuid === chunk.reference
        );

        if (file) {
          file.progress = Math.round(
            chunkProgress
              .filter(
                (item: ChunkProgress) => item.reference === chunk.reference
              )
              .reduce((acc, item) => acc + item.progress, 0) / chunk.total
          );
        }
      },
      signal: chunkify.files.find((file) => file.uuid === chunk.reference)
        ?.abortController.signal,
    });

    if (response.status >= 200 && response.status < 300) {
      console.log("Chunk uploaded successfully");
    }
  }
};
</script>

<template>
  <input type="file" :multiple="props.multiple" @change="handleChange" />
</template>
