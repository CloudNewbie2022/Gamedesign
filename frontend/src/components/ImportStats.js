import React, { useState, useContext } from 'react';
import Tesseract from 'tesseract.js';
import Papa from 'papaparse';
import axios from 'axios';
import './ImportStats.css';

const DAYS_REQUIRED = 90;

const INSTRUCTIONS = (
  <div className="import-instructions">
    <h2>How to Import Your Reading Stats</h2>
    <h3>A) Quick Import via CSV</h3>
    <ol>
      <li>Click "Browse…" next to <b>Upload CSV (StoryGraph/other)</b>.</li>
      <li>Select your CSV file exported from StoryGraph (or any program).</li>
      <li>Wait a moment while we load your data.</li>
      <li>Review the preview that appears below—every column (Books read, Pages read, Daily pages) should show up in its own box.</li>
      <li>If a number looks off, click into that box and type the correct value.</li>
      <li>When everything looks good, hit <b>Save Stats</b> at the bottom.</li>
    </ol>
    <h3>B) Quick Import via Screenshot</h3>
    <ol>
      <li>Click "Browse…" next to <b>Upload Screenshot (StoryGraph, Docs, etc.)</b>.</li>
      <li>Choose your image of the wrap-up page.</li>
      <li>We'll run a quick OCR scan and populate the fields for you.</li>
      <li>Scroll down to see all the detected values.</li>
      <li>Click into any field (for example, total books or pages) to fix mistakes or typos.</li>
      <li>Hit <b>Save Stats</b> when you're satisfied.</li>
    </ol>
    <h3>C) Manual Entry (Enter 90 Days to Unlock)</h3>
    <ul>
      <li>Locate the grid labeled <b>"Enter Daily Pages Read (90 days required)"</b>.</li>
      <li>For each day, click the little arrows ⬆️⬇️ or type the pages you read that day.</li>
      <li>As you fill in each box, the Progress counter below will update (e.g. "27 / 90 days").</li>
      <li>Once you've entered all 90 days, the two fields at the bottom—<br/>&nbsp;&nbsp;<b>Books Read:</b><br/>&nbsp;&nbsp;<b>Pages Read:</b><br/>will become editable.</li>
      <li>Click into those two boxes to type your total books and total pages for the period.</li>
      <li>Finally, press <b>Save Stats</b> to lock everything in.</li>
    </ul>
    <h3>Tips & Tricks</h3>
    <ul>
      <li>Only one method needed—you don't have to both upload a CSV and fill in manually.</li>
      <li>Mistakes happen! Everything stays editable until you hit Save Stats.</li>
      <li>Need to change later? Go back to Import Stats, adjust the numbers, and save again.</li>
      <li>Progress bar helps you see how close you are to the 90-day requirement.</li>
    </ul>
    <div style={{marginTop: '1em', fontWeight: 'bold'}}>That's it—now your Habit Stock Game knows exactly how much you've read, and your portfolio can react to every page! 📚💸</div>
  </div>
);

// Import the DarkModeContext from App.js
import { DarkModeContext } from '../App';

