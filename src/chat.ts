import type { NextApiHandler } from "next";
// import {
//     createParser,
//     ParsedEvent,
//     ReconnectInterval,
//   } from 'eventsource-parser';

const handler: NextApiHandler = async (request, response) => {
  if (request.method !== "POST" && request.method !== "OPTIONS") {
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  const url = process.env.CHAT_FUNCTION_URL ?? "";

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const res = await fetch(url, {
    headers: {
      Accept: "text/event-stream",
      "x-fal-key-id": process.env.FAL_KEY_ID ?? "",
      "x-fal-key-secret": process.env.FAL_KEY_SECRET ?? "",
    },
    body: JSON.stringify({
      prompt: "What is the meaning of life?",
    }),
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of res.body as any) {
        controller.enqueue(decoder.decode(chunk));
      }
    },
  });

  return new Response(readableStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

export default handler;
