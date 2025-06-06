"use client";

import Image from "next/image";
import S3Uploader from "./uploader";
import FileList from "./fileList";
import { useEffect, useState } from "react";
import { getObject } from "./s3-config";

export default function Home() {

  const onGetObject = async () =>  {
    const getLogo = await getObject({ bucketName: "daire-photo", key: "daire-hardesty-logo.png" });
    console.log('getlogo:', getLogo);
    if (getLogo) {
      setLogo(getLogo);
    }
  }

  const [logo, setLogo] = useState<string>("");

  useEffect(() => {
    onGetObject();
  }, []);
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        {
          logo ? logo : "No logo found"
        }
        {/* <Image
          className="dark:invert"
          src={logo}
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        /> */}
        <Image
          className="dark:invert"
          src="https://nextjs.org/icons/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
            </code>
            .
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <S3Uploader />
        <FileList />
      </main>
    </div>
  );
}
