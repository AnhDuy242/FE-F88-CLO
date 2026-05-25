import {
  Clock,
  FileText,
  Search,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react"

export const overviewStats = [
  {
    title: "Hồ sơ hôm nay",
    value: "12",
    description: "+3 so với hôm qua",
    trend: "up",
    icon: FileText,
    trendIcon: TrendingUp,
  },
  {
    title: "Khách hàng mới",
    value: "8",
    description: "+2 so với hôm qua",
    trend: "up",
    icon: Users,
    trendIcon: TrendingUp,
  },
  {
    title: "Tổng giải ngân",
    value: "245M",
    description: "+15% so với hôm qua",
    trend: "up",
    icon: Wallet,
    trendIcon: TrendingUp,
  },
  {
    title: "Chờ xử lý",
    value: "5",
    description: "-2 so với hôm qua",
    trend: "down",
    icon: Clock,
    trendIcon: TrendingDown,
  },
] as const

export const quickActions = [
  {
    title: "Tạo phiên tư vấn",
    description: "Bắt đầu quy trình cho vay mới",
    icon: UserPlus,
  },
  {
    title: "Tra cứu hồ sơ",
    description: "Tìm kiếm hồ sơ khách hàng",
    icon: Search,
  },
  {
    title: "Hồ sơ nháp",
    description: "Tiếp tục hồ sơ chưa hoàn thành",
    icon: FileText,
  },
] as const

export const recentLoans = [
  {
    customerName: "Trần Văn Minh",
    loanCode: "HS-2024-001234",
    amount: "50,000,000 đ",
    time: "10 phút trước",
    status: "Đã duyệt",
    avatar: "T",
  },
  {
    customerName: "Phạm Thị Hoa",
    loanCode: "HS-2024-001235",
    amount: "35,000,000 đ",
    time: "25 phút trước",
    status: "Chờ xử lý",
    avatar: "P",
  },
  {
    customerName: "Nguyễn Văn An",
    loanCode: "HS-2024-001236",
    amount: "80,000,000 đ",
    time: "1 giờ trước",
    status: "Bổ sung hồ sơ",
    avatar: "N",
  },
] as const