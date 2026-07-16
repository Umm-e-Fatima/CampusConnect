import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const QnA = () => {
  const [questions, setQuestions]     = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [filterCode, setFilterCode]   = useState('');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ course_code: '', body: '' });
  const [viewingQuestion, setViewingQuestion] = useState(null);
  const [answers, setAnswers]         = useState([]);
  const [newAnswer, setNewAnswer]     = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingAnswer, setEditingAnswer]     = useState(null);
  const [editBody, setEditBody]       = useState('');
  const [isOnline, setIsOnline]       = useState(navigator.onLine);

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
    api.get('/qna/distinct-courses')
      .then(res => setSuggestions(res.data))
      .catch(() => {});
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterCode.trim()) params.course_code = filterCode.trim().toUpperCase();
      const res = await api.get('/qna', { params });
      setQuestions(res.data);
    } catch (err) {
      setError('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, [filterCode]); // eslint-disable-line

  const handlePostQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.course_code.trim() || !newQuestion.body.trim()) {
      setError('Course code and question are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/qna', {
        course_code: newQuestion.course_code.trim().toUpperCase(),
        body: newQuestion.body,
      });
      setNewQuestion({ course_code: '', body: '' });
      setShowAskForm(false);
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post question');
    } finally {
      setSubmitting(false);
    }
  };

  const openAnswers = async (question) => {
    try {
      const res = await api.get(`/qna/${question.id}`);
      setAnswers(res.data.answers);
      setViewingQuestion(question);
      setNewAnswer('');
    } catch (err) {
      setError('Failed to fetch answers');
    }
  };

  const closeAnswers = () => {
    setViewingQuestion(null);
    setAnswers([]);
    setEditingAnswer(null);
  };

  const refreshAnswers = async () => {
    if (!viewingQuestion) return;
    const res = await api.get(`/qna/${viewingQuestion.id}`);
    setAnswers(res.data.answers);
  };

  const handlePostAnswer = async () => {
    if (!newAnswer.trim() || !viewingQuestion) return;
    try {
      await api.post(`/qna/${viewingQuestion.id}/answers`, { body: newAnswer });
      setNewAnswer('');
      refreshAnswers();
    } catch (err) {
      setError('Failed to post answer');
    }
  };

  const handleUpvote = async (id, target_type) => {
    try {
      await api.post(`/qna/${id}/upvote`, { target_type });
      fetchQuestions();
      if (viewingQuestion) refreshAnswers();
    } catch (_) {}
  };

  const handleResolve = async (questionId) => {
    try {
      await api.patch(`/qna/${questionId}/resolve`);
      fetchQuestions();
      if (viewingQuestion?.id === questionId) {
        setViewingQuestion({ ...viewingQuestion, is_resolved: true });
      }
    } catch (err) {
      setError('Failed to mark as resolved');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await api.delete(`/qna/${questionId}`);
      fetchQuestions();
      if (viewingQuestion?.id === questionId) closeAnswers();
    } catch (err) {
      setError('Failed to delete question');
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    try {
      await api.delete(`/qna/answers/${answerId}`);
      refreshAnswers();
    } catch (err) {
      setError('Failed to delete answer');
    }
  };

  const handleEditQuestion = async (questionId) => {
    try {
      await api.patch(`/qna/${questionId}`, { body: editBody });
      setEditingQuestion(null);
      setEditBody('');
      fetchQuestions();
      if (viewingQuestion?.id === questionId) {
        setViewingQuestion({ ...viewingQuestion, body: editBody });
      }
    } catch (err) {
      setError('Failed to update question');
    }
  };

  const handleEditAnswer = async (answerId) => {
    try {
      await api.patch(`/qna/answers/${answerId}`, { body: editBody });
      setEditingAnswer(null);
      setEditBody('');
      refreshAnswers();
    } catch (err) {
      setError('Failed to update answer');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Nunito:wght@400;600;700&display=swap');
        :root {
          --cream: #FBF3E5; --card: #FFFDF8; --line: #E9DCC3;
          --teal: #1D6F68; --teal-d: #134F4A; --orange: #E2903C; --orange-d: #C97324;
          --ink: #3A3630; --inks: #8A8172; --danger: #C15C4A; --ok: #4C8A63; --rose-d: #96475D;
        }
        * { box-sizing: border-box; }
        .qa-page { margin: 0; background: var(--cream); color: var(--ink); font-family: 'Nunito', sans-serif; min-height: 100vh; }
        .qa-wrap { max-width: 1040px; margin: 0 auto; padding: 0 32px 64px; }
        .qa-nav { display: flex; align-items: center; justify-content: space-between; padding: 22px 0; margin-bottom: 26px; }
        .qa-brand { display: flex; align-items: center; gap: 10px; }
        .qa-brand-mark { width: 36px; height: 36px; border-radius: 11px; background: var(--teal); color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14px; }
        .qa-brand-name { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 17px; color: var(--teal-d); }
        .qa-nav-right { display: flex; align-items: center; gap: 16px; }
        .qa-status { display: flex; align-items: center; gap: 6px; font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 600; color: var(--teal-d); background: #E7F0EA; padding: 6px 12px; border-radius: 20px; }
        .qa-status.offline { color: var(--rose-d); background: #F5E6EA; }
        .qa-status-dot { width: 6px; height: 6px; background: var(--teal); border-radius: 50%; }
        .qa-status.offline .qa-status-dot { background: var(--danger); }
        .qa-user-name { font-size: 13px; color: var(--inks); }
        .qa-logout-btn { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 600; background: none; border: 1px solid var(--line); color: var(--ink); padding: 8px 16px; border-radius: 999px; cursor: pointer; transition: background 0.15s; }
        .qa-logout-btn:hover { background: var(--card); }

        .qa-page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
        .qa-page-head-left { display: flex; align-items: center; gap: 14px; }
        .qa-back-btn { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 600; color: var(--inks); background: none; border: 1px solid var(--line); padding: 8px 14px; border-radius: 999px; cursor: pointer; transition: background 0.15s; }
        .qa-back-btn:hover { background: var(--card); }
        .qa-h1 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 22px; color: var(--teal-d); margin: 0; }
        .qa-btn-primary { background: var(--orange); color: #fff; font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13px; padding: 11px 20px; border-radius: 999px; border: none; cursor: pointer; box-shadow: 0 6px 14px rgba(226,144,60,.3); transition: background 0.15s; }
        .qa-btn-primary:hover { background: var(--orange-d); }
        .qa-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

        .qa-filter-row { margin-bottom: 20px; display: flex; gap: 10px; }
        .qa-filter-row input { width: 100%; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 11px 16px; color: var(--ink); font-size: 13px; font-family: 'Nunito', sans-serif; }
        .qa-filter-row input:focus { outline: none; border-color: var(--teal); }
        .qa-clear-btn { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 600; color: var(--inks); background: none; border: 1px solid var(--line); padding: 11px 16px; border-radius: 14px; cursor: pointer; flex-shrink: 0; }

        .qa-error { background: #F5E6EA; color: var(--rose-d); border: 1px solid rgba(150,71,93,0.2); border-radius: 10px; padding: 10px 14px; font-size: 12.5px; margin-bottom: 16px; }

        .qa-empty { text-align: center; padding: 48px 24px; color: var(--inks); }
        .qa-empty h3 { font-family: 'Poppins', sans-serif; color: var(--teal-d); font-size: 15px; margin-bottom: 6px; }
        .qa-empty p { font-size: 13px; margin-bottom: 16px; }

        .qa-q-item { background: var(--card); border: 1px solid var(--line); border-radius: 22px 8px 22px 8px; padding: 18px 22px; margin-bottom: 12px; position: relative; }
        .qa-pin { position: absolute; top: -7px; left: 22px; width: 12px; height: 12px; border-radius: 50%; background: var(--orange); box-shadow: 0 2px 4px rgba(0,0,0,.2); }
        .qa-q-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 6px; }
        .qa-tags { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .qa-tag { font-family: 'Poppins', sans-serif; font-size: 10.5px; font-weight: 600; background: #F1E7D4; color: var(--inks); padding: 4px 10px; border-radius: 999px; }
        .qa-tag.resolved { color: var(--ok); background: #E1EFE6; }
        .qa-q-date { font-size: 11.5px; color: var(--inks); }
        .qa-q-item h4 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 15.5px; margin: 0 0 14px; color: var(--ink); line-height: 1.4; }
        .qa-q-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .qa-chip { font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 600; background: none; border: 1px solid var(--line); color: var(--inks); padding: 8px 14px; border-radius: 999px; cursor: pointer; }
        .qa-chip.primary { color: #fff; background: var(--teal); border-color: var(--teal); }
        .qa-chip.primary:hover { background: var(--teal-d); }
        .qa-chip.danger { color: var(--danger); border-color: #EAC7BC; }

        .qa-edit-box textarea { width: 100%; background: var(--cream); border: 1px solid var(--line); border-radius: 14px; padding: 11px 16px; color: var(--ink); font-size: 13px; font-family: 'Nunito', sans-serif; min-height: 80px; resize: none; margin-bottom: 10px; }
        .qa-edit-actions { display: flex; gap: 8px; margin-bottom: 6px; }

        /* Answers view */
        .qa-q-card { background: var(--card); border: 1px solid var(--line); border-radius: 22px 8px 22px 8px; padding: 20px 22px; margin-bottom: 22px; }
        .qa-q-card h2 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 17px; margin: 0; color: var(--ink); line-height: 1.4; }
        .qa-section-title { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14.5px; color: var(--teal-d); margin: 0 0 14px; }
        .qa-answer { background: var(--card); border: 1px solid var(--line); border-radius: 18px 6px 18px 6px; padding: 16px 20px; margin-bottom: 12px; }
        .qa-answer p { font-size: 13.5px; line-height: 1.6; margin: 0 0 12px; color: var(--ink); }
        .qa-answer-meta { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .qa-answer-date { font-size: 11.5px; color: var(--inks); }
        .qa-answer-actions { display: flex; gap: 8px; align-items: center; }
        .qa-accepted-badge { display: inline-block; font-size: 11px; font-weight: 700; color: var(--ok); background: #E1EFE6; padding: 3px 10px; border-radius: 999px; margin-bottom: 8px; font-family: 'Poppins', sans-serif; }
        .qa-no-answers { font-size: 13px; color: var(--inks); text-align: center; padding: 20px 0; }

        .qa-add-answer { background: var(--card); border: 1px dashed var(--line); border-radius: 18px; padding: 18px 20px; margin-top: 20px; }
        .qa-add-answer textarea { width: 100%; background: var(--cream); border: 1px solid var(--line); border-radius: 14px; padding: 11px 16px; color: var(--ink); font-size: 13px; font-family: 'Nunito', sans-serif; min-height: 70px; resize: none; margin-bottom: 12px; }

        /* Modal */
        .qa-overlay { position: fixed; inset: 0; background: rgba(58,54,48,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; font-family: 'Nunito', sans-serif; }
        .qa-modal { width: 440px; max-width: 100%; background: var(--card); border: 1px solid var(--line); border-radius: 32px 12px 32px 12px; padding: 30px; box-shadow: 0 24px 50px rgba(40,25,10,.3); }
        .qa-modal-head { display: flex; justify-content: space-between; align-items: center; }
        .qa-modal-head h2 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 19px; color: var(--teal-d); margin: 0; }
        .qa-close-btn { background: none; border: none; color: var(--inks); font-size: 13px; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600; }
        .qa-modal-note { font-size: 12.5px; color: var(--inks); margin: 10px 0 6px; line-height: 1.55; background: #FBEAD5; padding: 10px 14px; border-radius: 12px; }
        .qa-modal label { display: block; font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 600; color: var(--ink); margin: 16px 0 7px; }
        .qa-modal input, .qa-modal textarea { width: 100%; background: var(--cream); border: 1px solid var(--line); border-radius: 14px; padding: 11px 16px; color: var(--ink); font-size: 13px; font-family: 'Nunito', sans-serif; }
        .qa-modal input:focus, .qa-modal textarea:focus { outline: none; border-color: var(--teal); }
        .qa-modal textarea { min-height: 100px; resize: none; }
        .qa-modal .qa-btn-primary { width: 100%; margin-top: 22px; padding: 14px; }
      `}</style>

      <div className="qa-page">
        <div className="qa-wrap">

          {/* Navbar */}
          <nav className="qa-nav">
            <div className="qa-brand">
              <div className="qa-brand-mark">CC</div>
              <div className="qa-brand-name">CampusConnect</div>
            </div>
            <div className="qa-nav-right">
              <div className={`qa-status${isOnline ? '' : ' offline'}`}>
                <span className="qa-status-dot"></span>
                {isOnline ? 'offline ready' : 'offline mode'}
              </div>
              <div className="qa-user-name">{user?.full_name}</div>
              <button className="qa-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </nav>

          {error && <div className="qa-error">{error}</div>}

          {/* ── Answers view ── */}
          {viewingQuestion ? (
            <>
              <div className="qa-page-head-left" style={{ marginBottom: '20px' }}>
                <button className="qa-back-btn" onClick={closeAnswers}>Back to Q&A</button>
              </div>

              <div className="qa-q-card">
                <div className="qa-tags" style={{ marginBottom: '10px' }}>
                  <span className="qa-tag">{viewingQuestion.course_code}</span>
                  {viewingQuestion.is_resolved && <span className="qa-tag resolved">Resolved</span>}
                </div>
                <h2>{viewingQuestion.body}</h2>
              </div>

              <div className="qa-section-title">Answers ({answers.length})</div>

              {answers.length === 0 && (
                <p className="qa-no-answers">No answers yet. Be the first to help.</p>
              )}

              {answers.map((a) => (
                <div key={a.id} className="qa-answer">
                  {a.is_accepted && <div className="qa-accepted-badge">Accepted Answer</div>}

                  {editingAnswer === a.id ? (
                    <div className="qa-edit-box">
                      <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                      <div className="qa-edit-actions">
                        <button className="qa-chip primary" onClick={() => handleEditAnswer(a.id)}>Save</button>
                        <button className="qa-chip" onClick={() => setEditingAnswer(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p>{a.body}</p>
                      <div className="qa-answer-meta">
                        <span className="qa-answer-date">
                          posted anonymously · {new Date(a.created_at).toLocaleDateString()}
                        </span>
                        <div className="qa-answer-actions">
                          <button className="qa-chip" onClick={() => handleUpvote(a.id, 'answer')}>↑ {a.upvote_count}</button>
                          {a.author_id === user?.id && (
                            <>
                              <button className="qa-chip" onClick={() => { setEditingAnswer(a.id); setEditBody(a.body); }}>Edit</button>
                              <button className="qa-chip danger" onClick={() => handleDeleteAnswer(a.id)}>Delete</button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              <div className="qa-add-answer">
                <textarea
                  placeholder="Share what worked for you..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                />
                <button className="qa-btn-primary" onClick={handlePostAnswer}>Post Answer Anonymously</button>
              </div>
            </>
          ) : (
            <>
              {/* ── List view ── */}
              <div className="qa-page-head">
                <div className="qa-page-head-left">
                  <button className="qa-back-btn" onClick={() => navigate('/home')}>Back</button>
                  <h1 className="qa-h1">Anonymous Q&amp;A</h1>
                </div>
                <button className="qa-btn-primary" onClick={() => setShowAskForm(true)}>Ask a Question</button>
              </div>

              <div className="qa-filter-row">
                <input
                  placeholder="Filter by course code e.g. CS-301"
                  value={filterCode}
                  onChange={(e) => setFilterCode(e.target.value)}
                  list="qa-filter-suggestions"
                />
                <datalist id="qa-filter-suggestions">
                  {suggestions.map((c) => <option key={c} value={c} />)}
                </datalist>
                {filterCode && (
                  <button className="qa-clear-btn" onClick={() => setFilterCode('')}>Clear</button>
                )}
              </div>

              {loading && (
                <p style={{ color: 'var(--inks)', textAlign: 'center', padding: '48px 0' }}>Loading questions...</p>
              )}

              {!loading && questions.length === 0 && (
                <div className="qa-empty">
                  <h3>No questions yet</h3>
                  <p>Be the first to ask a question for this course</p>
                  <button className="qa-btn-primary" onClick={() => setShowAskForm(true)}>Ask a Question</button>
                </div>
              )}

              {questions.map((q) => (
                <div key={q.id} className="qa-q-item">
                  <div className="qa-pin"></div>
                  <div className="qa-q-top">
                    <div className="qa-tags">
                      <span className="qa-tag">{q.course_code}</span>
                      {q.is_resolved && <span className="qa-tag resolved">Resolved</span>}
                    </div>
                    <span className="qa-q-date">{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>

                  {editingQuestion === q.id ? (
                    <div className="qa-edit-box">
                      <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                      <div className="qa-edit-actions">
                        <button className="qa-chip primary" onClick={() => handleEditQuestion(q.id)}>Save</button>
                        <button className="qa-chip" onClick={() => setEditingQuestion(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <h4>{q.body}</h4>
                  )}

                  <div className="qa-q-actions">
                    <button className="qa-chip" onClick={() => handleUpvote(q.id, 'question')}>↑ {q.upvote_count}</button>
                    <button className="qa-chip primary" onClick={() => openAnswers(q)}>View Answers</button>
                    {q.author_id === user?.id && !q.is_resolved && (
                      <button className="qa-chip" onClick={() => handleResolve(q.id)}>Mark Resolved</button>
                    )}
                    {q.author_id === user?.id && (
                      <>
                        <button className="qa-chip" onClick={() => { setEditingQuestion(q.id); setEditBody(q.body); }}>Edit</button>
                        <button className="qa-chip danger" onClick={() => handleDeleteQuestion(q.id)}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

        </div>
      </div>

      {/* Ask Question Modal */}
      {showAskForm && (
        <div className="qa-overlay">
          <div className="qa-modal">
            <div className="qa-modal-head">
              <h2>Ask a Question</h2>
              <button className="qa-close-btn" onClick={() => setShowAskForm(false)}>Close</button>
            </div>
            <p className="qa-modal-note">Your question will be posted anonymously,no one will see your name.</p>

            <form onSubmit={handlePostQuestion}>
              <label>Course Code</label>
              <input
                placeholder="e.g. CS-301"
                value={newQuestion.course_code}
                onChange={(e) => setNewQuestion({ ...newQuestion, course_code: e.target.value })}
                list="qa-ask-suggestions"
                required
              />
              <datalist id="qa-ask-suggestions">
                {suggestions.map((c) => <option key={c} value={c} />)}
              </datalist>

              <label>Your Question</label>
              <textarea
                placeholder="Ask your question clearly so others can help you..."
                value={newQuestion.body}
                onChange={(e) => setNewQuestion({ ...newQuestion, body: e.target.value })}
                required
              />

              <button type="submit" className="qa-btn-primary" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Anonymously'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default QnA;