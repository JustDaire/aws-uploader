"use client";

import React, { useState } from "react";
import { uploadMultipleFiles } from "./api-client";
import { Upload, Button, UploadProps, UploadFile, GetProp, message } from "antd";
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

  const handleUpload = async () => {
    if (fileList.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      const files = fileList.map(file => file as FileType);
      const results = await uploadMultipleFiles(files, (uploaded, total) => {
        setProgress((uploaded / total) * 100);
      });

      // Count successful uploads
      const successCount = results.filter(result => result.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        message.success(`Successfully uploaded ${successCount} file(s)`);
      }
      if (failCount > 0) {
        message.error(`Failed to upload ${failCount} file(s)`);
      }

      // Clear file list on successful uploads
      if (successCount > 0) {
        setFileList([]);
        setSelectedFile(null);
      }

    } catch (error) {
      console.error('Upload error:', error);
      message.error('Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileInput = (e: any) => {
    console.log("Selected file:", e.target.files[0]);
    setSelectedFile(e.target.files[0]);
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
    multiple: true, // Allow multiple file selection
  };

  return (
    <div className="flex flex-col sm:flex-row sm:justify-center sm:items-start gap-4">
      <Upload {...props}>
        <Button icon={<UploadOutlined />}>Select file(s)</Button>
      </Upload>
      <Button
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0}
        loading={uploading}
        className="mt-4 sm:mt-0"
      >
        {uploading ? `Uploading... ${Math.round(progress)}%` : 'Start Upload'}
      </Button>
    </div>
  );
};

export default S3Uploader;
