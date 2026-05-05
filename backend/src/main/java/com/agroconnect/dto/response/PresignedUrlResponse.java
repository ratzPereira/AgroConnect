package com.agroconnect.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Presigned URL for file upload")
public record PresignedUrlResponse(

        @Schema(description = "Presigned upload URL") String uploadUrl,
        @Schema(description = "Object key in storage") String objectKey,
        @Schema(description = "Public URL after upload") String publicUrl
) {}
