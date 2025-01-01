"use client";

import React, { useState } from "react";
import { Button, Modal, message, UploadProps, UploadFile } from "antd";
import { InboxOutlined, PlusOutlined } from "@ant-design/icons";
import Dragger from "antd/es/upload/Dragger";
import S3Uploader from "./uploader";

const NewFileModal = (props: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleUpload = () => {
    setUploading(true);
    // console.log("Selected file:", selectedFile);
    const formData = new FormData();
    // fileList.forEach((file) => {
    //   console.log('file', file);
    // //   formData.append('files[]', file as FileType);
    // //   onUploadFile(file as FileType);
    // });
    setUploading(false);
  };

  const loading = false; // Initialize the loading variable
  const scroll = {}; // Initialize the scroll variable

  const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    onChange(info) {
      const { status } = info.file;
      if (status !== "uploading") {
        console.log(info.file, info.fileList);
      }
      if (status === "done") {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);

      const newFileList = e.dataTransfer.files;
      //   setFileList(newFileList);
    },
    beforeUpload: (file) => {
      console.log("file", file);
      setFileList([...fileList, file]);
      console.log("fileList", fileList);

      return false;
    },
    fileList,
  };

  return (
    <>
      <Button type="primary" onClick={showModal}>
        <PlusOutlined />
        {props.label}
      </Button>
      <Modal
        title={props.title}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={
          <Button type="primary" onClick={handleUpload}>
            Reload
          </Button>
        }
      >
        <S3Uploader />
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for a single or bulk upload. Strictly prohibited from
            uploading company data or other banned files.
          </p>
        </Dragger>
      </Modal>
    </>
  );
};

export default NewFileModal;
