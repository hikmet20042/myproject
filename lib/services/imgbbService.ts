interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: string;
    height: string;
    size: string;
    time: string;
    expiration: string;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

interface ImgBBUploadResult {
  success: boolean;
  url?: string;
  deleteUrl?: string;
  error?: string;
}

export class ImgBBService {
  private static readonly API_URL = 'https://api.imgbb.com/1/upload';
  private static readonly API_KEY = process.env.IMGBB_API_KEY;

  /**
   * Upload an image to ImgBB
   * @param imageData - Base64 encoded image data or File
   * @param name - Optional name for the image
   * @param expiration - Optional expiration time in seconds (60-15552000)
   * @returns Promise with upload result
   */
  static async uploadImage(
    imageData: string | File,
    name?: string,
    expiration?: number
  ): Promise<ImgBBUploadResult> {
    try {
      if (!this.API_KEY) {
        throw new Error('ImgBB API key not configured');
      }

      const formData = new FormData();
      formData.append('key', this.API_KEY);
      
      if (typeof imageData === 'string') {
        // Handle base64 data
        formData.append('image', imageData);
      } else {
        // Handle File object
        formData.append('image', imageData);
      }

      if (name) {
        formData.append('name', name);
      }

      if (expiration) {
        formData.append('expiration', expiration.toString());
      }

      const response = await fetch(this.API_URL, {
        method: 'POST',
        body: formData,
      });

      const result: ImgBBResponse = await response.json();

      if (result.success) {
        return {
          success: true,
          url: result.data.url,
          deleteUrl: result.data.delete_url,
        };
      } else {
        return {
          success: false,
          error: 'Upload failed',
        };
      }
    } catch (error) {
      console.error('ImgBB upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Convert a File to base64 string
   * @param file - File object to convert
   * @returns Promise with base64 string
   */
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Determine if an image should be uploaded to ImgBB (public) or stored as blob (private)
   * @param context - The context where the image is used ('article', 'story', 'profile', etc.)
   * @returns boolean indicating if image should use ImgBB
   */
  static shouldUseImgBB(context: string): boolean {
    const publicContexts = ['article', 'story', 'news', 'event', 'training', 'vacancy'];
    return publicContexts.includes(context.toLowerCase());
  }
}

export default ImgBBService;