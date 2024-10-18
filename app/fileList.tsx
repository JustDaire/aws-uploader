"use client";

import React, { useEffect, useState } from "react";
import { listFiles } from "./s3-config";

const S3_BUCKET = "daire-photo";

const FileList = () => {


  const getFiles = async () =>  {
    const s3files = await listFiles({ bucketName: S3_BUCKET, pageSize: "100" });
    setFiles(s3files ? s3files[0] : []);
  }

  useEffect(() => {
    getFiles();
  }, []);

  const [files, setFiles] = useState<string[]>([]);

  return (
    <div>
      <table style={{ width: "100%", textAlign: "left" }}>
        <thead>
          <tr>
            <th>File Name</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {files && files.map((file, index) => (
            <tr key={index}>
              <td>{file}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className="rounded-full border border-solid border-transparent transition-colors flex_ items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
        onClick={() => {
          listFiles({ bucketName: S3_BUCKET, pageSize: "10" });
        }}
      >
        Refresh List
      </button>
    </div>
  );
};

export default FileList;
