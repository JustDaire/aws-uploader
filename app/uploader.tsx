"use client";

import React, { useState } from "react";
import { uploadFile } from "./s3-config";
import { Upload, Button, UploadProps, UploadFile, GetProp } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const S3_BUCKET = "daire-photo";

const S3Uploader = () => {
  // Progress
  const [progress, setProgress] = useState(0);
  // File handling
  const [selectedFile, setSelectedFile] = useState<UploadFile | null>(null);

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);


  type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

  const handleUpload = () => {
    setUploading(true);
    console.log("Selected file:", selectedFile);
    const formData = new FormData();
    fileList.forEach((file) => {
      console.log('file', file);
      formData.append('files[]', file as FileType);
      onUploadFile(file as FileType);
    });
    setUploading(false);
  };

  const handleFileInput = (e: any) => {
    console.log("Selected file:", e.target.files[0]);
    setSelectedFile(e.target.files[0]);
  };

  const onUploadFile = (file: File) => {
    uploadFile({ bucketName: S3_BUCKET, key: file.name, file: file });
  };

  const props: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList([...fileList, file]);
      setSelectedFile(file);

      return false;
    },
    fileList,
  };

  return (
    <div className="flex flex-col sm:flex-row sm:justify-center sm:items-start gap-4">
      <Upload {...props}>
        <Button icon={<UploadOutlined />}>Select file</Button>
      </Upload>
      <Button
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0}
        loading={uploading}
        className="mt-4 sm:mt-0"
      >
        {uploading ? 'Uploading' : 'Start Upload'}
      </Button>
    </div>
  );
};

export default S3Uploader;
