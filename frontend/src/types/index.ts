export type RoomStatus = 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';

export interface ActiveSession {
  bookingId: number;
  checkIn: string;
  checkInLocal: string;
  estimatedTotal?: number;
}

export interface Room {
  id: number;
  name: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  description?: string;
  amenities?: string;
  imageUrl?: string;
  status: RoomStatus;
  isPublic: boolean;
  activeSession?: ActiveSession | null;
}

export interface CheckoutBilling {
  bookingId: number;
  roomNumber: string;
  roomName: string;
  checkIn: string;
  checkInLocal: string;
  checkOut: string;
  checkOutLocal: string;
  totalBillableHours: number;
  overnightNights: number;
  hourlyAmount: number;
  overnightAmount: number;
  excessAmount: number;
  totalAmount: number;
  breakdownLines: string[];
}

export interface UpdateRoomStatusResponse {
  room: Room;
  checkIn?: {
    bookingId: number;
    checkIn: string;
    checkInLocal: string;
    message: string;
  };
  checkout?: CheckoutBilling;
  message?: string | null;
}

export interface HourlyRate {
  id: number;
  roomType: string;
  durationHours: number;
  label: string;
  price: number;
  dayType: 'Weekday' | 'Weekend' | 'Holiday';
  isActive: boolean;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface Voucher {
  id: number;
  code: string;
  name: string;
  description?: string;
  discountType: 'Percentage' | 'FixedAmount';
  discountValue: number;
  minDurationHours?: number;
  applicableRoomTypes?: string;
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export interface ComboItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  productPrice: number;
}

export interface Combo {
  id: number;
  name: string;
  description?: string;
  roomType: string;
  durationHours: number;
  comboPrice: number;
  imageUrl?: string;
  isActive: boolean;
  isPublic: boolean;
  items: ComboItem[];
}

export interface Dashboard {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  cleaningRooms: number;
  maintenanceRooms: number;
  todayRevenue: number;
  activeBookings: number;
}

export interface DailyRevenue {
  date: string;
  label: string;
  amount: number;
  count: number;
}

export interface RoomRevenue {
  roomId: number;
  roomNumber: string;
  roomName: string;
  roomType: string;
  amount: number;
  count: number;
}

export interface RevenueTransaction {
  id: number;
  roomNumber: string;
  roomName: string;
  roomType: string;
  checkInLocal: string;
  checkOutLocal: string;
  durationHours: number;
  totalAmount: number;
}

export interface RevenueReport {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  dailyBreakdown: DailyRevenue[];
  byRoom: RoomRevenue[];
  transactions: RevenueTransaction[];
}
