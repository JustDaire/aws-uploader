import Image from "next/image";
import S3Uploader from "./uploader";
import FileList from "./fileList";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1>S3 Uploader</h1>

        <S3Uploader />
        <FileList />
      </main>
    </div>
  );
}
