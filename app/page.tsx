import FileList from "./fileList";
import Title from "antd/es/typography/Title";

export default function Home() {
  return (
    <div className="grid items-center justify-items-center_ min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Title>S3 Uploader</Title>
        <FileList />
      </main>
    </div>
  );
}
