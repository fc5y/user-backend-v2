export type ApiResponse<T> = {
  error: number;
  error_msg: string;
  data: T;
};
