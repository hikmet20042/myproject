export function getUserErrorMessage(error: any): string {
  if (!error) return "Nəsə səhv oldu";

  if (error.code) {
    switch (error.code) {
      case "UNAUTHORIZED":
        return "Davam etmək üçün daxil olmalısınız.";
      case "FORBIDDEN":
        return "Bu əməliyyatı yerinə yetirməyə icazəniz yoxdur.";
      case "NOT_FOUND":
        return "İstədiyiniz məzmun tapılmadı.";
      case "VALIDATION_ERROR":
        return "Zəhmət olmasa məlumatları yoxlayın və yenidən cəhd edin.";
      default:
        return "Nəsə səhv oldu. Zəhmət olmasa yenidən cəhd edin.";
    }
  }

  return error.message || "Nəsə səhv oldu";
}
