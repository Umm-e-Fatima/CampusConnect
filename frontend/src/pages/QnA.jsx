import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Navbar, PageWrapper, PageContent, PageHeader,
  Button, Card, Badge, Field, Input, Textarea,
  Alert, Modal, EmptyState,
} from '../components/UI';

const QnA = () => {
  const [questions, setQuestions]       = useState([]);
  const [suggestions, setSuggestions]   = useState([]);
  const [filterCode, setFilterCode]     = useState('');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [showAskForm, setShowAskForm]   = useState(false);
  const [newQuestion, setNewQuestion]   = useState({ course_code: '', body: '' });
  const [expandedId, setExpandedId]     = useState(null);
  const [answers, setAnswers]           = useState([]);
  const [newAnswer, setNewAnswer]       = useState('');
  const [submitting, setSubmitting]     = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    logout();
    navigate('/login');
  };

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

  useEffect(() => { fetchQuestions(); }, [filterCode]);

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

  const handleExpand = async (questionId) => {
    if (expandedId === questionId) {
      setExpandedId(null);
      setAnswers([]);
      return;
    }
    try {
      const res = await api.get(`/qna/${questionId}`);
      setAnswers(res.data.answers);
      setExpandedId(questionId);
      setNewAnswer('');
    } catch (err) {
      setError('Failed to fetch answers');
    }
  };

  const handlePostAnswer = async (questionId) => {
    if (!newAnswer.trim()) return;
    try {
      await api.post(`/qna/${questionId}/answers`, { body: newAnswer });
      setNewAnswer('');
      const res = await api.get(`/qna/${questionId}`);
      setAnswers(res.data.answers);
    } catch (err) {
      setError('Failed to post answer');
    }
  };

  const handleUpvote = async (id, target_type) => {
    try {
      await api.post(`/qna/${id}/upvote`, { target_type });
      fetchQuestions();
      if (expandedId) {
        const res = await api.get(`/qna/${expandedId}`);
        setAnswers(res.data.answers);
      }
    } catch (_) {}
  };

  const handleResolve = async (questionId) => {
    try {
      await api.patch(`/qna/${questionId}/resolve`);
      fetchQuestions();
    } catch (err) {
      setError('Failed to mark as resolved');
    }
  };

  return (
    <PageWrapper>
      <Navbar userName={user?.full_name} onLogout={handleLogout} />

      <PageContent>
        <PageHeader
          title="Anonymous Q&A"
          onBack={() => navigate('/home')}
          action={
            <Button
              variant="accent"
              size="md"
              onClick={() => setShowAskForm(true)}
            >
              Ask a Question
            </Button>
          }
        />

        {/* Filter */}
        <div style={styles.filterRow}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Input
              placeholder="Filter by course code e.g. CS-301"
              value={filterCode}
              onChange={e => setFilterCode(e.target.value)}
              list="qna-filter-suggestions"
              style={{ paddingLeft: '38px' }}
            />
            <svg style={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="var(--text-muted)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <datalist id="qna-filter-suggestions">
              {suggestions.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          {filterCode && (
            <Button variant="ghost" size="md" onClick={() => setFilterCode('')}>
              Clear
            </Button>
          )}
        </div>

        {error && <Alert type="error" style={{ marginBottom: '16px' }}>{error}</Alert>}

        {loading && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px 0' }}>
            Loading questions...
          </p>
        )}

        {!loading && questions.length === 0 && (
          <EmptyState
            title="No questions yet"
            description="Be the first to ask a question for this course"
            action={
              <Button variant="primary" onClick={() => setShowAskForm(true)}>
                Ask a Question
              </Button>
            }
          />
        )}

        {/* Question list */}
        <div style={styles.list}>
          {questions.map(q => (
            <Card key={q.id} style={styles.questionCard}>

              {/* Card header */}
              <div style={styles.questionHeader}>
                <div style={styles.badgeRow}>
                  <Badge tone="navy">{q.course_code}</Badge>
                  {q.is_resolved && <Badge tone="green">Resolved</Badge>}
                </div>
                <span style={styles.questionMeta}>
                  {new Date(q.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Question body */}
              <p style={styles.questionBody}>{q.body}</p>

              {/* Actions */}
              <div style={styles.questionFooter}>
                <button
                  style={styles.upvoteBtn}
                  onClick={() => handleUpvote(q.id, 'question')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                  </svg>
                  {q.upvote_count}
                </button>

                <button
                  style={styles.expandBtn}
                  onClick={() => handleExpand(q.id)}
                >
                  {expandedId === q.id ? 'Hide Answers' : 'View Answers'}
                </button>

                {q.author_id === user?.id && !q.is_resolved && (
                  <button
                    style={styles.resolveBtn}
                    onClick={() => handleResolve(q.id)}
                  >
                    Mark Resolved
                  </button>
                )}
              </div>

              {/* Answers section */}
              {expandedId === q.id && (
                <div style={styles.answersSection}>
                  {answers.length === 0 && (
                    <p style={styles.noAnswers}>
                      No answers yet. Be the first to help.
                    </p>
                  )}

                  {answers.map(a => (
                    <div key={a.id} style={styles.answerCard}>
                      {a.is_accepted && (
                        <div style={styles.acceptedBadge}>Accepted Answer</div>
                      )}
                      <p style={styles.answerBody}>{a.body}</p>
                      <button
                        style={styles.upvoteBtnSm}
                        onClick={() => handleUpvote(a.id, 'answer')}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                          strokeLinejoin="round">
                          <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                        {a.upvote_count}
                      </button>
                    </div>
                  ))}

                  {/* Post answer */}
                  <div style={styles.answerFormRow}>
                    <Textarea
                      placeholder="Write an answer anonymously..."
                      value={newAnswer}
                      onChange={e => setNewAnswer(e.target.value)}
                      style={{ minHeight: '72px', flex: 1 }}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handlePostAnswer(q.id)}
                      style={{ alignSelf: 'flex-end' }}
                    >
                      Post Answer
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

      </PageContent>

      {/* Ask Question Modal */}
      {showAskForm && (
        <Modal
          title="Ask a Question"
          onClose={() => setShowAskForm(false)}
        >
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Your question will be posted anonymously — no one will see your name.
          </p>

          <form onSubmit={handlePostQuestion}>
            <Field label="Course Code">
              <Input
                placeholder="e.g. CS-301"
                value={newQuestion.course_code}
                onChange={e => setNewQuestion({ ...newQuestion, course_code: e.target.value })}
                list="qna-ask-suggestions"
                required
              />
              <datalist id="qna-ask-suggestions">
                {suggestions.map(c => <option key={c} value={c} />)}
              </datalist>
            </Field>

            <Field label="Your Question">
              <Textarea
                placeholder="Ask your question clearly so others can help you..."
                value={newQuestion.body}
                onChange={e => setNewQuestion({ ...newQuestion, body: e.target.value })}
                style={{ minHeight: '100px' }}
                required
              />
            </Field>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={submitting}
            >
              {submitting ? 'Posting...' : 'Post Anonymously'}
            </Button>
          </form>
        </Modal>
      )}

    </PageWrapper>
  );
};

const styles = {
  filterRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  questionCard: {
    padding: '18px 20px',
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  badgeRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  questionMeta: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  questionBody: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    lineHeight: '1.6',
    marginBottom: '14px',
  },
  questionFooter: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  upvoteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    height: '30px',
    padding: '0 10px',
    background: 'var(--surface-muted)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  expandBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    height: '30px',
    padding: '0 10px',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--primary)',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  resolveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    height: '30px',
    padding: '0 10px',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  answersSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  noAnswers: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '12px 0',
  },
  answerCard: {
    background: 'var(--surface-muted)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 14px',
  },
  acceptedBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--success)',
    background: 'var(--success-bg)',
    padding: '2px 8px',
    borderRadius: '20px',
    marginBottom: '6px',
  },
  answerBody: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    lineHeight: '1.6',
    marginBottom: '8px',
  },
  upvoteBtnSm: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    height: '26px',
    padding: '0 8px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  answerFormRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    marginTop: '4px',
  },
};

export default QnA;