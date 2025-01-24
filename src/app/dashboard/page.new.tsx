'use client';

import React, { useState, useEffect } from 'react';
import { membersApi, announcementsApi, financeApi, attendanceApi } from '@/services/api';
import type { Member, Announcement, Transaction, FinanceSummary, AttendanceRecord } from '@/types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';

interface MemberFormData {
  fullName: string;
  address: string;
  phone: string;
  countryCode: string;
  birthDate: string;
  ageCategory: 'children' | 'youth' | 'adults';
  departments: string[];
  isStudent: boolean;
  isNewMember: boolean;
}

interface AttendanceFormData {
  serviceDate: string;
  serviceType: string;
  noOfMen: string;
  noOfWomen: string;
  noOfBoys: string;
  noOfGirls: string;
  noOfChildren: string;
  noOfFirstTimers: string;
  notes: string;
  pastorEmail: string;
}

interface FinanceFormData {
  date: Date;
  offeringAmount: number;
  titheAmount: number;
  seedAmount: number;
  seedOfFaithAmount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'online';
  status: 'completed' | 'pending' | 'cancelled';
}

const countryPhoneCodes = [
  { code: '234', country: 'Nigeria' },
  { code: '1', country: 'United States' },
  { code: '44', country: 'United Kingdom' },
  { code: '27', country: 'South Africa' },
  { code: '254', country: 'Kenya' },
  // Add more countries as needed
].sort((a, b) => a.country.localeCompare(b.country));

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DashboardPage() {
  const router = useRouter();

  // Authentication state
  const [user, setUser] = useState<{ _id: string; role: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // State for members
  const [members, setMembers] = useState<Member[]>([]);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // State for announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  // State for finance
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary>({
    monthly: {
      totalAmount: 0,
      offering: 0,
      tithe: 0,
      seed: 0,
      seedOfFaith: 0
    },
    today: {
      totalAmount: 0,
      offering: 0,
      tithe: 0,
      seed: 0,
      seedOfFaith: 0
    }
  });

  // State for attendance
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [searchDate, setSearchDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attendanceForm, setAttendanceForm] = useState<AttendanceFormData>({
    serviceDate: new Date().toISOString().split('T')[0],
    serviceType: '',
    noOfMen: '',
    noOfWomen: '',
    noOfBoys: '',
    noOfGirls: '',
    noOfChildren: '',
    noOfFirstTimers: '',
    notes: '',
    pastorEmail: ''
  });

  // UI state
  const [activeTab, setActiveTab] = useState('members');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [panelWidth, setPanelWidth] = useState(512);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthSuggestions, setMonthSuggestions] = useState<string[]>([]);
  const [isResizing, setIsResizing] = useState(false);

  // Form states
  const [memberForm, setMemberForm] = useState<MemberFormData>({
    fullName: '',
    address: '',
    phone: '',
    countryCode: '234',
    birthDate: '',
    ageCategory: 'youth',
    departments: [],
    isStudent: false,
    isNewMember: false
  });

  const [announcementForm, setAnnouncementForm] = useState({
    subject: '',
    content: '',
    recipients: [] as string[],
    recipientGroups: [] as string[],
    status: 'sent' as const,
    sentDate: new Date()
  });

  const [financeForm, setFinanceForm] = useState<FinanceFormData>({
    date: new Date(),
    offeringAmount: 0,
    titheAmount: 0,
    seedAmount: 0,
    seedOfFaithAmount: 0,
    paymentMethod: 'cash',
    status: 'completed'
  });

  // ... rest of your existing code ...
// ... existing code ...
} 