import AWS from 'aws-sdk';
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY, AVATAR_BUCKET_NAME } from '../common-config';

const s3 = new AWS.S3({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
});

const uploadPromise = (...args: [any]): Promise<AWS.S3.ManagedUpload.SendData> => {
  return new Promise((resolve, reject) => {
    s3.upload(...args, (err: any, data: any) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

export async function uploadJPEG(key: string, buffer: Buffer) {
  const params = {
    Bucket: AVATAR_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ACL: 'public-read',
    ContentType: 'image/jpeg',
  };

  const data = await uploadPromise(params);
  return data.Location;
}
