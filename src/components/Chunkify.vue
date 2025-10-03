<script setup lang="ts">
import { ref } from "vue";
import type {
    ChunkifyOptions,
    ChunkifyFile,
    Chunk,
    Status,
} from "@/types.ts";
import axios, {
    AxiosError,
    type AxiosProgressEvent,
    type AxiosResponse,
    type Method,
} from "axios";
import defaultOptions from "@/default-optins";
import throttle from "@/support/throttle";
import { log } from "console";

const emit = defineEmits(['select', 'uploading', 'completed', 'error']);

const props = withDefaults(defineProps<ChunkifyOptions>(), defaultOptions);
const files = ref<ChunkifyFile[]>([]);
let status: Status = 'pending';

const handleChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;

    files.value = Array.from(input.files).map((file: File) => ({
        rawFile: file,
        uuid: generateUUID(),
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        url: URL.createObjectURL(file),
        progress: 0,
        uploadedBytes: 0,
        abortController: new AbortController(),
    }));

    emit('select', files.value);

    const method = props.method;
    const route = props.route;
    const chunkSize = parseInt(props.chunkSize as string) * 1024 * 1024; // 1MB
    const chunkQueue: Chunk[] = [];
    const maxRetries = parseInt(props.maxRetries as string);

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
            chunkQueue.push({
                start,
                end,
                reference: file.uuid,
                total_count: totalChunks,
                index: i,
                extension: file.file_name.split('.').pop()?.toLowerCase()
            });
        }
    }

    async function uploadQueue(queue: Chunk[]) {
        const maxConcurrentUploads = parseInt(props.numberOfChunks as string); // Max concurrent uploads
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
        const file: File | null = files.value.find((file: ChunkifyFile) => file.uuid === chunk.reference)?.rawFile ?? null;

        if (!file) {
            throw Error('File not found by chunk reference');
        }

        const data = file.slice(chunk.start, chunk.end);

        const formData = new FormData();
        formData.append('payload', data);
        formData.append('file_reference', chunk.reference);
        formData.append('chunk_number', chunk.index.toString());
        formData.append('total_chunks', chunk.total_count.toString());
        formData.append('file_extension', chunk.extension || '');

        await axios({
            method: method as Method,
            url: route,
            data: formData,
            onUploadProgress: (e: AxiosProgressEvent) => throttledUpdateProgress(e, chunk),
            signal: files.value.find((file) => file.uuid === chunk.reference)
                ?.abortController.signal,
        }).then((response: AxiosResponse) => {
            if (props.onSuccess) {
                props.onSuccess(response);
            }
        }).catch(async (error: AxiosError) => {
            if (restries > 0) {
                await new Promise(res => setTimeout(res, 1000 * (2 ** restries))); // Exponential backoff
                await uploadChunk(chunk, restries - 1);
            }
        }).finally(() => {
            files.value.forEach((file: ChunkifyFile) => {
                if (file.progress === 100) {
                    URL.revokeObjectURL(file.url);
                }
            });
        });
    }
};

const throttledUpdateProgress = throttle((e: AxiosProgressEvent, chunk: Chunk) => {
    const file : ChunkifyFile | null = files.value.find((file: ChunkifyFile) => file.uuid === chunk.reference) ?? null;

    
    if (file) {
        file.uploadedBytes += e.loaded;
        file.progress = Math.round((file.uploadedBytes / file.file_size) * 100);
    }
}, 500);

const generateUUID = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
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
