//package com.notesplatform.service;
//
//import com.cloudinary.Cloudinary;
//import com.cloudinary.utils.ObjectUtils;
//import com.notesplatform.exception.AppException;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.http.HttpStatus;
//import org.springframework.stereotype.Service;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.io.IOException;
//import java.net.URLEncoder;
//import java.nio.charset.StandardCharsets;
//import java.util.List;
//import java.util.Map;
//import java.util.UUID;
//
//@Service
//public class CloudinaryService {
//
//    @Autowired
//    private Cloudinary cloudinary;
//
//    @Value("${cloudinary.folder}")
//    private String folder;
//
//    @Value("${cloudinary.cloud-name}")
//    private String cloudName;
//
//    private static final List<String> ALLOWED_TYPES = List.of(
//            "application/pdf",
//            "image/jpeg", "image/png", "image/jpg",
//            "image/gif",  "image/webp"
//    );
//    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
//
//    public CloudinaryUploadResult upload(MultipartFile file) {
//
//        if (file == null || file.isEmpty()) {
//            throw new AppException("No file provided", HttpStatus.BAD_REQUEST);
//        }
//        if (file.getSize() > MAX_FILE_SIZE) {
//            throw new AppException("File exceeds 10 MB limit", HttpStatus.BAD_REQUEST);
//        }
//        if (!ALLOWED_TYPES.contains(file.getContentType())) {
//            throw new AppException(
//                    "Unsupported file type. Allowed: PDF, JPG, PNG, GIF, WebP",
//                    HttpStatus.BAD_REQUEST);
//        }
//
////        try {
////            String publicId = folder + "/" + UUID.randomUUID();
////            boolean isPdf = "application/pdf".equals(file.getContentType());
////
////            Map<?, ?> params = isPdf
////                    ? ObjectUtils.asMap(
////                    "public_id",     publicId,
////                    "resource_type", "raw",
////                    "use_filename",  false,
////                    "overwrite",     true)
////                    : ObjectUtils.asMap(
////                    "public_id",     publicId,
////                    "resource_type", "image",
////                    "use_filename",  false,
////                    "overwrite",     true,
////                    "quality",       "auto",
////                    "fetch_format",  "auto");
////
////            @SuppressWarnings("unchecked")
////            Map<String, Object> result =
////                    (Map<String, Object>) cloudinary.uploader()
////                            .upload(file.getBytes(), params);
////
////            String secureUrl  = (String) result.get("secure_url");
////            String returnedId = (String) result.get("public_id");
////            String resourceType = isPdf ? "raw" : "image";
////
////            // PDFs — wrap in Google Docs viewer so browser opens instead of downloading
////            String finalUrl = secureUrl;
////            if (isPdf) {
////                String rawPdfUrl = "https://res.cloudinary.com/" + cloudName
////                        + "/raw/upload/" + returnedId;
////                finalUrl = "https://docs.google.com/viewer?url="
////                        + URLEncoder.encode(rawPdfUrl, StandardCharsets.UTF_8)
////                        + "&embedded=false";
////            }
////
////            return new CloudinaryUploadResult(finalUrl, returnedId, resourceType);
////
////        } catch (IOException e) {
////            throw new AppException(
////                    "Cloudinary upload failed: " + e.getMessage(),
////                    HttpStatus.INTERNAL_SERVER_ERROR);
////        }
//            try {
//                String publicId = folder + "/" + UUID.randomUUID();
//                boolean isPdf = "application/pdf".equals(file.getContentType());
//
//                Map<?, ?> params = isPdf
//                        ? ObjectUtils.asMap(
//                        "public_id",     publicId,
//                        "resource_type", "raw",
//                        "use_filename",  false,
//                        "overwrite",     true)
//                        : ObjectUtils.asMap(
//                        "public_id",     publicId,
//                        "resource_type", "image",
//                        "use_filename",  false,
//                        "overwrite",     true);
//
//                @SuppressWarnings("unchecked")
//                Map<String, Object> result = (Map<String, Object>) cloudinary.uploader().upload(file.getBytes(), params);
//
////                String secureUrl = (String) result.get("secure_url");
////                String resourceType = isPdf ? "raw" : "image";
//
////                // FIX: Ensure the PDF URL actually ends with .pdf so browsers/AI can read it
////                if (isPdf && !secureUrl.toLowerCase().endsWith(".pdf")) {
////                    secureUrl += ".pdf";
////                }
////
////                // Return the CLEAN Cloudinary URL only
////                return new CloudinaryUploadResult(secureUrl, (String) result.get("public_id"), resourceType);
//                String secureUrl = (String) result.get("secure_url");
//
//                System.out.println(result); // temporary debug
//
//                return new CloudinaryUploadResult(
//                        secureUrl,
//                        (String) result.get("public_id"),
//                        (String) result.get("resource_type")
//                );
//
//            } catch (IOException e) {
//                throw new AppException("Cloudinary upload failed", HttpStatus.INTERNAL_SERVER_ERROR);
//            }
//    }
//
//    public void delete(String publicId, String resourceType) {
//        if (publicId == null || publicId.isBlank()) return;
//        try {
//            cloudinary.uploader().destroy(
//                    publicId,
//                    ObjectUtils.asMap("resource_type",
//                            resourceType != null ? resourceType : "image")
//            );
//        } catch (IOException e) {
//            System.err.println("Cloudinary delete warning: " + e.getMessage());
//        }
//    }
//
//    public record CloudinaryUploadResult(
//            String secureUrl,
//            String publicId,
//            String resourceType) {}
//}


package com.notesplatform.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.notesplatform.exception.AppException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    @Value("${cloudinary.folder}")
    private String folder;

    private static final List<String> ALLOWED_TYPES = List.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/gif",
            "image/webp"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    public CloudinaryUploadResult upload(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new AppException(
                    "No file provided",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(
                    "File exceeds 10 MB limit",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new AppException(
                    "Unsupported file type. Allowed: PDF, JPG, PNG, GIF, WebP",
                    HttpStatus.BAD_REQUEST
            );
        }

        try {

            String publicId = folder + "/" + UUID.randomUUID();

            boolean isPdf =
                    "application/pdf".equals(file.getContentType());

            Map<?, ?> params = isPdf
                    ? ObjectUtils.asMap(
                    "public_id", publicId,
                    "resource_type", "image",
                    "format", "pdf",
                    "use_filename", false,
                    "overwrite", true
            )
                    : ObjectUtils.asMap(
                    "public_id", publicId,
                    "resource_type", "image",
                    "use_filename", false,
                    "overwrite", true,
                    "quality", "auto",
                    "fetch_format", "auto"
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> result =
                    (Map<String, Object>) cloudinary
                            .uploader()
                            .upload(file.getBytes(), params);

            System.out.println(result);

            return new CloudinaryUploadResult(
                    (String) result.get("secure_url"),
                    (String) result.get("public_id"),
                    (String) result.get("resource_type")
            );

        } catch (IOException e) {

            throw new AppException(
                    "Cloudinary upload failed: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    public void delete(String publicId, String resourceType) {

        if (publicId == null || publicId.isBlank()) {
            return;
        }

        try {

            cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap(
                            "resource_type",
                            resourceType != null
                                    ? resourceType
                                    : "image"
                    )
            );

        } catch (IOException e) {
            System.err.println(
                    "Cloudinary delete warning: "
                            + e.getMessage()
            );
        }
    }

    public record CloudinaryUploadResult(
            String secureUrl,
            String publicId,
            String resourceType
    ) {}
}