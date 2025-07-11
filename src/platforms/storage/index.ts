import {
  VERCEL_BLOB_BASE_URL,
  vercelBlobCopy,
  vercelBlobDelete,
  vercelBlobList,
  vercelBlobPut,
  vercelBlobUploadFromClient,
} from './vercel-blob';
import { AWS_S3_BASE_URL, awsS3Copy, awsS3Delete, awsS3List, awsS3Put, isUrlFromAwsS3 } from './aws-s3';
import {
  CURRENT_STORAGE,
  HAS_AWS_S3_STORAGE,
  HAS_VERCEL_BLOB_STORAGE,
  HAS_CLOUDFLARE_R2_STORAGE,
  HAS_QINIU_STORAGE,
} from '@/app/config';
import { generateNanoid } from '@/utility/nanoid';
import {
  CLOUDFLARE_R2_BASE_URL_PUBLIC,
  cloudflareR2Copy,
  cloudflareR2Delete,
  cloudflareR2List,
  cloudflareR2Put,
  isUrlFromCloudflareR2,
} from './cloudflare-r2';
import {
  QINIU_BASE_URL_PUBLIC,
  qiniuCopy,
  qiniuDelete,
  qiniuList,
  qiniuPut,
  qiniuUploadFromClient,
  isUrlFromQiniu,
} from './qiniu';
import { PATH_API_PRESIGNED_URL } from '@/app/paths';

export const generateStorageId = () => generateNanoid(16);

export type StorageListItem = {
  url: string;
  fileName: string;
  uploadedAt?: Date;
  size?: string;
};

export type StorageListResponse = StorageListItem[];

export type StorageType = 'vercel-blob' | 'aws-s3' | 'cloudflare-r2' | 'qiniu';

export const labelForStorage = (type: StorageType): string => {
  switch (type) {
    case 'vercel-blob':
      return 'Vercel Blob';
    case 'cloudflare-r2':
      return 'Cloudflare R2';
    case 'aws-s3':
      return 'AWS S3';
    case 'qiniu':
      return 'Qiniu Cloud';
    default:
      return 'Unknown Storage';
  }
};

export const baseUrlForStorage = (type: StorageType) => {
  switch (type) {
    case 'vercel-blob':
      return VERCEL_BLOB_BASE_URL;
    case 'cloudflare-r2':
      return CLOUDFLARE_R2_BASE_URL_PUBLIC;
    case 'aws-s3':
      return AWS_S3_BASE_URL;
    case 'qiniu':
      return QINIU_BASE_URL_PUBLIC;
    default:
      return undefined;
  }
};

export const storageTypeFromUrl = (url: string): StorageType => {
  if (isUrlFromQiniu(url)) {
    return 'qiniu';
  } else if (isUrlFromCloudflareR2(url)) {
    return 'cloudflare-r2';
  } else if (isUrlFromAwsS3(url)) {
    return 'aws-s3';
  } else {
    return 'vercel-blob';
  }
};

const PREFIX_UPLOAD = 'upload';
const PREFIX_PHOTO = 'photo';

export const generateRandomFileNameForPhoto = () => `${PREFIX_PHOTO}-${generateStorageId()}`;

const REGEX_UPLOAD_PATH = new RegExp(`(?:${PREFIX_UPLOAD})(?:-[a-z0-9]+)?\.[a-z]{1,4}`, 'i');

const REGEX_UPLOAD_ID = new RegExp(`.${PREFIX_UPLOAD}-([a-z0-9]+)\.[a-z]{1,4}$`, 'i');

export const fileNameForStorageUrl = (url: string) => {
  switch (storageTypeFromUrl(url)) {
    case 'vercel-blob':
      return url.replace(`${VERCEL_BLOB_BASE_URL}/`, '');
    case 'cloudflare-r2':
      return url.replace(`${CLOUDFLARE_R2_BASE_URL_PUBLIC}/`, '');
    case 'aws-s3':
      return url.replace(`${AWS_S3_BASE_URL}/`, '');
    case 'qiniu':
      // 对于七牛云，返回完整的文件路径（包含 exif-photo-blog 目录）
      return url.replace(`${QINIU_BASE_URL_PUBLIC}/`, '');
    default:
      return url;
  }
};

export const getExtensionFromStorageUrl = (url: string) => url.match(/.([a-z]{1,4})$/i)?.[1];

export const getIdFromStorageUrl = (url: string) => url.match(REGEX_UPLOAD_ID)?.[1];

export const isUploadPathnameValid = (pathname?: string) => pathname?.match(REGEX_UPLOAD_PATH);

const getFileNameFromStorageUrl = (url: string) => new URL(url).pathname.match(/\/(.+)$/)?.[1] ?? '';

