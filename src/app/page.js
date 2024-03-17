import Image from "next/image";
import ChatApp from "./chatinterface.js"

export default function Home() {
  return (
    <main className="flex  flex-col items-center justify-between">
      {/* min-h-screen  p-4 */}
      <ChatApp></ChatApp>
    </main>
  );
}
