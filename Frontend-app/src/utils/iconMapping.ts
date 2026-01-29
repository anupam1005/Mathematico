import * as LucideIcons from 'lucide-react-native';

// Icon mapping from Material Icons to Lucide React Native
export const iconMap: Record<string, any> = {
  // Navigation & UI
  home: LucideIcons.Home,
  book: LucideIcons.Book,
  school: LucideIcons.GraduationCap,
  videocam: LucideIcons.Video,
  person: LucideIcons.User,
  'account-circle': LucideIcons.UserCircle,
  settings: LucideIcons.Settings,
  dashboard: LucideIcons.Settings,
  people: LucideIcons.Users,
  payment: LucideIcons.CreditCard,
  'admin-panel-settings': LucideIcons.Shield,

  // Actions
  search: LucideIcons.Search,
  close: LucideIcons.X,
  schedule: LucideIcons.Calendar,
  'access-time': LucideIcons.Clock,
  'play-circle': LucideIcons.PlayCircle,
  'menu-book': LucideIcons.BookOpen,
  menu: LucideIcons.Menu,
  'arrow-back': LucideIcons.ArrowLeft,
  add: LucideIcons.Plus,
  edit: LucideIcons.Edit,
  delete: LucideIcons.Trash2,
  visibility: LucideIcons.Eye,
  'visibility-off': LucideIcons.EyeOff,
  eye: LucideIcons.Eye,
  'eye-off': LucideIcons.EyeOff,
  refresh: LucideIcons.RefreshCw,
  check: LucideIcons.Check,
  error: LucideIcons.AlertCircle,
  info: LucideIcons.Info,
  help: LucideIcons.HelpCircle,

  // Communication
  email: LucideIcons.Mail,
  lock: LucideIcons.Lock,
  phone: LucideIcons.Phone,
  'location-on': LucideIcons.MapPin,

  // Media & Content
  star: LucideIcons.Star,
  favorite: LucideIcons.Heart,
  share: LucideIcons.Share,
  download: LucideIcons.Download,
  upload: LucideIcons.Upload,
  camera: LucideIcons.Camera,
  image: LucideIcons.Image,
  folder: LucideIcons.Folder,
  save: LucideIcons.Save,

  // Navigation arrows
  'keyboard-arrow-left': LucideIcons.ChevronLeft,
  'keyboard-arrow-right': LucideIcons.ChevronRight,
  'keyboard-arrow-up': LucideIcons.ChevronUp,
  'keyboard-arrow-down': LucideIcons.ChevronDown,
  'arrow-upward': LucideIcons.ArrowUp,
  'arrow-downward': LucideIcons.ArrowDown,
  'arrow-forward': LucideIcons.ArrowRight,

  // More actions
  'more-horiz': LucideIcons.MoreHorizontal,
  'more-vert': LucideIcons.MoreVertical,
  'filter-list': LucideIcons.Filter,
  sort: LucideIcons.ArrowUpDown,
  'view-module': LucideIcons.Grid,
  'view-list': LucideIcons.List,

  // Status & Feedback
  'check-circle': LucideIcons.CheckCircle,
  cancel: LucideIcons.XCircle,
  warning: LucideIcons.AlertTriangle,
  'error-outline': LucideIcons.AlertCircle,
  'info-outline': LucideIcons.Info,

  // Media Controls
  'play-arrow': LucideIcons.Play,
  pause: LucideIcons.Pause,
  stop: LucideIcons.Square,

  // Default fallback
  default: LucideIcons.HelpCircle,
};

// Helper function to get Lucide icon component
export const getLucideIcon = (materialIconName: string) => {
  return iconMap[materialIconName] || iconMap.default;
};
