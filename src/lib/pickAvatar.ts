import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type AvatarSource = 'camera' | 'library';
export type PickResult = { uri: string } | { error: string } | null;

/** Cạnh ảnh đại diện gửi lên server (px). */
const SIZE = 512;

/**
 * Chọn / chụp ảnh đại diện → cắt vuông giữa ảnh + thu nhỏ 512px + JPEG (~80%) trước khi tải lên.
 * iOS / Android có màn cắt vuông của hệ điều hành; web không có nên tự cắt phần giữa.
 * null = người dùng huỷ. { error } = không có quyền / lỗi.
 */
export async function pickAvatar(source: AvatarSource): Promise<PickResult> {
  try {
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return { error: 'Chưa cho phép dùng camera. Bạn có thể bật lại trong Cài đặt của máy.' };
    } else if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return { error: 'Chưa cho phép truy cập ảnh. Bạn có thể bật lại trong Cài đặt của máy.' };
    }

    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 };
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (res.canceled || !res.assets?.[0]) return null;

    const { uri, width, height } = res.assets[0];
    const side = Math.min(width, height);
    const ctx = ImageManipulator.manipulate(uri);
    if (width && height && width !== height) {
      ctx.crop({ originX: Math.floor((width - side) / 2), originY: Math.floor((height - side) / 2), width: side, height: side });
    }
    if (side > SIZE || !side) ctx.resize({ width: SIZE, height: SIZE });
    const image = await ctx.renderAsync();
    const out = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    return { uri: out.uri };
  } catch {
    return { error: 'Không mở được ảnh, vui lòng thử ảnh khác.' };
  }
}
