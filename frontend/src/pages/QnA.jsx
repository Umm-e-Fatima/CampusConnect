import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const QnA = () => {
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ course_id: '', body: '' });

  const [expandedId, setExpandedId] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState('');

  const navigate = useNavigate();

  // Fetch courses for dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(res.data);
      } catch (err) {
        console.error('Failed to fetch courses');
      }
    };
    fetchCourses();
  }, []);

  // Fetch questions
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCourse) params.course_id = selectedCourse;
      const res = await api.get('/qna', { params });
      setQuestions(res.data);
    } catch (err) {
      setError('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line
  }, [selectedCourse]);

  const handlePostQuestion = async (e) => {
    e.preventDefault();
    try {
      await api.post('/qna', newQuestion);
      setNewQuestion({ course_id: '', body: '' });
      setShowForm(false);
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post question');
    }
  };

  const handleExpand = async (questionId) => {
    if (expandedId === questionId) {
      setExpandedId(null);
      return;
    }
    try {
      const res = await api.get(`/qna/${questionId}`);
      setAnswers(res.data.answers);
      setExpandedId(questionId);
    } catch (err) {
      setError('Failed to fetch answers');
    }
  };

  const handlePostAnswer = async (questionId) => {
    if (!newAnswer.trim()) return;
    try {
      await api.post(`/qna/${questionId}/answers`, { body: newAnswer });
      setNewAnswer('');
      handleExpand(questionId); // refresh
      handleExpand(questionId);
    } catch (err) {
      setError('Failed to post answer');
    }
  };

  const handleUpvote = async (id, target_type) => {
    try {
      await api.post(`/qna/${id}/upvote`, { target_type });
      fetchQuestions();
      if (expandedId) handleExpand(expandedId);
    } catch (err) {
      // already upvoted — ignore silently
    }
  };

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/home')}>
          Back
        </button>
        <h1 style={styles.title}>Anonymous Q&A</h1>
        <button style={styles.askBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Ask a Question'}
        </button>
      </div>

      {/* Ask Question Form */}
      {showForm && (
        <form style={styles.form} onSubmit={handlePostQuestion}>
          <select
            style={styles.select}
            value={newQuestion.course_id}
            onChange={(e) => setNewQuestion({ ...newQuestion, course_id: e.target.value })}
            required
          >
            <option value="">Select a course</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.course_code} — {c.course_name}
              </option>
            ))}
          </select>
          <textarea
            style={styles.textarea}
            placeholder="Type your question here..."
            value={newQuestion.body}
            onChange={(e) => setNewQuestion({ ...newQuestion, body: e.target.value })}
            required
          />
          <button type="submit" style={styles.submitBtn}>Post Anonymously</button>
        </form>
      )}

      {/* Filter */}
      <div style={styles.filters}>
        <select
          style={styles.select}
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">All Courses</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>
              {c.course_code} — {c.course_name}
            </option>
          ))}
        </select>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {loading && <p style={styles.message}>Loading questions...</p>}

      {!loading && questions.length === 0 && (
        <div style={styles.empty}>
          <h3 style={styles.emptyTitle}>No questions yet</h3>
          <p style={styles.emptyText}>Be the first to ask a question for this course</p>
        </div>
      )}

      {/* Question List */}
      <div style={styles.list}>
        {questions.map(q => (
          <div key={q.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.courseTag}>{q.course_code}</span>
              {q.is_resolved && <span style={styles.resolvedTag}>Resolved</span>}
            </div>

            <p style={styles.questionBody}>{q.body}</p>

            <div style={styles.cardFooter}>
              <button
                style={styles.upvoteBtn}
                onClick={() => handleUpvote(q.id, 'question')}
              >
                Upvote ({q.upvote_count})
              </button>
              <button
                style={styles.expandBtn}
                onClick={() => handleExpand(q.id)}
              >
                {expandedId === q.id ? 'Hide Answers' : 'View Answers'}
              </button>
            </div>

            {/* Expanded Answers */}
            {expandedId === q.id && (
              <div style={styles.answersBox}>
                {answers.length === 0 && (
                  <p style={styles.noAnswers}>No answers yet. Be the first to help.</p>
                )}
                {answers.map(a => (
                  <div key={a.id} style={styles.answerCard}>
                    <p style={styles.answerBody}>{a.body}</p>
                    <button
                      style={styles.upvoteBtnSmall}
                      onClick={() => handleUpvote(a.id, 'answer')}
                    >
                      Upvote ({a.upvote_count})
                    </button>
                  </div>
                ))}

                <div style={styles.answerForm}>
                  <textarea
                    style={styles.answerTextarea}
                    placeholder="Write an answer..."
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                  />
                  <button
                    style={styles.answerSubmitBtn}
                    onClick={() => handlePostAnswer(q.id)}
                  >
                    Post Answer
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  backBtn: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#555',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2d6a4f',
    flex: 1,
  },
  askBtn: {
    padding: '10px 20px',
    backgroundColor: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  form: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  textarea: {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minHeight: '80px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  submitBtn: {
    padding: '10px',
    backgroundColor: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  filters: {
    marginBottom: '24px',
  },
  error: {
    backgroundColor: '#ffe5e5',
    color: '#c0392b',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  message: {
    color: '#888',
    textAlign: 'center',
    padding: '40px',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#555',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#aaa',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '20px 24px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },
  cardHeader: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  courseTag: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#e8f5e9',
    color: '#2d6a4f',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  resolvedTag: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  questionBody: {
    fontSize: '15px',
    color: '#333',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  cardFooter: {
    display: 'flex',
    gap: '12px',
  },
  upvoteBtn: {
    padding: '6px 14px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#555',
    cursor: 'pointer',
  },
  expandBtn: {
    padding: '6px 14px',
    backgroundColor: '#fff',
    border: '1px solid #2d6a4f',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#2d6a4f',
    cursor: 'pointer',
  },
  answersBox: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #eee',
  },
  noAnswers: {
    fontSize: '13px',
    color: '#aaa',
    marginBottom: '12px',
  },
  answerCard: {
    backgroundColor: '#f9f9f9',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  answerBody: {
    fontSize: '14px',
    color: '#444',
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  upvoteBtnSmall: {
    padding: '4px 10px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#888',
    cursor: 'pointer',
  },
  answerForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
  },
  answerTextarea: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '13px',
    minHeight: '60px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  answerSubmitBtn: {
    padding: '8px',
    backgroundColor: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    paddingLeft: '20px',
    paddingRight: '20px',
  },
};

export default QnA;