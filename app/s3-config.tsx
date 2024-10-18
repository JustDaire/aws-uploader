import {
  S3Client,
  PutObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";

interface UploadFileParams {
  bucketName: string;
  key: string;
  file: File;
}

export const uploadFile = async ({
  bucketName,
  key,
  file,
}: UploadFileParams) => {
  console.log("env:", process.env);
  const client = new S3Client({
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY || "",
    },
    region: "eu-west-1",
  });
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