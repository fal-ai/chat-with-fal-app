import type { NextApiHandler, PageConfig } from "next";

const handler: NextApiHandler = async (request, response) => {
  if (request.method !== "POST" && request.method !== "OPTIONS") {
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  const url = process.env.CHAT_FUNCTION_URL ?? "";
  console.log("url", url);

  const decoder = new TextDecoder();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-fal-key-id": process.env.FAL_KEY_ID ?? "",
      "x-fal-key-secret": process.env.FAL_KEY_SECRET ?? "",
    },
    body: request.body,
  });
  console.log("response status", res.status, res.statusText);
  if (!res.ok) {
    const text = await res.text();
    response
      .status(res.status)
      .json({ message: text, statusText: res.statusText });
    return;
  }

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of res.body as any) {
        console.log("chunk", chunk);
        controller.enqueue(decoder.decode(chunk));
      }
    },
  });

  return new Response(readableStream, {
    headers: { "Content-Type": "text/event-stream" },
  });
};

export const config: PageConfig = {
  runtime: "edge",
};

export default handler;
