export function getUserErrorMessage(error: any): string {
  if (!error) return "Something went wrong";

  if (error.code) {
    switch (error.code) {
      case "UNAUTHORIZED":
        return "You need to log in to continue.";
      case "FORBIDDEN":
        return "You don’t have permission to perform this action.";
      case "NOT_FOUND":
        return "The requested content was not found.";
      case "VALIDATION_ERROR":
        return "Please check your input and try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  return error.message || "Something went wrong";
}