const ImportStats = ({ onSave }) => {
  const [dailyPages, setDailyPages] = useState(Array(DAYS_REQUIRED).fill(''));
  const [booksRead, setBooksRead] = useState('');
  const [pagesRead, setPagesRead] = useState('');
  const [progress, setProgress] = useState(0);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);
  const [preview, setPreview] = useState(null);
  const [showSGModal, setShowSGModal] = useState(false);
  const [sgEmail, setSgEmail] = useState('');
  const [sgPassword, setSgPassword] = useState('');
  const [sgLoading, setSgLoading] = useState(false);
  const [sgError, setSgError] = useState('');
  const darkMode = useContext(DarkModeContext);

  // Handle CSV upload
  const handleCsvUpload = (e) => {
    setCsvError('');
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const pagesCol = results.meta.fields.find(f => f.toLowerCase().includes('page'));
        const booksCol = results.meta.fields.find(f => f.toLowerCase().includes('book'));
        if (!pagesCol) {
          setCsvError('CSV must have a column for pages read per day.');
          return;
        }
        const newDaily = results.data.slice(0, DAYS_REQUIRED).map(row => row[pagesCol] || '');
        setDailyPages(prev => {
          const merged = [...prev];
          newDaily.forEach((val, i) => { if (val) merged[i] = val; });
          return merged;
        });
        if (booksCol) setBooksRead(results.data[0][booksCol] || '');
        setPreview({
          booksRead: booksCol ? results.data[0][booksCol] : '',
          pagesRead: results.data.reduce((sum, row) => sum + (parseInt(row[pagesCol]) || 0), 0),
          dailyPages: newDaily
        });
      },
      error: (err) => setCsvError('CSV parse error: ' + err.message)
    });
  };

  // Handle image upload (OCR)
  const handleImageUpload = (e) => {
    setOcrError('');
    const file = e.target.files[0];
    if (!file) return;
    setOcrLoading(true);
    Tesseract.recognize(file, 'eng').then(({ data: { text } }) => {
      const lines = text.split('\n');
      const numbers = lines.flatMap(line => line.match(/\d+/g) || []).map(Number);
      if (numbers.length < DAYS_REQUIRED) {
        setOcrError('Could not find enough daily page numbers in the image.');
      } else {
        setDailyPages(prev => {
          const merged = [...prev];
          numbers.slice(0, DAYS_REQUIRED).forEach((val, i) => { if (val) merged[i] = val; });
          return merged;
        });
        setPreview({
          booksRead: '',
          pagesRead: numbers.slice(0, DAYS_REQUIRED).reduce((a, b) => a + b, 0),
          dailyPages: numbers.slice(0, DAYS_REQUIRED)
        });
      }
      setOcrLoading(false);
    }).catch(err => {
      setOcrError('OCR error: ' + err.message);
      setOcrLoading(false);
    });
  };

  // Handle manual daily page edit
  const handleDailyChange = (i, val) => {
    setDailyPages(prev => {
      const arr = [...prev];
      arr[i] = val;
      return arr;
    });
  };

  // Calculate progress
  React.useEffect(() => {
    const filled = dailyPages.filter(x => x && !isNaN(x)).length;
    setProgress(filled);
  }, [dailyPages]);

  // StoryGraph import handler
  const handleSGImport = async (e) => {
    e.preventDefault();
    setSgError('');
    setSgLoading(true);
    try {
      const res = await axios.post('http://localhost:4000/import-storygraph', {
        email: sgEmail,
        password: sgPassword
      });
      // Fill fields with imported data
      setBooksRead(res.data.booksRead || '');
      setPagesRead(res.data.pagesRead || '');
      setDailyPages(res.data.dailyPages || Array(DAYS_REQUIRED).fill(''));
      setPreview(res.data);
      setShowSGModal(false);
    } catch (err) {
      setSgError(err.response?.data?.error || 'Failed to import from StoryGraph.');
    } finally {
      setSgLoading(false);
    }
  };

  // Save handler
  const handleSave = () => {
    onSave({
      booksRead,
      pagesRead,
      dailyPages: dailyPages.map(x => Number(x) || 0)
    });
  };

  const manualLocked = progress < DAYS_REQUIRED;

  // Calendar grid for daily entry
  const calendarGrid = (
    <div className="calendar-grid">
      {[...Array(3)].map((_, row) => (
        <div className="calendar-row" key={row}>
          {[...Array(30)].map((_, col) => {
            const idx = row * 30 + col;
            return (
              <input
                key={idx}
                type="number"
                className="calendar-cell"
                value={dailyPages[idx]}
                onChange={e => handleDailyChange(idx, e.target.value)}
                placeholder={idx + 1}
                min={0}
              />
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div className={`import-stats-fluffy ${darkMode ? 'dark' : ''}`}>
      <div className="import-header">
        <h1 className="import-title">Import Reading Statistics</h1>
        <div 
          className="import-help" 
          onClick={() => setShowInstructions(!showInstructions)}
          title="Show/Hide Instructions"
        >
          ?
        </div>
      </div>

      {showInstructions && (
        <div className="import-modal-bg" onClick={() => setShowInstructions(false)}>
          <div className={`import-modal ${darkMode ? 'dark' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="import-modal-close" onClick={() => setShowInstructions(false)}>×</div>
            <div className="import-instructions-scrollable">
              {INSTRUCTIONS}
            </div>
          </div>
        </div>
      )}

      <div className="import-section">
        <div className="cloud-box">
          <h3>📊 CSV Import (StoryGraph, Goodreads, etc.)</h3>
          <p>Upload a CSV file with your reading data</p>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            style={{ marginTop: '0.5em' }}
          />
          {csvError && <div className="error">{csvError}</div>}
        </div>

        <div className="cloud-box">
          <h3>📸 Screenshot OCR Import</h3>
          <p>Upload a screenshot of your reading stats for automatic text recognition</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ marginTop: '0.5em' }}
          />
          {ocrLoading && <div>Processing image...</div>}
          {ocrError && <div className="error">{ocrError}</div>}
        </div>

        {preview && (
          <div className="preview-box">
            <h3>📋 Import Preview</h3>
            <div className="review-fields">
              <label>Books Read:</label>
              <input
                type="number"
                value={preview.booksRead}
                onChange={e => setBooksRead(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="review-fields">
              <label>Pages Read:</label>
              <input
                type="number"
                value={preview.pagesRead}
                onChange={e => setPagesRead(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        )}

        <div className="cloud-box">
          <h3>📅 Manual Entry (90 Days Required)</h3>
          <p>Enter your daily pages read for the last 90 days</p>
          
          <div className="calendar-cloud">
            {calendarGrid}
          </div>

          <div className="progress-section">
            <div className="progress-label">
              Progress: {progress} / {DAYS_REQUIRED} days completed
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${(progress / DAYS_REQUIRED) * 100}%`,
                  background: progress === DAYS_REQUIRED 
                    ? 'linear-gradient(90deg, #4CAF50 0%, #45a049 100%)' 
                    : 'linear-gradient(90deg, #61dafb 0%, #4fa8d1 100%)'
                }}
              />
            </div>
            {progress === DAYS_REQUIRED && (
              <div style={{ color: '#4CAF50', fontWeight: 'bold', marginTop: '0.5em' }}>
                ✅ All 90 days completed! You can now enter totals below.
              </div>
            )}
          </div>

          <div className="review-fields" style={{ marginTop: '1em' }}>
            <label>Books Read:</label>
            <input
              type="number"
              value={booksRead}
              onChange={e => setBooksRead(e.target.value)}
              placeholder="0"
              disabled={manualLocked}
            />
          </div>
          <div className="review-fields">
            <label>Pages Read:</label>
            <input
              type="number"
              value={pagesRead}
              onChange={e => setPagesRead(e.target.value)}
              placeholder="0"
              disabled={manualLocked}
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={!booksRead || !pagesRead || progress < DAYS_REQUIRED}
          style={{ 
            width: '100%', 
            marginTop: '2em',
            padding: '1em',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}
        >
          Save Stats & Unlock Game
        </button>
      </div>
    </div>
  );
};

export default ImportStats; 