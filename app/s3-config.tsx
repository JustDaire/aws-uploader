import {
  S3Client,
  PutObjectCommand,
  S3ServiceException,
  paginateListObjectsV2,
} from "@aws-sdk/client-s3";

interface UploadFileParams {
  bucketName: string;
  key: string;
  file: File;
}

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY || "",
  },
  region: "eu-west-1",
});

/**
 * Log all of the object keys in a bucket.
 * @param {{ bucketName: string, pageSize: string }}
 */
export const listFiles = async ({ bucketName, pageSize }: { bucketName: string; pageSize: string; }) => {
  /** @type {string[][]} */
  const objects: string[][] = [];
  try {
    const paginator = paginateListObjectsV2(
      { client, /* Max items per page */ pageSize: Number.parseInt(pageSize) },
      { Bucket: bucketName },
    );

    for await (const page of paginator) {
      if (page.Contents) {
        objects.push(page.Contents.map((o) => o.Key).filter((key): key is string => key !== undefined));
      }
    }
    console.log('objects', objects);
    objects.forEach((objectList, pageNum) => {
      console.log('objectList', objectList);
      console.log(
        `Page ${pageNum + 1}\n------\n${objectList.map((o) => `• ${o}`).join("\n")}\n`,
      );
    });
    return objects;
  } catch (caught) {
    if (
      caught instanceof S3ServiceException &&
      caught.name === "NoSuchBucket"
    ) {
      console.error(
        `Error from S3 while listing objects for "${bucketName}". The bucket doesn't exist.`,
      );
    } else if (caught instanceof S3ServiceException) {
      console.error(
        `Error from S3 while listing objects for "${bucketName}".  ${caught.name}: ${caught.message}`,
      );
    } else {
      throw caught;
    }
  }
}

export const uploadFile = async ({
  bucketName,
  key,
  file,
}: UploadFileParams) => {
  console.log("env:", process.env);
  console.log("filePath:", file);
  const command = new PutObjectCommand({
    ACL: "public-read",
    Bucket: bucketName,
    Key: key,
    Body: file,
  });
  console.log(client);

  try {
    const response = await client.send(command);
    console.log(response);
  } catch (caught) {
    if (
      caught instanceof S3ServiceException &&
      caught.name === "EntityTooLarge"
    ) {
      console.error(
        `Error from S3 while uploading object to ${bucketName}. \
  The object was too large. To upload objects larger than 5GB, use the S3 console (160GB max) \
  or the multipart upload API (5TB max).`
      );
    } else if (caught instanceof S3ServiceException) {
      console.error(
        `Error from S3 while uploading object to ${bucketName}.  ${caught.name}: ${caught.message}`
      );
    } else {
      throw caught;
    }
  }
};