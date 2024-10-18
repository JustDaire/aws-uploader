"use client";

import React, { useState } from "react";
import { uploadFile } from "./s3-config";

const S3_BUCKET = "daire-photo";

const S3Uploader = () => {
  // Progress
  const [progress, setProgress] = useState(0);
  // File handling
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileInput = (e: any) => {
    console.log("Selected file:", e.target.files[0]);
    setSelectedFile(e.target.files[0]);
  };

  const onUploadFile = (file: File) => {
    console.log(file);
    uploadFile({ bucketName: S3_BUCKET, key: file.name, file: file });
  };

  return (
    <div>
      <div>Native SDK File Upload Progress is {progress}%</div>
      <input type="file" onChange={handleFileInput} />
      <button
        className="rounded-full border border-solid border-transparent transition-colors flex_ items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
        onClick={() => {
          if (selectedFile) {
            onUploadFile(selectedFile);
          } else {
            console.error("No file selected");
          }
        }}
      >
        Upload to S3
      </button>
    </div>
  );
};

export default S3Uploader;
