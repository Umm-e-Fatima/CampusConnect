import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const PAGE_SIZE = 8;
const SPINE_COLORS = ['var(--teal)', 'var(--olive)', 'var(--rose)', 'var(--orange)'];

const Books = () => {
  const [books, setBooks]             = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [filterCode, setFilterCode]   = useState('');
  const [filterType, setFilterType]   = useState('');
  const [activeTab, setActiveTab]     = useState('browse');
  const [viewMode, setViewMode]       = useState('shelf'); // 'shelf' | 'list'
  const [page, setPage]               = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pin, setPin]                 = useState(null);
  const [pinExpiry, setPinExpiry]     = useState(null);
  const [pinInfo, setPinInfo]         = useState(null);
  const [confirmData, setConfirmData] = useState({ request_id: '', pin: '' });
  const [confirmMsg, setConfirmMsg]   = useState('');
  const [confirmResult, setConfirmResult] = useState(null);
  const [requestingBook, setRequestingBook] = useState(null);
  const [borrowDays, setBorrowDays]   = useState('');
  const [isOnline, setIsOnline]       = useState(navigator.onLine);

  const [createForm, setCreateForm] = useState({
    title: '', author: '', course_code: '', condition: 'good',
    listing_type: 'gift', price: '', borrow_days_limit: '',
    women_only: false, dropoff_location: '', contact_info: '',
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    api.get('/books/distinct-courses')
      .then(res => setSuggestions(res.data))
      .catch(() => {});
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterType) params.type = filterType;
      if (filterCode.trim()) params.course_code = filterCode.trim().toUpperCase();
      const res = await api.get('/books', { params });
      setBooks(res.data);
      setPage(1);
    } catch (err) {
      setError('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(); }, [filterType, filterCode]); // eslint-disable-line

  const handleRequest = async (book) => {
    setError('');
    if (book.listing_type === 'borrow') {
      setRequestingBook(book);
      setBorrowDays('');
      return;
    }
    try {
      const res = await api.post(`/books/${book.id}/request`, {});
      setPin(res.data.pin);
      setPinExpiry(res.data.expires_at);
      setPinInfo({
        total_price: res.data.total_price,
        dropoff_location: res.data.dropoff_location,
      });
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request book');
    }
  };

  const handleBorrowRequest = async () => {
    if (!borrowDays || borrowDays < 1 || borrowDays > 15) {
      setError('Enter borrow duration between 1 and 15 days');
      return;
    }
    try {
      const res = await api.post(`/books/${requestingBook.id}/request`, {
        borrow_days: parseInt(borrowDays),
      });
      setPin(res.data.pin);
      setPinExpiry(res.data.expires_at);
      setPinInfo({
        due_date: res.data.due_date,
        total_price: res.data.total_price,
        dropoff_location: res.data.dropoff_location,
      });
      setRequestingBook(null);
      setBorrowDays('');
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request book');
      setRequestingBook(null);
    }
  };

  const handleConfirmPin = async () => {
    try {
      const res = await api.post('/books/confirm-pin', confirmData);
      setConfirmMsg('Exchange completed successfully.');
      setConfirmResult(res.data);
      setConfirmData({ request_id: '', pin: '' });
    } catch (err) {
      setConfirmMsg(err.response?.data?.error || 'PIN confirmation failed');
      setConfirmResult(null);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/books', {
        ...createForm,
        course_code: createForm.course_code.trim().toUpperCase() || null,
        price: createForm.listing_type !== 'gift' ? parseFloat(createForm.price) : null,
        borrow_days_limit: createForm.listing_type === 'borrow'
          ? parseInt(createForm.borrow_days_limit) : null,
      });
      setShowCreateForm(false);
      setCreateForm({
        title: '', author: '', course_code: '', condition: 'good',
        listing_type: 'gift', price: '', borrow_days_limit: '',
        women_only: false, dropoff_location: '', contact_info: '',
      });
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing');
    }
  };

  const listingTag = (b) => {
    if (b.listing_type === 'gift') return 'Gift:Free';
    if (b.listing_type === 'borrow') return `Borrow · Rs.${b.price}/day`;
    return `Paid · Rs.${b.price}`;
  };
  const listingTagClass = (b) => {
    if (b.listing_type === 'gift') return 'teal';
    if (b.listing_type === 'borrow') return 'orange';
    return 'rose';
  };

  // Chunk books into shelf rows of 4
  const shelfRows = [];
  for (let i = 0; i < books.length; i += 4) shelfRows.push(books.slice(i, i + 4));

  const totalPages = Math.max(1, Math.ceil(books.length / PAGE_SIZE));
  const pagedBooks = books.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pagedShelfRows = [];
  for (let i = 0; i < pagedBooks.length; i += 4) pagedShelfRows.push(pagedBooks.slice(i, i + 4));

  const previewTag = createForm.listing_type === 'gift'
    ? 'Gift — Free'
    : createForm.listing_type === 'borrow'
      ? `Borrow · Rs.${createForm.price || '0'}/day`
      : `Paid · Rs.${createForm.price || '0'}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Nunito:wght@400;600;700&display=swap');
        :root {
          --cream: #FBF3E5; --card: #FFFDF8; --line: #E9DCC3;
          --teal: #1D6F68; --teal-d: #134F4A; --orange: #E2903C; --orange-d: #C97324;
          --ink: #3A3630; --inks: #8A8172; --rose: #B85C74; --rose-d: #96475D;
          --olive: #6E8353; --olive-d: #556842;
        }
        * { box-sizing: border-box; }
        .bk-page { margin: 0; background: var(--cream); color: var(--ink); font-family: 'Nunito', sans-serif; min-height: 100vh; }
        .bk-wrap { max-width: 1080px; margin: 0 auto; padding: 0 32px 64px; }
        .bk-nav { display: flex; align-items: center; justify-content: space-between; padding: 22px 0; margin-bottom: 26px; }
        .bk-brand { display: flex; align-items: center; gap: 10px; }
        .bk-brand-mark { width: 36px; height: 36px; border-radius: 11px; background: var(--teal); color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14px; }
        .bk-brand-name { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 17px; color: var(--teal-d); }
        .bk-nav-right { display: flex; align-items: center; gap: 16px; }
        .bk-status { display: flex; align-items: center; gap: 6px; font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 600; color: var(--teal-d); background: #E7F0EA; padding: 6px 12px; border-radius: 20px; }
        .bk-status.offline { color: var(--rose-d); background: #F5E6EA; }
        .bk-status-dot { width: 6px; height: 6px; background: var(--teal); border-radius: 50%; }
        .bk-status.offline .bk-status-dot { background: var(--rose); }
        .bk-user-name { font-size: 13px; color: var(--inks); }
        .bk-logout-btn { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 600; background: none; border: 1px solid var(--line); color: var(--ink); padding: 8px 16px; border-radius: 999px; cursor: pointer; transition: background 0.15s; }
        .bk-logout-btn:hover { background: var(--card); }

        .bk-page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; }
        .bk-page-head-left { display: flex; align-items: center; gap: 14px; }
        .bk-back-btn { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 600; color: var(--inks); background: none; border: 1px solid var(--line); padding: 8px 14px; border-radius: 999px; cursor: pointer; transition: background 0.15s; }
        .bk-back-btn:hover { background: var(--card); }
        .bk-h1 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 22px; color: var(--teal-d); margin: 0; }
        .bk-btn-primary { background: var(--orange); color: #fff; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13px; padding: 11px 20px; border-radius: 999px; border: none; cursor: pointer; box-shadow: 0 6px 14px rgba(226,144,60,.3); transition: background 0.15s; }
        .bk-btn-primary:hover { background: var(--orange-d); }

        .bk-tabs { display: flex; gap: 8px; margin-bottom: 18px; }
        .bk-tab { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 600; padding: 9px 18px; border-radius: 999px; border: 1px solid var(--line); color: var(--inks); cursor: pointer; background: var(--card); }
        .bk-tab.active { background: var(--teal); color: #fff; border-color: var(--teal); }

        .bk-filter-row { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .bk-filter-row input, .bk-filter-row select { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 11px 16px; color: var(--ink); font-size: 13px; font-family: 'Nunito', sans-serif; }
        .bk-filter-row input:focus, .bk-filter-row select:focus { outline: none; border-color: var(--teal); }
        .bk-filter-row input { flex-grow: 1; min-width: 200px; }
        .bk-clear-btn { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 600; color: var(--inks); background: none; border: 1px solid var(--line); padding: 11px 16px; border-radius: 14px; cursor: pointer; }

        .bk-controls-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; }
        .bk-footer-note { font-size: 12px; color: var(--inks); }
        .bk-footer-note b { color: var(--ink); }
        .bk-view-toggle { display: flex; gap: 6px; background: var(--card); border: 1px solid var(--line); border-radius: 999px; padding: 3px; }
        .bk-view-toggle button { font-family: 'Poppins', sans-serif; font-size: 11.5px; font-weight: 600; border: none; background: none; color: var(--inks); padding: 7px 14px; border-radius: 999px; cursor: pointer; }
        .bk-view-toggle button.active { background: var(--teal); color: #fff; }

        .bk-error { background: #F5E6EA; color: var(--rose-d); border: 1px solid rgba(150,71,93,0.2); border-radius: 10px; padding: 10px 14px; font-size: 12.5px; margin-bottom: 16px; }

        .bk-pin-box { background: var(--teal); border-radius: 20px; padding: 22px 24px; text-align: center; margin-bottom: 20px; }
        .bk-pin-label { font-size: 12px; color: rgba(255,255,255,.75); margin-bottom: 8px; }
        .bk-pin-code { font-size: 44px; font-weight: 700; color: #fff; letter-spacing: 14px; margin-bottom: 6px; font-family: 'Poppins', sans-serif; }
        .bk-pin-meta { font-size: 12px; color: rgba(255,255,255,.7); }
        .bk-dropoff-badge { display: inline-flex; align-items: center; gap: 5px; margin-top: 10px; padding: 5px 12px; background: rgba(255,255,255,.15); border-radius: 20px; font-size: 12px; color: #fff; }

        .bk-empty { text-align: center; padding: 48px 24px; color: var(--inks); }
        .bk-empty h3 { font-family: 'Poppins', sans-serif; color: var(--teal-d); font-size: 15px; margin-bottom: 6px; }
        .bk-empty p { font-size: 13px; margin-bottom: 16px; }

        /* Shelf / cupboard view */
        .bk-cupboard { border-radius: 14px; padding: 0; background: linear-gradient(180deg,#8C6A3F,#7A5A34); box-shadow: 0 16px 34px rgba(60,30,10,.22); }
        .bk-cupboard-top { height: 16px; border-radius: 14px 14px 0 0; background: linear-gradient(180deg,#9C7A4A,#8C6A3F); box-shadow: inset 0 2px 3px rgba(255,255,255,.15); }
        .bk-cupboard-inner { margin: 0 10px; background: #C7986A; max-height: 560px; overflow-y: auto; }
        .bk-shelf-row { padding: 22px 18px 0; position: relative; background: radial-gradient(ellipse 300px 120px at 15% 10%, rgba(255,255,255,.07), transparent 60%), repeating-linear-gradient(90deg, rgba(70,45,20,.045) 0px, rgba(70,45,20,.045) 1px, transparent 1px, transparent 30px), linear-gradient(180deg, #C7986A 0%, #B8875A 100%); }
        .bk-shelf-books { display: flex; gap: 16px; align-items: flex-end; justify-content: flex-start; padding-bottom: 14px; border-bottom: 9px solid #6E5230; box-shadow: 0 5px 0 rgba(0,0,0,.15); flex-wrap: wrap; }
        .bk-cupboard-bottom { height: 14px; margin: 0 10px; border-radius: 0 0 4px 4px; background: linear-gradient(180deg,#6E5230,#5C4326); }
        .bk-cupboard-legs { display: flex; justify-content: space-between; padding: 0 26px; }
        .bk-leg { width: 14px; height: 16px; background: #5C4326; border-radius: 0 0 4px 4px; }

        .bk-book { width: 150px; min-height: 190px; border-radius: 5px 12px 12px 5px; position: relative; padding: 16px 14px; color: #fff; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 10px 16px rgba(50,25,8,.25), 0 2px 0 rgba(255,255,255,.15) inset; border: none; text-align: left; font-family: inherit; }
        .bk-book::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 12px; background: rgba(0,0,0,.18); border-radius: 5px 0 0 5px; }
        .bk-book::after { content: ""; position: absolute; right: -3px; top: 5px; bottom: 5px; width: 6px; background: repeating-linear-gradient(180deg,#FBF3E5 0 2px,#EFE3CC 2px 4px); border-radius: 0 3px 3px 0; }
        .bk-book .bk-top-tag { font-family: 'Poppins', sans-serif; font-size: 9px; font-weight: 700; background: rgba(255,255,255,.22); padding: 3px 7px; border-radius: 999px; width: fit-content; letter-spacing: .02em; }
        .bk-book h4 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14.5px; margin: 10px 0 3px; line-height: 1.25; }
        .bk-book .bk-author { font-size: 10.5px; opacity: .85; margin-bottom: 4px; }
        .bk-book .bk-course { font-family: 'Poppins', sans-serif; font-size: 8.5px; opacity: .8; letter-spacing: .03em; margin-bottom: 8px; }
        .bk-book .bk-req-btn { font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 700; background: #fff; color: var(--ink); border: none; padding: 7px 0; border-radius: 999px; cursor: pointer; text-align: center; width: 100%; }
        .bk-book .bk-women { position: absolute; top: -8px; right: 6px; background: #F6E2E9; color: var(--rose-d); font-family: 'Poppins', sans-serif; font-size: 8px; font-weight: 700; padding: 3px 7px; border-radius: 999px; box-shadow: 0 3px 6px rgba(0,0,0,.15); }

        .bk-b0 { background: linear-gradient(160deg,var(--teal),var(--teal-d)); }
        .bk-b1 { background: linear-gradient(160deg,var(--olive),var(--olive-d)); }
        .bk-b2 { background: linear-gradient(160deg,var(--rose),var(--rose-d)); }
        .bk-b3 { background: linear-gradient(160deg,var(--orange),var(--orange-d)); }

        .bk-cupboard-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; padding: 0 4px; flex-wrap: wrap; gap: 10px; }
        .bk-pager { display: flex; align-items: center; gap: 10px; }
        .bk-pager button { font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 600; background: var(--card); border: 1px solid var(--line); color: var(--ink); padding: 8px 16px; border-radius: 999px; cursor: pointer; }
        .bk-pager button:disabled { opacity: .4; cursor: default; }
        .bk-pager .bk-page-label { font-family: 'Poppins', sans-serif; font-size: 12px; color: var(--inks); }

        /* List view */
        .bk-list-item { background: var(--card); border: 1px solid var(--line); border-radius: 18px 6px 18px 6px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; gap: 14px; flex-wrap: wrap; }
        .bk-li-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .bk-spine-chip { width: 8px; height: 44px; border-radius: 3px; flex-shrink: 0; }
        .bk-li-text h4 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14.5px; margin: 0 0 4px; }
        .bk-li-text .bk-meta { font-size: 12px; color: var(--inks); }
        .bk-li-tags { display: flex; gap: 6px; margin-top: 5px; flex-wrap: wrap; }
        .bk-li-tag { font-family: 'Poppins', sans-serif; font-size: 10px; font-weight: 600; padding: 3px 9px; border-radius: 999px; }
        .bk-li-tag.orange { background: #FBEAD5; color: var(--orange-d); }
        .bk-li-tag.teal { background: #E1EEE9; color: var(--teal-d); }
        .bk-li-tag.rose { background: #F6E2E9; color: var(--rose-d); }
        .bk-btn-outline { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 700; background: var(--orange); color: #fff; padding: 10px 20px; border-radius: 999px; border: none; cursor: pointer; box-shadow: 0 5px 12px rgba(226,144,60,.28); flex-shrink: 0; }
        .bk-btn-outline:hover { background: var(--orange-d); }

        /* Confirm PIN tab */
        .bk-card { background: var(--card); border: 1px solid var(--line); border-radius: 32px 12px 32px 12px; padding: 30px; margin-bottom: 28px; max-width: 520px; }
        .bk-card h2 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 17px; color: var(--teal-d); margin: 0 0 8px; }
        .bk-card .bk-sub { font-size: 13px; color: var(--inks); line-height: 1.6; margin: 0 0 22px; }
        .bk-field-label { display: block; font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 600; color: var(--ink); margin-bottom: 7px; }
        .bk-card input { width: 100%; background: var(--cream); border: 1px solid var(--line); border-radius: 14px; padding: 12px 16px; color: var(--ink); font-size: 13px; margin-bottom: 16px; font-family: 'Nunito', sans-serif; }
        .bk-pin-input-field { text-align: center; letter-spacing: 8px; font-size: 18px; font-weight: 700; color: var(--teal-d); border-style: dashed; }
        .bk-alert { border-radius: 10px; padding: 10px 14px; font-size: 12.5px; margin-bottom: 14px; }
        .bk-alert.success { background: #E1EEE9; color: var(--teal-d); }
        .bk-alert.error { background: #F5E6EA; color: var(--rose-d); }
        .bk-contact-reveal { background: #E1EEE9; border-radius: 14px; padding: 14px 16px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px; }
        .bk-contact-reveal-title { font-size: 13px; font-weight: 700; color: var(--teal-d); font-family: 'Poppins', sans-serif; }
        .bk-contact-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink); }

        /* Modals */
        .bk-overlay { position: fixed; inset: 0; background: rgba(58,54,48,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; font-family: 'Nunito', sans-serif; }
        .bk-modal { width: 460px; max-width: 100%; max-height: 92vh; overflow-y: auto; background: var(--card); border: 1px solid var(--line); border-radius: 32px 12px 32px 12px; padding: 30px; box-shadow: 0 24px 50px rgba(40,25,10,.3); }
        .bk-modal-head { display: flex; justify-content: space-between; align-items: center; }
        .bk-modal-head h2 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 19px; color: var(--teal-d); margin: 0; }
        .bk-close-btn { background: none; border: none; color: var(--inks); font-size: 13px; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600; }
        .bk-modal label { display: block; font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 600; color: var(--ink); margin: 16px 0 7px; }
        .bk-modal input, .bk-modal select { width: 100%; background: var(--cream); border: 1px solid var(--line); border-radius: 14px; padding: 11px 16px; color: var(--ink); font-size: 13px; font-family: 'Nunito', sans-serif; }
        .bk-modal input:focus, .bk-modal select:focus { outline: none; border-color: var(--teal); }
        .bk-modal .bk-hint { font-size: 11px; color: var(--inks); margin-top: 6px; }
        .bk-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .bk-toggle-row { display: flex; align-items: center; gap: 10px; margin-top: 18px; font-size: 13px; color: var(--inks); cursor: pointer; }
        .bk-toggle { width: 38px; height: 22px; background: var(--line); border-radius: 20px; position: relative; flex-shrink: 0; border: none; cursor: pointer; transition: background 0.15s; }
        .bk-toggle.on { background: var(--teal); }
        .bk-toggle::after { content: ""; position: absolute; left: 2px; top: 2px; width: 18px; height: 18px; background: #fff; border-radius: 50%; transition: left 0.15s; }
        .bk-toggle.on::after { left: 18px; }
        .bk-modal .bk-btn-primary { width: 100%; margin-top: 22px; padding: 14px; }
        .bk-preview-label { font-family: 'Poppins', sans-serif; font-size: 10.5px; font-weight: 600; color: var(--inks); letter-spacing: .04em; text-transform: uppercase; margin: 18px 0 8px; display: flex; align-items: center; gap: 8px; }
        .bk-preview-label::after { content: ""; flex-grow: 1; height: 1px; background: var(--line); }
        .bk-book-preview { width: 130px; min-height: 168px; border-radius: 5px 12px 12px 5px; position: relative; padding: 14px 12px; color: #fff; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(160deg,var(--olive),var(--olive-d)); box-shadow: 0 10px 16px rgba(50,25,8,.25); margin: 0 auto; }
        .bk-book-preview::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 10px; background: rgba(0,0,0,.18); border-radius: 5px 0 0 5px; }
        .bk-book-preview .bk-tag { font-family: 'Poppins', sans-serif; font-size: 8px; font-weight: 700; background: rgba(255,255,255,.22); padding: 2px 6px; border-radius: 999px; width: fit-content; }
        .bk-book-preview h5 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 11.5px; margin: 8px 0 2px; line-height: 1.2; }
        .bk-book-preview .bk-a { font-size: 9px; opacity: .85; }
      `}</style>

      <div className="bk-page">
        <div className="bk-wrap">

          {/* Navbar */}
          <nav className="bk-nav">
            <div className="bk-brand">
              <div className="bk-brand-mark">CC</div>
              <div className="bk-brand-name">CampusConnect</div>
            </div>
            <div className="bk-nav-right">
              <div className={`bk-status${isOnline ? '' : ' offline'}`}>
                <span className="bk-status-dot"></span>
                {isOnline ? 'offline ready' : 'offline mode'}
              </div>
              <div className="bk-user-name">{user?.full_name}</div>
              <button className="bk-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </nav>

          {/* Page head */}
          <div className="bk-page-head">
            <div className="bk-page-head-left">
              <button className="bk-back-btn" onClick={() => navigate('/home')}>Back</button>
              <h1 className="bk-h1">Book Exchange</h1>
            </div>
            <button className="bk-btn-primary" onClick={() => setShowCreateForm(true)}>
              List a Book
            </button>
          </div>

          {/* Tabs */}
          <div className="bk-tabs">
            <div className={`bk-tab${activeTab === 'browse' ? ' active' : ''}`} onClick={() => setActiveTab('browse')}>
              Browse Listings
            </div>
            <div className={`bk-tab${activeTab === 'confirm' ? ' active' : ''}`} onClick={() => setActiveTab('confirm')}>
              Confirm PIN
            </div>
          </div>

          {/* Browse Tab */}
          {activeTab === 'browse' && (
            <>
              <div className="bk-filter-row">
                <input
                  placeholder="Filter by course code e.g. CS-301"
                  value={filterCode}
                  onChange={(e) => setFilterCode(e.target.value)}
                  list="bk-course-suggestions"
                />
                <datalist id="bk-course-suggestions">
                  {suggestions.map((c) => <option key={c} value={c} />)}
                </datalist>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="">All Types</option>
                  <option value="gift">Gift</option>
                  <option value="borrow">Borrow</option>
                  <option value="paid">Buy</option>
                </select>
                {filterCode && (
                  <button className="bk-clear-btn" onClick={() => setFilterCode('')}>Clear</button>
                )}
              </div>

              {error && <div className="bk-error">{error}</div>}

              {pin && (
                <div className="bk-pin-box">
                  <p className="bk-pin-label">Your PIN,show this to the seller at the drop-off point</p>
                  <p className="bk-pin-code">{pin}</p>
                  <p className="bk-pin-meta">
                    Expires at {new Date(pinExpiry).toLocaleTimeString()}
                    {pinInfo?.due_date && ` · Return by ${new Date(pinInfo.due_date).toLocaleDateString()}`}
                    {pinInfo?.total_price && ` · Total: ${pinInfo.total_price}`}
                  </p>
                  {pinInfo?.dropoff_location && (
                    <div className="bk-dropoff-badge">Drop-off: {pinInfo.dropoff_location}</div>
                  )}
                </div>
              )}

              <div className="bk-controls-row">
                <div className="bk-footer-note">
                  {loading
                    ? 'Loading...'
                    : viewMode === 'shelf'
                      ? <>Showing <b>{pagedBooks.length}</b> of <b>{books.length}</b> listings</>
                      : <>Showing <b>{books.length}</b> result{books.length !== 1 ? 's' : ''}{filterCode ? <> for <b>{filterCode.toUpperCase()}</b></> : ''}</>
                  }
                </div>
                <div className="bk-view-toggle">
                  <button className={viewMode === 'shelf' ? 'active' : ''} onClick={() => setViewMode('shelf')}>🗄 Shelf view</button>
                  <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>☰ List view</button>
                </div>
              </div>

              {!loading && books.length === 0 && (
                <div className="bk-empty">
                  <h3>No listings available</h3>
                  <p>Check back later or list your own book</p>
                  <button className="bk-btn-primary" onClick={() => setShowCreateForm(true)}>List a Book</button>
                </div>
              )}

              {/* Shelf view */}
              {!loading && books.length > 0 && viewMode === 'shelf' && (
                <>
                  <div className="bk-cupboard">
                    <div className="bk-cupboard-top"></div>
                    <div className="bk-cupboard-inner">
                      {pagedShelfRows.map((row, ri) => (
                        <div className="bk-shelf-row" key={ri}>
                          <div className="bk-shelf-books">
                            {row.map((b, bi) => {
                              const colorClass = `bk-b${(ri * 4 + bi) % 4}`;
                              return (
                                <button key={b.id} className={`bk-book ${colorClass}`} type="button">
                                  {b.women_only && <div className="bk-women">Women Only</div>}
                                  <div className="bk-top-tag">{listingTag(b)}</div>
                                  <div>
                                    <h4>{b.title}</h4>
                                    {b.author && <div className="bk-author">by {b.author}</div>}
                                    <div className="bk-course">
                                      {b.course_code ? `${b.course_code} · ` : ''}{b.condition} condition
                                    </div>
                                  </div>
                                  <button className="bk-req-btn" onClick={() => handleRequest(b)}>Request</button>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bk-cupboard-bottom"></div>
                    <div className="bk-cupboard-legs"><div className="bk-leg"></div><div className="bk-leg"></div></div>
                  </div>

                  <div className="bk-cupboard-footer">
                    <div className="bk-footer-note">
                      Shelf <b>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, books.length)}</b> of <b>{books.length}</b>
                    </div>
                    <div className="bk-pager">
                      <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                      <span className="bk-page-label">Page {page} of {totalPages}</span>
                      <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next shelf</button>
                    </div>
                  </div>
                </>
              )}

              {/* List view */}
              {!loading && books.length > 0 && viewMode === 'list' && (
                <div>
                  {books.map((b, i) => (
                    <div key={b.id} className="bk-list-item">
                      <div className="bk-li-left">
                        <div className="bk-spine-chip" style={{ background: SPINE_COLORS[i % 4] }}></div>
                        <div className="bk-li-text">
                          <h4>{b.title}</h4>
                          <div className="bk-meta">
                            {b.author && `by ${b.author} · `}{b.course_code ? `${b.course_code} · ` : ''}{b.condition} condition
                          </div>
                          <div className="bk-li-tags">
                            <span className={`bk-li-tag ${listingTagClass(b)}`}>{listingTag(b)}</span>
                            {b.women_only && <span className="bk-li-tag rose">Women Only</span>}
                          </div>
                        </div>
                      </div>
                      <button className="bk-btn-outline" onClick={() => handleRequest(b)}>Request</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Confirm PIN Tab */}
          {activeTab === 'confirm' && (
            <div className="bk-card">
              <h2>Confirm Book Exchange</h2>
              <p className="bk-sub">
                Once the buyer pays you outside the app, enter their request ID and PIN to confirm the exchange.
              </p>

              {confirmMsg && (
                <div className={`bk-alert ${confirmMsg.includes('success') ? 'success' : 'error'}`}>
                  {confirmMsg}
                </div>
              )}

              {confirmResult && confirmMsg.includes('success') && (
                <div className="bk-contact-reveal">
                  <div className="bk-contact-reveal-title">Exchange confirmed</div>
                  {confirmResult.dropoff_location && (
                    <div className="bk-contact-row">Drop-off: <strong>{confirmResult.dropoff_location}</strong></div>
                  )}
                  {confirmResult.contact_info && (
                    <div className="bk-contact-row"> Contact: <strong>{confirmResult.contact_info}</strong></div>
                  )}
                  {!confirmResult.contact_info && !confirmResult.dropoff_location && (
                    <p style={{ fontSize: '13px', color: 'var(--inks)' }}>
                      Seller did not add contact info. Coordinate at the campus drop-off point.
                    </p>
                  )}
                </div>
              )}

              <label className="bk-field-label">Request ID</label>
              <input
                placeholder="Paste the request ID from buyer"
                value={confirmData.request_id}
                onChange={(e) => setConfirmData({ ...confirmData, request_id: e.target.value })}
              />

              <label className="bk-field-label">PIN</label>
              <input
                className="bk-pin-input-field"
                placeholder="– – – –"
                maxLength={4}
                value={confirmData.pin}
                onChange={(e) => setConfirmData({ ...confirmData, pin: e.target.value })}
              />

              <button className="bk-btn-primary" style={{ width: '100%' }} onClick={handleConfirmPin}>
                Confirm Exchange
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Create Listing Modal */}
      {showCreateForm && (
        <div className="bk-overlay">
          <div className="bk-modal">
            <div className="bk-modal-head">
              <h2>List a Book</h2>
              <button className="bk-close-btn" onClick={() => setShowCreateForm(false)}>Close</button>
            </div>

            <form onSubmit={handleCreateListing}>
              <label>Book Title</label>
              <input
                placeholder="e.g. Introduction to Algorithms"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                required
              />

              <label>Author</label>
              <input
                placeholder="e.g. Thomas Cormen"
                value={createForm.author}
                onChange={(e) => setCreateForm({ ...createForm, author: e.target.value })}
              />

              <label>Course Code (optional)</label>
              <input
                placeholder="e.g. CS-301"
                value={createForm.course_code}
                onChange={(e) => setCreateForm({ ...createForm, course_code: e.target.value })}
                list="create-book-suggestions"
              />
              <datalist id="create-book-suggestions">
                {suggestions.map((c) => <option key={c} value={c} />)}
              </datalist>

              <div className="bk-row2">
                <div>
                  <label>Condition</label>
                  <select
                    value={createForm.condition}
                    onChange={(e) => setCreateForm({ ...createForm, condition: e.target.value })}
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label>Listing Type</label>
                  <select
                    value={createForm.listing_type}
                    onChange={(e) => setCreateForm({ ...createForm, listing_type: e.target.value })}
                  >
                    <option value="gift">Gift:Free</option>
                    <option value="borrow">Borrow:Per day</option>
                    <option value="paid">Buy:Fixed price</option>
                  </select>
                </div>
              </div>

              {createForm.listing_type !== 'gift' && (
                <>
                  <label>Price (PKR){createForm.listing_type === 'borrow' ? ' per day' : ''}</label>
                  <input
                    type="number"
                    placeholder={createForm.listing_type === 'borrow' ? 'e.g. 20' : 'e.g. 200'}
                    value={createForm.price}
                    onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                    min="1"
                    required
                  />
                </>
              )}

              {createForm.listing_type === 'borrow' && (
                <>
                  <label>Max Borrow Duration (days)</label>
                  <input
                    type="number"
                    placeholder="Max 15 days"
                    value={createForm.borrow_days_limit}
                    onChange={(e) => setCreateForm({ ...createForm, borrow_days_limit: e.target.value })}
                    min="1"
                    max="15"
                    required
                  />
                </>
              )}

              <label>Drop-off Location</label>
              <input
                placeholder="e.g. Library entrance, Block C cafeteria"
                value={createForm.dropoff_location}
                onChange={(e) => setCreateForm({ ...createForm, dropoff_location: e.target.value })}
              />
              <div className="bk-hint">Where should the buyer meet you?</div>

              <label>
                Contact Number <span style={{ fontWeight: 400, color: 'var(--inks)' }}>,hidden until a request is confirmed</span>
              </label>
              <input
                placeholder="e.g. 03XX-XXXXXXX"
                value={createForm.contact_info}
                onChange={(e) => setCreateForm({ ...createForm, contact_info: e.target.value })}
              />

              <button
                type="button"
                className={`bk-toggle-row`}
                style={{ background: 'none', border: 'none', padding: 0 }}
                onClick={() => setCreateForm({ ...createForm, women_only: !createForm.women_only })}
              >
                <span className={`bk-toggle${createForm.women_only ? ' on' : ''}`}></span>
                Restrict to female students only
              </button>

              <div className="bk-preview-label">Shelf preview</div>
              <div className="bk-book-preview">
                <div className="bk-tag">{previewTag}</div>
                <div>
                  <h5>{createForm.title || 'Untitled listing'}</h5>
                  {createForm.author && <div className="bk-a">by {createForm.author}</div>}
                  {createForm.dropoff_location && (
                    <div className="bk-a" style={{ marginTop: '3px' }}>📍 {createForm.dropoff_location}</div>
                  )}
                </div>
              </div>

              <button type="submit" className="bk-btn-primary">Create Listing</button>
            </form>
          </div>
        </div>
      )}

      {/* Borrow Days Modal */}
      {requestingBook && (
        <div className="bk-overlay">
          <div className="bk-modal" style={{ width: '400px' }}>
            <div className="bk-modal-head">
              <h2>How many days?</h2>
              <button className="bk-close-btn" onClick={() => setRequestingBook(null)}>Close</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--inks)', margin: '10px 0 4px' }}>
              <strong>{requestingBook.title}</strong> · Rs. {requestingBook.price}/day
            </p>

            <label className="bk-field-label">Borrow duration (1–15 days)</label>
            <input
              type="number"
              min="1"
              max="15"
              placeholder="e.g. 3"
              value={borrowDays}
              onChange={(e) => setBorrowDays(e.target.value)}
            />
            {borrowDays && requestingBook.price && (
              <div className="bk-hint" style={{ marginTop: '-10px', marginBottom: '14px' }}>
                Total: Rs. {(requestingBook.price * borrowDays).toFixed(2)}
              </div>
            )}

            {error && <div className="bk-error">{error}</div>}

            <button className="bk-btn-primary" style={{ width: '100%' }} onClick={handleBorrowRequest}>
              Confirm Request
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Books;