"use client";

import React, { useEffect, useState } from "react";
import { listFiles, listObjects } from "./s3-config";
import { Button, Table } from "antd";
import { RedoOutlined } from "@ant-design/icons";

const S3_BUCKET = "daire-photo";

type S3File = {
  key: string;
  filename: string;
  date: string;
};

const FileList = () => {
  /**
   * @deprecated Use getFilesV2 instead
   */
  const getFiles = async () => {
    const s3files = await listFiles({ bucketName: S3_BUCKET, pageSize: "100" });
    console.log("s3files", s3files);
    const files = s3files[0];

    const filteredFiles = files?.map((file, index) => ({
      ["key"]: String(index + 1),
      ["filename"]: file,
      ["date"]: "",
    }));

    setData(filteredFiles);

    setFiles(s3files ? s3files[0] : []);
  };

  const getFilesV2 = async () => {
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
  };

  useEffect(() => {
    getFilesV2();
  }, []);

  const [files, setFiles] = useState<string[]>([]);
  const [data, setData] = useState<S3File[]>();

  const columns = [
    {
      title: "File Name",
      dataIndex: "filename",
      key: "filename",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
    },
  ];

  return (
    <div className="">
      <Table dataSource={data} columns={columns} bordered />

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
