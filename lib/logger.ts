export function logError(context: string, error: any) {
  if (error?.code) {
    console.error(`[${context}]`, {
      code: error.code,
      message: error.message,
      details: error.details,
    });
  } else {
    console.error(`[${context}]`, error);
  }
}
