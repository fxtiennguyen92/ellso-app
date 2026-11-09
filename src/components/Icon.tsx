import type { LucideIcon } from 'lucide-react-native';
import ArrowUp from 'lucide-react-native/icons/arrow-up';
import BadgeCheck from 'lucide-react-native/icons/badge-check';
import Bell from 'lucide-react-native/icons/bell';
import Book from 'lucide-react-native/icons/book';
import BookOpen from 'lucide-react-native/icons/book-open';
import CalendarCheck from 'lucide-react-native/icons/calendar-check';
import CalendarClock from 'lucide-react-native/icons/calendar-clock';
import Camera from 'lucide-react-native/icons/camera';
import CircleUserRound from 'lucide-react-native/icons/circle-user-round';
import Bookmark from 'lucide-react-native/icons/bookmark';
import Check from 'lucide-react-native/icons/check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CircleHelp from 'lucide-react-native/icons/circle-help';
import ClipboardList from 'lucide-react-native/icons/clipboard-list';
import Clock from 'lucide-react-native/icons/clock';
import Coins from 'lucide-react-native/icons/coins';
import Copy from 'lucide-react-native/icons/copy';
import Crown from 'lucide-react-native/icons/crown';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import FileText from 'lucide-react-native/icons/file-text';
import GitBranch from 'lucide-react-native/icons/git-branch';
import GraduationCap from 'lucide-react-native/icons/graduation-cap';
import History from 'lucide-react-native/icons/history';
import House from 'lucide-react-native/icons/house';
import Image from 'lucide-react-native/icons/image';
import Info from 'lucide-react-native/icons/info';
import KeyRound from 'lucide-react-native/icons/key-round';
import Layers from 'lucide-react-native/icons/layers';
import LayoutGrid from 'lucide-react-native/icons/layout-grid';
import Lightbulb from 'lucide-react-native/icons/lightbulb';
import Link from 'lucide-react-native/icons/link';
import Lock from 'lucide-react-native/icons/lock';
import LogOut from 'lucide-react-native/icons/log-out';
import Mail from 'lucide-react-native/icons/mail';
import MapIcon from 'lucide-react-native/icons/map';
import MapPin from 'lucide-react-native/icons/map-pin';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import Monitor from 'lucide-react-native/icons/monitor';
import Moon from 'lucide-react-native/icons/moon';
import Palette from 'lucide-react-native/icons/palette';
import Pencil from 'lucide-react-native/icons/pencil';
import Play from 'lucide-react-native/icons/play';
import QrCode from 'lucide-react-native/icons/qr-code';
import Receipt from 'lucide-react-native/icons/receipt';
import RotateCw from 'lucide-react-native/icons/rotate-cw';
import Scale from 'lucide-react-native/icons/scale';
import ScanLine from 'lucide-react-native/icons/scan-line';
import PartyPopper from 'lucide-react-native/icons/party-popper';
import Award from 'lucide-react-native/icons/award';
import Plus from 'lucide-react-native/icons/plus';
import UsersRound from 'lucide-react-native/icons/users-round';
import Search from 'lucide-react-native/icons/search';
import CircleCheckBig from 'lucide-react-native/icons/circle-check-big';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Share2 from 'lucide-react-native/icons/share-2';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import ShoppingCart from 'lucide-react-native/icons/shopping-cart';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import Smartphone from 'lucide-react-native/icons/smartphone';
import Star from 'lucide-react-native/icons/star';
import Sun from 'lucide-react-native/icons/sun';
import Trophy from 'lucide-react-native/icons/trophy';
import Tag from 'lucide-react-native/icons/tag';
import Trash2 from 'lucide-react-native/icons/trash-2';
import Target from 'lucide-react-native/icons/target';
import Ticket from 'lucide-react-native/icons/ticket';
import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import User from 'lucide-react-native/icons/user';
import UserPlus from 'lucide-react-native/icons/user-plus';
import UserRound from 'lucide-react-native/icons/user-round';
import Users from 'lucide-react-native/icons/users';
import Video from 'lucide-react-native/icons/video';
import X from 'lucide-react-native/icons/x';
import Zap from 'lucide-react-native/icons/zap';

