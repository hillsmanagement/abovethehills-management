'use client';

import React, { useState, useEffect } from 'react';
import { membersApi, announcementsApi, financeApi, attendanceApi } from '@/services/api';
import type { Member, Announcement, Transaction, FinanceSummary, AttendanceRecord } from '@/types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';
import { IoIosArrowUp, IoIosArrowDown } from 'react-icons/io';

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
  offeringAmount: string;
  titheAmount: string;
  seedAmount: string;
  seedOfFaithAmount: string;
}

type AnnouncementStatus = 'draft' | 'sent';

interface AnnouncementForm {
  subject: string;
  content: string;
  recipients: string[];
  recipientGroups: string[];
  status: AnnouncementStatus;
  sentDate: Date;
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

// Add this helper function at the top of the file
const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
};

// Add this before the DashboardPage component
const FloatingScrollButton = () => {
  const [showButton, setShowButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      setShowButton(scrollTop > 100);
      setIsAtBottom(Math.ceil(scrollTop + clientHeight) >= scrollHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToPosition = (position: 'top' | 'bottom') => {
    window[position === 'top' ? 'scrollTo' : 'scrollTo']({
      top: position === 'top' ? 0 : document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  if (!showButton) return null;

  return (
    <div className="fixed right-6 bottom-6 flex flex-col gap-2 z-50">
      <button
        onClick={() => scrollToPosition('top')}
        className={`p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all
          ${!isAtBottom ? 'opacity-100' : 'opacity-50'}`}
        aria-label="Scroll to top"
      >
        <IoIosArrowUp size={24} />
      </button>
      <button
        onClick={() => scrollToPosition('bottom')}
        className={`p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all
          ${isAtBottom ? 'opacity-50' : 'opacity-100'}`}
        aria-label="Scroll to bottom"
      >
        <IoIosArrowDown size={24} />
      </button>
    </div>
  );
};

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

  const [announcementForm, setAnnouncementForm] = useState<AnnouncementForm>({
    subject: '',
    content: '',
    recipients: [],
    recipientGroups: [],
    status: 'draft',
    sentDate: new Date()
  });

  const [financeForm, setFinanceForm] = useState<FinanceFormData>({
    date: new Date(),
    offeringAmount: '',
    titheAmount: '',
    seedAmount: '',
    seedOfFaithAmount: ''
  });

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      router.push('/');
    } else {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedToken = JSON.parse(window.atob(base64));

        if (decodedToken.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          router.push('/');
        } else {
          setUser({
            _id: decodedToken._id,
            role: decodedToken.role
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        router.push('/');
      }
    }
  }, [router]);

  // Load initial data only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      setIsSaving(true);
      setError(null);
      try {
        const [membersData, announcementsData, transactionsData, summaryData, attendanceData] = await Promise.all([
          membersApi.getAll(),
          announcementsApi.getAll(),
          financeApi.getAll(),
          financeApi.getSummary(),
          attendanceApi.getAll()
        ]);

        setMembers(membersData);
        setAnnouncements(announcementsData);
        if (transactionsData?.success) {
        setTransactions(transactionsData.data);
        }
        if (summaryData?.success) {
          setFinanceSummary(summaryData.data);
        }
        setAttendanceRecords(attendanceData.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsSaving(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  // Calculate total amount
  const totalAmount = (parseFloat(financeForm.offeringAmount) || 0) + 
    (parseFloat(financeForm.titheAmount) || 0) + 
    (parseFloat(financeForm.seedAmount) || 0) + 
    (parseFloat(financeForm.seedOfFaithAmount) || 0);

  // Member categories
  const categories = [
    { id: 'all', label: 'All Members' },
    { id: 'choir', label: 'Choir' },
    { id: 'protocol', label: 'Protocol' },
    { id: 'usher', label: 'Usher' },
    { id: 'media', label: 'Media' },
    { id: 'drama', label: 'Drama' },
    { id: 'sanctuary', label: 'Sanctuary' },
    { id: 'taskforce', label: 'Task Force' },
    { id: 'technical', label: 'Technical' },
    { id: 'ict', label: 'ICT' },
    { id: 'divider', label: '|' },
    { id: 'age_cat', label: 'Age Category' },
    { id: 'children', label: '• Children' },
    { id: 'youth', label: '• Youth' },
    { id: 'adults', label: '• Adults' },
    { id: 'divider2', label: '|' },
    { id: 'newcomers', label: 'Newcomers' }
  ];

  // Filter members by category and search query
  const filteredMembers = members.filter(member => {
    const matchesCategory = activeCategory === 'all' || member.department.includes(activeCategory);
    const matchesSearch = searchQuery === '' || 
      member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery) ||
      (member.dateOfBirth && new Date(member.dateOfBirth).toLocaleDateString().includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  // Update loadAttendanceRecords function
  const loadAttendanceRecords = async () => {
    try {
      const response = await attendanceApi.getAll();
      if (response && response.data) {
        setAttendanceRecords(response.data);
      } else {
        setAttendanceRecords([]);
      }
    } catch (error) {
      console.error('Error loading attendance records:', error);
      setError(error instanceof Error ? error.message : 'Failed to load attendance records');
      setAttendanceRecords([]);
    }
  };

  // Handle member submission
  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Validate full name
      const nameParts = memberForm.fullName.trim().split(' ');
      if (nameParts.length < 2) {
        throw new Error('Please enter both first and last name');
      }

      const [firstName, ...lastNameParts] = nameParts;
      const lastName = lastNameParts.join(' ');

      // Validate phone number
      const phone = `+${memberForm.countryCode}${memberForm.phone.replace(/\D/g, '')}`;
      if (!/^\+?[1-9]\d{1,14}$/.test(phone)) {
        throw new Error('Please enter a valid phone number');
      }

      let birthDate = undefined;
      if (memberForm.birthDate) {
        // Parse the birth date (e.g., "January 15" to a Date object)
        const [month, day] = memberForm.birthDate.split(' ');
        const currentYear = new Date().getFullYear();
        const monthIndex = months.findIndex(m => m.toLowerCase() === month.toLowerCase());
        
        if (monthIndex !== -1 && day && !isNaN(Number(day))) {
          birthDate = new Date(Date.UTC(currentYear, monthIndex, Number(day)));
          if (isNaN(birthDate.getTime())) {
            birthDate = undefined;
          }
        }
      }

      const memberData: Omit<Member, '_id' | 'createdAt' | 'updatedAt'> = {
        firstName,
        lastName,
        phone,
        address: {
          street: memberForm.address || 'N/A',
          city: 'N/A',
          state: 'N/A',
          zipCode: 'N/A'
        },
        ...(birthDate && { dateOfBirth: birthDate }),
        gender: 'other',
        membershipDate: new Date(),
        membershipStatus: memberForm.isNewMember ? 'pending' : 'active',
        department: memberForm.departments,
        familyMembers: [],
        notes: `Age Category: ${memberForm.ageCategory}${memberForm.isStudent ? ', Student' : ''}`
      };

      // Clear form and states
      const resetForm = () => {
      setMemberForm({
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
        setShowMemberForm(false);
        setSuccessMessage('Member saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      };

      // If editing existing member
      const existingMember = members.find(m => 
        m.firstName === firstName && 
        m.lastName === lastName && 
        m.phone === phone
      );

      if (existingMember) {
        const updatedMember = await membersApi.update(existingMember._id, memberData);
        setMembers(prev => prev.map(m => m._id === existingMember._id ? updatedMember : m));
      } else {
        const newMember = await membersApi.create(memberData);
        setMembers(prev => [...prev, newMember]);
      }

      resetForm();

    } catch (error: any) {
      console.error('Error saving member:', error);
      setError(error.message || 'Failed to save member');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle announcement submission
  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const newAnnouncement = await announcementsApi.create(announcementForm);
      setAnnouncements(prev => [newAnnouncement, ...prev]);
      setAnnouncementForm({
        subject: '',
        content: '',
        recipients: [],
        recipientGroups: [],
        status: 'draft',
        sentDate: new Date()
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Update the finance summary handling
  const updateFinanceSummary = async () => {
    try {
      const response = await financeApi.getSummary();
      if (response?.success && response?.data) {
        setFinanceSummary(response.data);
      }
    } catch (error) {
      console.error('Error updating finance summary:', error);
    }
  };

  // Update the finance submit handler
  const handleFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const financeData = {
        offeringAmount: parseFloat(financeForm.offeringAmount || '0'),
        titheAmount: parseFloat(financeForm.titheAmount || '0'),
        seedAmount: parseFloat(financeForm.seedAmount || '0'),
        seedOfFaithAmount: parseFloat(financeForm.seedOfFaithAmount || '0'),
        paymentMethod: 'cash',
        date: financeForm.date,
        status: 'completed',
        pastorEmail: 'gracedclem@gmail.com',
        sentToPastor: false // Set this to false by default
      } as const;

      let response;
      if (editingId) {
        response = await financeApi.update(editingId, financeData);
      } else {
        response = await financeApi.create(financeData);
      }

      if (response && response.data) {
      setTransactions(prev => 
        editingId
            ? prev.map(t => t._id === editingId ? response.data : t)
            : Array.isArray(prev) ? [response.data, ...prev] : [response.data]
      );
      }

      await updateFinanceSummary();
      setShowFinanceForm(false);
      setFinanceForm({
        date: new Date(),
        offeringAmount: '',
        titheAmount: '',
        seedAmount: '',
        seedOfFaithAmount: ''
      });
      setSuccessMessage(editingId ? 'Transaction updated successfully' : 'Transaction saved successfully');
      setEditingId(null);
    } catch (err: any) {
      console.error('Finance submission error:', err);
      setError(err.message || 'Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle attendance submission
  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const attendanceData = {
        ...attendanceForm,
        noOfMen: parseInt(attendanceForm.noOfMen) || 0,
        noOfWomen: parseInt(attendanceForm.noOfWomen) || 0,
        noOfBoys: parseInt(attendanceForm.noOfBoys) || 0,
        noOfGirls: parseInt(attendanceForm.noOfGirls) || 0,
        noOfChildren: parseInt(attendanceForm.noOfChildren) || 0,
        noOfFirstTimers: parseInt(attendanceForm.noOfFirstTimers) || 0
      };

      let response: { data: AttendanceRecord };
      if (editingId) {
        response = await attendanceApi.update(editingId, attendanceData);
        setAttendanceRecords(prev => 
          prev.map(record => 
            record._id === editingId ? response.data : record
          )
        );
        setSuccessMessage('Attendance updated successfully');
      } else {
        response = await attendanceApi.create(attendanceData);
        setAttendanceRecords(prev => [response.data, ...prev]);
        setSuccessMessage('Attendance saved successfully');
      }

      setShowAttendanceForm(false);
      setEditingId(null);
      
      // Reset form
      setAttendanceForm({
        serviceDate: new Date().toISOString().split('T')[0],
        serviceType: '',
        noOfMen: '',
        noOfWomen: '',
        noOfBoys: '',
        noOfGirls: '',
        noOfChildren: '',
        noOfFirstTimers: '',
        notes: '',
        pastorEmail: 'gracedclem@gmail.com'
      });
    } catch (err) {
      console.error('Error saving attendance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save attendance';
      setError(errorMessage);
      
      // Handle authentication error
      if (errorMessage.includes('Please log in again')) {
        localStorage.removeItem('token');
        router.push('/');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Update handleSendToPastor
  const handleSendToPastor = async (attendanceId: string) => {
    try {
      await attendanceApi.sendToPastor(attendanceId);
      setSuccessMessage('Attendance sent to pastor successfully');
      
      // Update attendance record in state
      setAttendanceRecords(prev => 
        prev.map(record => 
          record._id === attendanceId 
            ? { ...record, sentToPastor: true }
            : record
        )
      );
    } catch (error) {
      console.error('Error sending attendance:', error);
      setError(error instanceof Error ? error.message : 'Failed to send attendance');
    }
  };

  // Add this function before the return statement
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    
    const startX = e.pageX;
    const startWidth = panelWidth;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = startWidth - (e.pageX - startX);
        // Constrain width between 24rem (384px) and 48rem (768px)
        setPanelWidth(Math.min(Math.max(384, newWidth), 768));
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Render loading state or error if not authenticated
  if (!isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Checking authentication...</h2>
        <p className="text-gray-600">Please wait while we verify your credentials.</p>
      </div>
    </div>;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate total attendance
  const totalAttendance = 
    attendanceForm.noOfMen + 
    attendanceForm.noOfWomen + 
    attendanceForm.noOfBoys + 
    attendanceForm.noOfGirls + 
    attendanceForm.noOfChildren;

  // Update the number input handlers
  const handleNumberInputChange = (field: keyof AttendanceFormData, value: string) => {
    const numberValue = value === '' ? '' : Math.max(0, parseInt(value) || 0).toString();
    setAttendanceForm(prev => ({
      ...prev,
      [field]: numberValue
    }));
  };

  // Calculate total attendance for the form
  const calculateTotalAttendance = () => {
    return [
      attendanceForm.noOfMen,
      attendanceForm.noOfWomen,
      attendanceForm.noOfBoys,
      attendanceForm.noOfGirls,
      attendanceForm.noOfChildren,
      attendanceForm.noOfFirstTimers
    ].reduce((sum, val) => sum + (parseInt(val) || 0), 0);
  };

  // Add service type options
  const serviceTypes = [
    'Sunday Service',
    'Bible Study',
    'Prayer Meeting',
    'Youth Service',
    'Special Service',
    'Other'
  ];

  // Handle date search for attendance
  const handleAttendanceDateSearch = async () => {
    try {
      const response = await attendanceApi.getAll(searchDate);
      if (response && response.data) {
        setAttendanceRecords(response.data);
      }
    } catch (error) {
      console.error('Error searching attendance records:', error);
      setError(error instanceof Error ? error.message : 'Failed to search attendance records');
    }
  };

  // Handle date search for transactions
  const handleFinanceDateSearch = async () => {
    try {
      const response = await financeApi.getAll(searchDate);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error searching transactions:', error);
      setError(error instanceof Error ? error.message : 'Failed to search transactions');
    }
  };

  // Handle edit attendance
  const handleEditAttendance = (record: AttendanceRecord) => {
    setAttendanceForm({
      serviceDate: new Date(record.serviceDate).toISOString().split('T')[0],
      serviceType: record.serviceType,
      noOfMen: record.noOfMen.toString(),
      noOfWomen: record.noOfWomen.toString(),
      noOfBoys: record.noOfBoys.toString(),
      noOfGirls: record.noOfGirls.toString(),
      noOfChildren: record.noOfChildren.toString(),
      noOfFirstTimers: record.noOfFirstTimers.toString(),
      notes: record.notes || '',
      pastorEmail: record.pastorEmail || 'gracedclem@gmail.com'
    });
    setEditingId(record._id);
    setShowAttendanceForm(true);
  };

  // Handle delete attendance
  const handleDeleteAttendance = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    try {
      await attendanceApi.delete(id);
      setAttendanceRecords(prev => prev.filter(record => record._id !== id));
      setSuccessMessage('Attendance record deleted successfully');
    } catch (error) {
      console.error('Error deleting attendance:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete attendance');
    }
  };

  // Validate non-negative numbers
  const validateNonNegativeNumber = (value: string): boolean => {
    if (value === '') return true;
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue >= 0;
  };

  const handleFinanceNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FinanceFormData) => {
    const value = e.target.value;
    if (validateNonNegativeNumber(value)) {
      setFinanceForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle attendance number input change
  const handleAttendanceNumberInputChange = (field: keyof AttendanceFormData, value: string) => {
    if (validateNonNegativeNumber(value)) {
      setAttendanceForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction: Transaction) => {
    setFinanceForm({
      date: new Date(transaction.date),
      offeringAmount: transaction.offeringAmount.toString(),
      titheAmount: transaction.titheAmount.toString(),
      seedAmount: transaction.seedAmount.toString(),
      seedOfFaithAmount: transaction.seedOfFaithAmount.toString()
    });
    setEditingId(transaction._id);
    setShowFinanceForm(true);
  };

  // Handle delete transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const response = await financeApi.delete(id);
      if (response.success) {
        setTransactions(prev => prev.filter(transaction => transaction._id !== id));
        setSuccessMessage('Transaction deleted successfully');
        
        // Refresh summary
        const summary = await financeApi.getSummary();
        setFinanceSummary(summary.data);
      } else {
        setError('Failed to delete transaction');
      }
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      setError(error?.message || 'Failed to delete transaction');
    }
  };

  // Handle send transaction to pastor
  const handleSendTransactionToPastor = async (id: string) => {
    try {
      await financeApi.sendToPastor(id);
      setTransactions(prev => 
        prev.map(transaction => 
          transaction._id === id 
            ? { ...transaction, sentToPastor: true }
            : transaction
        )
      );
      setSuccessMessage('Transaction sent to pastor successfully');
    } catch (error) {
      console.error('Error sending transaction:', error);
      setError(error instanceof Error ? error.message : 'Failed to send transaction');
    }
  };

  const departments = [
    'Choir', 'Drama', 'Usher', 'Protocol', 'ICT', 
    'Media', 'Task Force', 'Pastor', 'Sanctuary', 'Technical'
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Success message toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg z-50">
          {successMessage}
        </div>
      )}

      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-screen w-64 bg-gray-800/40 backdrop-blur-sm border-r border-gray-700/50 flex flex-col">
        <div className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Logo with fallback */}
            <div className="w-24 h-24 relative">
              {logoError ? (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">A</span>
                </div>
              ) : (
                <Image
                  src="/images/church-logo.png"
                  alt="Abovethehills Logo"
                  width={96}
                  height={96}
                  className="rounded-full object-cover shadow-lg ring-2 ring-gray-700/50"
                  onError={() => setLogoError(true)}
                  priority
                />
              )}
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white tracking-tight">Abovethehills</h1>
              <p className="text-sm font-bold text-gray-400 tracking-wide">MANAGEMENT</p>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-1 px-2 flex-1">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 text-sm font-medium rounded-md cursor-not-allowed opacity-50
              ${activeTab === 'announcements' ? 'bg-gray-700/50 text-white' : 'text-gray-400 hover:text-gray-300'}`}
            disabled
          >
            Announcements
            <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-400 rounded-full">
              Coming Soon
            </span>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3
              ${activeTab === 'members' 
                ? 'text-white bg-gray-700/50' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Members
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3
              ${activeTab === 'attendance' 
                ? 'text-white bg-gray-700/50' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-3
              ${activeTab === 'finance' 
                ? 'text-white bg-gray-700/50' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Finance
          </button>
        </div>
        <div className="p-4 border-t border-gray-700/50">
          <button
            onClick={() => {
              // Clear local storage and redirect to login
              localStorage.removeItem('token');
              window.location.href = '/';
            }}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 
              hover:bg-red-500/10 transition-colors flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto">
        <div className="h-full p-8">
          {/* Content based on active tab */}
          {activeTab === 'announcements' && (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center px-4">
              <div className="bg-gray-800/40 rounded-lg p-8 max-w-md mx-auto border border-gray-700/50">
                <h3 className="text-2xl font-bold text-white mb-4">Coming Soon!</h3>
                <p className="text-gray-400">
                  The announcements feature is currently under development. Check back later for updates.
                </p>
                  </div>
                    </div>
          )}

          {/* Members tab content */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  <span className={`${styles.typingText} bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent`}>
                    MEMBERS
                  </span>
                </h2>
                <button
                  onClick={() => setShowMemberForm(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add Member
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, phone, or date of birth..."
                  className="w-full px-4 py-2 pl-10 rounded-lg bg-gray-700/50 text-white border border-gray-600
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
                    focus:outline-none transition-all"
                />
                <svg 
                  className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </div>

              {/* Category filters */}
              <div className={`flex items-center gap-2 overflow-x-auto pb-2 ${styles.scrollable}`}>
                {categories.map(category => (
                  category.id === 'divider' || category.id === 'divider2' ? (
                    <div key={category.id} className="text-gray-600">|</div>
                  ) : category.id === 'age_cat' ? (
                    <span key={category.id} className="px-3 py-1.5 text-sm text-gray-400">
                      {category.label}
                    </span>
                  ) : category.id.match(/children|youth|adults/) ? (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ml-2
                        ${activeCategory === category.id
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/30'}`}
                    >
                      {category.label}
                    </button>
                  ) : (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors
                        ${activeCategory === category.id
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/30'}`}
                    >
                      {category.label}
                    </button>
                  )
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map(member => (
                  <div key={member._id} className="p-4 rounded-lg bg-gray-800/40 border border-gray-700/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-medium text-lg">
                        {member.firstName[0]}{member.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{member.firstName} {member.lastName}</h3>
                        <p className="text-gray-400 text-sm">{member.phone}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {member.department.map((dept, index) => (
                            <span key={index} className="px-1.5 py-0.5 text-xs rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {dept}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setSelectedMember(selectedMember?._id === member._id ? null : member)}
                          className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        
                        {/* Profile Popover */}
                        {selectedMember?._id === member._id && (
                          <div className="absolute right-0 mt-2 w-72 rounded-lg bg-gray-800 border border-gray-700 shadow-xl z-50">
                            <div className="p-4">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl font-medium">
                                  {member.firstName[0]}{member.lastName[0]}
                                </div>
                                <div>
                                  <h4 className="text-lg font-medium text-white">{member.firstName} {member.lastName}</h4>
                                  <p className="text-gray-400">{member.membershipStatus}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs text-gray-500">Phone</label>
                                  <p className="text-white">{member.phone}</p>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">Address</label>
                                  <p className="text-white">{member.address.street}</p>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">Date of Birth</label>
                                  <p className="text-white">
                                    {member.dateOfBirth 
                                      ? new Date(member.dateOfBirth as any).toLocaleDateString('en-US', { 
                                          month: 'long', 
                                          day: 'numeric' 
                                        })
                                      : 'Not provided'}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">Member Since</label>
                                  <p className="text-white">
                                    {new Date(member.membershipDate as any).toLocaleDateString('en-US')}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">Departments</label>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {member.department.map((dept, index) => (
                                      <span key={index} className="px-1.5 py-0.5 text-xs rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        {dept}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                {member.notes && (
                                  <div>
                                    <label className="text-xs text-gray-500">Notes</label>
                                    <p className="text-white">{member.notes}</p>
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
                                <button
                                  onClick={() => {
                                    setMemberForm({
                                      fullName: `${member.firstName} ${member.lastName}`,
                                      address: member.address.street,
                                      phone: member.phone.replace(/^\+\d+/, ''),
                                      countryCode: member.phone.match(/^\+(\d+)/)?.[1] || '234',
                                      birthDate: member.dateOfBirth 
                                        ? new Date(member.dateOfBirth as any).toLocaleDateString('en-US', { 
                                            month: 'long', 
                                            day: 'numeric' 
                                          })
                                        : '',
                                      ageCategory: member.notes?.match(/Age Category: (\w+)/)?.[1] as any || 'youth',
                                      departments: member.department,
                                      isStudent: member.notes?.includes('Student') || false,
                                      isNewMember: member.membershipStatus === 'pending'
                                    });
                                    setShowMemberForm(true);
                                    setSelectedMember(null);
                                  }}
                                  className="flex-1 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 
                                    hover:bg-blue-500/10 rounded transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Are you sure you want to delete this member?')) {
                                      try {
                                        await membersApi.delete(member._id);
                                        setMembers(prev => prev.filter(m => m._id !== member._id));
                                        setSelectedMember(null);
                                        setSuccessMessage('Member deleted successfully');
                                        setTimeout(() => setSuccessMessage(''), 3000);
                                      } catch (error: any) {
                                        setError(error.message);
                                      }
                                    }
                                  }}
                                  className="flex-1 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 
                                    hover:bg-red-500/10 rounded transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance tab content */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  <span className={`${styles.typingText} bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent`}>
                    ATTENDANCE
                  </span>
                </h2>
                <button
                  onClick={() => setShowAttendanceForm(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Mark Attendance
                </button>
              </div>

              {/* Attendance Records */}
              <div className="space-y-4">
                {/* Search by Date */}
                <div className="flex items-center gap-4 mb-4">
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
                      focus:outline-none transition-all"
                  />
                  <button
                    onClick={handleAttendanceDateSearch}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Search
                  </button>
                  {searchDate && (
                    <button
                      onClick={() => {
                        setSearchDate('');
                        loadAttendanceRecords();
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Attendance Records List */}
                {attendanceRecords.map(record => (
                  <div key={record._id} className="p-4 rounded-lg bg-gray-800/40 border border-gray-700/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-white capitalize">{record.serviceType}</h3>
                        <p className="text-sm text-gray-400">
                          {new Date(record.serviceDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditAttendance(record)}
                          className="px-3 py-1.5 rounded text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAttendance(record._id)}
                          className="px-3 py-1.5 rounded text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleSendToPastor(record._id)}
                          disabled={record.sentToPastor}
                          className={`px-3 py-1.5 rounded text-sm ${
                            record.sentToPastor
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                          }`}
                        >
                          {record.sentToPastor ? 'Sent to Pastor' : 'Send to Pastor'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Men</p>
                        <p className="text-lg text-white">{record.noOfMen || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Women</p>
                        <p className="text-lg text-white">{record.noOfWomen || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Boys</p>
                        <p className="text-lg text-white">{record.noOfBoys || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Girls</p>
                        <p className="text-lg text-white">{record.noOfGirls || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Children</p>
                        <p className="text-lg text-white">{record.noOfChildren || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">First Timers</p>
                        <p className="text-lg text-white">{record.noOfFirstTimers || 0}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 rounded bg-gray-700/30">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Total Attendance:</span>
                        <span className="text-xl font-bold text-white">
                          {(record.noOfMen || 0) + 
                           (record.noOfWomen || 0) + 
                           (record.noOfBoys || 0) + 
                           (record.noOfGirls || 0) + 
                           (record.noOfChildren || 0) + 
                           (record.noOfFirstTimers || 0)}
                        </span>
                      </div>
                    </div>

                    {record.notes && (
                      <div className="mt-4 text-gray-400">
                        <p className="text-sm font-medium text-gray-500">Notes:</p>
                        <p>{record.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Finance tab content */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  <span className={`${styles.typingText} bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent`}>
                    FINANCE
                  </span>
                </h2>
                <button
                  onClick={() => setShowFinanceForm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Record Transaction</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-lg bg-gray-800/40 border border-gray-700/50">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Today's Total</h3>
                  <p className="text-2xl font-bold text-white">₦{financeSummary.today.totalAmount.toLocaleString() || ''}</p>
                </div>
                <div className="p-6 rounded-lg bg-gray-800/40 border border-gray-700/50">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Monthly Total</h3>
                  <p className="text-2xl font-bold text-white">₦{financeSummary.monthly.totalAmount.toLocaleString() || ''}</p>
                </div>

                {/* Add detailed breakdown */}
                <div className="col-span-2 p-6 rounded-lg bg-gray-800/40 border border-gray-700/50">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Today's Breakdown</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-lg font-medium text-white mb-4">Today's Breakdown</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Offering:</span>
                          <span className="text-white">₦{(financeSummary.today?.offering ?? '').toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tithe:</span>
                          <span className="text-white">₦{(financeSummary.today?.tithe ?? '').toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Seed:</span>
                          <span className="text-white">₦{(financeSummary.today?.seed ?? '').toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Seed of Faith:</span>
                          <span className="text-white">₦{(financeSummary.today?.seedOfFaith ?? '').toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-white mb-4">Monthly Breakdown</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Offering:</span>
                          <span className="text-white">₦{(financeSummary.monthly?.offering ?? '').toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tithe:</span>
                          <span className="text-white">₦{(financeSummary.monthly?.tithe ?? '').toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Seed:</span>
                          <span className="text-white">₦{(financeSummary.monthly?.seed ?? '').toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Seed of Faith:</span>
                          <span className="text-white">₦{(financeSummary.monthly?.seedOfFaith ?? '').toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-800/40 border border-gray-700/50 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-700/50 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-white">Transactions</h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-gray-700/50 text-white border border-gray-600
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
                          focus:outline-none transition-all"
                      />
                      <button
                        onClick={handleFinanceDateSearch}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                  {Array.isArray(transactions) && transactions.length > 0 ? (
                    <div key="transactions-list" className="divide-y divide-gray-700/50">
                      {transactions.map(transaction => (
                        <div key={transaction._id} className="px-6 py-4">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <p className="text-sm text-gray-400">
                                {new Date(transaction.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditTransaction(transaction)}
                                className="px-3 py-1.5 rounded text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(transaction._id)}
                                className="px-3 py-1.5 rounded text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => handleSendTransactionToPastor(transaction._id)}
                                disabled={transaction.sentToPastor}
                                className={`px-3 py-1.5 rounded text-sm ${
                                  transaction.sentToPastor
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                                }`}
                              >
                                {transaction.sentToPastor ? 'Sent to Pastor' : 'Send to Pastor'}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {transaction.offeringAmount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Offering:</span>
                                <span className="text-gray-300">₦{transaction.offeringAmount.toLocaleString()}</span>
                              </div>
                            )}
                            {transaction.titheAmount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Tithe:</span>
                                <span className="text-gray-300">₦{transaction.titheAmount.toLocaleString()}</span>
                              </div>
                            )}
                            {transaction.seedAmount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Seed:</span>
                                <span className="text-gray-300">₦{transaction.seedAmount.toLocaleString()}</span>
                              </div>
                            )}
                            {transaction.seedOfFaithAmount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Seed of Faith:</span>
                                <span className="text-gray-300">₦{transaction.seedOfFaithAmount.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-700/50">
                              <span className="font-medium text-gray-300">Total:</span>
                              <span className="font-medium text-white">₦{(
                                transaction.offeringAmount +
                                transaction.titheAmount +
                                transaction.seedAmount +
                                transaction.seedOfFaithAmount
                              ).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-4 text-gray-400 text-center">
                      No transactions found
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Forms Container */}
      <div className="fixed inset-y-0 right-0 z-50">
        {/* Member Form */}
        {showMemberForm && (
          <div className={`${styles.slidePanel}`}>
            <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">
                {editingId ? 'Edit Member' : 'Add New Member'}
              </h2>
              <button
                onClick={() => {
                  setShowMemberForm(false);
                  setEditingId(null);
                }}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleMemberSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="col-span-2">
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={memberForm.fullName}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-gray-700/50 text-white border border-gray-600
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
                      focus:outline-none transition-all"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Phone Number */}
                <div className="col-span-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex gap-2">
                    <select
                      value={memberForm.countryCode}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, countryCode: e.target.value }))}
                      className="w-28 px-2 py-2 rounded-xl bg-gray-700/50 text-white border border-gray-600
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
                        focus:outline-none transition-all"
                    >
                      {countryPhoneCodes.map(({ code, country }) => (
                        <option key={code} value={code} className="bg-gray-800 text-white">
                          +{code} {country}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      id="phone"
                      value={memberForm.phone}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                      required
                      className="flex-1 px-3 py-2 rounded-xl bg-gray-700/50 text-white border border-gray-600
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
                        focus:outline-none transition-all"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-300">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={memberForm.address}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-gray-700/50 text-white border border-gray-600
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
                      focus:outline-none transition-all"
                    placeholder="Enter address (optional)"
                  />
                </div>

                {/* Birth Date */}
                <div className="col-span-1">
                  <label htmlFor="birthDate" className="block text-sm font-medium text-gray-300">
                    Date of Birth (optional)
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      id="birthDate"
                      value={memberForm.birthDate}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMemberForm(prev => ({ ...prev, birthDate: value }));
                        if (value && !value.includes(' ')) {
                          const suggestions = months.filter(month => 
                            month.toLowerCase().startsWith(value.toLowerCase())
                          );
                          setMonthSuggestions(suggestions);
                        } else {
                          setMonthSuggestions([]);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-gray-700/50 text-white border border-gray-600
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
                        focus:outline-none transition-all"
                      placeholder="e.g. January 15"
                    />
                    {monthSuggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-lg max-h-48 overflow-auto">
                        {monthSuggestions.map((month) => (
                          <li
                            key={month}
                            className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                            onClick={() => {
                              setMemberForm(prev => ({ ...prev, birthDate: month + ' ' }));
                              setMonthSuggestions([]);
                            }}
                          >
                            {month}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Age Category */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Age Category <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {['children', 'youth', 'adults'].map((category) => (
                      <label key={category} className="flex-1">
                        <input
                          type="radio"
                          name="ageCategory"
                          value={category}
                          checked={memberForm.ageCategory === category}
                          onChange={(e) => setMemberForm(prev => ({ ...prev, ageCategory: e.target.value as any }))}
                          className="sr-only"
                        />
                        <span className={`block px-3 py-2 rounded-xl text-xs text-center cursor-pointer transition-all
                          ${memberForm.ageCategory === category
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Status */}
                <div className="col-span-2 flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={memberForm.isStudent}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, isStudent: e.target.checked }))}
                      className="sr-only"
                    />
                    <span className={`w-4 h-4 border rounded-lg transition-all flex items-center justify-center
                      ${memberForm.isStudent
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-600 hover:border-gray-500'}`}
                    >
                      {memberForm.isStudent && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm text-gray-300">Student</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={memberForm.isNewMember}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, isNewMember: e.target.checked }))}
                      className="sr-only"
                    />
                    <span className={`w-4 h-4 border rounded-lg transition-all flex items-center justify-center
                      ${memberForm.isNewMember
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-600 hover:border-gray-500'}`}
                    >
                      {memberForm.isNewMember && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm text-gray-300">New Member</span>
                  </label>
                </div>

                {/* Departments */}
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Departments</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['Choir', 'Drama', 'Usher', 'Protocol', 'ICT', 'Media', 'Task Force', 'Pastor', 'Sanctuary', 'Technical'].map((dept) => (
                      <label key={dept} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={memberForm.departments.includes(dept)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMemberForm(prev => ({
                                ...prev,
                                departments: [...prev.departments, dept]
                              }));
                            } else {
                              setMemberForm(prev => ({
                                ...prev,
                                departments: prev.departments.filter(d => d !== dept)
                              }));
                            }
                          }}
                          className="sr-only"
                        />
                        <span className={`block w-full px-3 py-2 rounded-xl text-sm cursor-pointer transition-all text-center
                          ${memberForm.departments.includes(dept)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                          {dept}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowMemberForm(false);
                    setEditingId(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-3 py-1.5 rounded-xl text-sm text-white font-medium transition-all
                    ${isSaving
                      ? 'bg-blue-600/50 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isSaving ? 'Saving...' : editingId ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Attendance Form */}
        {showAttendanceForm && (
          <div className={`${styles.slidePanel}`}>
            <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Mark Attendance</h2>
              <button
                onClick={() => {
                  setShowAttendanceForm(false);
                  setEditingId(null);
                }}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAttendanceSubmit} className="p-6 space-y-6">
              {/* Form content */}
            </form>
          </div>
        )}

        {/* Finance Form */}
        {showFinanceForm && (
          <div className={`${styles.slidePanel}`}>
            <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Record Transaction</h2>
              <button
                onClick={() => {
                  setShowFinanceForm(false);
                  setEditingId(null);
                }}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleFinanceSubmit} className="p-6 space-y-6">
              {/* Form content */}
            </form>
          </div>
        )}

        {/* Announcement Form */}
        {showAnnouncementForm && (
          <div className={`${styles.slidePanel}`}>
            <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Add Announcement</h2>
              <button
                onClick={() => setShowAnnouncementForm(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAnnouncementSubmit} className="p-6 space-y-6">
              {/* Form content */}
            </form>
          </div>
        )}
      </div>

      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={() => {
          setShowMemberForm(false);
          setShowAttendanceForm(false);
          setShowFinanceForm(false);
          setShowAnnouncementForm(false);
          setEditingId(null);
        }}
      />
      <FloatingScrollButton />
    </div>
  );
} 