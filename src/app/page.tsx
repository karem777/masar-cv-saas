"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  FileText,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Download,
  Copy,
  Check,
  Upload,
  Globe,
  HelpCircle,
  ArrowUpRight,
  Zap,
  Edit3,
  Smartphone,
  UserCheck,
  LogOut,
  Shield,
  MessageSquare,
  Send,
  Clock,
  Image as ImageIcon,
  XCircle,
  Users,
  RefreshCw,
  Eye,
  Settings,
  Trash2,
  Ban,
  KeyRound,
  PlusCircle,
  LayoutTemplate,
  Award,
  Crown
} from "lucide-react";
import {
  AnalysisResult,
  RewrittenCV,
  DEFAULT_SITE_SETTINGS,
  SiteSettings
} from "@/types/cv";
import { SAMPLE_PRESETS } from "@/lib/samples";

interface LoggedInUser {
  id: string;
  identifier: string;
  name: string;
  isAdmin: boolean;
  isBanned?: boolean;
  plan: "free" | "single" | "pro";
  paymentStatus: "none" | "pending" | "approved" | "rejected";
  createdAt?: string;
}

interface AdminPayment {
  id: string;
  userId: string;
  userIdentifier: string;
  userName: string;
  plan: "single" | "pro";
  amountEgp: number;
  senderPhone: string;
  walletOwnerName: string;
  screenshotDataUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface SupportMsg {
  id: string;
  threadUserId: string;
  userIdentifier: string;
  userName: string;
  sender: "user" | "admin";
  text: string;
  createdAt: string;
  isReadByAdmin?: boolean;
}

export default function MasarSaaSPage() {
  const [uiLang, setUiLang] = useState<"ar" | "en">("ar");
  const isAr = uiLang === "ar";

  // Dynamic Site Settings (controlled from Admin Dashboard)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  // User Auth State
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authIdentifier, setAuthIdentifier] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authName, setAuthName] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);

  // Admin View Mode on the SAME URL
  const [adminViewMode, setAdminViewMode] = useState<"admin" | "app">("admin");
  const [adminTab, setAdminTab] = useState<
    "payments" | "users" | "settings" | "support"
  >("payments");
  const [adminPayments, setAdminPayments] = useState<AdminPayment[]>([]);
  const [adminUsers, setAdminUsers] = useState<LoggedInUser[]>([]);
  const [adminSupportMessages, setAdminSupportMessages] = useState<SupportMsg[]>([]);
  const [adminSettingsForm, setAdminSettingsForm] =
    useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string>("");
  const [isRefreshingAdmin, setIsRefreshingAdmin] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [replyText, setReplyText] = useState<string>("");

  // Admin User Management Filters & Manual Add
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const [manualUserIdentifier, setManualUserIdentifier] = useState<string>("");
  const [manualUserName, setManualUserName] = useState<string>("");
  const [manualUserPassword, setManualUserPassword] = useState<string>("");
  const [manualUserPlan, setManualUserPlan] = useState<"free" | "single" | "pro">("pro");
  const [manualUserMsg, setManualUserMsg] = useState<string>("");

  // Vodafone Cash Payment Form State
  const [showPricingModal, setShowPricingModal] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<"single" | "pro">("single");
  const [senderPhone, setSenderPhone] = useState<string>("");
  const [walletOwnerName, setWalletOwnerName] = useState<string>("");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string>("");
  const [screenshotFileName, setScreenshotFileName] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string>("");
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string>("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  // Inputs for CV & Job Description
  const [cvText, setCvText] = useState<string>(SAMPLE_PRESETS[0].cvText);
  const [pdfBase64, setPdfBase64] = useState<string>("");
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>(
    SAMPLE_PRESETS[0].jobDescription
  );

  // Analysis & CV Template state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [editableCv, setEditableCv] = useState<RewrittenCV | null>(null);
  const [isEditingCv, setIsEditingCv] = useState<boolean>(false);
  const [cvTemplate, setCvTemplate] = useState<"harvard" | "corporate" | "tech">(
    "harvard"
  );

  // Active tab in results
  const [activeTab, setActiveTab] = useState<
    "ats-report" | "rewritten-cv" | "cover-letter" | "interview-prep"
  >("ats-report");

  // Customer Support State
  const [guestId, setGuestId] = useState<string>("");
  const [supportMessages, setSupportMessages] = useState<SupportMsg[]>([]);
  const [supportText, setSupportText] = useState<string>("");
  const [guestContact, setGuestContact] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [isSendingSupport, setIsSendingSupport] = useState<boolean>(false);
  const [supportStatusMsg, setSupportStatusMsg] = useState<string>("");

  const [copiedId, setCopiedId] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const supportSectionRef = useRef<HTMLDivElement | null>(null);

  const isUnlocked =
    Boolean(result?.isUnlocked) ||
    Boolean(siteSettings.freeAllUsersPromo) ||
    currentUser?.plan === "pro" ||
    currentUser?.plan === "single" ||
    Boolean(currentUser?.isAdmin);

  const fetchAdminData = useCallback(async () => {
    setIsRefreshingAdmin(true);
    try {
      const res = await fetch("/api/admin");
      if (res.ok) {
        const data = await res.json();
        setAdminPayments(data.payments || []);
        setAdminUsers(data.users || []);
        setAdminSupportMessages(data.supportMessages || []);
        if (data.settings) {
          setAdminSettingsForm((prev) =>
            prev.siteNameAr === DEFAULT_SITE_SETTINGS.siteNameAr
              ? data.settings
              : prev
          );
        }
      }
    } finally {
      setIsRefreshingAdmin(false);
    }
  }, []);

  const fetchAuthStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (data.settings) {
        setSiteSettings((prev) => ({ ...prev, ...data.settings }));
      }
      if (data.user) {
        setCurrentUser(data.user);
        if (data.user.isAdmin) {
          fetchAdminData();
        }
      } else {
        setCurrentUser(null);
      }
    } catch {
      // ignore
    }
  }, [fetchAdminData]);

  const fetchSupportMessages = useCallback(async (gId: string) => {
    try {
      const res = await fetch(`/api/support?guestId=${encodeURIComponent(gId)}`);
      if (res.ok) {
        const data = await res.json();
        setSupportMessages(data.messages || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let storedGuest = localStorage.getItem("masar_guest_id");
    if (!storedGuest) {
      storedGuest = "gst_" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("masar_guest_id", storedGuest);
    }
    setGuestId(storedGuest);
    fetchAuthStatus();
    fetchSupportMessages(storedGuest);
  }, [fetchAuthStatus, fetchSupportMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAuthStatus();
      if (guestId) fetchSupportMessages(guestId);
    }, 7000);
    return () => clearInterval(interval);
  }, [fetchAuthStatus, fetchSupportMessages, guestId]);

  const handleLoadPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setCvText(preset.cvText);
    setJobDescription(preset.jobDescription);
    setPdfBase64("");
    setPdfFileName("");
    setErrorMsg("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1] || "";
        setPdfBase64(base64);
        setPdfFileName(file.name);
        if (!cvText.trim()) {
          setCvText(`[PDF Uploaded: ${file.name}]`);
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setCvText((reader.result as string) || "");
        setPdfBase64("");
        setPdfFileName(file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotDataUrl(reader.result as string);
      setScreenshotFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async () => {
    if ((!cvText.trim() && !pdfBase64) || !jobDescription.trim()) {
      setErrorMsg(
        isAr
          ? "من فضلك أدخل السيرة الذاتية (أو ارفع ملف PDF) مع وصف الوظيفة المطلوبة."
          : "Please enter your CV (or upload a PDF) along with the target job description."
      );
      return;
    }

    setErrorMsg("");
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText,
          pdfBase64,
          jobDescription,
          uiLang
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data as AnalysisResult);
      setEditableCv((data as AnalysisResult).rewrittenCv);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : isAr
          ? "حدث خطأ أثناء الفحص، حاول مرة أخرى."
          : "Something went wrong during analysis."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (result && !result.isUnlocked && isUnlocked) {
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmittingAuth(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: authMode,
          identifier: authIdentifier,
          password: authPassword,
          name: authName
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAuthError(data.error || "خطأ في تسجيل الدخول");
        return;
      }
      setCurrentUser(data.user);
      setShowAuthModal(false);
      setAuthPassword("");
      if (data.user?.isAdmin) {
        setAdminViewMode("admin");
        const adminRes = await fetch("/api/admin");
        if (adminRes.ok) {
          const adminData = await adminRes.json();
          setAdminPayments(adminData.payments || []);
          setAdminUsers(adminData.users || []);
          setAdminSupportMessages(adminData.supportMessages || []);
          if (adminData.settings) setAdminSettingsForm(adminData.settings);
        }
      }
    } catch {
      setAuthError("حدث خطأ في الاتصال");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" })
    });
    setCurrentUser(null);
  };

  const handleSubmitVodafonePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");
    setPaymentSuccessMsg("");

    if (!currentUser) {
      setShowPricingModal(false);
      setShowAuthModal(true);
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          senderPhone,
          walletOwnerName,
          screenshotDataUrl
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPaymentError(data.error || "تأكد من ملء جميع البيانات ورفع صورة التحويل");
        return;
      }

      setPaymentSuccessMsg(
        "تم إرسال بيانات وصورة التحويل بنجاح! جاري مراجعة التحويل من الإدارة وسيتم فتح حسابك تلقائياً فور التأكيد."
      );
      setSenderPhone("");
      setWalletOwnerName("");
      setScreenshotDataUrl("");
      setScreenshotFileName("");
      await fetchAuthStatus();
    } catch {
      setPaymentError("حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleSendSupportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportText.trim()) return;
    setIsSendingSupport(true);
    setSupportStatusMsg("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: supportText.trim(),
          guestId,
          guestContact,
          guestName
        })
      });
      if (res.ok) {
        setSupportText("");
        setSupportStatusMsg("تم إرسال رسالتك لخدمة العملاء بنجاح! سيظهر الرد هنا.");
        await fetchSupportMessages(guestId);
      }
    } finally {
      setIsSendingSupport(false);
    }
  };

  // ==================== ADMIN ACTIONS ====================
  const handleAdminPaymentAction = async (
    paymentId: string,
    action: "approve_payment" | "reject_payment" | "delete_payment"
  ) => {
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, paymentId })
    });
    await fetchAdminData();
  };

  const handleAdminSetUserPlan = async (
    userId: string,
    plan: "free" | "single" | "pro"
  ) => {
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_user_plan", userId, plan })
    });
    await fetchAdminData();
  };

  const handleAdminToggleBan = async (userId: string) => {
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_ban_user", userId })
    });
    await fetchAdminData();
  };

  const handleAdminDeleteUser = async (userId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المستخدم نهائياً؟")) return;
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_user", userId })
    });
    await fetchAdminData();
  };

  const handleAdminResetPassword = async (userId: string) => {
    const newPassword = window.prompt("أدخل كلمة المرور الجديدة لهذا المستخدم:");
    if (!newPassword) return;
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_user_password", userId, newPassword })
    });
    alert("تم تغيير كلمة المرور بنجاح");
  };

  const handleAdminManualCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualUserMsg("");
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_user_manual",
        identifier: manualUserIdentifier,
        name: manualUserName,
        password: manualUserPassword,
        plan: manualUserPlan
      })
    });
    if (res.ok) {
      setManualUserIdentifier("");
      setManualUserName("");
      setManualUserPassword("");
      setManualUserMsg("✓ تم إضافة/تحديث الحساب وتحديد باقته بنجاح!");
      await fetchAdminData();
    }
  };

  const handleAdminSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSavedMsg("");
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_settings",
        settings: adminSettingsForm
      })
    });
    if (res.ok) {
      const data = await res.json();
      setSiteSettings(data.settings);
      setAdminSettingsForm(data.settings);
      setSettingsSavedMsg("✓ تم حفظ جميع إعدادات الموقع والأسعار بنجاح!");
      setTimeout(() => setSettingsSavedMsg(""), 4000);
    }
  };

  const handleAdminSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreadId || !replyText.trim()) return;
    const threadMsgs = adminSupportMessages.filter(
      (m) => m.threadUserId === selectedThreadId
    );
    const first = threadMsgs[0];
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reply_support",
        threadUserId: selectedThreadId,
        userIdentifier: first?.userIdentifier || "",
        userName: first?.userName || "عميل",
        text: replyText.trim()
      })
    });
    setReplyText("");
    await fetchAdminData();
  };

  const handleAdminDeleteThread = async (threadUserId: string) => {
    if (!window.confirm("حذف هذه المحادثة بالكامل؟")) return;
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_support_thread", threadUserId })
    });
    if (selectedThreadId === threadUserId) setSelectedThreadId("");
    await fetchAdminData();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const handlePrintPdf = () => {
    if (!isUnlocked) {
      setShowPricingModal(true);
      return;
    }
    window.print();
  };

  const barColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  // Group support messages for Admin view
  const threadsMap = new Map<
    string,
    {
      threadUserId: string;
      userName: string;
      userIdentifier: string;
      lastMessage: string;
      lastTime: string;
      unreadCount: number;
      messages: SupportMsg[];
    }
  >();

  for (const msg of adminSupportMessages) {
    const existing = threadsMap.get(msg.threadUserId);
    if (!existing) {
      threadsMap.set(msg.threadUserId, {
        threadUserId: msg.threadUserId,
        userName: msg.userName,
        userIdentifier: msg.userIdentifier,
        lastMessage: msg.text,
        lastTime: msg.createdAt,
        unreadCount: msg.sender === "user" && !msg.isReadByAdmin ? 1 : 0,
        messages: [msg]
      });
    } else {
      existing.messages.push(msg);
      existing.lastMessage = msg.text;
      existing.lastTime = msg.createdAt;
      if (msg.sender === "user" && !msg.isReadByAdmin) {
        existing.unreadCount += 1;
      }
    }
  }
  const adminThreads = Array.from(threadsMap.values()).sort((a, b) =>
    a.lastTime < b.lastTime ? 1 : -1
  );
  const pendingPaymentsCount = adminPayments.filter((p) => p.status === "pending").length;
  const approvedRevenueEgp = adminPayments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + (p.amountEgp || 0), 0);
  const activePaidUsersCount = adminUsers.filter(
    (u) => !u.isAdmin && (u.plan === "pro" || u.plan === "single")
  ).length;
  const unreadSupportCount = adminThreads.reduce((acc, t) => acc + t.unreadCount, 0);

  const filteredAdminUsers = adminUsers.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.identifier.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  });

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col bg-[#07070a] text-stone-100 relative overflow-x-hidden"
    >
      {/* Ambient Royal Gold Top Glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-gradient-to-b from-amber-500/[0.07] via-amber-600/[0.02] to-transparent z-0" />

      {/* Top Luxury Navbar */}
      <header className="sticky top-0 z-30 border-b border-amber-500/20 bg-[#08080c]/85 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 flex items-center justify-center shadow-[0_0_25px_rgba(217,119,6,0.4)] ring-1 ring-amber-200/60">
              <Crown className="w-5 h-5 text-neutral-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-black text-xl sm:text-2xl tracking-tight bg-gradient-to-l from-amber-100 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                  {isAr ? siteSettings.siteNameAr : siteSettings.siteNameEn}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 shadow-inner">
                  {currentUser?.isAdmin ? "👑 الإدارة العليا (Owner)" : "✦ Harvard Executive"}
                </span>
              </div>
              <p className="text-xs text-stone-400 hidden sm:block mt-0.5">
                {isAr
                  ? "المنصة التنفيذية الفاخرة لصياغة السيرة الذاتية وتخطي الـ ATS"
                  : "Prestigious Harvard ATS Executive Resume Suite"}
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {currentUser?.isAdmin && (
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#111118] border border-amber-500/35 shadow-inner">
                <button
                  onClick={() => setAdminViewMode("admin")}
                  className={`flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-xl transition ${
                    adminViewMode === "admin"
                      ? "bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-neutral-950 shadow-md shadow-amber-500/20"
                      : "text-stone-400 hover:text-amber-200"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>لوحة التحكم الشاملة</span>
                  {pendingPaymentsCount + unreadSupportCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-extrabold">
                      {pendingPaymentsCount + unreadSupportCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setAdminViewMode("app")}
                  className={`flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-xl transition ${
                    adminViewMode === "app"
                      ? "bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-neutral-950 shadow-md shadow-amber-500/20"
                      : "text-stone-400 hover:text-amber-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>معاينة الموقع وأداة الـ CV</span>
                </button>
              </div>
            )}

            {!currentUser?.isAdmin && (
              <>
                {isUnlocked ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{isAr ? "العضوية التنفيذية مفعلة ✓" : "Executive VIP Active ✓"}</span>
                  </span>
                ) : currentUser?.paymentStatus === "pending" ? (
                  <button
                    onClick={() => setShowPricingModal(true)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300"
                  >
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>{isAr ? "التحويل قيد المراجعة" : "Payment Pending"}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPricingModal(true)}
                    className="flex items-center gap-1.5 text-xs font-black px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 hover:brightness-110 text-neutral-950 shadow-[0_6px_25px_rgba(217,119,6,0.35)] transition"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>
                      {isAr
                        ? `تفعيل العضوية بـ فودافون كاش (${siteSettings.singlePlanPriceEgp} ج.م)`
                        : `VIP Unlock (${siteSettings.singlePlanPriceEgp} EGP)`}
                    </span>
                  </button>
                )}
              </>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3.5 py-2 rounded-xl bg-[#12121a] border border-amber-500/25 text-amber-100">
                  ✦ {currentUser.identifier}
                </span>
                <button
                  onClick={handleLogout}
                  title="تسجيل الخروج"
                  className="p-2.5 rounded-xl bg-[#12121a] hover:bg-rose-950/60 text-stone-400 hover:text-rose-300 border border-stone-800 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-[#12121a] hover:bg-[#191924] text-amber-100 border border-amber-500/30 transition shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? "تسجيل دخول / حساب جديد" : "Login / Sign Up"}</span>
              </button>
            )}

            {!currentUser?.isAdmin && (
              <button
                onClick={() =>
                  supportSectionRef.current?.scrollIntoView({ behavior: "smooth" })
                }
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl bg-[#12121a] hover:bg-[#191924] text-stone-300 border border-stone-800 hover:border-amber-500/30 transition"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">
                  {isAr ? "خدمة العملاء" : "Support"}
                </span>
              </button>
            )}

            {!currentUser?.isAdmin && (
              <button
                onClick={() => setUiLang(isAr ? "en" : "ar")}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-2.5 rounded-xl bg-[#12121a] hover:bg-[#191924] text-stone-300 border border-stone-800 hover:border-amber-500/30 transition"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? "EN" : "عربي"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* TOTAL-CONTROL ADMIN DASHBOARD (When logged in as karemaboelnsr9@gmail.com) */}
      {/* ===================================================================== */}
      {currentUser?.isAdmin && adminViewMode === "admin" ? (
        <main dir="rtl" className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Live KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="rounded-2xl bg-[#101017]/90 border border-amber-500/20 p-4 space-y-1 shadow-lg">
              <span className="text-[11px] text-stone-400">إجمالي الأرباح المؤكدة</span>
              <div className="text-2xl font-extrabold text-emerald-400">
                {approvedRevenueEgp} ج.م
              </div>
            </div>
            <div className="rounded-2xl bg-[#101017]/90 border border-amber-400/40 p-4 space-y-1 shadow-lg">
              <span className="text-[11px] text-amber-300">تحويلات بانتظار التفعيل</span>
              <div className="text-2xl font-extrabold text-amber-400">
                {pendingPaymentsCount}
              </div>
            </div>
            <div className="rounded-2xl bg-[#101017]/90 border border-amber-500/25 p-4 space-y-1 shadow-lg">
              <span className="text-[11px] text-amber-200">مشتركين مفعلين حالياً</span>
              <div className="text-2xl font-extrabold text-amber-300">
                {activePaidUsersCount}
              </div>
            </div>
            <div className="rounded-2xl bg-[#101017]/90 border border-stone-800 p-4 space-y-1 shadow-lg">
              <span className="text-[11px] text-stone-400">إجمالي المسجلين</span>
              <div className="text-2xl font-extrabold text-white">
                {adminUsers.length}
              </div>
            </div>
            <div className="rounded-2xl bg-[#101017]/90 border border-stone-800 p-4 space-y-1 shadow-lg">
              <span className="text-[11px] text-stone-400">رسائل دعم غير مقروءة</span>
              <div className="text-2xl font-extrabold text-amber-400">
                {unreadSupportCount}
              </div>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setAdminTab("payments")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                  adminTab === "payments"
                    ? "bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-neutral-950 shadow-lg shadow-amber-500/25"
                    : "bg-[#111118] text-stone-400 hover:text-amber-200 border border-stone-800"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>تحويلات فودافون كاش ({adminPayments.length})</span>
                {pendingPaymentsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold">
                    {pendingPaymentsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setAdminTab("users")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                  adminTab === "users"
                    ? "bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-neutral-950 shadow-lg shadow-amber-500/25"
                    : "bg-[#111118] text-stone-400 hover:text-amber-200 border border-stone-800"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>التحكم في المستخدمين والاشتراكات ({adminUsers.length})</span>
              </button>

              <button
                onClick={() => setAdminTab("settings")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                  adminTab === "settings"
                    ? "bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-neutral-950 shadow-lg shadow-amber-500/25"
                    : "bg-[#111118] text-stone-400 hover:text-amber-200 border border-stone-800"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>إعدادات الموقع والأسعار والدفع (كل كبيرة وصغيرة)</span>
              </button>

              <button
                onClick={() => setAdminTab("support")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                  adminTab === "support"
                    ? "bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-neutral-950 shadow-lg shadow-amber-500/25"
                    : "bg-[#111118] text-stone-400 hover:text-amber-200 border border-stone-800"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>خدمة العملاء ({adminThreads.length})</span>
                {unreadSupportCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-neutral-950 text-[10px] font-extrabold">
                    {unreadSupportCount}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={fetchAdminData}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#111118] hover:bg-[#181822] border border-amber-500/25 text-xs font-bold text-amber-200 transition"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshingAdmin ? "animate-spin" : ""}`}
              />
              <span>تحديث</span>
            </button>
          </div>

          {/* ADMIN TAB 1: VODAFONE CASH PAYMENTS */}
          {adminTab === "payments" && (
            <div className="space-y-4">
              {adminPayments.length === 0 ? (
                <div className="rounded-2xl bg-[#101017] border border-amber-500/15 p-12 text-center text-stone-400 text-sm">
                  لا توجد طلبات تحويل فودافون كاش حتى الآن. عندما يقوم أي عميل برفع صورة التحويل ستظهر هنا فوراً.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {adminPayments.map((pay) => (
                    <div
                      key={pay.id}
                      className={`rounded-2xl bg-[#101017] border p-5 space-y-4 ${
                        pay.status === "pending"
                          ? "border-amber-400/60 shadow-lg shadow-amber-500/10"
                          : pay.status === "approved"
                          ? "border-emerald-500/40"
                          : "border-rose-500/30 opacity-75"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs text-stone-400 block">حساب العميل:</span>
                          <h3 className="font-bold text-base text-white">
                            {pay.userName} ({pay.userIdentifier})
                          </h3>
                          <span className="text-[11px] text-stone-500">
                            {new Date(pay.createdAt).toLocaleString("ar-EG")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                              pay.status === "pending"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : pay.status === "approved"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            }`}
                          >
                            {pay.status === "pending"
                              ? "⏳ قيد المراجعة"
                              : pay.status === "approved"
                              ? "✅ مقبول ومفعل"
                              : "❌ مرفوض / ملغي"}
                          </span>
                          <button
                            onClick={() =>
                              handleAdminPaymentAction(pay.id, "delete_payment")
                            }
                            title="حذف سجل التحويل"
                            className="p-1.5 rounded-lg bg-stone-900 hover:bg-rose-900/50 text-stone-400 hover:text-rose-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#08080c] border border-stone-800 text-xs">
                        <div>
                          <span className="text-stone-400 block">المبلغ والباقة:</span>
                          <strong className="text-amber-300 font-bold">
                            {pay.amountEgp} ج.م ({pay.plan === "pro" ? "شهري Pro" : "CV واحد"})
                          </strong>
                        </div>
                        <div>
                          <span className="text-stone-400 block">الرقم المحول منه:</span>
                          <strong className="text-white font-mono">{pay.senderPhone}</strong>
                        </div>
                        <div>
                          <span className="text-stone-400 block">المحفظة باسم:</span>
                          <strong className="text-white">{pay.walletOwnerName}</strong>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-stone-400">
                          <span>صورة إيصال التحويل المرفقة:</span>
                          <button
                            onClick={() => setPreviewImage(pay.screenshotDataUrl)}
                            className="flex items-center gap-1 text-amber-400 hover:underline font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>تكبير الصورة</span>
                          </button>
                        </div>
                        <div
                          onClick={() => setPreviewImage(pay.screenshotDataUrl)}
                          className="h-44 rounded-xl bg-[#08080c] border border-stone-800 overflow-hidden cursor-pointer flex items-center justify-center"
                        >
                          <img
                            src={pay.screenshotDataUrl}
                            alt="Transfer receipt"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() =>
                            handleAdminPaymentAction(pay.id, "approve_payment")
                          }
                          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>قبول وتفعيل اشتراك العميل</span>
                        </button>

                        <button
                          onClick={() =>
                            handleAdminPaymentAction(pay.id, "reject_payment")
                          }
                          className="py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>رفض / إلغاء الاشتراك</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ADMIN TAB 2: FULL USER & SUBSCRIPTION CONTROL */}
          {adminTab === "users" && (
            <div className="space-y-6">
              {/* Manual Add / Activate User Form */}
              <form
                onSubmit={handleAdminManualCreateUser}
                className="rounded-2xl bg-[#101017] border border-amber-500/30 p-5 space-y-4"
              >
                <h3 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  <span>إضافة مستخدم جديد أو تفعيل اشتراك لأي إيميل/رقم يدوياً:</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <input
                    type="text"
                    value={manualUserIdentifier}
                    onChange={(e) => setManualUserIdentifier(e.target.value)}
                    placeholder="الإيميل أو رقم الموبايل"
                    required
                    dir="ltr"
                    className="px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-xs text-white font-mono"
                  />
                  <input
                    type="text"
                    value={manualUserName}
                    onChange={(e) => setManualUserName(e.target.value)}
                    placeholder="اسم المشترك"
                    className="px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={manualUserPassword}
                    onChange={(e) => setManualUserPassword(e.target.value)}
                    placeholder="كلمة المرور للحساب"
                    required
                    className="px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-xs text-white"
                  />
                  <select
                    value={manualUserPlan}
                    onChange={(e) =>
                      setManualUserPlan(e.target.value as "free" | "single" | "pro")
                    }
                    className="px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-xs text-white"
                  >
                    <option value="pro">باقة الشهر الكامل (Pro)</option>
                    <option value="single">باقة الـ CV الواحد</option>
                    <option value="free">حساب مجاني (مقفول)</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 hover:brightness-110 text-neutral-950 font-extrabold text-xs transition"
                  >
                    حفظ وتفعيل الحساب
                  </button>
                </div>
                {manualUserMsg && (
                  <p className="text-xs text-emerald-400 font-bold">{manualUserMsg}</p>
                )}
              </form>

              {/* Search Bar */}
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="ابحث عن أي مستخدم بالإيميل أو رقم الموبايل أو الاسم..."
                  className="max-w-md w-full px-4 py-2.5 rounded-xl bg-[#101017] border border-amber-500/25 text-xs sm:text-sm text-white"
                />
              </div>

              {/* Users Table */}
              <div className="rounded-2xl bg-[#101017] border border-amber-500/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <thead className="bg-[#08080c] text-amber-200/80 border-b border-amber-500/20">
                      <tr>
                        <th className="p-4">المستخدم</th>
                        <th className="p-4">الإيميل / رقم الموبايل</th>
                        <th className="p-4">حالة الاشتراك</th>
                        <th className="p-4">تفعيل أو إلغاء الاشتراك</th>
                        <th className="p-4">إدارة الحساب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/80">
                      {filteredAdminUsers.map((u) => (
                        <tr
                          key={u.id}
                          className={`hover:bg-[#14141d] ${
                            u.isBanned ? "opacity-50 bg-rose-950/20" : ""
                          }`}
                        >
                          <td className="p-4 font-bold text-white">
                            {u.name}
                            {u.isBanned && (
                              <span className="mr-2 px-2 py-0.5 rounded bg-rose-600 text-white text-[10px]">
                                محظور
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-amber-300">{u.identifier}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                u.plan === "pro"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : u.plan === "single"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-stone-800 text-stone-400"
                              }`}
                            >
                              {u.plan === "pro"
                                ? "✅ Pro شهري مفعل"
                                : u.plan === "single"
                                ? "✅ باقة CV واحد مفعلة"
                                : "🔒 مجاني (مقفول)"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => handleAdminSetUserPlan(u.id, "pro")}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold"
                              >
                                تفعيل Pro
                              </button>
                              <button
                                onClick={() => handleAdminSetUserPlan(u.id, "single")}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold"
                              >
                                تفعيل CV واحد
                              </button>
                              {!u.isAdmin && (
                                <button
                                  onClick={() => handleAdminSetUserPlan(u.id, "free")}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-600/25 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-bold"
                                >
                                  🚫 إلغاء الاشتراك
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {!u.isAdmin && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleAdminResetPassword(u.id)}
                                  title="تغيير كلمة مرور المستخدم"
                                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleAdminToggleBan(u.id)}
                                  title={u.isBanned ? "فك الحظر" : "حظر الحساب"}
                                  className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleAdminDeleteUser(u.id)}
                                  title="حذف الحساب نهائياً"
                                  className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN TAB 3: FULL SITE & PRICING SETTINGS */}
          {adminTab === "settings" && (
            <form
              onSubmit={handleAdminSaveSettings}
              className="rounded-2xl bg-[#101017] border border-amber-500/20 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-amber-200">
                    إعدادات الموقع والأسعار والدفع (تحكم كامل)
                  </h3>
                  <p className="text-xs text-stone-400">
                    أي تعديل هنا يظهر فوراً لجميع زوار ومستخدمي الموقع بدون الحاجة لتعديل الكود
                  </p>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 hover:brightness-110 text-neutral-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition"
                >
                  حفظ جميع الإعدادات
                </button>
              </div>

              {settingsSavedMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  {settingsSavedMsg}
                </div>
              )}

              {/* Section 1: Vodafone Cash & Pricing */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-amber-400">
                  1. إعدادات فودافون كاش وأسعار الباقات
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-300 font-bold">
                      رقم محفظة فودافون كاش للدفع:
                    </label>
                    <input
                      type="text"
                      value={adminSettingsForm.vodafoneCashNumber}
                      onChange={(e) =>
                        setAdminSettingsForm({
                          ...adminSettingsForm,
                          vodafoneCashNumber: e.target.value
                        })
                      }
                      dir="ltr"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-sm text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-300 font-bold">
                      سعر باقة الـ CV الواحد (ج.م):
                    </label>
                    <input
                      type="number"
                      value={adminSettingsForm.singlePlanPriceEgp}
                      onChange={(e) =>
                        setAdminSettingsForm({
                          ...adminSettingsForm,
                          singlePlanPriceEgp: Number(e.target.value)
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-sm text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-300 font-bold">
                      سعر باقة الشهر الكامل Pro (ج.م):
                    </label>
                    <input
                      type="number"
                      value={adminSettingsForm.proPlanPriceEgp}
                      onChange={(e) =>
                        setAdminSettingsForm({
                          ...adminSettingsForm,
                          proPlanPriceEgp: Number(e.target.value)
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-300 font-bold">
                      اسم باقة الـ CV الواحد:
                    </label>
                    <input
                      type="text"
                      value={adminSettingsForm.singlePlanNameAr}
                      onChange={(e) =>
                        setAdminSettingsForm({
                          ...adminSettingsForm,
                          singlePlanNameAr: e.target.value
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-300 font-bold">
                      اسم باقة الشهر الكامل (Pro):
                    </label>
                    <input
                      type="text"
                      value={adminSettingsForm.proPlanNameAr}
                      onChange={(e) =>
                        setAdminSettingsForm({
                          ...adminSettingsForm,
                          proPlanNameAr: e.target.value
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Site Branding & Hero Text */}
              <div className="space-y-4 pt-4 border-t border-stone-800">
                <h4 className="text-sm font-bold text-amber-400">
                  2. نصوص وعناوين الموقع الرئيسية
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-300 font-bold">
                      اسم الموقع (بالعربي):
                    </label>
                    <input
                      type="text"
                      value={adminSettingsForm.siteNameAr}
                      onChange={(e) =>
                        setAdminSettingsForm({
                          ...adminSettingsForm,
                          siteNameAr: e.target.value
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-300 font-bold">
                      شريط التنبيه العلوي:
                    </label>
                    <input
                      type="text"
                      value={adminSettingsForm.announcementAr}
                      onChange={(e) =>
                        setAdminSettingsForm({
                          ...adminSettingsForm,
                          announcementAr: e.target.value
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-300 font-bold">
                      العنوان الرئيسي (السطر الأول):
                    </label>
                    <input
                      type="text"
                      value={adminSettingsForm.heroTitleAr}
                      onChange={(e) =>
                        setAdminSettingsForm({
                          ...adminSettingsForm,
                          heroTitleAr: e.target.value
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-300 font-bold">
                      العنوان الملون (السطر الثاني):
                    </label>
                    <input
                      type="text"
                      value={adminSettingsForm.heroHighlightAr}
                      onChange={(e) =>
                        setAdminSettingsForm({
                          ...adminSettingsForm,
                          heroHighlightAr: e.target.value
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Paywall Strictness & AI Key */}
              <div className="space-y-4 pt-4 border-t border-stone-800">
                <h4 className="text-sm font-bold text-emerald-400">
                  3. التحكم في القفل (Paywall) ومفتاح الذكاء الاصطناعي
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-300 font-bold">
                      عدد الكلمات المفتاحية الناقصة الظاهرة مجاناً للزائر:
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={adminSettingsForm.freeVisibleMissingKeywords}
                      onChange={(e) =>
                        setAdminSettingsForm({
                          ...adminSettingsForm,
                          freeVisibleMissingKeywords: Number(e.target.value)
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs text-stone-300 font-bold">
                      مفتاح Gemini API Key (اختياري — لتفعيل Gemini 3.8 Flash على السيرفر):
                    </label>
                    <input
                      type="password"
                      value={adminSettingsForm.geminiApiKey}
                      onChange={(e) =>
                        setAdminSettingsForm({
                          ...adminSettingsForm,
                          geminiApiKey: e.target.value
                        })
                      }
                      placeholder="AIzaSy..."
                      dir="ltr"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adminSettingsForm.freeAllUsersPromo}
                      onChange={(e) =>
                        setAdminSettingsForm({
                          ...adminSettingsForm,
                          freeAllUsersPromo: e.target.checked
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span>فتح جميع مميزات الموقع مجاناً للكل مؤقتاً (وضع العروض الترويجية)</span>
                  </label>
                </div>
              </div>
            </form>
          )}

          {/* ADMIN TAB 4: CUSTOMER SUPPORT */}
          {adminTab === "support" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-[#101017] border border-amber-500/20 p-4 space-y-3 max-h-[550px] overflow-y-auto">
                <h3 className="font-bold text-sm text-amber-200 px-2">
                  محادثات خدمة العملاء ({adminThreads.length})
                </h3>
                {adminThreads.length === 0 ? (
                  <p className="text-xs text-stone-400 p-4 text-center">
                    لا توجد رسائل خدمة عملاء حتى الآن.
                  </p>
                ) : (
                  adminThreads.map((th) => (
                    <div
                      key={th.threadUserId}
                      onClick={() => setSelectedThreadId(th.threadUserId)}
                      className={`w-full text-right p-3.5 rounded-xl border transition space-y-1 cursor-pointer ${
                        selectedThreadId === th.threadUserId
                          ? "bg-amber-500/15 border-amber-400"
                          : "bg-[#08080c] border-stone-800 hover:border-amber-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{th.userName}</span>
                        <div className="flex items-center gap-1.5">
                          {th.unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-neutral-950 text-[10px] font-extrabold">
                              {th.unreadCount} جديد
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdminDeleteThread(th.threadUserId);
                            }}
                            className="text-stone-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <span className="text-[11px] text-amber-300 block font-mono">
                        {th.userIdentifier}
                      </span>
                      <p className="text-xs text-stone-400 truncate">{th.lastMessage}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="lg:col-span-2 rounded-2xl bg-[#101017] border border-amber-500/20 p-5 flex flex-col h-[550px]">
                {!selectedThreadId ? (
                  <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">
                    اختر محادثة من القائمة على اليمين لعرض الرسائل والرد على العميل
                  </div>
                ) : (
                  (() => {
                    const activeThread = adminThreads.find(
                      (t) => t.threadUserId === selectedThreadId
                    );
                    if (!activeThread) return null;
                    return (
                      <>
                        <div className="border-b border-stone-800 pb-3 mb-4">
                          <h4 className="font-bold text-sm text-white">
                            {activeThread.userName}
                          </h4>
                          <span className="text-xs text-amber-300 font-mono">
                            {activeThread.userIdentifier}
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                          {activeThread.messages.map((m) => (
                            <div
                              key={m.id}
                              className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                                m.sender === "admin"
                                  ? "bg-gradient-to-r from-amber-300 to-yellow-500 text-neutral-950 font-semibold mr-auto rounded-tl-none"
                                  : "bg-[#08080c] border border-stone-800 text-stone-200 ml-auto rounded-tr-none"
                              }`}
                            >
                              <span className="block text-[10px] opacity-75 mb-1 font-bold">
                                {m.sender === "admin"
                                  ? "أنت (خدمة العملاء)"
                                  : `${m.userName} (${m.userIdentifier})`}
                              </span>
                              <p className="whitespace-pre-wrap">{m.text}</p>
                            </div>
                          ))}
                        </div>

                        <form
                          onSubmit={handleAdminSendReply}
                          className="pt-4 mt-3 border-t border-stone-800 flex gap-2"
                        >
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="اكتب ردك للعميل هنا..."
                            className="flex-1 px-4 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-xs sm:text-sm text-white"
                          />
                          <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-neutral-950 font-extrabold text-xs flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>إرسال الرد</span>
                          </button>
                        </form>
                      </>
                    );
                  })()
                )}
              </div>
            </div>
          )}

          {previewImage && (
            <div
              onClick={() => setPreviewImage(null)}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
            >
              <img
                src={previewImage}
                alt="Full receipt"
                className="max-h-[90vh] max-w-[90vw] rounded-2xl border border-amber-500/40 shadow-2xl"
              />
            </div>
          )}
        </main>
      ) : (
        /* ===================================================================== */
        /* NORMAL USER CV SAAS VIEW                                              */
        /* ===================================================================== */
        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10 space-y-12">
          {/* Hero Section */}
          <section className="text-center max-w-4xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs font-semibold shadow-[0_0_25px_rgba(217,119,6,0.15)]">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isAr
                  ? siteSettings.announcementAr
                  : "75% of resumes are rejected by ATS bots before a human recruiter ever sees them"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-stone-100 leading-[1.2]">
              {isAr ? (
                <>
                  {siteSettings.heroTitleAr}{" "}
                  <span className="bg-gradient-to-l from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-sm">
                    {siteSettings.heroHighlightAr}
                  </span>
                </>
              ) : (
                <>
                  See Why ATS Rejects Your CV &{" "}
                  <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                    Download a Harvard Executive 96%-Match Resume
                  </span>
                </>
              )}
            </h1>

            <p className="text-stone-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? siteSettings.heroSubtitleAr
                : "Scan your current CV score for free in 10 seconds, and get a full-page Harvard Executive ATS-optimized PDF resume."}
            </p>

            {/* Quick Sample Loader Pills */}
            <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs text-stone-400 font-semibold">
                {isAr ? "✦ جرب بمثال تنفيذي جاهز بضغطة واحدة:" : "✦ Try a 1-click executive sample:"}
              </span>
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleLoadPreset(preset.id)}
                  className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-[#111118] hover:bg-amber-500/15 text-stone-300 hover:text-amber-200 border border-amber-500/20 hover:border-amber-400/50 transition shadow-sm"
                >
                  {isAr ? preset.labelAr : preset.labelEn}
                </button>
              ))}
            </div>
          </section>

          {/* Dual Input Workspace */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-[#101017]/90 backdrop-blur-xl border border-amber-500/20 hover:border-amber-500/35 p-6 flex flex-col space-y-4 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.85)] transition">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm sm:text-base text-stone-100">
                      {isAr ? "1. سيرتك الذاتية الحالية (CV)" : "1. Your Current Resume / CV"}
                    </h2>
                    <p className="text-xs text-stone-400">
                      {isAr
                        ? "ارفع ملف PDF أو الصق نص الـ CV هنا"
                        : "Upload a PDF file or paste your resume text below"}
                    </p>
                  </div>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-400/30 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isAr ? "رفع ملف PDF / نص" : "Upload PDF / TXT"}</span>
                  </button>
                </div>
              </div>

              {pdfFileName && (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  <span>
                    {isAr ? `تم إرفاق الملف: ${pdfFileName}` : `Attached file: ${pdfFileName}`}
                  </span>
                  <button
                    onClick={() => {
                      setPdfBase64("");
                      setPdfFileName("");
                    }}
                    className="underline hover:text-white"
                  >
                    {isAr ? "إزالة" : "Remove"}
                  </button>
                </div>
              )}

              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                rows={9}
                dir="auto"
                className="w-full rounded-2xl bg-[#08080c] border border-stone-800/90 focus:border-amber-400/70 focus:outline-none p-4 text-xs sm:text-sm text-stone-200 leading-relaxed resize-y font-mono shadow-inner"
              />
            </div>

            <div className="rounded-3xl bg-[#101017]/90 backdrop-blur-xl border border-amber-500/20 hover:border-amber-500/35 p-6 flex flex-col space-y-4 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.85)] transition">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm sm:text-base text-stone-100">
                      {isAr
                        ? "2. وصف الوظيفة المستهدفة (Job Description)"
                        : "2. Target Job Description"}
                    </h2>
                    <p className="text-xs text-stone-400">
                      {isAr
                        ? "انسخ تفاصيل ومتطلبات الوظيفة من LinkedIn أو Wuzzuf"
                        : "Paste the job requirements from LinkedIn, Wuzzuf, or Indeed"}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-300 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25">
                  {isAr ? "✦ معيار هارفارد ATS" : "✦ Harvard ATS Standard"}
                </span>
              </div>

              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={9}
                dir="auto"
                className="w-full rounded-2xl bg-[#08080c] border border-stone-800/90 focus:border-amber-400/70 focus:outline-none p-4 text-xs sm:text-sm text-stone-200 leading-relaxed resize-y font-mono shadow-inner"
              />
            </div>
          </section>

          {errorMsg && (
            <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center">
              {errorMsg}
            </div>
          )}

          {/* Primary Luxury Analyze CTA */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <button
              onClick={() => runAnalysis()}
              disabled={isAnalyzing}
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-4.5 rounded-2xl font-black text-base sm:text-lg text-neutral-950 bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 hover:brightness-110 shadow-[0_10px_40px_rgba(217,119,6,0.4)] ring-1 ring-amber-200/60 disabled:opacity-60 transition-all cursor-pointer"
            >
              <Sparkles className={`w-5 h-5 ${isAnalyzing ? "animate-spin" : ""}`} />
              <span>
                {isAnalyzing
                  ? isAr
                    ? "جاري فحص الـ ATS وبناء السيرة الذاتية التنفيذية..."
                    : "Scanning ATS & Building Harvard Executive CV..."
                  : isAr
                  ? "افحص سيرتك الذاتية وابنِ النسخة التنفيذية الآن"
                  : "Scan My Resume & Build Harvard Executive CV"}
              </span>
            </button>
          </div>

          {/* Results Dashboard */}
          {result && editableCv && (
            <section ref={resultsRef} className="pt-4 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setActiveTab("ats-report")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition ${
                      activeTab === "ats-report"
                        ? "bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-neutral-950 shadow-lg shadow-amber-500/25"
                        : "bg-[#111118] text-stone-400 hover:text-amber-200 border border-stone-800"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      {isAr
                        ? `1. تقرير الفحص (${result.atsScore}%)`
                        : `1. ATS Audit (${result.atsScore}%)`}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("rewritten-cv")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition ${
                      activeTab === "rewritten-cv"
                        ? "bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-neutral-950 shadow-lg shadow-amber-500/25"
                        : "bg-[#111118] text-stone-400 hover:text-amber-200 border border-stone-800"
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>
                      {isAr
                        ? `2. الـ CV التنفيذي الكامل (${result.optimizedScore}% Harvard ATS)`
                        : `2. Harvard Executive CV (${result.optimizedScore}%)`}
                    </span>
                    {!isUnlocked && <Lock className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => setActiveTab("cover-letter")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition ${
                      activeTab === "cover-letter"
                        ? "bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-neutral-950 shadow-lg shadow-amber-500/25"
                        : "bg-[#111118] text-stone-400 hover:text-amber-200 border border-stone-800"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>
                      {isAr ? "3. خطاب التقديم ورسالة الـ HR" : "3. Cover Letter & HR DM"}
                    </span>
                    {!isUnlocked && <Lock className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => setActiveTab("interview-prep")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition ${
                      activeTab === "interview-prep"
                        ? "bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-neutral-950 shadow-lg shadow-amber-500/25"
                        : "bg-[#111118] text-stone-400 hover:text-amber-200 border border-stone-800"
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>{isAr ? "4. أسئلة الإنترفيو المتوقعة" : "4. Interview Prep"}</span>
                    {!isUnlocked && <Lock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* TAB 1: ATS REPORT */}
              {activeTab === "ats-report" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="rounded-3xl bg-[#101017]/95 border border-amber-500/25 p-6 flex flex-col justify-between space-y-5 shadow-xl">
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex flex-col items-center justify-center space-y-1">
                          <span className="text-[11px] font-bold text-rose-300">
                            {isAr ? "الـ CV الحالي" : "Current CV"}
                          </span>
                          <span className="text-3xl font-extrabold text-rose-400">
                            {result.atsScore}%
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
                            {isAr ? "❌ معرض للرفض" : "❌ High Risk"}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex flex-col items-center justify-center space-y-1">
                          <span className="text-[11px] font-bold text-amber-200">
                            {isAr ? "نسخة مسارك التنفيذية" : "Masarak Executive"}
                          </span>
                          <span className="text-3xl font-extrabold text-amber-300">
                            {result.optimizedScore}%
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 font-semibold">
                            {isAr ? "✅ يتخطى الـ ATS" : "✅ ATS Ready"}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-300 leading-relaxed text-center">
                        {isAr
                          ? `تم إعادة بناء سيرتك الذاتية بالكامل على منصة مسارك وفق معيار جامعة هارفارد التنفيذي لترتفع نسبة القبول من ${result.atsScore}% إلى ${result.optimizedScore}%.`
                          : `We rebuilt your CV using the Harvard Executive Standard, boosting your score from ${result.atsScore}% to ${result.optimizedScore}%.`}
                      </p>

                      <button
                        onClick={() => setActiveTab("rewritten-cv")}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 hover:brightness-110 text-neutral-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition"
                      >
                        <span>
                          {isAr
                            ? `اعرض الـ CV التنفيذي الكامل (${result.optimizedScore}%)`
                            : `View Full Harvard Executive CV (${result.optimizedScore}%)`}
                        </span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="lg:col-span-2 rounded-3xl bg-[#101017]/90 border border-amber-500/20 p-6 space-y-6 shadow-xl">
                      <div>
                        <h3 className="font-bold text-base text-amber-200 mb-2">
                          {isAr ? "تشخيص نظام الفرز الآلي (ATS)" : "ATS Bot Diagnostic"}
                        </h3>
                        <p className="text-sm text-stone-200 leading-relaxed bg-[#08080c] border border-amber-500/25 p-4 rounded-2xl">
                          {result.executiveFeedback}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          {
                            label: isAr
                              ? "تطابق الكلمات المفتاحية (Keywords)"
                              : "Keyword Match",
                            val: result.subScores.keywordMatch
                          },
                          {
                            label: isAr
                              ? "الأرقام والإنجازات القياسية (XYZ Impact)"
                              : "Impact & Metrics",
                            val: result.subScores.impactAndMetrics
                          },
                          {
                            label: isAr
                              ? "معيار هارفارد لقراءة الـ ATS"
                              : "Harvard ATS Readability",
                            val: result.subScores.atsReadability
                          },
                          {
                            label: isAr
                              ? "التوافق مع المسمى الوظيفي (Alignment)"
                              : "Role Alignment",
                            val: result.subScores.roleAlignment
                          }
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-2xl bg-[#08080c] border border-stone-800 space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-stone-300">{item.label}</span>
                              <span className="text-amber-300 font-bold">{item.val}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${barColor(item.val)}`}
                                style={{ width: `${item.val}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-3xl bg-[#101017]/90 border border-stone-800 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {isAr
                            ? `كلمات مفتاحية موجودة في سيرتك (${result.matchedKeywords.length})`
                            : `Matched Keywords Found (${result.matchedKeywords.length})`}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.matchedKeywords.map((kw, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-medium px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                          >
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl bg-[#101017]/90 border border-amber-500/30 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>
                          {isAr
                            ? `كلمات مفتاحية حرجة ناقصة تسببت في خفض الدرجة`
                            : `Missing Critical ATS Keywords`}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 items-center">
                        {result.missingKeywords.map((kw, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-medium px-3 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30"
                          >
                            ✗ {kw}
                          </span>
                        ))}

                        {!isUnlocked && result.lockedMissingKeywordsCount > 0 && (
                          <button
                            onClick={() => setShowPricingModal(true)}
                            className="flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 hover:brightness-110 text-neutral-950 transition cursor-pointer shadow-md"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              {isAr
                                ? `+${result.lockedMissingKeywordsCount} كلمات مفتاحية مخفية (اشترك بـ ${siteSettings.singlePlanPriceEgp} ج.م لكشفها)`
                                : `+${result.lockedMissingKeywordsCount} Hidden Keywords (Click to Unlock)`}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================================================== */}
              {/* TAB 2: HARVARD EXECUTIVE FULL-PAGE A4 RESUME + 3 TEMPLATES            */}
              {/* ===================================================================== */}
              {activeTab === "rewritten-cv" && (
                <div className="space-y-5 relative">
                  {/* Toolbar: Template Switcher + Edit + Print PDF */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#101017] border border-amber-500/25">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                        <LayoutTemplate className="w-4 h-4 text-amber-400" />
                        <span>{isAr ? "التصميم التنفيذي:" : "Executive Template:"}</span>
                      </span>
                      <button
                        onClick={() => setCvTemplate("harvard")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                          cvTemplate === "harvard"
                            ? "bg-gradient-to-r from-amber-300 to-yellow-500 text-neutral-950"
                            : "bg-[#08080c] text-stone-400 hover:text-amber-200 border border-stone-800"
                        }`}
                      >
                        {isAr ? "1. هارفارد الكلاسيكي (Harvard)" : "1. Harvard Executive"}
                      </button>
                      <button
                        onClick={() => setCvTemplate("corporate")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                          cvTemplate === "corporate"
                            ? "bg-gradient-to-r from-amber-300 to-yellow-500 text-neutral-950"
                            : "bg-[#08080c] text-stone-400 hover:text-amber-200 border border-stone-800"
                        }`}
                      >
                        {isAr ? "2. الشركات العالمية (Corporate)" : "2. Modern Corporate"}
                      </button>
                      <button
                        onClick={() => setCvTemplate("tech")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                          cvTemplate === "tech"
                            ? "bg-gradient-to-r from-amber-300 to-yellow-500 text-neutral-950"
                            : "bg-[#08080c] text-stone-400 hover:text-amber-200 border border-stone-800"
                        }`}
                      >
                        {isAr ? "3. التقني المعاصر (FAANG Tech)" : "3. Silicon Valley Tech"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      {isUnlocked && (
                        <button
                          onClick={() => setIsEditingCv(!isEditingCv)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-semibold transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>
                            {isEditingCv
                              ? isAr
                                ? "حفظ التعديلات ومعاينة"
                                : "Done Editing"
                              : isAr
                              ? "تعديل أي نص في الـ CV"
                              : "Edit Resume Text"}
                          </span>
                        </button>
                      )}

                      <button
                        onClick={handlePrintPdf}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 hover:brightness-110 text-neutral-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/25 transition"
                      >
                        {isUnlocked ? (
                          <Download className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                        <span>
                          {isUnlocked
                            ? isAr
                              ? "تحميل الـ CV كـ PDF (حجم A4 قياسي)"
                              : "Download A4 ATS PDF"
                            : isAr
                            ? `افتح القفل لتحميل الـ PDF الجاهز (${siteSettings.singlePlanPriceEgp} ج.م)`
                            : "Unlock to Download PDF"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Full Inline Editor Drawer */}
                  {isUnlocked && isEditingCv && (
                    <div className="p-5 rounded-2xl bg-[#101017] border border-amber-500/40 space-y-4">
                      <h4 className="text-xs font-bold text-amber-300">
                        {isAr
                          ? "تعديل بيانات السيرة الذاتية مباشرة قبل الطباعة والتحميل:"
                          : "Edit Resume Fields Live:"}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          value={editableCv.fullName}
                          onChange={(e) =>
                            setEditableCv({ ...editableCv, fullName: e.target.value })
                          }
                          placeholder="Full Name"
                          className="px-3 py-2 rounded-lg bg-[#08080c] border border-stone-800 text-xs text-white"
                        />
                        <input
                          value={editableCv.targetTitle}
                          onChange={(e) =>
                            setEditableCv({ ...editableCv, targetTitle: e.target.value })
                          }
                          placeholder="Target Title"
                          className="px-3 py-2 rounded-lg bg-[#08080c] border border-stone-800 text-xs text-white"
                        />
                        <input
                          value={editableCv.tagline || ""}
                          onChange={(e) =>
                            setEditableCv({ ...editableCv, tagline: e.target.value })
                          }
                          placeholder="Executive Tagline"
                          className="px-3 py-2 rounded-lg bg-[#08080c] border border-stone-800 text-xs text-white"
                        />
                        <input
                          value={editableCv.email}
                          onChange={(e) =>
                            setEditableCv({ ...editableCv, email: e.target.value })
                          }
                          placeholder="Email"
                          className="px-3 py-2 rounded-lg bg-[#08080c] border border-stone-800 text-xs text-white"
                        />
                        <input
                          value={editableCv.phone}
                          onChange={(e) =>
                            setEditableCv({ ...editableCv, phone: e.target.value })
                          }
                          placeholder="Phone"
                          className="px-3 py-2 rounded-lg bg-[#08080c] border border-stone-800 text-xs text-white"
                        />
                        <input
                          value={editableCv.location}
                          onChange={(e) =>
                            setEditableCv({ ...editableCv, location: e.target.value })
                          }
                          placeholder="Location"
                          className="px-3 py-2 rounded-lg bg-[#08080c] border border-stone-800 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-stone-400">
                          الملخص التنفيذي (Executive Summary):
                        </label>
                        <textarea
                          value={editableCv.summary}
                          onChange={(e) =>
                            setEditableCv({ ...editableCv, summary: e.target.value })
                          }
                          rows={4}
                          dir="ltr"
                          className="w-full p-3 rounded-lg bg-[#08080c] border border-stone-800 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* FULL-PAGE A4 EXECUTIVE RESUME SHEET */}
                  <div className="relative">
                    <div
                      id="printable-cv-sheet"
                      dir="ltr"
                      className={`bg-white text-slate-900 rounded-2xl shadow-2xl max-w-[215mm] min-h-[297mm] mx-auto p-8 sm:p-12 space-y-5 overflow-hidden ${
                        cvTemplate === "harvard"
                          ? "font-serif"
                          : "font-sans"
                      }`}
                    >
                      {/* 1. EXECUTIVE HEADER */}
                      <div
                        className={`pb-4 ${
                          cvTemplate === "harvard"
                            ? "text-center border-b-2 border-slate-900"
                            : cvTemplate === "corporate"
                            ? "border-b-4 border-indigo-900 bg-slate-50 -mx-8 sm:-mx-12 -mt-8 sm:-mt-12 px-8 sm:px-12 pt-8 sm:pt-10 pb-6"
                            : "border-b-2 border-slate-800"
                        }`}
                      >
                        <h1
                          className={`text-2xl sm:text-3xl font-extrabold tracking-tight uppercase ${
                            cvTemplate === "corporate"
                              ? "text-indigo-950"
                              : "text-slate-900"
                          }`}
                        >
                          {editableCv.fullName}
                        </h1>
                        <p
                          className={`text-sm sm:text-base font-bold mt-1 ${
                            cvTemplate === "corporate"
                              ? "text-indigo-700"
                              : cvTemplate === "tech"
                              ? "text-emerald-700"
                              : "text-slate-800"
                          }`}
                        >
                          {editableCv.tagline || editableCv.targetTitle}
                        </p>
                        <div
                          className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-2 ${
                            cvTemplate === "harvard" ? "justify-center" : ""
                          }`}
                        >
                          <span>{editableCv.location}</span>
                          <span>•</span>
                          <span>{editableCv.phone}</span>
                          <span>•</span>
                          <span>{editableCv.email}</span>
                          {editableCv.linkedin && (
                            <>
                              <span>•</span>
                              <span>{editableCv.linkedin}</span>
                            </>
                          )}
                          {editableCv.portfolio && (
                            <>
                              <span>•</span>
                              <span>{editableCv.portfolio}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 2. EXECUTIVE SUMMARY */}
                      <div className="space-y-1.5">
                        <h2
                          className={`text-xs font-extrabold uppercase tracking-widest pb-1 border-b ${
                            cvTemplate === "corporate"
                              ? "text-indigo-900 border-indigo-200"
                              : "text-slate-900 border-slate-300"
                          }`}
                        >
                          Executive Summary & Leadership Profile
                        </h2>
                        <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed text-justify">
                          {editableCv.summary}
                        </p>
                      </div>

                      {/* LOCKED BLURRED REGION FOR FREE VISITORS */}
                      <div
                        className={
                          !isUnlocked
                            ? "blur-[6px] select-none pointer-events-none opacity-65 space-y-5"
                            : "space-y-5"
                        }
                      >
                        {/* 3. CATEGORIZED CORE COMPETENCIES & TECHNICAL MATRIX */}
                        <div className="space-y-2">
                          <h2
                            className={`text-xs font-extrabold uppercase tracking-widest pb-1 border-b ${
                              cvTemplate === "corporate"
                                ? "text-indigo-900 border-indigo-200"
                                : "text-slate-900 border-slate-300"
                            }`}
                          >
                            Core Competencies & Areas of Expertise
                          </h2>
                          {editableCv.skillCategories &&
                          editableCv.skillCategories.length > 0 ? (
                            <div className="space-y-1.5 text-xs sm:text-[13px]">
                              {editableCv.skillCategories.map((cat, idx) => (
                                <div key={idx} className="leading-relaxed">
                                  <span className="font-bold text-slate-900">
                                    • {cat.category}:{" "}
                                  </span>
                                  <span className="text-slate-800">
                                    {cat.items.join("  |  ")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-medium">
                              {editableCv.skills.join(" • ")}
                            </p>
                          )}
                        </div>

                        {/* 4. PROFESSIONAL EXPERIENCE (HARVARD XYZ STANDARD) */}
                        <div className="space-y-4">
                          <h2
                            className={`text-xs font-extrabold uppercase tracking-widest pb-1 border-b ${
                              cvTemplate === "corporate"
                                ? "text-indigo-900 border-indigo-200"
                                : "text-slate-900 border-slate-300"
                            }`}
                          >
                            Professional Experience
                          </h2>
                          {editableCv.experience.map((exp, idx) => (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <div>
                                  <span className="font-extrabold text-sm text-slate-900">
                                    {exp.role}
                                  </span>
                                  <span className="text-xs sm:text-sm font-bold text-indigo-800">
                                    {" "}
                                    — {exp.company}
                                  </span>
                                  {exp.location && (
                                    <span className="text-xs text-slate-600">
                                      {" "}
                                      ({exp.location})
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-bold text-slate-700">
                                  {exp.period}
                                </span>
                              </div>

                              {exp.scopeStatement && (
                                <p className="text-xs italic text-slate-700 leading-relaxed">
                                  {exp.scopeStatement}
                                </p>
                              )}

                              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-[13px] text-slate-800 leading-relaxed">
                                {exp.bullets.map((b, bIdx) => (
                                  <li key={bIdx}>{b}</li>
                                ))}
                              </ul>

                              {exp.keyAchievement && (
                                <div className="text-xs font-semibold text-slate-900 bg-slate-100 px-3 py-1.5 rounded border-l-2 border-indigo-700">
                                  ★ Key Impact: {exp.keyAchievement}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* 5. KEY PROJECTS & STRATEGIC INITIATIVES */}
                        {editableCv.projects && editableCv.projects.length > 0 && (
                          <div className="space-y-3">
                            <h2
                              className={`text-xs font-extrabold uppercase tracking-widest pb-1 border-b ${
                                cvTemplate === "corporate"
                                  ? "text-indigo-900 border-indigo-200"
                                  : "text-slate-900 border-slate-300"
                              }`}
                            >
                              Selected Key Projects & Strategic Initiatives
                            </h2>
                            {editableCv.projects.map((proj, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                  <div>
                                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                                      {proj.name}
                                    </span>
                                    <span className="text-xs text-indigo-700 font-semibold">
                                      {" "}
                                      | {proj.roleOrTech}
                                    </span>
                                  </div>
                                  <span className="text-xs font-semibold text-slate-600">
                                    {proj.period}
                                  </span>
                                </div>
                                <ul className="list-disc pl-5 space-y-0.5 text-xs sm:text-[13px] text-slate-800 leading-relaxed">
                                  {proj.bullets.map((b, bIdx) => (
                                    <li key={bIdx}>{b}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 6. EDUCATION & CREDENTIALS */}
                        <div className="space-y-2">
                          <h2
                            className={`text-xs font-extrabold uppercase tracking-widest pb-1 border-b ${
                              cvTemplate === "corporate"
                                ? "text-indigo-900 border-indigo-200"
                                : "text-slate-900 border-slate-300"
                            }`}
                          >
                            Education & Academic Credentials
                          </h2>
                          {editableCv.education.map((edu, idx) => (
                            <div key={idx} className="space-y-0.5">
                              <div className="flex flex-wrap items-baseline justify-between text-xs sm:text-[13px]">
                                <div>
                                  <span className="font-bold text-slate-900">
                                    {edu.degree}
                                  </span>
                                  <span className="text-slate-700">
                                    {" "}
                                    — {edu.institution}
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-slate-700">
                                  {edu.year}
                                </span>
                              </div>
                              {edu.details && (
                                <p className="text-xs text-slate-600">{edu.details}</p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* 7. CERTIFICATIONS & LANGUAGES */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          {editableCv.certifications &&
                            editableCv.certifications.length > 0 && (
                              <div className="space-y-1.5">
                                <h2
                                  className={`text-xs font-extrabold uppercase tracking-widest pb-1 border-b ${
                                    cvTemplate === "corporate"
                                      ? "text-indigo-900 border-indigo-200"
                                      : "text-slate-900 border-slate-300"
                                  }`}
                                >
                                  Certifications & Licenses
                                </h2>
                                <ul className="list-disc pl-4 space-y-0.5 text-xs text-slate-800">
                                  {editableCv.certifications.map((c, idx) => (
                                    <li key={idx}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          {editableCv.languages && editableCv.languages.length > 0 && (
                            <div className="space-y-1.5">
                              <h2
                                className={`text-xs font-extrabold uppercase tracking-widest pb-1 border-b ${
                                  cvTemplate === "corporate"
                                    ? "text-indigo-900 border-indigo-200"
                                    : "text-slate-900 border-slate-300"
                                }`}
                              >
                                Languages
                              </h2>
                              <ul className="list-disc pl-4 space-y-0.5 text-xs text-slate-800">
                                {editableCv.languages.map((lang, idx) => (
                                  <li key={idx}>{lang}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Floating Luxury Paywall Overlay when Locked */}
                    {!isUnlocked && (
                      <div className="absolute inset-x-0 bottom-0 top-48 bg-gradient-to-t from-[#07070a] via-[#07070a]/90 to-transparent flex items-center justify-center p-4">
                        <div className="bg-[#101017]/95 backdrop-blur-xl border-2 border-amber-400/70 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.95)]">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-300">
                            <Crown className="w-6 h-6" />
                          </div>
                          <h3 className="text-xl sm:text-2xl font-black text-amber-100">
                            {isAr
                              ? `سيرتك الذاتية التنفيذية جاهزة (${result.optimizedScore}% Harvard ATS)`
                              : `Your ${result.optimizedScore}% Harvard ATS Resume is Ready`}
                          </h3>
                          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                            {isAr
                              ? `ادفع ${siteSettings.singlePlanPriceEgp} ج.م فقط عبر فودافون كاش لتحميل الـ CV التنفيذي الكامل (PDF بحجم A4) مع 3 قوالب عالمية + خطاب التقديم + أسئلة الإنترفيو.`
                              : "Unlock now via Vodafone Cash to download your full A4 Harvard ATS PDF."}
                          </p>
                          <button
                            onClick={() => setShowPricingModal(true)}
                            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 hover:brightness-110 text-neutral-950 font-black text-sm shadow-xl shadow-amber-500/25 transition"
                          >
                            {isAr
                              ? `افتح القفل الآن بـ فودافون كاش (${siteSettings.singlePlanPriceEgp} ج.م)`
                              : `Unlock via Vodafone Cash (${siteSettings.singlePlanPriceEgp} EGP)`}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3 & TAB 4 */}
              {(activeTab === "cover-letter" || activeTab === "interview-prep") &&
                !isUnlocked && (
                  <div className="rounded-3xl bg-[#101017] border-2 border-amber-400/50 p-8 text-center max-w-xl mx-auto space-y-4 shadow-2xl">
                    <Crown className="w-10 h-10 text-amber-400 mx-auto" />
                    <h3 className="text-xl font-black text-amber-100">
                      {isAr
                        ? "خطاب التقديم وأسئلة الإنترفيو جاهزة للمشتركين"
                        : "Cover Letter & Interview Prep Locked"}
                    </h3>
                    <button
                      onClick={() => setShowPricingModal(true)}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-neutral-950 font-black text-sm shadow-lg"
                    >
                      {isAr
                        ? `تفعيل الاشتراك بـ فودافون كاش (${siteSettings.singlePlanPriceEgp} ج.م)`
                        : `Unlock Now (${siteSettings.singlePlanPriceEgp} EGP)`}
                    </button>
                  </div>
                )}

              {activeTab === "cover-letter" && isUnlocked && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-3xl bg-[#101017]/90 border border-amber-500/20 p-6 space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-amber-200">
                        {isAr
                          ? "خطاب التقديم المخصص (Cover Letter)"
                          : "Tailored Cover Letter"}
                      </h3>
                      <button
                        onClick={() => handleCopy(result.coverLetter, "cover")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-200 border border-amber-400/30 text-xs font-semibold"
                      >
                        {copiedId === "cover" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId === "cover" ? "تم النسخ" : "نسخ"}</span>
                      </button>
                    </div>
                    <pre
                      dir="auto"
                      className="flex-1 whitespace-pre-wrap rounded-2xl bg-[#08080c] border border-stone-800 p-4 text-xs sm:text-sm text-stone-200 font-sans leading-relaxed"
                    >
                      {result.coverLetter}
                    </pre>
                  </div>

                  <div className="rounded-3xl bg-[#101017]/90 border border-amber-500/20 p-6 space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-amber-200">
                        {isAr
                          ? "رسالة سريعة لمسؤول التوظيف (LinkedIn / Email)"
                          : "Direct Recruiter Outreach"}
                      </h3>
                      <button
                        onClick={() => handleCopy(result.linkedinMessage, "linkedin")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-200 border border-amber-400/30 text-xs font-semibold"
                      >
                        {copiedId === "linkedin" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId === "linkedin" ? "تم النسخ" : "نسخ"}</span>
                      </button>
                    </div>
                    <pre
                      dir="auto"
                      className="flex-1 whitespace-pre-wrap rounded-2xl bg-[#08080c] border border-stone-800 p-4 text-xs sm:text-sm text-stone-200 font-sans leading-relaxed"
                    >
                      {result.linkedinMessage}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === "interview-prep" && isUnlocked && (
                <div className="space-y-4">
                  {result.interviewPrep.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-3xl bg-[#101017]/90 border border-amber-500/20 p-6 space-y-3"
                    >
                      <h4 className="font-bold text-sm sm:text-base text-amber-200">
                        Q{idx + 1}: {item.question}
                      </h4>
                      <p className="text-xs text-amber-400/90">{item.whyAsked}</p>
                      <div className="p-4 rounded-2xl bg-[#08080c] border border-stone-800 text-xs sm:text-sm text-stone-300 leading-relaxed">
                        {item.sampleAnswer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* CUSTOMER SUPPORT SECTION AT THE BOTTOM */}
          <section
            ref={supportSectionRef}
            className="pt-8 border-t border-amber-500/15 max-w-4xl mx-auto"
          >
            <div className="rounded-3xl bg-[#101017]/90 border border-amber-500/25 p-6 sm:p-8 space-y-5 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.85)]">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-amber-100">
                      {isAr
                        ? "خدمة العملاء والدعم الفني المباشر"
                        : "Customer Support & Live Help"}
                    </h2>
                    <p className="text-xs text-stone-400">
                      {isAr
                        ? "هل لديك أي استفسار أو مشكلة في الدفع؟ اكتب رسالتك هنا وستصل للإدارة فوراً ويظهر لك الرد في نفس المحادثة."
                        : "Send us a message below and our team will reply right here."}
                    </p>
                  </div>
                </div>
              </div>

              {supportMessages.length > 0 && (
                <div className="rounded-2xl bg-[#08080c] border border-stone-800 p-4 max-h-72 overflow-y-auto space-y-3">
                  {supportMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-amber-500/15 border border-amber-400/30 text-stone-100 ml-auto"
                          : "bg-emerald-600/20 border border-emerald-500/40 text-emerald-100 mr-auto"
                      }`}
                    >
                      <span className="block text-[10px] font-bold opacity-75 mb-1">
                        {msg.sender === "admin" ? "👑 رد إدارة مسارك (خدمة العملاء):" : "أنت:"}
                      </span>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendSupportMessage} className="space-y-3">
                {!currentUser && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder={isAr ? "اسمك" : "Your Name"}
                      className="px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-xs sm:text-sm text-white"
                    />
                    <input
                      type="text"
                      value={guestContact}
                      onChange={(e) => setGuestContact(e.target.value)}
                      placeholder={
                        isAr
                          ? "رقم موبايلك أو إيميلك للتواصل"
                          : "Your Phone or Email"
                      }
                      className="px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-xs sm:text-sm text-white"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={supportText}
                    onChange={(e) => setSupportText(e.target.value)}
                    placeholder={
                      isAr
                        ? "اكتب رسالتك لخدمة العملاء هنا..."
                        : "Type your message to customer support..."
                    }
                    className="flex-1 px-4 py-3 rounded-xl bg-[#08080c] border border-stone-800 focus:border-amber-400 focus:outline-none text-xs sm:text-sm text-white"
                  />
                  <button
                    type="submit"
                    disabled={isSendingSupport}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 hover:brightness-110 text-neutral-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isAr ? "إرسال لخدمة العملاء" : "Send Message"}</span>
                  </button>
                </div>
                {supportStatusMsg && (
                  <p className="text-xs text-emerald-400 font-semibold">
                    {supportStatusMsg}
                  </p>
                )}
              </form>
            </div>
          </section>
        </main>
      )}

      {/* LOGIN / REGISTER MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            dir={isAr ? "rtl" : "ltr"}
            className="bg-[#101017] border border-amber-500/35 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-lg font-extrabold text-amber-200">
                {authMode === "login"
                  ? isAr
                    ? "تسجيل الدخول لمنصة مسارك"
                    : "Sign In to Masarak"
                  : isAr
                  ? "إنشاء حساب تنفيذي جديد"
                  : "Create Account"}
              </h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-stone-400 hover:text-white text-sm px-2.5 py-1 rounded-lg bg-stone-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#08080c] border border-stone-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
                className={`py-2 rounded-lg text-xs font-extrabold transition ${
                  authMode === "login"
                    ? "bg-gradient-to-r from-amber-300 to-yellow-500 text-neutral-950"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                {isAr ? "تسجيل دخول" : "Login"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                }}
                className={`py-2 rounded-lg text-xs font-extrabold transition ${
                  authMode === "register"
                    ? "bg-gradient-to-r from-amber-300 to-yellow-500 text-neutral-950"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                {isAr ? "حساب جديد" : "Register"}
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "register" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-300">
                    {isAr ? "الاسم بالكامل" : "Full Name"}
                  </label>
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder={isAr ? "مثال: أحمد محمد" : "Your Name"}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-sm text-white"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">
                  {isAr
                    ? "البريد الإلكتروني أو رقم الموبايل"
                    : "Email Address or Mobile Number"}
                </label>
                <input
                  type="text"
                  value={authIdentifier}
                  onChange={(e) => setAuthIdentifier(e.target.value)}
                  placeholder="010xxxxxxxx / email@gmail.com"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-sm text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">
                  {isAr ? "كلمة المرور" : "Password"}
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-sm text-white"
                />
              </div>

              {authError && <p className="text-xs text-rose-400">{authError}</p>}

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 hover:brightness-110 text-neutral-950 font-black text-sm transition"
              >
                {isSubmittingAuth
                  ? isAr
                    ? "جاري التنفيذ..."
                    : "Loading..."
                  : authMode === "login"
                  ? isAr
                    ? "دخول"
                    : "Sign In"
                  : isAr
                  ? "إنشاء الحساب"
                  : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VODAFONE CASH ONLY PAYMENT MODAL */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div
            dir={isAr ? "rtl" : "ltr"}
            className="bg-[#101017] border border-amber-500/35 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8"
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 to-yellow-500 flex items-center justify-center text-neutral-950">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-amber-100">
                    {isAr
                      ? "الدفع وتفعيل العضوية عبر فودافون كاش"
                      : "Vodafone Cash Checkout"}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {isAr
                      ? "حوّل المبلغ على رقم فودافون كاش وأرفق صورة التحويل لتفعيل حسابك"
                      : "Transfer via Vodafone Cash and upload your receipt"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPricingModal(false)}
                className="text-stone-400 hover:text-white text-sm px-3 py-1 rounded-lg bg-stone-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div
                onClick={() => setSelectedPlan("single")}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition space-y-1.5 ${
                  selectedPlan === "single"
                    ? "bg-amber-500/15 border-amber-400"
                    : "bg-[#08080c] border-stone-800 opacity-75"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-200">
                    {siteSettings.singlePlanNameAr}
                  </span>
                  <span className="text-xl font-extrabold text-white">
                    {siteSettings.singlePlanPriceEgp} ج.م
                  </span>
                </div>
                <p className="text-xs text-stone-300">{siteSettings.singlePlanDescAr}</p>
              </div>

              <div
                onClick={() => setSelectedPlan("pro")}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition space-y-1.5 relative ${
                  selectedPlan === "pro"
                    ? "bg-amber-500/15 border-amber-400"
                    : "bg-[#08080c] border-stone-800 opacity-75"
                }`}
              >
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 text-neutral-950 text-[10px] font-extrabold">
                  {isAr ? "الأوفر (VIP)" : "Best Value"}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">
                    {siteSettings.proPlanNameAr}
                  </span>
                  <span className="text-xl font-extrabold text-white">
                    {siteSettings.proPlanPriceEgp} ج.م
                  </span>
                </div>
                <p className="text-xs text-stone-300">{siteSettings.proPlanDescAr}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 to-[#08080c] border border-amber-400/40 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs text-amber-200 font-bold block">
                  {isAr
                    ? `حوّل ${
                        selectedPlan === "single"
                          ? siteSettings.singlePlanPriceEgp
                          : siteSettings.proPlanPriceEgp
                      } ج.م فودافون كاش على الرقم التالي:`
                    : "Vodafone Cash Number:"}
                </span>
                <span className="text-2xl font-extrabold text-white font-mono tracking-wider">
                  {siteSettings.vodafoneCashNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(siteSettings.vodafoneCashNumber, "vf-num")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 text-neutral-950 text-xs font-black transition"
              >
                {copiedId === "vf-num" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copiedId === "vf-num" ? "تم النسخ!" : "نسخ الرقم"}</span>
              </button>
            </div>

            {!currentUser ? (
              <div className="p-5 rounded-2xl bg-[#08080c] border border-amber-500/40 text-center space-y-3">
                <p className="text-xs sm:text-sm text-stone-200 font-semibold">
                  {isAr
                    ? "يرجى تسجيل الدخول أو إنشاء حساب (بالإيميل أو رقم الموبايل) أولاً لربط التفعيل بحسابك:"
                    : "Please sign in or register first so we can activate your account:"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowPricingModal(false);
                    setShowAuthModal(true);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 text-neutral-950 font-black text-xs sm:text-sm transition"
                >
                  {isAr ? "تسجيل دخول / إنشاء حساب في ثانية" : "Login / Sign Up"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitVodafonePayment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-300 block">
                      {isAr ? "الرقم اللي بتحول منه:" : "Sender Mobile Number:"}
                    </label>
                    <input
                      type="tel"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="010xxxxxxxx"
                      dir="ltr"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-sm text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-300 block">
                      {isAr ? "المحفظة اللي محول منها باسم مين:" : "Wallet Owner Name:"}
                    </label>
                    <input
                      type="text"
                      value={walletOwnerName}
                      onChange={(e) => setWalletOwnerName(e.target.value)}
                      placeholder={isAr ? "الاسم الثلاثي لصاحب الخط" : "Wallet Holder Name"}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#08080c] border border-stone-800 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-300 block">
                    {isAr ? "إرفاق صورة التحويل (سكرين شوت):" : "Upload Transfer Screenshot:"}
                  </label>
                  <input
                    ref={receiptInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => receiptInputRef.current?.click()}
                    className="border-2 border-dashed border-amber-500/35 hover:border-amber-400 rounded-2xl p-4 text-center cursor-pointer bg-[#08080c] transition space-y-2"
                  >
                    {screenshotDataUrl ? (
                      <div className="space-y-2">
                        <img
                          src={screenshotDataUrl}
                          alt="Receipt preview"
                          className="max-h-36 mx-auto rounded-lg border border-stone-800"
                        />
                        <span className="text-xs text-emerald-400 font-bold block">
                          ✓ تم إرفاق الصورة: {screenshotFileName} (اضغط لتغييرها)
                        </span>
                      </div>
                    ) : (
                      <div className="py-3 space-y-1.5">
                        <ImageIcon className="w-7 h-7 text-amber-400 mx-auto" />
                        <p className="text-xs font-bold text-stone-200">
                          {isAr
                            ? "اضغط هنا لاختيار صورة رسالة أو إيصال التحويل"
                            : "Click to upload screenshot of Vodafone Cash transfer"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {paymentError && <p className="text-xs text-rose-400">{paymentError}</p>}
                {paymentSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold leading-relaxed">
                    {paymentSuccessMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 hover:brightness-110 text-neutral-950 font-black text-sm shadow-xl shadow-amber-500/20 transition"
                >
                  {isSubmittingPayment
                    ? isAr
                      ? "جاري إرسال بيانات التحويل..."
                      : "Submitting..."
                    : isAr
                    ? "تأكيد وإرسال صورة التحويل لتفعيل الحساب"
                    : "Submit Transfer & Activate Account"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-amber-500/15 py-6 text-center text-xs text-stone-500">
        ✦ {siteSettings.siteNameAr} ({siteSettings.siteNameEn}) — المنصة التنفيذية لصياغة السيرة الذاتية | جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
