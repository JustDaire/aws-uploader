import FileList from "./fileList";
import Title from "antd/es/typography/Title";
import NewFileModal from "./NewFileModal";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Title>S3 Uploader</Title>
        <NewFileModal label="New File" title="Upload" />
        <FileList />
      </main>
    </div>
  );
}
