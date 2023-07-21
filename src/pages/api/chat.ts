import type { NextApiHandler } from "next";

const url = process.env.NEXT_PUBLIC_CHAT_FUNCTION_URL ?? "";

const handler: NextApiHandler = async (request, response) => {
  if (request.method !== "POST" && request.method !== "OPTIONS") {
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(request.body),
  });
  const result = await res.json();
  response.status(200).json(result);
};

export default handler;
