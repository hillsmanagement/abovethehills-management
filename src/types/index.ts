export interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  dateOfBirth?: Date;
  gender: 'male' | 'female' | 'other';
  membershipDate: Date;
  membershipStatus: 'active' | 'inactive' | 'pending';
  department: string[];
  familyMembers: Array<{
    name: string;
    relationship: string;
  }>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Announcement {
  _id: string;
  type: 'announcement';
  subject: string;
  content: string;
  recipients: string[];
  recipientGroups: string[];
  status: 'draft' | 'sent' | 'failed';
  sender: string;
  sentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  _id: string;
  offeringAmount: number;
  titheAmount: number;
  seedAmount: number;
  seedOfFaithAmount: number;
  date: Date;
  paymentMethod: string;
  status: string;
  recordedBy: string;
  pastorEmail: string;
  sentToPastor: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinanceSummary {
    monthly: {
      totalAmount: number;
      offering: number;
      tithe: number;
      seed: number;
      seedOfFaith: number;
    };
    today: {
      totalAmount: number;
      offering: number;
      tithe: number;
      seed: number;
      seedOfFaith: number;
  };
}

export interface AttendanceRecord {
  _id: string;
  serviceDate: string;
  serviceType: string;
  noOfMen: number;
  noOfWomen: number;
  noOfBoys: number;
  noOfGirls: number;
  noOfChildren: number;
  noOfFirstTimers: number;
  totalAttendance: number;
  notes?: string;
  pastorEmail?: string;
  sentToPastor: boolean;
  createdBy: {
    _id: string;
    username: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  error?: string;
} 