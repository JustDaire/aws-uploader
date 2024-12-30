"use client";

import React, { useEffect, useState } from "react";
import { listFiles } from "./s3-config";
import { Button, Table } from "antd";
import { RedoOutlined } from "@ant-design/icons";

const S3_BUCKET = "daire-photo";

type S3File = {
  key: string;
  filename: string;
};

const FileList = () => {
  const getFiles = async () => {
    const s3files = await listFiles({ bucketName: S3_BUCKET, pageSize: "100" });
    console.log("s3files", s3files);
    const files = s3files[0];

    const filteredFiles = files?.map((file, index) => ({
      ["key"]: String(index + 1),
      ["filename"]: file,
    }));

    setData(filteredFiles);

    setFiles(s3files ? s3files[0] : []);
  };

  useEffect(() => {
    getFiles();
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
      title: "Action",
      dataIndex: "action",
      key: "action",
    },
  ];

  return (
    <div className="">
      <Table dataSource={data} columns={columns} />

      <Button
        icon={<RedoOutlined />}
        type="primary"
        onClick={() => {
          listFiles({ bucketName: S3_BUCKET, pageSize: "10" });
        }}
      >
        Refresh List
      </Button>
    </div>
  );
};

export default FileList;
