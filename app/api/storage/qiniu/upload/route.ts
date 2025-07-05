import { auth } from '@/auth/server';
import { revalidateAdminPaths, revalidatePhotosKey } from '@/photo/cache';
import { ACCEPTED_PHOTO_FILE_TYPES, MAX_PHOTO_UPLOAD_SIZE_IN_BYTES } from '@/photo';
import { isUploadPathnameValid } from '@/platforms/storage';
import { qiniuPut } from '@/platforms/storage/qiniu';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @description 处理七牛云文件上传
 * @param request - Next.js 请求对象
 * @returns NextResponse
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 验证用户身份
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthenticated upload' }, { status: 401 });
    }

    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    if (!file || !fileName) {
      return NextResponse.json({ error: 'Missing file or fileName' }, { status: 400 });
    }

    // 验证文件类型
    if (!ACCEPTED_PHOTO_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // 验证文件大小
    if (file.size > MAX_PHOTO_UPLOAD_SIZE_IN_BYTES) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // 验证文件名格式
    if (!isUploadPathnameValid(fileName)) {
      return NextResponse.json({ error: 'Invalid upload pathname' }, { status: 400 });
    }

    // 转换文件为 Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 上传到七牛云
    const url = await qiniuPut(buffer, fileName);

    // 重新验证缓存
    revalidatePhotosKey();
    revalidateAdminPaths();

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Qiniu upload error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
