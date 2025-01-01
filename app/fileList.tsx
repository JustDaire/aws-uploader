"use client";

import React, { useEffect, useState } from "react";
import { deleteFileFromS3, listFiles, listObjects } from "./s3-config";
import { Button, Popconfirm, Table, TableProps } from "antd";
import { DeleteOutlined, RedoOutlined } from "@ant-design/icons";

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
  render?: (record: S3File) => JSX.Element;
  record?: TableColumn;
};

const FileList = () => {
  const [loading, setLoading] = useState(false);
  /**
   * @deprecated Use getFilesV2 instead
   */
  const getFiles = async () => {
    const s3files = await listFiles({ bucketName: S3_BUCKET, pageSize: "100" });
    console.log("s3files", s3files);
    const files = s3files![0];

    const filteredFiles = files?.map((file, index) => ({
      ["key"]: String(index + 1),
      ["filename"]: file,
      ["date"]: "",
    }));

    setData(filteredFiles);

    setFiles(s3files ? s3files[0] : []);
  };

  const getFilesV2 = async () => {
    setLoading(true);
    const s3files = await listObjects({
      bucketName: S3_BUCKET,
      pageSize: "100",
    });
    console.log("s3files", s3files);

    const filteredFiles = s3files?.Contents?.map((file, index) => ({
      ["key"]: String(index + 1),
      ["filename"]: file.Key || "",
      ["date"]: file.LastModified?.toDateString() || "",
    }));
    console.log("filteredFiles", filteredFiles);
    setData(filteredFiles);
    setLoading(false);
  };

  const deleteFile = async (file: S3File) => {
    console.log("Deleting file:", file);

    const newData = data?.filter((item) => item.key !== file.key);

    const response = await deleteFileFromS3(S3_BUCKET, file.filename);
    setData(newData);
    console.log('response', response);
  }

  useEffect(() => {
    getFilesV2();
  }, []);

  const [files, setFiles] = useState<string[]>([]);
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
      title: "Action",
      dataIndex: "",
      key: "x",
      align: "center",
      render: (record: S3File) => {
        return (
          <Popconfirm title="Sure to delete?" onConfirm={() => deleteFile(record)} >
            <DeleteOutlined />
          </Popconfirm>
        );
      }
    },
  ];
  const scroll: { x?: number | string | true; y?: number | string } = {x: true, y: 340};

  const tableProps: TableProps = {
    loading,
    scroll,
    tableLayout: "fixed",
  };

  return (
    <div className="">
      <Table {...tableProps} dataSource={data} columns={columns} bordered />

      <Button
        icon={<RedoOutlined />}
        type="primary"
        onClick={() => {
          // listObjects({ bucketName: S3_BUCKET, pageSize: "10" });
          getFilesV2();
        }}
      >
        Refresh List
      </Button>
    </div>
  );
};

export default FileList;
