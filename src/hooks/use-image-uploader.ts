"use client";
import { useState } from "react";

/**
 * Multi purpose image uploader hook. This is not tied to a specific
 * use or storage case. Use resources param to specify the context.
 * E.g. [{ type: "workspaces", id: "uuid" }, { type: "forms" }]
 *
 * Workspace is tenant-level and always required.
 */
interface UseImageUploaderOptions {
  workspaceId: string;
  resource?: { type: string; id?: string }[]; // Flexible resource path array like ["workspaces", workspaceId, "forms", formId]
  maxSizeMB?: number;
  allowedTypes?: string[];
}

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  url: string | null;
}

export function useImageUploader({
  workspaceId,
  resource = [],
  maxSizeMB = 5,
  allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
}: UseImageUploaderOptions) {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    url: null,
  });

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `File type ${
        file.type
      } not allowed. Allowed types: ${allowedTypes.join(", ")}`;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const upload = async (file: File): Promise<string | null> => {
    const validationError = validateFile(file);
    if (validationError) {
      setState((prev) => ({ ...prev, error: validationError }));
      return null;
    }

    setState({
      uploading: true,
      progress: 0,
      error: null,
      url: null,
    });

    try {
      // Step 1: Request upload URL from our API
      const uploadUrlResponse = await fetch(
        "/api/media/request-upload-url?wid=" + workspaceId,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: resource,
            fileName: file.name,
            fileType: file.type,
          }),
          cache: "no-store",
        }
      );

      if (!uploadUrlResponse.ok) {
        const errorData = await uploadUrlResponse
          .json()
          .catch(() => ({ error: "Failed to get upload URL" }));
        throw new Error(
          errorData.error ||
            `Failed to get upload URL: ${uploadUrlResponse.status}`
        );
      }

      const { uploadUrl, publicUrl } = await uploadUrlResponse.json();

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
        cache: "no-store",
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      setState({
        uploading: false,
        progress: 100,
        error: null,
        url: publicUrl,
      });

      return publicUrl;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setState({
        uploading: false,
        progress: 0,
        error: errorMessage,
        url: null,
      });
      return null;
    }
  };

  const reset = () => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      url: null,
    });
  };

  return {
    upload,
    reset,
    ...state,
  };
}
