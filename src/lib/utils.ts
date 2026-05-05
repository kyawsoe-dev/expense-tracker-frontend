import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      (error.response?.data as { message?: string } | undefined)?.message;
    return responseMessage || error.message || 'An unexpected error occurred';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}
