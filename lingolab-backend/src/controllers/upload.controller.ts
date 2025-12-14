import {
  Controller,
  Post,
  Route,
  Tags,
  Security,
  Request,
  UploadedFile,
  Response,
} from "tsoa";
import { Request as ExpressRequest } from "express";
import { Messages } from "../constants/messages";
import {
  isValidAvatarFile,
  isValidAudioFile,
  isValidAudioDuration,
} from "../utils/validation.utils";
import { PracticeService } from "../services/practice.service";
import { AuthService } from "../services/auth.service";
import { RecordingResponseDTO } from "../dtos/practice.dto";
import { storageService } from "../services/storage.service";

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * File upload response
 */
interface UploadResponse {
  success: boolean;
  message: string;
  url?: string;
  fileName?: string;
}

@Route("/api/upload")
@Tags("Upload")
export class UploadController extends Controller {
  private practiceService = new PracticeService();
  private authService = new AuthService();

  /**
   * Upload avatar image
   * BR13: File type .jpg, .png, .jpeg; Max 2MB
   */
  @Post("avatar")
  @Security("jwt")
  @Response<UploadResponse>(200, "Avatar uploaded successfully")
  @Response(400, "Invalid file")
  async uploadAvatar(
    @Request() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File
  ): Promise<UploadResponse> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    if (!file) {
      this.setStatus(400);
      return { success: false, message: "No file uploaded" };
    }

    // BR13: Validate file type and size
    if (!isValidAvatarFile(file.mimetype, file.size)) {
      this.setStatus(400);
      return { success: false, message: Messages.MSG_011 };
    }

    // Generate storage key and upload file to storage
    const ext = file.originalname.split(".").pop();
    const fileName = `avatar_${userId}_${Date.now()}.${ext}`;

    // Upload file to storage using uploadAvatar method
    const uploadResult = await storageService.uploadAvatar(
      file.buffer,
      userId,
      fileName,
      file.mimetype
    );

    if (!uploadResult.success) {
      this.setStatus(500);
      return { success: false, message: "Failed to upload avatar" };
    }

    const storageUrl = uploadResult.url || `/uploads/avatars/${fileName}`;

    // Update user profile with avatar URL
    await this.authService.updateProfile(userId, { avatarUrl: storageUrl });

    return {
      success: true,
      message: "Avatar uploaded successfully",
      url: storageUrl,
      fileName,
    };
  }

  /**
   * Upload audio recording
   * BR23: Duration 30-120 seconds
   * BR24: Format .wav, .mp3
   */
  @Post("recording/{attemptId}")
  @Security("jwt")
  @Response<RecordingResponseDTO>(200, "Recording uploaded successfully")
  @Response(400, "Invalid file or duration")
  async uploadRecording(
    @Request() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    attemptId: string
  ): Promise<RecordingResponseDTO | { success: false; message: string }> {
    const userId = request.user?.userId;
    if (!userId) {
      this.setStatus(401);
      return { success: false, message: Messages.MSG_401 };
    }

    if (!file) {
      this.setStatus(400);
      return { success: false, message: "No file uploaded" };
    }

    // BR24: Validate file format
    if (!isValidAudioFile(file.mimetype)) {
      this.setStatus(400);
      return { success: false, message: "Invalid audio format. Only .wav and .mp3 are allowed." };
    }

    // Note: Duration validation should be done client-side or via audio processing
    // For now, we'll accept the file and let the practice service validate

    // Generate storage key and upload file to storage
    const ext = file.originalname.split(".").pop();
    const fileName = `recording_${attemptId}_${Date.now()}.${ext}`;

    // Upload file to storage using uploadAudio method
    const uploadResult = await storageService.uploadAudio(
      file.buffer,
      attemptId,
      fileName,
      file.mimetype
    );

    if (!uploadResult.success) {
      this.setStatus(500);
      return { success: false, message: "Failed to upload recording: " + (uploadResult.error || "Unknown error") };
    }

    // Use the storage key for download (not the URL)
    const storageUrl = uploadResult.key || `audio/${attemptId}/${fileName}`;

    // Create recording record
    const result = await this.practiceService.uploadRecording(
      userId,
      {
        attemptId,
        fileName: file.originalname,
        duration: 60, // This should be calculated from the actual audio file
        fileSize: file.size,
        mimeType: file.mimetype,
      },
      storageUrl
    );

    if ("success" in result && !result.success) {
      this.setStatus(400);
    }

    return result;
  }
}

