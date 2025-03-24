<script setup lang="ts">
import { computed, inject, reactive, ref } from "vue";
import type {
    ChunkifyOptions,
    ChunkifyFile,
    ChunkProgress,
    Chunk,
    Status,
} from "../types";
import axios, {
    AxiosError,
    type AxiosProgressEvent,
    type AxiosResponse,
    type Method,
} from "axios";

const emit = defineEmits(['select', 'uploading', 'completed', 'error']);

const props = defineProps<ChunkifyOptions>();
const files = ref<ChunkifyFile[]>([]);
const chunkProgress: ChunkProgress[] = [];
let status: Status = 'pending';

const handleChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;

    files.value = Array.from(input.files).map((file: File) => ({
        rawFile: file,
        uuid: Math.random().toString(36).substring(2) + Date.now().toString(36),
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        url: URL.createObjectURL(file),
        progress: 0,
        abortController: new AbortController(),
        abort: () => {

        },
    }));

    emit('select', files.value);

    const method = props.method || 'get';
    const route = props.route || '';
    const chunkSize = parseInt((props.chunkSize || 1) as string) * 1024 * 1024; // 1MB
    const chunkQueue: Chunk[] = [];
    const maxRetries = parseInt(props.maxRetries as string) || 3;

    status = 'uploading';

    files.value.forEach((file) => {
        breakFilesIntoChunks(file);
    });

    await uploadQueue(chunkQueue);

    status = 'completed';
    emit('completed');

    async function breakFilesIntoChunks(file: ChunkifyFile) {
        const totalChunks = Math.ceil(
            file.rawFile.size / chunkSize
        );

        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(
                file.rawFile.size,
                start + chunkSize
            );
            const chunkData = file.rawFile.slice(start, end);
            chunkQueue.push({
                data: chunkData,
                reference: file.uuid,
                total_count: totalChunks,
                index: i,
                extension: file.file_name.split('.').pop()?.toLowerCase()
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
                    const uploadTask = uploadChunk(chunk, maxRetries)
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

    async function uploadChunk(chunk: Chunk, restries: number) {
        const formData = new FormData();
        formData.append('chunk_data', chunk.data);
        formData.append('chunk_reference', chunk.reference);
        formData.append('chunk_index', chunk.index.toString());
        formData.append('chunk_total_count', chunk.total_count.toString());
        formData.append('chunk_extension', chunk.extension || '');

        await axios({
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

                const file = files.value.find(
                    (file) => file.uuid === chunk.reference
                );

                if (file) {
                    file.progress = Math.round(
                        chunkProgress
                            .filter(
                                (item: ChunkProgress) => item.reference === chunk.reference
                            )
                            .reduce((acc, item) => acc + item.progress, 0) / chunk.total_count
                    );
                }
            },
            signal: files.value.find((file) => file.uuid === chunk.reference)
                ?.abortController.signal,
        }).then((response: AxiosResponse) => {

        }).catch((error: AxiosError) => {
            if (restries > 0) {
                uploadChunk(chunk, restries - 1);
            }
        });
    }
};

const abort = (reference?: string): void => {
    if (reference) {
        const fileIndex = files.value.findIndex((file) => file.uuid === reference);
        if (fileIndex !== -1) {
            files.value[fileIndex].abortController.abort();
        }
    } else {
        files.value.forEach((file) => {
            file.abortController.abort();
        });
    }
};

defineExpose({
    abort,
    status,
    files,
});
</script>

<template>
    <input type="file" :multiple="props.multiple" @change="handleChange" />
</template>