/**
 * Icon dùng trên toàn app — MỘT bộ duy nhất: Lucide (lucide.dev), nét viền 24×24, đầu nét bo tròn.
 * Gọi theo tên ngữ nghĩa của app (vd 'courses', 'documents') → map sang icon Lucide ở ICONS bên dưới.
 * Muốn thêm icon: tìm trên lucide.dev, import từ 'lucide-react-native/icons/<tên>' (import lẻ từng icon cho bundle nhẹ),
 * thêm 1 dòng vào ICONS. Không vẽ tay icon riêng để giữ đồng bộ nét.
 */
const ICONS = {
  // chung
  bell: Bell,
  search: Search,
  filter: SlidersHorizontal,
  play: Play,
  pin: MapPin,
  map: MapIcon,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronDown: ChevronDown,
  clock: Clock,
  cart: ShoppingCart,
  plus: Plus,
  users: UsersRound,
  award: Award,
  trophy: Trophy,
  star: Star,
  party: PartyPopper,
  checkCircle: CircleCheckBig,
  sparkles: Sparkles,
  check: Check,
  arrowUp: ArrowUp,
  book: Book,
  bookOpen: BookOpen,
  // thanh điều hướng
  home: House,
  courses: GraduationCap,
  documents: FileText,
  profile: UserRound,
  // icon bài học
  bulb: Lightbulb,
  eye: Eye,
  zap: Zap,
  scale: Scale,
  people: Users,
  layers: Layers,
  key: KeyRound,
  alert: TriangleAlert,
  help: CircleHelp,
  message: MessageCircle,
  clipboard: ClipboardList,
  grid: LayoutGrid,
  branch: GitBranch,
  target: Target,
  // hồ sơ
  qr: QrCode,
  crown: Crown,
  copy: Copy,
  link: Link,
  share: Share2,
  lock: Lock,
  receipt: Receipt,
  ticket: Ticket,
  sun: Sun,
  moon: Moon,
  phone: Smartphone,
  monitor: Monitor,
  shield: ShieldCheck,
  logout: LogOut,
  close: X,
  refresh: RotateCw,
  user: User,
  coins: Coins,
  history: History,
  pencil: Pencil,
  palette: Palette,
  verified: BadgeCheck,
  camera: Camera,
  trash: Trash2,
  basicAccount: CircleUserRound,
  userPlus: UserPlus,
  calendarStart: CalendarCheck,
  calendarEnd: CalendarClock,
  // tài liệu
  bookmark: Bookmark,
  bookmarkFilled: Bookmark,
  tag: Tag,
  video: Video,
  image: Image,
  mail: Mail,
  eyeOff: EyeOff,
  info: Info,
  scan: ScanLine,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
  /** Tô nhạt phần thân icon (dùng cho tab đang chọn). */
  duotone?: boolean;
  opacity?: number;
  /** Tô thân icon tuỳ ý (vd bookmark trên ảnh bìa: nền tối mờ để nổi trên mọi màu bìa). Ghi đè duotone. */
  fill?: string;
  fillOpacity?: number;
};

export function Icon({ name, size = 22, color, strokeWidth = 2, duotone = false, opacity = 1, fill, fillOpacity }: Props) {
  const Glyph = ICONS[name];
  const filled = name === 'bookmarkFilled';
  return (
    // Icon chỉ để trang trí: nút bọc ngoài đã có accessibilityLabel.
    <Glyph
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      fill={fill ?? (filled || duotone ? color : 'none')}
      fillOpacity={fillOpacity ?? (filled ? 1 : duotone ? 0.22 : 0)}
      opacity={opacity}
      pointerEvents="none"
    />
  );
}
