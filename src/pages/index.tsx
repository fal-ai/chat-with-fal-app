export default function Home() {
  const handleClick = async () => {
    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        prompt:
          "What are the top 10 most popular football teams in South America?",
      }),
    });
    if (!response.ok) {
      const content = await response.text();
      console.log("-------- content", content);
      return;
    }

    const body = response.body;
    if (!body) {
      throw new Error("No body");
    }

    const reader = body.getReader();

    let isStreaming = true;
    const decoder = new TextDecoder();
    while (isStreaming) {
      console.log("-------- isStreaming", isStreaming);
      const { done, value } = await reader.read();
      console.log("-------- done", done);
      console.log("-------- value", value);

      isStreaming = !done;
      // Process the received chunk
      console.log(decoder.decode(value));
    }
  };
  return (
    <main className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 w-full h-full">
      <div className="flex items-center justify-center my-8 col-span-3">
        <button className="btn btn-primary" onClick={handleClick}>
          Asnwer me
        </button>
      </div>
    </main>
  );
}
