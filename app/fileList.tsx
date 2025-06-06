"use client";

import React, { useEffect, useState } from "react";
import { downloadFile, listFilesAPI, deleteFileAPI } from "./api-client";
import { Button, Popconfirm, Table, TableProps, message } from "antd";
import { DeleteOutlined, RedoOutlined, DownloadOutlined } from "@ant-design/icons";
import NewFileModal from "./NewFileModal";

const S3_BUCKET = "daire-photo";

type S3File = {
  key: string;
  filename: string;
  date: string;
};

type TableColumn = {
  title: string;
  dataIndex: string;
  key: string;
  align: "left" | "center" | "right";
  render?: (record: S3File) => React.ReactElement;
  record?: TableColumn;
};

const FileList = () => {
  const [loading, setLoading] = useState(false);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

  const getFilesV2 = async () => {
    setLoading(true);
    try {
      const response = await listFilesAPI("100");
      console.log("s3files", response);

      const filteredFiles = response.Contents?.map((file, index) => ({
        ["key"]: String(index + 1),
        ["filename"]: file.Key || "",
        ["date"]: file.LastModified ? new Date(file.LastModified).toDateString() : "",
      }));
      console.log("filteredFiles", filteredFiles);
      setData(filteredFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
      message.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (file: S3File) => {
    console.log("Deleting file:", file);

    try {
      const response = await deleteFileAPI(file.filename);
      console.log('Delete response:', response);

      // Remove file from local state
      const newData = data?.filter((item) => item.key !== file.key);
      setData(newData);

      message.success(`Deleted ${file.filename} successfully`);
    } catch (error) {
      console.error('Delete failed:', error);
      message.error(`Failed to delete ${file.filename}`);
    }
  }

  const handleDownload = async (file: S3File) => {
    try {
      setDownloadingFiles(prev => new Set(prev).add(file.filename));
      await downloadFile(file.filename);
      message.success(`Downloaded ${file.filename} successfully`);
    } catch (error) {
      console.error('Download failed:', error);
      message.error(`Failed to download ${file.filename}`);
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.filename);
        return newSet;
      });
    }
  };

  useEffect(() => {
    getFilesV2();
  }, []);

  const [data, setData] = useState<S3File[]>();

  const columns: TableColumn[] = [
    {
      title: "File Name",
      dataIndex: "filename",
      key: "filename",
      align: "left",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      align: "left",
    },
    {
      title: "Actions",
      dataIndex: "",
      key: "actions",
      align: "center",
      render: (record: S3File) => {
        const isDownloading = downloadingFiles.has(record.filename);
        return (
          <div className="flex gap-2 justify-center">
            <Button
              type="primary"
              size="small"
              onClick={() => getFilesV2()}
              title="Refresh file list"
            >
              Preview
            </Button>
            <Button
              icon={<DownloadOutlined />}
              type="default"
              size="small"
              loading={isDownloading}
              onClick={() => handleDownload(record)}
              title="Download file"
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
            <Popconfirm
              title="Sure to delete?"
              onConfirm={() => deleteFile(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                icon={<DeleteOutlined />}
                type="default"
                danger
                size="small"
                title="Delete file"
              >
                Delete
              </Button>
            </Popconfirm>
          </div>
        );
      }
    },
  ];
  const scroll: { x?: number | string | true; y?: number | string } = { x: true, y: 340 };

  const tableProps: TableProps = {
    loading,
    scroll,
    tableLayout: "fixed",
  };

  return (
    <div className="w-full max-w-full px-4 py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Table
          {...tableProps}
          dataSource={data}
          columns={columns}
          bordered
          className="mb-4"
        />

        <div className="flex justify-center gap-4">
          <NewFileModal label="New File" title="Upload" />
          <Button
            icon={<RedoOutlined />}
            type="primary"
            onClick={() => {
              getFilesV2();
            }}
          >
            Refresh List
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileList;
