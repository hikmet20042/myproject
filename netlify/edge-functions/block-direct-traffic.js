export default async (request, context) => {
  const cloudflareSecret = request.headers.get("x-from-cloudflare");

  // Using Netlify's global Netlify.env helper ensures it reads directly from the edge runtime environment
  const MY_SECRET = typeof Netlify !== "undefined" && Netlify.env 
    ? Netlify.env.get("X_FROM_CLOUDFLARE_SECRET") 
    : process.env.X_FROM_CLOUDFLARE_SECRET;

  if (!MY_SECRET || cloudflareSecret !== MY_SECRET) {
    return new Response("Access Denied: Direct traffic to Netlify is not allowed. Please use the official domain.", {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return context.next();
};

export const config = { path: "/*" };