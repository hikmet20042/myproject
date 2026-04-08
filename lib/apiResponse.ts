import { NextResponse } from "next/server";

export function successResponse(data: any, meta: any = {}, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
      meta: meta || {},
    },
    { status }
  );
}

export function errorResponse(
  message: string,
  code: string = "UNKNOWN_ERROR",
  details: any = {},
  status = 400
) {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code: code || "UNKNOWN_ERROR",
        message,
        details: details || {},
      },
      meta: {},
    },
    { status }
  );
}