export const uploadFromClientViaPresignedUrl = async (
  file: File | Blob,
  fileName: string,
  extension: string,
  addRandomSuffix?: boolean
) => {
  const key = addRandomSuffix ? `${fileName}-${generateStorageId()}.${extension}` : `${fileName}.${extension}`;

  const url = await fetch(`${PATH_API_PRESIGNED_URL}/${key}`).then((response) => response.text());

  return fetch(url, { method: 'PUT', body: file }).then(() => `${baseUrlForStorage(CURRENT_STORAGE)}/${key}`);
};

export const uploadPhotoFromClient = async (file: File | Blob, extension = 'jpg') => {
  if (CURRENT_STORAGE === 'qiniu') {
    // 七牛云使用后端 API 上传，避免 CORS 问题
    // 添加随机后缀确保文件名唯一性
    const fileNameWithSuffix = `${PREFIX_UPLOAD}-${generateStorageId()}.${extension}`;
    return qiniuUploadFromClient(file, fileNameWithSuffix);
  } else if (CURRENT_STORAGE === 'cloudflare-r2' || CURRENT_STORAGE === 'aws-s3') {
    // AWS S3 和 Cloudflare R2 使用预签名 URL
    return uploadFromClientViaPresignedUrl(file, PREFIX_UPLOAD, extension, true);
  } else {
    // Vercel Blob 使用其原生上传
    // 添加随机后缀确保文件名唯一性（虽然 Vercel Blob API 会自动添加，但为了保持一致性）
    const fileNameWithSuffix = `${PREFIX_UPLOAD}-${generateStorageId()}.${extension}`;
    return vercelBlobUploadFromClient(file, fileNameWithSuffix);
  }
};

export const putFile = (file: Buffer, fileName: string) => {
  switch (CURRENT_STORAGE) {
    case 'vercel-blob':
      return vercelBlobPut(file, fileName);
    case 'cloudflare-r2':
      return cloudflareR2Put(file, fileName);
    case 'aws-s3':
      return awsS3Put(file, fileName);
    case 'qiniu':
      return qiniuPut(file, fileName);
    default:
      throw new Error(`Unsupported storage type: ${CURRENT_STORAGE}`);
  }
};

export const copyFile = (originUrl: string, destinationFileName: string): Promise<string> => {
  switch (storageTypeFromUrl(originUrl)) {
    case 'vercel-blob':
      return vercelBlobCopy(originUrl, destinationFileName, false);
    case 'cloudflare-r2':
      return cloudflareR2Copy(getFileNameFromStorageUrl(originUrl), destinationFileName, false);
    case 'aws-s3':
      return awsS3Copy(originUrl, destinationFileName, false);
    case 'qiniu':
      return qiniuCopy(getFileNameFromStorageUrl(originUrl), destinationFileName, false);
    default:
      throw new Error(`Unsupported storage type for URL: ${originUrl}`);
  }
};

export const deleteFile = (url: string) => {
  switch (storageTypeFromUrl(url)) {
    case 'vercel-blob':
      return vercelBlobDelete(url);
    case 'cloudflare-r2':
      return cloudflareR2Delete(getFileNameFromStorageUrl(url));
    case 'aws-s3':
      return awsS3Delete(getFileNameFromStorageUrl(url));
    case 'qiniu':
      return qiniuDelete(getFileNameFromStorageUrl(url));
    default:
      throw new Error(`Unsupported storage type for URL: ${url}`);
  }
};

export const moveFile = async (originUrl: string, destinationFileName: string) => {
  const url = await copyFile(originUrl, destinationFileName);
  // If successful, delete original file
  if (url) {
    await deleteFile(originUrl);
  }
  return url;
};

const getStorageUrlsForPrefix = async (prefix = '') => {
  const urls: StorageListResponse = [];

  if (HAS_VERCEL_BLOB_STORAGE) {
    urls.push(...(await vercelBlobList(prefix).catch(() => [])));
  }
  if (HAS_AWS_S3_STORAGE) {
    urls.push(...(await awsS3List(prefix).catch(() => [])));
  }
  if (HAS_CLOUDFLARE_R2_STORAGE) {
    urls.push(...(await cloudflareR2List(prefix).catch(() => [])));
  }
  if (HAS_QINIU_STORAGE) {
    urls.push(...(await qiniuList(prefix).catch(() => [])));
  }

  return urls.sort((a, b) => {
    if (!a.uploadedAt) {
      return 1;
    }
    if (!b.uploadedAt) {
      return -1;
    }
    return b.uploadedAt.getTime() - a.uploadedAt.getTime();
  });
};

export const getStorageUploadUrls = () => getStorageUrlsForPrefix(`${PREFIX_UPLOAD}-`);

export const getStoragePhotoUrls = () => getStorageUrlsForPrefix(`${PREFIX_PHOTO}-`);

export const testStorageConnection = () => getStorageUrlsForPrefix();
