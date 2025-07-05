import {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { StorageListResponse, generateStorageId } from '.';
import { removeUrlProtocol } from '@/utility/url';
import { formatBytesToMB } from '@/utility/number';

// 七牛云配置
const QINIU_ACCESS_KEY = process.env.QINIU_ACCESS_KEY ?? '';
const QINIU_SECRET_KEY = process.env.QINIU_SECRET_KEY ?? '';
const QINIU_BUCKET = process.env.NEXT_PUBLIC_QINIU_BUCKET ?? '';
const QINIU_REGION = process.env.NEXT_PUBLIC_QINIU_REGION ?? '';
const QINIU_DOMAIN = removeUrlProtocol(process.env.NEXT_PUBLIC_QINIU_DOMAIN) ?? '';

// 七牛云 S3 兼容端点
const QINIU_ENDPOINT = QINIU_REGION ? `https://s3-${QINIU_REGION}.qiniucs.com` : undefined;

// 公共访问域名
export const QINIU_BASE_URL_PUBLIC = QINIU_DOMAIN ? `https://${QINIU_DOMAIN}` : undefined;

/**
 * @description 创建七牛云 S3 兼容客户端
 * @returns S3Client 实例
 */
export const qiniuClient = () =>
  new S3Client({
    region: QINIU_REGION,
    endpoint: QINIU_ENDPOINT,
    credentials: {
      accessKeyId: QINIU_ACCESS_KEY,
      secretAccessKey: QINIU_SECRET_KEY,
    },
    // 七牛云 S3 兼容模式需要强制路径样式
    forcePathStyle: true,
  });

/**
 * @description 根据文件名生成完整的 URL
 * @param key - 文件名
 * @returns 完整的文件 URL
 */
const urlForKey = (key?: string) => `${QINIU_BASE_URL_PUBLIC}/${key}`;

/**
 * @description 检查 URL 是否来自七牛云
 * @param url - 要检查的 URL
 * @returns 是否为七牛云 URL
 */
export const isUrlFromQiniu = (url?: string) => QINIU_BASE_URL_PUBLIC && url?.startsWith(QINIU_BASE_URL_PUBLIC);

/**
 * @description 上传文件到七牛云
 * @param file - 文件内容
 * @param fileName - 文件名
 * @returns 上传后的文件 URL
 */
export const qiniuPut = async (file: Buffer, fileName: string): Promise<string> =>
  qiniuClient()
    .send(
      new PutObjectCommand({
        Bucket: QINIU_BUCKET,
        Key: fileName,
        Body: file,
        // 七牛云默认是公开读取的
      })
    )
    .then(() => urlForKey(fileName));

/**
 * @description 从客户端上传文件到七牛云（通过预签名 URL）
 * @param file - 文件对象
 * @param fileName - 文件名
 * @returns 上传后的文件 URL
 */
export const qiniuUploadFromClient = async (file: File | Blob, fileName: string): Promise<string> => {
  // 七牛云客户端上传需要通过预签名 URL 实现
  // 这里需要调用后端 API 获取预签名 URL
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', fileName);

  const response = await fetch('/api/storage/qiniu/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file to Qiniu');
  }

  const { url } = await response.json();
  return url;
};

/**
 * @description 复制文件
 * @param fileNameSource - 源文件名
 * @param fileNameDestination - 目标文件名
 * @param addRandomSuffix - 是否添加随机后缀
 * @returns 复制后的文件 URL
 */
export const qiniuCopy = async (fileNameSource: string, fileNameDestination: string, addRandomSuffix?: boolean) => {
  const name = fileNameSource.split('.')[0];
  const extension = fileNameSource.split('.')[1];
  const Key = addRandomSuffix ? `${name}-${generateStorageId()}.${extension}` : fileNameDestination;

  return qiniuClient()
    .send(
      new CopyObjectCommand({
        Bucket: QINIU_BUCKET,
        CopySource: `${QINIU_BUCKET}/${fileNameSource}`,
        Key,
      })
    )
    .then(() => urlForKey(fileNameDestination));
};

/**
 * @description 列出指定前缀的文件
 * @param Prefix - 文件前缀
 * @returns 文件列表
 */
export const qiniuList = async (Prefix: string): Promise<StorageListResponse> =>
  qiniuClient()
    .send(
      new ListObjectsCommand({
        Bucket: QINIU_BUCKET,
        Prefix,
      })
    )
    .then(
      (data) =>
        data.Contents?.map(({ Key, LastModified, Size }) => ({
          url: urlForKey(Key),
          fileName: Key ?? '',
          uploadedAt: LastModified,
          size: Size ? formatBytesToMB(Size) : undefined,
        })) ?? []
    );

/**
 * @description 删除文件
 * @param Key - 文件名
 */
export const qiniuDelete = async (Key: string) => {
  qiniuClient().send(
    new DeleteObjectCommand({
      Bucket: QINIU_BUCKET,
      Key,
    })
  );
};
