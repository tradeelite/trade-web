/**
 * Catch-all API proxy — forwards all /api/... requests to trade-backend.
 * Frontend components stay unchanged; BACKEND_URL is a server-side env var.
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

async function proxy(req: NextRequest, slug: string[]): Promise<NextResponse> {
  const path = slug.join("/");
  const targetUrl = `${BACKEND_URL}/api/${path}${req.nextUrl.search}`;
  const userEmailCookie = req.cookies.get("te_user_email")?.value;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key !== "host") headers.set(key, value);
  });
  if (userEmailCookie && !headers.has("x-user-email")) {
    headers.set("x-user-email", decodeURIComponent(userEmailCookie));
  }

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: body ? Buffer.from(body) : undefined,
  });

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (key !== "transfer-encoding") responseHeaders.set(key, value);
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

type RouteParams = { params: Promise<{ slug: string[] }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  return proxy(req, slug);
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  return proxy(req, slug);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  return proxy(req, slug);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  return proxy(req, slug);
}
